import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ApiResponse, Page } from '../models/api.model';
import { Patient, PatientPayload } from '../models/patient.model';
import { QueryParams, toHttpParams } from '../utils/http-params';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly url = `${environment.apiUrl}/patients`;

  constructor(private http: HttpClient) {}

  list(query: QueryParams = {}): Observable<Page<Patient>> {
    return this.http
      .get<ApiResponse<Page<Patient>>>(this.url, { params: toHttpParams(query) })
      .pipe(map((res) => res.data));
  }

  get(id: number): Observable<Patient> {
    return this.http.get<ApiResponse<Patient>>(`${this.url}/${id}`).pipe(map((res) => res.data));
  }

  create(payload: PatientPayload): Observable<Patient> {
    return this.http.post<ApiResponse<Patient>>(this.url, payload).pipe(map((res) => res.data));
  }

  update(id: number, payload: PatientPayload): Observable<Patient> {
    return this.http
      .put<ApiResponse<Patient>>(`${this.url}/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.url}/${id}`).pipe(map(() => undefined));
  }
}
