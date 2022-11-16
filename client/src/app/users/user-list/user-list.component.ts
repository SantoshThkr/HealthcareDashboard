import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { merge, of, Subject } from 'rxjs';
import {
  catchError,
  debounceTime,
  filter,
  startWith,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs/operators';

import { ApiError, LoadState } from '../../core/models/api.model';
import { ROLES, User } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { UserService } from '../../core/services/user.service';
import { ResetPasswordComponent } from '../reset-password/reset-password.component';
import { UserFormComponent } from '../user-form/user-form.component';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
})
export class UserListComponent implements AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  columns = ['name', 'email', 'role', 'status', 'createdAt', 'actions'];
  roles = ROLES;
  currentUserId = this.auth.currentUser?.id;
  users: User[] = [];
  total = 0;
  state: LoadState = 'loading';

  filters = this.fb.group({ search: [''], role: [''], isActive: [''] });

  private reload$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private auth: AuthService,
    private dialog: MatDialog,
    private notification: NotificationService
  ) {}

  ngAfterViewInit(): void {
    const filterChanges = this.filters.valueChanges.pipe(debounceTime(300));
    merge(filterChanges, this.sort.sortChange)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => (this.paginator.pageIndex = 0));

    merge(filterChanges, this.sort.sortChange, this.paginator.page, this.reload$)
      .pipe(
        startWith(null),
        tap(() => (this.state = 'loading')),
        switchMap(() =>
          this.userService
            .list({
              ...this.filters.value,
              page: this.paginator.pageIndex + 1,
              pageSize: this.paginator.pageSize,
              sortBy: this.sort.active,
              sortDir: this.sort.direction,
            })
            .pipe(catchError(() => of(null)))
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((page) => {
        if (!page) {
          this.state = 'error';
          return;
        }
        this.users = page.items;
        this.total = page.total;
        this.state = page.items.length ? 'loaded' : 'empty';
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  reload(): void {
    this.reload$.next();
  }

  openForm(user?: User): void {
    this.dialog
      .open(UserFormComponent, { data: { user }, width: '560px', maxWidth: '95vw' })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => this.reload());
  }

  resetPassword(user: User): void {
    this.dialog.open(ResetPasswordComponent, { data: { user }, width: '420px', maxWidth: '95vw' });
  }

  toggleActive(user: User): void {
    this.userService.update(user.id, { isActive: !user.isActive }).subscribe(
      (updated) => {
        this.notification.success(
          `${updated.firstName} ${updated.lastName} ${
            updated.isActive ? 'activated' : 'deactivated'
          }`
        );
        this.reload();
      },
      (err: ApiError) => this.notification.error(err.message)
    );
  }
}
