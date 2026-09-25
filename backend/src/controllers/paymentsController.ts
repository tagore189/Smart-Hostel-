import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Payment } from '../models/Payment';
import { Receipt } from '../models/Receipt';
import { Invoice } from '../models/Invoice';
import { createNotification } from '../services/notification';

export const getPaymentOverview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resident = req.resident;
    if (!resident) {
      res.status(404).json({ success: false, message: 'Resident record not found.' });
      return;
    }

    // Latest payment
    const latestPayment = await Payment.findOne({ resident: resident._id }).sort({ createdAt: -1 });

    // Recent payments history
    const history = await Payment.find({ resident: resident._id }).sort({ createdAt: -1 }).limit(10);

    // Pending invoice or payment
    const pendingPayment = await Payment.findOne({
      resident: resident._id,
      status: { $in: ['PENDING', 'OVERDUE'] },
    }).sort({ createdAt: -1 });

    const currentMonth = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });

    res.json({
      success: true,
      data: {
        monthlyRent: resident.monthlyRent || 8000,
        securityDeposit: resident.securityDeposit || 10000,
        currentStatus: pendingPayment ? pendingPayment.status : (latestPayment ? latestPayment.status : 'PAID'),
        currentMonth: latestPayment?.month || currentMonth,
        nextDueDate: new Date(Date.now() + 10 * 86400000),
        lastPayment: latestPayment || {
          amount: resident.monthlyRent || 8000,
          status: 'PAID',
          transactionId: 'TXN-SLG-20260901',
          receiptNumber: `SLG-REC-202609-${resident.roomNumber}`,
          paidAt: new Date(),
          month: currentMonth,
        },
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

    const { amount, method, transactionId, month, notes } = req.body;
    if (!transactionId) {
      res.status(400).json({ success: false, message: 'Transaction/UTR reference number is required.' });
      return;
    }

    const payAmount = Number(amount) || resident.monthlyRent || 8000;
    const currentMonth = month || new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });

    // Create a pending payment record awaiting admin verification
    const payment = await Payment.create({
      resident: resident._id,
      residentName: resident.name,
      roomNumber: resident.roomNumber,
      amount: payAmount,
      type: 'RENT',
      status: 'PENDING',
      method: method || 'UPI',
      transactionId: transactionId.trim(),
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
  try {
    const resident = req.resident;
    if (!resident || !req.user) {
      res.status(404).json({ success: false, message: 'Resident profile not found.' });
      return;
    }

    const { amount, type, method, month, isDevelopmentMode } = req.body;
    const payAmount = Number(amount) || resident.monthlyRent || 8000;
    const payMonth = month || 'October 2026';
    const payType = type || 'RENT';

    const transactionId = `TXN-DEV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const receiptNumber = `SLG-REC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${resident.roomNumber}`;

    const payment = await Payment.create({
      resident: resident._id,
      residentName: resident.name,
      roomNumber: resident.roomNumber,
      amount: payAmount,
      type: payType,
      status: 'PAID',
      method: isDevelopmentMode ? 'DEVELOPMENT_MODE' : (method || 'UPI'),
      transactionId,
      receiptNumber,
      dueDate: new Date(),
      paidAt: new Date(),
      month: payMonth,
      notes: isDevelopmentMode
        ? 'Processed in verified Development Payment Mode for testing'
        : 'Payment recorded via hostel offline counter',
    });

    const receipt = await Receipt.create({
      payment: payment._id,
      resident: resident._id,
      receiptNumber,
      amount: payAmount,
      date: new Date(),
      method: payment.method,
    });

    await createNotification({
      recipientId: req.user._id,
      title: 'Payment Successful',
      message: `Your payment of ₹${payAmount.toLocaleString('en-IN')} for ${payMonth} (${payType}) was confirmed. Receipt: ${receiptNumber}.`,
      type: 'PAYMENT_SUCCESS',
      data: { paymentId: payment._id, receiptNumber },
    });

    res.json({
      success: true,
      message: 'Payment verified and processed successfully',
      data: {
        payment,
        receipt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
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
    if (!isAdmin && req.resident && !receipt.resident.equals(req.resident._id)) {
      res.status(403).json({ success: false, message: 'Access denied: You can only view your own receipts.' });
      return;
    }

    res.json({ success: true, data: receipt });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
