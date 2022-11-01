import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import { Role, User } from '../models/user.model';

const TOKEN_KEY = 'hd_token';

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly url = `${environment.apiUrl}/auth`;
  private userSubject = new BehaviorSubject<User | null>(null);

  readonly currentUser$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  get currentUser(): User | null {
    return this.userSubject.value;
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.currentUser && !this.isTokenExpired();
  }

  hasRole(...roles: Role[]): boolean {
    return !!this.currentUser && roles.includes(this.currentUser.role);
  }

  login(email: string, password: string): Observable<User> {
    return this.http
      .post<ApiResponse<{ token: string; user: User }>>(`${this.url}/login`, { email, password })
      .pipe(
        tap(({ data }) => {
          localStorage.setItem(TOKEN_KEY, data.token);
          this.userSubject.next(data.user);
        }),
        map(({ data }) => data.user)
      );
  }

  register(request: RegisterRequest): Observable<string | undefined> {
    return this.http
      .post<ApiResponse<User>>(`${this.url}/register`, request)
      .pipe(map((res) => res.message));
  }

  restoreSession(): Observable<User | null> {
    if (!this.token || this.isTokenExpired()) {
      this.clearSession();
      return of(null);
    }
    return this.http.get<ApiResponse<User>>(`${this.url}/me`).pipe(
      map((res) => res.data),
      tap((user) => this.userSubject.next(user)),
      catchError(() => {
        this.clearSession();
        return of(null);
      })
    );
  }

  logout(): void {
    if (this.token) {
      this.http.post(`${this.url}/logout`, {}).subscribe({ error: () => undefined });
    }
    this.clearSession();
    this.router.navigate(['/login']);
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.userSubject.next(null);
  }

  private isTokenExpired(): boolean {
    const token = this.token;
    if (!token) {
      return true;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}
