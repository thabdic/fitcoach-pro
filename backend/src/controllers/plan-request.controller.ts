import { Request, Response, NextFunction } from 'express';
import { PlanRequest, PlanRequestStatus } from '../models/plan-request.model';
import { User } from '../models/user.model';
import { ok, fail } from '../utils/api-response';

/**
 * Legal status transitions. Any (from -> to) pair not listed here is rejected,
 * so impossible jumps (e.g. completed -> pending) can't happen.
 *   pending      -> assigned | rejected
 *   assigned     -> in_progress | rejected
 *   in_progress  -> completed | rejected
 *   completed    -> (terminal)
 *   rejected     -> (terminal)
 */
const ALLOWED_TRANSITIONS: Record<PlanRequestStatus, PlanRequestStatus[]> = {
  pending: ['assigned', 'rejected'],
  assigned: ['in_progress', 'rejected'],
  in_progress: ['completed', 'rejected'],
  completed: [],
  rejected: [],
};

// GET /api/plan-requests — scoped to the caller's role.
export async function listPlanRequests(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const { id, role } = req.user!;
    const filter =
      role === 'admin' ? {} : role === 'trainer' ? { trainerId: id } : { clientId: id };

    const requests = await PlanRequest.find(filter).sort({ createdAt: -1 });
    return ok(res, { requests });
  } catch (err) {
    return next(err);
  }
}

// POST /api/plan-requests — a client creates a request for themselves.
export async function createPlanRequest(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const { goal, message } = req.body as { goal: string; message?: string };

    const request = await PlanRequest.create({
      clientId: req.user!.id, // always self — never trust a body-supplied client
      goal,
      message,
      status: 'pending',
    });
    return ok(res, { request }, 201);
  } catch (err) {
    return next(err);
  }
}

// GET /api/plan-requests/:id — owner (client), assigned trainer, or admin.
export async function getPlanRequest(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const request = await PlanRequest.findById(req.params.id);
    if (!request) {
      return fail(res, 'Plan request not found', 404);
    }
    if (!canView(req.user!, request)) {
      return fail(res, 'You do not have permission to access this request', 403);
    }
    return ok(res, { request });
  } catch (err) {
    return next(err);
  }
}

// PATCH /api/plan-requests/:id/assign — admin assigns a trainer.
export async function assignPlanRequest(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const { trainerId } = req.body as { trainerId: string };

    const request = await PlanRequest.findById(req.params.id);
    if (!request) {
      return fail(res, 'Plan request not found', 404);
    }
    if (request.status === 'completed' || request.status === 'rejected') {
      return fail(res, `Cannot assign a trainer to a ${request.status} request`, 400);
    }

    const trainer = await User.findById(trainerId);
    if (!trainer || trainer.role !== 'trainer') {
      return fail(res, 'trainerId must reference a user with the trainer role', 400);
    }
    if (!trainer.isActive) {
      return fail(res, 'Cannot assign an inactive trainer', 400);
    }

    request.trainerId = trainer._id;
    // Assigning moves a fresh request from pending into the assigned state.
    if (request.status === 'pending') {
      request.status = 'assigned';
    }
    await request.save();
    return ok(res, { request });
  } catch (err) {
    return next(err);
  }
}

// PATCH /api/plan-requests/:id/status — admin or the assigned trainer.
export async function updatePlanRequestStatus(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const { status } = req.body as { status: PlanRequestStatus };

    const request = await PlanRequest.findById(req.params.id);
    if (!request) {
      return fail(res, 'Plan request not found', 404);
    }
    if (!canManageStatus(req.user!, request)) {
      return fail(res, 'You do not have permission to update this request', 403);
    }

    if (!ALLOWED_TRANSITIONS[request.status].includes(status)) {
      return fail(res, `Cannot change status from ${request.status} to ${status}`, 400);
    }

    request.status = status;
    await request.save();
    return ok(res, { request });
  } catch (err) {
    return next(err);
  }
}

/** A request is visible to admins, its owning client, or its assigned trainer. */
function canView(user: { id: string; role: string }, request: { clientId: unknown; trainerId?: unknown }): boolean {
  if (user.role === 'admin') return true;
  if (user.role === 'client') return String(request.clientId) === user.id;
  if (user.role === 'trainer') return String(request.trainerId ?? '') === user.id;
  return false;
}

/** Only an admin or the assigned trainer may drive the status flow. */
function canManageStatus(user: { id: string; role: string }, request: { trainerId?: unknown }): boolean {
  if (user.role === 'admin') return true;
  if (user.role === 'trainer') return String(request.trainerId ?? '') === user.id;
  return false; // clients can never change status
}
