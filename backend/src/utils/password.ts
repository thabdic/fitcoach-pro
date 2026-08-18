import bcrypt from 'bcryptjs';

/**
 * Password hashing helpers. All persistence of credentials goes through here so
 * the cost factor and algorithm live in one place.
 */
const SALT_ROUNDS = 10;

/** Hash a plaintext password for storage. */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/** Compare a plaintext password against a stored hash. */
export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
