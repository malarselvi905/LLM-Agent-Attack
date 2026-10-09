import React, { useState } from 'react';
import {
  User as UserIcon,
  Key,
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  Lock
} from 'lucide-react';
import { api, User } from '../api/client';

interface ProfilePageProps {
  user: User | null;
  onLogout: () => void;
}

export function ProfilePage({ user, onLogout }: ProfilePageProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setError('Both current and new passwords are required.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setSuccess('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-purple-900/20">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-1">
          <UserIcon className="w-3.5 h-3.5" />
          <span>Security Profile</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">User Account & Settings</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage tester credentials, privilege level, and session authorization.
        </p>
      </div>

      {/* Profile Details Card */}
      <div className="p-6 rounded-2xl bg-[#0e1628]/80 border border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wide">
          OPERATOR CREDENTIALS
        </h3>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-0.5 flex items-center justify-center">
            <div className="w-full h-full bg-[#0a0e1a] rounded-[14px] flex items-center justify-center text-xl font-bold text-white">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
          <div>
            <h4 className="text-base font-bold text-white">{user?.name}</h4>
            <p className="text-xs text-slate-400 font-mono">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">
                ROLE: {user?.role}
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                ACTIVE SESSION
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 text-xs font-mono text-slate-400">
          <div>
            <span className="text-slate-500 block">User Identifier:</span>
            <span className="text-slate-300">{user?.id}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Authorization Method:</span>
            <span className="text-slate-300">JWT Token (HMAC-SHA256, 8h expiry)</span>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="p-6 rounded-2xl bg-[#0e1628]/80 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wide">
            CHANGE ACCOUNT PASSWORD
          </h3>
        </div>

        {success && (
          <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-900/50 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/50 text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 font-mono mb-1">
              CURRENT PASSWORD *
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-hidden focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 font-mono mb-1">
                NEW PASSWORD (MIN 8 CHARS) *
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-hidden focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 font-mono mb-1">
                CONFIRM NEW PASSWORD *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-hidden focus:border-purple-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-900/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
