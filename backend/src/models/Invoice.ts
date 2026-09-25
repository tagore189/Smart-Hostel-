import mongoose, { Document, Schema } from 'mongoose';

export interface IInvoiceItem {
  description: string;
  amount: number;
}

export interface IInvoice extends Document {
  resident: mongoose.Types.ObjectId;
  invoiceNumber: string;
  month: string;
  year: number;
  totalAmount: number;
  items: IInvoiceItem[];
  dueDate: Date;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    resident: { type: Schema.Types.ObjectId, ref: 'Resident', required: true, index: true },
    invoiceNumber: { type: String, required: true, unique: true },
    month: { type: String, required: true },
    year: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    items: [
      {
        description: { type: String, required: true },
        amount: { type: Number, required: true },
      },
    ],
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ['PAID', 'PENDING', 'OVERDUE'], default: 'PENDING' },
  },
  { timestamps: true }
);

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
