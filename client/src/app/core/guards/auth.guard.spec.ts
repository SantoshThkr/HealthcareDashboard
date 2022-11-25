import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { AuthService } from '../services/auth.service';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let auth: jasmine.SpyObj<AuthService>;
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/patients/3' } as RouterStateSnapshot;

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['isLoggedIn', 'clearSession']);
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [{ provide: AuthService, useValue: auth }],
    });
    guard = TestBed.inject(AuthGuard);
  });

  it('allows signed-in users', () => {
    auth.isLoggedIn.and.returnValue(true);
    expect(guard.canActivate(route, state)).toBeTrue();
  });

  it('redirects to login with the requested url', () => {
    auth.isLoggedIn.and.returnValue(false);

    const result = guard.canActivate(route, state) as UrlTree;

    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/login?returnUrl=%2Fpatients%2F3');
    expect(auth.clearSession).toHaveBeenCalled();
  });
});
