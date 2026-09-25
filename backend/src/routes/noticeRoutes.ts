import { Router } from 'express';
import { getNotices, markNoticeAsRead } from '../controllers/noticesController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.get('/', getNotices);
router.post('/:id/read', markNoticeAsRead);

export default router;
