import { Router } from 'express';
import { body, param, ValidationChain } from 'express-validator';
import {
  listWorkoutPlans,
  createWorkoutPlan,
  getWorkoutPlan,
  updateWorkoutPlan,
  deleteWorkoutPlan,
} from '../controllers/workout-plan.controller';
import { validate } from '../middleware/validate.middleware';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { DIFFICULTIES, PLAN_STATUSES } from '../models/workout-plan.model';

export const workoutPlanRoutes = Router();

workoutPlanRoutes.use(requireAuth);

const idRule = [param('id').isMongoId().withMessage('Invalid workout plan id')];

/**
 * On create the core fields are required; on update they are optional (partial
 * update) but still validated when present. clientId is only meaningful at
 * create time, so it is required there and ignored on update.
 */
function workoutValidators(optional: boolean) {
  const maybe = (chain: ValidationChain) => (optional ? chain.optional() : chain);
  return [
    maybe(body('title')).trim().notEmpty().withMessage('Title is required'),
    maybe(body('difficulty')).isIn(DIFFICULTIES).withMessage(`Difficulty must be one of: ${DIFFICULTIES.join(', ')}`),
    maybe(body('daysPerWeek')).isInt({ min: 1, max: 7 }).withMessage('daysPerWeek must be between 1 and 7'),
    body('description').optional().isString(),
    body('status').optional().isIn(PLAN_STATUSES).withMessage(`Status must be one of: ${PLAN_STATUSES.join(', ')}`),
    body('exercises').optional().isArray().withMessage('exercises must be an array'),
    body('exercises.*.name').notEmpty().withMessage('Each exercise needs a name'),
    body('exercises.*.sets').optional().isInt({ min: 0 }),
    body('exercises.*.reps').optional().isInt({ min: 0 }),
    body('exercises.*.restSeconds').optional().isInt({ min: 0 }),
    body('exercises.*.notes').optional().isString(),
  ];
}

const clientIdRule = body('clientId').isMongoId().withMessage('clientId must be a valid user id');

workoutPlanRoutes.get('/', listWorkoutPlans);

workoutPlanRoutes.post(
  '/',
  requireRole('trainer', 'admin'),
  [clientIdRule, ...workoutValidators(false)],
  validate,
  createWorkoutPlan,
);

workoutPlanRoutes.get('/:id', idRule, validate, getWorkoutPlan);

workoutPlanRoutes.put(
  '/:id',
  requireRole('trainer', 'admin'),
  [...idRule, ...workoutValidators(true)],
  validate,
  updateWorkoutPlan,
);

workoutPlanRoutes.delete('/:id', requireRole('admin'), idRule, validate, deleteWorkoutPlan);
