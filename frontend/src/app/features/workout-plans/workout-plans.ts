import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { WorkoutPlanService } from '../../core/services/workout-plan.service';
import { PlanRequestService } from '../../core/services/plan-request.service';
import {
  DIFFICULTIES,
  Difficulty,
  PLAN_STATUSES,
  PlanStatus,
  WorkoutPlan,
  WorkoutPlanInput,
} from '../../core/models/workout-plan.model';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

interface Option<T> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-workout-plans',
  imports: [
    TitleCasePipe,
    ReactiveFormsModule,
    CardModule,
    DialogModule,
    SelectModule,
    ButtonModule,
    TagModule,
    InputTextModule,
    ProgressSpinnerModule,
    EmptyState,
  ],
  templateUrl: './workout-plans.html',
})
export class WorkoutPlans implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(WorkoutPlanService);
  private readonly planRequests = inject(PlanRequestService);
  private readonly auth = inject(AuthService);
  private readonly messages = inject(MessageService);

  readonly role = this.auth.role;
  readonly canManage = computed(() => this.role() === 'admin' || this.role() === 'trainer');
  readonly isAdmin = computed(() => this.role() === 'admin');

  readonly loading = signal(true);
  readonly plans = signal<WorkoutPlan[]>([]);
  readonly clientOptions = signal<Option<string>[]>([]);

  readonly difficultyOptions: Option<Difficulty>[] = DIFFICULTIES.map((d) => ({ label: d, value: d }));
  readonly statusOptions: Option<PlanStatus>[] = PLAN_STATUSES.map((s) => ({ label: s, value: s }));

  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly editingId = signal<string | null>(null);

  readonly form = this.fb.group({
    title: ['', [Validators.required]],
    description: [''],
    clientId: ['', [Validators.required]],
    difficulty: this.fb.control<Difficulty | null>(null, [Validators.required]),
    daysPerWeek: [3, [Validators.required, Validators.min(1), Validators.max(7)]],
    status: this.fb.control<PlanStatus>('assigned'),
    exercises: this.fb.array<FormGroup>([]),
  });

  get exercises() {
    return this.form.controls.exercises;
  }

  get showFormValue(): boolean {
    return this.showForm();
  }
  set showFormValue(v: boolean) {
    this.showForm.set(v);
  }

  ngOnInit(): void {
    this.load();
    if (this.canManage()) {
      this.planRequests.list().subscribe({
        next: (reqs) => this.clientOptions.set(this.deriveClients(reqs)),
        error: () => void 0,
      });
    }
  }

  private deriveClients(reqs: { clientId: string; goal: string }[]): Option<string>[] {
    const seen = new Set<string>();
    const opts: Option<string>[] = [];
    for (const r of reqs) {
      if (!seen.has(r.clientId)) {
        seen.add(r.clientId);
        opts.push({ label: `${r.goal} · #${r.clientId.slice(-6)}`, value: r.clientId });
      }
    }
    return opts;
  }

  private load(): void {
    this.loading.set(true);
    this.service.list().subscribe({
      next: (plans) => {
        this.plans.set(plans);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messages.add({ severity: 'error', summary: 'Workout plans', detail: 'Could not load plans.' });
      },
    });
  }

  private exerciseGroup(ex?: Partial<{ name: string; sets: number; reps: number; restSeconds: number; notes: string }>): FormGroup {
    return this.fb.group({
      name: [ex?.name ?? '', [Validators.required]],
      sets: [ex?.sets ?? null],
      reps: [ex?.reps ?? null],
      restSeconds: [ex?.restSeconds ?? null],
      notes: [ex?.notes ?? ''],
    });
  }

  addExercise(): void {
    this.exercises.push(this.exerciseGroup());
  }

  removeExercise(i: number): void {
    this.exercises.removeAt(i);
  }

  openCreate(): void {
    this.editingId.set(null);
    this.exercises.clear();
    this.addExercise();
    this.form.reset({ title: '', description: '', clientId: '', difficulty: null, daysPerWeek: 3, status: 'assigned' });
    this.form.controls.clientId.enable();
    this.showForm.set(true);
  }

  openEdit(plan: WorkoutPlan): void {
    this.editingId.set(plan._id);
    this.exercises.clear();
    (plan.exercises ?? []).forEach((ex) => this.exercises.push(this.exerciseGroup(ex)));
    this.form.patchValue({
      title: plan.title,
      description: plan.description ?? '',
      clientId: plan.clientId,
      difficulty: plan.difficulty,
      daysPerWeek: plan.daysPerWeek,
      status: plan.status,
    });
    // clientId is immutable on the backend; lock it during edit.
    this.form.controls.clientId.disable();
    this.showForm.set(true);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const rawExercises = raw.exercises as Array<{
      name: string;
      sets: number | null;
      reps: number | null;
      restSeconds: number | null;
      notes: string;
    }>;
    const exercises = rawExercises
      .filter((e) => e.name && String(e.name).trim().length > 0)
      .map((e) => ({
        name: e.name,
        sets: e.sets != null ? Number(e.sets) : undefined,
        reps: e.reps != null ? Number(e.reps) : undefined,
        restSeconds: e.restSeconds != null ? Number(e.restSeconds) : undefined,
        notes: e.notes || undefined,
      }));

    const id = this.editingId();
    if (id) {
      this.service
        .update(id, {
          title: raw.title!,
          description: raw.description || undefined,
          difficulty: raw.difficulty!,
          daysPerWeek: Number(raw.daysPerWeek),
          status: raw.status!,
          exercises,
        })
        .subscribe({ next: () => this.afterSave('Plan updated.'), error: (e) => this.saveError(e) });
    } else {
      const payload: WorkoutPlanInput = {
        title: raw.title!,
        description: raw.description || undefined,
        clientId: raw.clientId!,
        difficulty: raw.difficulty!,
        daysPerWeek: Number(raw.daysPerWeek),
        status: raw.status!,
        exercises,
      };
      this.service.create(payload).subscribe({ next: () => this.afterSave('Plan created.'), error: (e) => this.saveError(e) });
    }
  }

  remove(plan: WorkoutPlan): void {
    this.service.remove(plan._id).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Deleted', detail: 'Workout plan removed.' });
        this.load();
      },
      error: (err: HttpErrorResponse) =>
        this.messages.add({ severity: 'error', summary: 'Failed', detail: err.error?.message ?? 'Could not delete.' }),
    });
  }

  private afterSave(detail: string): void {
    this.saving.set(false);
    this.showForm.set(false);
    this.messages.add({ severity: 'success', summary: 'Saved', detail });
    this.load();
  }

  private saveError(err: HttpErrorResponse): void {
    this.saving.set(false);
    this.messages.add({ severity: 'error', summary: 'Save failed', detail: err.error?.message ?? 'Could not save plan.' });
  }
}
