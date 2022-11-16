import { Router } from 'express';

import * as users from '../controllers/userController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { idParam } from '../validators/common';
import { createUserRules, updateUserRules, userListRules } from '../validators/userValidators';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/', userListRules, validate, asyncHandler(users.list));
router.post('/', createUserRules, validate, asyncHandler(users.create));
router.put('/:id', idParam(), updateUserRules, validate, asyncHandler(users.update));

export default router;
