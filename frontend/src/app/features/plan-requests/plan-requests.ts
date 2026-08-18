import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { PlanRequestService } from '../../core/services/plan-request.service';
import { UserService } from '../../core/services/user.service';
import {
  PLAN_REQUEST_STATUSES,
  PlanRequest,
  PlanRequestStatus,
} from '../../core/models/plan-request.model';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

interface Option<T> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-plan-requests',
  imports: [
    DatePipe,
    TitleCasePipe,
    ReactiveFormsModule,
    TableModule,
    DialogModule,
    SelectModule,
    ButtonModule,
    TagModule,
    InputTextModule,
    ProgressSpinnerModule,
    EmptyState,
  ],
  templateUrl: './plan-requests.html',
})
export class PlanRequests implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(PlanRequestService);
  private readonly users = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly messages = inject(MessageService);

  readonly role = this.auth.role;
  readonly isClient = computed(() => this.role() === 'client');
  readonly isAdmin = computed(() => this.role() === 'admin');
  readonly canManage = computed(() => this.role() === 'admin' || this.role() === 'trainer');

  readonly loading = signal(true);
  readonly requests = signal<PlanRequest[]>([]);
  readonly trainerOptions = signal<Option<string>[]>([]);

  readonly statusOptions: Option<PlanRequestStatus>[] = PLAN_REQUEST_STATUSES.map((s) => ({
    label: s.replace(/_/g, ' '),
    value: s,
  }));

  // Two-way binding accessors for p-dialog [(visible)] (signals can't bind directly).
  get showCreateValue(): boolean {
    return this.showCreate();
  }
  set showCreateValue(v: boolean) {
    this.showCreate.set(v);
  }
  get showManageValue(): boolean {
    return this.showManage();
  }
  set showManageValue(v: boolean) {
    this.showManage.set(v);
  }

  // Create dialog (client)
  readonly showCreate = signal(false);
  readonly creating = signal(false);
  readonly createForm = this.fb.group({
    goal: ['', [Validators.required]],
    message: [''],
  });

  // Manage dialog (admin/trainer)
  readonly showManage = signal(false);
  readonly managing = signal(false);
  readonly selected = signal<PlanRequest | null>(null);
  readonly manageForm = this.fb.group({
    trainerId: [''],
    status: this.fb.control<PlanRequestStatus | null>(null),
  });

  ngOnInit(): void {
    this.load();
    if (this.isAdmin()) {
      this.users.list().subscribe({
        next: (users) =>
          this.trainerOptions.set(
            users.filter((u) => u.role === 'trainer').map((u) => ({ label: `${u.name} (${u.email})`, value: u._id })),
          ),
        error: () => void 0,
      });
    }
  }

  private load(): void {
    this.loading.set(true);
    this.service.list().subscribe({
      next: (requests) => {
        this.requests.set(requests);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messages.add({ severity: 'error', summary: 'Plan requests', detail: 'Could not load requests.' });
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

  openCreate(): void {
    this.createForm.reset({ goal: '', message: '' });
    this.showCreate.set(true);
  }

  submitCreate(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    this.creating.set(true);
    const { goal, message } = this.createForm.getRawValue();
    this.service.create({ goal: goal!, message: message || undefined }).subscribe({
      next: () => {
        this.creating.set(false);
        this.showCreate.set(false);
        this.messages.add({ severity: 'success', summary: 'Request sent', detail: 'Your plan request was created.' });
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.creating.set(false);
        this.messages.add({ severity: 'error', summary: 'Failed', detail: err.error?.message ?? 'Could not create request.' });
      },
    });
  }

  openManage(request: PlanRequest): void {
    this.selected.set(request);
    this.manageForm.reset({ trainerId: request.trainerId ?? '', status: request.status });
    this.showManage.set(true);
  }

  assignTrainer(): void {
    const req = this.selected();
    const trainerId = this.manageForm.controls.trainerId.value;
    if (!req || !trainerId) {
      this.messages.add({ severity: 'warn', summary: 'Pick a trainer', detail: 'Select a trainer first.' });
      return;
    }
    this.managing.set(true);
    this.service.assign(req._id, trainerId).subscribe({
      next: () => this.afterManage('Trainer assigned.'),
      error: (err: HttpErrorResponse) => this.manageError(err),
    });
  }

  updateStatus(): void {
    const req = this.selected();
    const status = this.manageForm.controls.status.value;
    if (!req || !status) return;
    this.managing.set(true);
    this.service.updateStatus(req._id, status).subscribe({
      next: () => this.afterManage('Status updated.'),
      error: (err: HttpErrorResponse) => this.manageError(err),
    });
  }

  private afterManage(detail: string): void {
    this.managing.set(false);
    this.showManage.set(false);
    this.messages.add({ severity: 'success', summary: 'Updated', detail });
    this.load();
  }

  private manageError(err: HttpErrorResponse): void {
    this.managing.set(false);
    this.messages.add({ severity: 'error', summary: 'Failed', detail: err.error?.message ?? 'Action failed.' });
  }
}
