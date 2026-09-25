import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Visitor } from '../models/Visitor';
import { VisitorPass } from '../models/VisitorPass';
import { createNotification } from '../services/notification';
import { emitToAdmins } from '../services/socket';

export const getMyVisitors = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resident = req.resident;
    if (!resident) {
      res.status(404).json({ success: false, message: 'Resident profile not found' });
      return;
    }

    const visitors = await Visitor.find({ resident: resident._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: visitors });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const registerVisitor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resident = req.resident;
    if (!resident || !req.user) {
      res.status(404).json({ success: false, message: 'Resident profile not found' });
      return;
    }

    const { visitorName, relationship, phone, purpose, visitDate, arrivalTime, expectedDepartureTime } = req.body;
    if (!visitorName || !relationship || !phone || !visitDate || !arrivalTime || !expectedDepartureTime) {
      res.status(400).json({ success: false, message: 'All visitor fields are required' });
      return;
    }

    // Direct family members visiting between 10am-7pm get instant pre-approval pass
    const isFamily = ['Mother', 'Father', 'Sister', 'Brother', 'Parent', 'Guardian'].includes(relationship);
    const initialStatus = isFamily ? 'APPROVED' : 'PENDING';
    const passCode = `VP-${Date.now().toString().slice(-6)}-${resident.roomNumber}`;

    const qrPayload = JSON.stringify({
      passCode,
      visitorName,
      relationship,
      residentName: resident.name,
      roomNumber: resident.roomNumber,
      visitDate,
      arrivalTime,
      expectedDepartureTime,
      type: 'HOSTEL_VISITOR_PASS',
      issuedBy: 'SLG Luxury Ladies PG Front Desk',
    });

    const visitor = await Visitor.create({
      resident: resident._id,
      residentName: resident.name,
      roomNumber: resident.roomNumber,
      visitorName,
      relationship,
      phone,
      purpose: purpose || 'Family visit',
      visitDate,
      arrivalTime,
      expectedDepartureTime,
      status: initialStatus,
      approvedByName: isFamily ? 'Instant Verification (Immediate Family)' : undefined,
      visitorPassCode: isFamily ? passCode : undefined,
      qrPayload: isFamily ? qrPayload : undefined,
    });

    if (isFamily) {
      await VisitorPass.create({
        visitor: visitor._id,
        passCode,
        validDate: visitDate,
        status: 'ACTIVE',
      });

      await createNotification({
        recipientId: req.user._id,
        title: 'Visitor Pass Approved',
        message: `Pass for ${visitorName} (${relationship}) has been issued for ${visitDate}.`,
        type: 'VISITOR_APPROVED',
        data: { visitorId: visitor._id, passCode },
      });
    } else {
      emitToAdmins('visitor:pending', {
        visitorId: visitor._id,
        residentName: resident.name,
        roomNumber: resident.roomNumber,
        visitorName,
        relationship,
        visitDate,
      });

      await createNotification({
        recipientId: req.user._id,
        title: 'Visitor Entry Registered',
        message: `Visitor request for ${visitorName} submitted for Security Desk verification.`,
        type: 'SYSTEM',
        data: { visitorId: visitor._id },
      });
    }

    res.status(201).json({
      success: true,
      message: isFamily ? 'Visitor pass generated successfully' : 'Visitor request submitted for approval',
      data: visitor,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getVisitorPass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const visitor = await Visitor.findById(id);
    if (!visitor) {
      res.status(404).json({ success: false, message: 'Visitor not found' });
      return;
    }
    res.json({ success: true, data: visitor });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
