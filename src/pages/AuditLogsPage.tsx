import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Shield,
  Clock,
  Terminal,
  RefreshCw
} from 'lucide-react';
import { api, AuditLog } from '../api/client';

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState('All');
  const [loading, setLoading] = useState(true);

  const actions = [
    'All',
    'LOGIN_SUCCESS',
    'LOGIN_FAILED_BAD_PASSWORD',
    'LOGOUT',
    'USER_REGISTERED',
    'ASSESSMENT_CREATED',
    'ASSESSMENT_EXECUTED',
    'ASSESSMENT_DELETED',
    'TEST_CASE_CREATED',
    'FINDING_STATUS_UPDATED',
    'PASSWORD_CHANGED',
    'REPORT_CSV_EXPORT',
    'PLAYGROUND_TEST_EXECUTED'
  ];

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs({
        action: selectedAction !== 'All' ? selectedAction : undefined,
        limit: 100,
      });
      setLogs(res.audit_logs);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedAction]);

  const filtered = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.details?.toLowerCase().includes(search.toLowerCase()) ||
      l.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      l.ip_address?.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-purple-900/20">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-1">
            <History className="w-3.5 h-3.5" />
            <span>Immutable Audit Trail</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Security Audit Logs</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable log of all user authentication events, test runs, and administrative changes.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, details, operator, or IP..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0e1628]/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-purple-500 transition-colors"
          />
        </div>

        <select
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[#0e1628]/80 border border-slate-800 text-xs text-slate-300 focus:outline-hidden focus:border-purple-500 w-full sm:w-auto"
        >
          {actions.map((act) => (
            <option key={act} value={act}>Action: {act}</option>
          ))}
        </select>
      </div>

      {/* Logs Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0e1628]/80 overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono text-slate-400">Loading audit trail...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-slate-500">
            No audit records match your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-mono">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">Resource</th>
                  <th className="p-3">Details</th>
                  <th className="p-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-900/40">
                    <td className="p-3 text-slate-400 whitespace-nowrap">
                      {new Date(l.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          l.action.includes('FAILED')
                            ? 'bg-rose-950/60 text-rose-300 border border-rose-900/50'
                            : l.action.includes('SUCCESS') || l.action.includes('EXECUTED')
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-900/50'
                            : 'bg-purple-950/60 text-purple-300 border border-purple-900/50'
                        }`}
                      >
                        {l.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-200 whitespace-nowrap">
                      {l.user_email || 'Anonymous / System'}
                    </td>
                    <td className="p-3 text-slate-400 whitespace-nowrap">
                      {l.resource_type} {l.resource_id ? `(${l.resource_id.substring(0, 8)}...)` : ''}
                    </td>
                    <td className="p-3 text-slate-300 max-w-xs truncate" title={l.details || ''}>
                      {l.details || '-'}
                    </td>
                    <td className="p-3 text-slate-500 whitespace-nowrap">
                      {l.ip_address || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
