import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { ProfileService } from '../../core/services/profile.service';
import {
  ACTIVITY_LEVELS,
  FitnessProfileInput,
  GENDERS,
  GOALS,
} from '../../core/models/fitness-profile.model';

interface Option {
  label: string;
  value: string;
}

const humanize = (v: string): string =>
  v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, CardModule, ButtonModule, InputTextModule, SelectModule, ProgressSpinnerModule],
  templateUrl: './profile.html',
})
export class Profile implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly messages = inject(MessageService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  /** true once a profile exists → PUT; false → POST (create). */
  readonly hasProfile = signal(false);

  readonly genderOptions: Option[] = GENDERS.map((g) => ({ label: humanize(g), value: g }));
  readonly goalOptions: Option[] = GOALS.map((g) => ({ label: humanize(g), value: g }));
  readonly activityOptions: Option[] = ACTIVITY_LEVELS.map((a) => ({ label: humanize(a), value: a }));

  readonly form = this.fb.group({
    age: [null as number | null, [Validators.required, Validators.min(13), Validators.max(120)]],
    gender: [null as string | null],
    heightCm: [null as number | null, [Validators.required, Validators.min(50), Validators.max(300)]],
    weightKg: [null as number | null, [Validators.required, Validators.min(20), Validators.max(500)]],
    goal: [null as string | null, [Validators.required]],
    activityLevel: [null as string | null, [Validators.required]],
    injuries: [''],
    dietaryPreference: [''],
    notes: [''],
  });

  ngOnInit(): void {
    this.profileService.getMine().subscribe({
      next: (profile) => {
        this.hasProfile.set(true);
        this.form.patchValue(profile);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        // 404 simply means the profile hasn't been created yet.
        if (err.status !== 404) {
          this.messages.add({ severity: 'error', summary: 'Profile', detail: 'Could not load your profile.' });
        }
        this.loading.set(false);
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const payload: FitnessProfileInput = {
      age: Number(raw.age),
      heightCm: Number(raw.heightCm),
      weightKg: Number(raw.weightKg),
      goal: raw.goal as FitnessProfileInput['goal'],
      activityLevel: raw.activityLevel as FitnessProfileInput['activityLevel'],
      gender: (raw.gender as FitnessProfileInput['gender']) ?? undefined,
      injuries: raw.injuries || undefined,
      dietaryPreference: raw.dietaryPreference || undefined,
      notes: raw.notes || undefined,
    };

    const request$ = this.hasProfile()
      ? this.profileService.update(payload)
      : this.profileService.create(payload);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.hasProfile.set(true);
        this.messages.add({ severity: 'success', summary: 'Profile saved', detail: 'Your profile is up to date.' });
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.messages.add({
          severity: 'error',
          summary: 'Save failed',
          detail: err.error?.message ?? 'Could not save your profile.',
        });
      },
    });
  }
}
