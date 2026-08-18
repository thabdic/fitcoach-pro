export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type PlanStatus = 'draft' | 'assigned' | 'archived';

export const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced'];
export const PLAN_STATUSES: PlanStatus[] = ['draft', 'assigned', 'archived'];

export interface Exercise {
  name: string;
  sets?: number;
  reps?: number;
  restSeconds?: number;
  notes?: string;
}

export interface WorkoutPlan {
  _id: string;
  title: string;
  description?: string;
  clientId: string;
  trainerId?: string;
  difficulty: Difficulty;
  daysPerWeek: number;
  exercises: Exercise[];
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutPlanInput {
  title: string;
  description?: string;
  clientId: string;
  difficulty: Difficulty;
  daysPerWeek: number;
  exercises: Exercise[];
  status?: PlanStatus;
}
