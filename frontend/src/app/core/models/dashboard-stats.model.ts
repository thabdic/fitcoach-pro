import { UserRole } from './user.model';

/**
 * The /dashboard/stats payload. The `stats` object's keys differ by role, so it
 * is typed loosely here and the dashboard component maps it into stat-cards.
 */
export interface DashboardStats {
  role: UserRole;
  stats: Record<string, number | string | null>;
}
