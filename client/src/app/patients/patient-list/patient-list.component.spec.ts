import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { Role } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { PatientService } from '../../core/services/patient.service';
import { SharedModule } from '../../shared/shared.module';
import { asyncData, asyncError, makePatient } from '../../testing/test-data';
import { PatientListComponent } from './patient-list.component';

describe('PatientListComponent', () => {
  let fixture: ComponentFixture<PatientListComponent>;
  let patientService: jasmine.SpyObj<PatientService>;
  let role: Role;

  const page = (
    items = [makePatient(), makePatient({ id: 2, firstName: 'Jane', lastName: 'Roe' })]
  ) => asyncData({ items, total: items.length, page: 1, pageSize: 10 });

  async function setup(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [SharedModule, NoopAnimationsModule, RouterTestingModule],
      declarations: [PatientListComponent],
      providers: [
        { provide: PatientService, useValue: patientService },
        { provide: AuthService, useValue: { hasRole: (...roles: Role[]) => roles.includes(role) } },
        {
          provide: NotificationService,
          useValue: jasmine.createSpyObj('NotificationService', ['success', 'error']),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    role = 'STAFF';
    patientService = jasmine.createSpyObj<PatientService>('PatientService', ['list', 'delete']);
  });

  it('renders a row for each patient', async () => {
    patientService.list.and.returnValue(page());
    await setup();

    const rows = fixture.debugElement.queryAll(By.css('tr.mat-row'));
    expect(rows.length).toBe(2);
    expect(rows[0].nativeElement.textContent).toContain('John Doe');
    expect(rows[0].nativeElement.textContent).toContain('Dr. Sarah Smith');
  });

  it('requests the first page sorted by name', async () => {
    patientService.list.and.returnValue(page());
    await setup();

    expect(patientService.list).toHaveBeenCalledWith(
      jasmine.objectContaining({ page: 1, pageSize: 10, sortBy: 'name', sortDir: 'asc' })
    );
  });

  it('shows an empty message when nothing matches', async () => {
    patientService.list.and.returnValue(page([]));
    await setup();

    expect(fixture.nativeElement.textContent).toContain('No patients found.');
  });

  it('shows an error message when loading fails', async () => {
    patientService.list.and.returnValue(asyncError({ status: 500, message: 'boom' }));
    await setup();

    expect(fixture.nativeElement.textContent).toContain('Unable to load patients.');
  });

  it('searches after the user stops typing', fakeAsync(() => {
    patientService.list.and.returnValue(page());
    setup();
    flush();
    patientService.list.calls.reset();

    fixture.componentInstance.filters.patchValue({ search: 'roe' });
    tick(299);
    expect(patientService.list).not.toHaveBeenCalled();
    tick(1);

    expect(patientService.list).toHaveBeenCalledWith(
      jasmine.objectContaining({ search: 'roe', page: 1 })
    );
  }));

  it('only offers "Add patient" to users who can edit', async () => {
    role = 'DOCTOR';
    patientService.list.and.returnValue(page());
    await setup();

    expect(fixture.nativeElement.textContent).not.toContain('Add patient');
  });
});
