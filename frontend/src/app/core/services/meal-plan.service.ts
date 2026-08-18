import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { MealPlan, MealPlanInput } from '../models/meal-plan.model';

@Injectable({ providedIn: 'root' })
export class MealPlanService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/meal-plans`;

  list(): Observable<MealPlan[]> {
    return this.http.get<ApiResponse<{ plans: MealPlan[] }>>(this.url).pipe(map((r) => r.data.plans));
  }

  get(id: string): Observable<MealPlan> {
    return this.http.get<ApiResponse<{ plan: MealPlan }>>(`${this.url}/${id}`).pipe(map((r) => r.data.plan));
  }

  create(input: MealPlanInput): Observable<MealPlan> {
    return this.http.post<ApiResponse<{ plan: MealPlan }>>(this.url, input).pipe(map((r) => r.data.plan));
  }

  update(id: string, input: Partial<MealPlanInput>): Observable<MealPlan> {
    return this.http.put<ApiResponse<{ plan: MealPlan }>>(`${this.url}/${id}`, input).pipe(map((r) => r.data.plan));
  }

  remove(id: string): Observable<void> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.url}/${id}`).pipe(map(() => undefined));
  }
}
