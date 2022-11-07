import { body, query } from 'express-validator';

import { GENDERS, PATIENT_STATUSES } from '../models/patient';
import { today } from '../utils/dates';
import { listQueryRules, nameField, optionalText, PHONE_PATTERN, phoneField } from './common';

export const patientListRules = [
  ...listQueryRules,
  query('status').optional().isIn(PATIENT_STATUSES).withMessage('Invalid status'),
  query('doctorId').optional().isInt({ min: 1 }).withMessage('Invalid doctor').toInt(),
];

export const patientRules = [
  nameField('firstName', 'First name'),
  nameField('lastName', 'Last name'),
  body('dateOfBirth')
    .isISO8601({ strict: true })
    .withMessage('Date of birth must be a valid date')
    .bail()
    .custom((value: string) => value >= '1900-01-01' && value <= today())
    .withMessage('Date of birth must be between 1900 and today'),
  body('gender').isIn(GENDERS).withMessage('Gender is required'),
  phoneField('phone'),
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('Invalid email')
    .bail()
    .isLength({ max: 120 })
    .withMessage('Email must be at most 120 characters')
    .normalizeEmail({ gmail_remove_dots: false }),
  optionalText('address', 'Address', 255),
  optionalText('emergencyContactName', 'Emergency contact name', 100),
  body('emergencyContactPhone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(PHONE_PATTERN)
    .withMessage('Emergency contact phone must be a valid phone number'),
  body('doctorId')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Invalid doctor')
    .toInt(),
  body('status').optional().isIn(PATIENT_STATUSES).withMessage('Invalid status'),
];
