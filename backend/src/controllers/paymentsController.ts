import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Payment } from '../models/Payment';
import { Receipt } from '../models/Receipt';
import { Invoice } from '../models/Invoice';
import { createNotification } from '../services/notification';
import { randomBytes } from 'crypto';

export const getPaymentOverview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resident = req.resident;
    if (!resident) {
      res.status(404).json({ success: false, message: 'Resident record not found.' });
      return;
    }

    const currentMonth = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });

    // Latest payment and current billing cycle records
    const latestPayment = await Payment.findOne({ resident: resident._id }).sort({ createdAt: -1 });
    const currentPayment = await Payment.findOne({ resident: resident._id, month: currentMonth }).sort({ createdAt: -1 });

    // Recent payments history
    const history = await Payment.find({ resident: resident._id }).sort({ createdAt: -1 }).limit(10);

    // Pending invoice or payment
    const pendingPayment = await Payment.findOne({
      resident: resident._id,
      month: currentMonth,
      status: { $in: ['PENDING', 'OVERDUE'] },
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        monthlyRent: resident.monthlyRent,
        securityDeposit: resident.securityDeposit,
        currentStatus: pendingPayment?.status || currentPayment?.status || 'NO_RECORD',
        currentMonth,
        lastPayment: latestPayment || null,
        pendingPayment,
        history,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resident = req.resident;
    if (!resident) {
      res.status(404).json({ success: false, message: 'Resident profile not found.' });
      return;
    }

    const payments = await Payment.find({ resident: resident._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: payments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Resident submits UPI / Bank Transfer transaction reference for warden verification
export const submitPaymentReference = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resident = req.resident;
    if (!resident || !req.user) {
      res.status(404).json({ success: false, message: 'Resident profile not found.' });
      return;
    }

    const { method, transactionId, notes } = req.body;
    if (!transactionId) {
      res.status(400).json({ success: false, message: 'Transaction/UTR reference number is required.' });
      return;
    }

    if (!['UPI', 'Bank Transfer'].includes(method)) {
      res.status(400).json({ success: false, message: 'Choose UPI or bank transfer for reference verification.' });
      return;
    }
    const payAmount = resident.monthlyRent;
    const currentMonth = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });

    // Create a pending payment record awaiting admin verification
    const payment = await Payment.create({
      resident: resident._id,
      residentName: resident.name,
      roomNumber: resident.roomNumber,
      amount: payAmount,
      type: 'RENT',
      status: 'PENDING',
      method: method === 'Bank Transfer' ? 'NETBANKING' : 'UPI',
      transactionId: transactionId.trim(),
      receiptNumber: `PENDING-${randomBytes(8).toString('hex')}`,
      dueDate: new Date(),
      month: currentMonth,
      notes: notes || `Submitted by resident for verification via ${method || 'UPI'}`,
    });

    res.json({
      success: true,
      message: 'Payment reference submitted. The warden/admin will verify and issue your receipt.',
      data: payment,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Kept for backward compatibility in dev tests
export const processPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(501).json({
    success: false,
    message: 'Online payment processing is not configured. Submit a transfer reference for staff verification or contact the hostel office.',
  });
};

export const getReceipt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const receipt = await Receipt.findById(id).populate('payment');
    if (!receipt) {
      res.status(404).json({ success: false, message: 'Receipt not found' });
      return;
    }

    // Security ownership check
    const isAdmin = ['ADMIN', 'WARDEN', 'SUPER_ADMIN'].includes(req.user?.role || '');
    if (!isAdmin && (!req.resident || !receipt.resident.equals(req.resident._id))) {
      res.status(403).json({ success: false, message: 'Access denied: You can only view your own receipts.' });
      return;
    }

    res.json({ success: true, data: receipt });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
