import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ApiResponse, Page } from '../models/api.model';
import { User, UserPayload } from '../models/user.model';
import { QueryParams, toHttpParams } from '../utils/http-params';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly url = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  list(query: QueryParams = {}): Observable<Page<User>> {
    return this.http
      .get<ApiResponse<Page<User>>>(this.url, { params: toHttpParams(query) })
      .pipe(map((res) => res.data));
  }

  create(payload: UserPayload): Observable<User> {
    return this.http.post<ApiResponse<User>>(this.url, payload).pipe(map((res) => res.data));
  }

  update(id: number, payload: UserPayload): Observable<User> {
    return this.http
      .put<ApiResponse<User>>(`${this.url}/${id}`, payload)
      .pipe(map((res) => res.data));
  }
}
