import React from 'react';
import { Mail, Calendar, ShieldCheck, ArrowRight, Lock, Radio, CheckCircle2 } from 'lucide-react';
import { ApprovalCard, PendingItem } from '../components/ApprovalCard.js';
import { ChatWidget } from '../components/ChatWidget.js';

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

  return (
    <div className="space-y-6">
      {/* Top Header / Status Section */}
      <div className="border border-zinc-800/80 bg-gradient-to-r from-zinc-900/90 via-zinc-900/70 to-zinc-950 rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
              Real-time AI coordination across Gmail, Google Calendar, Tasks, and CRM with strict human authorization.
            </p>
          </div>

          {/* Accent-styled Gate Badge */}
          <div className="self-start sm:self-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-xs font-semibold text-sky-300 shadow-sm shadow-sky-500/10">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <span>Safety Gate: <strong className="text-white font-bold">Strict YES SEND</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row (Broken Monotony & Distinct Treatments) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Pending Approvals (Emphasized Primary Action Card) */}
        <div
          className={`rounded-xl p-4 shadow-sm transition-all duration-200 border relative overflow-hidden ${
            pendingCount > 0
              ? 'bg-gradient-to-b from-amber-500/10 via-zinc-900/90 to-zinc-950 border-amber-500/40 shadow-amber-500/5'
              : 'bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          {/* Accent highlight strip on left */}
          <div
            className={`absolute top-0 bottom-0 left-0 w-1 ${
              pendingCount > 0 ? 'bg-amber-400' : 'bg-zinc-700'
            }`}
          />

          <div className="flex items-center justify-between pl-1">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                pendingCount > 0 ? 'text-amber-400' : 'text-zinc-400'
              }`}
            >
              Pending Approvals
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                pendingCount > 0
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700/60'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="mt-3 pl-1 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
              {pendingCount}
            </span>
            <span className="text-xs text-zinc-400 font-medium">
              {pendingCount === 1 ? 'draft waiting' : 'drafts waiting'}
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 mt-1.5 pl-1 leading-snug">
            {pendingCount > 0
              ? 'Requires explicit confirmation before delivery'
              : 'All outbound messages cleared'}
          </p>
        </div>

        {/* Metric 2: Google Workspace (Status-type card with pulse indicator) */}
        <div className="bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 shadow-sm transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Google Workspace
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                googleConnected ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse' : 'bg-rose-400'
              }`}
            />
            <span className="text-xl font-bold tracking-tight text-white">
              {googleConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 mt-2 leading-snug">
            {googleConnected ? 'Gmail, Calendar & Tasks synced' : 'Connect account in Settings'}
          </p>
        </div>

        {/* Metric 3: Active Channels (Count-type card with distinct font scale) */}
        <div className="bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 shadow-sm transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Active Channels
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Radio className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
              3
            </span>
            <span className="text-xs text-zinc-400 font-medium">endpoints</span>
          </div>

          <p className="text-[11px] text-zinc-400 mt-1.5 leading-snug">
            Telegram, WhatsApp & Web chat
          </p>
        </div>

        {/* Metric 4: Data Isolation (Architecture & Security Card) */}
        <div className="bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 shadow-sm transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Security Vault
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-white">
              Multi-Tenant
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 mt-2 leading-snug">
            AES-256-GCM token encryption at rest
          </p>
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
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
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
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
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
              <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Active Safeguards & Protocol
                  </span>
                  <span className="text-[10px] text-sky-400 font-medium">Automatic</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-zinc-900/70 border border-zinc-800/70 space-y-1">
                    <span className="text-[11px] font-semibold text-zinc-200 block">1. Human Gate</span>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Every email draft & calendar invite requires your explicit confirmation.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-zinc-900/70 border border-zinc-800/70 space-y-1">
                    <span className="text-[11px] font-semibold text-zinc-200 block">2. Multi-Channel</span>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Reply "YES SEND" on Telegram, WhatsApp, or click Approve here.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-zinc-900/70 border border-zinc-800/70 space-y-1">
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
