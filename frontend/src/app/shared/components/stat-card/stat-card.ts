import { Component, input } from '@angular/core';
import { CardModule } from 'primeng/card';

/** Reusable dashboard metric card: icon + big value + label. */
@Component({
  selector: 'app-stat-card',
  imports: [CardModule],
  template: `
    <p-card styleClass="stat-card" [attr.data-testid]="testid()">
      <div class="stat-body">
        <span class="stat-icon"><i [class]="icon()"></i></span>
        <div class="stat-text">
          <span class="stat-value">{{ value() }}</span>
          <span class="stat-label">{{ label() }}</span>
        </div>
      </div>
    </p-card>
  `,
  styles: [
    `
      .stat-body {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .stat-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 3rem;
        height: 3rem;
        border-radius: 0.75rem;
        background: rgba(16, 185, 129, 0.12);
        color: #10b981;
        font-size: 1.35rem;
      }
      .stat-text {
        display: flex;
        flex-direction: column;
      }
      .stat-value {
        font-size: 1.6rem;
        font-weight: 700;
        color: #0f172a;
        line-height: 1.1;
      }
      .stat-label {
        color: #64748b;
        font-size: 0.85rem;
      }
    `,
  ],
})
export class StatCard {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly icon = input<string>('pi pi-chart-bar');
  readonly testid = input<string | null>(null);
}
