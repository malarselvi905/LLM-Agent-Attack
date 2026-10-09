import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  PlusCircle,
  FileText,
  TrendingUp,
  Activity,
  Layers,
  ArrowRight,
  RefreshCw,
  Cpu
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { api, Assessment, Finding } from '../api/client';
import { RiskBadge, StatusBadge } from '../components/Badge';

interface DashboardPageProps {
  onNavigate: (tab: string, param?: string) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [recentAssessments, setRecentAssessments] = useState<Assessment[]>([]);
  const [recentFindings, setRecentFindings] = useState<Finding[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sumRes, actRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getDashboardActivity(),
      ]);
      setSummary(sumRes.summary);
      setCategories(sumRes.category_distribution);
      setTimeline(sumRes.timeline);
      setRecentAssessments(actRes.recent_assessments);
      setRecentFindings(actRes.recent_findings);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-mono text-slate-400">Loading security assessment telemetry...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-rose-950/20 border border-rose-900/30 text-rose-300 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          <span>{error}</span>
        </div>
        <button
          onClick={loadData}
          className="px-3 py-1.5 rounded-lg bg-rose-900/40 hover:bg-rose-900/60 text-xs font-medium text-white transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const s = summary || {
    total_assessments: 0,
    total_tests: 0,
    passed_tests: 0,
    failed_tests: 0,
    total_findings: 0,
    critical_count: 0,
    high_risk_count: 0,
    medium_count: 0,
    low_count: 0,
  };

  return (
    <div className="space-y-6">
      {/* Hero Quick Action Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-[#0e1628] border border-purple-900/30 p-6 sm:p-8">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-mono mb-3">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>OWASP Top 10 for Large Language Models</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            LLM Agent Attack Lab &bull; Security Evaluation Sandbox
          </h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Safely test, simulate, and analyze vulnerabilities in Large Language Model agents—including Prompt Injection, Data Leakage, Insecure Tool Usage, and Excessive Agency in an isolated sandbox.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <button
              onClick={() => onNavigate('lab')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-900/20 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Interactive Testing Lab</span>
            </button>
            <button
              onClick={() => onNavigate('new-assessment')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20 transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Start Assessment</span>
            </button>
            <button
              onClick={() => onNavigate('test-cases')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/50 transition-all cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Explore 12+ Predefined Tests</span>
            </button>
          </div>
        </div>

        {/* Ambient background glows */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 bottom-0 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Tests Executed */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#0e1628]/80 border border-slate-800/80 shadow-xs hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Security Tests</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-white mt-2">
            {s.total_tests}
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-2 font-mono">
            <span>Across {s.total_assessments} assessment run{s.total_assessments === 1 ? '' : 's'}</span>
          </div>
        </div>

        {/* Card 2: Passed Tests */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#0e1628]/80 border border-slate-800/80 shadow-xs hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Passed / Defended</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 mt-2">
            {s.passed_tests}
          </p>
          <div className="text-xs text-slate-400 mt-2 font-mono">
            {s.total_tests > 0
              ? `${Math.round((s.passed_tests / s.total_tests) * 100)}% Pass Rate`
              : 'No test runs yet'}
          </div>
        </div>

        {/* Card 3: Failed Tests */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#0e1628]/80 border border-slate-800/80 shadow-xs hover:border-rose-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Failed / Breached</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-rose-400 mt-2">
            {s.failed_tests}
          </p>
          <div className="text-xs text-slate-400 mt-2 font-mono">
            {s.total_tests > 0
              ? `${Math.round((s.failed_tests / s.total_tests) * 100)}% Vulnerability Rate`
              : '0% Failures'}
          </div>
        </div>

        {/* Card 4: Critical & High Findings */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#0e1628]/80 border border-slate-800/80 shadow-xs hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">High & Critical Risks</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-amber-400 mt-2">
            {s.high_risk_count}
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-2 font-mono">
            <span className="text-rose-400 font-semibold">{s.critical_count} Critical</span>
            <span>&bull;</span>
            <span className="text-amber-400 font-semibold">{s.high_risk_count - s.critical_count} High</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Vulnerability Category Distribution */}
        <div className="p-5 rounded-xl bg-[#0e1628]/80 border border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Vulnerabilities by Category</h3>
              <p className="text-xs text-slate-400">OWASP LLM threat vector frequencies</p>
            </div>
            <span className="text-xs font-mono text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/30">
              {categories.length} Categories
            </span>
          </div>

          {categories.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-4">
              <Layers className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs text-slate-400">No vulnerability findings recorded yet.</p>
              <button
                onClick={() => onNavigate('lab')}
                className="mt-3 text-xs text-cyan-400 hover:underline"
              >
                Run a simulation test in the Lab &rarr;
              </button>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categories} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="category" type="category" stroke="#64748b" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#c084fc' }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 2: Test Results Over Time */}
        <div className="p-5 rounded-xl bg-[#0e1628]/80 border border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Execution Timeline</h3>
              <p className="text-xs text-slate-400">Passed vs Failed evaluations over time</p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/30">
              Daily Trends
            </span>
          </div>

          {timeline.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-4">
              <TrendingUp className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs text-slate-400">No execution timeline data yet.</p>
              <button
                onClick={() => onNavigate('new-assessment')}
                className="mt-3 text-xs text-purple-400 hover:underline"
              >
                Create and run your first assessment &rarr;
              </button>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="passedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="failedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="passed" stroke="#10b981" fillOpacity={1} fill="url(#passedGrad)" name="Passed" />
                  <Area type="monotone" dataKey="failed" stroke="#f43f5e" fillOpacity={1} fill="url(#failedGrad)" name="Failed" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Tables Section: Recent Assessments and High Risk Findings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Assessments */}
        <div className="p-5 rounded-xl bg-[#0e1628]/80 border border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Recent Assessments</h3>
            <button
              onClick={() => onNavigate('assessments')}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentAssessments.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 font-mono">
              No assessments recorded yet. Click "Start Assessment" to begin.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentAssessments.map((a) => (
                <div
                  key={a.id}
                  onClick={() => onNavigate('assessments', a.id)}
                  className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-xs font-semibold text-slate-200 truncate">{a.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
                      <span>Target: {a.target_mode}</span>
                      <span>&bull;</span>
                      <span>{a.total_tests || 0} tests</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={a.status} />
                    <span className="text-slate-500 text-xs">&rarr;</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Latest Security Findings */}
        <div className="p-5 rounded-xl bg-[#0e1628]/80 border border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Latest Security Findings</h3>
            <button
              onClick={() => onNavigate('findings')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              <span>View All Findings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentFindings.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 font-mono">
              No security findings recorded yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentFindings.map((f) => (
                <div
                  key={f.id}
                  onClick={() => onNavigate('findings')}
                  className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <RiskBadge level={f.risk_level} />
                      <span className="text-xs font-medium text-slate-300 truncate">{f.category}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{f.description}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <StatusBadge status={f.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
