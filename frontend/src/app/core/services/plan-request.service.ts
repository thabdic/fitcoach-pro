import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PlanRequest, PlanRequestInput, PlanRequestStatus } from '../models/plan-request.model';

@Injectable({ providedIn: 'root' })
export class PlanRequestService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/plan-requests`;

  list(): Observable<PlanRequest[]> {
    return this.http.get<ApiResponse<{ requests: PlanRequest[] }>>(this.url).pipe(map((r) => r.data.requests));
  }

  get(id: string): Observable<PlanRequest> {
    return this.http.get<ApiResponse<{ request: PlanRequest }>>(`${this.url}/${id}`).pipe(map((r) => r.data.request));
  }

  create(input: PlanRequestInput): Observable<PlanRequest> {
    return this.http.post<ApiResponse<{ request: PlanRequest }>>(this.url, input).pipe(map((r) => r.data.request));
  }

  assign(id: string, trainerId: string): Observable<PlanRequest> {
    return this.http
      .patch<ApiResponse<{ request: PlanRequest }>>(`${this.url}/${id}/assign`, { trainerId })
      .pipe(map((r) => r.data.request));
  }

  updateStatus(id: string, status: PlanRequestStatus): Observable<PlanRequest> {
    return this.http
      .patch<ApiResponse<{ request: PlanRequest }>>(`${this.url}/${id}/status`, { status })
      .pipe(map((r) => r.data.request));
  }
}
