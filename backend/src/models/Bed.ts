import mongoose, { Document, Schema } from 'mongoose';

export type BedStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED';

export interface IBed extends Document {
  room: mongoose.Types.ObjectId;
  roomNumber: string;
  bedCode: string; // 'A', 'B', 'C', 'D'
  status: BedStatus;
  currentResident?: mongoose.Types.ObjectId;
  monthlyRent: number;
}

const BedSchema = new Schema<IBed>(
  {
    room: { type: Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
    roomNumber: { type: String, required: true },
    bedCode: { type: String, required: true },
    status: {
      type: String,
      enum: ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED'],
      default: 'AVAILABLE',
      index: true,
    },
    currentResident: { type: Schema.Types.ObjectId, ref: 'Resident' },
    monthlyRent: { type: Number, default: 8000 },
  },
  { timestamps: true }
);

BedSchema.index({ room: 1, bedCode: 1 }, { unique: true });

export const Bed = mongoose.model<IBed>('Bed', BedSchema);
