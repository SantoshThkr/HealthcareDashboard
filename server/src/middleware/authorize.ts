import { RequestHandler } from 'express';

import { Role } from '../models/user';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

export function authorize(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!roles.includes(req.user.role)) {
      logger.warn(`User ${req.user.id} (${req.user.role}) denied ${req.method} ${req.baseUrl}`);
      return next(ApiError.forbidden());
    }
    next();
  };
}
