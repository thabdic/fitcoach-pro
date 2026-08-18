export interface ProgressUpdate {
  _id: string;
  clientId: string;
  trainerId?: string;
  weightKg?: number;
  mood?: string;
  energyLevel?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressUpdateInput {
  weightKg?: number;
  mood?: string;
  energyLevel?: number;
  notes?: string;
}
