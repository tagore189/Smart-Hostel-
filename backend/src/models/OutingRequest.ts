import mongoose, { Document, Schema } from 'mongoose';

export type OutingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'COMPLETED';

export interface IOutingRequest extends Document {
  resident: mongoose.Types.ObjectId;
  residentName: string;
  roomNumber: string;
  bedCode: string;
  phone: string;
  leavingDate: string;
  leavingTime: string;
  expectedReturnDate: string;
  expectedReturnTime: string;
  actualReturnTime?: string;
  destination: string;
  reason: string;
  status: OutingStatus;
  approvedBy?: mongoose.Types.ObjectId;
  approvedByName?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  gatePassCode?: string;
  qrPayload?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OutingRequestSchema = new Schema<IOutingRequest>(
  {
    resident: { type: Schema.Types.ObjectId, ref: 'Resident', required: true, index: true },
    residentName: { type: String, required: true },
    roomNumber: { type: String, required: true },
    bedCode: { type: String, default: 'B' },
    phone: { type: String, required: true },
    leavingDate: { type: String, required: true },
    leavingTime: { type: String, required: true },
    expectedReturnDate: { type: String, required: true },
    expectedReturnTime: { type: String, required: true },
    actualReturnTime: { type: String },
    destination: { type: String, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'COMPLETED'],
      default: 'PENDING',
      index: true,
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedByName: { type: String },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
    gatePassCode: { type: String, index: true },
    qrPayload: { type: String },
  },
  { timestamps: true }
);

export const OutingRequest = mongoose.model<IOutingRequest>('OutingRequest', OutingRequestSchema);
