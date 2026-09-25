import mongoose, { Document, Schema } from 'mongoose';

export interface IVisitorPass extends Document {
  visitor: mongoose.Types.ObjectId;
  passCode: string;
  validDate: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED';
  scannedAt?: Date;
  scannedBy?: mongoose.Types.ObjectId;
}

const VisitorPassSchema = new Schema<IVisitorPass>(
  {
    visitor: { type: Schema.Types.ObjectId, ref: 'Visitor', required: true },
    passCode: { type: String, required: true, unique: true, index: true },
    validDate: { type: String, required: true },
    status: { type: String, enum: ['ACTIVE', 'USED', 'EXPIRED'], default: 'ACTIVE' },
    scannedAt: { type: Date },
    scannedBy: { type: Schema.Types.ObjectId, ref: 'Staff' },
  },
  { timestamps: true }
);

export const VisitorPass = mongoose.model<IVisitorPass>('VisitorPass', VisitorPassSchema);
