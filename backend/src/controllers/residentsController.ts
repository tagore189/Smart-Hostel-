import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Resident } from '../models/Resident';
import { Room } from '../models/Room';
import { Bed } from '../models/Bed';
import { ResidentDocument } from '../models/Document';
import { Payment } from '../models/Payment';

export const getMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const resident = await Resident.findOne({ user: req.user._id });
    if (!resident) {
      res.status(404).json({ success: false, message: 'Resident record not found' });
      return;
    }

    res.json({
      success: true,
      data: resident,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyStay = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const resident = await Resident.findOne({ user: req.user._id });
    if (!resident) {
      res.status(404).json({ success: false, message: 'Resident record not found' });
      return;
    }

    // Room info
    const room = resident.room ? await Room.findById(resident.room) : await Room.findOne({ roomNumber: resident.roomNumber });

    // Bed info
    const bed = resident.bed ? await Bed.findById(resident.bed) : null;

    // Roommates (all other beds in same room with an active resident)
    const otherBeds = await Bed.find({
      roomNumber: resident.roomNumber,
      bedCode: { $ne: resident.bedCode },
    }).populate('currentResident');

    const roommates = otherBeds
      .filter((b) => b.status === 'OCCUPIED' && b.currentResident)
      .map((b: any) => ({
        bedCode: b.bedCode,
        name: b.currentResident.name,
        phone: b.currentResident.phone,
        workOrCollege: b.currentResident.workOrCollege,
        joiningDate: b.currentResident.joiningDate,
      }));

    // Documents
    const documents = await ResidentDocument.find({ resident: resident._id });

    // Payment history (latest 5)
    const payments = await Payment.find({ resident: resident._id }).sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      data: {
        resident,
        room: room || {
          roomNumber: resident.roomNumber,
          floorNumber: resident.floorNumber,
          wing: resident.wing,
          type: 'Double',
          wifiSsid: 'Hostel_5G_Secured',
          wifiPassword: 'SLG@204Safe',
          facilities: ['High-speed 5G Wi-Fi', 'Attached Bathroom', 'Air Conditioning', 'Study Desk', 'Individual Wardrobe'],
        },
        bed: bed || {
          bedCode: resident.bedCode,
          monthlyRent: resident.monthlyRent,
        },
        roommates,
        documents,
        payments,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.resident) {
      res.status(404).json({ success: false, message: 'Resident profile not found' });
      return;
    }
    const documents = await ResidentDocument.find({ resident: req.resident._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: documents });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getResidentDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resident = req.resident || (req.user ? await Resident.findOne({ user: req.user._id }) : null);
    if (!resident) {
      res.status(404).json({ success: false, message: 'Resident profile not found' });
      return;
    }

    const { Notice } = await import('../models/Notice');
    const { Complaint } = await import('../models/Complaint');

    const [recentNotices, openComplaintsCount, recentPayments] = await Promise.all([
      Notice.find().sort({ createdAt: -1 }).limit(3),
      Complaint.countDocuments({ resident: resident._id, status: { $ne: 'RESOLVED' } }),
      Payment.find({ resident: resident._id }).sort({ createdAt: -1 }).limit(3),
    ]);

    res.json({
      success: true,
      data: {
        resident,
        recentNotices,
        openComplaintsCount,
        recentPayments,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const resident = await Resident.findOne({ user: req.user._id });
    if (!resident) {
      res.status(404).json({ success: false, message: 'Resident record not found' });
      return;
    }

    // Only allow safe personal fields to be modified by residents
    // Sensitive fields (room, bed, floor, monthlyRent, status) are strictly rejected
    const { emergencyContact, workOrCollege, bloodGroup } = req.body;

    if (workOrCollege !== undefined) resident.workOrCollege = workOrCollege;
    if (bloodGroup !== undefined) resident.bloodGroup = bloodGroup;
    if (emergencyContact) {
      resident.emergencyContact = {
        name: emergencyContact.name || resident.emergencyContact?.name || '',
        relation: emergencyContact.relation || resident.emergencyContact?.relation || '',
        phone: emergencyContact.phone || resident.emergencyContact?.phone || '',
      };
    }

    await resident.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: resident,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};


