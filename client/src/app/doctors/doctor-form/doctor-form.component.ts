import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { ApiError, LoadState } from '../../core/models/api.model';
import { DEPARTMENTS, DOCTOR_STATUSES } from '../../core/models/doctor.model';
import { DoctorService } from '../../core/services/doctor.service';
import { NotificationService } from '../../core/services/notification.service';
import { applyServerErrors } from '../../core/utils/form-errors';
import { phoneValidator, trimmedRequired, validationMessage } from '../../shared/forms/validators';

@Component({
  selector: 'app-doctor-form',
  templateUrl: './doctor-form.component.html',
})
export class DoctorFormComponent implements OnInit {
  doctorId: number | null = null;
  state: LoadState = 'loaded';
  submitting = false;
  formError = '';
  statuses = DOCTOR_STATUSES;
  departments = DEPARTMENTS;

  form = this.fb.group({
    firstName: ['', [trimmedRequired, Validators.maxLength(50)]],
    lastName: ['', [trimmedRequired, Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    phone: ['', [Validators.required, phoneValidator]],
    specialization: ['', [trimmedRequired, Validators.maxLength(80)]],
    department: ['', Validators.required],
    licenseNumber: ['', [trimmedRequired, Validators.maxLength(30)]],
    availability: ['', Validators.maxLength(120)],
    status: ['ACTIVE', Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private doctorService: DoctorService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.doctorId = Number(id);
      this.load();
    }
  }

  load(): void {
    this.state = 'loading';
    this.doctorService.get(this.doctorId!).subscribe(
      (doctor) => {
        this.form.patchValue(doctor);
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
    const payload = this.form.value;
    const request = this.doctorId
      ? this.doctorService.update(this.doctorId, payload)
      : this.doctorService.create(payload);

    request.pipe(finalize(() => (this.submitting = false))).subscribe(
      () => {
        this.notification.success(this.doctorId ? 'Doctor updated' : 'Doctor added');
        this.router.navigate(['/doctors']);
      },
      (err: ApiError) => {
        if (!applyServerErrors(this.form, err)) {
          this.formError = err.message;
        }
      }
    );
  }
}
