import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRole } from '../middleware/auth.middleware';

/**
 * The claims we put inside every access token. Kept intentionally small —
 * just enough to identify the caller and authorize without a DB hit, though
 * the auth middleware still loads the user to honor isActive/role changes.
 */
export interface JwtPayload {
  userId: string;
  role: UserRole;
}

/** Sign a JWT for the given user identity. */
export function generateToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.jwtSecret, options);
}

/**
 * Verify and decode a token. Throws (JsonWebTokenError/TokenExpiredError) on any
 * problem; callers translate that into a 401.
 */
export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
  return { userId: decoded.userId, role: decoded.role };
}
