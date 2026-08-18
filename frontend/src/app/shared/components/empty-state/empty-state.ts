import { Component, input } from '@angular/core';

/** Centered empty-state message for empty lists/tables. */
@Component({
  selector: 'app-empty-state',
  template: `
    <div class="empty-state">
      <i [class]="icon()"></i>
      <p>{{ message() }}</p>
    </div>
  `,
  styles: [
    `
      .empty-state {
        text-align: center;
        padding: 2.5rem 1rem;
        color: #94a3b8;
      }
      .empty-state i {
        font-size: 2.25rem;
      }
      .empty-state p {
        margin: 0.75rem 0 0;
        color: #64748b;
      }
    `,
  ],
})
export class EmptyState {
  readonly message = input<string>('Nothing here yet.');
  readonly icon = input<string>('pi pi-inbox');
}
