import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';
import Aura from '@primeng/themes/aura';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // authInterceptor attaches the JWT; errorInterceptor handles 401/network errors.
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    // App-wide toast notifications (single <p-toast> lives in the root component).
    MessageService,
    // PrimeNG v21 styled mode. The Aura preset drives the theme; dark mode is
    // gated behind a class that we don't apply, keeping a predictable light UI.
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.app-dark',
        },
      },
    }),
  ],
};
