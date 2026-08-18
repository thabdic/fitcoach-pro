import { Schema, model, Document, Types } from 'mongoose';

/**
 * Allowed enum values, exported so the route validators stay in sync with the
 * schema (single source of truth).
 */
export const GENDERS = ['male', 'female', 'other'] as const;
export const GOALS = [
  'lose_weight',
  'build_muscle',
  'maintain',
  'improve_endurance',
  'general_fitness',
] as const;
export const ACTIVITY_LEVELS = [
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active',
] as const;

export type Gender = (typeof GENDERS)[number];
export type Goal = (typeof GOALS)[number];
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];

/**
 * One fitness profile per user (enforced by the unique index on userId).
 */
export interface IFitnessProfile extends Document {
  userId: Types.ObjectId;
  age: number;
  gender?: Gender;
  heightCm: number;
  weightKg: number;
  goal: Goal;
  activityLevel: ActivityLevel;
  injuries?: string;
  dietaryPreference?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const fitnessProfileSchema = new Schema<IFitnessProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    age: { type: Number, required: true },
    gender: { type: String, enum: GENDERS },
    heightCm: { type: Number, required: true },
    weightKg: { type: Number, required: true },
    goal: { type: String, enum: GOALS, required: true },
    activityLevel: { type: String, enum: ACTIVITY_LEVELS, required: true },
    injuries: { type: String, trim: true },
    dietaryPreference: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete (ret as Record<string, unknown>).__v;
        return ret;
      },
    },
  },
);

export const FitnessProfile = model<IFitnessProfile>('FitnessProfile', fitnessProfileSchema);
