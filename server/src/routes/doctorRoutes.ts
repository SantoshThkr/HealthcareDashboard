import { Router } from 'express';

import * as doctors from '../controllers/doctorController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { idParam } from '../validators/common';
import { doctorListRules, doctorRules } from '../validators/doctorValidators';

const router = Router();

router.use(authenticate);

router.get('/', doctorListRules, validate, asyncHandler(doctors.list));
router.get('/:id', idParam(), validate, asyncHandler(doctors.get));
router.post('/', authorize('ADMIN'), doctorRules, validate, asyncHandler(doctors.create));
router.put(
  '/:id',
  authorize('ADMIN'),
  idParam(),
  doctorRules,
  validate,
  asyncHandler(doctors.update)
);
router.delete('/:id', authorize('ADMIN'), idParam(), validate, asyncHandler(doctors.remove));

export default router;
