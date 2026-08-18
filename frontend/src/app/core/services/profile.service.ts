import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { FitnessProfile, FitnessProfileInput } from '../models/fitness-profile.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/profile`;

  getMine(): Observable<FitnessProfile> {
    return this.http.get<ApiResponse<{ profile: FitnessProfile }>>(`${this.url}/me`).pipe(map((r) => r.data.profile));
  }

  create(input: FitnessProfileInput): Observable<FitnessProfile> {
    return this.http.post<ApiResponse<{ profile: FitnessProfile }>>(this.url, input).pipe(map((r) => r.data.profile));
  }

  update(input: FitnessProfileInput): Observable<FitnessProfile> {
    return this.http.put<ApiResponse<{ profile: FitnessProfile }>>(`${this.url}/me`, input).pipe(map((r) => r.data.profile));
  }
}
