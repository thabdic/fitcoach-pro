import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller';
import { requireAuth } from '../middleware/auth.middleware';

export const dashboardRoutes = Router();

// GET /api/dashboard/stats — role-specific stats for the authenticated user.
dashboardRoutes.get('/stats', requireAuth, getDashboardStats);
