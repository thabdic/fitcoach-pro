import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model';
import { ok, fail } from '../utils/api-response';
import { getAssignedClientIds } from '../utils/plan-access';

/**
 * Admin user-management controllers. All routes are guarded by requireAuth +
 * requireRole('admin') in the router, and ObjectId/body shape is checked by
 * express-validator, so handlers can focus on the data. passwordHash is never
 * returned thanks to the User model's toJSON transform.
 */

/**
 * GET /api/users/clients — the clients assigned to the calling trainer (via a
 * plan request that links them), or every client when called by an admin.
 * Trainer-accessible, unlike the admin-only routes below.
 */
export async function listMyClients(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const { id, role } = req.user!;
    const filter =
      role === 'trainer'
        ? { _id: { $in: await getAssignedClientIds(id) }, role: 'client' }
        : { role: 'client' }; // admin: all clients
    const clients = await User.find(filter).sort({ name: 1 });
    return ok(res, { clients });
  } catch (err) {
    return next(err);
  }
}

// GET /api/users — list all users.
export async function listUsers(_req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return ok(res, { users });
  } catch (err) {
    return next(err);
  }
}

// GET /api/users/:id — fetch a single user.
export async function getUser(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return fail(res, 'User not found', 404);
    }
    return ok(res, { user });
  } catch (err) {
    return next(err);
  }
}

// PATCH /api/users/:id/role — change a user's role.
export async function updateUserRole(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const { role } = req.body as { role: 'client' | 'trainer' | 'admin' };
    const user = await User.findById(req.params.id);
    if (!user) {
      return fail(res, 'User not found', 404);
    }

    user.role = role;
    await user.save();
    return ok(res, { user });
  } catch (err) {
    return next(err);
  }
}

// PATCH /api/users/:id/status — activate/deactivate a user.
export async function updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const { isActive } = req.body as { isActive: boolean };

    // Guard against an admin locking themselves out.
    if (req.user && req.user.id === req.params.id && isActive === false) {
      return fail(res, 'You cannot deactivate your own account', 400);
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return fail(res, 'User not found', 404);
    }

    user.isActive = isActive;
    await user.save();
    return ok(res, { user });
  } catch (err) {
    return next(err);
  }
}

// DELETE /api/users/:id — remove a user.
export async function deleteUser(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    // Guard against an admin deleting their own account.
    if (req.user && req.user.id === req.params.id) {
      return fail(res, 'You cannot delete your own account', 400);
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return fail(res, 'User not found', 404);
    }
    return ok(res, { message: 'User deleted', id: req.params.id });
  } catch (err) {
    return next(err);
  }
}
