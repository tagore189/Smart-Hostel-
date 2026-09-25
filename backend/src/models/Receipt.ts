import mongoose, { Document, Schema } from 'mongoose';

export interface IReceipt extends Document {
  payment: mongoose.Types.ObjectId;
  resident: mongoose.Types.ObjectId;
  receiptNumber: string;
  amount: number;
  date: Date;
  method: string;
  pdfUrl?: string;
}

const ReceiptSchema = new Schema<IReceipt>(
  {
    payment: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
    resident: { type: Schema.Types.ObjectId, ref: 'Resident', required: true },
    receiptNumber: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    method: { type: String, default: 'UPI' },
    pdfUrl: { type: String },
  },
  { timestamps: true }
);

export const Receipt = mongoose.model<IReceipt>('Receipt', ReceiptSchema);
