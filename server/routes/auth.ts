import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { hashPassword, verifyPassword, signToken, authenticateToken, checkRateLimit, createAuditLog } from '../auth.js';

const router = Router();

// Register new user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields (name, email, password) are required.' });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Invalid email address format.' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    // Check unique email
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(trimmedEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await hashPassword(password);
    const id = 'usr_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'user', 1, ?, ?)
    `).run(id, String(name).trim(), trimmedEmail, passwordHash, now, now);

    createAuditLog(id, 'USER_REGISTERED', 'user', id, `Registered user: ${trimmedEmail}`, ip);

    const userPayload = { id, name: String(name).trim(), email: trimmedEmail, role: 'user' as const };
    const token = signToken(userPayload);

    return res.status(201).json({
      message: 'Registration successful.',
      token,
      user: userPayload,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const { email, password } = req.body;

    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: 'Too many login attempts. Please try again after 15 minutes.' });
    }

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const user = db.prepare('SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = ?').get(trimmedEmail) as any;

    // Use generic auth error message
    if (!user) {
      createAuditLog(null, 'LOGIN_FAILED_UNKNOWN_EMAIL', 'auth', null, `Failed login attempt for ${trimmedEmail}`, ip);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.is_active === 0) {
      createAuditLog(user.id, 'LOGIN_FAILED_DEACTIVATED', 'auth', user.id, 'Deactivated account login attempt', ip);
      return res.status(403).json({ error: 'This account has been deactivated. Please contact an administrator.' });
    }

    const match = await verifyPassword(password, user.password_hash);
    if (!match) {
      createAuditLog(user.id, 'LOGIN_FAILED_BAD_PASSWORD', 'auth', user.id, 'Failed password attempt', ip);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const userPayload = { id: user.id, name: user.name, email: user.email, role: user.role as 'user' | 'admin' };
    const token = signToken(userPayload);

    createAuditLog(user.id, 'LOGIN_SUCCESS', 'auth', user.id, `User logged in: ${user.email}`, ip);

    return res.json({
      message: 'Authentication successful.',
      token,
      user: userPayload,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// Logout
router.post('/logout', authenticateToken, (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (req.user) {
    createAuditLog(req.user.id, 'LOGOUT', 'auth', req.user.id, 'User logged out', ip);
  }
  return res.json({ message: 'Logged out successfully.' });
});

// Get current profile
router.get('/me', authenticateToken, (req: Request, res: Response) => {
  return res.json({ user: req.user });
});

// Change password
router.post('/change-password', authenticateToken, async (req: Request, res: Response) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userId = req.user!.id;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Both current password and new password are required.' });
    }

    if (String(new_password).length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }

    const userRow = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId) as any;
    if (!userRow) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const match = await verifyPassword(current_password, userRow.password_hash);
    if (!match) {
      createAuditLog(userId, 'PASSWORD_CHANGE_FAILED', 'user', userId, 'Incorrect current password provided', ip);
      return res.status(400).json({ error: 'Current password does not match.' });
    }

    const newHash = await hashPassword(new_password);
    const now = new Date().toISOString();

    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(newHash, now, userId);

    createAuditLog(userId, 'PASSWORD_CHANGED', 'user', userId, 'Password successfully updated', ip);

    return res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Failed to update password.' });
  }
});

export default router;
