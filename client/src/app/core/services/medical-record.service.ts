import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ApiResponse, Page } from '../models/api.model';
import { MedicalRecord, MedicalRecordPayload } from '../models/medical-record.model';
import { QueryParams, toHttpParams } from '../utils/http-params';

@Injectable({ providedIn: 'root' })
export class MedicalRecordService {
  private readonly url = `${environment.apiUrl}/medical-records`;

  constructor(private http: HttpClient) {}

  list(query: QueryParams = {}): Observable<Page<MedicalRecord>> {
    return this.http
      .get<ApiResponse<Page<MedicalRecord>>>(this.url, { params: toHttpParams(query) })
      .pipe(map((res) => res.data));
  }

  listForPatient(patientId: number): Observable<MedicalRecord[]> {
    return this.http
      .get<ApiResponse<MedicalRecord[]>>(
        `${environment.apiUrl}/patients/${patientId}/medical-records`
      )
      .pipe(map((res) => res.data));
  }

  get(id: number): Observable<MedicalRecord> {
    return this.http
      .get<ApiResponse<MedicalRecord>>(`${this.url}/${id}`)
      .pipe(map((res) => res.data));
  }

  create(patientId: number, payload: MedicalRecordPayload): Observable<MedicalRecord> {
    return this.http
      .post<ApiResponse<MedicalRecord>>(
        `${environment.apiUrl}/patients/${patientId}/medical-records`,
        payload
      )
      .pipe(map((res) => res.data));
  }

  update(id: number, payload: MedicalRecordPayload): Observable<MedicalRecord> {
    return this.http
      .put<ApiResponse<MedicalRecord>>(`${this.url}/${id}`, payload)
      .pipe(map((res) => res.data));
  }
}
