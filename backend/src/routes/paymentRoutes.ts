import { Router } from 'express';
import {
  getPaymentOverview,
  getMyPayments,
  processPayment,
  getReceipt,
  submitPaymentReference,
} from '../controllers/paymentsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.get('/overview', getPaymentOverview);
router.get('/history', getMyPayments);
router.post('/pay', processPayment);
router.post('/submit-reference', submitPaymentReference);
router.get('/receipt/:id', getReceipt);

export default router;
