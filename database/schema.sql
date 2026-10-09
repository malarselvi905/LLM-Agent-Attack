-- ========================================================
-- LLM Agent Attack Lab (DVLA) Database Schema (SQLite / MySQL)
-- ========================================================

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'user', -- 'user' or 'admin'
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS assessments (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_mode VARCHAR(64) NOT NULL DEFAULT 'mock-vulnerable',
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS test_cases (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL,
  learning_objective TEXT NOT NULL,
  input_template TEXT NOT NULL,
  expected_behavior TEXT NOT NULL,
  detection_criteria TEXT NOT NULL,
  remediation_guidance TEXT NOT NULL,
  difficulty VARCHAR(32) NOT NULL DEFAULT 'Medium',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS assessment_results (
  id VARCHAR(64) PRIMARY KEY,
  assessment_id VARCHAR(64) NOT NULL,
  test_case_id VARCHAR(64) NOT NULL,
  test_input TEXT NOT NULL,
  observed_output TEXT NOT NULL,
  expected_behavior TEXT NOT NULL,
  result_status VARCHAR(32) NOT NULL,
  evaluation_method VARCHAR(64) NOT NULL,
  risk_level VARCHAR(32) NOT NULL,
  findings_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL,
  FOREIGN KEY(assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
  FOREIGN KEY(test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS findings (
  id VARCHAR(64) PRIMARY KEY,
  assessment_id VARCHAR(64) NOT NULL,
  result_id VARCHAR(64) NOT NULL,
  category VARCHAR(64) NOT NULL,
  risk_level VARCHAR(32) NOT NULL,
  description TEXT NOT NULL,
  evidence TEXT NOT NULL,
  potential_impact TEXT NOT NULL,
  remediation TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'Open',
  created_at TIMESTAMP NOT NULL,
  FOREIGN KEY(assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
  FOREIGN KEY(result_id) REFERENCES assessment_results(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64),
  action VARCHAR(128) NOT NULL,
  resource_type VARCHAR(64) NOT NULL,
  resource_id VARCHAR(64),
  details TEXT,
  ip_address VARCHAR(64),
  created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_assessments_user ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_results_assessment ON assessment_results(assessment_id);
CREATE INDEX IF NOT EXISTS idx_findings_assessment ON findings(assessment_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
