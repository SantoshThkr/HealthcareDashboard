import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ApiResponse, Page } from '../models/api.model';
import { Doctor, DoctorPayload } from '../models/doctor.model';
import { QueryParams, toHttpParams } from '../utils/http-params';

@Injectable({ providedIn: 'root' })
export class DoctorService {
  private readonly url = `${environment.apiUrl}/doctors`;

  constructor(private http: HttpClient) {}

  list(query: QueryParams = {}): Observable<Page<Doctor>> {
    return this.http
      .get<ApiResponse<Page<Doctor>>>(this.url, { params: toHttpParams(query) })
      .pipe(map((res) => res.data));
  }

  listActive(): Observable<Doctor[]> {
    return this.list({ status: 'ACTIVE', pageSize: 100, sortBy: 'name' }).pipe(
      map((page) => page.items)
    );
  }

  get(id: number): Observable<Doctor> {
    return this.http.get<ApiResponse<Doctor>>(`${this.url}/${id}`).pipe(map((res) => res.data));
  }

  create(payload: DoctorPayload): Observable<Doctor> {
    return this.http.post<ApiResponse<Doctor>>(this.url, payload).pipe(map((res) => res.data));
  }

  update(id: number, payload: DoctorPayload): Observable<Doctor> {
    return this.http
      .put<ApiResponse<Doctor>>(`${this.url}/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.url}/${id}`).pipe(map(() => undefined));
  }
}
