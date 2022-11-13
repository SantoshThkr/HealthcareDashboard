import { Router } from 'express';

import * as records from '../controllers/medicalRecordController';
import * as patients from '../controllers/patientController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { idParam } from '../validators/common';
import { medicalRecordRules } from '../validators/medicalRecordValidators';
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

router.get(
  '/:id/medical-records',
  authorize('ADMIN', 'DOCTOR'),
  idParam(),
  validate,
  asyncHandler(records.listForPatient)
);
router.post(
  '/:id/medical-records',
  authorize('DOCTOR'),
  idParam(),
  medicalRecordRules,
  validate,
  asyncHandler(records.create)
);

export default router;
