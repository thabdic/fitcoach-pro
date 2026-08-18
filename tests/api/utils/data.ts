/**
 * Known-good payloads and the legal enum values, so invalid-value tests can pick
 * something deliberately off-list.
 *
 * Copied from the models (tests can't import backend code across the two
 * tsconfigs): fitness-profile.model.ts:7-21, workout-plan.model.ts:3-4,
 * plan-request.model.ts:7.
 */

export const GENDERS = ['male', 'female', 'other'] as const;
export const GOALS = ['lose_weight', 'build_muscle', 'maintain', 'improve_endurance', 'general_fitness'] as const;
export const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const;
export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;
export const PLAN_STATUSES = ['draft', 'assigned', 'archived'] as const;
export const PLAN_REQUEST_STATUSES = ['pending', 'assigned', 'in_progress', 'completed', 'rejected'] as const;

/** All six fields are required by POST /profile; PUT /profile/me allows partials. */
export const validProfile = {
  age: 30,
  gender: 'male',
  heightCm: 180,
  weightKg: 80,
  goal: 'build_muscle',
  activityLevel: 'moderate',
};

export const validWorkoutPlan = (clientId: string) => ({
  title: `Strength A ${Date.now()}`,
  clientId,
  difficulty: 'beginner',
  daysPerWeek: 3,
  status: 'assigned',
  exercises: [{ name: 'Back Squat', sets: 5, reps: 5, restSeconds: 120 }],
});

export const validMealPlan = (clientId: string) => ({
  title: `Lean Cut ${Date.now()}`,
  clientId,
  caloriesTarget: 1800,
  status: 'assigned',
  meals: [{ name: 'Breakfast', timeOfDay: 'morning', foods: ['Oats', 'Eggs'] }],
});

/** weightKg 20-500, energyLevel 1-10 (progress-update.model.ts). */
export const validProgress = {
  weightKg: 80,
  mood: 'motivated',
  energyLevel: 8,
  notes: 'Feeling strong.',
};
