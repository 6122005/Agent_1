import mongoose, { Document, Schema } from 'mongoose';
import { encrypt, decrypt } from '../utils/crypto.js';

export interface IOAuthToken extends Document {
  userId: mongoose.Types.ObjectId;
  provider: 'google';
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string;
  scope?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  getDecryptedAccessToken(): string;
  getDecryptedRefreshToken(): string;
  setTokens(accessToken: string, refreshToken?: string): void;
}

const OAuthTokenSchema = new Schema<IOAuthToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: { type: String, enum: ['google'], required: true },
    accessTokenEncrypted: { type: String, required: true },
    refreshTokenEncrypted: { type: String, required: true },
    scope: { type: String },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

OAuthTokenSchema.index({ userId: 1, provider: 1 }, { unique: true });

OAuthTokenSchema.methods.getDecryptedAccessToken = function (): string {
  return decrypt(this.accessTokenEncrypted);
};

OAuthTokenSchema.methods.getDecryptedRefreshToken = function (): string {
  return decrypt(this.refreshTokenEncrypted);
};

OAuthTokenSchema.methods.setTokens = function (accessToken: string, refreshToken?: string): void {
  this.accessTokenEncrypted = encrypt(accessToken);
  if (refreshToken) {
    this.refreshTokenEncrypted = encrypt(refreshToken);
  }
};

export const OAuthToken = mongoose.models.OAuthToken || mongoose.model<IOAuthToken>('OAuthToken', OAuthTokenSchema);
