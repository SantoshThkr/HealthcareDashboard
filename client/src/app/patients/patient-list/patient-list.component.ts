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
import { Patient, PATIENT_STATUSES } from '../../core/models/patient.model';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { PatientService } from '../../core/services/patient.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-patient-list',
  templateUrl: './patient-list.component.html',
})
export class PatientListComponent implements AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  columns = [
    'id',
    'name',
    'gender',
    'dateOfBirth',
    'phone',
    'email',
    'doctor',
    'status',
    'actions',
  ];
  statuses = PATIENT_STATUSES;
  canEdit = this.auth.hasRole('ADMIN', 'STAFF');
  canDelete = this.auth.hasRole('ADMIN');
  patients: Patient[] = [];
  total = 0;
  state: LoadState = 'loading';

  filters = this.fb.group({ search: [''], status: [''] });

  private reload$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService,
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
          this.patientService
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
        this.patients = page.items;
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

  confirmDelete(patient: Patient): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete patient',
          message: `Delete ${patient.firstName} ${patient.lastName}? Patients with appointments or medical records cannot be deleted.`,
          confirmText: 'Delete',
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.patientService.delete(patient.id))
      )
      .subscribe(
        () => {
          this.notification.success('Patient deleted');
          this.reload();
        },
        (err: ApiError) => this.notification.error(err.message)
      );
  }
}
