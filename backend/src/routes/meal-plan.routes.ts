import { Router } from 'express';
import { body, param, ValidationChain } from 'express-validator';
import {
  listMealPlans,
  createMealPlan,
  getMealPlan,
  updateMealPlan,
  deleteMealPlan,
} from '../controllers/meal-plan.controller';
import { validate } from '../middleware/validate.middleware';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { PLAN_STATUSES } from '../models/workout-plan.model';

export const mealPlanRoutes = Router();

mealPlanRoutes.use(requireAuth);

const idRule = [param('id').isMongoId().withMessage('Invalid meal plan id')];

function mealValidators(optional: boolean) {
  const maybe = (chain: ValidationChain) => (optional ? chain.optional() : chain);
  return [
    maybe(body('title')).trim().notEmpty().withMessage('Title is required'),
    maybe(body('caloriesTarget')).isInt({ min: 1 }).withMessage('caloriesTarget must be a positive number'),
    body('description').optional().isString(),
    body('status').optional().isIn(PLAN_STATUSES).withMessage(`Status must be one of: ${PLAN_STATUSES.join(', ')}`),
    body('meals').optional().isArray().withMessage('meals must be an array'),
    body('meals.*.name').notEmpty().withMessage('Each meal needs a name'),
    body('meals.*.timeOfDay').optional().isString(),
    body('meals.*.foods').optional().isArray().withMessage('foods must be an array of strings'),
    body('meals.*.notes').optional().isString(),
  ];
}

const clientIdRule = body('clientId').isMongoId().withMessage('clientId must be a valid user id');

mealPlanRoutes.get('/', listMealPlans);

mealPlanRoutes.post(
  '/',
  requireRole('trainer', 'admin'),
  [clientIdRule, ...mealValidators(false)],
  validate,
  createMealPlan,
);

mealPlanRoutes.get('/:id', idRule, validate, getMealPlan);

mealPlanRoutes.put(
  '/:id',
  requireRole('trainer', 'admin'),
  [...idRule, ...mealValidators(true)],
  validate,
  updateMealPlan,
);

mealPlanRoutes.delete('/:id', requireRole('admin'), idRule, validate, deleteMealPlan);
