import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'dvla.db');
export const db = new DatabaseSync(dbPath);

// Initialize schema
export function initDatabase() {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user', -- 'user' or 'admin'
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      target_mode TEXT NOT NULL DEFAULT 'mock-vulnerable', -- 'mock-vulnerable', 'mock-hardened', 'gemini'
      status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'in_progress', 'completed', 'failed'
      created_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS test_cases (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      learning_objective TEXT NOT NULL,
      input_template TEXT NOT NULL,
      expected_behavior TEXT NOT NULL,
      detection_criteria TEXT NOT NULL,
      remediation_guidance TEXT NOT NULL,
      difficulty TEXT NOT NULL DEFAULT 'Medium', -- 'Easy', 'Medium', 'Hard', 'Advanced'
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assessment_results (
      id TEXT PRIMARY KEY,
      assessment_id TEXT NOT NULL,
      test_case_id TEXT NOT NULL,
      test_input TEXT NOT NULL,
      observed_output TEXT NOT NULL,
      expected_behavior TEXT NOT NULL,
      result_status TEXT NOT NULL, -- 'passed', 'failed', 'inconclusive'
      evaluation_method TEXT NOT NULL, -- 'heuristic_simulation', 'gemini_evaluator'
      risk_level TEXT NOT NULL, -- 'Critical', 'High', 'Medium', 'Low', 'Safe'
      findings_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY(assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
      FOREIGN KEY(test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS findings (
      id TEXT PRIMARY KEY,
      assessment_id TEXT NOT NULL,
      result_id TEXT NOT NULL,
      category TEXT NOT NULL,
      risk_level TEXT NOT NULL, -- 'Critical', 'High', 'Medium', 'Low'
      description TEXT NOT NULL,
      evidence TEXT NOT NULL,
      potential_impact TEXT NOT NULL,
      remediation TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Open', -- 'Open', 'In Progress', 'Resolved', 'Accepted Risk'
      created_at TEXT NOT NULL,
      FOREIGN KEY(assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
      FOREIGN KEY(result_id) REFERENCES assessment_results(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS login_rate_limit (
      ip TEXT NOT NULL,
      attempt_time INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_assessments_user ON assessments(user_id);
    CREATE INDEX IF NOT EXISTS idx_results_assessment ON assessment_results(assessment_id);
    CREATE INDEX IF NOT EXISTS idx_findings_assessment ON findings(assessment_id);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
  `);
}
