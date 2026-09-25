import { Router } from 'express';
import {
  getMyComplaints,
  getComplaintById,
  createComplaint,
  addComplaintComment,
  submitFeedback,
} from '../controllers/complaintsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.get('/', getMyComplaints);
router.post('/', createComplaint);
router.get('/:id', getComplaintById);
router.post('/:id/comments', addComplaintComment);
router.post('/:id/feedback', submitFeedback);

export default router;
