import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, NavTab, AuthUser } from './components/Navbar.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { ApprovalsPage } from './pages/ApprovalsPage.js';
import { CalendarTasksPage } from './pages/CalendarTasksPage.js';
import { LogsPage } from './pages/LogsPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { PendingItem } from './components/ApprovalCard.js';
import { api } from './lib/api.js';
import { Bot, AlertCircle, ExternalLink } from 'lucide-react';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [googleConnected, setGoogleConnected] = useState(false);

  // Authenticate user via httpOnly cookie or token param on mount
  const checkAuth = useCallback(async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get('token');
      if (tokenFromUrl) {
        localStorage.setItem('assistant_token', tokenFromUrl);
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const res = await api.get('/auth/me');
      if (res.data?.user) {
        setCurrentUser(res.data.user);
        setGoogleConnected(Boolean(res.data.googleConnected));
        if (res.data.token) {
          localStorage.setItem('assistant_token', res.data.token);
        }
      } else {
        setCurrentUser(null);
      }
    } catch (err: any) {
      setCurrentUser(null);
      localStorage.removeItem('assistant_token');
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const fetchApprovals = useCallback(async () => {
    if (!currentUser) return;
    try {
      const approvalsRes = await api.get('/approvals');
      setPendingItems(approvalsRes.data || []);
    } catch (err) {
      console.error('Failed to fetch approvals', err);
    }
  }, [currentUser]);

  const refreshUserData = useCallback(async () => {
    try {
      const [meRes, approvalsRes] = await Promise.allSettled([
        api.get('/auth/me'),
        api.get('/approvals'),
      ]);

      if (meRes.status === 'fulfilled' && meRes.value.data?.user) {
        setCurrentUser(meRes.value.data.user);
        setGoogleConnected(Boolean(meRes.value.data.googleConnected));
      }
      if (approvalsRes.status === 'fulfilled') {
        setPendingItems(approvalsRes.value.data || []);
      }
    } catch (err) {
      console.error('Refresh failed', err);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!currentUser) return;
    fetchApprovals();

    // Poll approvals every 10 seconds for real-time sync with Telegram/WhatsApp
    const interval = setInterval(fetchApprovals, 10000);
    return () => clearInterval(interval);
  }, [currentUser, fetchApprovals]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      localStorage.removeItem('assistant_token');
      setCurrentUser(null);
      setPendingItems([]);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/approvals/${id}/approve`);
      await refreshUserData();
    } catch (err: any) {
      alert(`Approval error: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleReject = async (id: string, reason?: string) => {
    try {
      await api.post(`/approvals/${id}/reject`, { reason });
      await refreshUserData();
    } catch (err: any) {
      alert(`Rejection error: ${err.response?.data?.error || err.message}`);
    }
  };

  // 1. Loading Splash Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 mb-4 animate-pulse">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <p className="text-sm font-semibold text-white">Initializing Assistant OS...</p>
        <p className="text-xs text-slate-400 mt-1">Verifying secure encrypted session</p>
      </div>
    );
  }

  // 2. Unauthenticated -> Login Screen
  if (!currentUser) {
    return <LoginPage />;
  }

  // 3. Authenticated -> Workspace Dashboard
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-950 text-slate-100">
      {/* Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        pendingCount={pendingItems.length}
        googleConnected={googleConnected}
        user={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 lg:pb-8 overflow-y-auto">
        {/* Onboarding Banner if Google Workspace is disconnected */}
        {!googleConnected && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-amber-200">Google Workspace Disconnected</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Connect your Google account to enable live Gmail sync, Google Calendar scheduling, and Tasks.
                </p>
              </div>
            </div>
            <a
              href={`${(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')}/api/auth/google`}
              className="px-4 py-2 min-h-[40px] bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
            >
              Connect Workspace <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {currentTab === 'dashboard' && (
          <DashboardPage
            pendingItems={pendingItems}
            googleConnected={googleConnected}
            onApprove={handleApprove}
            onReject={handleReject}
            onNavigateToApprovals={() => setCurrentTab('approvals')}
            onRefresh={refreshUserData}
          />
        )}

        {currentTab === 'approvals' && (
          <ApprovalsPage
            pendingItems={pendingItems}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}

        {currentTab === 'calendar' && <CalendarTasksPage />}

        {currentTab === 'logs' && <LogsPage />}

        {currentTab === 'settings' && (
          <SettingsPage
            googleConnected={googleConnected}
            user={currentUser}
            onRefresh={refreshUserData}
            onLogout={handleLogout}
          />
        )}
      </main>
    </div>
  );
};
