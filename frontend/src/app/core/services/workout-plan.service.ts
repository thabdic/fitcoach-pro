import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { WorkoutPlan, WorkoutPlanInput } from '../models/workout-plan.model';

@Injectable({ providedIn: 'root' })
export class WorkoutPlanService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/workout-plans`;

  list(): Observable<WorkoutPlan[]> {
    return this.http.get<ApiResponse<{ plans: WorkoutPlan[] }>>(this.url).pipe(map((r) => r.data.plans));
  }

  get(id: string): Observable<WorkoutPlan> {
    return this.http.get<ApiResponse<{ plan: WorkoutPlan }>>(`${this.url}/${id}`).pipe(map((r) => r.data.plan));
  }

  create(input: WorkoutPlanInput): Observable<WorkoutPlan> {
    return this.http.post<ApiResponse<{ plan: WorkoutPlan }>>(this.url, input).pipe(map((r) => r.data.plan));
  }

  update(id: string, input: Partial<WorkoutPlanInput>): Observable<WorkoutPlan> {
    return this.http.put<ApiResponse<{ plan: WorkoutPlan }>>(`${this.url}/${id}`, input).pipe(map((r) => r.data.plan));
  }

  remove(id: string): Observable<void> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.url}/${id}`).pipe(map(() => undefined));
  }
}
