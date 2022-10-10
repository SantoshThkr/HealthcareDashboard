import { ErrorRequestHandler, RequestHandler } from 'express';
import { ForeignKeyConstraintError, UniqueConstraintError } from 'sequelize';

import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
  }

  if (err instanceof UniqueConstraintError) {
    const errors: Record<string, string> = {};
    err.errors.forEach((item) => {
      if (item.path) {
        errors[item.path] = `This ${item.path} is already in use`;
      }
    });
    return res.status(409).json({ success: false, message: 'Record already exists', errors });
  }

  if (err instanceof ForeignKeyConstraintError) {
    return res.status(409).json({
      success: false,
      message: 'This record is referenced by other data and cannot be changed',
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Malformed JSON body' });
  }

  logger.error(`${req.method} ${req.path} failed: ${err.stack || err}`);
  return res.status(500).json({ success: false, message: 'Something went wrong' });
};
