import { Router } from 'express';

import * as auth from '../controllers/authController';
import { authRateLimit } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { loginRules, registerRules } from '../validators/authValidators';

const router = Router();

router.post('/register', authRateLimit, registerRules, validate, asyncHandler(auth.register));
router.post('/login', authRateLimit, loginRules, validate, asyncHandler(auth.login));
router.post('/logout', asyncHandler(auth.logout));

export default router;
