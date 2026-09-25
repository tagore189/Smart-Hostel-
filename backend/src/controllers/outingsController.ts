import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { OutingRequest } from '../models/OutingRequest';
import { GatePass } from '../models/GatePass';
import { createNotification } from '../services/notification';
import { emitToAdmins } from '../services/socket';

export const getMyOutings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resident = req.resident;
    if (!resident) {
      res.status(404).json({ success: false, message: 'Resident profile not found' });
      return;
    }

    const outings = await OutingRequest.find({ resident: resident._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: outings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createOutingRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resident = req.resident;
    if (!resident || !req.user) {
      res.status(404).json({ success: false, message: 'Resident profile not found' });
      return;
    }

    const { leavingDate, leavingTime, expectedReturnDate, expectedReturnTime, destination, reason } = req.body;
    if (!leavingDate || !leavingTime || !expectedReturnDate || !expectedReturnTime || !destination || !reason) {
      res.status(400).json({ success: false, message: 'All outing fields are required.' });
      return;
    }

    // Auto-approve outings returning before hostel closing time (10:00 PM same day), otherwise flag for warden review
    const isSameDay = leavingDate === expectedReturnDate;
    const isStandardHours = isSameDay && leavingTime >= '06:00' && expectedReturnTime <= '21:30';

    const gatePassCode = `GP-${Date.now().toString().slice(-6)}-${resident.roomNumber}`;
    const initialStatus = isStandardHours ? 'APPROVED' : 'PENDING';

    const qrPayload = JSON.stringify({
      passCode: gatePassCode,
      residentId: resident._id.toString(),
      residentName: resident.name,
      roomNumber: resident.roomNumber,
      destination,
      validFrom: `${leavingDate} ${leavingTime}`,
      validTo: `${expectedReturnDate} ${expectedReturnTime}`,
      type: 'OUTING_GATE_PASS',
      issuedBy: 'SLG Luxury Ladies PG Security Desk',
    });

    const outing = await OutingRequest.create({
      resident: resident._id,
      residentName: resident.name,
      roomNumber: resident.roomNumber,
      bedCode: resident.bedCode,
      phone: resident.phone,
      leavingDate,
      leavingTime,
      expectedReturnDate,
      expectedReturnTime,
      destination,
      reason,
      status: initialStatus,
      approvedByName: isStandardHours ? 'Auto-Approved (Hostel Policy)' : undefined,
      approvedAt: isStandardHours ? new Date() : undefined,
      gatePassCode: isStandardHours ? gatePassCode : undefined,
      qrPayload: isStandardHours ? qrPayload : undefined,
    });

    if (isStandardHours) {
      await GatePass.create({
        outingRequest: outing._id,
        resident: resident._id,
        passCode: gatePassCode,
        passType: 'OUTING',
        validFrom: new Date(`${leavingDate}T${leavingTime}:00`),
        validTo: new Date(`${expectedReturnDate}T${expectedReturnTime}:00`),
        status: 'ACTIVE',
      });

      await createNotification({
        recipientId: req.user._id,
        title: 'Gate Pass Approved',
        message: `Your outing request to ${destination} is automatically approved. Digital Gate Pass generated.`,
        type: 'OUTING_APPROVED',
        data: { outingId: outing._id, gatePassCode },
      });
    } else {
      emitToAdmins('outing:pending', {
        outingId: outing._id,
        residentName: resident.name,
        roomNumber: resident.roomNumber,
        destination,
        reason,
        returnDate: expectedReturnDate,
      });

      await createNotification({
        recipientId: req.user._id,
        title: 'Outing Request Submitted',
        message: `Your late/overnight outing request to ${destination} was forwarded to Warden Mrs. Shanti Reddy for review.`,
        type: 'SYSTEM',
        data: { outingId: outing._id },
      });
    }

    res.status(201).json({
      success: true,
      message: isStandardHours ? 'Outing pass auto-generated' : 'Outing request submitted for warden approval',
      data: outing,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getActiveGatePass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resident = req.resident;
    if (!resident) {
      res.status(404).json({ success: false, message: 'Resident profile not found' });
      return;
    }

    const activeOuting = await OutingRequest.findOne({
      resident: resident._id,
      status: 'APPROVED',
      gatePassCode: { $exists: true },
    }).sort({ createdAt: -1 });

    if (!activeOuting) {
      res.json({ success: true, data: null, message: 'No active gate pass found' });
      return;
    }

    res.json({
      success: true,
      data: activeOuting,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
