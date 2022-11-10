import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ApiError, LoadState } from '../../core/models/api.model';
import {
  Appointment,
  AppointmentPayload,
  NEXT_STATUSES,
} from '../../core/models/appointment.model';
import { Doctor } from '../../core/models/doctor.model';
import { Patient } from '../../core/models/patient.model';
import { AppointmentService } from '../../core/services/appointment.service';
import { DoctorService } from '../../core/services/doctor.service';
import { NotificationService } from '../../core/services/notification.service';
import { PatientService } from '../../core/services/patient.service';
import { fromIsoDate, startOfToday, toIsoDate } from '../../core/utils/dates';
import { applyServerErrors } from '../../core/utils/form-errors';
import {
  notInPastValidator,
  trimmedRequired,
  validationMessage,
} from '../../shared/forms/validators';

function timeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 8; hour < 18; hour++) {
    for (const minutes of ['00', '15', '30', '45']) {
      slots.push(`${String(hour).padStart(2, '0')}:${minutes}`);
    }
  }
  return slots;
}

@Component({
  selector: 'app-appointment-form',
  templateUrl: './appointment-form.component.html',
})
export class AppointmentFormComponent implements OnInit {
  appointmentId: number | null = null;
  appointment?: Appointment;
  state: LoadState = 'loading';
  submitting = false;
  formError = '';
  patients: Pick<Patient, 'id' | 'firstName' | 'lastName'>[] = [];
  doctors: Pick<Doctor, 'id' | 'firstName' | 'lastName'>[] = [];
  slots = timeSlots();
  minDate = startOfToday();

  form = this.fb.group({
    patientId: [null as number | null, Validators.required],
    doctorId: [null as number | null, Validators.required],
    date: [null as Date | null, [Validators.required, notInPastValidator]],
    time: ['', Validators.required],
    reason: ['', [trimmedRequired, Validators.maxLength(255)]],
    notes: ['', Validators.maxLength(2000)],
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private appointmentService: AppointmentService,
    private patientService: PatientService,
    private doctorService: DoctorService,
    private notification: NotificationService
  ) {}

  get isLocked(): boolean {
    return !!this.appointment && !NEXT_STATUSES[this.appointment.status].length;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.appointmentId = id ? Number(id) : null;
    this.load();
  }

  load(): void {
    this.state = 'loading';
    forkJoin({
      patients: this.patientService.list({ status: 'ACTIVE', pageSize: 100, sortBy: 'name' }),
      doctors: this.doctorService.listActive(),
      appointment: this.appointmentId ? this.appointmentService.get(this.appointmentId) : of(null),
    }).subscribe(
      ({ patients, doctors, appointment }) => {
        this.patients = patients.items;
        this.doctors = doctors;
        if (appointment) {
          this.appointment = appointment;
          this.includeCurrentParticipants(appointment);
          this.form.patchValue({ ...appointment, date: fromIsoDate(appointment.date) });
          if (this.isLocked) {
            this.form.disable();
          }
        } else {
          const patientId = this.route.snapshot.queryParamMap.get('patientId');
          if (patientId) {
            this.form.patchValue({ patientId: Number(patientId) });
          }
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
    const value = this.form.value;
    const payload: AppointmentPayload = {
      ...value,
      date: toIsoDate(value.date),
      notes: value.notes || null,
    };
    const request = this.appointmentId
      ? this.appointmentService.update(this.appointmentId, payload)
      : this.appointmentService.create(payload);

    request.pipe(finalize(() => (this.submitting = false))).subscribe(
      () => {
        this.notification.success(
          this.appointmentId ? 'Appointment updated' : 'Appointment scheduled'
        );
        this.router.navigate(['/appointments']);
      },
      (err: ApiError) => {
        if (!applyServerErrors(this.form, err)) {
          this.formError = err.message;
        }
      }
    );
  }

  private includeCurrentParticipants(appointment: Appointment): void {
    if (appointment.patient && !this.patients.some((p) => p.id === appointment.patientId)) {
      this.patients = [appointment.patient, ...this.patients];
    }
    if (appointment.doctor && !this.doctors.some((d) => d.id === appointment.doctorId)) {
      this.doctors = [appointment.doctor, ...this.doctors];
    }
    if (!this.slots.includes(appointment.time)) {
      this.slots = [...this.slots, appointment.time].sort();
    }
  }
}
