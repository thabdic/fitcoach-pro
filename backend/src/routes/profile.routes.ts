import { Router } from 'express';
import { body } from 'express-validator';
import {
  getMyProfile,
  createMyProfile,
  updateMyProfile,
} from '../controllers/profile.controller';
import { validate } from '../middleware/validate.middleware';
import { requireAuth } from '../middleware/auth.middleware';
import { GENDERS, GOALS, ACTIVITY_LEVELS } from '../models/fitness-profile.model';

export const profileRoutes = Router();

// All profile routes require a logged-in user.
profileRoutes.use(requireAuth);

/**
 * Validation. On create the core measurements are required; on update they are
 * optional (so a client can patch a single field) but still range-checked when
 * present. `optional` lets the same checks be reused for both.
 */
function profileValidators(optional: boolean) {
  const maybe = (chain: import('express-validator').ValidationChain) =>
    optional ? chain.optional() : chain;

  return [
    maybe(body('age')).isInt({ min: 13, max: 120 }).withMessage('Age must be between 13 and 120'),
    maybe(body('heightCm')).isFloat({ min: 50, max: 300 }).withMessage('Height (cm) must be between 50 and 300'),
    maybe(body('weightKg')).isFloat({ min: 20, max: 500 }).withMessage('Weight (kg) must be between 20 and 500'),
    maybe(body('goal')).isIn(GOALS).withMessage(`Goal must be one of: ${GOALS.join(', ')}`),
    maybe(body('activityLevel'))
      .isIn(ACTIVITY_LEVELS)
      .withMessage(`Activity level must be one of: ${ACTIVITY_LEVELS.join(', ')}`),
    body('gender').optional().isIn(GENDERS).withMessage(`Gender must be one of: ${GENDERS.join(', ')}`),
    body('injuries').optional().isString(),
    body('dietaryPreference').optional().isString(),
    body('notes').optional().isString(),
  ];
}

profileRoutes.get('/me', getMyProfile);

profileRoutes.post('/', profileValidators(false), validate, createMyProfile);

profileRoutes.put('/me', profileValidators(true), validate, updateMyProfile);
