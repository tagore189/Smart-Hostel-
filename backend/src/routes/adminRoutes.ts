import { Router } from 'express';
import {
  getDashboardStats,
  getAdminResidents,
  createAdminResident,
  getAdminFloors,
  getAdminRooms,
  assignBedResident,
  vacateBedResident,
  getAdminComplaints,
  updateComplaintStatus,
  getAdminPaymentStats,
  getAdminPayments,
  recordAdminPayment,
  createAdminNotice,
  getAdminStaff,
  getAdminReports,
  getAdminEmergencyAlerts,
  updateEmergencyAlertStatus,
  getAdminMessFeedback,
  getAdminMessOptOuts,
  upsertMealMenu,
} from '../controllers/adminController';
import { getNotices } from '../controllers/noticesController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Protect all admin routes with authentication and role check (SUPER_ADMIN, ADMIN, WARDEN)
router.use(authenticate, requireAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/residents', getAdminResidents);
router.post('/residents', createAdminResident);

// Floors & Rooms (Section 19)
router.get('/floors', getAdminFloors);
router.get('/rooms', getAdminRooms);
router.put('/rooms/assign', assignBedResident);
router.put('/rooms/vacate', vacateBedResident);

// Complaints (Section 22)
router.get('/complaints', getAdminComplaints);
router.put('/complaints/:id/status', updateComplaintStatus);

// Payments (Section 20)
router.get('/payments/stats', getAdminPaymentStats);
router.get('/payments', getAdminPayments);
router.post('/payments/record', recordAdminPayment);

// Notices (Section 23)
router.get('/notices', getNotices);
router.post('/notices', createAdminNotice);

// Staff (Section 26) & Reports (Section 25)
router.get('/staff', getAdminStaff);
router.get('/reports', getAdminReports);

// Emergency routes (Section 24)
router.get('/emergency', getAdminEmergencyAlerts);
router.put('/emergency/:id/status', updateEmergencyAlertStatus);

// Mess administration (Section 21)
router.get('/mess/feedback', getAdminMessFeedback);
router.get('/mess/opt-outs', getAdminMessOptOuts);
router.post('/mess/menu', upsertMealMenu);

export default router;
