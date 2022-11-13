import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, map } from 'rxjs/operators';

import { ApiError, LoadState } from '../../core/models/api.model';
import { PersonRef } from '../../core/models/appointment.model';
import { MedicalRecordPayload } from '../../core/models/medical-record.model';
import { MedicalRecordService } from '../../core/services/medical-record.service';
import { NotificationService } from '../../core/services/notification.service';
import { PatientService } from '../../core/services/patient.service';
import { fromIsoDate, startOfToday, toIsoDate } from '../../core/utils/dates';
import { applyServerErrors } from '../../core/utils/form-errors';
import {
  notInFutureValidator,
  trimmedRequired,
  validationMessage,
} from '../../shared/forms/validators';

function followUpAfterVisit(group: AbstractControl): ValidationErrors | null {
  const visit: Date | null = group.get('visitDate')?.value;
  const followUp: Date | null = group.get('followUpDate')?.value;
  return visit && followUp && followUp < visit ? { followUpBeforeVisit: true } : null;
}

@Component({
  selector: 'app-medical-record-form',
  templateUrl: './medical-record-form.component.html',
})
export class MedicalRecordFormComponent implements OnInit {
  recordId: number | null = null;
  patientId: number | null = null;
  patient?: PersonRef;
  patients: PersonRef[] = [];
  state: LoadState = 'loading';
  submitting = false;
  formError = '';
  today = startOfToday();

  form = this.fb.group(
    {
      patientId: [null as number | null, Validators.required],
      visitDate: [startOfToday() as Date | null, [Validators.required, notInFutureValidator]],
      diagnosis: ['', [trimmedRequired, Validators.maxLength(255)]],
      symptoms: ['', Validators.maxLength(2000)],
      prescription: ['', Validators.maxLength(2000)],
      notes: ['', Validators.maxLength(2000)],
      followUpDate: [null as Date | null],
    },
    { validators: followUpAfterVisit }
  );

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private recordService: MedicalRecordService,
    private patientService: PatientService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const patientId = this.route.snapshot.queryParamMap.get('patientId');
    this.recordId = id ? Number(id) : null;
    this.patientId = patientId ? Number(patientId) : null;
    this.load();
  }

  load(): void {
    this.state = 'loading';
    if (this.recordId) {
      this.recordService.get(this.recordId).subscribe(
        (record) => {
          this.patient = record.patient;
          this.patientId = record.patientId;
          this.form.patchValue({
            ...record,
            visitDate: fromIsoDate(record.visitDate),
            followUpDate: fromIsoDate(record.followUpDate),
          });
          this.form.get('patientId')?.disable();
          this.state = 'loaded';
        },
        () => (this.state = 'error')
      );
      return;
    }

    const patients$ = this.patientId
      ? this.patientService.get(this.patientId).pipe(map((patient) => [patient]))
      : this.patientService
          .list({ status: 'ACTIVE', pageSize: 100, sortBy: 'name' })
          .pipe(map((page) => page.items));
    patients$.subscribe(
      (patients) => {
        this.patients = patients;
        if (this.patientId) {
          this.form.patchValue({ patientId: this.patientId });
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
    const value = this.form.getRawValue();
    const payload: MedicalRecordPayload = {
      visitDate: toIsoDate(value.visitDate) as string,
      diagnosis: value.diagnosis,
      symptoms: value.symptoms || null,
      prescription: value.prescription || null,
      notes: value.notes || null,
      followUpDate: toIsoDate(value.followUpDate),
    };
    const request = this.recordId
      ? this.recordService.update(this.recordId, payload)
      : this.recordService.create(value.patientId, payload);

    request.pipe(finalize(() => (this.submitting = false))).subscribe(
      (record) => {
        this.notification.success(
          this.recordId ? 'Medical record updated' : 'Medical record added'
        );
        this.router.navigate(['/patients', record.patientId], { fragment: 'records' });
      },
      (err: ApiError) => {
        if (!applyServerErrors(this.form, err)) {
          this.formError = err.message;
        }
      }
    );
  }
}
