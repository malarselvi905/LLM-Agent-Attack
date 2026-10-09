# LLM Agent Attack Lab (DVLA)

**LLM Agent Attack Lab (DVLA)** is an educational cybersecurity platform designed to help students, AI developers, and security researchers safely understand, simulate, audit, and analyze vulnerabilities in Large Language Model (LLM) agents in a controlled, non-destructive sandbox.

---

## Default Test Credentials

The system initializes with two pre-configured sandbox accounts:

| Role | Email | Password |
|---|---|---|
| **Administrator** | `admin@dvla.local` | `Admin@DVLA2026!` |
| **Security Researcher** | `researcher@dvla.local` | `Researcher@2026!` |

You can also register a new account on the registration page at any time.

---

## Key Features

1. **Full-Stack Cybersecurity Dashboard**:
   - High-risk vulnerability metrics, test pass/fail charts (Recharts), and category radar/bar distributions.
   - Dark cybersecurity aesthetic with purple, cyan, and navy accents.

2. **Security Testing Lab & Interactive Playground**:
   - 8 Core Categories covering the OWASP Top 10 for LLMs:
     - Prompt Injection
     - Jailbreak Resistance
     - Sensitive Data Leakage
     - Insecure Tool Usage
     - System Prompt Disclosure
     - Excessive Agency
     - Output Validation
     - Indirect Prompt Injection
   - Interactive prompt simulator with instant heuristic evaluation and evidence breakdown.

3. **Multi-Mode Execution Engine**:
   - **Mock Vulnerable Agent**: Simulates an unhardened, overly compliant model.
   - **Mock Hardened Agent**: Simulates defense-in-depth with system guardrails and refusal protocols.
   - **Gemini Live AI Agent**: Supports live evaluation using `@google/genai` with `gemini-3.8-flash` when `GEMINI_API_KEY` is provided.

4. **Findings & Risk Scoring**:
   - 4-Tier Severity Scale: Critical, High, Medium, Low.
   - Granular status workflow: `Open`, `In Progress`, `Resolved`, `Accepted Risk`.
   - Explanations, evidence excerpts, impact assessment, and OWASP remediation guidelines.

5. **Executive Reports & CSV Export**:
   - Comprehensive vulnerability assessment report.
   - Safe CSV export with formula injection sanitization.
   - Printable report preview mode.

6. **Admin Panel & Audit Trail**:
   - User role and status management.
   - Immutable security audit logs tracking IP addresses and user actions.

---

## Local Setup & Execution

### Node.js / Express Full-Stack (Default)
```bash
# Install dependencies
npm install

# Run full-stack dev server (port 3000)
npm run dev
```

### Python FastAPI Backend (Alternative Standalone)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000 --reload
```
