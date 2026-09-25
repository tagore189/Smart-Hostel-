import { Router } from 'express';
import {
  getTodayMenu,
  getWeeklyMenu,
  submitMealFeedback,
  toggleMealOptOut,
  getMyOptOuts,
} from '../controllers/messController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.get('/today', getTodayMenu);
router.get('/weekly', getWeeklyMenu);
router.get('/menu', getWeeklyMenu); // Alias to avoid legacy breakage
router.post('/feedback', submitMealFeedback);
router.post('/opt-out', toggleMealOptOut);
router.get('/opt-out', getMyOptOuts);

export default router;
