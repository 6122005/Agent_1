import mongoose, { Document, Schema } from 'mongoose';
import { ChannelType, WorkspaceType } from './PendingAction.js';

export type ActorType = 'agent' | 'user' | 'system';

export interface IActivityLog extends Document {
  userId: mongoose.Types.ObjectId;
  actor: ActorType;
  actionType: string;
  channel: ChannelType;
  workspace: WorkspaceType;
  status: 'success' | 'pending' | 'failed';
  details: Record<string, any>;
  relatedApprovalId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actor: { type: String, enum: ['agent', 'user', 'system'], required: true },
    actionType: { type: String, required: true, index: true },
    channel: { type: String, enum: ['telegram', 'whatsapp', 'dashboard', 'system'], required: true },
    workspace: { type: String, enum: ['business', 'personal'], default: 'business', index: true },
    status: { type: String, enum: ['success', 'pending', 'failed'], default: 'success' },
    details: { type: Schema.Types.Mixed, default: {} },
    relatedApprovalId: { type: Schema.Types.ObjectId, ref: 'PendingAction' },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Append-only: no updatedAt
  }
);

export const ActivityLog = mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
