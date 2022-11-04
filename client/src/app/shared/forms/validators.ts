import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

import { startOfToday } from '../../core/utils/dates';

export const PHONE_PATTERN = /^\+?[0-9 ()-]{7,20}$/;

export const phoneValidator: ValidatorFn = (control) =>
  !control.value || PHONE_PATTERN.test(control.value) ? null : { phone: true };

export const notInFutureValidator: ValidatorFn = (control) =>
  control.value instanceof Date && control.value > startOfToday() ? { futureDate: true } : null;

export const notInPastValidator: ValidatorFn = (control) =>
  control.value instanceof Date && control.value < startOfToday() ? { pastDate: true } : null;

export const trimmedRequired: ValidatorFn = (control) =>
  typeof control.value === 'string' && !control.value.trim()
    ? { required: true }
    : Validators.required(control);

export function validationMessage(control: AbstractControl | null, label: string): string {
  const errors: ValidationErrors | null | undefined = control?.errors;
  if (!errors) {
    return '';
  }
  if (errors.server) {
    return errors.server;
  }
  if (errors.required) {
    return `${label} is required`;
  }
  if (errors.email) {
    return 'Enter a valid email address';
  }
  if (errors.phone) {
    return 'Enter a valid phone number';
  }
  if (errors.maxlength) {
    return `${label} must be at most ${errors.maxlength.requiredLength} characters`;
  }
  if (errors.minlength) {
    return `${label} must be at least ${errors.minlength.requiredLength} characters`;
  }
  if (errors.matDatepickerParse) {
    return 'Enter a valid date';
  }
  if (errors.futureDate) {
    return `${label} cannot be in the future`;
  }
  if (errors.pastDate) {
    return `${label} cannot be in the past`;
  }
  return `${label} is invalid`;
}
