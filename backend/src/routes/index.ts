import { Router } from 'express';
import { healthRoutes } from './health.routes';
import { authRoutes } from './auth.routes';
import { userRoutes } from './user.routes';
import { profileRoutes } from './profile.routes';
import { planRequestRoutes } from './plan-request.routes';
import { workoutPlanRoutes } from './workout-plan.routes';
import { mealPlanRoutes } from './meal-plan.routes';
import { progressRoutes } from './progress.routes';
import { dashboardRoutes } from './dashboard.routes';

/**
 * Central API router, mounted at /api in app.ts. Feature routers are added
 * here as they are built in later phases — each gets its own file under
 * routes/ and is registered with a single apiRouter.use(...) line.
 */
export const apiRouter = Router();

apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/profile', profileRoutes);
apiRouter.use('/plan-requests', planRequestRoutes);
apiRouter.use('/workout-plans', workoutPlanRoutes);
apiRouter.use('/meal-plans', mealPlanRoutes);
apiRouter.use('/progress', progressRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
