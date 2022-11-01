import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ApiError } from '../models/api.model';

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
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next
      .handle(request)
      .pipe(catchError((response: HttpErrorResponse) => throwError(this.toApiError(response))));
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
