import { Component, Inject } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';

import { ApiError } from '../../core/models/api.model';
import { User } from '../../core/models/user.model';
import { NotificationService } from '../../core/services/notification.service';
import { UserService } from '../../core/services/user.service';
import { applyServerErrors } from '../../core/utils/form-errors';
import { validationMessage } from '../../shared/forms/validators';
import { PASSWORD_VALIDATORS } from '../user-form/user-form.component';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent {
  user: User;
  submitting = false;
  formError = '';
  form = this.fb.group({ password: ['', PASSWORD_VALIDATORS] });

  constructor(
    @Inject(MAT_DIALOG_DATA) data: { user: User },
    private dialogRef: MatDialogRef<ResetPasswordComponent>,
    private fb: FormBuilder,
    private userService: UserService,
    private notification: NotificationService
  ) {
    this.user = data.user;
  }

  error(): string {
    return validationMessage(this.form.get('password'), 'Password');
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;
    this.userService
      .update(this.user.id, { password: this.form.value.password })
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe(
        () => {
          this.notification.success('Password reset. Share the new password securely.');
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
