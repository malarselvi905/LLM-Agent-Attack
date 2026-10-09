import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  PlusCircle,
  Play,
  FileText,
  Trash2,
  AlertTriangle,
  Search,
  CheckCircle,
  XCircle,
  ArrowRight,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';
import { api, Assessment } from '../api/client';
import { StatusBadge, RiskBadge } from '../components/Badge';

interface AssessmentsPageProps {
  onNavigate: (tab: string, param?: string) => void;
}

export function AssessmentsPage({ onNavigate }: AssessmentsPageProps) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAssessments();
      setAssessments(res.assessments);
    } catch (err: any) {
      setError(err.message || 'Failed to load assessments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this security assessment? All associated findings will be removed.')) {
      return;
    }
    try {
      setDeletingId(id);
      await api.deleteAssessment(id);
      setAssessments(assessments.filter((a) => a.id !== id));
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = assessments.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.description?.toLowerCase().includes(search.toLowerCase()) ||
    a.target_mode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-purple-900/20">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-1">
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>Assessment Management</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Security Assessments</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit history, benchmark runs, and target vulnerability telemetry.
          </p>
        </div>

        <button
          onClick={() => onNavigate('new-assessment')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Assessment</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assessments by title, description, or target mode..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0e1628]/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-purple-500 transition-colors"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/50 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-slate-400">Loading assessments...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-[#0e1628]/50 border border-slate-800/80 p-8 space-y-3">
          <Shield className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No assessments found</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {search ? 'Try clearing your search query.' : 'Launch your first LLM vulnerability audit to evaluate guardrails.'}
          </p>
          <button
            onClick={() => onNavigate('new-assessment')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-900/20 transition-all cursor-pointer mt-2"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create First Assessment</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((a) => {
            const total = a.total_tests || 0;
            const passed = a.passed_tests || 0;
            const failed = a.failed_tests || 0;
            const findings = a.findings_count || 0;
            const passPercent = total > 0 ? Math.round((passed / total) * 100) : 0;

            return (
              <div
                key={a.id}
                className="p-5 rounded-xl bg-[#0e1628]/80 border border-slate-800/80 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      {a.target_mode}
                    </span>
                    <StatusBadge status={a.status} />
                  </div>

                  <h3 className="text-sm font-bold text-white line-clamp-1">{a.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {a.description || 'No additional description provided.'}
                  </p>
                </div>

                {/* Metrics bar */}
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Security Pass Rate:</span>
                    <span className={passPercent === 100 ? 'text-emerald-400 font-bold' : 'text-slate-200'}>
                      {passPercent}% ({passed}/{total} passed)
                    </span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden flex">
                    <div className="bg-emerald-500 h-full" style={{ width: `${passPercent}%` }} />
                    <div className="bg-rose-500 h-full" style={{ width: `${100 - passPercent}%` }} />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>{failed} Vulnerabilities Failed</span>
                    <span className="text-amber-400 font-medium">{findings} Findings</span>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(a.created_at).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigate('reports', a.id)}
                      className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="View Report"
                    >
                      <FileText className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(a.id)}
                      disabled={deletingId === a.id}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Delete Assessment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onNavigate('assessments', a.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-medium transition-colors cursor-pointer"
                    >
                      <span>Inspect</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
