import { body, query } from 'express-validator';

import { APPOINTMENT_STATUSES } from '../models/appointment';
import { today } from '../utils/dates';
import { listQueryRules, optionalText, TIME_PATTERN } from './common';

export const appointmentListRules = [
  ...listQueryRules,
  query('status').optional().isIn(APPOINTMENT_STATUSES).withMessage('Invalid status'),
  query('doctorId').optional().isInt({ min: 1 }).withMessage('Invalid doctor').toInt(),
  query('patientId').optional().isInt({ min: 1 }).withMessage('Invalid patient').toInt(),
  query('date').optional().isISO8601({ strict: true }).withMessage('Invalid date'),
  query('dateFrom').optional().isISO8601({ strict: true }).withMessage('Invalid date'),
  query('dateTo').optional().isISO8601({ strict: true }).withMessage('Invalid date'),
];

export const createAppointmentRules = [
  body('patientId').isInt({ min: 1 }).withMessage('Patient is required').toInt(),
  body('doctorId').isInt({ min: 1 }).withMessage('Doctor is required').toInt(),
  body('date')
    .isISO8601({ strict: true })
    .withMessage('Date must be a valid date')
    .bail()
    .custom((value: string) => value >= today())
    .withMessage('Date cannot be in the past'),
  body('time').matches(TIME_PATTERN).withMessage('Time must be in HH:mm format'),
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Reason is required')
    .bail()
    .isLength({ max: 255 })
    .withMessage('Reason must be at most 255 characters'),
  optionalText('notes', 'Notes', 2000),
];

export const updateAppointmentRules = [
  body('patientId').optional().isInt({ min: 1 }).withMessage('Invalid patient').toInt(),
  body('doctorId').optional().isInt({ min: 1 }).withMessage('Invalid doctor').toInt(),
  body('date').optional().isISO8601({ strict: true }).withMessage('Date must be a valid date'),
  body('time').optional().matches(TIME_PATTERN).withMessage('Time must be in HH:mm format'),
  body('reason')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Reason is required')
    .bail()
    .isLength({ max: 255 })
    .withMessage('Reason must be at most 255 characters'),
  body('status').optional().isIn(APPOINTMENT_STATUSES).withMessage('Invalid status'),
  optionalText('notes', 'Notes', 2000),
];
