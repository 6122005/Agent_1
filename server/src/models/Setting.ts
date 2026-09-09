import mongoose, { Document, Schema } from 'mongoose';

export interface ISetting extends Document {
  userId: mongoose.Types.ObjectId;
  timezone: string;
  morningSummaryTime: string;
  eveningSummaryTime: string;
  enabledChannels: ('telegram' | 'whatsapp' | 'dashboard')[];
  telegramChatId?: string;
  whatsappRecipientPhone?: string;
  approvalTimeoutHours: number;
  hubspotStaleDays: number;
  createdAt: Date;
  updatedAt: Date;
}

const SettingSchema = new Schema<ISetting>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    timezone: { type: String, default: 'Asia/Amman' },
    morningSummaryTime: { type: String, default: '08:00' },
    eveningSummaryTime: { type: String, default: '19:00' },
    enabledChannels: {
      type: [String],
      enum: ['telegram', 'whatsapp', 'dashboard'],
      default: ['telegram', 'dashboard'],
    },
    telegramChatId: { type: String },
    whatsappRecipientPhone: { type: String },
    approvalTimeoutHours: { type: Number, default: 24 },
    hubspotStaleDays: { type: Number, default: 7 },
  },
  { timestamps: true }
);

export const Setting = mongoose.models.Setting || mongoose.model<ISetting>('Setting', SettingSchema);
