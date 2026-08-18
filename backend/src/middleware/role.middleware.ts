import { NextFunction, Request, Response } from 'express';
import { fail } from '../utils/api-response';
import { UserRole } from './auth.middleware';

/**
 * Role guard. Use after requireAuth, e.g. `router.get('/', requireAuth,
 * requireRole('admin'), handler)`. Rejects callers whose role is not allowed.
 *
 * The logic is complete; it simply depends on requireAuth populating
 * `req.user`, which is wired up in Phase 3.
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    if (!req.user) {
      return fail(res, 'Authentication required', 401);
    }
    if (!roles.includes(req.user.role)) {
      return fail(res, 'You do not have permission to access this resource', 403);
    }
    return next();
  };
}
