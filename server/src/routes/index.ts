import { Router } from 'express';

import appointmentRoutes from './appointmentRoutes';
import auditLogRoutes from './auditLogRoutes';
import authRoutes from './authRoutes';
import dashboardRoutes from './dashboardRoutes';
import doctorRoutes from './doctorRoutes';
import medicalRecordRoutes from './medicalRecordRoutes';
import patientRoutes from './patientRoutes';
import userRoutes from './userRoutes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/doctors', doctorRoutes);
router.use('/patients', patientRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/medical-records', medicalRecordRoutes);
router.use('/users', userRoutes);
router.use('/audit-logs', auditLogRoutes);

export default router;
