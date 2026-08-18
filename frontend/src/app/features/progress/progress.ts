import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { ProgressService } from '../../core/services/progress.service';
import { ProgressUpdate, ProgressUpdateInput } from '../../core/models/progress-update.model';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-progress',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    TableModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    ProgressSpinnerModule,
    EmptyState,
  ],
  templateUrl: './progress.html',
})
export class Progress implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ProgressService);
  private readonly auth = inject(AuthService);
  private readonly messages = inject(MessageService);

  readonly isClient = computed(() => this.auth.role() === 'client');

  readonly loading = signal(true);
  readonly updates = signal<ProgressUpdate[]>([]);

  readonly showForm = signal(false);
  readonly saving = signal(false);

  readonly form = this.fb.group({
    weightKg: [null as number | null, [Validators.min(20), Validators.max(500)]],
    mood: [''],
    energyLevel: [null as number | null, [Validators.min(1), Validators.max(10)]],
    notes: [''],
  });

  get showFormValue(): boolean {
    return this.showForm();
  }
  set showFormValue(v: boolean) {
    this.showForm.set(v);
  }

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.service.list().subscribe({
      next: (updates) => {
        this.updates.set(updates);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messages.add({ severity: 'error', summary: 'Progress', detail: 'Could not load progress updates.' });
      },
    });
  }

  openCreate(): void {
    this.form.reset({ weightKg: null, mood: '', energyLevel: null, notes: '' });
    this.showForm.set(true);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const payload: ProgressUpdateInput = {
      weightKg: raw.weightKg != null ? Number(raw.weightKg) : undefined,
      mood: raw.mood || undefined,
      energyLevel: raw.energyLevel != null ? Number(raw.energyLevel) : undefined,
      notes: raw.notes || undefined,
    };
    this.service.create(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.messages.add({ severity: 'success', summary: 'Logged', detail: 'Progress update saved.' });
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.messages.add({ severity: 'error', summary: 'Failed', detail: err.error?.message ?? 'Could not save update.' });
      },
    });
  }
}
