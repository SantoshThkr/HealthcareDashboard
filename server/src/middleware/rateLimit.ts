import rateLimit from 'express-rate-limit';

import { config } from '../config';

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skip: () => config.env === 'test',
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many attempts. Please try again later.',
    });
  },
});
