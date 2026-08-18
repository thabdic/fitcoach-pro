import { Schema, model, Document, Types } from 'mongoose';
// Reuse the shared draft|assigned|archived status set defined for workout plans.
import { PLAN_STATUSES, PlanStatus } from './workout-plan.model';

export interface IMeal {
  name: string;
  timeOfDay?: string;
  foods: string[];
  notes?: string;
}

export interface IMealPlan extends Document {
  title: string;
  description?: string;
  clientId: Types.ObjectId;
  trainerId?: Types.ObjectId;
  caloriesTarget: number;
  meals: IMeal[];
  status: PlanStatus;
  createdAt: Date;
  updatedAt: Date;
}

const mealSchema = new Schema<IMeal>(
  {
    name: { type: String, required: true, trim: true },
    timeOfDay: { type: String, trim: true },
    foods: { type: [String], default: [] },
    notes: { type: String, trim: true },
  },
  { _id: false },
);

const mealPlanSchema = new Schema<IMealPlan>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    trainerId: { type: Schema.Types.ObjectId, ref: 'User' },
    caloriesTarget: { type: Number, required: true, min: 1 },
    meals: { type: [mealSchema], default: [] },
    status: { type: String, enum: PLAN_STATUSES, default: 'draft', required: true },
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

export const MealPlan = model<IMealPlan>('MealPlan', mealPlanSchema);
