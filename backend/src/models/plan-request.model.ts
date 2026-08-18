import { Schema, model, Document, Types } from 'mongoose';

/**
 * Plan-request statuses, exported so controllers/validators stay in sync with
 * the schema. The legal transitions between them live in the controller.
 */
export const PLAN_REQUEST_STATUSES = [
  'pending',
  'assigned',
  'in_progress',
  'completed',
  'rejected',
] as const;

export type PlanRequestStatus = (typeof PLAN_REQUEST_STATUSES)[number];

/**
 * A client's request for a coaching plan. Created by the client (status
 * `pending`, no trainer). An admin assigns a trainer; the admin or that trainer
 * then drives it through the status flow.
 */
export interface IPlanRequest extends Document {
  clientId: Types.ObjectId;
  trainerId?: Types.ObjectId;
  goal: string;
  message?: string;
  status: PlanRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

const planRequestSchema = new Schema<IPlanRequest>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    trainerId: { type: Schema.Types.ObjectId, ref: 'User' },
    goal: { type: String, required: true, trim: true },
    message: { type: String, trim: true },
    status: {
      type: String,
      enum: PLAN_REQUEST_STATUSES,
      default: 'pending',
      required: true,
    },
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

export const PlanRequest = model<IPlanRequest>('PlanRequest', planRequestSchema);
