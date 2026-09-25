import { Router } from 'express';
import { login, devLogin, getMe, updatePushToken } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/dev-login', devLogin);
router.get('/me', authenticate, getMe);
router.post('/push-token', authenticate, updatePushToken);

export default router;
