import { Request, Response, NextFunction } from 'express';
import { ProgressUpdate } from '../models/progress-update.model';
import { PlanRequest } from '../models/plan-request.model';
import { ok, fail } from '../utils/api-response';
import { getAssignedClientIds, isTrainerAssignedToClient } from '../utils/plan-access';

// GET /api/progress — role-scoped list.
export async function listProgress(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const { id, role } = req.user!;
    let filter: Record<string, unknown>;
    if (role === 'admin') {
      filter = {};
    } else if (role === 'trainer') {
      filter = { clientId: { $in: await getAssignedClientIds(id) } };
    } else {
      filter = { clientId: id };
    }

    const updates = await ProgressUpdate.find(filter).sort({ createdAt: -1 });
    return ok(res, { updates });
  } catch (err) {
    return next(err);
  }
}

// POST /api/progress — a client logs their own update (never for someone else).
export async function createProgress(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const clientId = req.user!.id; // always self
    const { weightKg, mood, energyLevel, notes } = req.body;

    // Snapshot the client's assigned trainer (if any) for convenience/reporting.
    const latestAssigned = await PlanRequest.findOne({ clientId, trainerId: { $exists: true } }).sort({ updatedAt: -1 });

    const update = await ProgressUpdate.create({
      clientId,
      trainerId: latestAssigned?.trainerId,
      weightKg,
      mood,
      energyLevel,
      notes,
    });
    return ok(res, { update }, 201);
  } catch (err) {
    return next(err);
  }
}

// GET /api/progress/:id — author client, an assigned trainer, or admin.
export async function getProgress(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const update = await ProgressUpdate.findById(req.params.id);
    if (!update) {
      return fail(res, 'Progress update not found', 404);
    }

    const { id, role } = req.user!;
    let allowed = false;
    if (role === 'admin') {
      allowed = true;
    } else if (role === 'client') {
      allowed = String(update.clientId) === id;
    } else if (role === 'trainer') {
      allowed = await isTrainerAssignedToClient(id, String(update.clientId));
    }

    if (!allowed) {
      return fail(res, 'You do not have permission to access this progress update', 403);
    }
    return ok(res, { update });
  } catch (err) {
    return next(err);
  }
}
