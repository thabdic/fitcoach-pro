import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Cross-cutting HTTP error handling:
 *  - 401 on a non-login call ⇒ the session expired; clear it and bounce to login.
 *  - status 0 ⇒ the API is unreachable; surface a clear network toast.
 * Other errors are re-thrown so per-page handlers can show contextual messages.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const messages = inject(MessageService);
  const auth = inject(AuthService);

  const isAuthCall = req.url.includes('/auth/login') || req.url.includes('/auth/register');

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !isAuthCall) {
        auth.logout(); // clears storage + redirects to /login
        messages.add({ severity: 'warn', summary: 'Session expired', detail: 'Please sign in again.' });
      } else if (err.status === 0) {
        messages.add({ severity: 'error', summary: 'Network error', detail: 'Cannot reach the server. Is the backend running?' });
      }
      return throwError(() => err);
    }),
  );
};
