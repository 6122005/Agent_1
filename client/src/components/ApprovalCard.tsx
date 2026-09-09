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
      // If user edited without manually clicking Save Draft, auto-save first
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700/80 transition-all">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isEmail
                ? 'bg-sky-500/20 text-sky-400'
                : isMeeting
                ? 'bg-indigo-500/20 text-indigo-400'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {isEmail && <Mail className="w-4 h-4" />}
            {isMeeting && <Calendar className="w-4 h-4" />}
            {!isEmail && !isMeeting && <CheckSquare className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white capitalize">
              {item.type.replace('_', ' ')}
            </h3>
            <span className="text-[11px] text-slate-400">Via {item.channelOrigin}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Workspace badge */}
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
              item.workspace === 'business'
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
            }`}
          >
            {item.workspace.toUpperCase()}
          </span>

          {/* Pending indicator */}
          <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            <Clock className="w-3 h-3" />
            Awaiting YES SEND
          </span>
        </div>
      </div>

      {/* Summary / Description */}
      <p className="text-sm text-slate-200 font-medium mb-3">{item.summary}</p>

      {/* Payload Details Box */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 mb-4 text-xs space-y-2">
        {isEmail && (
          <>
            <div className="flex gap-2">
              <span className="text-slate-400 font-semibold w-16 shrink-0">To:</span>
              <span className="text-slate-200 font-mono select-all">{item.payload.to}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-slate-400 font-semibold w-16 shrink-0">Subject:</span>
              <span className="text-slate-200">{item.payload.subject}</span>
            </div>
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-slate-400 font-semibold block">Drafted Body:</span>
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
                      className="text-[11px] text-slate-400 hover:text-white"
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
                  rows={5}
                  className="w-full bg-slate-900 border border-sky-500/50 rounded-lg p-3 text-xs text-white leading-relaxed focus:outline-none focus:ring-1 focus:ring-sky-400"
                  placeholder="Edit email body text..."
                />
              ) : (
                <p className="text-slate-300 whitespace-pre-line leading-relaxed bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  {editedBody || item.payload.body}
                </p>
              )}
            </div>
          </>
        )}

        {isMeeting && (
          <>
            <div className="flex gap-2">
              <span className="text-slate-400 font-semibold w-16">Start:</span>
              <span className="text-slate-200">{new Date(item.payload.start).toLocaleString()}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-slate-400 font-semibold w-16">End:</span>
              <span className="text-slate-200">{new Date(item.payload.end).toLocaleString()}</span>
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          onClick={() => setShowRejectModal(true)}
          disabled={loading}
          className="px-3.5 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl border border-rose-500/20 transition-colors flex items-center gap-1.5"
        >
          <X className="w-3.5 h-3.5" />
          Reject
        </button>

        <button
          onClick={handleApprove}
          disabled={loading}
          className="px-4 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          {loading ? 'Executing...' : 'YES SEND (Approve)'}
        </button>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Reject Action
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Provide feedback or instructions for why this action was rejected. The agent will record this in the audit log.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Tone too formal, change meeting time to 3 PM..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl"
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
