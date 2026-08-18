import { NextFunction, Request, Response } from 'express';
import { fail } from '../utils/api-response';
import { verifyToken } from '../utils/jwt';
import { User } from '../models/user.model';

export type UserRole = 'client' | 'trainer' | 'admin';

/**
 * The authenticated principal attached to a request once a valid token has
 * been verified. Controllers read `req.user` to know who is calling.
 */
export interface AuthUser {
  id: string;
  role: UserRole;
}

// Augment Express' Request so `req.user` is typed across the codebase.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Auth middleware (Phase 3).
 *
 * Extracts the Bearer token, verifies its signature/expiry, then loads the user
 * to honor live `isActive`/`role` state (a token alone is not trusted for these).
 * On success it populates `req.user` and calls next(); otherwise it responds
 * with a clear 401.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return fail(res, 'Authentication required', 401);
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return fail(res, 'Authentication required', 401);
  }

  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.userId);

    if (!user) {
      return fail(res, 'Invalid or expired token', 401);
    }
    if (!user.isActive) {
      return fail(res, 'Account is inactive', 403);
    }

    req.user = { id: user._id.toString(), role: user.role };
    return next();
  } catch {
    return fail(res, 'Invalid or expired token', 401);
  }
}
