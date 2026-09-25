import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth';
import { Resident } from '../models/Resident';
import { Bed } from '../models/Bed';
import { Room } from '../models/Room';
import { Payment } from '../models/Payment';
import { Complaint } from '../models/Complaint';
import { Visitor } from '../models/Visitor';
import { OutingRequest } from '../models/OutingRequest';
import { User } from '../models/User';
import { Staff } from '../models/Staff';
import { Notice } from '../models/Notice';
import { MealMenu } from '../models/MealMenu';
import { MealFeedback } from '../models/MealFeedback';
import { MealOptOut } from '../models/MealOptOut';
import { EmergencyAlert } from '../models/EmergencyAlert';
import { HostelSettings } from '../models/HostelSettings';
import { GatePass } from '../models/GatePass';
import { VisitorPass } from '../models/VisitorPass';
import { createNotification } from '../services/notification';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    const [
      totalResidents,
      occupiedBeds,
      availableBeds,
      maintenanceBeds,
      pendingPayments,
      overduePayments,
      openComplaints,
      todaysVisitors,
      todaysOutings,
      recentAlerts,
    ] = await Promise.all([
      Resident.countDocuments({ status: 'ACTIVE' }),
      Bed.countDocuments({ status: 'OCCUPIED' }),
      Bed.countDocuments({ status: 'AVAILABLE' }),
      Bed.countDocuments({ status: 'MAINTENANCE' }),
      Payment.countDocuments({ status: 'PENDING' }),
      Payment.countDocuments({ status: 'OVERDUE' }),
      Complaint.countDocuments({ status: { $in: ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS'] } }),
      Visitor.countDocuments({ visitDate: todayStr }),
      OutingRequest.countDocuments({ leavingDate: todayStr }),
      EmergencyAlert.find().sort({ createdAt: -1 }).limit(5),
    ]);

    const totalBeds = occupiedBeds + availableBeds + maintenanceBeds;
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalResidents,
        occupiedBeds,
        availableBeds,
        maintenanceBeds,
        totalBeds,
        occupancyRate,
        pendingPayments,
        overduePayments,
        openComplaints,
        todaysVisitors,
        todaysOutings,
        recentAlerts,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Resident Management
export const getAdminResidents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, status, floor } = req.query;
    const filter: any = {};

    if (status) filter.status = status;
    if (floor) filter.floorNumber = Number(floor);
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { roomNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const residents = await Resident.find(filter).sort({ roomNumber: 1, bedCode: 1 });
    res.json({ success: true, data: residents });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAdminResident = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      phone,
      email,
      roomNumber,
      bedCode,
      monthlyRent,
      securityDeposit,
      workOrCollege,
      emergencyContactName,
      emergencyContactRelation,
      emergencyContactPhone,
    } = req.body;

    // Check user uniqueness
    const existing = await User.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      res.status(400).json({ success: false, message: 'User with this email or phone already exists.' });
      return;
    }

    // Default password: Welcome@123
    const passwordHash = await bcrypt.hash('Welcome@123', 10);
    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      passwordHash,
      role: 'RESIDENT',
      isActive: true,
    });

    const room = await Room.findOne({ roomNumber });
    const bed = await Bed.findOne({ roomNumber, bedCode });

    const resident = await Resident.create({
      user: user._id,
      name,
      phone,
      email,
      room: room?._id,
      roomNumber,
      bed: bed?._id,
      bedCode,
      floorNumber: room?.floorNumber || 2,
      wing: room?.wing || 'Wing A',
      monthlyRent: Number(monthlyRent) || 8000,
      securityDeposit: Number(securityDeposit) || 10000,
      workOrCollege,
      emergencyContact: {
        name: emergencyContactName || 'Parent',
        relation: emergencyContactRelation || 'Guardian',
        phone: emergencyContactPhone || phone,
      },
      status: 'ACTIVE',
    });

    if (bed) {
      bed.status = 'OCCUPIED';
      bed.currentResident = resident._id as any;
      await bed.save();
    }

    res.status(201).json({ success: true, message: 'Resident registered successfully', data: resident });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Rooms Management
export const getAdminRooms = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rooms = await Room.find().sort({ roomNumber: 1 });
    const beds = await Bed.find().populate('currentResident', 'name phone status');

    const bedMap: Record<string, any[]> = {};
    beds.forEach((b) => {
      if (!bedMap[b.roomNumber]) bedMap[b.roomNumber] = [];
      bedMap[b.roomNumber].push(b);
    });

    const roomsWithBeds = rooms.map((r) => ({
      ...r.toObject(),
      beds: bedMap[r.roomNumber] || [],
    }));

    res.json({ success: true, data: roomsWithBeds });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Complaints Management
export const getAdminComplaints = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, category, priority } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    const complaints = await Complaint.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: complaints });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateComplaintStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, note, staffName } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      res.status(404).json({ success: false, message: 'Complaint not found' });
      return;
    }

    complaint.status = status;
    if (staffName) complaint.assignedStaffName = staffName;
    if (status === 'RESOLVED') complaint.resolvedAt = new Date();

    complaint.timeline.push({
      status,
      note: note || `Status updated to ${status} by admin/warden.`,
      updatedBy: req.user?.name || 'Admin',
      timestamp: new Date(),
    });

    await complaint.save();

    // Notify resident
    const resident = await Resident.findById(complaint.resident);
    if (resident) {
      await createNotification({
        recipientId: resident.user,
        title: `Complaint Updated: ${complaint.title}`,
        message: `Ticket #${complaint._id.toString().slice(-6).toUpperCase()} status changed to ${status}. ${note || ''}`,
        type: 'COMPLAINT_UPDATE',
        data: { complaintId: complaint._id },
      });
    }

    res.json({ success: true, message: `Ticket status updated to ${status}`, data: complaint });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Outings Approval
export const getAdminOutings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const outings = await OutingRequest.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: outings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveOuting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const outing = await OutingRequest.findById(id);
    if (!outing) {
      res.status(404).json({ success: false, message: 'Outing request not found' });
      return;
    }

    const gatePassCode = `GP-${Date.now().toString().slice(-6)}-${outing.roomNumber}`;
    const qrPayload = JSON.stringify({
      passCode: gatePassCode,
      residentId: outing.resident.toString(),
      residentName: outing.residentName,
      roomNumber: outing.roomNumber,
      destination: outing.destination,
      validFrom: `${outing.leavingDate} ${outing.leavingTime}`,
      validTo: `${outing.expectedReturnDate} ${outing.expectedReturnTime}`,
      type: 'OUTING_GATE_PASS',
      approvedBy: req.user?.name || 'Mrs. Shanti Reddy (Warden)',
    });

    outing.status = 'APPROVED';
    outing.approvedBy = req.user?._id;
    outing.approvedByName = req.user?.name || 'Mrs. Shanti Reddy';
    outing.approvedAt = new Date();
    outing.gatePassCode = gatePassCode;
    outing.qrPayload = qrPayload;
    await outing.save();

    await GatePass.create({
      outingRequest: outing._id,
      resident: outing.resident,
      passCode: gatePassCode,
      passType: 'OUTING',
      validFrom: new Date(),
      validTo: new Date(`${outing.expectedReturnDate}T${outing.expectedReturnTime}:00`),
      status: 'ACTIVE',
    });

    const resident = await Resident.findById(outing.resident);
    if (resident) {
      await createNotification({
        recipientId: resident.user,
        title: 'Outing Pass Approved',
        message: `Your outing request to ${outing.destination} has been approved by Warden. Digital pass generated.`,
        type: 'OUTING_APPROVED',
        data: { outingId: outing._id, gatePassCode },
      });
    }

    res.json({ success: true, message: 'Outing approved and gate pass issued', data: outing });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectOuting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const outing = await OutingRequest.findById(id);
    if (!outing) {
      res.status(404).json({ success: false, message: 'Outing request not found' });
      return;
    }

    outing.status = 'REJECTED';
    outing.rejectionReason = reason || 'Outing hours or hostel policy constraint.';
    await outing.save();

    const resident = await Resident.findById(outing.resident);
    if (resident) {
      await createNotification({
        recipientId: resident.user,
        title: 'Outing Request Rejected',
        message: `Your outing request to ${outing.destination} was not approved: ${outing.rejectionReason}`,
        type: 'OUTING_REJECTED',
        data: { outingId: outing._id },
      });
    }

    res.json({ success: true, message: 'Outing rejected', data: outing });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Visitors Approval
export const getAdminVisitors = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const visitors = await Visitor.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: visitors });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveVisitor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const visitor = await Visitor.findById(id);
    if (!visitor) {
      res.status(404).json({ success: false, message: 'Visitor not found' });
      return;
    }

    const passCode = `VP-${Date.now().toString().slice(-6)}-${visitor.roomNumber}`;
    const qrPayload = JSON.stringify({
      passCode,
      visitorName: visitor.visitorName,
      relationship: visitor.relationship,
      residentName: visitor.residentName,
      roomNumber: visitor.roomNumber,
      visitDate: visitor.visitDate,
      type: 'HOSTEL_VISITOR_PASS',
      approvedBy: req.user?.name || 'Security Desk',
    });

    visitor.status = 'APPROVED';
    visitor.approvedBy = req.user?._id;
    visitor.approvedByName = req.user?.name || 'Security Desk';
    visitor.visitorPassCode = passCode;
    visitor.qrPayload = qrPayload;
    await visitor.save();

    await VisitorPass.create({
      visitor: visitor._id,
      passCode,
      validDate: visitor.visitDate,
      status: 'ACTIVE',
    });

    const resident = await Resident.findById(visitor.resident);
    if (resident) {
      await createNotification({
        recipientId: resident.user,
        title: 'Visitor Pass Approved',
        message: `Visitor entry for ${visitor.visitorName} approved for ${visitor.visitDate}.`,
        type: 'VISITOR_APPROVED',
        data: { visitorId: visitor._id, passCode },
      });
    }

    res.json({ success: true, message: 'Visitor entry approved', data: visitor });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectVisitor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const visitor = await Visitor.findById(id);
    if (!visitor) {
      res.status(404).json({ success: false, message: 'Visitor not found' });
      return;
    }

    visitor.status = 'REJECTED';
    await visitor.save();

    res.json({ success: true, message: 'Visitor rejected', data: visitor });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin Payments
export const getAdminPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, month, search } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (month) filter.month = month;
    if (search) {
      filter.$or = [
        { residentName: { $regex: search, $options: 'i' } },
        { roomNumber: { $regex: search, $options: 'i' } },
        { receiptNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const payments = await Payment.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: payments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin Notices
export const createAdminNotice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, category, priority, audienceScope, targetFloor, targetRoom } = req.body;
    if (!title || !content) {
      res.status(400).json({ success: false, message: 'Title and content are required' });
      return;
    }

    const notice = await Notice.create({
      title,
      content,
      category: category || 'All',
      priority: priority || 'NORMAL',
      audienceScope: audienceScope || 'ALL',
      targetFloor: targetFloor ? Number(targetFloor) : undefined,
      targetRoom,
      publishedBy: req.user?._id,
      publishedByName: req.user?.name || 'Hostel Administration',
    });

    res.status(201).json({ success: true, message: 'Notice broadcasted successfully', data: notice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Staff Management
export const getAdminStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staff = await Staff.find().sort({ department: 1, name: 1 });
    res.json({ success: true, data: staff });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reports
export const getAdminReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [payments, complaints, residents] = await Promise.all([
      Payment.find(),
      Complaint.find(),
      Resident.find(),
    ]);

    const totalRevenue = payments
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingRevenue = payments
      .filter((p) => p.status === 'PENDING' || p.status === 'OVERDUE')
      .reduce((sum, p) => sum + p.amount, 0);

    const complaintsByCategory: Record<string, number> = {};
    complaints.forEach((c) => {
      complaintsByCategory[c.category] = (complaintsByCategory[c.category] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        financials: {
          totalCollected: totalRevenue,
          pendingAmount: pendingRevenue,
          collectionRate: totalRevenue + pendingRevenue > 0
            ? Math.round((totalRevenue / (totalRevenue + pendingRevenue)) * 100)
            : 100,
        },
        complaintsBreakdown: complaintsByCategory,
        totalComplaintsCount: complaints.length,
        resolvedComplaintsCount: complaints.filter((c) => ['RESOLVED', 'CLOSED'].includes(c.status)).length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
