import { Schema, model, Document, Types } from 'mongoose';
import { UserRole } from '../middleware/auth.middleware';

/**
 * User document. `passwordHash` is stored but never serialized to API
 * responses — the toJSON transform below strips it (and __v) so it is
 * impossible to leak by accidentally returning a raw user object.
 */
export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['client', 'trainer', 'admin'],
      default: 'client',
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete (ret as Record<string, unknown>).passwordHash;
        delete (ret as Record<string, unknown>).__v;
        return ret;
      },
    },
  },
);

export const User = model<IUser>('User', userSchema);
