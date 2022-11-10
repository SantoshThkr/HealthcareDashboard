import { Router } from 'express';

import * as appointments from '../controllers/appointmentController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import {
  appointmentListRules,
  createAppointmentRules,
  updateAppointmentRules,
} from '../validators/appointmentValidators';
import { idParam } from '../validators/common';

const router = Router();

router.use(authenticate);

router.get('/', appointmentListRules, validate, asyncHandler(appointments.list));
router.get('/:id', idParam(), validate, asyncHandler(appointments.get));
router.post(
  '/',
  authorize('ADMIN', 'STAFF'),
  createAppointmentRules,
  validate,
  asyncHandler(appointments.create)
);
router.put(
  '/:id',
  authorize('ADMIN', 'STAFF', 'DOCTOR'),
  idParam(),
  updateAppointmentRules,
  validate,
  asyncHandler(appointments.update)
);
router.delete('/:id', authorize('ADMIN'), idParam(), validate, asyncHandler(appointments.remove));

export default router;
