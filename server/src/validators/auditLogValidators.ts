import { query } from 'express-validator';

import { AUDIT_ACTIONS } from '../models/auditLog';

export const auditLogListRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive number'),
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Page size must be between 1 and 100'),
  query('action').optional().isIn(AUDIT_ACTIONS).withMessage('Invalid action'),
  query('userId').optional().isInt({ min: 1 }).withMessage('Invalid user').toInt(),
  query('dateFrom').optional().isISO8601({ strict: true }).withMessage('Invalid date'),
  query('dateTo').optional().isISO8601({ strict: true }).withMessage('Invalid date'),
];
