import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize, map } from 'rxjs/operators';

import { ApiError } from '../../core/models/api.model';
import { Doctor } from '../../core/models/doctor.model';
import { ROLES, User, UserPayload } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { DoctorService } from '../../core/services/doctor.service';
import { NotificationService } from '../../core/services/notification.service';
import { UserService } from '../../core/services/user.service';
import { applyServerErrors } from '../../core/utils/form-errors';
import { trimmedRequired, validationMessage } from '../../shared/forms/validators';

export const PASSWORD_VALIDATORS = [
  Validators.required,
  Validators.minLength(8),
  Validators.maxLength(72),
  Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/),
];

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
})
export class UserFormComponent implements OnInit {
  user?: User;
  isSelf = false;
  roles = ROLES;
  doctorProfiles: Doctor[] = [];
  submitting = false;
  formError = '';

  form = this.fb.group({
    firstName: ['', [trimmedRequired, Validators.maxLength(50)]],
    lastName: ['', [trimmedRequired, Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    role: ['STAFF', Validators.required],
    doctorId: [null as number | null],
    isActive: [true],
    password: ['', PASSWORD_VALIDATORS],
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) data: { user?: User },
    private dialogRef: MatDialogRef<UserFormComponent>,
    private fb: FormBuilder,
    private userService: UserService,
    private doctorService: DoctorService,
    private auth: AuthService,
    private notification: NotificationService
  ) {
    this.user = data.user;
  }

  ngOnInit(): void {
    if (this.user) {
      this.isSelf = this.user.id === this.auth.currentUser?.id;
      this.form.patchValue({ ...this.user, doctorId: this.user.doctorProfile?.id ?? null });
      this.form.removeControl('password');
      if (this.isSelf) {
        this.form.get('role')?.disable();
        this.form.get('isActive')?.disable();
      }
    }

    this.doctorService
      .list({ pageSize: 100, sortBy: 'name' })
      .pipe(map((page) => page.items))
      .subscribe((doctors) => {
        this.doctorProfiles = doctors.filter(
          (doctor) => !doctor.userId || doctor.userId === this.user?.id
        );
      });
  }

  get isDoctorRole(): boolean {
    return this.form.get('role')?.value === 'DOCTOR';
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
    const payload: UserPayload = { ...this.form.value };
    if (!this.isDoctorRole) {
      delete payload.doctorId;
    }
    const request = this.user
      ? this.userService.update(this.user.id, payload)
      : this.userService.create(payload);

    request.pipe(finalize(() => (this.submitting = false))).subscribe(
      () => {
        this.notification.success(this.user ? 'User updated' : 'User created');
        this.dialogRef.close(true);
      },
      (err: ApiError) => {
        if (!applyServerErrors(this.form, err)) {
          this.formError = err.message;
        }
      }
    );
  }
}
