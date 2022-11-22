import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanLoad,
  Route,
  Router,
  UrlTree,
} from '@angular/router';

import { Role } from '../models/user.model';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate, CanLoad {
  constructor(
    private auth: AuthService,
    private router: Router,
    private notification: NotificationService
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    return this.check(route.data.roles);
  }

  canLoad(route: Route): boolean | UrlTree {
    return this.check(route.data?.roles);
  }

  private check(roles?: Role[]): boolean | UrlTree {
    if (!roles || this.auth.hasRole(...roles)) {
      return true;
    }
    this.notification.error('You do not have access to that page.');
    return this.router.createUrlTree(['/dashboard']);
  }
}
