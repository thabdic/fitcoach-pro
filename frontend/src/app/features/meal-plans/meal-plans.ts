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
import { MealPlanService } from '../../core/services/meal-plan.service';
import { PlanRequestService } from '../../core/services/plan-request.service';
import { MealPlan, MealPlanInput } from '../../core/models/meal-plan.model';
import { PLAN_STATUSES, PlanStatus } from '../../core/models/workout-plan.model';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

interface Option<T> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-meal-plans',
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
  templateUrl: './meal-plans.html',
})
export class MealPlans implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(MealPlanService);
  private readonly planRequests = inject(PlanRequestService);
  private readonly auth = inject(AuthService);
  private readonly messages = inject(MessageService);

  readonly role = this.auth.role;
  readonly canManage = computed(() => this.role() === 'admin' || this.role() === 'trainer');
  readonly isAdmin = computed(() => this.role() === 'admin');

  readonly loading = signal(true);
  readonly plans = signal<MealPlan[]>([]);
  readonly clientOptions = signal<Option<string>[]>([]);
  readonly statusOptions: Option<PlanStatus>[] = PLAN_STATUSES.map((s) => ({ label: s, value: s }));

  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly editingId = signal<string | null>(null);

  readonly form = this.fb.group({
    title: ['', [Validators.required]],
    description: [''],
    clientId: ['', [Validators.required]],
    caloriesTarget: [2000, [Validators.required, Validators.min(1)]],
    status: this.fb.control<PlanStatus>('assigned'),
    meals: this.fb.array<FormGroup>([]),
  });

  get meals() {
    return this.form.controls.meals;
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
        this.messages.add({ severity: 'error', summary: 'Meal plans', detail: 'Could not load plans.' });
      },
    });
  }

  private mealGroup(meal?: Partial<{ name: string; timeOfDay: string; foods: string[]; notes: string }>): FormGroup {
    return this.fb.group({
      name: [meal?.name ?? '', [Validators.required]],
      timeOfDay: [meal?.timeOfDay ?? ''],
      foods: [(meal?.foods ?? []).join(', ')],
      notes: [meal?.notes ?? ''],
    });
  }

  addMeal(): void {
    this.meals.push(this.mealGroup());
  }

  removeMeal(i: number): void {
    this.meals.removeAt(i);
  }

  openCreate(): void {
    this.editingId.set(null);
    this.meals.clear();
    this.addMeal();
    this.form.reset({ title: '', description: '', clientId: '', caloriesTarget: 2000, status: 'assigned' });
    this.form.controls.clientId.enable();
    this.showForm.set(true);
  }

  openEdit(plan: MealPlan): void {
    this.editingId.set(plan._id);
    this.meals.clear();
    (plan.meals ?? []).forEach((m) => this.meals.push(this.mealGroup(m)));
    this.form.patchValue({
      title: plan.title,
      description: plan.description ?? '',
      clientId: plan.clientId,
      caloriesTarget: plan.caloriesTarget,
      status: plan.status,
    });
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
    const rawMeals = raw.meals as Array<{ name: string; timeOfDay: string; foods: string; notes: string }>;
    const meals = rawMeals
      .filter((m) => m.name && String(m.name).trim().length > 0)
      .map((m) => ({
        name: m.name,
        timeOfDay: m.timeOfDay || undefined,
        foods: String(m.foods ?? '')
          .split(',')
          .map((f) => f.trim())
          .filter((f) => f.length > 0),
        notes: m.notes || undefined,
      }));

    const id = this.editingId();
    if (id) {
      this.service
        .update(id, {
          title: raw.title!,
          description: raw.description || undefined,
          caloriesTarget: Number(raw.caloriesTarget),
          status: raw.status!,
          meals,
        })
        .subscribe({ next: () => this.afterSave('Plan updated.'), error: (e) => this.saveError(e) });
    } else {
      const payload: MealPlanInput = {
        title: raw.title!,
        description: raw.description || undefined,
        clientId: raw.clientId!,
        caloriesTarget: Number(raw.caloriesTarget),
        status: raw.status!,
        meals,
      };
      this.service.create(payload).subscribe({ next: () => this.afterSave('Plan created.'), error: (e) => this.saveError(e) });
    }
  }

  remove(plan: MealPlan): void {
    this.service.remove(plan._id).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Deleted', detail: 'Meal plan removed.' });
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
