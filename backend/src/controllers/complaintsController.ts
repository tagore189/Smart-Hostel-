import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Complaint, ComplaintCategory, ComplaintPriority } from '../models/Complaint';
import { ComplaintComment } from '../models/ComplaintComment';
import { createNotification } from '../services/notification';
import { emitToAdmins } from '../services/socket';
import { getFileType } from '../middleware/upload';

export const getMyComplaints = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resident = req.resident;
    if (!resident) {
      res.status(404).json({ success: false, message: 'Resident profile not found' });
      return;
    }

    const complaints = await Complaint.find({ resident: resident._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: complaints });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getComplaintById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findById(id);
    if (!complaint) {
      res.status(404).json({ success: false, message: 'Complaint not found' });
      return;
    }

    // Security ownership check: Residents can ONLY view their own complaints
    const isAdmin = ['ADMIN', 'WARDEN', 'SUPER_ADMIN'].includes(req.user?.role || '');
    if (!isAdmin && req.resident && !complaint.resident.equals(req.resident._id)) {
      res.status(403).json({ success: false, message: 'Access denied: You can only view your own complaints.' });
      return;
    }

    const comments = await ComplaintComment.find({ complaint: complaint._id }).sort({ createdAt: 1 });

    res.json({
      success: true,
      data: {
        complaint,
        comments,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createComplaint = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resident = req.resident;
    if (!resident || !req.user) {
      res.status(404).json({ success: false, message: 'Resident profile not found' });
      return;
    }

    const { category, title, description, priority, photoUrl, attachments } = req.body;
    if (!category || !title || !description) {
      res.status(400).json({ success: false, message: 'Category, title, and description are required.' });
      return;
    }

    const complaint = await Complaint.create({
      resident: resident._id,
      residentName: resident.name,
      roomNumber: resident.roomNumber,
      category: category as ComplaintCategory,
      title,
      description,
      priority: (priority || 'MEDIUM') as ComplaintPriority,
      photoUrl: photoUrl || (attachments && attachments[0]?.url) || undefined,
      attachments: Array.isArray(attachments) ? attachments : [],
      status: 'NEW',
      timeline: [
        {
          status: 'NEW',
          note: 'Complaint submitted by resident.',
          updatedBy: resident.name,
          timestamp: new Date(),
        },
      ],
    });

    // Notify admins & wardens
    emitToAdmins('complaint:new', {
      id: complaint._id,
      residentName: resident.name,
      roomNumber: resident.roomNumber,
      title: complaint.title,
      category: complaint.category,
      priority: complaint.priority,
    });

    // Confirm to resident
    await createNotification({
      recipientId: req.user._id,
      title: 'Ticket Raised Successfully',
      message: `Your maintenance ticket #${complaint._id.toString().slice(-6).toUpperCase()} (${category}) has been logged.`,
      type: 'COMPLAINT_UPDATE',
      data: { complaintId: complaint._id },
    });

    res.status(201).json({
      success: true,
      message: 'Maintenance ticket created successfully',
      data: complaint,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadComplaintAttachment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file provided' });
      return;
    }

    const fileType = getFileType(req.file.mimetype);
    const fileUrl = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        url: fileUrl,
        fileType,
        originalName: req.file.originalname,
        size: req.file.size,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addComplaintComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    if (!message || !req.user) {
      res.status(400).json({ success: false, message: 'Message is required' });
      return;
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      res.status(404).json({ success: false, message: 'Complaint not found' });
      return;
    }

    // Security check: Resident cannot comment on others' complaints
    const isAdmin = ['ADMIN', 'WARDEN', 'SUPER_ADMIN'].includes(req.user.role);
    if (!isAdmin && req.resident && !complaint.resident.equals(req.resident._id)) {
      res.status(403).json({ success: false, message: 'Access denied: You cannot comment on this complaint.' });
      return;
    }

    const comment = await ComplaintComment.create({
      complaint: complaint._id,
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      message,
    });

    res.status(201).json({ success: true, data: comment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      res.status(404).json({ success: false, message: 'Complaint not found' });
      return;
    }

    // Ownership check
    if (req.resident && !complaint.resident.equals(req.resident._id)) {
      res.status(403).json({ success: false, message: 'Access denied: You cannot rate this complaint.' });
      return;
    }

    complaint.feedbackRating = Number(rating);
    complaint.feedbackComment = comment;
    await complaint.save();

    res.json({ success: true, message: 'Thank you for your feedback!' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
