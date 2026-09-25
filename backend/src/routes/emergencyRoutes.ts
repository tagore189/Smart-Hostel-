import { Router } from 'express';
import {
  getEmergencyContacts,
  sendSilentWelfareAlert,
  logSosAction,
} from '../controllers/emergencyController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.get('/contacts', getEmergencyContacts);
router.post('/silent-welfare-alert', sendSilentWelfareAlert);
router.post('/sos-action', logSosAction);

export default router;
