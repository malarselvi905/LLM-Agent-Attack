import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Database,
  Cpu,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  UserCheck,
  UserX,
  Sparkles
} from 'lucide-react';
import { api } from '../api/client';

export function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [uRes, sRes] = await Promise.all([
        api.getAdminUsers(),
        api.getAdminStats(),
      ]);
      setUsers(uRes.users);
      setStats(sRes.stats);
    } catch (err: any) {
      setError(err.message || 'Failed to load administrator controls.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await api.updateAdminUserRole(userId, newRole);
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      setMessage(`Updated user role to ${newRole}.`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert('Role update failed: ' + err.message);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? false : true;
    try {
      await api.updateAdminUserStatus(userId, newStatus);
      setUsers(users.map((u) => (u.id === userId ? { ...u, is_active: newStatus ? 1 : 0 } : u)));
      setMessage(`Updated user status.`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert('Status update failed: ' + err.message);
    }
  };

  const handleResetSandbox = async () => {
    if (!window.confirm('Reset/verify sandbox default accounts and benchmark tests?')) return;
    try {
      setResetting(true);
      await api.resetSandbox();
      setMessage('Sandbox verified and re-seeded successfully.');
      setTimeout(() => setMessage(null), 3000);
      await fetchAdminData();
    } catch (err: any) {
      alert('Reset failed: ' + err.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-purple-900/20">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Administrator Control Center</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">System Administration</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Role-based user access controls, system diagnostics, and sandbox provisioning.
          </p>
        </div>

        <button
          onClick={handleResetSandbox}
          disabled={resetting}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
          <span>Verify Sandbox Seeds</span>
        </button>
      </div>

      {message && (
        <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-900/50 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/50 text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* System Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#0e1628]/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-mono">TOTAL USERS</span>
            <p className="text-2xl font-bold font-mono text-white mt-1">{stats.total_users}</p>
          </div>
          <div className="p-4 rounded-xl bg-[#0e1628]/80 border border-slate-800">
            <span className="text-[11px] text-purple-400 font-mono">BENCHMARK TEST CASES</span>
            <p className="text-2xl font-bold font-mono text-purple-400 mt-1">{stats.total_test_cases}</p>
          </div>
          <div className="p-4 rounded-xl bg-[#0e1628]/80 border border-slate-800">
            <span className="text-[11px] text-cyan-400 font-mono">GEMINI API STATUS</span>
            <p className="text-sm font-bold font-mono text-cyan-300 mt-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{stats.gemini_configured ? 'API Key Active' : 'Mock Mode Active'}</span>
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#0e1628]/80 border border-slate-800">
            <span className="text-[11px] text-emerald-400 font-mono">DATABASE ENGINE</span>
            <p className="text-xs font-bold font-mono text-slate-200 mt-2 truncate">
              {stats.database_engine}
            </p>
          </div>
        </div>
      )}

      {/* User Management Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0e1628]/80 overflow-hidden space-y-2 p-5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Registered Accounts & Roles</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">{users.length} Total Accounts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-mono">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Assessments</th>
                <th className="p-3">Registered</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-900/40">
                  <td className="p-3">
                    <p className="font-semibold text-white">{u.name}</p>
                    <p className="text-slate-400 text-[10px]">{u.email}</p>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        u.role === 'admin'
                          ? 'bg-rose-950/60 text-rose-300 border border-rose-900/50'
                          : 'bg-purple-950/60 text-purple-300 border border-purple-900/50'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        u.is_active === 1
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-900/50'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {u.is_active === 1 ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300">{u.assessments_count || 0}</td>
                  <td className="p-3 text-slate-400">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      onClick={() => handleToggleRole(u.id, u.role)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition-colors"
                      title="Toggle between admin and user"
                    >
                      Set as {u.role === 'admin' ? 'User' : 'Admin'}
                    </button>
                    <button
                      onClick={() => handleToggleStatus(u.id, u.is_active)}
                      className={`px-2 py-1 rounded text-[10px] transition-colors ${
                        u.is_active === 1
                          ? 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/50'
                          : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50'
                      }`}
                    >
                      {u.is_active === 1 ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
