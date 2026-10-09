import React, { useState, useEffect } from 'react';
import { authStorage, User, api } from './api/client';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { LabPage } from './pages/LabPage';
import { NewAssessmentPage } from './pages/NewAssessmentPage';
import { AssessmentsPage } from './pages/AssessmentsPage';
import { AssessmentDetailsPage } from './pages/AssessmentDetailsPage';
import { TestCasesPage } from './pages/TestCasesPage';
import { FindingsPage } from './pages/FindingsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { AdminPage } from './pages/AdminPage';
import { ProfilePage } from './pages/ProfilePage';
import { DocsPage } from './pages/DocsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => authStorage.getUser());
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [tabParam, setTabParam] = useState<string | undefined>(undefined);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // Verify auth on launch
  useEffect(() => {
    async function verifySession() {
      const token = authStorage.getToken();
      if (!token) {
        setCurrentUser(null);
        setAuthChecking(false);
        return;
      }
      try {
        const res = await api.getMe();
        setCurrentUser(res.user);
        authStorage.setUser(res.user);
      } catch (err) {
        authStorage.clear();
        setCurrentUser(null);
      } finally {
        setAuthChecking(false);
      }
    }

    verifySession();

    const handleAuthExpired = () => {
      setCurrentUser(null);
      setAuthView('login');
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    } finally {
      authStorage.clear();
      setCurrentUser(null);
      setAuthView('login');
    }
  };

  const handleNavigate = (tab: string, param?: string) => {
    setCurrentTab(tab);
    setTabParam(param);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono text-slate-400">Initializing DVLA Security Environment...</p>
      </div>
    );
  }

  // Unauthenticated Flow
  if (!currentUser) {
    if (authView === 'register') {
      return (
        <RegisterPage
          onRegisterSuccess={(u) => {
            setCurrentUser(u);
            setCurrentTab('dashboard');
          }}
          onNavigateToLogin={() => setAuthView('login')}
        />
      );
    }
    return (
      <LoginPage
        onLoginSuccess={(u) => {
          setCurrentUser(u);
          setCurrentTab('dashboard');
        }}
        onNavigateToRegister={() => setAuthView('register')}
      />
    );
  }

  // Authenticated Main Dashboard Layout
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => handleNavigate(tab)}
        user={currentUser}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Navbar
          onOpenMobile={() => setMobileOpen(true)}
          user={currentUser}
          onLogout={handleLogout}
          onNavigate={(tab) => handleNavigate(tab)}
          currentTab={currentTab}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardPage onNavigate={handleNavigate} />
          )}

          {currentTab === 'lab' && (
            <LabPage />
          )}

          {currentTab === 'new-assessment' && (
            <NewAssessmentPage onNavigate={handleNavigate} />
          )}

          {currentTab === 'assessments' && (
            tabParam ? (
              <AssessmentDetailsPage id={tabParam} onNavigate={handleNavigate} />
            ) : (
              <AssessmentsPage onNavigate={handleNavigate} />
            )
          )}

          {currentTab === 'test-cases' && (
            <TestCasesPage />
          )}

          {currentTab === 'findings' && (
            <FindingsPage onNavigate={handleNavigate} />
          )}

          {currentTab === 'reports' && (
            <ReportsPage initialAssessmentId={tabParam} onNavigate={handleNavigate} />
          )}

          {currentTab === 'audit-logs' && (
            <AuditLogsPage />
          )}

          {currentTab === 'admin' && (
            <AdminPage />
          )}

          {currentTab === 'profile' && (
            <ProfilePage user={currentUser} onLogout={handleLogout} />
          )}

          {currentTab === 'docs' && (
            <DocsPage />
          )}
        </main>

        <footer className="py-4 px-6 border-t border-purple-900/10 text-center text-[11px] font-mono text-slate-500">
          <span>LLM Agent Attack Lab (DVLA) &bull; Controlled Sandbox &bull; OWASP Top 10 for LLM Applications</span>
        </footer>
      </div>
    </div>
  );
}
