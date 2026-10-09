# LLM Agent Attack Lab (DVLA) Architecture

## 1. System Overview
The **LLM Agent Attack Lab (DVLA)** is an educational cybersecurity testing and vulnerability simulation platform designed to evaluate Large Language Model agents against modern threat vectors, structured according to the **OWASP Top 10 for Large Language Model Applications**.

## 2. Core Architecture Components
1. **Frontend Presentation Layer**:
   - Modern React + TypeScript SPA with dark cybersecurity styling.
   - Real-time dashboards, charts (Recharts), reactive test runner, and interactive lab playground.
   - Comprehensive role-based UI access control (Administrator vs Security Researcher).

2. **Backend Application Layer**:
   - Node.js Express server running with TypeScript (`server.ts`).
   - Alternative standalone Python FastAPI service (`backend/app/main.py`).
   - Secure REST API endpoints with JWT session management and bcrypt password hashing.

3. **Safe Evaluation & Simulation Engine**:
   - Strict execution sandboxing: no arbitrary shell or untrusted code execution.
   - Dual-mode target agent evaluation:
     - **Mock Agent Simulation**: Configurable vulnerable vs hardened defense-in-depth profiles.
     - **Gemini API Integration**: Direct model testing using `@google/genai` with `gemini-3.8-flash`.
   - Heuristic signature analyzers, canary token tracking (`CANARY-DVLA-7788`), and synthetic credential monitors.

4. **Persistence Layer**:
   - Native SQLite database engine with foreign key constraints, automated migrations, and seed scripts.
   - Full migration compatibility for MySQL / PostgreSQL databases.

5. **Security & Audit Controls**:
   - Rate limiting on authentication attempts.
   - Comprehensive audit logging (`audit_logs` table) recording timestamps, IP addresses, and user actions.
   - CSV formula injection escaping.
   - HTML sanitization and XSS defensive encoding.
