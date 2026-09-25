import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { EmergencyContact } from '../models/EmergencyContact';
import { EmergencyAlert, AlertType } from '../models/EmergencyAlert';
import { HostelSettings } from '../models/HostelSettings';
import { emitEmergencyAlert } from '../services/socket';
import { createNotification } from '../services/notification';
import { User } from '../models/User';

export const getEmergencyContacts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const contacts = await EmergencyContact.find().sort({ priorityOrder: 1 });
    const settings = await HostelSettings.findOne();

    // Family contact for resident
    let familyContact = null;
    if (req.resident && req.resident.emergencyContact) {
      familyContact = req.resident.emergencyContact;
    }

    res.json({
      success: true,
      data: {
        hostelResponders: contacts.filter((c) => ['WARDEN', 'SECURITY_DESK'].includes(c.role)),
        nationalHelplines: contacts.filter((c) => ['WOMEN_HELPLINE', 'POLICE', 'AMBULANCE', 'FIRE'].includes(c.role)),
        familyContact,
        hostelLocation: {
          name: settings?.hostelName || 'SLG Luxury Ladies PG',
          address: `${settings?.doorOrPlotNumber || 'Plot No. 142 & 143'}, ${settings?.streetName || 'Road No. 2, Phase 1'}, ${settings?.locality || 'KPHB / Kukatpally'}`,
          city: settings?.city || 'Hyderabad',
          state: settings?.state || 'Telangana',
          pincode: settings?.pincode || '500072',
          landmark: settings?.landmark || 'Near KPHB Metro Station & Forum Sujana Mall',
          policeStation: 'KPHB Police Station (0.8 km)',
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendSilentWelfareAlert = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resident = req.resident;
    if (!resident || !req.user) {
      res.status(404).json({ success: false, message: 'Resident profile not found' });
      return;
    }

    const { latitude, longitude, notes } = req.body;

    const alert = await EmergencyAlert.create({
      resident: resident._id,
      residentName: resident.name,
      residentPhone: resident.phone,
      room: resident.room,
      roomNumber: resident.roomNumber,
      floorNumber: resident.floorNumber || 2,
      bedCode: resident.bedCode,
      type: 'SILENT_WELFARE',
      status: 'TRIGGERED',
      notes: notes || 'Resident requested discreet welfare check via in-app Silent Alert',
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
      timestamp: new Date(),
    });

    // Real-time Push via Socket.IO to Warden / Admin emergency console
    emitEmergencyAlert({
      id: alert._id,
      type: 'SILENT_WELFARE',
      residentName: resident.name,
      residentPhone: resident.phone,
      roomNumber: resident.roomNumber,
      bedCode: resident.bedCode,
      notes: alert.notes,
      timestamp: alert.timestamp,
      latitude,
      longitude,
    });

    // Push notification to all Admin & Warden users
    const wardensAndAdmins = await User.find({ role: { $in: ['WARDEN', 'ADMIN', 'SUPER_ADMIN'] } });
    for (const admin of wardensAndAdmins) {
      await createNotification({
        recipientId: admin._id,
        title: '🚨 SILENT WELFARE ALERT',
        message: `Alert triggered by ${resident.name} (Room ${resident.roomNumber}, Bed ${resident.bedCode}). Immediate assistance requested.`,
        type: 'EMERGENCY_ALERT',
        data: { alertId: alert._id, roomNumber: resident.roomNumber },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Silent Welfare Alert successfully sent to Warden Mrs. Shanti Reddy & Security Desk. Staff is being dispatched.',
      data: alert,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const logSosAction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resident = req.resident;
    const { actionType, contactName, phone } = req.body;

    if (resident) {
      await EmergencyAlert.create({
        resident: resident._id,
        residentName: resident.name,
        residentPhone: resident.phone,
        roomNumber: resident.roomNumber,
        bedCode: resident.bedCode,
        type: 'SOS_CALL',
        status: 'TRIGGERED',
        notes: `Call initiated to ${contactName} (${phone}) from app. Action: ${actionType}`,
      });
    }

    res.json({ success: true, message: 'Emergency action logged' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
