import mongoose, { Document, Schema } from 'mongoose';

export type PaymentStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'FAILED' | 'REFUNDED';
export type PaymentType = 'RENT' | 'SECURITY_DEPOSIT' | 'MAINTENANCE' | 'MESS' | 'FINE';
export type PaymentMethod = 'UPI' | 'CARD' | 'NETBANKING' | 'CASH' | 'DEVELOPMENT_MODE';

export interface IPayment extends Document {
  resident: mongoose.Types.ObjectId;
  residentName: string;
  roomNumber: string;
  invoice?: mongoose.Types.ObjectId;
  amount: number;
  type: PaymentType;
  status: PaymentStatus;
  method: PaymentMethod;
  transactionId: string;
  receiptNumber: string;
  dueDate: Date;
  paidAt?: Date;
  month: string; // e.g. "September 2026"
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    resident: { type: Schema.Types.ObjectId, ref: 'Resident', required: true, index: true },
    residentName: { type: String, required: true },
    roomNumber: { type: String, required: true },
    invoice: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: ['RENT', 'SECURITY_DEPOSIT', 'MAINTENANCE', 'MESS', 'FINE'],
      default: 'RENT',
    },
    status: {
      type: String,
      enum: ['PAID', 'PENDING', 'OVERDUE', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
      index: true,
    },
    method: {
      type: String,
      enum: ['UPI', 'CARD', 'NETBANKING', 'CASH', 'DEVELOPMENT_MODE'],
      default: 'DEVELOPMENT_MODE',
    },
    transactionId: { type: String, required: true, unique: true },
    receiptNumber: { type: String, required: true, unique: true },
    dueDate: { type: Date, required: true },
    paidAt: { type: Date },
    month: { type: String, required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
