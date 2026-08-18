import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

/**
 * Factory guard: `roleGuard('admin')`. Allows the route only if the current
 * user's role is in the allowed list, otherwise bounces to the dashboard.
 * NOTE: the backend remains the source of truth — this is UX, not security.
 */
export const roleGuard = (...roles: UserRole[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const role = auth.role();
    if (role && roles.includes(role)) {
      return true;
    }
    return router.createUrlTree(['/dashboard']);
  };
};
