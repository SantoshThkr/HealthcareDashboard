import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import { Activity, DashboardSummary } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly url = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<DashboardSummary> {
    return this.http
      .get<ApiResponse<DashboardSummary>>(`${this.url}/summary`)
      .pipe(map((res) => res.data));
  }

  getRecentActivity(): Observable<Activity[]> {
    return this.http
      .get<ApiResponse<Activity[]>>(`${this.url}/recent-activity`)
      .pipe(map((res) => res.data));
  }
}
