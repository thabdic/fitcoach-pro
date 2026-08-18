import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, me } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { requireAuth } from '../middleware/auth.middleware';

export const authRoutes = Router();

/**
 * Validation for public registration. Note `role` is restricted to
 * client|trainer — admin accounts cannot be created through this endpoint.
 */
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('role')
    .optional()
    .isIn(['client', 'trainer'])
    .withMessage('Role must be either client or trainer'),
];

const loginRules = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

// POST /api/auth/register — create a client or trainer account.
authRoutes.post('/register', registerRules, validate, register);

// POST /api/auth/login — exchange credentials for a JWT.
authRoutes.post('/login', loginRules, validate, login);

// GET /api/auth/me — return the current authenticated user.
authRoutes.get('/me', requireAuth, me);
