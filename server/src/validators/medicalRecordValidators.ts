import { body, query } from 'express-validator';

import { today } from '../utils/dates';
import { listQueryRules, optionalText } from './common';

export const medicalRecordListRules = [
  ...listQueryRules,
  query('patientId').optional().isInt({ min: 1 }).withMessage('Invalid patient').toInt(),
];

export const medicalRecordRules = [
  body('visitDate')
    .isISO8601({ strict: true })
    .withMessage('Visit date must be a valid date')
    .bail()
    .custom((value: string) => value <= today())
    .withMessage('Visit date cannot be in the future'),
  body('diagnosis')
    .trim()
    .notEmpty()
    .withMessage('Diagnosis is required')
    .bail()
    .isLength({ max: 255 })
    .withMessage('Diagnosis must be at most 255 characters'),
  optionalText('symptoms', 'Symptoms', 2000),
  optionalText('prescription', 'Prescription', 2000),
  optionalText('notes', 'Notes', 2000),
  body('followUpDate')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601({ strict: true })
    .withMessage('Follow-up date must be a valid date')
    .bail()
    .custom((value: string, { req }) => !req.body.visitDate || value >= req.body.visitDate)
    .withMessage('Follow-up date must be on or after the visit date'),
];
