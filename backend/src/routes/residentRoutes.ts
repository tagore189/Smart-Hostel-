import { Router } from 'express';
import {
  getMyProfile,
  getMyStay,
  getMyDocuments,
  getResidentDashboard,
  updateProfile,
} from '../controllers/residentsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.get('/me', getMyProfile);
router.put('/me', updateProfile);
router.get('/dashboard', getResidentDashboard);
router.get('/stay', getMyStay);
router.get('/my-stay', getMyStay);
router.get('/documents', getMyDocuments);

export default router;
