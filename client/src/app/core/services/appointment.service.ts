import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ApiResponse, Page } from '../models/api.model';
import { Appointment, AppointmentPayload, AppointmentStatus } from '../models/appointment.model';
import { QueryParams, toHttpParams } from '../utils/http-params';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly url = `${environment.apiUrl}/appointments`;

  constructor(private http: HttpClient) {}

  list(query: QueryParams = {}): Observable<Page<Appointment>> {
    return this.http
      .get<ApiResponse<Page<Appointment>>>(this.url, { params: toHttpParams(query) })
      .pipe(map((res) => res.data));
  }

  get(id: number): Observable<Appointment> {
    return this.http
      .get<ApiResponse<Appointment>>(`${this.url}/${id}`)
      .pipe(map((res) => res.data));
  }

  create(payload: AppointmentPayload): Observable<Appointment> {
    return this.http.post<ApiResponse<Appointment>>(this.url, payload).pipe(map((res) => res.data));
  }

  update(id: number, payload: Partial<AppointmentPayload>): Observable<Appointment> {
    return this.http
      .put<ApiResponse<Appointment>>(`${this.url}/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  updateStatus(id: number, status: AppointmentStatus): Observable<Appointment> {
    return this.http
      .put<ApiResponse<Appointment>>(`${this.url}/${id}`, { status })
      .pipe(map((res) => res.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.url}/${id}`).pipe(map(() => undefined));
  }
}
