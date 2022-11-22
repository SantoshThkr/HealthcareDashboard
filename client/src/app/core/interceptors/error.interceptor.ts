import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ApiError } from '../models/api.model';
import { AuthService } from '../services/auth.service';

const DEFAULT_MESSAGES: Record<number, string> = {
  0: 'Unable to reach the server. Check your connection and try again.',
  400: 'Please check the highlighted fields.',
  401: 'Please sign in to continue.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'This change conflicts with existing data.',
  500: 'Something went wrong on the server. Please try again later.',
};

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService, private router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((response: HttpErrorResponse) => {
        if (response.status === 401 && !request.url.endsWith('/auth/login')) {
          this.handleExpiredSession();
        }
        return throwError(this.toApiError(response));
      })
    );
  }

  private handleExpiredSession(): void {
    const hadSession = !!this.auth.currentUser;
    this.auth.clearSession();
    if (hadSession && !this.router.url.startsWith('/login')) {
      this.router.navigate(['/login'], {
        queryParams: { expired: 1, returnUrl: this.router.url },
      });
    }
  }

  private toApiError(response: HttpErrorResponse): ApiError {
    const body = response.error;
    const status = response.status;
    return {
      status,
      message:
        (body && typeof body.message === 'string' && body.message) ||
        DEFAULT_MESSAGES[status] ||
        DEFAULT_MESSAGES[500],
      errors: body?.errors,
    };
  }
}
