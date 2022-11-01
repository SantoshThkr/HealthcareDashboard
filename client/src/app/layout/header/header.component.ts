import { Component, EventEmitter, Input, Output } from '@angular/core';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @Input() showMenuButton = false;
  @Output() menuToggle = new EventEmitter<void>();

  user$ = this.auth.currentUser$;

  constructor(private auth: AuthService) {}

  logout(): void {
    this.auth.logout();
  }
}
