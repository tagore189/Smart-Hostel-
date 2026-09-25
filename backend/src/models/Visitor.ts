import mongoose, { Document, Schema } from 'mongoose';

export type VisitorStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface IVisitor extends Document {
  resident: mongoose.Types.ObjectId;
  residentName: string;
  roomNumber: string;
  visitorName: string;
  relationship: string;
  phone: string;
  purpose?: string;
  visitDate: string;
  arrivalTime: string;
  expectedDepartureTime: string;
  actualDepartureTime?: string;
  status: VisitorStatus;
  approvedBy?: mongoose.Types.ObjectId;
  approvedByName?: string;
  visitorPassCode?: string;
  qrPayload?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VisitorSchema = new Schema<IVisitor>(
  {
    resident: { type: Schema.Types.ObjectId, ref: 'Resident', required: true, index: true },
    residentName: { type: String, required: true },
    roomNumber: { type: String, required: true },
    visitorName: { type: String, required: true },
    relationship: { type: String, required: true },
    phone: { type: String, required: true },
    purpose: { type: String, default: 'Casual Family Visit' },
    visitDate: { type: String, required: true },
    arrivalTime: { type: String, required: true },
    expectedDepartureTime: { type: String, required: true },
    actualDepartureTime: { type: String },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'],
      default: 'PENDING',
      index: true,
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedByName: { type: String },
    visitorPassCode: { type: String, index: true },
    qrPayload: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Visitor = mongoose.model<IVisitor>('Visitor', VisitorSchema);
