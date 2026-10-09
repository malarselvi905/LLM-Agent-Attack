import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Layers,
  ArrowLeft,
  Calendar,
  User,
  ExternalLink,
  ShieldAlert,
  Info
} from 'lucide-react';
import { api, Assessment } from '../api/client';
import { RiskBadge, StatusBadge } from '../components/Badge';

interface ReportsPageProps {
  initialAssessmentId?: string;
  onNavigate: (tab: string, param?: string) => void;
}

export function ReportsPage({ initialAssessmentId, onNavigate }: ReportsPageProps) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedId, setSelectedId] = useState<string>(initialAssessmentId || '');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all assessments for selector
  useEffect(() => {
    async function loadList() {
      try {
        const res = await api.getAssessments();
        setAssessments(res.assessments);
        if (!selectedId && res.assessments.length > 0) {
          setSelectedId(res.assessments[0].id);
        }
      } catch (err: any) {
        console.error('Failed to load assessments list for report:', err);
      }
    }
    loadList();
  }, []);

  // Load report when selectedId changes
  useEffect(() => {
    if (!selectedId) return;
    async function loadReport() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.getAssessmentReport(selectedId);
        setReportData(res.report);
      } catch (err: any) {
        setError(err.message || 'Failed to generate report.');
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [selectedId]);

  const handlePrint = () => {
    window.print();
  };

  const handleCsvDownload = () => {
    if (!selectedId) return;
    // Trigger direct CSV export download
    const token = localStorage.getItem('dvla_auth_token');
    const url = `/api/reports/${selectedId}/export/csv`;
    
    // Fetch with auth header and trigger browser download
    fetch(url, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    })
      .then((res) => res.blob())
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `DVLA-Report-${selectedId}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch((err) => alert('CSV Export failed: ' + err.message));
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-purple-900/20 print:hidden">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-1">
            <FileText className="w-3.5 h-3.5" />
            <span>Formal Assessment Reports</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Vulnerability Report & Export</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit summaries, OWASP LLM category coverage, evidence excerpts, and CSV downloads.
          </p>
        </div>

        {/* Action Buttons & Assessment Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#0e1628] border border-slate-700 text-xs text-slate-200 focus:outline-hidden focus:border-purple-500 max-w-xs"
          >
            {assessments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title} ({a.target_mode})
              </option>
            ))}
          </select>

          <button
            onClick={handleCsvDownload}
            disabled={!reportData}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={!reportData}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-900/30 transition-all cursor-pointer disabled:opacity-50"
            title="Print Report"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-slate-400">Compiling executive security report...</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900/50 text-xs text-rose-300">
          {error}
        </div>
      )}

      {reportData && !loading && (
        <div className="bg-[#0e1628] rounded-2xl border border-slate-800 p-6 sm:p-10 space-y-8 shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
          {/* Report Document Header */}
          <div className="border-b border-slate-800 print:border-gray-300 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 print:text-indigo-600 uppercase">
                  LLM AGENT ATTACK LAB (DVLA) &bull; SECURITY AUDIT REPORT
                </span>
                <h1 className="text-2xl font-extrabold text-white print:text-gray-900 tracking-tight mt-1">
                  {reportData.title}
                </h1>
                <p className="text-xs text-slate-400 print:text-gray-600 mt-1 max-w-2xl">
                  {reportData.description || 'Comprehensive evaluation of LLM agent guardrails and vulnerability resistance.'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 print:bg-gray-100 border border-slate-800 print:border-gray-200 text-xs font-mono space-y-1">
                <div><span className="text-slate-400 print:text-gray-500">Report Ref: </span><span className="text-white print:text-gray-900 font-semibold">{reportData.assessment_id}</span></div>
                <div><span className="text-slate-400 print:text-gray-500">Target Mode: </span><span className="text-purple-400 print:text-indigo-600 font-semibold">{reportData.target_mode}</span></div>
                <div><span className="text-slate-400 print:text-gray-500">Date: </span><span className="text-white print:text-gray-900">{new Date(reportData.created_at).toLocaleDateString()}</span></div>
                <div><span className="text-slate-400 print:text-gray-500">Lead Tester: </span><span className="text-white print:text-gray-900">{reportData.tester_name || 'DVLA Auditor'}</span></div>
              </div>
            </div>
          </div>

          {/* Executive Summary Metrics */}
          <div>
            <h3 className="text-xs font-mono font-bold uppercase text-slate-400 print:text-gray-600 tracking-wider mb-3">
              EXECUTIVE SUMMARY & SCORECARD
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/60 print:bg-gray-50 border border-slate-800 print:border-gray-200">
                <span className="text-[11px] text-slate-400 print:text-gray-500 font-mono">TOTAL TESTS</span>
                <p className="text-2xl font-bold font-mono text-white print:text-gray-900 mt-1">
                  {reportData.summary.total_tests}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 print:bg-gray-50 border border-slate-800 print:border-gray-200">
                <span className="text-[11px] text-emerald-400 print:text-green-600 font-mono">PASS RATE</span>
                <p className="text-2xl font-bold font-mono text-emerald-400 print:text-green-600 mt-1">
                  {reportData.summary.pass_rate_percentage}%
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 print:bg-gray-50 border border-slate-800 print:border-gray-200">
                <span className="text-[11px] text-rose-400 print:text-red-600 font-mono">CRITICAL FINDINGS</span>
                <p className="text-2xl font-bold font-mono text-rose-400 print:text-red-600 mt-1">
                  {reportData.summary.risk_counts.Critical}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 print:bg-gray-50 border border-slate-800 print:border-gray-200">
                <span className="text-[11px] text-amber-400 print:text-orange-600 font-mono">HIGH FINDINGS</span>
                <p className="text-2xl font-bold font-mono text-amber-400 print:text-orange-600 mt-1">
                  {reportData.summary.risk_counts.High}
                </p>
              </div>
            </div>
          </div>

          {/* Categories Covered */}
          <div>
            <h3 className="text-xs font-mono font-bold uppercase text-slate-400 print:text-gray-600 tracking-wider mb-2">
              THREAT CATEGORIES COVERED ({reportData.summary.categories_covered?.length || 0})
            </h3>
            <div className="flex flex-wrap gap-2">
              {reportData.summary.categories_covered?.map((cat: string) => (
                <span
                  key={cat}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono bg-purple-950/40 text-purple-300 border border-purple-800/40 print:bg-gray-100 print:text-gray-800 print:border-gray-300"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>

          {/* Test Case Execution Audit Matrix */}
          <div>
            <h3 className="text-xs font-mono font-bold uppercase text-slate-400 print:text-gray-600 tracking-wider mb-3">
              TEST CASE EXECUTION AUDIT TABLE
            </h3>

            <div className="border border-slate-800 print:border-gray-300 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 print:bg-gray-100 border-b border-slate-800 print:border-gray-300 text-slate-400 print:text-gray-700 font-mono">
                  <tr>
                    <th className="p-3">Test Case</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Risk</th>
                    <th className="p-3">Evaluator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-gray-200">
                  {reportData.results?.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-900/30">
                      <td className="p-3 font-medium text-slate-200 print:text-gray-900">
                        {r.test_title || 'Benchmark Test'}
                      </td>
                      <td className="p-3 text-slate-400 print:text-gray-600 font-mono">{r.category}</td>
                      <td className="p-3">
                        <StatusBadge status={r.result_status} />
                      </td>
                      <td className="p-3">
                        <RiskBadge level={r.risk_level} />
                      </td>
                      <td className="p-3 text-slate-400 print:text-gray-600 font-mono text-[11px]">
                        {r.evaluation_method}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Findings & Remediation Guidance */}
          <div>
            <h3 className="text-xs font-mono font-bold uppercase text-slate-400 print:text-gray-600 tracking-wider mb-3">
              IDENTIFIED VULNERABILITIES & REMEDIATION RECOMMENDATIONS
            </h3>

            {reportData.findings?.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/30 text-xs text-emerald-400">
                No vulnerabilities were identified during this assessment run.
              </div>
            ) : (
              <div className="space-y-4">
                {reportData.findings?.map((f: any, idx: number) => (
                  <div
                    key={f.id}
                    className="p-5 rounded-xl bg-slate-900/70 print:bg-gray-50 border border-slate-800 print:border-gray-200 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-400">#{idx + 1}</span>
                        <RiskBadge level={f.risk_level} />
                        <span className="text-xs font-bold text-white print:text-gray-900">
                          {f.category}: {f.description}
                        </span>
                      </div>
                      <StatusBadge status={f.status} />
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950 print:bg-gray-100 border border-slate-800 print:border-gray-200 font-mono text-xs text-amber-300 print:text-red-700">
                      <span className="text-slate-500 select-none">Evidence: </span>
                      {f.evidence}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-slate-950/40 print:bg-white border border-slate-800 print:border-gray-200">
                        <span className="font-semibold text-rose-300 print:text-red-600 block mb-1">Impact:</span>
                        <p className="text-slate-300 print:text-gray-700">{f.potential_impact}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-cyan-950/20 print:bg-white border border-cyan-900/30 print:border-gray-200">
                        <span className="font-semibold text-cyan-300 print:text-indigo-600 block mb-1">OWASP Mitigation:</span>
                        <p className="text-slate-300 print:text-gray-700">{f.remediation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Evaluation Methodology & Limitations Disclaimer */}
          <div className="p-4 rounded-xl bg-slate-950/80 print:bg-gray-100 border border-slate-800 print:border-gray-300 text-xs space-y-1">
            <span className="font-semibold text-slate-300 print:text-gray-900 font-mono flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              EVALUATION METHODOLOGY & SANDBOX LIMITATIONS
            </span>
            <p className="text-slate-400 print:text-gray-600 leading-relaxed">
              {reportData.limitations_statement}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
