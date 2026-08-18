export type Gender = 'male' | 'female' | 'other';
export type Goal = 'lose_weight' | 'build_muscle' | 'maintain' | 'improve_endurance' | 'general_fitness';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export const GENDERS: Gender[] = ['male', 'female', 'other'];
export const GOALS: Goal[] = ['lose_weight', 'build_muscle', 'maintain', 'improve_endurance', 'general_fitness'];
export const ACTIVITY_LEVELS: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active', 'very_active'];

export interface FitnessProfile {
  _id: string;
  userId: string;
  age: number;
  gender?: Gender;
  heightCm: number;
  weightKg: number;
  goal: Goal;
  activityLevel: ActivityLevel;
  injuries?: string;
  dietaryPreference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FitnessProfileInput {
  age: number;
  gender?: Gender;
  heightCm: number;
  weightKg: number;
  goal: Goal;
  activityLevel: ActivityLevel;
  injuries?: string;
  dietaryPreference?: string;
  notes?: string;
}
