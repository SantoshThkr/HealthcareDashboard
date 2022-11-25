import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject, throwError } from 'rxjs';

import { Patient } from '../../core/models/patient.model';
import { DoctorService } from '../../core/services/doctor.service';
import { NotificationService } from '../../core/services/notification.service';
import { PatientService } from '../../core/services/patient.service';
import { SharedModule } from '../../shared/shared.module';
import { makePatient } from '../../testing/test-data';
import { PatientFormComponent } from './patient-form.component';

describe('PatientFormComponent', () => {
  let fixture: ComponentFixture<PatientFormComponent>;
  let component: PatientFormComponent;
  let patientService: jasmine.SpyObj<PatientService>;
  let router: Router;
  let routeId: string | null;

  async function setup(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [SharedModule, NoopAnimationsModule, RouterTestingModule],
      declarations: [PatientFormComponent],
      providers: [
        { provide: PatientService, useValue: patientService },
        { provide: DoctorService, useValue: { listActive: () => of([]) } },
        {
          provide: NotificationService,
          useValue: jasmine.createSpyObj('NotificationService', ['success', 'error']),
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(routeId ? { id: routeId } : {}) } },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture = TestBed.createComponent(PatientFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function fillValidForm(): void {
    component.form.patchValue({
      firstName: 'Ava',
      lastName: 'Hughes',
      dateOfBirth: new Date(2001, 3, 22),
      gender: 'FEMALE',
      phone: '555-0207',
      email: 'ava@example.com',
      status: 'ACTIVE',
    });
  }

  function submit(): void {
    fixture.debugElement.query(By.css('form')).triggerEventHandler('ngSubmit', null);
    fixture.detectChanges();
  }

  beforeEach(() => {
    routeId = null;
    patientService = jasmine.createSpyObj<PatientService>('PatientService', [
      'get',
      'create',
      'update',
    ]);
  });

  it('requires the mandatory fields', async () => {
    await setup();

    submit();

    expect(component.form.invalid).toBeTrue();
    expect(component.error('firstName', 'First name')).toBe('First name is required');
    expect(component.error('phone', 'Phone')).toBe('Phone is required');
    expect(patientService.create).not.toHaveBeenCalled();
  });

  it('validates email, phone and length', async () => {
    await setup();
    component.form.patchValue({ email: 'nope', phone: 'abc', firstName: 'x'.repeat(51) });

    expect(component.error('email', 'Email')).toBe('Enter a valid email address');
    expect(component.error('phone', 'Phone')).toBe('Enter a valid phone number');
    expect(component.error('firstName', 'First name')).toBe(
      'First name must be at most 50 characters'
    );
  });

  it('rejects a date of birth in the future', async () => {
    await setup();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    component.form.patchValue({ dateOfBirth: tomorrow });

    expect(component.error('dateOfBirth', 'Date of birth')).toBe(
      'Date of birth cannot be in the future'
    );
  });

  it('creates a patient with an ISO date and opens the details page', async () => {
    patientService.create.and.returnValue(of(makePatient({ id: 11 })));
    await setup();
    fillValidForm();

    submit();

    const payload = patientService.create.calls.mostRecent().args[0];
    expect(payload.dateOfBirth).toBe('2001-04-22');
    expect(payload.firstName).toBe('Ava');
    expect(router.navigate).toHaveBeenCalledWith(['/patients', 11]);
  });

  it('disables the save button while submitting', async () => {
    const response = new Subject<Patient>();
    patientService.create.and.returnValue(response);
    await setup();
    fillValidForm();

    submit();
    const button = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
    expect(button.disabled).toBeTrue();

    response.next(makePatient());
    response.complete();
    fixture.detectChanges();
    expect(component.submitting).toBeFalse();
  });

  it('shows API validation errors on the matching fields', async () => {
    patientService.create.and.returnValue(
      throwError({ status: 400, message: 'Validation failed', errors: { email: 'Invalid email' } })
    );
    await setup();
    fillValidForm();

    submit();

    expect(component.error('email', 'Email')).toBe('Invalid email');
    expect(component.formError).toBe('');
  });

  it('shows a form-level error for other failures', async () => {
    patientService.create.and.returnValue(
      throwError({ status: 500, message: 'Something went wrong' })
    );
    await setup();
    fillValidForm();

    submit();

    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'Something went wrong'
    );
  });

  it('loads the patient when editing', async () => {
    routeId = '4';
    patientService.get.and.returnValue(of(makePatient({ id: 4, firstName: 'Olivia' })));
    await setup();

    expect(patientService.get).toHaveBeenCalledWith(4);
    expect(component.form.value.firstName).toBe('Olivia');
    expect(component.form.value.dateOfBirth).toEqual(new Date(1984, 2, 12));
  });
});
