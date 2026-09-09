import React, { useState, useEffect } from 'react';
import { ActivityTable, ActivityLogItem } from '../components/ActivityTable.js';
import { api } from '../lib/api.js';
import { ShieldCheck, Database, RefreshCw, Layers } from 'lucide-react';

export const LogsPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [workspace, setWorkspace] = useState<'all' | 'business' | 'personal'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [workspace]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/logs', {
        params: { workspace: workspace === 'all' ? undefined : workspace, limit: 100 },
      });
      setLogs(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const businessCount = logs.filter((l) => l.workspace === 'business').length;
  const personalCount = logs.filter((l) => l.workspace === 'personal').length;
  const successCount = logs.filter((l) => l.status === 'success').length;
  const successRate = logs.length > 0 ? Math.round((successCount / logs.length) * 100) : 100;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-sky-400 mb-1">
            IMMUTABLE SECURITY AUDIT TRAIL
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            System Activity Logs
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Append-only audit trail separating Business and Personal interactions across all channels
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Append-Only Enforced
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-800/80 border border-white/10 text-zinc-300 hover:text-white hover:border-white/20 transition-all duration-150 disabled:opacity-50"
            title="Refresh logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Mini Metric Overview Strip (Data Widgets) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-b from-zinc-900/90 to-zinc-950/95 border border-white/[0.08] shadow-md shadow-black/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Entries</div>
            <div className="text-lg font-bold text-white font-mono mt-0.5">{logs.length}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-gradient-to-b from-zinc-900/90 to-zinc-950/95 border border-white/[0.08] shadow-md shadow-black/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Business Events</div>
            <div className="text-lg font-bold text-blue-300 font-mono mt-0.5">{businessCount}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-gradient-to-b from-zinc-900/90 to-zinc-950/95 border border-white/[0.08] shadow-md shadow-black/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Personal Events</div>
            <div className="text-lg font-bold text-purple-300 font-mono mt-0.5">{personalCount}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-gradient-to-b from-zinc-900/90 to-zinc-950/95 border border-white/[0.08] shadow-md shadow-black/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Execution Rate</div>
            <div className="text-lg font-bold text-emerald-300 font-mono mt-0.5">{successRate}%</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Activity Table Panel */}
      <ActivityTable
        logs={logs}
        currentWorkspace={workspace}
        onSelectWorkspace={setWorkspace}
        loading={loading}
      />
    </div>
  );
};
