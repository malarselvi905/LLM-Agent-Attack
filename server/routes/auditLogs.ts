import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../auth.js';

const router = Router();

router.get('/', authenticateToken, (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const isAdmin = user.role === 'admin';
    const { action, limit } = req.query;

    let query = `
      SELECT al.*, u.name as user_name, u.email as user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (!isAdmin) {
      query += ' AND al.user_id = ?';
      params.push(user.id);
    }

    if (action && action !== 'All') {
      query += ' AND al.action = ?';
      params.push(action);
    }

    const rowLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    query += ` ORDER BY al.created_at DESC LIMIT ${rowLimit}`;

    const logs = db.prepare(query).all(...params);
    return res.json({ audit_logs: logs });
  } catch (error) {
    console.error('Audit logs error:', error);
    return res.status(500).json({ error: 'Failed to retrieve audit logs.' });
  }
});

export default router;
