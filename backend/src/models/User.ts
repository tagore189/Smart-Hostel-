import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'WARDEN' | 'STAFF' | 'RESIDENT';

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  avatarUrl?: string;
  isActive: boolean;
  mustChangePassword: boolean;
  pushToken?: string;
  lastLogin?: Date;
  comparePassword(password: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'ADMIN', 'WARDEN', 'STAFF', 'RESIDENT'],
      default: 'RESIDENT',
      required: true,
      index: true,
    },
    avatarUrl: { type: String },
    isActive: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: false },
    pushToken: { type: String },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

export const User = mongoose.model<IUser>('User', UserSchema);
