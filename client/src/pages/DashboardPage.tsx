import React from 'react';
import { Mail, Calendar, CheckSquare, ShieldCheck, ArrowRight } from 'lucide-react';
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
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-sky-950/40 via-indigo-950/30 to-slate-900 border border-sky-500/20 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
              Executive AI Control Center
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              Welcome back, Executive
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Your multi-channel AI assistant is orchestrating emails, calendar events, tasks, and CRM outreach across Telegram, WhatsApp, and the web.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-center">
            <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">Approval Gate: <strong>Strict YES SEND</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Awaiting Approval</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2">{pendingItems.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">
            {pendingItems.length > 0 ? 'Requires explicit YES SEND' : 'All drafts cleared'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Google Sync</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {googleConnected ? 'Connected' : 'Offline'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {googleConnected ? 'Gmail & Calendar active' : 'Connect via Settings'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Channels</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2">3 Channels</div>
          <p className="text-[11px] text-slate-400 mt-1">Telegram, WhatsApp & Web</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Workspaces</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-2">Isolated</div>
          <p className="text-[11px] text-slate-400 mt-1">Business vs Personal</p>
        </div>
      </div>

      {/* Main Grid: Approvals Queue + Chat Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Pending Approvals (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Pending Approval Queue</h3>
              <p className="text-xs text-slate-400">Outbound emails require your approval before delivery</p>
            </div>
            {pendingItems.length > 2 && (
              <button
                onClick={onNavigateToApprovals}
                className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
              >
                View all ({pendingItems.length}) <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {pendingItems.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center shadow-sm">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Queue is clear!</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No outbound emails or actions are currently awaiting approval. Any newly drafted email will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
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
