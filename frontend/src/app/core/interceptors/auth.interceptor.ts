import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AUTH_TOKEN_KEY } from '../services/auth.service';

/**
 * Attaches `Authorization: Bearer <token>` to requests aimed at our API.
 * Reads the token straight from localStorage (not via AuthService) to avoid a
 * DI cycle inside the HttpClient pipeline.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token && req.url.startsWith(environment.apiUrl)) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
