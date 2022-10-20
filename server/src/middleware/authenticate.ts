import { RequestHandler } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

import { Doctor, User } from '../models';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { verifyToken } from '../utils/token';

export const authenticate: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(ApiError.unauthorized());
  }

  try {
    const payload = verifyToken(header.slice(7));
    const user = await User.findByPk(payload.sub, {
      include: [{ model: Doctor, as: 'doctorProfile', attributes: ['id'] }],
    });

    if (!user || !user.isActive) {
      logger.warn(`Rejected token for missing or inactive user ${payload.sub}`);
      return next(ApiError.unauthorized('Your session is no longer valid'));
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      return next(ApiError.unauthorized('Your session has expired. Please sign in again.'));
    }
    if (err instanceof JsonWebTokenError) {
      logger.warn(`Invalid token from ${req.ip}`);
      return next(ApiError.unauthorized('Invalid authentication token'));
    }
    next(err);
  }
};
