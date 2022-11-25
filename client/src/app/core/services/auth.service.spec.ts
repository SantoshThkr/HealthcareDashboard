import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { fakeToken, makeUser } from '../../testing/test-data';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('stores the token and user after login', () => {
    const user = makeUser({ role: 'STAFF' });
    const token = fakeToken();
    let result: unknown;

    service.login('staff@example.com', 'Password123!').subscribe((u) => (result = u));

    const req = http.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'staff@example.com', password: 'Password123!' });
    req.flush({ success: true, data: { token, user } });

    expect(result).toEqual(user);
    expect(service.token).toBe(token);
    expect(service.isLoggedIn()).toBeTrue();
    expect(service.hasRole('STAFF')).toBeTrue();
    expect(service.hasRole('ADMIN')).toBeFalse();
  });

  it('never stores the password', () => {
    service.login('staff@example.com', 'Password123!').subscribe();
    http.expectOne('/api/auth/login').flush({
      success: true,
      data: { token: fakeToken(), user: makeUser() },
    });

    const stored = Object.keys(localStorage).map((key) => localStorage.getItem(key));
    expect(stored.join()).not.toContain('Password123!');
  });

  it('restores the session from a valid token', () => {
    localStorage.setItem('hd_token', fakeToken());
    const user = makeUser();
    let restored: unknown;

    service.restoreSession().subscribe((u) => (restored = u));
    http.expectOne('/api/auth/me').flush({ success: true, data: user });

    expect(restored).toEqual(user);
    expect(service.currentUser).toEqual(user);
  });

  it('skips the request and clears an expired token', () => {
    localStorage.setItem('hd_token', fakeToken(-60));
    let restored: unknown = 'unset';

    service.restoreSession().subscribe((u) => (restored = u));

    http.expectNone('/api/auth/me');
    expect(restored).toBeNull();
    expect(service.token).toBeNull();
  });

  it('clears the session when /me fails', () => {
    localStorage.setItem('hd_token', fakeToken());

    service.restoreSession().subscribe();
    http.expectOne('/api/auth/me').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(service.token).toBeNull();
    expect(service.currentUser).toBeNull();
  });

  it('clears the session and returns to login on logout', () => {
    spyOn(router, 'navigate');
    localStorage.setItem('hd_token', fakeToken());

    service.logout();
    http.expectOne('/api/auth/logout').flush({ success: true, data: null });

    expect(service.token).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
