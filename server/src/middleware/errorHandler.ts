import { ErrorRequestHandler, RequestHandler } from 'express';
import {
  DatabaseError,
  ForeignKeyConstraintError,
  UniqueConstraintError,
  ValidationError,
} from 'sequelize';

import { ApiError, FieldErrors } from '../utils/ApiError';
import { logger } from '../utils/logger';

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
};

function fieldErrors(err: ValidationError, message: (path: string) => string): FieldErrors {
  const errors: FieldErrors = {};
  err.errors.forEach((item) => {
    if (item.path) {
      errors[item.path] = message(item.path);
    }
  });
  return errors;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ApiError) {
    if (err.status >= 500) {
      logger.error(`${req.method} ${req.path} failed: ${err.message}`);
    }
    return res.status(err.status).json({
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
  }

  if (err instanceof UniqueConstraintError) {
    return res.status(409).json({
      success: false,
      message: 'Record already exists',
      errors: fieldErrors(err, (path) => `This ${path} is already in use`),
    });
  }

  if (err instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: fieldErrors(err, (path) => `Invalid ${path}`),
    });
  }

  if (err instanceof ForeignKeyConstraintError) {
    return res.status(409).json({
      success: false,
      message: 'This record is referenced by other data and cannot be changed',
    });
  }

  if (err instanceof DatabaseError && /invalid input/i.test(err.message)) {
    return res.status(400).json({ success: false, message: 'Invalid request data' });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Malformed JSON body' });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Request body is too large' });
  }

  logger.error(`${req.method} ${req.path} failed: ${err.stack || err}`);
  return res.status(500).json({ success: false, message: 'Something went wrong' });
};
