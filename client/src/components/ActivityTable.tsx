import React, { useState } from 'react';
import {
  Bot,
  User as UserIcon,
  Server,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Code2,
  Shield,
  Radio,
  FileText
} from 'lucide-react';

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
  loading?: boolean;
}

export const ActivityTable: React.FC<ActivityTableProps> = ({
  logs,
  currentWorkspace,
  onSelectWorkspace,
  loading = false,
}) => {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');

  const filteredLogs = logs.filter((log) => {
    if (channelFilter !== 'all' && log.channel.toLowerCase() !== channelFilter.toLowerCase()) {
      return false;
    }
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchAction = log.actionType.toLowerCase().includes(q);
      const matchActor = log.actor.toLowerCase().includes(q);
      const matchDetails = JSON.stringify(log.details || {}).toLowerCase().includes(q);
      return matchAction || matchActor || matchDetails;
    }
    return true;
  });

  const getActorBadge = (actor: string) => {
    switch (actor) {
      case 'agent':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Bot className="w-3 h-3" />
            <span>AI Agent</span>
          </span>
        );
      case 'user':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <UserIcon className="w-3 h-3" />
            <span>Executive</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-800 text-zinc-300 border border-white/10">
            <Server className="w-3 h-3" />
            <span>System Core</span>
          </span>
        );
    }
  };

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>Success</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" />
            <span>Failed</span>
          </span>
        );
    }
  };

  const getWorkspacePill = (ws: string) => {
    if (ws === 'business') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20 uppercase tracking-wide">
          Business
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20 uppercase tracking-wide">
        Personal
      </span>
    );
  };

  return (
    <div className="bg-gradient-to-b from-zinc-900/90 via-zinc-900/80 to-zinc-950/95 border border-white/[0.08] rounded-2xl shadow-xl shadow-black/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] overflow-hidden">
      {/* Top Filter and Controls Bar */}
      <div className="p-4 sm:p-5 border-b border-white/[0.06] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
              AUDIT TRAIL EXPLORER
            </div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
              <Shield className="w-4 h-4 text-sky-400" />
              <span>Immutable Ledger</span>
            </h3>
          </div>

          {/* Segmented Workspace Pill Toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-zinc-950/80 p-1 rounded-xl border border-white/10 shadow-inner">
              {(['all', 'business', 'personal'] as const).map((ws) => {
                const isActive = currentWorkspace === ws;
                return (
                  <button
                    key={ws}
                    onClick={() => onSelectWorkspace(ws)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all duration-150 min-h-[36px] flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                    }`}
                  >
                    <span>{ws === 'all' ? 'All Workspaces' : ws}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-sky-600/60 text-white' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {ws === 'all'
                        ? logs.length
                        : logs.filter((l) => l.workspace === ws).length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Search & Channel Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          {/* Quick text filter */}
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search action type, actor, or payload parameters..."
              className="w-full bg-zinc-950/80 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500/50 shadow-inner min-h-[40px]"
            />
          </div>

          {/* Channel selector pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto py-1">
            {['all', 'web', 'telegram', 'cron'].map((ch) => (
              <button
                key={ch}
                onClick={() => setChannelFilter(ch)}
                className={`px-2.5 py-1 text-[11px] font-mono rounded-lg border transition-all uppercase min-h-[32px] ${
                  channelFilter === ch
                    ? 'bg-zinc-800 text-white border-white/20'
                    : 'bg-zinc-950/60 text-zinc-400 border-white/[0.05] hover:text-zinc-200'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-16 text-center text-xs text-zinc-400">
          <Radio className="w-5 h-5 animate-pulse mx-auto text-sky-400 mb-2" />
          Querying encrypted audit trail...
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="py-16 text-center text-zinc-500 text-xs space-y-2">
          <FileText className="w-8 h-8 mx-auto text-zinc-600 opacity-60" />
          <p className="text-sm font-semibold text-zinc-300">No Activity Logs Found</p>
          <p className="text-xs text-zinc-500">
            No events match the selected workspace or filter parameters.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View (Hidden on mobile < 768px) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-zinc-950/40 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action Type</th>
                  <th className="py-3 px-4">Workspace</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs">
                {filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log._id;
                  const dateObj = new Date(log.createdAt);
                  const hasDetails = log.details && Object.keys(log.details).length > 0;

                  return (
                    <React.Fragment key={log._id}>
                      <tr
                        onClick={() => hasDetails && setExpandedLogId(isExpanded ? null : log._id)}
                        className={`transition-colors even:bg-zinc-950/30 odd:bg-transparent hover:bg-zinc-800/40 ${
                          hasDetails ? 'cursor-pointer' : ''
                        }`}
                      >
                        <td className="py-3 px-4 whitespace-nowrap text-zinc-400 font-mono text-[11px]">
                          <div>{dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                          <div className="text-[10px] text-zinc-500">{dateObj.toLocaleDateString()}</div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {getActorBadge(log.actor)}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap font-medium text-zinc-200">
                          <span className="capitalize">{log.actionType.replace(/_/g, ' ')}</span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {getWorkspacePill(log.workspace)}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono text-[11px] text-zinc-300 uppercase px-2 py-0.5 rounded bg-zinc-950 border border-white/[0.05]">
                            {log.channel}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {getStatusPill(log.status)}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {hasDetails ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium"
                            >
                              <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          ) : (
                            <span className="text-zinc-600 text-[11px]">—</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded JSON details row */}
                      {isExpanded && hasDetails && (
                        <tr className="bg-zinc-950/90 border-y border-white/10">
                          <td colSpan={7} className="p-4">
                            <div className="bg-black/60 rounded-xl border border-white/10 p-3 space-y-2">
                              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono pb-2 border-b border-white/[0.06]">
                                <span className="flex items-center gap-1.5 text-sky-400">
                                  <Code2 className="w-3.5 h-3.5" />
                                  <span>Payload Signature & Metadata</span>
                                </span>
                                <span>Record ID: {log._id}</span>
                              </div>
                              <pre className="font-mono text-[11px] text-emerald-400/90 overflow-x-auto p-2 leading-relaxed">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards View (Shown on screens < 768px, zero horizontal table squeeze) */}
          <div className="block md:hidden p-4 space-y-3">
            {filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log._id;
              const dateObj = new Date(log.createdAt);
              const hasDetails = log.details && Object.keys(log.details).length > 0;

              return (
                <div
                  key={log._id}
                  className="bg-zinc-950/70 border border-white/[0.06] rounded-xl p-3.5 space-y-3 shadow-sm hover:border-sky-500/30 transition-all duration-150"
                  onClick={() => hasDetails && setExpandedLogId(isExpanded ? null : log._id)}
                >
                  {/* Top row: Action & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[10px] font-mono text-zinc-500">
                        {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {dateObj.toLocaleDateString()}
                      </div>
                      <h4 className="font-semibold text-white text-sm capitalize mt-0.5">
                        {log.actionType.replace(/_/g, ' ')}
                      </h4>
                    </div>
                    {getStatusPill(log.status)}
                  </div>

                  {/* Badges row: Actor, Workspace, Channel */}
                  <div className="flex items-center gap-2 flex-wrap text-xs pt-1 border-t border-white/[0.04]">
                    {getActorBadge(log.actor)}
                    {getWorkspacePill(log.workspace)}
                    <span className="font-mono text-[10px] text-zinc-400 uppercase px-2 py-0.5 rounded bg-zinc-900 border border-white/[0.06]">
                      {log.channel}
                    </span>
                  </div>

                  {/* Expand button on mobile */}
                  {hasDetails && (
                    <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-xs text-sky-400">
                      <span className="text-[11px] font-medium flex items-center gap-1">
                        <Code2 className="w-3 h-3" />
                        {isExpanded ? 'Hide Payload' : 'View Payload Details'}
                      </span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </div>
                  )}

                  {/* Mobile JSON details */}
                  {isExpanded && hasDetails && (
                    <div className="mt-2 bg-black/80 rounded-lg p-2.5 border border-white/10 text-[11px] font-mono text-emerald-400 overflow-x-auto">
                      <pre>{JSON.stringify(log.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
