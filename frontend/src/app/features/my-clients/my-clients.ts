import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { PlanRequestService } from '../../core/services/plan-request.service';
import { WorkoutPlanService } from '../../core/services/workout-plan.service';
import { MealPlanService } from '../../core/services/meal-plan.service';
import { PlanRequestStatus } from '../../core/models/plan-request.model';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

/** A client plus the at-a-glance counts a trainer cares about. */
interface ClientRow {
  id: string;
  name: string;
  email: string;
  goals: string;
  latestStatus: PlanRequestStatus | null;
  workoutPlans: number;
  mealPlans: number;
}

/**
 * Trainer "My Clients" page (admins see all clients). Joins the trainer-scoped
 * client list with their plan requests and plans to summarise goals, the latest
 * request status, and how many plans each client has.
 */
@Component({
  selector: 'app-my-clients',
  imports: [TitleCasePipe, TableModule, TagModule, ProgressSpinnerModule, EmptyState],
  templateUrl: './my-clients.html',
})
export class MyClients implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly users = inject(UserService);
  private readonly planRequests = inject(PlanRequestService);
  private readonly workoutPlans = inject(WorkoutPlanService);
  private readonly mealPlans = inject(MealPlanService);
  private readonly messages = inject(MessageService);

  readonly isAdmin = computed(() => this.auth.role() === 'admin');
  readonly loading = signal(true);
  readonly clients = signal<ClientRow[]>([]);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      clients: this.users.myClients(),
      requests: this.planRequests.list(),
      workouts: this.workoutPlans.list(),
      meals: this.mealPlans.list(),
    }).subscribe({
      next: ({ clients, requests, workouts, meals }) => {
        const rows = clients.map<ClientRow>((c) => {
          const theirRequests = requests.filter((r) => r.clientId === c._id);
          const goals = [...new Set(theirRequests.map((r) => r.goal))].join(', ');
          // The API returns requests newest-first, so the first match is the latest.
          const latestStatus = theirRequests[0]?.status ?? null;
          return {
            id: c._id,
            name: c.name,
            email: c.email,
            goals: goals || '—',
            latestStatus,
            workoutPlans: workouts.filter((p) => p.clientId === c._id).length,
            mealPlans: meals.filter((p) => p.clientId === c._id).length,
          };
        });
        this.clients.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messages.add({ severity: 'error', summary: 'My Clients', detail: 'Could not load clients.' });
      },
    });
  }

  statusSeverity(status: PlanRequestStatus): 'warn' | 'info' | 'success' | 'danger' {
    switch (status) {
      case 'pending':
        return 'warn';
      case 'completed':
        return 'success';
      case 'rejected':
        return 'danger';
      default:
        return 'info';
    }
  }
}
