import React, { useState, useEffect } from 'react';
import { ApprovalCard, PendingItem } from '../components/ApprovalCard.js';
import { api } from '../lib/api.js';
import { CheckCircle2, History } from 'lucide-react';

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
      setHistoryItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Approvals Queue</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Hard invariant safety gate: emails and outbound actions require human confirmation
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl self-start">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'pending'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Pending ({pendingItems.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            History
          </button>
        </div>
      </div>

      {activeTab === 'pending' ? (
        pendingItems.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <div className="w-12 h-12 bg-sky-500/10 text-sky-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">No pending actions</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Any drafts or schedule requests will wait here until you reply "YES SEND" on Telegram, WhatsApp, or click Approve below.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        /* History view */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          {loadingHistory ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading history...</div>
          ) : historyItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">No past approvals found.</div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {historyItems.map((item) => (
                <div key={item._id} className="py-3.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{item.summary}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          item.status === 'executed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : item.status === 'rejected'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Channel: {item.channelOrigin} • Workspace: {item.workspace} •{' '}
                      {new Date(item.updatedAt || item.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {item.resolutionNote && (
                    <span className="text-[11px] text-slate-400 italic max-w-xs text-right">
                      "{item.resolutionNote}"
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
