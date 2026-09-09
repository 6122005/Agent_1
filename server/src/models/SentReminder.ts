import mongoose, { Document, Schema } from 'mongoose';

export type ReminderTargetType = 'calendar_event' | 'task';

export interface ISentReminder extends Document {
  userId: mongoose.Types.ObjectId;
  targetType: ReminderTargetType;
  targetId: string;
  targetTitle: string;
  targetTime: Date;
  channel: 'telegram' | 'dashboard';
  sentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SentReminderSchema = new Schema<ISentReminder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetType: { type: String, enum: ['calendar_event', 'task'], required: true },
    targetId: { type: String, required: true },
    targetTitle: { type: String, required: true },
    targetTime: { type: Date, required: true },
    channel: { type: String, enum: ['telegram', 'dashboard'], default: 'telegram' },
    sentAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate reminders for the same item per user
SentReminderSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });
// Automatically expire records after 7 days
SentReminderSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

export const SentReminder =
  mongoose.models.SentReminder || mongoose.model<ISentReminder>('SentReminder', SentReminderSchema);
