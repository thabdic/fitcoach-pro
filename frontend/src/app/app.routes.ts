import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { AppShell } from './layout/app-shell/app-shell';
import { Dashboard } from './features/dashboard/dashboard';
import { Profile } from './features/profile/profile';
import { PlanRequests } from './features/plan-requests/plan-requests';
import { WorkoutPlans } from './features/workout-plans/workout-plans';
import { MealPlans } from './features/meal-plans/meal-plans';
import { Progress } from './features/progress/progress';
import { Users } from './features/users/users';
import { MyClients } from './features/my-clients/my-clients';

/**
 * Public auth routes live outside the shell. Everything else sits under the
 * authenticated AppShell (sidebar + topbar) behind authGuard. Role-specific
 * behavior inside shared pages is driven by the user's role; backend remains
 * the source of truth for authorization.
 */
export const routes: Routes = [
  { path: 'login', component: Login, title: 'Sign in · FitCoach Pro' },
  { path: 'register', component: Register, title: 'Register · FitCoach Pro' },

  {
    path: '',
    component: AppShell,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard, title: 'Dashboard · FitCoach Pro' },
      { path: 'profile', component: Profile, title: 'My Profile · FitCoach Pro' },
      { path: 'plan-requests', component: PlanRequests, title: 'Plan Requests · FitCoach Pro' },
      { path: 'workout-plans', component: WorkoutPlans, title: 'Workout Plans · FitCoach Pro' },
      { path: 'meal-plans', component: MealPlans, title: 'Meal Plans · FitCoach Pro' },
      { path: 'progress', component: Progress, title: 'Progress · FitCoach Pro' },
      {
        path: 'clients',
        component: MyClients,
        canActivate: [roleGuard('trainer', 'admin')],
        title: 'My Clients · FitCoach Pro',
      },
      {
        path: 'users',
        component: Users,
        canActivate: [roleGuard('admin')],
        title: 'Users · FitCoach Pro',
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },

  { path: '**', redirectTo: '' },
];
