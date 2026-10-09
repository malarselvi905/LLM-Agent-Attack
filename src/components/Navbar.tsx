import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Bell,
  LogOut,
  User as UserIcon,
  Shield,
  PlusCircle,
  ExternalLink,
  ChevronDown,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { User } from '../api/client';

interface NavbarProps {
  onOpenMobile: () => void;
  user: User | null;
  onLogout: () => void;
  onNavigate: (tab: string) => void;
  currentTab: string;
}

export function Navbar({ onOpenMobile, user, onLogout, onNavigate, currentTab }: NavbarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifyRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (notifyRef.current && !notifyRef.current.contains(event.target as Node)) {
        setNotifyOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Security Overview';
      case 'lab': return 'Interactive Testing Lab';
      case 'new-assessment': return 'New Security Assessment';
      case 'assessments': return 'Assessment Records';
      case 'test-cases': return 'Vulnerability Test Case Library';
      case 'findings': return 'Findings & Risk Analysis';
      case 'reports': return 'Assessment Reports & Compliance';
      case 'audit-logs': return 'Security Audit Trail';
      case 'admin': return 'Administrator Console';
      case 'profile': return 'User Profile & Settings';
      case 'docs': return 'Architecture & Security Guide';
      default: return 'Security Lab';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0b101e]/90 backdrop-blur-md border-b border-purple-900/20 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-slate-100 tracking-tight">
            {getPageTitle(currentTab)}
          </h1>
          <p className="text-[11px] text-slate-400 hidden sm:block font-mono">
            LLM Agent Attack Lab &bull; Educational Vulnerability Platform
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick New Assessment Action */}
        <button
          onClick={() => onNavigate('new-assessment')}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xs shadow-purple-900/30 transition-all cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Audit</span>
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifyRef}>
          <button
            onClick={() => setNotifyOpen(!notifyOpen)}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 relative transition-colors"
            title="Security Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          </button>

          {notifyOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-[#0f172a] border border-purple-900/30 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="text-xs font-semibold text-slate-200">Security Alerts</span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded">Active Lab</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-900/40 flex gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-rose-300">Canary Disclosure Detected</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Prompt injection test tc_pi_01 leaked synthetic canary secret in sample run.</p>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800 flex gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-300">Environment Ready</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Dual mock simulation engines & Gemini proxy initialized.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-[#0e1424] rounded-[6px] flex items-center justify-center text-xs font-bold text-white">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
            <div className="text-left hidden md:block">
              <span className="block text-xs font-medium text-slate-200 leading-tight">
                {user?.name || 'Tester'}
              </span>
              <span className="block text-[10px] text-purple-400 font-mono leading-tight uppercase">
                {user?.role}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#0f172a] border border-purple-900/30 shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate font-mono">{user?.email}</p>
              </div>

              <button
                onClick={() => {
                  onNavigate('profile');
                  setProfileOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
              >
                <UserIcon className="w-3.5 h-3.5 text-purple-400" />
                <span>Profile & Password</span>
              </button>

              {user?.role === 'admin' && (
                <button
                  onClick={() => {
                    onNavigate('admin');
                    setProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-rose-400" />
                  <span>Admin Console</span>
                </button>
              )}

              <button
                onClick={() => {
                  onNavigate('docs');
                  setProfileOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                <span>Documentation</span>
              </button>

              <div className="my-1 border-t border-slate-800/80" />

              <button
                onClick={() => {
                  setProfileOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
