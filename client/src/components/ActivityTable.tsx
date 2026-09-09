import React, { useState } from 'react';
import { Bot, User as UserIcon, Server, CheckCircle2, Clock, XCircle } from 'lucide-react';

export interface ActivityLogItem {
  _id: string;
  actor: 'agent' | 'user' | 'system';
  actionType: string;
  channel: string;
  workspace: 'business' | 'personal';
  status: 'success' | 'pending' | 'failed';
  details: Record<string, any>;
  createdAt: string;
}

interface ActivityTableProps {
  logs: ActivityLogItem[];
  currentWorkspace: 'all' | 'business' | 'personal';
  onSelectWorkspace: (workspace: 'all' | 'business' | 'personal') => void;
}

export const ActivityTable: React.FC<ActivityTableProps> = ({
  logs,
  currentWorkspace,
  onSelectWorkspace,
}) => {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const getActorIcon = (actor: string) => {
    switch (actor) {
      case 'agent':
        return <Bot className="w-3.5 h-3.5 text-sky-400" />;
      case 'user':
        return <UserIcon className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Server className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'pending':
        return <Clock className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <XCircle className="w-3.5 h-3.5 text-rose-400" />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
      {/* Workspace filter header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-sm font-bold text-white">Activity Logs</h3>
          <p className="text-xs text-slate-400">Append-only audit trail with workspace tagging</p>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          {(['all', 'business', 'personal'] as const).map((ws) => (
            <button
              key={ws}
              onClick={() => onSelectWorkspace(ws)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                currentWorkspace === ws
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {ws}
            </button>
          ))}
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs">
          No activity recorded in this workspace view yet.
        </div>
      ) : (
        <div className="divide-y divide-slate-800/60">
          {logs.map((log) => {
            const isExpanded = expandedLogId === log._id;
            return (
              <div
                key={log._id}
                className="py-3 hover:bg-slate-800/30 px-2 rounded-xl transition-colors cursor-pointer"
                onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 bg-slate-800 rounded-lg shrink-0">
                      {getActorIcon(log.actor)}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200 capitalize">
                          {log.actionType.replace(/_/g, ' ')}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.2 rounded-full font-medium ${
                            log.workspace === 'business'
                              ? 'bg-blue-500/10 text-blue-400'
                              : 'bg-purple-500/10 text-purple-400'
                          }`}
                        >
                          {log.workspace}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Via {log.channel} • {new Date(log.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-8 sm:pl-0">
                    <span className="flex items-center gap-1 text-[11px] text-slate-300 capitalize">
                      {getStatusIcon(log.status)}
                      {log.status}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Expandable JSON details */}
                {isExpanded && log.details && Object.keys(log.details).length > 0 && (
                  <div className="mt-3 ml-8 p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
                    <pre>{JSON.stringify(log.details, null, 2)}</pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
