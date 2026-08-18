import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { User, UserRole } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/users`;

  list(): Observable<User[]> {
    return this.http.get<ApiResponse<{ users: User[] }>>(this.url).pipe(map((r) => r.data.users));
  }

  /** Clients assigned to the calling trainer (or all clients for an admin). */
  myClients(): Observable<User[]> {
    return this.http
      .get<ApiResponse<{ clients: User[] }>>(`${this.url}/clients`)
      .pipe(map((r) => r.data.clients));
  }

  get(id: string): Observable<User> {
    return this.http.get<ApiResponse<{ user: User }>>(`${this.url}/${id}`).pipe(map((r) => r.data.user));
  }

  updateRole(id: string, role: UserRole): Observable<User> {
    return this.http.patch<ApiResponse<{ user: User }>>(`${this.url}/${id}/role`, { role }).pipe(map((r) => r.data.user));
  }

  updateStatus(id: string, isActive: boolean): Observable<User> {
    return this.http
      .patch<ApiResponse<{ user: User }>>(`${this.url}/${id}/status`, { isActive })
      .pipe(map((r) => r.data.user));
  }

  remove(id: string): Observable<void> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.url}/${id}`).pipe(map(() => undefined));
  }
}
