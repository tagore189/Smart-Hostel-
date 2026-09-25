import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { AuthRequest } from '../middleware/auth';
import { Resident } from '../models/Resident';
import { Bed } from '../models/Bed';
import { Room } from '../models/Room';
import { Floor } from '../models/Floor';
import { Payment } from '../models/Payment';
import { Receipt } from '../models/Receipt';
import { Complaint } from '../models/Complaint';
import { User } from '../models/User';
import { Staff } from '../models/Staff';
import { Notice } from '../models/Notice';
import { MealMenu } from '../models/MealMenu';
import { MealFeedback } from '../models/MealFeedback';
import { MealOptOut } from '../models/MealOptOut';
import { EmergencyAlert } from '../models/EmergencyAlert';
import { createNotification } from '../services/notification';

// ─── 1. Admin Dashboard Stats ─────────────────────────────────────────────
export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalResidents,
      occupiedBeds,
      availableBeds,
      maintenanceBeds,
      feesPaid,
      feesPending,
      openComplaints,
      emergencyAlertsCount,
      recentAlerts,
    ] = await Promise.all([
      Resident.countDocuments({ status: 'ACTIVE' }),
      Bed.countDocuments({ status: 'OCCUPIED' }),
      Bed.countDocuments({ status: 'AVAILABLE' }),
      Bed.countDocuments({ status: 'MAINTENANCE' }),
      Payment.countDocuments({ status: 'PAID' }),
      Payment.countDocuments({ status: { $in: ['PENDING', 'OVERDUE'] } }),
      Complaint.countDocuments({ status: { $in: ['NEW', 'SUBMITTED', 'ASSIGNED', 'IN_PROGRESS'] } }),
      EmergencyAlert.countDocuments({ status: { $in: ['TRIGGERED', 'ACKNOWLEDGED', 'IN_PROGRESS'] } }),
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
        vacantBeds: availableBeds,
        maintenanceBeds,
        totalBeds,
        occupancyRate,
        feesPaid,
        feesPending,
        pendingPayments: feesPending,
        openComplaints,
        emergencyAlerts: emergencyAlertsCount,
        recentAlerts,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 2. Resident Management ───────────────────────────────────────────────
export const getAdminResidents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, status, floor } = req.query;
    const filter: any = {};

    if (status === 'INACTIVE') filter.status = { $in: ['PENDING', 'VACATED'] };
    else if (status && status !== 'ALL') filter.status = status;
    if (floor && floor !== 'ALL') filter.floorNumber = Number(floor);
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { roomNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const residents = await Resident.find(filter).sort({ roomNumber: 1, bedCode: 1 });

    // Populate current payment status for each resident
    const currentMonth = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    const residentIds = residents.map((r) => r._id);
    const payments = await Payment.find({ resident: { $in: residentIds } }).sort({ createdAt: -1 });

    const paymentMap: Record<string, string> = {};
    payments.forEach((p) => {
      const resId = p.resident.toString();
      if (!paymentMap[resId]) {
        paymentMap[resId] = p.status;
      }
    });

    const enriched = residents.map((r) => ({
      ...r.toObject(),
      paymentStatus: paymentMap[r._id.toString()] || 'PENDING',
    }));

    res.json({ success: true, data: enriched });
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
      floorNumber,
      monthlyRent,
      securityDeposit,
      workOrCollege,
      emergencyContactName,
      emergencyContactRelation,
      emergencyContactPhone,
    } = req.body;

    if (!name?.trim() || !phone?.trim() || !email?.trim() || !roomNumber?.trim()) {
      res.status(400).json({ success: false, message: 'Name, phone, email, and room are required.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = phone.trim();
    const normalizedRoom = roomNumber.trim();
    const normalizedBed = (bedCode || 'A').toUpperCase().trim();
    const existing = await User.findOne({ $or: [{ email: normalizedEmail }, { phone: normalizedPhone }] });
    if (existing) {
      res.status(400).json({ success: false, message: 'User with this email or phone already exists.' });
      return;
    }

    const room = await Room.findOne({ roomNumber: normalizedRoom, isActive: true });
    if (!room) {
      res.status(400).json({ success: false, message: 'Select an existing active room.' });
      return;
    }
    const bed = await Bed.findOne({ room: room._id, bedCode: normalizedBed });
    if (!bed || bed.status !== 'AVAILABLE') {
      res.status(409).json({ success: false, message: 'The selected bed is unavailable.' });
      return;
    }

    const temporaryPassword = randomBytes(12).toString('base64url');
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      passwordHash,
      role: 'RESIDENT',
      isActive: true,
    });

    const floor = room.floorNumber;

    const resident = await Resident.create({
      user: user._id,
      name: name.trim(),
      phone: phone.trim(),
      email: normalizedEmail,
      roomNumber: normalizedRoom,
      bedCode: normalizedBed,
      floorNumber: floor,
      wing: room.wing,
      room: room._id,
      bed: bed._id,
      monthlyRent: Number(monthlyRent) || 8000,
      securityDeposit: Number(securityDeposit) || 10000,
      workOrCollege,
      emergencyContact: {
        name: emergencyContactName || '',
        relation: emergencyContactRelation || '',
        phone: emergencyContactPhone || '',
      },
      status: 'ACTIVE',
      joiningDate: new Date(),
    });

    bed.status = 'OCCUPIED';
    bed.currentResident = resident._id;
    await bed.save();

    res.status(201).json({
      success: true,
      message: `Resident ${name.trim()} registered successfully. Share the temporary password securely and ask the resident to change it.`,
      data: { resident, temporaryPassword },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 3. Floors & Rooms Management (Section 19) ────────────────────────────
export const getAdminFloors = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const allRooms = await Room.find().sort({ floorNumber: 1, roomNumber: 1 });
    const allBeds = await Bed.find();
    const allResidents = await Resident.find({ status: 'ACTIVE' });

    // Group by floorNumber
    const floorNumbers = Array.from(new Set(allRooms.map((r) => r.floorNumber))).sort((a, b) => a - b);

    // Compute floor summaries
    const floorsData = floorNumbers.map((fl) => {
      const roomsOnFloor = allRooms.filter((r) => r.floorNumber === fl);
      const roomNumbers = roomsOnFloor.map((r) => r.roomNumber);
      const bedsOnFloor = allBeds.filter((b) => roomNumbers.includes(b.roomNumber));
      const residentsOnFloor = allResidents.filter((res) => res.floorNumber === fl);

      const occupiedCount = bedsOnFloor.filter((b) => b.status === 'OCCUPIED').length;
      const vacantCount = bedsOnFloor.filter((b) => b.status === 'AVAILABLE').length;

      const roomSummaries = roomsOnFloor.map((r) => {
        const roomBeds = bedsOnFloor.filter((b) => b.roomNumber === r.roomNumber);
        const occInRoom = roomBeds.filter((b) => b.status === 'OCCUPIED').length;
        return {
          _id: r._id,
          roomNumber: r.roomNumber,
          wing: r.wing,
          sharingType: r.sharingType || `${r.totalBeds}-Share`,
          totalBeds: r.totalBeds,
          occupiedBeds: occInRoom,
          ratio: `${occInRoom}/${r.totalBeds}`,
          hasAc: r.hasAc,
          monthlyRent: r.monthlyRent ?? r.rentAmount,
        };
      });

      return {
        floorNumber: fl,
        name: `${fl === 1 ? '1st' : fl === 2 ? '2nd' : fl === 3 ? '3rd' : `${fl}th`} Floor`,
        totalRooms: roomsOnFloor.length,
        totalBeds: bedsOnFloor.length,
        occupiedBeds: occupiedCount,
        vacantBeds: vacantCount,
        totalResidents: residentsOnFloor.length,
        rooms: roomSummaries,
      };
    });

    res.json({ success: true, data: floorsData });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAdminRooms = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { floor } = req.query;
    const filter: any = {};
    if (floor && floor !== 'ALL') filter.floorNumber = Number(floor);

    const rooms = await Room.find(filter).sort({ floorNumber: 1, roomNumber: 1 });
    const beds = await Bed.find().populate('currentResident', 'name phone status monthlyRent');

    // Get current payments to enrich each resident's payment status (PAID / PENDING)
    const payments = await Payment.find().sort({ createdAt: -1 });
    const paymentMap: Record<string, string> = {};
    payments.forEach((p) => {
      const resId = p.resident?.toString();
      if (resId && !paymentMap[resId]) {
        paymentMap[resId] = p.status;
      }
    });

    const bedMap: Record<string, any[]> = {};
    beds.forEach((b) => {
      if (!bedMap[b.roomNumber]) bedMap[b.roomNumber] = [];
      const residentObj = b.currentResident as any;
      const resId = residentObj?._id?.toString();

      bedMap[b.roomNumber].push({
        ...b.toObject(),
        paymentStatus: resId ? paymentMap[resId] || 'PENDING' : 'N/A',
      });
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

export const assignBedResident = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { roomNumber, bedCode, residentId } = req.body;
    if (!roomNumber || !bedCode || !residentId) {
      res.status(400).json({ success: false, message: 'roomNumber, bedCode, and residentId are required.' });
      return;
    }

    const resident = await Resident.findById(residentId);
    if (!resident) {
      res.status(404).json({ success: false, message: 'Resident not found' });
      return;
    }

    const room = await Room.findOne({ roomNumber, isActive: true });
    const targetBed = room ? await Bed.findOne({ room: room._id, bedCode }) : null;
    if (!room || !targetBed) {
      res.status(404).json({ success: false, message: 'Active room and bed were not found.' });
      return;
    }
    if (targetBed.status !== 'AVAILABLE' && !targetBed.currentResident?.equals(resident._id)) {
      res.status(409).json({ success: false, message: 'That bed is already occupied or unavailable.' });
      return;
    }

    const previousBed = await Bed.findOne({ currentResident: resident._id });
    if (previousBed && !previousBed._id.equals(targetBed._id)) {
      previousBed.status = 'AVAILABLE';
      previousBed.currentResident = undefined;
      await previousBed.save();
    }

    targetBed.status = 'OCCUPIED';
    targetBed.currentResident = resident._id;
    await targetBed.save();

    // Update resident assignment
    resident.roomNumber = roomNumber;
    resident.bedCode = bedCode;
    resident.floorNumber = room.floorNumber;
    resident.room = room._id;
    resident.bed = targetBed._id;
    resident.status = 'ACTIVE';
    resident.checkedIn = true;
    await resident.save();
    await User.updateOne({ _id: resident.user }, { isActive: true });

    res.json({
      success: true,
      message: `Bed ${bedCode} in Room ${roomNumber} assigned to ${resident.name}.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const vacateBedResident = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { roomNumber, bedCode } = req.body;
    const bed = await Bed.findOne({ roomNumber, bedCode });
    if (!bed) {
      res.status(404).json({ success: false, message: 'Bed not found' });
      return;
    }

    if (bed.currentResident) {
      const resident = await Resident.findById(bed.currentResident);
      if (resident) {
        resident.status = 'VACATED';
        resident.checkedIn = false;
        resident.bed = undefined;
        await resident.save();
        await User.updateOne({ _id: resident.user }, { isActive: false });
      }
    }

    bed.status = 'AVAILABLE';
    bed.currentResident = undefined;
    await bed.save();

    res.json({
      success: true,
      message: `Bed ${bedCode} in Room ${roomNumber} is now marked vacant.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 4. Payments Management (Section 20) ──────────────────────────────────
export const getAdminPaymentStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { month } = req.query;
    const currentMonth = (month as string) || new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });

    const activeResidents = await Resident.find({ status: 'ACTIVE' });
    const expectedFees = activeResidents.reduce((sum, r) => sum + (r.monthlyRent ?? 0), 0);

    const payments = await Payment.find();
    const paidPayments = payments.filter((p) => p.status === 'PAID');
    const collectedFees = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const pendingFees = Math.max(0, expectedFees - collectedFees);

    const paidCount = paidPayments.length;
    const pendingCount = Math.max(0, activeResidents.length - paidCount);

    res.json({
      success: true,
      data: {
        month: currentMonth,
        expectedFees,
        collectedFees,
        pendingFees,
        paidCount,
        pendingCount,
        totalResidents: activeResidents.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAdminPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, month, floor, search } = req.query;
    const filter: any = {};

    if (status && status !== 'ALL') filter.status = status;
    if (month && month !== 'ALL') filter.month = month;
    if (search) {
      filter.$or = [
        { residentName: { $regex: search, $options: 'i' } },
        { roomNumber: { $regex: search, $options: 'i' } },
        { receiptNumber: { $regex: search, $options: 'i' } },
        { transactionId: { $regex: search, $options: 'i' } },
      ];
    }

    let payments = await Payment.find(filter).sort({ createdAt: -1 });

    if (floor && floor !== 'ALL') {
      const floorNum = Number(floor);
      payments = payments.filter((p) => {
        const rNum = parseInt(p.roomNumber || '0', 10);
        return Math.floor(rNum / 100) === floorNum;
      });
    }

    res.json({ success: true, data: payments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const recordAdminPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      residentId,
      amount,
      month,
      paymentMethod,
      transactionId,
      notes,
    } = req.body;

    if (!residentId || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      res.status(400).json({ success: false, message: 'Resident and amount are required.' });
      return;
    }

    const resident = await Resident.findById(residentId);
    if (!resident) {
      res.status(404).json({ success: false, message: 'Resident not found' });
      return;
    }

    const payMonth = month || new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    const receiptNumber = `SLG-REC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${resident.roomNumber}-${randomBytes(3).toString('hex').toUpperCase()}`;
    const txnId = transactionId || `TXN-OFFLINE-${Date.now()}`;
    const method = paymentMethod === 'Bank Transfer' ? 'NETBANKING' : paymentMethod === 'Cash' ? 'CASH' : paymentMethod === 'UPI' ? 'UPI' : null;
    if (!method) {
      res.status(400).json({ success: false, message: 'Payment method must be Cash, UPI, or Bank Transfer.' });
      return;
    }

    // Create payment record marked as PAID
    const payment = await Payment.create({
      resident: resident._id,
      residentName: resident.name,
      roomNumber: resident.roomNumber,
      amount: Number(amount),
      type: 'RENT',
      status: 'PAID',
      method,
      transactionId: txnId,
      receiptNumber,
      dueDate: new Date(),
      paidAt: new Date(),
      month: payMonth,
      notes: notes || `Payment recorded by admin (${req.user?.name || 'Warden'})`,
    });

    // Create verified receipt
    const receipt = await Receipt.create({
      payment: payment._id,
      resident: resident._id,
      receiptNumber,
      amount: Number(amount),
      date: new Date(),
      method: payment.method,
    });

    // Notify resident
    await createNotification({
      recipientId: resident.user,
      title: 'Fee Payment Received',
      message: `Your payment of ₹${Number(amount).toLocaleString('en-IN')} for ${payMonth} has been recorded by the hostel office. Receipt: ${receiptNumber}`,
      type: 'PAYMENT_SUCCESS',
      data: { paymentId: payment._id, receiptNumber },
    });

    res.status(201).json({
      success: true,
      message: `Payment of ₹${amount} recorded for ${resident.name}. Receipt: ${receiptNumber}`,
      data: { payment, receipt },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyAdminPaymentReference = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payment = await Payment.findOne({ _id: req.params.id, status: 'PENDING' });
    if (!payment) {
      res.status(404).json({ success: false, message: 'Pending payment reference not found.' });
      return;
    }

    const receiptNumber = `SLG-REC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${payment.roomNumber}-${randomBytes(3).toString('hex').toUpperCase()}`;
    payment.status = 'PAID';
    payment.paidAt = new Date();
    payment.receiptNumber = receiptNumber;
    payment.notes = [payment.notes, `Verified by ${req.user?.name || 'hostel staff'}`].filter(Boolean).join(' | ');
    await payment.save();

    await Receipt.create({
      payment: payment._id,
      resident: payment.resident,
      receiptNumber,
      amount: payment.amount,
      date: payment.paidAt,
      method: payment.method,
    });

    const resident = await Resident.findById(payment.resident).select('user');
    if (resident?.user) {
      await createNotification({
        recipientId: resident.user,
        title: 'Payment Verified',
        message: `Your ${payment.month} payment was verified. Receipt: ${receiptNumber}.`,
        type: 'PAYMENT_SUCCESS',
        data: { paymentId: payment._id, receiptNumber },
      });
    }

    res.json({ success: true, message: 'Payment reference verified and receipt issued.', data: payment });
  } catch {
    res.status(500).json({ success: false, message: 'Unable to verify this payment reference.' });
  }
};

// ─── 5. Complaints Management (Section 22) ────────────────────────────────
export const getAdminComplaints = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, category, floor } = req.query;
    const filter: any = {};

    if (status && status !== 'ALL') {
      filter.status = status === 'NEW' ? { $in: ['NEW', 'SUBMITTED'] } : status;
    }
    if (category && category !== 'ALL') filter.category = category;

    let complaints = await Complaint.find(filter).sort({ createdAt: -1 });

    if (floor && floor !== 'ALL') {
      const fl = Number(floor);
      complaints = complaints.filter((c) => {
        const roomNum = parseInt(c.roomNumber || '0', 10);
        return Math.floor(roomNum / 100) === fl;
      });
    }

    res.json({ success: true, data: complaints });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateComplaintStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, note, staffName, adminResponse } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      res.status(404).json({ success: false, message: 'Complaint not found' });
      return;
    }

    complaint.status = status;
    if (staffName) complaint.assignedStaffName = staffName;
    if (adminResponse) complaint.adminResponse = adminResponse;
    if (status === 'RESOLVED') complaint.resolvedAt = new Date();

    complaint.timeline.push({
      status,
      note: note || adminResponse || `Status updated to ${status} by administration.`,
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
        message: `Ticket #${complaint._id.toString().slice(-6).toUpperCase()} status changed to ${status}. ${adminResponse || note || ''}`,
        type: 'COMPLAINT_UPDATE',
        data: { complaintId: complaint._id },
      });
    }

    res.json({ success: true, message: `Ticket status updated to ${status}`, data: complaint });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 6. Notices (Section 23) ──────────────────────────────────────────────
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

// ─── 7. Staff Management (Section 26) ─────────────────────────────────────
export const getAdminStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staff = await Staff.find().sort({ department: 1, name: 1 });
    res.json({ success: true, data: staff });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 8. Reports (Section 25) ──────────────────────────────────────────────
export const getAdminReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [payments, complaints, residents, beds, feedbacks] = await Promise.all([
      Payment.find(),
      Complaint.find(),
      Resident.find({ status: 'ACTIVE' }),
      Bed.find(),
      MealFeedback.find().sort({ createdAt: -1 }).limit(100),
    ]);

    // Financial calculations
    const totalCollected = payments
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const pendingRevenue = payments
      .filter((p) => p.status === 'PENDING' || p.status === 'OVERDUE')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    // Payment methods breakdown
    const paymentMethods: Record<string, number> = {};
    payments
      .filter((p) => p.status === 'PAID')
      .forEach((p) => {
        const m = p.method || 'Other';
        paymentMethods[m] = (paymentMethods[m] || 0) + (p.amount || 0);
      });

    // Complaints breakdown
    const complaintsByCategory: Record<string, number> = {};
    const complaintsByStatus: Record<string, number> = {};
    complaints.forEach((c) => {
      complaintsByCategory[c.category] = (complaintsByCategory[c.category] || 0) + 1;
      complaintsByStatus[c.status] = (complaintsByStatus[c.status] || 0) + 1;
    });

    // Floor-by-floor resident & bed occupancy
    const occupancyByFloor: Record<number, { residents: number; occupied: number; total: number }> = {};
    [1, 2, 3, 4].forEach((fl) => {
      const resOnFloor = residents.filter((r) => r.floorNumber === fl).length;
      const bedsOnFloor = beds.filter((b) => {
        const rNum = parseInt(b.roomNumber || '0', 10);
        return Math.floor(rNum / 100) === fl;
      });
      const occBeds = bedsOnFloor.filter((b) => b.status === 'OCCUPIED').length;
      occupancyByFloor[fl] = {
        residents: resOnFloor,
        occupied: occBeds,
        total: bedsOnFloor.length,
      };
    });

    // Food feedback average
    const avgRating =
      feedbacks.length > 0
        ? Number((feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1))
        : 0;

    res.json({
      success: true,
      data: {
        financials: {
          totalCollected,
          pendingAmount: pendingRevenue,
          collectionRate:
            totalCollected + pendingRevenue > 0
              ? Math.round((totalCollected / (totalCollected + pendingRevenue)) * 100)
              : 100,
          paymentMethods,
        },
        occupancy: {
          totalResidents: residents.length,
          totalBeds: beds.length,
          occupiedBeds: beds.filter((b) => b.status === 'OCCUPIED').length,
          availableBeds: beds.filter((b) => b.status === 'AVAILABLE').length,
          occupancyByFloor,
        },
        complaints: {
          total: complaints.length,
          byCategory: complaintsByCategory,
          byStatus: complaintsByStatus,
          resolved: complaints.filter((c) => ['RESOLVED', 'CLOSED'].includes(c.status)).length,
          pending: complaints.filter((c) => ['NEW', 'SUBMITTED', 'ASSIGNED', 'IN_PROGRESS'].includes(c.status)).length,
        },
        food: {
          averageRating: avgRating,
          totalReviews: feedbacks.length,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 9. Emergency Console (Section 24) ────────────────────────────────────
export const getAdminEmergencyAlerts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const alerts = await EmergencyAlert.find().sort({ createdAt: -1 });
    res.json({ success: true, data: alerts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateEmergencyAlertStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const alert = await EmergencyAlert.findById(id);
    if (!alert) {
      res.status(404).json({ success: false, message: 'Emergency alert not found' });
      return;
    }

    alert.status = status;
    alert.handledBy = req.user?._id;
    alert.handledByName = req.user?.name || 'Warden';
    if (notes) {
      alert.notes = alert.notes ? `${alert.notes} | ${notes}` : notes;
    }
    if (status === 'RESOLVED') {
      alert.resolvedAt = new Date();
    }

    await alert.save();
    res.json({ success: true, message: `Emergency alert status updated to ${status}`, data: alert });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 10. Food / Mess Administration (Section 21) ──────────────────────────
export const getAdminMessFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const feedbacks = await MealFeedback.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: feedbacks });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAdminMessOptOuts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const optOuts = await MealOptOut.find({ dateStr: todayStr }).sort({ createdAt: -1 });

    const counts: Record<string, number> = {
      Breakfast: 0,
      Lunch: 0,
      Snacks: 0,
      Dinner: 0,
    };

    optOuts.forEach((o) => {
      if (counts[o.mealType] !== undefined) {
        counts[o.mealType]++;
      }
    });

    res.json({
      success: true,
      data: {
        dateStr: todayStr,
        totalOptOuts: optOuts.length,
        breakdown: counts,
        optOuts,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const upsertMealMenu = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { dayOfWeek, mealType, items, timing, isVeg, isSpecial, specialTitle } = req.body;
    if (!dayOfWeek || !mealType || !items || !timing) {
      res.status(400).json({ success: false, message: 'dayOfWeek, mealType, items, and timing are required' });
      return;
    }

    const menu = await MealMenu.findOneAndUpdate(
      { dayOfWeek, mealType },
      {
        dayOfWeek,
        mealType,
        items: Array.isArray(items) ? items : [items],
        timing,
        isVeg: isVeg !== undefined ? isVeg : true,
        isSpecial: !!isSpecial,
        specialTitle: specialTitle || '',
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Meal menu updated successfully', data: menu });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
