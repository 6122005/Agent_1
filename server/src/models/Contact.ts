import mongoose, { Document, Schema } from 'mongoose';
import { WorkspaceType } from './PendingAction.js';

export interface IContact extends Document {
  userId: mongoose.Types.ObjectId;
  hubspotContactId?: string;
  name: string;
  email?: string;
  phone?: string;
  lastContactedAt?: Date;
  workspace: WorkspaceType;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<IContact>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    hubspotContactId: { type: String, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    lastContactedAt: { type: Date },
    workspace: { type: String, enum: ['business', 'personal'], default: 'business', index: true },
    notes: { type: String },
  },
  { timestamps: true }
);

ContactSchema.index({ userId: 1, email: 1 });

export const Contact = mongoose.models.Contact || mongoose.model<IContact>('Contact', ContactSchema);
