import { Router } from 'express';

import appointmentRoutes from './appointmentRoutes';
import authRoutes from './authRoutes';
import dashboardRoutes from './dashboardRoutes';
import doctorRoutes from './doctorRoutes';
import patientRoutes from './patientRoutes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/doctors', doctorRoutes);
router.use('/patients', patientRoutes);
router.use('/appointments', appointmentRoutes);

export default router;
