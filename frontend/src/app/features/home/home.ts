import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

/**
 * Phase 1 placeholder landing/dashboard page.
 *
 * Its only job is to confirm the Angular app boots and that PrimeNG,
 * PrimeIcons and PrimeFlex are wired up correctly. Real role-specific
 * dashboards are built in a later phase.
 */
@Component({
  selector: 'app-home',
  imports: [CardModule, ButtonModule, TagModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {}
