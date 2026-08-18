import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';
import { User, UserRole } from '../models/user.model';

/** localStorage key for the JWT — shared with the auth interceptor. */
export const AUTH_TOKEN_KEY = 'fitcoach_token';
const AUTH_USER_KEY = 'fitcoach_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  /** Reactive current user, restored from localStorage on startup. */
  private readonly _currentUser = signal<User | null>(this.readStoredUser());
  readonly currentUser = this._currentUser.asReadonly();
  readonly role = computed<UserRole | null>(() => this._currentUser()?.role ?? null);
  readonly isAuthenticated = computed<boolean>(() => this._currentUser() !== null && this.getToken() !== null);

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/login`, payload).pipe(
      map((res) => res.data),
      tap((data) => this.setSession(data)),
    );
  }

  register(payload: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/register`, payload).pipe(
      map((res) => res.data),
      tap((data) => this.setSession(data)),
    );
  }

  /** Fetch the authenticated user from the API and refresh local state. */
  getCurrentUser(): Observable<User> {
    return this.http.get<ApiResponse<{ user: User }>>(`${this.baseUrl}/me`).pipe(
      map((res) => res.data.user),
      tap((user) => {
        this._currentUser.set(user);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    this._currentUser.set(null);
    void this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  private setSession(data: AuthResponse): void {
    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
    this._currentUser.set(data.user);
  }

  private readStoredUser(): User | null {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}
