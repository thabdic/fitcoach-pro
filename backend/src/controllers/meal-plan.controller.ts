import { Request, Response, NextFunction } from 'express';
import { MealPlan } from '../models/meal-plan.model';
import { ok, fail } from '../utils/api-response';
import {
  planListFilter,
  canViewPlan,
  canModifyPlan,
  resolveCreateOwnership,
} from '../utils/plan-access';

// Content fields a trainer/admin may set on update (ownership stays fixed).
const UPDATABLE = ['title', 'description', 'caloriesTarget', 'meals', 'status'] as const;

function pickUpdatable(body: Record<string, unknown>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const f of UPDATABLE) {
    if (body[f] !== undefined) data[f] = body[f];
  }
  return data;
}

// GET /api/meal-plans — role-scoped list.
export async function listMealPlans(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const plans = await MealPlan.find(planListFilter(req.user!)).sort({ createdAt: -1 });
    return ok(res, { plans });
  } catch (err) {
    return next(err);
  }
}

// POST /api/meal-plans — trainer (for assigned client) or admin.
export async function createMealPlan(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const ownership = await resolveCreateOwnership(req.user!, req.body);
    const { title, description, caloriesTarget, meals, status } = req.body;
    const plan = await MealPlan.create({
      ...ownership,
      title,
      description,
      caloriesTarget,
      meals,
      status,
    });
    return ok(res, { plan }, 201);
  } catch (err) {
    return next(err);
  }
}

// GET /api/meal-plans/:id — admin, assigned trainer, or owning client (if assigned).
export async function getMealPlan(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const plan = await MealPlan.findById(req.params.id);
    if (!plan) return fail(res, 'Meal plan not found', 404);
    if (!canViewPlan(req.user!, plan)) {
      return fail(res, 'You do not have permission to access this plan', 403);
    }
    return ok(res, { plan });
  } catch (err) {
    return next(err);
  }
}

// PUT /api/meal-plans/:id — admin or the assigned trainer.
export async function updateMealPlan(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const plan = await MealPlan.findById(req.params.id);
    if (!plan) return fail(res, 'Meal plan not found', 404);
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

// DELETE /api/meal-plans/:id — admin only (enforced in the router).
export async function deleteMealPlan(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const plan = await MealPlan.findByIdAndDelete(req.params.id);
    if (!plan) return fail(res, 'Meal plan not found', 404);
    return ok(res, { message: 'Meal plan deleted', id: req.params.id });
  } catch (err) {
    return next(err);
  }
}
