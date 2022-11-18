import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ApiResponse, Page } from '../models/api.model';
import { AuditLog } from '../models/audit-log.model';
import { QueryParams, toHttpParams } from '../utils/http-params';

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly url = `${environment.apiUrl}/audit-logs`;

  constructor(private http: HttpClient) {}

  list(query: QueryParams = {}): Observable<Page<AuditLog>> {
    return this.http
      .get<ApiResponse<Page<AuditLog>>>(this.url, { params: toHttpParams(query) })
      .pipe(map((res) => res.data));
  }
}
