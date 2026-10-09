import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { authenticateToken, createAuditLog } from '../auth.js';

const router = Router();

// Sanitize string to prevent CSV formula injection (OWASP CSV Injection defense)
function sanitizeCsvCell(value: any): string {
  if (value === null || value === undefined) return '""';
  let str = String(value);
  // If field starts with =, +, -, @, pipe, or tab, prepend a single quote
  if (/^[=+\-@\t\r%]/.test(str)) {
    str = `'${str}`;
  }
  // Escape double quotes
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

// Generate Full Report JSON
router.get('/:id/report', authenticateToken, (req: Request, res: Response) => {
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

    if (user.role !== 'admin' && assessment.user_id !== user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const results = db.prepare(`
      SELECT ar.*, tc.title as test_title, tc.category, tc.difficulty, tc.learning_objective, tc.detection_criteria, tc.remediation_guidance
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

    // Compute metrics
    const totalTests = results.length;
    const passedTests = results.filter((r: any) => r.result_status === 'passed').length;
    const failedTests = results.filter((r: any) => r.result_status === 'failed').length;
    const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

    const riskCounts = {
      Critical: findings.filter((f: any) => f.risk_level === 'Critical').length,
      High: findings.filter((f: any) => f.risk_level === 'High').length,
      Medium: findings.filter((f: any) => f.risk_level === 'Medium').length,
      Low: findings.filter((f: any) => f.risk_level === 'Low').length,
    };

    const categoriesCovered = Array.from(new Set(results.map((r: any) => r.category)));

    return res.json({
      report: {
        assessment_id: assessment.id,
        title: assessment.title,
        description: assessment.description,
        target_mode: assessment.target_mode,
        status: assessment.status,
        created_at: assessment.created_at,
        completed_at: assessment.completed_at,
        tester_name: assessment.creator_name,
        tester_email: assessment.creator_email,
        summary: {
          total_tests: totalTests,
          passed_tests: passedTests,
          failed_tests: failedTests,
          pass_rate_percentage: passRate,
          total_findings: findings.length,
          risk_counts: riskCounts,
          categories_covered: categoriesCovered,
        },
        limitations_statement: 'This assessment was conducted using educational simulation heuristics and bounded test cases in the DVLA sandbox. These results represent automated educational indicators and should not be construed as a formal enterprise compliance certification.',
        results,
        findings,
      }
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return res.status(500).json({ error: 'Failed to generate assessment report.' });
  }
});

// CSV Export Endpoint
router.get('/:id/export/csv', authenticateToken, (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const { id } = req.params;

    const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(id) as any;
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found.' });
    }

    if (user.role !== 'admin' && assessment.user_id !== user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const findings = db.prepare(`
      SELECT f.*, tc.title as test_case_title
      FROM findings f
      LEFT JOIN assessment_results ar ON f.result_id = ar.id
      LEFT JOIN test_cases tc ON ar.test_case_id = tc.id
      WHERE f.assessment_id = ?
      ORDER BY f.created_at ASC
    `).all(id);

    const headers = [
      'Finding ID',
      'Assessment ID',
      'Test Case Title',
      'Category',
      'Risk Level',
      'Status',
      'Description',
      'Evidence Excerpt',
      'Potential Impact',
      'Remediation Guidance',
      'Created Timestamp'
    ];

    const rows = [headers.map(sanitizeCsvCell).join(',')];

    for (const f of findings as any[]) {
      const row = [
        sanitizeCsvCell(f.id),
        sanitizeCsvCell(f.assessment_id),
        sanitizeCsvCell(f.test_case_title || 'N/A'),
        sanitizeCsvCell(f.category),
        sanitizeCsvCell(f.risk_level),
        sanitizeCsvCell(f.status),
        sanitizeCsvCell(f.description),
        sanitizeCsvCell(f.evidence),
        sanitizeCsvCell(f.potential_impact),
        sanitizeCsvCell(f.remediation),
        sanitizeCsvCell(f.created_at),
      ];
      rows.push(row.join(','));
    }

    const csvContent = rows.join('\r\n');

    createAuditLog(user.id, 'REPORT_CSV_EXPORT', 'report', id, `Exported CSV report with ${findings.length} findings`, ip);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="DVLA-Report-${id}.csv"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('CSV export error:', error);
    return res.status(500).json({ error: 'Failed to export CSV report.' });
  }
});

export default router;
