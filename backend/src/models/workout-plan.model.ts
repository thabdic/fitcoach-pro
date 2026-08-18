import { Schema, model, Document, Types } from 'mongoose';

export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;
export const PLAN_STATUSES = ['draft', 'assigned', 'archived'] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];
export type PlanStatus = (typeof PLAN_STATUSES)[number];

export interface IExercise {
  name: string;
  sets?: number;
  reps?: number;
  restSeconds?: number;
  notes?: string;
}

export interface IWorkoutPlan extends Document {
  title: string;
  description?: string;
  clientId: Types.ObjectId;
  trainerId?: Types.ObjectId;
  difficulty: Difficulty;
  daysPerWeek: number;
  exercises: IExercise[];
  status: PlanStatus;
  createdAt: Date;
  updatedAt: Date;
}

const exerciseSchema = new Schema<IExercise>(
  {
    name: { type: String, required: true, trim: true },
    sets: { type: Number },
    reps: { type: Number },
    restSeconds: { type: Number },
    notes: { type: String, trim: true },
  },
  { _id: false },
);

const workoutPlanSchema = new Schema<IWorkoutPlan>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    trainerId: { type: Schema.Types.ObjectId, ref: 'User' },
    difficulty: { type: String, enum: DIFFICULTIES, required: true },
    daysPerWeek: { type: Number, required: true, min: 1, max: 7 },
    exercises: { type: [exerciseSchema], default: [] },
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

export const WorkoutPlan = model<IWorkoutPlan>('WorkoutPlan', workoutPlanSchema);
