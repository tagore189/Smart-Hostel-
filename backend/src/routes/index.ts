import { Router } from 'express';
import authRoutes from './authRoutes';
import residentRoutes from './residentRoutes';
import paymentRoutes from './paymentRoutes';
import complaintRoutes from './complaintRoutes';
import messRoutes from './messRoutes';
import noticeRoutes from './noticeRoutes';
import emergencyRoutes from './emergencyRoutes';
import notificationRoutes from './notificationRoutes';
import adminRoutes from './adminRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/residents', residentRoutes);
router.use('/payments', paymentRoutes);
router.use('/complaints', complaintRoutes);
router.use('/mess', messRoutes);
router.use('/notices', noticeRoutes);
router.use('/emergency', emergencyRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'SLG Luxury Ladies PG API',
    location: 'KPHB / Kukatpally, Hyderabad, Telangana',
    timestamp: new Date(),
  });
});

export default router;
