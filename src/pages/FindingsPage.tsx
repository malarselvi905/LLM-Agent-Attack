import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Filter,
  CheckCircle,
  Clock,
  Shield,
  Layers,
  Search,
  ExternalLink,
  ChevronRight,
  Info,
  Copy,
  Check
} from 'lucide-react';
import { api, Finding } from '../api/client';
import { RiskBadge, StatusBadge } from '../components/Badge';

interface FindingsPageProps {
  onNavigate: (tab: string, param?: string) => void;
}

export function FindingsPage({ onNavigate }: FindingsPageProps) {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [selectedRisk, setSelectedRisk] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeFinding, setActiveFinding] = useState<Finding | null>(null);
  const [copied, setCopied] = useState(false);

  const categories = [
    'All',
    'Prompt Injection',
    'Jailbreak Resistance',
    'Sensitive Data Leakage',
    'Insecure Tool Usage',
    'System Prompt Disclosure',
    'Excessive Agency',
    'Output Validation',
    'Indirect Prompt Injection',
  ];

  const statuses = ['All', 'Open', 'In Progress', 'Resolved', 'Accepted Risk'];
  const risks = ['All', 'Critical', 'High', 'Medium', 'Low'];

  const fetchFindings = async () => {
    try {
      setLoading(true);
      const res = await api.getFindings({
        risk_level: selectedRisk !== 'All' ? selectedRisk : undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
      });
      setFindings(res.findings);
      if (res.findings.length > 0 && !activeFinding) {
        setActiveFinding(res.findings[0]);
      }
    } catch (err: any) {
      console.error('Failed to load findings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFindings();
  }, [selectedRisk, selectedCategory, selectedStatus]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setUpdatingId(id);
      await api.updateFindingStatus(id, newStatus);
      setFindings((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: newStatus as any } : f))
      );
      if (activeFinding && activeFinding.id === id) {
        setActiveFinding({ ...activeFinding, status: newStatus as any });
      }
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = findings.filter(
    (f) =>
      f.description.toLowerCase().includes(search.toLowerCase()) ||
      f.evidence.toLowerCase().includes(search.toLowerCase()) ||
      f.category.toLowerCase().includes(search.toLowerCase())
  );

  const copyEvidence = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-purple-900/20">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Vulnerability Analysis</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Findings & Risk Scoring</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Triage identified vulnerabilities, inspect heuristic evidence, and update remediation status.
          </p>
        </div>

        {/* Disclaimer Note */}
        <div className="px-3 py-1.5 rounded-lg bg-indigo-950/30 border border-indigo-900/40 text-[11px] text-indigo-300 max-w-sm flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Educational indicators only &bull; Non-formal security certification.</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search findings by description, evidence, or category..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0e1628]/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-purple-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {/* Risk Level Filter */}
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#0e1628]/80 border border-slate-800 text-xs text-slate-300 focus:outline-hidden focus:border-purple-500"
          >
            {risks.map((r) => (
              <option key={r} value={r}>Risk: {r}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#0e1628]/80 border border-slate-800 text-xs text-slate-300 focus:outline-hidden focus:border-purple-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>Category: {c}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#0e1628]/80 border border-slate-800 text-xs text-slate-300 focus:outline-hidden focus:border-purple-500"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>Status: {s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main 2-Column Findings Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Findings List (5 cols) */}
        <div className="lg:col-span-5 space-y-2.5 max-h-[750px] overflow-y-auto custom-scrollbar pr-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-mono text-slate-400">Loading findings...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center rounded-xl bg-[#0e1628]/50 border border-slate-800 p-6 space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-xs font-semibold text-slate-300">No findings match criteria</p>
              <p className="text-[11px] text-slate-500">All tests in this view either passed or had no findings.</p>
            </div>
          ) : (
            filtered.map((f) => {
              const isSelected = activeFinding?.id === f.id;
              return (
                <div
                  key={f.id}
                  onClick={() => setActiveFinding(f)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500/60 shadow-md shadow-purple-900/20'
                      : 'bg-[#0e1628]/80 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <RiskBadge level={f.risk_level} />
                    <StatusBadge status={f.status} />
                  </div>
                  <h4 className="text-xs font-semibold text-white line-clamp-1">{f.description}</h4>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400 font-mono">
                    <span className="truncate">{f.category}</span>
                    <span className="shrink-0">{new Date(f.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Finding Detail Drawer (7 cols) */}
        <div className="lg:col-span-7">
          {activeFinding ? (
            <div className="p-6 rounded-2xl bg-[#0e1628]/90 border border-slate-800 space-y-5 sticky top-20">
              {/* Finding Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <RiskBadge level={activeFinding.risk_level} />
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">
                      {activeFinding.category}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      ID: {activeFinding.id}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">
                    {activeFinding.description}
                  </h3>
                  {activeFinding.assessment_title && (
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <span>Source Audit:</span>
                      <button
                        onClick={() => onNavigate('assessments', activeFinding.assessment_id)}
                        className="text-purple-400 hover:underline flex items-center gap-0.5 font-medium"
                      >
                        <span>{activeFinding.assessment_title}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </p>
                  )}
                </div>

                {/* Status Updater */}
                <div className="shrink-0">
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                    RESOLUTION STATUS
                  </label>
                  <select
                    value={activeFinding.status}
                    disabled={updatingId === activeFinding.id}
                    onChange={(e) => handleStatusChange(activeFinding.id, e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-medium text-slate-200 focus:outline-hidden focus:border-purple-500 cursor-pointer"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Accepted Risk">Accepted Risk</option>
                  </select>
                </div>
              </div>

              {/* Evidence Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-300 font-mono">
                    CAPTURED HEURISTIC EVIDENCE EXCERPT
                  </span>
                  <button
                    onClick={() => copyEvidence(activeFinding.evidence)}
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-amber-300 whitespace-pre-wrap">
                  {activeFinding.evidence}
                </div>
              </div>

              {/* Potential Impact */}
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/30 text-xs space-y-1">
                <span className="font-semibold text-rose-300 font-mono block">
                  POTENTIAL SECURITY IMPACT:
                </span>
                <p className="text-slate-300 leading-relaxed">{activeFinding.potential_impact}</p>
              </div>

              {/* Recommended Mitigation */}
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-900/30 text-xs space-y-1">
                <span className="font-semibold text-cyan-300 font-mono block">
                  RECOMMENDED REMEDIATION & DEFENSE (OWASP):
                </span>
                <p className="text-slate-300 leading-relaxed">{activeFinding.remediation}</p>
              </div>

              {/* Timestamp footer */}
              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono flex items-center justify-between">
                <span>Created: {new Date(activeFinding.created_at).toLocaleString()}</span>
                <span>Assessment Ref: {activeFinding.assessment_id}</span>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-[#0e1628]/50 border border-slate-800 text-slate-400 text-xs font-mono">
              Select a vulnerability finding from the left panel to inspect details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
