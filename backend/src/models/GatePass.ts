import mongoose, { Document, Schema } from 'mongoose';

export interface IGatePass extends Document {
  outingRequest: mongoose.Types.ObjectId;
  resident: mongoose.Types.ObjectId;
  passCode: string;
  passType: 'OUTING' | 'LATE_ENTRY' | 'OVERNIGHT' | 'WEEKEND_LEAVE';
  validFrom: Date;
  validTo: Date;
  status: 'ACTIVE' | 'USED' | 'EXPIRED';
  scannedAt?: Date;
  scannedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const GatePassSchema = new Schema<IGatePass>(
  {
    outingRequest: { type: Schema.Types.ObjectId, ref: 'OutingRequest', required: true },
    resident: { type: Schema.Types.ObjectId, ref: 'Resident', required: true, index: true },
    passCode: { type: String, required: true, unique: true, index: true },
    passType: {
      type: String,
      enum: ['OUTING', 'LATE_ENTRY', 'OVERNIGHT', 'WEEKEND_LEAVE'],
      default: 'OUTING',
    },
    validFrom: { type: Date, required: true },
    validTo: { type: Date, required: true },
    status: { type: String, enum: ['ACTIVE', 'USED', 'EXPIRED'], default: 'ACTIVE' },
    scannedAt: { type: Date },
    scannedBy: { type: Schema.Types.ObjectId, ref: 'Staff' },
  },
  { timestamps: true }
);

export const GatePass = mongoose.model<IGatePass>('GatePass', GatePassSchema);
