import React from 'react';
import {
  LayoutDashboard,
  CheckCircle2,
  CalendarDays,
  ScrollText,
  Settings as SettingsIcon,
  Bot,
  LogOut,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'approvals' | 'calendar' | 'logs' | 'settings';

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role?: string;
}

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingCount: number;
  googleConnected?: boolean;
  user?: AuthUser | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  pendingCount,
  googleConnected: _googleConnected,
  user,
  onLogout,
}) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Overview', icon: LayoutDashboard },
    {
      id: 'approvals' as NavTab,
      label: 'Approvals',
      icon: CheckCircle2,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    { id: 'calendar' as NavTab, label: 'Schedule & Tasks', icon: CalendarDays },
    { id: 'logs' as NavTab, label: 'Activity Logs', icon: ScrollText },
    { id: 'settings' as NavTab, label: 'Settings', icon: SettingsIcon },
  ];

  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'EX';
  };

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile/tablet < 1024px) */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-slate-900/95 backdrop-blur border-r border-slate-800/80 p-5 shrink-0 justify-between select-none">
        <div className="space-y-6">
          {/* Brand header */}
          <div className="flex items-center gap-3 px-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/25 shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-sm tracking-tight text-white truncate">Assistant OS</h1>
              <p className="text-[11px] text-slate-400 font-medium truncate">Executive Real Estate</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-150 group ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-300 font-semibold border border-sky-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-amber-500/20 text-amber-300 text-[11px] px-2 py-0.5 rounded-full font-bold border border-amber-500/30 shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Seamless Integrated User Profile & Logout */}
        <div className="pt-3.5 mt-auto border-t border-white/[0.08]">
          {user && (
            <div className="p-2 rounded-lg hover:bg-zinc-800/40 transition-colors flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-lg object-cover border border-white/[0.1] shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center border border-sky-500/30 shrink-0">
                    {getInitials(user.name, user.email)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-200 truncate leading-tight">
                    {user.name || 'User'}
                  </p>
                  <p className="text-[10px] text-zinc-400 truncate leading-tight mt-0.5">
                    {user.email}
                  </p>
                </div>
              </div>

              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Sign out"
                  aria-label="Sign out"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Mobile / Tablet Top Header (screen < 1024px) */}
      <header className="lg:hidden flex items-center justify-between px-4 py-2.5 bg-slate-900/95 backdrop-blur border-b border-slate-800 sticky top-0 z-30 min-h-[52px]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md shrink-0">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-xs text-white block leading-tight">Assistant OS</span>
            {user && (
              <span className="text-[10px] text-slate-400 block leading-tight truncate max-w-[150px]">
                {user.name}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <button
              onClick={() => onSelectTab('approvals')}
              className="px-2.5 py-1 min-h-[36px] bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs rounded-full font-semibold flex items-center gap-1.5 active:scale-95"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              {pendingCount} Pending
            </button>
          )}

          {user && onLogout && (
            <button
              onClick={onLogout}
              aria-label="Sign out"
              title="Sign out"
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-rose-400 transition-colors rounded-lg"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Mobile / Tablet Bottom Navigation Bar (screen < 1024px) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 px-1 py-1 z-30 flex justify-around items-center min-h-[56px] shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`mobile-nav-item-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 min-h-[48px] rounded-lg text-[10px] font-medium transition-all relative ${
                isActive
                  ? 'text-sky-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 bg-amber-500 text-slate-950 font-bold text-[9px] rounded-full flex items-center justify-center px-1 shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="truncate max-w-[64px] text-center">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
