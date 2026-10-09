import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { authenticateToken, createAuditLog } from '../auth.js';
import { executeTestEvaluation } from '../engine.js';

const router = Router();

// List assessments
router.get('/', authenticateToken, (req: Request, res: Response) => {
  try {
    const user = req.user!;
    let query = `
      SELECT a.*, 
        (SELECT COUNT(*) FROM assessment_results WHERE assessment_id = a.id) as total_tests,
        (SELECT COUNT(*) FROM assessment_results WHERE assessment_id = a.id AND result_status = 'passed') as passed_tests,
        (SELECT COUNT(*) FROM assessment_results WHERE assessment_id = a.id AND result_status = 'failed') as failed_tests,
        (SELECT COUNT(*) FROM findings WHERE assessment_id = a.id) as findings_count,
        (SELECT COUNT(*) FROM findings WHERE assessment_id = a.id AND risk_level IN ('Critical', 'High')) as high_risk_count,
        u.name as creator_name
      FROM assessments a
      LEFT JOIN users u ON a.user_id = u.id
    `;
    let params: any[] = [];

    if (user.role !== 'admin') {
      query += ` WHERE a.user_id = ?`;
      params.push(user.id);
    }

    query += ` ORDER BY a.created_at DESC`;
    const rows = db.prepare(query).all(...params);

    return res.json({ assessments: rows });
  } catch (error) {
    console.error('List assessments error:', error);
    return res.status(500).json({ error: 'Failed to retrieve assessments.' });
  }
});

// Create new assessment
router.post('/', authenticateToken, (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const { title, description, target_mode, test_case_ids } = req.body;

    if (!title || String(title).trim().length === 0) {
      return res.status(400).json({ error: 'Assessment title is required.' });
    }

    const validModes = ['mock-vulnerable', 'mock-hardened', 'gemini'];
    const mode = validModes.includes(target_mode) ? target_mode : 'mock-vulnerable';

    const id = 'asm_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO assessments (id, user_id, title, description, target_mode, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'draft', ?)
    `).run(id, user.id, String(title).trim(), description ? String(description).trim() : '', mode, now);

    // If specific test_case_ids were provided, link or prepare them
    let selectedCases: any[] = [];
    if (Array.isArray(test_case_ids) && test_case_ids.length > 0) {
      const placeholders = test_case_ids.map(() => '?').join(',');
      selectedCases = db.prepare(`SELECT * FROM test_cases WHERE id IN (${placeholders}) AND is_active = 1`).all(...test_case_ids);
    } else {
      // Default to all active test cases
      selectedCases = db.prepare(`SELECT * FROM test_cases WHERE is_active = 1`).all();
    }

    createAuditLog(user.id, 'ASSESSMENT_CREATED', 'assessment', id, `Created assessment: ${title} with ${selectedCases.length} tests`, ip);

    return res.status(201).json({
      message: 'Assessment created successfully.',
      assessment: {
        id,
        user_id: user.id,
        title: String(title).trim(),
        description: description || '',
        target_mode: mode,
        status: 'draft',
        test_cases_count: selectedCases.length,
        created_at: now
      }
    });
  } catch (error) {
    console.error('Create assessment error:', error);
    return res.status(500).json({ error: 'Failed to create assessment.' });
  }
});

// Get assessment details
router.get('/:id', authenticateToken, (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const assessment = db.prepare(`
      SELECT a.*, u.name as creator_name, u.email as creator_email
      FROM assessments a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.id = ?
    `).get(id) as any;

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found.' });
    }

    // Authorization: User can only access their own assessments unless admin
    if (user.role !== 'admin' && assessment.user_id !== user.id) {
      return res.status(403).json({ error: 'Access denied. You do not have permission to view this assessment.' });
    }

    const results = db.prepare(`
      SELECT ar.*, tc.title as test_title, tc.category, tc.difficulty, tc.learning_objective
      FROM assessment_results ar
      JOIN test_cases tc ON ar.test_case_id = tc.id
      WHERE ar.assessment_id = ?
      ORDER BY ar.created_at ASC
    `).all(id);

    const findings = db.prepare(`
      SELECT * FROM findings WHERE assessment_id = ? ORDER BY 
        CASE risk_level 
          WHEN 'Critical' THEN 1 
          WHEN 'High' THEN 2 
          WHEN 'Medium' THEN 3 
          WHEN 'Low' THEN 4 
          ELSE 5 
        END ASC, created_at DESC
    `).all(id);

    return res.json({
      assessment,
      results,
      findings
    });
  } catch (error) {
    console.error('Get assessment error:', error);
    return res.status(500).json({ error: 'Failed to retrieve assessment details.' });
  }
});

// Run assessment execution
router.post('/:id/run', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const { id } = req.params;
    const { test_case_ids } = req.body;

    const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(id) as any;
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found.' });
    }

    if (user.role !== 'admin' && assessment.user_id !== user.id) {
      return res.status(403).json({ error: 'Access denied. You do not own this assessment.' });
    }

    // Clean existing results for a fresh run
    db.prepare('DELETE FROM findings WHERE assessment_id = ?').run(id);
    db.prepare('DELETE FROM assessment_results WHERE assessment_id = ?').run(id);

    // Update assessment status to in_progress
    db.prepare(`UPDATE assessments SET status = 'in_progress' WHERE id = ?`).run(id);

    // Select test cases to run
    let testCasesToRun: any[] = [];
    if (Array.isArray(test_case_ids) && test_case_ids.length > 0) {
      const placeholders = test_case_ids.map(() => '?').join(',');
      testCasesToRun = db.prepare(`SELECT * FROM test_cases WHERE id IN (${placeholders}) AND is_active = 1`).all(...test_case_ids);
    } else {
      testCasesToRun = db.prepare('SELECT * FROM test_cases WHERE is_active = 1').all();
    }

    const insResult = db.prepare(`
      INSERT INTO assessment_results (id, assessment_id, test_case_id, test_input, observed_output, expected_behavior, result_status, evaluation_method, risk_level, findings_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insFinding = db.prepare(`
      INSERT INTO findings (id, assessment_id, result_id, category, risk_level, description, evidence, potential_impact, remediation, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open', ?)
    `);

    let passedCount = 0;
    let failedCount = 0;
    let totalFindings = 0;

    for (const tc of testCasesToRun) {
      const evalResult = await executeTestEvaluation(
        tc.category,
        tc.input_template,
        tc.expected_behavior,
        tc.detection_criteria,
        assessment.target_mode
      );

      const resultId = 'res_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      const now = new Date().toISOString();

      insResult.run(
        resultId,
        id,
        tc.id,
        tc.input_template,
        evalResult.observedOutput,
        tc.expected_behavior,
        evalResult.resultStatus,
        evalResult.evaluationMethod,
        evalResult.riskLevel,
        evalResult.findings.length,
        now
      );

      if (evalResult.resultStatus === 'passed') passedCount++;
      if (evalResult.resultStatus === 'failed') failedCount++;
      totalFindings += evalResult.findings.length;

      for (const finding of evalResult.findings) {
        const findingId = 'fnd_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
        insFinding.run(
          findingId,
          id,
          resultId,
          finding.category,
          finding.riskLevel,
          finding.description,
          finding.evidence,
          finding.potentialImpact,
          finding.remediation,
          now
        );
      }
    }

    const completedAt = new Date().toISOString();
    db.prepare(`UPDATE assessments SET status = 'completed', completed_at = ? WHERE id = ?`).run(completedAt, id);

    createAuditLog(
      user.id,
      'ASSESSMENT_EXECUTED',
      'assessment',
      id,
      `Executed ${testCasesToRun.length} tests (Passed: ${passedCount}, Failed: ${failedCount}, Findings: ${totalFindings})`,
      ip
    );

    return res.json({
      message: 'Assessment execution completed.',
      summary: {
        total_tests: testCasesToRun.length,
        passed_tests: passedCount,
        failed_tests: failedCount,
        findings_count: totalFindings,
        completed_at: completedAt
      }
    });
  } catch (error) {
    console.error('Run assessment error:', error);
    db.prepare(`UPDATE assessments SET status = 'failed' WHERE id = ?`).run(req.params.id);
    return res.status(500).json({ error: 'Assessment execution failed.' });
  }
});

// Delete assessment
router.delete('/:id', authenticateToken, (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const { id } = req.params;

    const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(id) as any;
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found.' });
    }

    if (user.role !== 'admin' && assessment.user_id !== user.id) {
      return res.status(403).json({ error: 'Access denied. You cannot delete this assessment.' });
    }

    db.prepare('DELETE FROM assessments WHERE id = ?').run(id);

    createAuditLog(user.id, 'ASSESSMENT_DELETED', 'assessment', id, `Deleted assessment: ${assessment.title}`, ip);

    return res.json({ message: 'Assessment deleted successfully.' });
  } catch (error) {
    console.error('Delete assessment error:', error);
    return res.status(500).json({ error: 'Failed to delete assessment.' });
  }
});

export default router;
