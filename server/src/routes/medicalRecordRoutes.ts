import { Router } from 'express';

import * as records from '../controllers/medicalRecordController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { idParam } from '../validators/common';
import { medicalRecordListRules, medicalRecordRules } from '../validators/medicalRecordValidators';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize('ADMIN', 'DOCTOR'),
  medicalRecordListRules,
  validate,
  asyncHandler(records.list)
);
router.get('/:id', authorize('ADMIN', 'DOCTOR'), idParam(), validate, asyncHandler(records.get));
router.put(
  '/:id',
  authorize('DOCTOR'),
  idParam(),
  medicalRecordRules,
  validate,
  asyncHandler(records.update)
);

export default router;
