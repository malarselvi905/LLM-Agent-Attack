import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Play,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Shield,
  Layers,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { api, Assessment, AssessmentResult, Finding } from '../api/client';
import { StatusBadge, RiskBadge } from '../components/Badge';

interface AssessmentDetailsPageProps {
  id: string;
  onNavigate: (tab: string, param?: string) => void;
}

export function AssessmentDetailsPage({ id, onNavigate }: AssessmentDetailsPageProps) {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [activeTab, setActiveTab] = useState<'results' | 'findings'>('results');
  const [expandedResultId, setExpandedResultId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAssessment(id);
      setAssessment(res.assessment);
      setResults(res.results);
      setFindings(res.findings);
      if (res.results.length > 0 && !expandedResultId) {
        setExpandedResultId(res.results[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load assessment details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleRunExecution = async () => {
    try {
      setRunning(true);
      setError(null);
      await api.runAssessment(id);
      await fetchDetails();
    } catch (err: any) {
      setError(err.message || 'Execution failed.');
    } finally {
      setRunning(false);
    }
  };

  const copyText = (text: string, resId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(resId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono text-slate-400">Loading assessment details...</p>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 text-center">
        <p className="text-sm text-slate-300">Assessment not found or inaccessible.</p>
        <button
          onClick={() => onNavigate('assessments')}
          className="mt-3 text-xs text-purple-400 hover:underline"
        >
          Return to assessments list &rarr;
        </button>
      </div>
    );
  }

  const passedCount = results.filter((r) => r.result_status === 'passed').length;
  const failedCount = results.filter((r) => r.result_status === 'failed').length;
  const passRate = results.length > 0 ? Math.round((passedCount / results.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top breadcrumb & actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-purple-900/20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('assessments')}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">
                {assessment.target_mode}
              </span>
              <StatusBadge status={assessment.status} />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1">{assessment.title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('reports', assessment.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Executive Report</span>
          </button>

          <button
            onClick={handleRunExecution}
            disabled={running}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-900/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {running ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running Audit...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Re-Execute All Tests</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/50 text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#0e1628]/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 font-mono">TOTAL TESTS</span>
          <p className="text-2xl font-bold text-white font-mono mt-1">{results.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-[#0e1628]/80 border border-slate-800">
          <span className="text-[11px] text-emerald-400 font-mono">DEFENDED / PASSED</span>
          <p className="text-2xl font-bold text-emerald-400 font-mono mt-1">{passedCount}</p>
        </div>
        <div className="p-4 rounded-xl bg-[#0e1628]/80 border border-slate-800">
          <span className="text-[11px] text-rose-400 font-mono">BREACHED / FAILED</span>
          <p className="text-2xl font-bold text-rose-400 font-mono mt-1">{failedCount}</p>
        </div>
        <div className="p-4 rounded-xl bg-[#0e1628]/80 border border-slate-800">
          <span className="text-[11px] text-amber-400 font-mono">IDENTIFIED FINDINGS</span>
          <p className="text-2xl font-bold text-amber-400 font-mono mt-1">{findings.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('results')}
          className={`pb-2.5 text-xs font-semibold font-mono uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'results'
              ? 'text-purple-300 border-purple-500'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Test Case Results ({results.length})
        </button>
        <button
          onClick={() => setActiveTab('findings')}
          className={`pb-2.5 text-xs font-semibold font-mono uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'findings'
              ? 'text-purple-300 border-purple-500'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Vulnerability Findings ({findings.length})
        </button>
      </div>

      {/* Tab 1: Test Results List */}
      {activeTab === 'results' && (
        <div className="space-y-3">
          {results.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-mono">
              No test executions recorded yet. Click "Re-Execute All Tests" to run the evaluation suite.
            </div>
          ) : (
            results.map((res) => {
              const isExpanded = expandedResultId === res.id;
              return (
                <div
                  key={res.id}
                  className="rounded-xl bg-[#0e1628]/80 border border-slate-800 overflow-hidden transition-all"
                >
                  {/* Card Header / Summary Bar */}
                  <div
                    onClick={() => setExpandedResultId(isExpanded ? null : res.id)}
                    className="p-4 cursor-pointer hover:bg-slate-900/50 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {res.result_status === 'passed' ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">{res.test_title || 'Test Case'}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-purple-300 border border-purple-900/40">
                            {res.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{res.learning_objective}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <RiskBadge level={res.risk_level} />
                      <StatusBadge status={res.result_status} />
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Body */}
                  {isExpanded && (
                    <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 space-y-4 animate-in fade-in">
                      {/* Input Prompt */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-300 font-mono">TEST INPUT PAYLOAD</span>
                          <button
                            onClick={() => copyText(res.test_input, res.id + '_in')}
                            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-mono"
                          >
                            {copiedId === res.id + '_in' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === res.id + '_in' ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap">
                          {res.test_input}
                        </div>
                      </div>

                      {/* Observed Output */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-300 font-mono">OBSERVED AGENT RESPONSE</span>
                          <button
                            onClick={() => copyText(res.observed_output, res.id + '_out')}
                            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-mono"
                          >
                            {copiedId === res.id + '_out' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === res.id + '_out' ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap">
                          {res.observed_output}
                        </div>
                      </div>

                      {/* Expected Safe Behavior */}
                      <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-900/30 text-xs">
                        <span className="font-semibold text-indigo-300 font-mono block mb-1">
                          EXPECTED SECURE BEHAVIOR:
                        </span>
                        <p className="text-slate-300">{res.expected_behavior}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Findings List */}
      {activeTab === 'findings' && (
        <div className="space-y-3">
          {findings.length === 0 ? (
            <div className="py-12 text-center text-xs text-emerald-400 font-mono">
              No security vulnerabilities detected! All guardrail tests passed.
            </div>
          ) : (
            findings.map((f) => (
              <div
                key={f.id}
                className="p-5 rounded-xl bg-[#0e1628]/80 border border-slate-800 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <RiskBadge level={f.risk_level} />
                      <span className="text-xs font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                        {f.category}
                      </span>
                      <StatusBadge status={f.status} />
                    </div>
                    <h4 className="text-sm font-semibold text-white mt-1.5">{f.description}</h4>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono shrink-0">
                    {new Date(f.created_at).toLocaleTimeString()}
                  </span>
                </div>

                {/* Evidence */}
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-amber-300">
                  <span className="text-slate-500 select-none">Evidence: </span>
                  {f.evidence}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="font-semibold text-rose-300 block mb-1">Potential Impact:</span>
                    <p className="text-slate-300">{f.potential_impact}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-900/30">
                    <span className="font-semibold text-cyan-300 block mb-1">Recommended Mitigation:</span>
                    <p className="text-slate-300">{f.remediation}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
