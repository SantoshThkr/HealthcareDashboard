import { Router } from 'express';

import * as auditLogs from '../controllers/auditLogController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { auditLogListRules } from '../validators/auditLogValidators';

const router = Router();

router.get(
  '/',
  authenticate,
  authorize('ADMIN'),
  auditLogListRules,
  validate,
  asyncHandler(auditLogs.list)
);

export default router;
