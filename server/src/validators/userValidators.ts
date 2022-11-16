import { body, query } from 'express-validator';

import { ROLES } from '../models/user';
import { emailField, listQueryRules, nameField, passwordField } from './common';

export const userListRules = [
  ...listQueryRules,
  query('role').optional().isIn(ROLES).withMessage('Invalid role'),
  query('isActive').optional().isBoolean().withMessage('Invalid status'),
];

const doctorIdField = body('doctorId')
  .optional({ nullable: true })
  .isInt({ min: 1 })
  .withMessage('Invalid doctor profile')
  .toInt();

export const createUserRules = [
  nameField('firstName', 'First name'),
  nameField('lastName', 'Last name'),
  emailField(),
  passwordField(),
  body('role').isIn(ROLES).withMessage('Role is required'),
  body('isActive').optional().isBoolean().withMessage('Invalid status').toBoolean(),
  doctorIdField,
];

export const updateUserRules = [
  nameField('firstName', 'First name').optional(),
  nameField('lastName', 'Last name').optional(),
  emailField().optional(),
  passwordField().optional(),
  body('role').optional().isIn(ROLES).withMessage('Invalid role'),
  body('isActive').optional().isBoolean().withMessage('Invalid status').toBoolean(),
  doctorIdField,
];
