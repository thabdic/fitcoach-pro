import { Component, OnInit, inject, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { UserService } from '../../core/services/user.service';
import { User, UserRole } from '../../core/models/user.model';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

interface Option<T> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-users',
  imports: [
    TitleCasePipe,
    ReactiveFormsModule,
    TableModule,
    DialogModule,
    SelectModule,
    ButtonModule,
    TagModule,
    ProgressSpinnerModule,
    EmptyState,
  ],
  templateUrl: './users.html',
})
export class Users implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(UserService);
  private readonly messages = inject(MessageService);

  readonly loading = signal(true);
  readonly users = signal<User[]>([]);

  readonly roleOptions: Option<UserRole>[] = [
    { label: 'Client', value: 'client' },
    { label: 'Trainer', value: 'trainer' },
    { label: 'Admin', value: 'admin' },
  ];

  readonly showRole = signal(false);
  readonly savingRole = signal(false);
  readonly selected = signal<User | null>(null);
  readonly roleForm = this.fb.group({
    role: this.fb.control<UserRole | null>(null, [Validators.required]),
  });

  get showRoleValue(): boolean {
    return this.showRole();
  }
  set showRoleValue(v: boolean) {
    this.showRole.set(v);
  }

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.service.list().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messages.add({ severity: 'error', summary: 'Users', detail: 'Could not load users.' });
      },
    });
  }

  openRole(user: User): void {
    this.selected.set(user);
    this.roleForm.reset({ role: user.role });
    this.showRole.set(true);
  }

  saveRole(): void {
    const user = this.selected();
    const role = this.roleForm.controls.role.value;
    if (!user || !role) return;
    this.savingRole.set(true);
    this.service.updateRole(user._id, role).subscribe({
      next: () => {
        this.savingRole.set(false);
        this.showRole.set(false);
        this.messages.add({ severity: 'success', summary: 'Role updated', detail: `${user.name} is now ${role}.` });
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.savingRole.set(false);
        this.messages.add({ severity: 'error', summary: 'Failed', detail: err.error?.message ?? 'Could not update role.' });
      },
    });
  }

  toggleStatus(user: User): void {
    this.service.updateStatus(user._id, !user.isActive).subscribe({
      next: () => {
        this.messages.add({
          severity: 'success',
          summary: 'Status updated',
          detail: `${user.name} is now ${!user.isActive ? 'active' : 'inactive'}.`,
        });
        this.load();
      },
      error: (err: HttpErrorResponse) =>
        this.messages.add({ severity: 'error', summary: 'Failed', detail: err.error?.message ?? 'Could not update status.' }),
    });
  }
}
