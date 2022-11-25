import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { Role } from '../models/user.model';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { RoleGuard } from './role.guard';

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let currentRole: Role;
  let notification: jasmine.SpyObj<NotificationService>;

  const routeFor = (roles?: Role[]) => ({ data: { roles } } as unknown as ActivatedRouteSnapshot);

  beforeEach(() => {
    notification = jasmine.createSpyObj<NotificationService>('NotificationService', ['error']);
    const auth = { hasRole: (...roles: Role[]) => roles.includes(currentRole) };
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: NotificationService, useValue: notification },
      ],
    });
    guard = TestBed.inject(RoleGuard);
  });

  it('allows routes without role restrictions', () => {
    currentRole = 'STAFF';
    expect(guard.canActivate(routeFor())).toBeTrue();
  });

  it('allows users with a permitted role', () => {
    currentRole = 'ADMIN';
    expect(guard.canActivate(routeFor(['ADMIN']))).toBeTrue();
  });

  it('sends other users back to the dashboard', () => {
    currentRole = 'STAFF';

    const result = guard.canActivate(routeFor(['ADMIN'])) as UrlTree;

    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/dashboard');
    expect(notification.error).toHaveBeenCalled();
  });

  it('blocks lazy loading of restricted modules', () => {
    currentRole = 'DOCTOR';
    expect(guard.canLoad({ data: { roles: ['ADMIN'] } })).not.toBeTrue();
  });
});
