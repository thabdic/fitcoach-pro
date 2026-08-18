import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { User } from '../models/user.model';
import { FitnessProfile } from '../models/fitness-profile.model';
import { PlanRequest } from '../models/plan-request.model';
import { WorkoutPlan } from '../models/workout-plan.model';
import { MealPlan } from '../models/meal-plan.model';
import { ProgressUpdate } from '../models/progress-update.model';
import { hashPassword } from '../utils/password';
import { UserRole } from '../middleware/auth.middleware';

/**
 * Seed a realistic, deterministic dataset so every dashboard and table has
 * varied content for manual and (future) automated testing. Idempotent — wipes
 * the seeded collections and recreates everything, so `npm run seed` always
 * yields the same known state with working passwords (all: Password123!).
 *
 * Accounts:
 *   admin@fitcoach.test    (admin)
 *   trainer@fitcoach.test  (trainer)
 *   client@fitcoach.test   (client — Chris, has full assigned plans + progress)
 *   client2@fitcoach.test  (client — Dana, one pending request, awaiting assignment)
 */
interface SeedUser {
  key: string;
  name: string;
  email: string;
  role: UserRole;
}

const PASSWORD = 'Password123!';

const SEED_USERS: SeedUser[] = [
  { key: 'admin', name: 'Avery Admin', email: 'admin@fitcoach.test', role: 'admin' },
  { key: 'trainer', name: 'Taylor Trainer', email: 'trainer@fitcoach.test', role: 'trainer' },
  { key: 'client', name: 'Chris Client', email: 'client@fitcoach.test', role: 'client' },
  { key: 'client2', name: 'Dana Davis', email: 'client2@fitcoach.test', role: 'client' },
];

async function seed(): Promise<void> {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    FitnessProfile.deleteMany({}),
    PlanRequest.deleteMany({}),
    WorkoutPlan.deleteMany({}),
    MealPlan.deleteMany({}),
    ProgressUpdate.deleteMany({}),
  ]);

  // Users
  const ids: Record<string, mongoose.Types.ObjectId> = {};
  const passwordHash = await hashPassword(PASSWORD);
  for (const u of SEED_USERS) {
    const user = await User.create({ name: u.name, email: u.email, passwordHash, role: u.role, isActive: true });
    ids[u.key] = user._id;
    console.log(`[seed] user: ${u.email} (${u.role})`);
  }
  const trainerId = ids['trainer'];
  const client1 = ids['client'];
  const client2 = ids['client2'];

  // Fitness profiles (one per client)
  await FitnessProfile.create({
    userId: client1,
    age: 30,
    gender: 'male',
    heightCm: 180,
    weightKg: 82,
    goal: 'build_muscle',
    activityLevel: 'moderate',
    injuries: 'none',
    dietaryPreference: 'high protein',
    notes: 'Training 4x/week.',
  });
  await FitnessProfile.create({
    userId: client2,
    age: 27,
    gender: 'female',
    heightCm: 165,
    weightKg: 63,
    goal: 'lose_weight',
    activityLevel: 'light',
    injuries: 'left ankle (recovered)',
    dietaryPreference: 'vegetarian',
    notes: 'New to structured training.',
  });
  console.log('[seed] fitness profiles: 2');

  // Plan requests — varied statuses
  await PlanRequest.create({
    clientId: client1,
    trainerId,
    goal: 'Build muscle and improve strength',
    message: 'Looking for a 3-day split.',
    status: 'in_progress',
  });
  await PlanRequest.create({
    clientId: client1,
    trainerId,
    goal: 'Off-season conditioning',
    message: 'Completed last block.',
    status: 'completed',
  });
  await PlanRequest.create({
    clientId: client2,
    trainerId,
    goal: 'Lose 5kg before summer',
    message: 'Prefer home workouts.',
    status: 'assigned',
  });
  // Pending request awaiting admin assignment (drives admin pendingRequests stat).
  await PlanRequest.create({
    clientId: client2,
    goal: 'Add a nutrition plan',
    message: 'Vegetarian-friendly please.',
    status: 'pending',
  });
  console.log('[seed] plan requests: 4 (1 pending, 1 assigned, 1 in_progress, 1 completed)');

  // Workout plans
  await WorkoutPlan.create({
    title: 'Beginner Strength — 3 Day Split',
    description: 'Full-body foundational strength program.',
    clientId: client1,
    trainerId,
    difficulty: 'beginner',
    daysPerWeek: 3,
    status: 'assigned',
    exercises: [
      { name: 'Back Squat', sets: 5, reps: 5, restSeconds: 120, notes: 'Focus on depth' },
      { name: 'Bench Press', sets: 5, reps: 5, restSeconds: 120 },
      { name: 'Deadlift', sets: 1, reps: 5, restSeconds: 180 },
    ],
  });
  await WorkoutPlan.create({
    title: 'Hypertrophy Block (draft)',
    description: 'Next mesocycle — not yet shared with the client.',
    clientId: client1,
    trainerId,
    difficulty: 'intermediate',
    daysPerWeek: 4,
    status: 'draft',
    exercises: [{ name: 'Incline Dumbbell Press', sets: 4, reps: 10, restSeconds: 90 }],
  });
  await WorkoutPlan.create({
    title: 'Fat-Loss Circuit',
    description: 'Home-friendly conditioning circuit.',
    clientId: client2,
    trainerId,
    difficulty: 'beginner',
    daysPerWeek: 3,
    status: 'assigned',
    exercises: [
      { name: 'Goblet Squat', sets: 3, reps: 15, restSeconds: 60 },
      { name: 'Push-up', sets: 3, reps: 12, restSeconds: 60 },
    ],
  });
  console.log('[seed] workout plans: 3 (2 assigned, 1 draft)');

  // Meal plans
  await MealPlan.create({
    title: 'High-Protein Build — 2600 kcal',
    description: 'Supports muscle gain.',
    clientId: client1,
    trainerId,
    caloriesTarget: 2600,
    status: 'assigned',
    meals: [
      { name: 'Breakfast', timeOfDay: 'morning', foods: ['Oats', 'Eggs', 'Berries'], notes: 'Pre-workout' },
      { name: 'Lunch', timeOfDay: 'midday', foods: ['Chicken breast', 'Rice', 'Broccoli'] },
      { name: 'Dinner', timeOfDay: 'evening', foods: ['Salmon', 'Quinoa', 'Asparagus'] },
    ],
  });
  await MealPlan.create({
    title: 'Lean Cut — 1800 kcal',
    description: 'Vegetarian fat-loss plan.',
    clientId: client2,
    trainerId,
    caloriesTarget: 1800,
    status: 'assigned',
    meals: [
      { name: 'Breakfast', timeOfDay: 'morning', foods: ['Greek yogurt', 'Granola'] },
      { name: 'Lunch', timeOfDay: 'midday', foods: ['Lentil salad', 'Hummus'] },
      { name: 'Dinner', timeOfDay: 'evening', foods: ['Tofu stir-fry', 'Brown rice'] },
    ],
  });
  console.log('[seed] meal plans: 2');

  // Progress updates
  await ProgressUpdate.create({ clientId: client1, trainerId, weightKg: 82, mood: 'motivated', energyLevel: 8, notes: 'Week 1 baseline.' });
  await ProgressUpdate.create({ clientId: client1, trainerId, weightKg: 81, mood: 'strong', energyLevel: 9, notes: 'Down 1kg, lifts up.' });
  await ProgressUpdate.create({ clientId: client2, trainerId, weightKg: 63, mood: 'tired', energyLevel: 6, notes: 'Getting used to the routine.' });
  console.log('[seed] progress updates: 3');

  console.log('[seed] Done.');
  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error('[seed] Failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});
