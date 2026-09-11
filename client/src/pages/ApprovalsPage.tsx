import React, { useState, useEffect } from 'react';
import { ApprovalCard, PendingItem } from '../components/ApprovalCard.js';
import { api } from '../lib/api.js';
import { CheckCircle2, History, Clock } from 'lucide-react';

interface ApprovalsPageProps {
  pendingItems: PendingItem[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason?: string) => Promise<void>;
}

export const ApprovalsPage: React.FC<ApprovalsPageProps> = ({
  pendingItems,
  onApprove,
  onReject,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get('/approvals/history');
      setHistoryItems(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] bg-gradient-to-b from-zinc-900/90 to-zinc-950/95 rounded-xl p-5 sm:p-6 shadow-xl shadow-black/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
                Action Verification Gate
              </span>
              <span className="w-1 h-1 rounded-full bg-zinc-600" />
              <span className="text-[11px] text-zinc-400 font-medium">Assistant OS</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Approvals Queue
            </h2>
            <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
              Strict human-in-the-loop safety protocol. Every outbound email and calendar invitation requires explicit confirmation before delivery.
            </p>
          </div>

          {/* Segmented Tab Controls */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-950/80 border border-white/[0.08] rounded-xl self-start sm:self-center shadow-inner">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex items-center gap-2 px-3.5 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'pending'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Pending</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'pending' ? 'bg-sky-700/80 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {pendingItems.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3.5 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'pending' ? (
        pendingItems.length === 0 ? (
          /* Dashboard-Matched Empty State with Safeguards Protocol */
          <div className="space-y-4">
            <div className="bg-zinc-900/80 border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] rounded-xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-center sm:text-left space-y-1">
                <h3 className="text-sm font-bold text-zinc-100">Approvals Queue is Clear</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                  No outbound emails or meeting invites are currently waiting for authorization. Any drafts created by your assistant will wait here until you confirm.
                </p>
              </div>
            </div>

            {/* Reusable Safeguards Reference Panel */}
            <div className="bg-zinc-950/60 border border-white/[0.08] rounded-xl p-5 space-y-3 shadow-md">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Active Safeguards & Authorization Methods
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Protocol Enforced
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-zinc-900/70 border border-white/[0.06] space-y-1">
                  <span className="text-xs font-semibold text-zinc-200 block">1. Telegram Dispatch</span>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Reply directly with <code className="text-sky-300 font-mono">YES SEND</code> to your linked Telegram bot to approve instantly on mobile.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-zinc-900/70 border border-white/[0.06] space-y-1">
                  <span className="text-xs font-semibold text-zinc-200 block">2. In-App Inline Editing</span>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Review and modify draft recipients, subject lines, or message bodies before executing.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-zinc-900/70 border border-white/[0.06] space-y-1">
                  <span className="text-xs font-semibold text-zinc-200 block">3. Immutable Audit Trail</span>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Every approved or rejected action is timestamped and archived in the activity log.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendingItems.map((item) => (
              <ApprovalCard
                key={item._id}
                item={item}
                onApprove={onApprove}
                onReject={onReject}
              />
            ))}
          </div>
        )
      ) : (
        /* History view with Depth & Linear Table styling */
        <div className="bg-gradient-to-b from-zinc-900/90 to-zinc-950/95 border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Resolved Approvals Archive
            </span>
            <span className="text-xs text-zinc-500 font-mono">{historyItems.length} records</span>
          </div>

          {loadingHistory ? (
            <div className="py-12 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-sky-400 animate-spin" />
              <span>Loading historical audit trail...</span>
            </div>
          ) : historyItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              No historical approvals recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {historyItems.map((item) => {
                const isExecuted = item.status === 'executed';
                const isRejected = item.status === 'rejected';
                return (
                  <div
                    key={item._id}
                    className="py-3.5 px-2 hover:bg-zinc-800/40 rounded-lg transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs group"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-zinc-100 truncate">{item.summary}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                            isExecuted
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                              : isRejected
                              ? 'bg-rose-500/10 text-rose-300 border-rose-500/25'
                              : 'bg-zinc-800 text-zinc-400 border-white/[0.08]'
                          }`}
                        >
                          {item.status}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-white/[0.06] text-zinc-400 uppercase">
                          {item.workspace}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        Via <strong className="text-zinc-400 capitalize">{item.channelOrigin}</strong> •{' '}
                        {new Date(item.updatedAt || item.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {item.resolutionNote && (
                      <span className="text-[11px] text-zinc-400 italic bg-zinc-900/90 border border-white/[0.06] px-2.5 py-1 rounded-md max-w-xs truncate shrink-0">
                        "{item.resolutionNote}"
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
