import { Router } from 'express';

import * as dashboard from '../controllers/dashboardController';
import { authenticate } from '../middleware/authenticate';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authenticate);
router.get('/summary', asyncHandler(dashboard.summary));
router.get('/recent-activity', asyncHandler(dashboard.recentActivity));

export default router;
