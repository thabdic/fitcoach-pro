import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../../core/services/auth.service';
import { RegistrableRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CardModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    SelectModule,
    MessageModule,
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);

  readonly loading = signal(false);

  readonly roleOptions: { label: string; value: RegistrableRole }[] = [
    { label: 'Client', value: 'client' },
    { label: 'Trainer', value: 'trainer' },
  ];

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: this.fb.control<RegistrableRole>('client', { validators: [Validators.required] }),
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    const { name, email, password, role } = this.form.getRawValue();
    this.auth.register({ name: name!, email: email!, password: password!, role: role! }).subscribe({
      next: (data) => {
        this.loading.set(false);
        this.messages.add({ severity: 'success', summary: 'Account created', detail: `Welcome, ${data.user.name}!` });
        void this.router.navigate(['/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.messages.add({
          severity: 'error',
          summary: 'Registration failed',
          detail: err.error?.message ?? 'Unable to create your account. Please try again.',
        });
      },
    });
  }
}
