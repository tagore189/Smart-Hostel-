import { Router } from 'express';
import {
  getMyComplaints,
  getComplaintById,
  createComplaint,
  uploadComplaintAttachment,
  addComplaintComment,
  submitFeedback,
} from '../controllers/complaintsController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticate);
router.get('/', getMyComplaints);
router.post('/', createComplaint);
router.post('/upload', upload.single('file'), uploadComplaintAttachment);
router.get('/:id', getComplaintById);
router.post('/:id/comments', addComplaintComment);
router.post('/:id/feedback', submitFeedback);

export default router;
