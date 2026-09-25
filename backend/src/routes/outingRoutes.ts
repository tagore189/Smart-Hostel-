import { Router } from 'express';
import { getMyOutings, createOutingRequest, getActiveGatePass } from '../controllers/outingsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.get('/', getMyOutings);
router.post('/request', createOutingRequest);
router.get('/active-pass', getActiveGatePass);

export default router;
