import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { ProgressUpdate, ProgressUpdateInput } from '../models/progress-update.model';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/progress`;

  list(): Observable<ProgressUpdate[]> {
    return this.http.get<ApiResponse<{ updates: ProgressUpdate[] }>>(this.url).pipe(map((r) => r.data.updates));
  }

  get(id: string): Observable<ProgressUpdate> {
    return this.http.get<ApiResponse<{ update: ProgressUpdate }>>(`${this.url}/${id}`).pipe(map((r) => r.data.update));
  }

  create(input: ProgressUpdateInput): Observable<ProgressUpdate> {
    return this.http.post<ApiResponse<{ update: ProgressUpdate }>>(this.url, input).pipe(map((r) => r.data.update));
  }
}
