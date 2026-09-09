import React, { useState, useEffect } from 'react';
import { ActivityTable, ActivityLogItem } from '../components/ActivityTable.js';
import { api } from '../lib/api.js';

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
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white">System Activity Logs</h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Append-only audit trail separating Business and Personal interactions across all channels
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading audit trail...</div>
      ) : (
        <ActivityTable
          logs={logs}
          currentWorkspace={workspace}
          onSelectWorkspace={setWorkspace}
        />
      )}
    </div>
  );
};
