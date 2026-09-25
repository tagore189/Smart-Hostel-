import mongoose, { Document, Schema } from 'mongoose';

export type EmergencyResponderRole =
  | 'WARDEN'
  | 'SECURITY_DESK'
  | 'POLICE'
  | 'WOMEN_HELPLINE'
  | 'AMBULANCE'
  | 'FIRE'
  | 'FAMILY';

export interface IEmergencyContactModel extends Document {
  name: string;
  role: EmergencyResponderRole;
  phone: string;
  alternatePhone?: string;
  designation: string;
  isAvailable24x7: boolean;
  priorityOrder: number;
}

const EmergencyContactSchema = new Schema<IEmergencyContactModel>(
  {
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ['WARDEN', 'SECURITY_DESK', 'POLICE', 'WOMEN_HELPLINE', 'AMBULANCE', 'FIRE', 'FAMILY'],
      required: true,
    },
    phone: { type: String, required: true },
    alternatePhone: { type: String },
    designation: { type: String, required: true },
    isAvailable24x7: { type: Boolean, default: true },
    priorityOrder: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export const EmergencyContact = mongoose.model<IEmergencyContactModel>(
  'EmergencyContact',
  EmergencyContactSchema
);
