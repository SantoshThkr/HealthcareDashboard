import { body, query } from 'express-validator';

import { DOCTOR_STATUSES } from '../models/doctor';
import {
  emailField,
  listQueryRules,
  nameField,
  optionalText,
  phoneField,
  requiredText,
} from './common';

export const doctorListRules = [
  ...listQueryRules,
  query('status').optional().isIn(DOCTOR_STATUSES).withMessage('Invalid status'),
  query('department').optional().isString().trim().isLength({ max: 80 }),
];

export const doctorRules = [
  nameField('firstName', 'First name'),
  nameField('lastName', 'Last name'),
  emailField(),
  phoneField('phone'),
  requiredText('specialization', 'Specialization', 80),
  requiredText('department', 'Department', 80),
  requiredText('licenseNumber', 'License number', 30)
    .bail()
    .matches(/^[A-Za-z0-9-]+$/)
    .withMessage('License number may only contain letters, numbers and dashes'),
  optionalText('availability', 'Availability', 120),
  body('status').optional().isIn(DOCTOR_STATUSES).withMessage('Invalid status'),
];
