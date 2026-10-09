import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { authenticateToken, requireAdmin, createAuditLog } from '../auth.js';
import { seedInitialData } from '../seed.js';

const router = Router();

// Middleware: all routes here require admin
router.use(authenticateToken, requireAdmin);

// List all users
router.get('/users', (req: Request, res: Response) => {
  try {
    const users = db.prepare(`
      SELECT id, name, email, role, is_active, created_at, updated_at,
             (SELECT COUNT(*) FROM assessments WHERE user_id = users.id) as assessments_count
      FROM users
      ORDER BY created_at ASC
    `).all();
    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve users.' });
  }
});

// Update user role
router.patch('/users/:id/role', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const adminUser = req.user!;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "user" or "admin".' });
    }

    if (id === adminUser.id && role !== 'admin') {
      return res.status(400).json({ error: 'You cannot revoke your own administrator privileges.' });
    }

    db.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?').run(role, new Date().toISOString(), id);
    createAuditLog(adminUser.id, 'ADMIN_USER_ROLE_UPDATED', 'user', id, `Updated role to ${role}`, ip);

    return res.json({ message: 'User role updated successfully.', id, role });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update user role.' });
  }
});

// Update user active status
router.patch('/users/:id/status', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const adminUser = req.user!;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    if (id === adminUser.id && (is_active === 0 || is_active === false)) {
      return res.status(400).json({ error: 'You cannot deactivate your own administrative account.' });
    }

    const activeVal = is_active ? 1 : 0;
    db.prepare('UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?').run(activeVal, new Date().toISOString(), id);
    createAuditLog(adminUser.id, 'ADMIN_USER_STATUS_UPDATED', 'user', id, `Updated status to ${activeVal ? 'active' : 'inactive'}`, ip);

    return res.json({ message: 'User status updated successfully.', id, is_active: activeVal });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update user status.' });
  }
});

// Get system statistics
router.get('/system-stats', (req: Request, res: Response) => {
  try {
    const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
    const assessCount = (db.prepare('SELECT COUNT(*) as c FROM assessments').get() as any).c;
    const tcCount = (db.prepare('SELECT COUNT(*) as c FROM test_cases').get() as any).c;
    const findingsCount = (db.prepare('SELECT COUNT(*) as c FROM findings').get() as any).c;
    const auditCount = (db.prepare('SELECT COUNT(*) as c FROM audit_logs').get() as any).c;

    return res.json({
      stats: {
        total_users: userCount,
        total_assessments: assessCount,
        total_test_cases: tcCount,
        total_findings: findingsCount,
        total_audit_records: auditCount,
        gemini_configured: !!process.env.GEMINI_API_KEY,
        node_version: process.version,
        uptime_seconds: Math.floor(process.uptime()),
        database_engine: 'SQLite 3 (via node:sqlite native module)',
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve system statistics.' });
  }
});

// Re-seed defaults
router.post('/reset-sandbox', async (req: Request, res: Response) => {
  try {
    const adminUser = req.user!;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    await seedInitialData();
    createAuditLog(adminUser.id, 'ADMIN_RESET_SANDBOX', 'system', null, 'Triggered default test case and seed check', ip);

    return res.json({ message: 'Sandbox defaults checked and populated.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to reset sandbox.' });
  }
});

export default router;
