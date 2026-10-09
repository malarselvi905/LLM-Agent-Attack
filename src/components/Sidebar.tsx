import React from 'react';
import {
  LayoutDashboard,
  FlaskConical,
  PlusCircle,
  FolderGit2,
  Library,
  AlertTriangle,
  FileText,
  History,
  ShieldCheck,
  User,
  BookOpen,
  X,
  Radio,
  Cpu
} from 'lucide-react';
import { User as UserType } from '../api/client';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  user: UserType | null;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ currentTab, onSelectTab, user, mobileOpen, onCloseMobile }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'lab', label: 'Testing Lab', icon: FlaskConical, badge: 'Live' },
    { id: 'new-assessment', label: 'New Assessment', icon: PlusCircle },
    { id: 'assessments', label: 'Assessments', icon: FolderGit2 },
    { id: 'test-cases', label: 'Test Case Library', icon: Library },
    { id: 'findings', label: 'Findings & Risk', icon: AlertTriangle },
    { id: 'reports', label: 'Reports & Export', icon: FileText },
    { id: 'audit-logs', label: 'Audit Logs', icon: History },
    ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Admin Panel', icon: ShieldCheck, adminOnly: true }] : []),
    { id: 'profile', label: 'Profile & Settings', icon: User },
    { id: 'docs', label: 'Architecture & Docs', icon: BookOpen },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0e1424] border-r border-purple-900/20 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-purple-900/20 bg-[#0a0e1a]/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-purple-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#0a0e1a] rounded-[7px] flex items-center justify-center">
                <Cpu className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold tracking-wider text-sm text-white">DVLA</span>
                <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  LAB
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate font-mono">LLM Attack Sandbox</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sandbox Status Banner */}
        <div className="px-4 py-2.5 mx-3 mt-3 rounded-lg bg-cyan-950/30 border border-cyan-800/30 flex items-center gap-2.5">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
          <div className="text-[11px] leading-tight">
            <span className="text-cyan-300 font-medium">Controlled Environment</span>
            <span className="block text-slate-400 text-[10px]">Mock & Gemini Ready</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30 shadow-xs shadow-purple-900/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-purple-400' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {item.badge}
                  </span>
                )}
                {item.adminOnly && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Admin
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Mini Profile */}
        <div className="p-3 border-t border-purple-900/20 bg-[#0a0e1a]/60">
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-slate-900/40">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-200 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate capitalize font-mono">{user?.role} Role</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
