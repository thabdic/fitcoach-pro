import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model';
import { PlanRequest } from '../models/plan-request.model';
import { WorkoutPlan } from '../models/workout-plan.model';
import { MealPlan } from '../models/meal-plan.model';
import { ProgressUpdate } from '../models/progress-update.model';
import { ok } from '../utils/api-response';
import { getAssignedClientIds } from '../utils/plan-access';

/**
 * GET /api/dashboard/stats — role-specific aggregate counters. The response
 * shape differs per role (client/trainer/admin) and always includes `role` so
 * the frontend can branch on it.
 */
export async function getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const { id, role } = req.user!;

    if (role === 'client') {
      const [activeWorkoutPlans, activeMealPlans, progressUpdates, latestRequest] = await Promise.all([
        WorkoutPlan.countDocuments({ clientId: id, status: 'assigned' }),
        MealPlan.countDocuments({ clientId: id, status: 'assigned' }),
        ProgressUpdate.countDocuments({ clientId: id }),
        PlanRequest.findOne({ clientId: id }).sort({ createdAt: -1 }),
      ]);
      return ok(res, {
        role,
        stats: {
          activeWorkoutPlans,
          activeMealPlans,
          progressUpdates,
          latestRequestStatus: latestRequest?.status ?? null,
        },
      });
    }

    if (role === 'trainer') {
      const assignedClientIds = await getAssignedClientIds(id);
      const [openRequests, activeWorkoutPlans, activeMealPlans] = await Promise.all([
        PlanRequest.countDocuments({ trainerId: id, status: { $in: ['assigned', 'in_progress'] } }),
        WorkoutPlan.countDocuments({ trainerId: id, status: 'assigned' }),
        MealPlan.countDocuments({ trainerId: id, status: 'assigned' }),
      ]);
      return ok(res, {
        role,
        stats: {
          assignedClients: assignedClientIds.length,
          openRequests,
          activeWorkoutPlans,
          activeMealPlans,
        },
      });
    }

    // admin
    const [totalUsers, totalClients, totalTrainers, pendingRequests, totalWorkoutPlans, totalMealPlans] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'client' }),
        User.countDocuments({ role: 'trainer' }),
        PlanRequest.countDocuments({ status: 'pending' }),
        WorkoutPlan.countDocuments(),
        MealPlan.countDocuments(),
      ]);
    return ok(res, {
      role,
      stats: {
        totalUsers,
        totalClients,
        totalTrainers,
        pendingRequests,
        totalWorkoutPlans,
        totalMealPlans,
      },
    });
  } catch (err) {
    return next(err);
  }
}
