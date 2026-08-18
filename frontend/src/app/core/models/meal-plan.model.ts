import { PlanStatus } from './workout-plan.model';

export interface Meal {
  name: string;
  timeOfDay?: string;
  foods: string[];
  notes?: string;
}

export interface MealPlan {
  _id: string;
  title: string;
  description?: string;
  clientId: string;
  trainerId?: string;
  caloriesTarget: number;
  meals: Meal[];
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MealPlanInput {
  title: string;
  description?: string;
  clientId: string;
  caloriesTarget: number;
  meals: Meal[];
  status?: PlanStatus;
}
