import mongoose, { Schema, Document } from 'mongoose';

export interface ITelegramLinkToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

const TelegramLinkTokenSchema = new Schema<ITelegramLinkToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // MongoDB TTL index auto-deletes expired tokens
  },
  { timestamps: true }
);

export const TelegramLinkToken = mongoose.model<ITelegramLinkToken>(
  'TelegramLinkToken',
  TelegramLinkTokenSchema
);
