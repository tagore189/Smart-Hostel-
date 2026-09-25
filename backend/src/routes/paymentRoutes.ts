import { Router } from 'express';
import { getPaymentOverview, getMyPayments, processPayment, getReceipt } from '../controllers/paymentsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.get('/overview', getPaymentOverview);
router.get('/', getMyPayments);
router.post('/pay', processPayment);
router.get('/receipt/:id', getReceipt);

export default router;
