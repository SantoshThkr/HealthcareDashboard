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
import { DEPARTMENTS, Doctor, DOCTOR_STATUSES } from '../../core/models/doctor.model';
import { AuthService } from '../../core/services/auth.service';
import { DoctorService } from '../../core/services/doctor.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-doctor-list',
  templateUrl: './doctor-list.component.html',
})
export class DoctorListComponent implements AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  columns = [
    'id',
    'name',
    'specialization',
    'email',
    'phone',
    'department',
    'availability',
    'status',
    'actions',
  ];
  statuses = DOCTOR_STATUSES;
  departments = DEPARTMENTS;
  canManage = this.auth.hasRole('ADMIN');
  doctors: Doctor[] = [];
  total = 0;
  state: LoadState = 'loading';

  filters = this.fb.group({ search: [''], status: [''], department: [''] });

  private reload$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private doctorService: DoctorService,
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
          this.doctorService
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
        this.doctors = page.items;
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

  confirmDelete(doctor: Doctor): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete doctor',
          message: `Delete Dr. ${doctor.firstName} ${doctor.lastName}? This cannot be undone.`,
          confirmText: 'Delete',
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.doctorService.delete(doctor.id))
      )
      .subscribe(
        () => {
          this.notification.success('Doctor deleted');
          this.reload();
        },
        (err: ApiError) => this.notification.error(err.message)
      );
  }
}
