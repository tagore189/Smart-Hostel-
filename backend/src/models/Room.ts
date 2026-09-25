import mongoose, { Document, Schema } from 'mongoose';

export interface IRoom extends Document {
  roomNumber: string;
  floor: mongoose.Types.ObjectId;
  floorNumber: number;
  wing: string;
  type: 'Single' | 'Double' | 'Triple' | 'Four-Sharing';
  sharingType: string;
  totalBeds: number;
  hasAc: boolean;
  rentAmount: number;
  monthlyRent: number;
  securityDeposit: number;
  facilities: string[];
  wifiSsid: string;
  wifiPassword: string;
  isActive: boolean;
}

const RoomSchema = new Schema<IRoom>(
  {
    roomNumber: { type: String, required: true, unique: true, index: true },
    floor: { type: Schema.Types.ObjectId, ref: 'Floor', required: true },
    floorNumber: { type: Number, required: true },
    wing: { type: String, default: 'Wing A' },
    type: {
      type: String,
      enum: ['Single', 'Double', 'Triple', 'Four-Sharing'],
      default: 'Double',
    },
    sharingType: { type: String, default: '2-Share' },
    totalBeds: { type: Number, default: 2 },
    hasAc: { type: Boolean, default: false },
    rentAmount: { type: Number, required: true, default: 8000 },
    monthlyRent: { type: Number, default: 8000 },
    securityDeposit: { type: Number, required: true, default: 10000 },
    facilities: [{ type: String }],
    wifiSsid: { type: String, default: 'Hostel_5G_Secured' },
    wifiPassword: { type: String, default: 'SLG@204Safe' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Room = mongoose.model<IRoom>('Room', RoomSchema);
