import { Router } from 'express';

import authRoutes from './authRoutes';
import dashboardRoutes from './dashboardRoutes';
import doctorRoutes from './doctorRoutes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/doctors', doctorRoutes);

export default router;
