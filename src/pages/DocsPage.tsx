import React, { useState } from 'react';
import {
  BookOpen,
  Code,
  Shield,
  Layers,
  Terminal,
  FileCode,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';

export function DocsPage() {
  const [activeTab, setActiveTab] = useState<'architecture' | 'guide' | 'api' | 'fastapi'>('architecture');
  const [copied, setCopied] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-purple-900/20">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-1">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Technical Reference</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Documentation & Architecture</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          System design, OWASP LLM evaluation methodology, REST API contracts, and Python FastAPI instructions.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto custom-scrollbar">
        {[
          { id: 'architecture', label: 'Architecture & Design', icon: Layers },
          { id: 'guide', label: 'OWASP Security Guide', icon: Shield },
          { id: 'api', label: 'API Documentation', icon: Code },
          { id: 'fastapi', label: 'Python FastAPI Setup', icon: Terminal },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Architecture */}
      {activeTab === 'architecture' && (
        <div className="p-6 rounded-2xl bg-[#0e1628]/80 border border-slate-800 space-y-5 text-xs text-slate-300 leading-relaxed">
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
            SYSTEM ARCHITECTURE OVERVIEW
          </h3>
          <p>
            The <strong>LLM Agent Attack Lab (DVLA)</strong> is modeled as a full-stack educational cybersecurity workbench. It mirrors real-world vulnerability laboratories like DVWA or Juice Shop, specifically tailored to the unique failure modes of agentic LLM systems.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4 font-mono">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="font-bold text-purple-400 block">Frontend (React + Vite + TS)</span>
              <p className="text-[11px] text-slate-400">
                Tailwind CSS dark UI with real-time telemetry, Recharts data visualization, and an interactive security testing lab.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="font-bold text-cyan-400 block">Backend Execution Layer</span>
              <p className="text-[11px] text-slate-400">
                Node.js Express + TS server engine with SQLite (`node:sqlite`) data persistence, plus alternative Python FastAPI reference service.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="font-bold text-emerald-400 block">Evaluation & Heuristics</span>
              <p className="text-[11px] text-slate-400">
                Synthetic canary token tracking, regex credential leak detection, tool signature interceptors, and Gemini Live API adapter.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="font-bold text-amber-400 block">Security & Compliance</span>
              <p className="text-[11px] text-slate-400">
                JWT sessions, bcrypt password hashing, CSV formula injection defense, rate limiting, and immutable audit logs.
              </p>
            </div>
          </div>

          <h4 className="text-xs font-bold text-white font-mono uppercase mt-4">
            DATABASE ENTITY RELATIONSHIPS
          </h4>
          <ul className="list-disc list-inside space-y-1.5 text-slate-400 font-mono text-[11px]">
            <li><strong>users</strong> &rarr; Operators and administrators with hashed credentials and role scopes.</li>
            <li><strong>assessments</strong> &rarr; User-owned audit sessions with target mode configuration.</li>
            <li><strong>test_cases</strong> &rarr; Benchmark library with learning objectives, payloads, and detection criteria.</li>
            <li><strong>assessment_results</strong> &rarr; Record of prompt inputs, observed model outputs, and verdicts.</li>
            <li><strong>findings</strong> &rarr; Actionable security findings with risk level, evidence excerpt, impact, and mitigation.</li>
            <li><strong>audit_logs</strong> &rarr; Tamper-evident trail of actions, operators, and client IP addresses.</li>
          </ul>
        </div>
      )}

      {/* Tab 2: Security Guide */}
      {activeTab === 'guide' && (
        <div className="p-6 rounded-2xl bg-[#0e1628]/80 border border-slate-800 space-y-4 text-xs text-slate-300 leading-relaxed">
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
            OWASP TOP 10 FOR LLMS TESTING GUIDE
          </h3>
          <p>
            The DVLA test suite exercises the primary threat vectors documented by the OWASP Top 10 for Large Language Models:
          </p>

          <div className="space-y-3 font-mono text-[11px]">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-purple-400 font-bold">1. Prompt Injection (LLM01)</span>
              <p className="text-slate-400">Direct or indirect instructions that trick the model into ignoring prior guardrails. Defend with explicit delimiters (e.g. XML tags) and strict instruction priority.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-rose-400 font-bold">2. Sensitive Data Leakage (LLM06)</span>
              <p className="text-slate-400">Agents disclosing proprietary system prompts, API keys, or personal data. Tested using safe synthetic tokens (`sk-dvla-*`, `CANARY-DVLA-7788`).</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-amber-400 font-bold">3. Insecure Tool Usage & Excessive Agency (LLM08 / LLM09)</span>
              <p className="text-slate-400">Agents autonomously executing high-impact state-altering commands without human-in-the-loop authorization. Mitigated via strict backend authorization checks.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-cyan-400 font-bold">4. Output Validation & XSS (LLM02)</span>
              <p className="text-slate-400">Applications blindly rendering raw LLM responses. Frontends must treat all LLM text as untrusted user input and sanitize using HTML encoding or DOMPurify.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: API Reference */}
      {activeTab === 'api' && (
        <div className="p-6 rounded-2xl bg-[#0e1628]/80 border border-slate-800 space-y-4 text-xs font-mono">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">
            REST API ENDPOINTS CONTRACT
          </h3>

          <div className="space-y-2 text-[11px]">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-cyan-400 font-bold">POST </span>
                <span className="text-white">/api/auth/register</span>
              </div>
              <span className="text-slate-400">Create new user account</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-cyan-400 font-bold">POST </span>
                <span className="text-white">/api/auth/login</span>
              </div>
              <span className="text-slate-400">Authenticate and obtain JWT token</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-emerald-400 font-bold">GET </span>
                <span className="text-white">/api/dashboard/summary</span>
              </div>
              <span className="text-slate-400">Retrieve aggregate security telemetry</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-cyan-400 font-bold">POST </span>
                <span className="text-white">/api/assessments/:id/run</span>
              </div>
              <span className="text-slate-400">Execute benchmark test suite on target</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-emerald-400 font-bold">GET </span>
                <span className="text-white">/api/reports/:id/export/csv</span>
              </div>
              <span className="text-slate-400">Download sanitized CSV vulnerability report</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-yellow-400 font-bold">PATCH </span>
                <span className="text-white">/api/findings/:id/status</span>
              </div>
              <span className="text-slate-400">Update resolution status of finding</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: FastAPI Instructions */}
      {activeTab === 'fastapi' && (
        <div className="p-6 rounded-2xl bg-[#0e1628]/80 border border-slate-800 space-y-4 text-xs text-slate-300">
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
            STANDALONE PYTHON FASTAPI BACKEND INSTRUCTIONS
          </h3>
          <p>
            Complete Python source code is included in the project directory under <code className="text-purple-300">backend/</code>. You can run the standalone FastAPI service locally with:
          </p>

          <div className="relative">
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-cyan-300 overflow-x-auto text-[11px]">
{`# 1. Navigate to backend directory
cd backend

# 2. Install requirements
pip install -r requirements.txt

# 3. Launch FastAPI server with Uvicorn
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 4. View interactive OpenAPI documentation
# Open: http://localhost:8000/docs`}
            </pre>
            <button
              onClick={() => copyCode(`cd backend\npip install -r requirements.txt\npython -m uvicorn app.main:app --port 8000 --reload`, 'fastapi_cli')}
              className="absolute top-3 right-3 text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-mono"
            >
              {copied === 'fastapi_cli' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied === 'fastapi_cli' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
