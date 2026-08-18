import { Request, Response, NextFunction } from 'express';
import { FitnessProfile } from '../models/fitness-profile.model';
import { ok, fail } from '../utils/api-response';

/**
 * Fitness-profile controllers. Each user owns exactly one profile, keyed by
 * req.user.id (set by requireAuth) — so a caller can only ever read/write their
 * own. Admin/trainer cross-user access is intentionally deferred.
 */

// Fields a client is allowed to set on their profile.
const PROFILE_FIELDS = [
  'age',
  'gender',
  'heightCm',
  'weightKg',
  'goal',
  'activityLevel',
  'injuries',
  'dietaryPreference',
  'notes',
] as const;

function pickProfileFields(body: Record<string, unknown>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const field of PROFILE_FIELDS) {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  }
  return data;
}

// GET /api/profile/me — the caller's own profile.
export async function getMyProfile(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const profile = await FitnessProfile.findOne({ userId: req.user!.id });
    if (!profile) {
      return fail(res, 'Profile not found. Create one first.', 404);
    }
    return ok(res, { profile });
  } catch (err) {
    return next(err);
  }
}

// POST /api/profile — create the caller's profile (one per user).
export async function createMyProfile(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const userId = req.user!.id;
    const existing = await FitnessProfile.findOne({ userId });
    if (existing) {
      return fail(res, 'A profile already exists. Use PUT /api/profile/me to update it.', 409);
    }

    const profile = await FitnessProfile.create({ userId, ...pickProfileFields(req.body) });
    return ok(res, { profile }, 201);
  } catch (err) {
    return next(err);
  }
}

// PUT /api/profile/me — update the caller's profile.
export async function updateMyProfile(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const profile = await FitnessProfile.findOneAndUpdate(
      { userId: req.user!.id },
      { $set: pickProfileFields(req.body) },
      { new: true, runValidators: true },
    );
    if (!profile) {
      return fail(res, 'Profile not found. Create one first.', 404);
    }
    return ok(res, { profile });
  } catch (err) {
    return next(err);
  }
}
