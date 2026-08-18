import { Component, OnInit, inject, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { StatCard } from '../../shared/components/stat-card/stat-card';
import { UserRole } from '../../core/models/user.model';

interface CardDescriptor {
  label: string;
  value: string | number;
  icon: string;
  testid: string;
}

const slug = (label: string): string => 'stat-' + label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

@Component({
  selector: 'app-dashboard',
  imports: [CardModule, TagModule, ProgressSpinnerModule, TitleCasePipe, StatCard],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly dashboard = inject(DashboardService);
  private readonly messages = inject(MessageService);

  readonly user = this.auth.currentUser;
  readonly loading = signal(true);
  readonly cards = signal<CardDescriptor[]>([]);

  ngOnInit(): void {
    this.dashboard.getStats().subscribe({
      next: ({ role, stats }) => {
        this.cards.set(this.buildCards(role, stats).map((c) => ({ ...c, testid: slug(c.label) })));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messages.add({ severity: 'error', summary: 'Dashboard', detail: 'Could not load your stats.' });
      },
    });
  }

  private buildCards(role: UserRole, s: Record<string, number | string | null>): Omit<CardDescriptor, 'testid'>[] {
    const n = (key: string): number => Number(s[key] ?? 0);
    if (role === 'client') {
      return [
        { label: 'Active Workout Plans', value: n('activeWorkoutPlans'), icon: 'pi pi-bolt' },
        { label: 'Active Meal Plans', value: n('activeMealPlans'), icon: 'pi pi-apple' },
        { label: 'Progress Updates', value: n('progressUpdates'), icon: 'pi pi-chart-line' },
        { label: 'Latest Request', value: (s['latestRequestStatus'] as string | null) ?? '—', icon: 'pi pi-send' },
      ];
    }
    if (role === 'trainer') {
      return [
        { label: 'Assigned Clients', value: n('assignedClients'), icon: 'pi pi-users' },
        { label: 'Open Requests', value: n('openRequests'), icon: 'pi pi-inbox' },
        { label: 'Active Workout Plans', value: n('activeWorkoutPlans'), icon: 'pi pi-bolt' },
        { label: 'Active Meal Plans', value: n('activeMealPlans'), icon: 'pi pi-apple' },
      ];
    }
    return [
      { label: 'Total Users', value: n('totalUsers'), icon: 'pi pi-users' },
      { label: 'Clients', value: n('totalClients'), icon: 'pi pi-user' },
      { label: 'Trainers', value: n('totalTrainers'), icon: 'pi pi-id-card' },
      { label: 'Pending Requests', value: n('pendingRequests'), icon: 'pi pi-inbox' },
      { label: 'Workout Plans', value: n('totalWorkoutPlans'), icon: 'pi pi-bolt' },
      { label: 'Meal Plans', value: n('totalMealPlans'), icon: 'pi pi-apple' },
    ];
  }
}
