import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { ApiError } from '../../core/models/api.model';
import { AuthService } from '../../core/services/auth.service';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['../auth.scss'],
})
export class RegisterComponent {
  form = this.fb.group(
    {
      firstName: ['', [Validators.required, Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/),
        ],
      ],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch }
  );
  submitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(private fb: FormBuilder, private auth: AuthService) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    const { firstName, lastName, email, password } = this.form.value;

    this.auth
      .register({ firstName, lastName, email, password })
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe(
        (message) => {
          this.successMessage = message || 'Account created.';
          this.form.reset();
        },
        (err: ApiError) => {
          this.errorMessage = err.errors?.email || err.message || 'Unable to create account.';
        }
      );
  }
}
