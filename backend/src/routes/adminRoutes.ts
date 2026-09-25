import { Router } from 'express';
import {
  getDashboardStats,
  getAdminResidents,
  createAdminResident,
  getAdminRooms,
  getAdminComplaints,
  updateComplaintStatus,
  getAdminOutings,
  approveOuting,
  rejectOuting,
  getAdminVisitors,
  approveVisitor,
  rejectVisitor,
  getAdminPayments,
  createAdminNotice,
  getAdminStaff,
  getAdminReports,
} from '../controllers/adminController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Protect all admin routes with authentication and role check (SUPER_ADMIN, ADMIN, WARDEN)
router.use(authenticate, requireAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/residents', getAdminResidents);
router.post('/residents', createAdminResident);
router.get('/rooms', getAdminRooms);
router.get('/complaints', getAdminComplaints);
router.put('/complaints/:id/status', updateComplaintStatus);
router.get('/outings', getAdminOutings);
router.put('/outings/:id/approve', approveOuting);
router.put('/outings/:id/reject', rejectOuting);
router.get('/visitors', getAdminVisitors);
router.put('/visitors/:id/approve', approveVisitor);
router.put('/visitors/:id/reject', rejectVisitor);
router.get('/payments', getAdminPayments);
router.post('/notices', createAdminNotice);
router.get('/staff', getAdminStaff);
router.get('/reports', getAdminReports);

export default router;
