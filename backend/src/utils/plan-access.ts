import { AppError } from '../middleware/error.middleware';
import { User } from '../models/user.model';
import { PlanRequest } from '../models/plan-request.model';

/**
 * Authorization helpers shared by the workout-plan and meal-plan controllers.
 * Both plan types follow the same ownership model:
 *   - admin: full access to everything
 *   - trainer: only plans where trainerId === self
 *   - client: only their own plans that are `assigned` (drafts/archived hidden)
 */
export interface Actor {
  id: string;
  role: string;
}

interface PlanLike {
  clientId: unknown;
  trainerId?: unknown;
  status: string;
}

/** Mongo filter for the role-scoped list endpoint. */
export function planListFilter(actor: Actor): Record<string, unknown> {
  if (actor.role === 'admin') return {};
  if (actor.role === 'trainer') return { trainerId: actor.id };
  return { clientId: actor.id, status: 'assigned' };
}

/** Whether the actor may read a specific plan. */
export function canViewPlan(actor: Actor, plan: PlanLike): boolean {
  if (actor.role === 'admin') return true;
  if (actor.role === 'trainer') return String(plan.trainerId ?? '') === actor.id;
  return String(plan.clientId) === actor.id && plan.status === 'assigned';
}

/** Whether the actor may update/own a specific plan (admin or assigned trainer). */
export function canModifyPlan(actor: Actor, plan: PlanLike): boolean {
  if (actor.role === 'admin') return true;
  if (actor.role === 'trainer') return String(plan.trainerId ?? '') === actor.id;
  return false;
}

/** True if a plan request links this trainer to this client (admin-assigned). */
export async function isTrainerAssignedToClient(trainerId: string, clientId: string): Promise<boolean> {
  const link = await PlanRequest.exists({ trainerId, clientId });
  return Boolean(link);
}

/** Distinct clientIds (as strings) assigned to this trainer via plan requests. */
export async function getAssignedClientIds(trainerId: string): Promise<string[]> {
  const ids = await PlanRequest.distinct('clientId', { trainerId });
  return ids.map((id) => String(id));
}

/**
 * Validate/resolve the clientId and trainerId for a new plan based on who is
 * creating it. Throws AppError (clear message + status) on any problem; returns
 * the ownership fields to spread onto the new document.
 */
export async function resolveCreateOwnership(
  actor: Actor,
  body: { clientId: string; trainerId?: string },
): Promise<{ clientId: string; trainerId?: string }> {
  const client = await User.findById(body.clientId);
  if (!client || client.role !== 'client') {
    throw new AppError('clientId must reference a user with the client role', 400);
  }

  if (actor.role === 'admin') {
    if (body.trainerId) {
      const trainer = await User.findById(body.trainerId);
      if (!trainer || trainer.role !== 'trainer') {
        throw new AppError('trainerId must reference a user with the trainer role', 400);
      }
    }
    return { clientId: body.clientId, trainerId: body.trainerId };
  }

  // Trainer: can only create for a client assigned to them, and only as themselves.
  const assigned = await isTrainerAssignedToClient(actor.id, body.clientId);
  if (!assigned) {
    throw new AppError('You can only create plans for clients assigned to you', 403);
  }
  return { clientId: body.clientId, trainerId: actor.id };
}
