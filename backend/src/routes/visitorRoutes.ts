import { Router } from 'express';
import { getMyVisitors, registerVisitor, getVisitorPass } from '../controllers/visitorsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.get('/', getMyVisitors);
router.post('/register', registerVisitor);
router.get('/pass/:id', getVisitorPass);

export default router;
