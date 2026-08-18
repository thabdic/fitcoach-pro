import { Schema, model, Document, Types } from 'mongoose';

/**
 * A client's self-reported progress check-in. `clientId` is always the author;
 * `trainerId` is a best-effort snapshot of the client's assigned trainer at the
 * time of the update (may be absent if no trainer was assigned yet). Trainer
 * visibility is authorized via the live plan-request assignment, not this field.
 */
export interface IProgressUpdate extends Document {
  clientId: Types.ObjectId;
  trainerId?: Types.ObjectId;
  weightKg?: number;
  mood?: string;
  energyLevel?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const progressUpdateSchema = new Schema<IProgressUpdate>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    trainerId: { type: Schema.Types.ObjectId, ref: 'User' },
    weightKg: { type: Number, min: 20, max: 500 },
    mood: { type: String, trim: true },
    energyLevel: { type: Number, min: 1, max: 10 },
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

export const ProgressUpdate = model<IProgressUpdate>('ProgressUpdate', progressUpdateSchema);
