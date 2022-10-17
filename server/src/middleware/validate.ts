import { RequestHandler } from 'express';
import { validationResult } from 'express-validator';

import { ApiError, FieldErrors } from '../utils/ApiError';

export const validate: RequestHandler = (req, _res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }

  const errors: FieldErrors = {};
  result.array({ onlyFirstError: true }).forEach((error) => {
    errors[error.param] = error.msg;
  });
  next(ApiError.badRequest('Validation failed', errors));
};
