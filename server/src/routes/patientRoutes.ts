import { Router } from 'express';

import * as patients from '../controllers/patientController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { idParam } from '../validators/common';
import { patientListRules, patientRules } from '../validators/patientValidators';

const router = Router();

router.use(authenticate);

router.get('/', patientListRules, validate, asyncHandler(patients.list));
router.get('/:id', idParam(), validate, asyncHandler(patients.get));
router.post(
  '/',
  authorize('ADMIN', 'STAFF'),
  patientRules,
  validate,
  asyncHandler(patients.create)
);
router.put(
  '/:id',
  authorize('ADMIN', 'STAFF'),
  idParam(),
  patientRules,
  validate,
  asyncHandler(patients.update)
);
router.delete('/:id', authorize('ADMIN'), idParam(), validate, asyncHandler(patients.remove));

export default router;
