import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  timezone: string;
  role: 'admin' | 'user';
  googleSub?: string;
  avatarUrl?: string;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    timezone: { type: String, default: 'Asia/Amman' },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    googleSub: { type: String, index: true },
    avatarUrl: { type: String },
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
