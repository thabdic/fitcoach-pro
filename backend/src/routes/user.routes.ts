import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  listMyClients,
  listUsers,
  getUser,
  updateUserRole,
  updateUserStatus,
  deleteUser,
} from '../controllers/user.controller';
import { validate } from '../middleware/validate.middleware';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

export const userRoutes = Router();

// Trainer-facing: a trainer (or admin) lists their clients. Declared before the
// admin-only guard below so trainers can reach it.
userRoutes.get('/clients', requireAuth, requireRole('trainer', 'admin'), listMyClients);

// Every other user-management route is admin-only.
userRoutes.use(requireAuth, requireRole('admin'));

const idRule = [param('id').isMongoId().withMessage('Invalid user id')];

userRoutes.get('/', listUsers);

userRoutes.get('/:id', idRule, validate, getUser);

userRoutes.patch(
  '/:id/role',
  [
    ...idRule,
    body('role').isIn(['client', 'trainer', 'admin']).withMessage('Role must be client, trainer, or admin'),
  ],
  validate,
  updateUserRole,
);

userRoutes.patch(
  '/:id/status',
  [...idRule, body('isActive').isBoolean().withMessage('isActive must be a boolean')],
  validate,
  updateUserStatus,
);

userRoutes.delete('/:id', idRule, validate, deleteUser);
