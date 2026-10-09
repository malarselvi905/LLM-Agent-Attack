import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { authenticateToken, createAuditLog } from '../auth.js';

const router = Router();

// List test cases
router.get('/', authenticateToken, (req: Request, res: Response) => {
  try {
    const { category, difficulty, search } = req.query;
    let query = 'SELECT * FROM test_cases WHERE is_active = 1';
    const params: any[] = [];

    if (category && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (difficulty && difficulty !== 'All') {
      query += ' AND difficulty = ?';
      params.push(difficulty);
    }

    if (search) {
      query += ' AND (title LIKE ? OR learning_objective LIKE ? OR input_template LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY category ASC, title ASC';
    const rows = db.prepare(query).all(...params);

    return res.json({ test_cases: rows });
  } catch (error) {
    console.error('List test cases error:', error);
    return res.status(500).json({ error: 'Failed to retrieve test cases.' });
  }
});

// Create new test case
router.post('/', authenticateToken, (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const {
      title,
      category,
      learning_objective,
      input_template,
      expected_behavior,
      detection_criteria,
      remediation_guidance,
      difficulty
    } = req.body;

    if (!title || !category || !input_template || !expected_behavior) {
      return res.status(400).json({ error: 'Title, category, input template, and expected behavior are required.' });
    }

    const id = 'tc_custom_' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO test_cases (id, title, category, learning_objective, input_template, expected_behavior, detection_criteria, remediation_guidance, difficulty, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      id,
      String(title).trim(),
      String(category).trim(),
      learning_objective ? String(learning_objective).trim() : 'Evaluate LLM response against specified security constraints.',
      String(input_template).trim(),
      String(expected_behavior).trim(),
      detection_criteria ? String(detection_criteria).trim() : 'Keyword and pattern evaluation.',
      remediation_guidance ? String(remediation_guidance).trim() : 'Apply system guardrails and input/output sanitization.',
      difficulty || 'Medium',
      now
    );

    createAuditLog(user.id, 'TEST_CASE_CREATED', 'test_case', id, `Created custom test case: ${title} (${category})`, ip);

    return res.status(201).json({
      message: 'Test case created successfully.',
      test_case: {
        id,
        title,
        category,
        difficulty: difficulty || 'Medium',
        created_at: now
      }
    });
  } catch (error) {
    console.error('Create test case error:', error);
    return res.status(500).json({ error: 'Failed to create test case.' });
  }
});

// Get test case by ID
router.get('/:id', authenticateToken, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = db.prepare('SELECT * FROM test_cases WHERE id = ?').get(id);
    if (!item) {
      return res.status(404).json({ error: 'Test case not found.' });
    }
    return res.json({ test_case: item });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve test case.' });
  }
});

export default router;
