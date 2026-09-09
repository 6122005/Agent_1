import React from 'react';
import { Mail, Calendar, CheckSquare, ShieldCheck, ArrowRight, Activity } from 'lucide-react';
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
  return (
    <div className="space-y-6">
      {/* Top Header / Status Section */}
      <div className="border border-zinc-800/80 bg-zinc-900/60 rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-400">
                Executive Control Center
              </span>
              <span className="w-1 h-1 rounded-full bg-zinc-600" />
              <span className="text-[11px] text-zinc-400 font-medium">Assistant OS</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Overview Dashboard
            </h2>
            <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
              Multi-channel assistant coordinating email summaries, calendar scheduling, tasks, and outbound approvals across Telegram, WhatsApp, and Web.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950/70 border border-zinc-800 text-xs font-medium text-zinc-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Gate: <strong className="text-white font-semibold">Strict YES SEND</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row (Calm SaaS Metric Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1 */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-sm hover:border-zinc-700/70 transition-all duration-150 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Pending Approvals</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Mail className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-white mt-2 font-mono">{pendingItems.length}</div>
          <p className="text-[11px] text-zinc-500 mt-1 font-medium">
            {pendingItems.length > 0 ? 'Requires manual confirmation' : 'Queue cleared'}
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-sm hover:border-zinc-700/70 transition-all duration-150 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Google Workspace</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-bold tracking-tight text-white mt-2 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                googleConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              }`}
            />
            <span>{googleConnected ? 'Connected' : 'Offline'}</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1 font-medium">
            {googleConnected ? 'Gmail, Calendar & Tasks synced' : 'Connect in Settings'}
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-sm hover:border-zinc-700/70 transition-all duration-150 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Active Channels</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckSquare className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-bold tracking-tight text-white mt-2">3 Channels</div>
          <p className="text-[11px] text-zinc-500 mt-1 font-medium">Telegram, WhatsApp & Web</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-sm hover:border-zinc-700/70 transition-all duration-150 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Data Isolation</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-bold tracking-tight text-white mt-2">Multi-Tenant</div>
          <p className="text-[11px] text-zinc-500 mt-1 font-medium">Encrypted token vault at rest</p>
        </div>
      </div>

      {/* Main Grid: Approvals Queue + Chat Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Pending Approvals Queue (7 cols) */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white tracking-tight">Pending Approvals</h3>
              <span className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] font-mono px-2 py-0.2 rounded-full">
                {pendingItems.length}
              </span>
            </div>
            {pendingItems.length > 2 && (
              <button
                onClick={onNavigateToApprovals}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 transition-colors min-h-[32px]"
              >
                View all ({pendingItems.length}) <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {pendingItems.length === 0 ? (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-10 text-center shadow-sm">
              <div className="w-10 h-10 bg-zinc-800/80 border border-zinc-700/60 text-emerald-400 rounded-xl flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-semibold text-zinc-200 mb-1">Queue is clear</h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                No outbound actions or drafted messages are currently awaiting confirmation. Any newly drafted email will appear here for review.
              </p>
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
