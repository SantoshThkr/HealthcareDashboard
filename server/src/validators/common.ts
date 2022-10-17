import { body } from 'express-validator';

export const PHONE_PATTERN = /^\+?[0-9 ()-]{7,20}$/;
export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const nameField = (field: string, label: string) =>
  body(field)
    .trim()
    .notEmpty()
    .withMessage(`${label} is required`)
    .bail()
    .isLength({ max: 50 })
    .withMessage(`${label} must be at most 50 characters`);

export const emailField = (field = 'email') =>
  body(field)
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .bail()
    .isEmail()
    .withMessage('Invalid email')
    .bail()
    .isLength({ max: 120 })
    .withMessage('Email must be at most 120 characters')
    .normalizeEmail({ gmail_remove_dots: false });

export const passwordField = (field = 'password') =>
  body(field)
    .isString()
    .withMessage('Password is required')
    .bail()
    .isLength({ min: 8, max: 72 })
    .withMessage('Password must be between 8 and 72 characters')
    .bail()
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain a letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain a number');
