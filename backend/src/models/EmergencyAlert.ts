import mongoose, { Document, Schema } from 'mongoose';

export type AlertType = 'SILENT_WELFARE' | 'SOS_CALL' | 'MEDICAL' | 'SECURITY' | 'FIRE';
export type AlertStatus = 'TRIGGERED' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'FALSE_ALARM';

export interface IEmergencyAlert extends Document {
  resident: mongoose.Types.ObjectId;
  residentName: string;
  residentPhone: string;
  room?: mongoose.Types.ObjectId;
  roomNumber: string;
  floorNumber?: number;
  bedCode: string;
  type: AlertType;
  status: AlertStatus;
  handledBy?: mongoose.Types.ObjectId;
  handledByName?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  locationAddress?: string;
  timestamp: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EmergencyAlertSchema = new Schema<IEmergencyAlert>(
  {
    resident: { type: Schema.Types.ObjectId, ref: 'Resident', required: true, index: true },
    residentName: { type: String, required: true },
    residentPhone: { type: String, required: true },
    room: { type: Schema.Types.ObjectId, ref: 'Room' },
    roomNumber: { type: String, required: true },
    floorNumber: { type: Number, default: 2 },
    bedCode: { type: String, default: 'B' },
    type: {
      type: String,
      enum: ['SILENT_WELFARE', 'SOS_CALL', 'MEDICAL', 'SECURITY', 'FIRE'],
      default: 'SILENT_WELFARE',
      index: true,
    },
    status: {
      type: String,
      enum: ['TRIGGERED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'FALSE_ALARM'],
      default: 'TRIGGERED',
      index: true,
    },
    handledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    handledByName: { type: String },
    notes: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    locationAddress: { type: String, default: 'SLG Luxury Ladies PG, KPHB / Kukatpally, Hyderabad' },
    timestamp: { type: Date, default: Date.now },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

export const EmergencyAlert = mongoose.model<IEmergencyAlert>('EmergencyAlert', EmergencyAlertSchema);
