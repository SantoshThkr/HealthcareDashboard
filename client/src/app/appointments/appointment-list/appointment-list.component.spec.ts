import { ComponentFixture, fakeAsync, flush, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { Appointment } from '../../core/models/appointment.model';
import { Role } from '../../core/models/user.model';
import { AppointmentService } from '../../core/services/appointment.service';
import { AuthService } from '../../core/services/auth.service';
import { DoctorService } from '../../core/services/doctor.service';
import { NotificationService } from '../../core/services/notification.service';
import { SharedModule } from '../../shared/shared.module';
import { asyncData, makeAppointment } from '../../testing/test-data';
import { AppointmentListComponent } from './appointment-list.component';

describe('AppointmentListComponent', () => {
  let fixture: ComponentFixture<AppointmentListComponent>;
  let component: AppointmentListComponent;
  let appointmentService: jasmine.SpyObj<AppointmentService>;
  let notification: jasmine.SpyObj<NotificationService>;
  let dialog: { open: jasmine.Spy };
  let role: Role;

  function setup(items: Appointment[] = [makeAppointment()]): void {
    appointmentService.list.and.returnValue(
      asyncData({ items, total: items.length, page: 1, pageSize: 10 })
    );
    TestBed.configureTestingModule({
      imports: [SharedModule, NoopAnimationsModule, RouterTestingModule],
      declarations: [AppointmentListComponent],
      providers: [
        { provide: AppointmentService, useValue: appointmentService },
        { provide: DoctorService, useValue: { listActive: () => of([]) } },
        { provide: AuthService, useValue: { hasRole: (...roles: Role[]) => roles.includes(role) } },
        { provide: NotificationService, useValue: notification },
        { provide: MatDialog, useValue: dialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppointmentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    flush();
    fixture.detectChanges();
  }

  beforeEach(() => {
    role = 'STAFF';
    appointmentService = jasmine.createSpyObj<AppointmentService>('AppointmentService', [
      'list',
      'updateStatus',
      'delete',
    ]);
    notification = jasmine.createSpyObj<NotificationService>('NotificationService', [
      'success',
      'error',
    ]);
    dialog = { open: jasmine.createSpy().and.returnValue({ afterClosed: () => of(true) }) };
  });

  it('renders appointments with their status', fakeAsync(() => {
    setup();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('John Doe');
    expect(text).toContain('Scheduled');
  }));

  it('offers only valid status transitions', fakeAsync(() => {
    setup();

    expect(component.nextStatuses(makeAppointment({ status: 'SCHEDULED' }))).toEqual([
      'CONFIRMED',
      'CANCELLED',
    ]);
    expect(component.nextStatuses(makeAppointment({ status: 'CONFIRMED' }))).toEqual([
      'COMPLETED',
      'CANCELLED',
    ]);
    expect(component.nextStatuses(makeAppointment({ status: 'COMPLETED' }))).toEqual([]);
  }));

  it('confirms an appointment without a dialog', fakeAsync(() => {
    appointmentService.updateStatus.and.returnValue(of(makeAppointment({ status: 'CONFIRMED' })));
    setup();

    component.changeStatus(makeAppointment(), 'CONFIRMED');

    expect(dialog.open).not.toHaveBeenCalled();
    expect(appointmentService.updateStatus).toHaveBeenCalledWith(1, 'CONFIRMED');
    expect(notification.success).toHaveBeenCalled();
  }));

  it('asks before cancelling', fakeAsync(() => {
    appointmentService.updateStatus.and.returnValue(of(makeAppointment({ status: 'CANCELLED' })));
    setup();

    component.changeStatus(makeAppointment(), 'CANCELLED');

    expect(dialog.open).toHaveBeenCalled();
    expect(appointmentService.updateStatus).toHaveBeenCalledWith(1, 'CANCELLED');
  }));

  it('does nothing when the cancel dialog is dismissed', fakeAsync(() => {
    dialog.open.and.returnValue({ afterClosed: () => of(false) });
    setup();

    component.changeStatus(makeAppointment(), 'CANCELLED');

    expect(appointmentService.updateStatus).not.toHaveBeenCalled();
  }));

  it('reports API errors', fakeAsync(() => {
    appointmentService.updateStatus.and.returnValue(
      throwError({
        status: 409,
        message: 'An appointment cannot be moved from completed to confirmed',
      })
    );
    setup();

    component.changeStatus(makeAppointment(), 'CONFIRMED');

    expect(notification.error).toHaveBeenCalledWith(
      'An appointment cannot be moved from completed to confirmed'
    );
  }));

  it('hides the doctor filter for doctors', fakeAsync(() => {
    role = 'DOCTOR';
    setup();

    expect(fixture.nativeElement.textContent).not.toContain('All doctors');
  }));
});
