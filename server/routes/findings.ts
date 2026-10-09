import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { authenticateToken, createAuditLog } from '../auth.js';

const router = Router();

// List findings
router.get('/', authenticateToken, (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { risk_level, category, status, assessment_id } = req.query;

    let query = `
      SELECT f.*, a.title as assessment_title, a.user_id as assessment_owner_id
      FROM findings f
      JOIN assessments a ON f.assessment_id = a.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Ownership filter
    if (user.role !== 'admin') {
      query += ' AND a.user_id = ?';
      params.push(user.id);
    }

    if (assessment_id) {
      query += ' AND f.assessment_id = ?';
      params.push(assessment_id);
    }

    if (risk_level && risk_level !== 'All') {
      query += ' AND f.risk_level = ?';
      params.push(risk_level);
    }

    if (category && category !== 'All') {
      query += ' AND f.category = ?';
      params.push(category);
    }

    if (status && status !== 'All') {
      query += ' AND f.status = ?';
      params.push(status);
    }

    query += ` ORDER BY 
      CASE f.risk_level 
        WHEN 'Critical' THEN 1 
        WHEN 'High' THEN 2 
        WHEN 'Medium' THEN 3 
        WHEN 'Low' THEN 4 
        ELSE 5 
      END ASC, f.created_at DESC`;

    const rows = db.prepare(query).all(...params);
    return res.json({ findings: rows });
  } catch (error) {
    console.error('List findings error:', error);
    return res.status(500).json({ error: 'Failed to retrieve findings.' });
  }
});

// Get finding by ID
router.get('/:id', authenticateToken, (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const finding = db.prepare(`
      SELECT f.*, a.title as assessment_title, a.user_id as assessment_owner_id,
             ar.test_input, ar.observed_output
      FROM findings f
      JOIN assessments a ON f.assessment_id = a.id
      LEFT JOIN assessment_results ar ON f.result_id = ar.id
      WHERE f.id = ?
    `).get(id) as any;

    if (!finding) {
      return res.status(404).json({ error: 'Finding not found.' });
    }

    if (user.role !== 'admin' && finding.assessment_owner_id !== user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    return res.json({ finding });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve finding details.' });
  }
});

// Update finding status
router.patch('/:id/status', authenticateToken, (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Open', 'In Progress', 'Resolved', 'Accepted Risk'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') });
    }

    const finding = db.prepare(`
      SELECT f.*, a.user_id as assessment_owner_id
      FROM findings f
      JOIN assessments a ON f.assessment_id = a.id
      WHERE f.id = ?
    `).get(id) as any;

    if (!finding) {
      return res.status(404).json({ error: 'Finding not found.' });
    }

    if (user.role !== 'admin' && finding.assessment_owner_id !== user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    db.prepare('UPDATE findings SET status = ? WHERE id = ?').run(status, id);

    createAuditLog(user.id, 'FINDING_STATUS_UPDATED', 'finding', id, `Updated finding status from ${finding.status} to ${status}`, ip);

    return res.json({ message: 'Finding status updated.', id, status });
  } catch (error) {
    console.error('Update finding status error:', error);
    return res.status(500).json({ error: 'Failed to update finding status.' });
  }
});

export default router;
