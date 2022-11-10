import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { merge, Observable, of, Subject } from 'rxjs';
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
import {
  Appointment,
  APPOINTMENT_STATUSES,
  AppointmentStatus,
  NEXT_STATUSES,
} from '../../core/models/appointment.model';
import { Doctor } from '../../core/models/doctor.model';
import { AppointmentService } from '../../core/services/appointment.service';
import { AuthService } from '../../core/services/auth.service';
import { DoctorService } from '../../core/services/doctor.service';
import { NotificationService } from '../../core/services/notification.service';
import { toIsoDate } from '../../core/utils/dates';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

const ACTION_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: 'Schedule',
  CONFIRMED: 'Confirm',
  COMPLETED: 'Mark completed',
  CANCELLED: 'Cancel appointment',
};

@Component({
  selector: 'app-appointment-list',
  templateUrl: './appointment-list.component.html',
})
export class AppointmentListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  columns = ['date', 'time', 'patient', 'doctor', 'reason', 'status', 'actions'];
  statuses = APPOINTMENT_STATUSES;
  isDoctor = this.auth.hasRole('DOCTOR');
  canEdit = this.auth.hasRole('ADMIN', 'STAFF');
  canDelete = this.auth.hasRole('ADMIN');
  doctors$: Observable<Doctor[]> = of([]);
  appointments: Appointment[] = [];
  total = 0;
  state: LoadState = 'loading';

  filters = this.fb.group({
    search: [''],
    date: [null as Date | null],
    doctorId: [''],
    status: [''],
  });

  private reload$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private doctorService: DoctorService,
    private auth: AuthService,
    private dialog: MatDialog,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    if (!this.isDoctor) {
      this.doctors$ = this.doctorService.listActive().pipe(catchError(() => of([])));
    }
  }

  ngAfterViewInit(): void {
    const filterChanges = this.filters.valueChanges.pipe(debounceTime(300));
    merge(filterChanges, this.sort.sortChange)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => (this.paginator.pageIndex = 0));

    merge(filterChanges, this.sort.sortChange, this.paginator.page, this.reload$)
      .pipe(
        startWith(null),
        tap(() => (this.state = 'loading')),
        switchMap(() => {
          const { search, date, doctorId, status } = this.filters.value;
          return this.appointmentService
            .list({
              search,
              doctorId,
              status,
              date: toIsoDate(date),
              page: this.paginator.pageIndex + 1,
              pageSize: this.paginator.pageSize,
              sortBy: this.sort.active,
              sortDir: this.sort.direction,
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
        this.appointments = page.items;
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

  nextStatuses(appointment: Appointment): AppointmentStatus[] {
    return NEXT_STATUSES[appointment.status];
  }

  actionLabel(status: AppointmentStatus): string {
    return ACTION_LABELS[status];
  }

  isFinal(appointment: Appointment): boolean {
    return !NEXT_STATUSES[appointment.status].length;
  }

  changeStatus(appointment: Appointment, status: AppointmentStatus): void {
    const confirmed$ =
      status === 'CANCELLED'
        ? this.dialog
            .open(ConfirmDialogComponent, {
              data: {
                title: 'Cancel appointment',
                message: `Cancel the appointment for ${appointment.patient?.firstName} ${appointment.patient?.lastName} on ${appointment.date} at ${appointment.time}?`,
                confirmText: 'Cancel appointment',
              },
            })
            .afterClosed()
        : of(true);

    confirmed$
      .pipe(
        filter(Boolean),
        switchMap(() => this.appointmentService.updateStatus(appointment.id, status))
      )
      .subscribe(
        () => {
          this.notification.success(`Appointment ${status.toLowerCase()}`);
          this.reload();
        },
        (err: ApiError) => this.notification.error(err.message)
      );
  }

  confirmDelete(appointment: Appointment): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete appointment',
          message: 'Delete this appointment permanently? Consider cancelling it instead.',
          confirmText: 'Delete',
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.appointmentService.delete(appointment.id))
      )
      .subscribe(
        () => {
          this.notification.success('Appointment deleted');
          this.reload();
        },
        (err: ApiError) => this.notification.error(err.message)
      );
  }

  clearFilters(): void {
    this.filters.reset({ search: '', date: null, doctorId: '', status: '' });
  }
}
