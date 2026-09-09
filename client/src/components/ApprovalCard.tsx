import React, { useState } from 'react';
import { Mail, Calendar, CheckSquare, Send, X, Clock, AlertTriangle, Edit3, Check } from 'lucide-react';
import { api } from '../lib/api.js';

export interface PendingItem {
  _id: string;
  type: 'send_email' | 'schedule_meeting' | 'create_task' | 'crm_follow_up';
  status: 'awaiting_approval' | 'approved' | 'rejected' | 'expired' | 'executed' | 'failed';
  summary: string;
  payload: Record<string, any>;
  channelOrigin: string;
  workspace: 'business' | 'personal';
  expiresAt: string;
  createdAt: string;
}

interface ApprovalCardProps {
  item: PendingItem;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason?: string) => Promise<void>;
  onUpdated?: () => Promise<void>;
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({ item, onApprove, onReject, onUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedBody, setEditedBody] = useState(item.payload?.body || '');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const isEmail = item.type === 'send_email';
  const isMeeting = item.type === 'schedule_meeting';

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await api.patch(`/approvals/${item._id}`, { body: editedBody });
      item.payload.body = editedBody;
      setIsEditing(false);
      if (onUpdated) await onUpdated();
    } catch (err: any) {
      alert(`Failed to save draft: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      if (isEditing || editedBody !== item.payload?.body) {
        await api.patch(`/approvals/${item._id}`, { body: editedBody });
        item.payload.body = editedBody;
      }
      await onApprove(item._id);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await onReject(item._id, rejectReason || 'Rejected by user');
      setShowRejectModal(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 sm:p-5 shadow-sm hover:border-zinc-700/80 transition-all duration-150">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isEmail
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                : isMeeting
                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}
          >
            {isEmail && <Mail className="w-3.5 h-3.5" />}
            {isMeeting && <Calendar className="w-3.5 h-3.5" />}
            {!isEmail && !isMeeting && <CheckSquare className="w-3.5 h-3.5" />}
          </div>
          <div>
            <h3 className="text-xs font-semibold text-zinc-100 capitalize tracking-tight">
              {item.type.replace('_', ' ')}
            </h3>
            <span className="text-[11px] text-zinc-500 block leading-tight">Via {item.channelOrigin}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Workspace badge */}
          <span
            className={`text-[10px] px-2 py-0.5 rounded-md font-semibold tracking-wide border ${
              item.workspace === 'business'
                ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                : 'bg-purple-500/10 text-purple-300 border-purple-500/20'
            }`}
          >
            {item.workspace.toUpperCase()}
          </span>

          {/* Pending indicator */}
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
            <Clock className="w-3 h-3 text-amber-400" />
            Awaiting Confirmation
          </span>
        </div>
      </div>

      {/* Summary / Description */}
      <p className="text-xs font-medium text-zinc-200 mb-3 leading-relaxed">{item.summary}</p>

      {/* Payload Details Box */}
      <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-3.5 mb-3.5 text-xs space-y-2">
        {isEmail && (
          <>
            <div className="flex gap-2 text-xs">
              <span className="text-zinc-500 font-medium w-14 shrink-0">To:</span>
              <span className="text-zinc-300 font-mono select-all text-xs break-all">{item.payload.to}</span>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="text-zinc-500 font-medium w-14 shrink-0">Subject:</span>
              <span className="text-zinc-200 font-medium text-xs">{item.payload.subject}</span>
            </div>
            <div className="pt-2 border-t border-zinc-800/80">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-zinc-500 font-medium text-[11px]">Drafted Message:</span>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                    Edit Draft
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditedBody(item.payload.body);
                        setIsEditing(false);
                      }}
                      className="text-[11px] text-zinc-400 hover:text-zinc-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveDraft}
                      disabled={saving}
                      className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
                    >
                      <Check className="w-3 h-3" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <textarea
                  value={editedBody}
                  onChange={(e) => setEditedBody(e.target.value)}
                  rows={4}
                  className="w-full bg-zinc-900 border border-sky-500/40 rounded-lg p-2.5 text-xs text-zinc-100 leading-relaxed focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="Edit email body text..."
                />
              ) : (
                <p className="text-zinc-300 whitespace-pre-line leading-relaxed bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/70 text-xs">
                  {editedBody || item.payload.body}
                </p>
              )}
            </div>
          </>
        )}

        {isMeeting && (
          <>
            <div className="flex gap-2 text-xs">
              <span className="text-zinc-500 font-medium w-14">Start:</span>
              <span className="text-zinc-200">{new Date(item.payload.start).toLocaleString()}</span>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="text-zinc-500 font-medium w-14">End:</span>
              <span className="text-zinc-200">{new Date(item.payload.end).toLocaleString()}</span>
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2.5 pt-1">
        <button
          onClick={() => setShowRejectModal(true)}
          disabled={loading}
          className="px-3 py-1.5 min-h-[36px] text-xs font-medium text-zinc-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg border border-zinc-800 hover:border-rose-500/20 transition-all flex items-center gap-1.5"
        >
          <X className="w-3.5 h-3.5" />
          Reject
        </button>

        <button
          onClick={handleApprove}
          disabled={loading}
          className="px-4 py-1.5 min-h-[36px] text-xs font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          {loading ? 'Executing...' : 'YES SEND (Approve)'}
        </button>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 max-w-md w-full shadow-2xl space-y-3">
            <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Reject Action
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Provide feedback or instructions for why this action was rejected. The agent will record this in the audit log.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Tone too formal, change meeting time to 3 PM..."
              rows={3}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-3.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 min-h-[36px]"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={loading}
                className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg min-h-[36px]"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
