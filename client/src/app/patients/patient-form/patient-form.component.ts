import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ApiError, LoadState } from '../../core/models/api.model';
import { Doctor } from '../../core/models/doctor.model';
import { GENDERS, PATIENT_STATUSES, PatientPayload } from '../../core/models/patient.model';
import { DoctorService } from '../../core/services/doctor.service';
import { NotificationService } from '../../core/services/notification.service';
import { PatientService } from '../../core/services/patient.service';
import { fromIsoDate, startOfToday, toIsoDate } from '../../core/utils/dates';
import { applyServerErrors } from '../../core/utils/form-errors';
import {
  notInFutureValidator,
  phoneValidator,
  trimmedRequired,
  validationMessage,
} from '../../shared/forms/validators';

@Component({
  selector: 'app-patient-form',
  templateUrl: './patient-form.component.html',
})
export class PatientFormComponent implements OnInit {
  patientId: number | null = null;
  state: LoadState = 'loading';
  submitting = false;
  formError = '';
  doctors: Doctor[] = [];
  genders = GENDERS;
  statuses = PATIENT_STATUSES;
  maxBirthDate = startOfToday();
  minBirthDate = new Date(1900, 0, 1);

  form = this.fb.group({
    firstName: ['', [trimmedRequired, Validators.maxLength(50)]],
    lastName: ['', [trimmedRequired, Validators.maxLength(50)]],
    dateOfBirth: [null as Date | null, [Validators.required, notInFutureValidator]],
    gender: ['', Validators.required],
    phone: ['', [Validators.required, phoneValidator]],
    email: ['', [Validators.email, Validators.maxLength(120)]],
    address: ['', Validators.maxLength(255)],
    emergencyContactName: ['', Validators.maxLength(100)],
    emergencyContactPhone: ['', phoneValidator],
    doctorId: [null as number | null],
    status: ['ACTIVE', Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private patientService: PatientService,
    private doctorService: DoctorService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.patientId = id ? Number(id) : null;
    this.load();
  }

  load(): void {
    this.state = 'loading';
    forkJoin({
      doctors: this.doctorService.listActive(),
      patient: this.patientId ? this.patientService.get(this.patientId) : of(null),
    }).subscribe(
      ({ doctors, patient }) => {
        this.doctors = doctors;
        if (patient) {
          if (patient.doctor && !doctors.some((doctor) => doctor.id === patient.doctorId)) {
            this.doctors = [patient.doctor as Doctor, ...doctors];
          }
          this.form.patchValue({ ...patient, dateOfBirth: fromIsoDate(patient.dateOfBirth) });
        }
        this.state = 'loaded';
      },
      () => (this.state = 'error')
    );
  }

  error(name: string, label: string): string {
    return validationMessage(this.form.get(name), label);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.formError = '';
    const payload: PatientPayload = {
      ...this.form.value,
      dateOfBirth: toIsoDate(this.form.value.dateOfBirth),
    };
    const request = this.patientId
      ? this.patientService.update(this.patientId, payload)
      : this.patientService.create(payload);

    request.pipe(finalize(() => (this.submitting = false))).subscribe(
      (patient) => {
        this.notification.success(this.patientId ? 'Patient updated' : 'Patient registered');
        this.router.navigate(['/patients', patient.id]);
      },
      (err: ApiError) => {
        if (!applyServerErrors(this.form, err)) {
          this.formError = err.message;
        }
      }
    );
  }
}
