import { Router } from 'express';
import { login, devLogin, getMe, updatePushToken } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { env } from '../config/env';

const router = Router();

router.post('/login', login);
if (env.NODE_ENV !== 'production') {
  router.post('/dev-login', devLogin);
}
router.get('/me', authenticate, getMe);
router.post('/push-token', authenticate, updatePushToken);

export default router;
