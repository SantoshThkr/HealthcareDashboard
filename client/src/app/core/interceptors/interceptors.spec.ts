import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { ApiError } from '../models/api.model';
import { AuthService } from '../services/auth.service';
import { AuthInterceptor } from './auth.interceptor';
import { ErrorInterceptor } from './error.interceptor';

describe('HTTP interceptors', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let auth: { token: string | null; currentUser: unknown; clearSession: jasmine.Spy };
  let router: Router;

  beforeEach(() => {
    auth = { token: 'abc', currentUser: { id: 1 }, clearSession: jasmine.createSpy() };
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => controller.verify());

  it('adds the bearer token to API requests', () => {
    http.get('/api/patients').subscribe();
    const req = controller.expectOne('/api/patients');
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc');
    req.flush({});
  });

  it('does not send the token to other hosts', () => {
    http.get('https://fonts.example.com/font.css').subscribe();
    const req = controller.expectOne('https://fonts.example.com/font.css');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('normalises validation errors', () => {
    let error: ApiError | undefined;
    http.post('/api/patients', {}).subscribe({ error: (e) => (error = e) });

    controller
      .expectOne('/api/patients')
      .flush(
        { success: false, message: 'Validation failed', errors: { email: 'Invalid email' } },
        { status: 400, statusText: 'Bad Request' }
      );

    expect(error).toEqual({
      status: 400,
      message: 'Validation failed',
      errors: { email: 'Invalid email' },
    });
  });

  it('falls back to a friendly message for server errors', () => {
    let error: ApiError | undefined;
    http.get('/api/patients').subscribe({ error: (e) => (error = e) });

    controller.expectOne('/api/patients').flush(null, { status: 500, statusText: 'Error' });

    expect(error?.message).toContain('Something went wrong');
  });

  it('ends the session and redirects to login on 401', () => {
    spyOn(router, 'navigate');
    http.get('/api/patients').subscribe({ error: () => undefined });

    controller.expectOne('/api/patients').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(auth.clearSession).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], jasmine.anything());
  });
});
