import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { ok, fail } from '../utils/api-response';

/**
 * POST /api/auth/register
 * Public self-registration. Only `client` and `trainer` roles are accepted here
 * (enforced again by validation); admins are created via the seed/admin tools.
 */
export async function register(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const { name, email, password, role } = req.body as {
      name: string;
      email: string;
      password: string;
      role?: 'client' | 'trainer';
    };

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return fail(res, 'An account with this email already exists', 409);
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      role: role ?? 'client',
    });

    const token = generateToken({ userId: user._id.toString(), role: user.role });
    return ok(res, { token, user }, 201);
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/auth/login
 * Verifies credentials and returns a JWT plus the (sanitized) user. Inactive
 * accounts are refused. Error messages stay generic to avoid leaking which
 * part of the credentials was wrong.
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return fail(res, 'Invalid email or password', 401);
    }

    const matches = await comparePassword(password, user.passwordHash);
    if (!matches) {
      return fail(res, 'Invalid email or password', 401);
    }

    if (!user.isActive) {
      return fail(res, 'Account is inactive. Please contact an administrator.', 403);
    }

    const token = generateToken({ userId: user._id.toString(), role: user.role });
    return ok(res, { token, user });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/auth/me
 * Returns the authenticated user. requireAuth has already validated the token
 * and attached `req.user`.
 */
export async function me(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    if (!req.user) {
      return fail(res, 'Authentication required', 401);
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return fail(res, 'User not found', 404);
    }

    return ok(res, { user });
  } catch (err) {
    return next(err);
  }
}
