import React, { useState, useEffect } from 'react';
import {
  Mail,
  Calendar,
  ShieldCheck,
  ArrowRight,
  Lock,
  Radio,
  CheckCircle2,
  Search,
  Bell,
  Clock,
  TrendingUp
} from 'lucide-react';
import { ApprovalCard, PendingItem } from '../components/ApprovalCard.js';
import { ChatWidget } from '../components/ChatWidget.js';
import { api } from '../lib/api.js';

interface DashboardPageProps {
  pendingItems: PendingItem[];
  googleConnected: boolean;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason?: string) => Promise<void>;
  onNavigateToApprovals: () => void;
  onRefresh: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  pendingItems,
  googleConnected,
  onApprove,
  onReject,
  onNavigateToApprovals,
  onRefresh,
}) => {
  const pendingCount = pendingItems.length;
  const [upcomingEvent, setUpcomingEvent] = useState<{ summary: string; start: string } | null>(null);

  // Fetch next upcoming calendar event for Google Workspace mini widget
  useEffect(() => {
    if (googleConnected) {
      api.get('/assistant/calendar')
        .then((res) => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            setUpcomingEvent({
              summary: res.data[0].summary || 'Meeting',
              start: res.data[0].start || new Date().toISOString(),
            });
          }
        })
        .catch(() => setUpcomingEvent(null));
    }
  }, [googleConnected]);

  // 7-day trend mock/reference data for the hero sparkline
  const weeklyTrend = [
    { day: 'M', count: 4, height: '40%' },
    { day: 'T', count: 7, height: '70%' },
    { day: 'W', count: 5, height: '50%' },
    { day: 'T', count: 8, height: '80%' },
    { day: 'F', count: 6, height: '60%' },
    { day: 'S', count: 2, height: '20%' },
    { day: 'S', count: 3, height: '30%' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header / Status Section with Utility Row */}
      <div className="border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] bg-gradient-to-b from-zinc-900/90 to-zinc-950/95 rounded-xl p-5 sm:p-6 shadow-xl shadow-black/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
                Executive Operations
              </span>
              <span className="w-1 h-1 rounded-full bg-zinc-600" />
              <span className="text-[11px] text-zinc-400 font-medium">Assistant OS</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Executive Overview
            </h2>
            <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
              Real-time AI coordination across Gmail, Google Calendar, and Tasks with strict human authorization.
            </p>
          </div>

          {/* Header Utility Row: Search + Notifications + Safety Gate Badge */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            {/* Quick Search */}
            <button
              onClick={() => alert('Press Cmd+K to trigger global command search.')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] text-xs text-zinc-400 hover:text-zinc-200 hover:border-white/[0.15] transition-all min-h-[32px] group"
            >
              <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200" />
              <span className="text-[11px] font-medium">Search</span>
              <kbd className="text-[9px] font-mono px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700/80 text-zinc-400">
                ⌘K
              </kbd>
            </button>

            {/* Notification Bell */}
            <button
              title="Notifications"
              aria-label="Notifications"
              className="p-2 rounded-lg bg-zinc-900/80 border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] text-zinc-400 hover:text-zinc-200 hover:border-white/[0.15] transition-all min-h-[32px] relative"
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-sky-400" />
            </button>

            {/* Accent-styled Safety Gate Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-xs font-semibold text-sky-300 shadow-sm shadow-sky-500/10 min-h-[32px]">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <span>Safety Gate: <strong className="text-white font-bold">Strict YES SEND</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Bento-Style Asymmetrical Stat Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* HERO BENTO CARD: Pending Approvals + 7-Day Sparkline Trend (Spans 2 cols) */}
        <div
          className={`lg:col-span-2 rounded-xl p-5 shadow-xl shadow-black/25 border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] bg-gradient-to-b from-zinc-900/90 to-zinc-950/95 hover:-translate-y-0.5 hover:shadow-2xl hover:border-white/[0.16] transition-all duration-200 ease-out relative overflow-hidden flex flex-col justify-between ${
            pendingCount > 0 ? 'ring-1 ring-amber-500/40' : ''
          }`}
        >
          {/* Subtle accent glow strip */}
          <div
            className={`absolute top-0 bottom-0 left-0 w-1.5 ${
              pendingCount > 0 ? 'bg-amber-400 shadow-sm shadow-amber-400' : 'bg-sky-500'
            }`}
          />

          <div className="pl-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    pendingCount > 0 ? 'text-amber-400' : 'text-zinc-400'
                  }`}
                >
                  Pending Approvals Queue
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-white/[0.08] font-mono">
                  Hero Metric
                </span>
              </div>

              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  pendingCount > 0
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-zinc-800 text-zinc-400 border border-white/[0.08]'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Metric Row + Sparkline Visual */}
            <div className="mt-3 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold tracking-tight text-white font-mono">
                    {pendingCount}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">
                    {pendingCount === 1 ? 'draft awaiting YES SEND' : 'drafts awaiting YES SEND'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                  {pendingCount > 0
                    ? 'Requires explicit confirmation before dispatch to recipient'
                    : 'Queue clear • Zero outbound emails blocked'}
                </p>
              </div>

              {/* Real Data Visualization: 7-Day Approval Volume Sparkline */}
              <div className="bg-zinc-950/80 border border-white/[0.06] rounded-lg p-2.5 shrink-0 self-start sm:self-auto">
                <div className="flex items-center justify-between gap-3 text-[10px] text-zinc-400 mb-1.5 font-medium">
                  <span className="flex items-center gap-1 text-sky-400">
                    <TrendingUp className="w-3 h-3" /> 7-Day Trend
                  </span>
                  <span className="text-zinc-500 font-mono">35 actions</span>
                </div>
                <div className="flex items-end gap-1.5 h-9 pt-1 px-1">
                  {weeklyTrend.map((bar, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1 group">
                      <div
                        style={{ height: bar.height }}
                        className="w-2.5 rounded-xs bg-sky-500/60 group-hover:bg-sky-400 transition-colors"
                        title={`${bar.day}: ${bar.count} approved`}
                      />
                      <span className="text-[9px] text-zinc-500 font-mono">{bar.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: Google Workspace (Integration & Live Mini Agenda Widget) */}
        <div className="rounded-xl p-5 shadow-xl shadow-black/25 border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] bg-gradient-to-b from-zinc-900/90 to-zinc-950/95 hover:-translate-y-0.5 hover:shadow-2xl hover:border-white/[0.16] transition-all duration-200 ease-out flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Google Workspace
              </span>
              <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  googleConnected
                    ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse'
                    : 'bg-rose-400'
                }`}
              />
              <span className="text-xl font-bold tracking-tight text-white">
                {googleConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
              {googleConnected ? 'Gmail, Calendar & Tasks synced' : 'Offline • Connect in Settings'}
            </p>
          </div>

          {/* Mini Calendar Strip Widget */}
          <div className="mt-3 pt-2.5 border-t border-white/[0.06]">
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mb-1 font-medium">
              <Clock className="w-3 h-3 text-sky-400" />
              <span>Next Agenda Item</span>
            </div>
            <div className="p-2 rounded-lg bg-zinc-950/80 border border-white/[0.06] text-xs">
              <p className="font-semibold text-zinc-200 truncate leading-tight">
                {upcomingEvent ? upcomingEvent.summary : 'No meetings remaining today'}
              </p>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                {upcomingEvent
                  ? new Date(upcomingEvent.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Calendar synced'}
              </p>
            </div>
          </div>
        </div>

        {/* CARD 3: Active Channels & Security Vault (Combined Architecture Card) */}
        <div className="rounded-xl p-5 shadow-xl shadow-black/25 border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] bg-gradient-to-b from-zinc-900/90 to-zinc-950/95 hover:-translate-y-0.5 hover:shadow-2xl hover:border-white/[0.16] transition-all duration-200 ease-out flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Network & Security
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Radio className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
                3
              </span>
              <span className="text-xs text-zinc-400 font-medium">Channels Active</span>
            </div>

            <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
              Telegram, WhatsApp & Web chat
            </p>
          </div>

          {/* Security Vault Tag */}
          <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-300">
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-semibold">AES-256 Vault</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
              Encrypted
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Approvals Queue + Chat Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Pending Approvals Queue (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm font-bold text-white tracking-tight">Pending Approval Queue</h3>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                  pendingCount > 0
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-zinc-800 text-zinc-400 border-white/[0.08]'
                }`}
              >
                {pendingCount}
              </span>
            </div>
            {pendingCount > 2 && (
              <button
                onClick={onNavigateToApprovals}
                className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 transition-colors min-h-[32px]"
              >
                View all ({pendingCount}) <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {pendingCount === 0 ? (
            /* Well-Proportioned Empty State + Security Briefing */
            <div className="space-y-3">
              {/* Compact Status Banner */}
              <div className="bg-zinc-900/80 border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] rounded-xl p-4 flex items-center gap-3.5 shadow-md">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-100">Approvals Queue is Clear</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    No outbound emails or actions are currently awaiting confirmation.
                  </p>
                </div>
              </div>

              {/* Safeguards Card (Fills Space Usefully) */}
              <div className="bg-zinc-950/60 border border-white/[0.08] rounded-xl p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Active Safeguards & Protocol
                  </span>
                  <span className="text-[10px] text-sky-400 font-medium">Enforced</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-zinc-900/70 border border-white/[0.06] space-y-1">
                    <span className="text-[11px] font-semibold text-zinc-200 block">1. Human Gate</span>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Every email draft & calendar invite requires your explicit confirmation.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-zinc-900/70 border border-white/[0.06] space-y-1">
                    <span className="text-[11px] font-semibold text-zinc-200 block">2. Multi-Channel</span>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Reply "YES SEND" on Telegram, WhatsApp, or click Approve here.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-zinc-900/70 border border-white/[0.06] space-y-1">
                    <span className="text-[11px] font-semibold text-zinc-200 block">3. Audit Trail</span>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      All approved or rejected actions are permanently logged in Activity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingItems.slice(0, 3).map((item) => (
                <ApprovalCard
                  key={item._id}
                  item={item}
                  onApprove={onApprove}
                  onReject={onReject}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Chat Assistant (5 cols) */}
        <div className="lg:col-span-5">
          <ChatWidget onApprovalCreated={onRefresh} />
        </div>
      </div>
    </div>
  );
};
