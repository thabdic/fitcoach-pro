import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/user.model';

interface NavItem {
  label: string;
  icon: string;
  path: string;
  testid: string;
}

/** Role-specific navigation, keyed by role. */
const MENUS: Record<UserRole, NavItem[]> = {
  client: [
    { label: 'Dashboard', icon: 'pi pi-home', path: '/dashboard', testid: 'sidebar-dashboard' },
    { label: 'My Profile', icon: 'pi pi-user', path: '/profile', testid: 'sidebar-profile' },
    { label: 'Request Plan', icon: 'pi pi-send', path: '/plan-requests', testid: 'sidebar-plan-requests' },
    { label: 'My Workout Plans', icon: 'pi pi-bolt', path: '/workout-plans', testid: 'sidebar-workout-plans' },
    { label: 'My Meal Plans', icon: 'pi pi-apple', path: '/meal-plans', testid: 'sidebar-meal-plans' },
    { label: 'My Progress', icon: 'pi pi-chart-line', path: '/progress', testid: 'sidebar-progress' },
  ],
  trainer: [
    { label: 'Dashboard', icon: 'pi pi-home', path: '/dashboard', testid: 'sidebar-dashboard' },
    { label: 'My Clients', icon: 'pi pi-users', path: '/clients', testid: 'sidebar-clients' },
    { label: 'Plan Requests', icon: 'pi pi-inbox', path: '/plan-requests', testid: 'sidebar-plan-requests' },
    { label: 'Workout Plans', icon: 'pi pi-bolt', path: '/workout-plans', testid: 'sidebar-workout-plans' },
    { label: 'Meal Plans', icon: 'pi pi-apple', path: '/meal-plans', testid: 'sidebar-meal-plans' },
    { label: 'Client Progress', icon: 'pi pi-chart-line', path: '/progress', testid: 'sidebar-progress' },
  ],
  admin: [
    { label: 'Dashboard', icon: 'pi pi-home', path: '/dashboard', testid: 'sidebar-dashboard' },
    { label: 'Users', icon: 'pi pi-users', path: '/users', testid: 'sidebar-users' },
    { label: 'All Plan Requests', icon: 'pi pi-inbox', path: '/plan-requests', testid: 'sidebar-plan-requests' },
    { label: 'Workout Plans', icon: 'pi pi-bolt', path: '/workout-plans', testid: 'sidebar-workout-plans' },
    { label: 'Meal Plans', icon: 'pi pi-apple', path: '/meal-plans', testid: 'sidebar-meal-plans' },
  ],
};

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  private readonly auth = inject(AuthService);

  readonly items = computed<NavItem[]>(() => {
    const role = this.auth.role();
    return role ? MENUS[role] : [];
  });
}
