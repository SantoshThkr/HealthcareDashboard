import { body } from 'express-validator';

import { emailField, nameField, passwordField } from './common';

export const registerRules = [
  nameField('firstName', 'First name'),
  nameField('lastName', 'Last name'),
  emailField(),
  passwordField(),
];

export const loginRules = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('password')
    .isString()
    .withMessage('Password is required')
    .bail()
    .notEmpty()
    .withMessage('Password is required'),
];
