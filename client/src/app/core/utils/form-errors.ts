import { FormGroup } from '@angular/forms';

import { ApiError } from '../models/api.model';

export function applyServerErrors(form: FormGroup, error: ApiError): boolean {
  if (error.status !== 400 && error.status !== 409) {
    return false;
  }
  let applied = false;
  Object.entries(error.errors || {}).forEach(([field, message]) => {
    const control = form.get(field);
    if (control) {
      control.setErrors({ server: message });
      control.markAsTouched();
      applied = true;
    }
  });
  return applied;
}
