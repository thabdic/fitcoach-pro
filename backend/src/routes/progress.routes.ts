import { Router } from 'express';
import { body, param } from 'express-validator';
import { listProgress, createProgress, getProgress } from '../controllers/progress.controller';
import { validate } from '../middleware/validate.middleware';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

export const progressRoutes = Router();

progressRoutes.use(requireAuth);

// GET /api/progress — list (role-scoped in the controller).
progressRoutes.get('/', listProgress);

// POST /api/progress — clients only, always for themselves.
progressRoutes.post(
  '/',
  requireRole('client'),
  [
    body('weightKg').optional().isFloat({ min: 20, max: 500 }).withMessage('weightKg must be between 20 and 500'),
    body('energyLevel').optional().isInt({ min: 1, max: 10 }).withMessage('energyLevel must be between 1 and 10'),
    body('mood').optional().isString(),
    body('notes').optional().isString().isLength({ max: 1000 }).withMessage('notes must be at most 1000 characters'),
  ],
  validate,
  createProgress,
);

// GET /api/progress/:id — author client / assigned trainer / admin (checked in controller).
progressRoutes.get('/:id', [param('id').isMongoId().withMessage('Invalid progress update id')], validate, getProgress);
