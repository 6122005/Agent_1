import mongoose, { Document, Schema } from 'mongoose';

export type ActionType = 'send_email' | 'schedule_meeting' | 'create_task' | 'crm_follow_up';
export type ActionStatus = 'awaiting_approval' | 'approved' | 'rejected' | 'expired' | 'executed' | 'failed';
export type ChannelType = 'telegram' | 'whatsapp' | 'dashboard' | 'system';
export type WorkspaceType = 'business' | 'personal';

export interface IPendingAction extends Document {
  userId: mongoose.Types.ObjectId;
  type: ActionType;
  status: ActionStatus;
  payload: Record<string, any>;
  summary: string;
  channelOrigin: ChannelType;
  workspace: WorkspaceType;
  resolutionNote?: string;
  approvedAt?: Date;
  executedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PendingActionSchema = new Schema<IPendingAction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['send_email', 'schedule_meeting', 'create_task', 'crm_follow_up'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['awaiting_approval', 'approved', 'rejected', 'expired', 'executed', 'failed'],
      default: 'awaiting_approval',
      index: true,
    },
    payload: { type: Schema.Types.Mixed, required: true },
    summary: { type: String, required: true },
    channelOrigin: {
      type: String,
      enum: ['telegram', 'whatsapp', 'dashboard', 'system'],
      default: 'dashboard',
    },
    workspace: {
      type: String,
      enum: ['business', 'personal'],
      default: 'business',
      index: true,
    },
    resolutionNote: { type: String },
    approvedAt: { type: Date },
    executedAt: { type: Date },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL index to auto-expire
    },
  },
  { timestamps: true }
);

export const PendingAction = mongoose.models.PendingAction || mongoose.model<IPendingAction>('PendingAction', PendingActionSchema);
