export type PlanRequestStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'rejected';

export const PLAN_REQUEST_STATUSES: PlanRequestStatus[] = [
  'pending',
  'assigned',
  'in_progress',
  'completed',
  'rejected',
];

export interface PlanRequest {
  _id: string;
  clientId: string;
  trainerId?: string;
  goal: string;
  message?: string;
  status: PlanRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PlanRequestInput {
  goal: string;
  message?: string;
}
