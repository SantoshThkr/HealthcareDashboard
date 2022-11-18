import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { merge, Observable, of, Subject } from 'rxjs';
import {
  catchError,
  debounceTime,
  map,
  startWith,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs/operators';

import { LoadState } from '../core/models/api.model';
import { AUDIT_ACTIONS, AuditLog } from '../core/models/audit-log.model';
import { User } from '../core/models/user.model';
import { AuditLogService } from '../core/services/audit-log.service';
import { UserService } from '../core/services/user.service';
import { toIsoDate } from '../core/utils/dates';

@Component({
  selector: 'app-audit-log-list',
  templateUrl: './audit-log-list.component.html',
})
export class AuditLogListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  columns = ['createdAt', 'user', 'action', 'entity', 'entityId'];
  actions = AUDIT_ACTIONS;
  users$: Observable<User[]> = of([]);
  logs: AuditLog[] = [];
  total = 0;
  state: LoadState = 'loading';

  filters = this.fb.group({
    action: [''],
    userId: [''],
    dateFrom: [null as Date | null],
    dateTo: [null as Date | null],
  });

  private reload$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private auditLogService: AuditLogService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.users$ = this.userService.list({ pageSize: 100, sortBy: 'name' }).pipe(
      map((page) => page.items),
      catchError(() => of([]))
    );
  }

  ngAfterViewInit(): void {
    const filterChanges = this.filters.valueChanges.pipe(
      debounceTime(200),
      tap(() => (this.paginator.pageIndex = 0))
    );

    merge(filterChanges, this.paginator.page, this.reload$)
      .pipe(
        startWith(null),
        tap(() => (this.state = 'loading')),
        switchMap(() => {
          const { action, userId, dateFrom, dateTo } = this.filters.value;
          return this.auditLogService
            .list({
              action,
              userId,
              dateFrom: toIsoDate(dateFrom),
              dateTo: toIsoDate(dateTo),
              page: this.paginator.pageIndex + 1,
              pageSize: this.paginator.pageSize,
            })
            .pipe(catchError(() => of(null)));
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((page) => {
        if (!page) {
          this.state = 'error';
          return;
        }
        this.logs = page.items;
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

  clearFilters(): void {
    this.filters.reset({ action: '', userId: '', dateFrom: null, dateTo: null });
  }
}
