import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';

/**
 * Generic "coming soon" page used by sidebar destinations whose feature pages
 * are not built yet (Phase 8 ships auth + layout only). The heading comes from
 * the route's `data.heading`.
 */
@Component({
  selector: 'app-placeholder',
  imports: [CardModule],
  template: `
    <section class="placeholder">
      <h1 class="page-title">{{ heading }}</h1>
      <p-card>
        <div class="empty">
          <i class="pi pi-clock"></i>
          <h2>Coming soon</h2>
          <p>This section isn't built yet — it arrives in a later phase.</p>
        </div>
      </p-card>
    </section>
  `,
  styles: [
    `
      .page-title {
        margin: 0 0 1.25rem;
        font-size: 1.6rem;
        font-weight: 700;
        color: #0f172a;
      }
      .empty {
        text-align: center;
        padding: 2rem 1rem;
        color: #64748b;
      }
      .empty i {
        font-size: 2.5rem;
        color: #94a3b8;
      }
      .empty h2 {
        margin: 0.75rem 0 0.25rem;
        color: #0f172a;
      }
    `,
  ],
})
export class Placeholder {
  private readonly route = inject(ActivatedRoute);
  readonly heading = (this.route.snapshot.data['heading'] as string | undefined) ?? 'Coming soon';
}
