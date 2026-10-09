import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dvla-super-secure-jwt-secret-key-2026-sandbox';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthUser;
    
    // Verify user is still active in database
    const stmt = db.prepare('SELECT id, name, email, role, is_active FROM users WHERE id = ?');
    const userRow = stmt.get(payload.id) as any;

    if (!userRow || userRow.is_active === 0) {
      return res.status(401).json({ error: 'User account is inactive or no longer exists.' });
    }

    req.user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role: userRow.role,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privilege required.' });
  }
  next();
}

// Log audit events securely
export function createAuditLog(
  userId: string | null,
  action: string,
  resourceType: string,
  resourceId: string | null,
  details: string | null,
  ip: string
) {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const id = 'log_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    stmt.run(id, userId, action, resourceType, resourceId, details, ip, new Date().toISOString());
  } catch (e) {
    console.error('Audit log failure:', e);
  }
}

// Rate limit helper
export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 10;

  // Cleanup old attempts
  db.prepare('DELETE FROM login_rate_limit WHERE attempt_time < ?').run(now - windowMs);

  const countRow = db.prepare('SELECT COUNT(*) as count FROM login_rate_limit WHERE ip = ?').get(ip) as any;
  if (countRow && countRow.count >= maxAttempts) {
    return false;
  }

  db.prepare('INSERT INTO login_rate_limit (ip, attempt_time) VALUES (?, ?)').run(ip, now);
  return true;
}
