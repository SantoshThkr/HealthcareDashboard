import { Component, EventEmitter, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthService } from '../../core/services/auth.service';
import { NavItem, NAV_ITEMS } from '../nav-items';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  @Output() navigate = new EventEmitter<void>();

  items$: Observable<NavItem[]> = this.auth.currentUser$.pipe(
    map((user) => (user ? NAV_ITEMS.filter((item) => item.roles.includes(user.role)) : []))
  );

  constructor(private auth: AuthService) {}
}
