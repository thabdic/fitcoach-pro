import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  listPlanRequests,
  createPlanRequest,
  getPlanRequest,
  assignPlanRequest,
  updatePlanRequestStatus,
} from '../controllers/plan-request.controller';
import { validate } from '../middleware/validate.middleware';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { PLAN_REQUEST_STATUSES } from '../models/plan-request.model';

export const planRequestRoutes = Router();

// Everything here needs a logged-in user; finer rules are per-route below.
planRequestRoutes.use(requireAuth);

const idRule = [param('id').isMongoId().withMessage('Invalid plan request id')];

// GET /api/plan-requests — list (role-scoped in the controller).
planRequestRoutes.get('/', listPlanRequests);

// POST /api/plan-requests — clients only, always for themselves.
planRequestRoutes.post(
  '/',
  requireRole('client'),
  [
    body('goal').trim().notEmpty().withMessage('Goal is required'),
    body('message').optional().isString().isLength({ max: 1000 }).withMessage('Message must be at most 1000 characters'),
  ],
  validate,
  createPlanRequest,
);

// GET /api/plan-requests/:id — owner/assigned-trainer/admin (checked in controller).
planRequestRoutes.get('/:id', idRule, validate, getPlanRequest);

// PATCH /api/plan-requests/:id/assign — admin only.
planRequestRoutes.patch(
  '/:id/assign',
  requireRole('admin'),
  [...idRule, body('trainerId').isMongoId().withMessage('trainerId must be a valid user id')],
  validate,
  assignPlanRequest,
);

// PATCH /api/plan-requests/:id/status — admin or assigned trainer (checked in controller).
planRequestRoutes.patch(
  '/:id/status',
  [
    ...idRule,
    body('status').isIn(PLAN_REQUEST_STATUSES).withMessage(`Status must be one of: ${PLAN_REQUEST_STATUSES.join(', ')}`),
  ],
  validate,
  updatePlanRequestStatus,
);
