import { Request, Response, NextFunction } from 'express';
import { WorkoutPlan } from '../models/workout-plan.model';
import { ok, fail } from '../utils/api-response';
import {
  planListFilter,
  canViewPlan,
  canModifyPlan,
  resolveCreateOwnership,
} from '../utils/plan-access';

// Content fields a trainer/admin may set on update (ownership stays fixed).
const UPDATABLE = ['title', 'description', 'difficulty', 'daysPerWeek', 'exercises', 'status'] as const;

function pickUpdatable(body: Record<string, unknown>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const f of UPDATABLE) {
    if (body[f] !== undefined) data[f] = body[f];
  }
  return data;
}

// GET /api/workout-plans — role-scoped list.
export async function listWorkoutPlans(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const plans = await WorkoutPlan.find(planListFilter(req.user!)).sort({ createdAt: -1 });
    return ok(res, { plans });
  } catch (err) {
    return next(err);
  }
}

// POST /api/workout-plans — trainer (for assigned client) or admin.
export async function createWorkoutPlan(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const ownership = await resolveCreateOwnership(req.user!, req.body);
    const { title, description, difficulty, daysPerWeek, exercises, status } = req.body;
    const plan = await WorkoutPlan.create({
      ...ownership,
      title,
      description,
      difficulty,
      daysPerWeek,
      exercises,
      status,
    });
    return ok(res, { plan }, 201);
  } catch (err) {
    return next(err);
  }
}

// GET /api/workout-plans/:id — admin, assigned trainer, or owning client (if assigned).
export async function getWorkoutPlan(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const plan = await WorkoutPlan.findById(req.params.id);
    if (!plan) return fail(res, 'Workout plan not found', 404);
    if (!canViewPlan(req.user!, plan)) {
      return fail(res, 'You do not have permission to access this plan', 403);
    }
    return ok(res, { plan });
  } catch (err) {
    return next(err);
  }
}

// PUT /api/workout-plans/:id — admin or the assigned trainer.
export async function updateWorkoutPlan(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const plan = await WorkoutPlan.findById(req.params.id);
    if (!plan) return fail(res, 'Workout plan not found', 404);
    if (!canModifyPlan(req.user!, plan)) {
      return fail(res, 'You do not have permission to update this plan', 403);
    }

    plan.set(pickUpdatable(req.body));
    await plan.save();
    return ok(res, { plan });
  } catch (err) {
    return next(err);
  }
}

// DELETE /api/workout-plans/:id — admin only (enforced in the router).
export async function deleteWorkoutPlan(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const plan = await WorkoutPlan.findByIdAndDelete(req.params.id);
    if (!plan) return fail(res, 'Workout plan not found', 404);
    return ok(res, { message: 'Workout plan deleted', id: req.params.id });
  } catch (err) {
    return next(err);
  }
}
