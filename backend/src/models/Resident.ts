import mongoose, { Document, Schema } from 'mongoose';

export interface IEmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface IResident extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  email: string;
  room?: mongoose.Types.ObjectId;
  roomNumber: string;
  bed?: mongoose.Types.ObjectId;
  bedCode: string;
  floorNumber: number;
  wing: string;
  kycVerified: boolean;
  checkedIn: boolean;
  joiningDate: Date;
  agreementStartDate: Date;
  agreementEndDate: Date;
  monthlyRent: number;
  securityDeposit: number;
  agreementType: string;
  emergencyContact: IEmergencyContact;
  workOrCollege: string;
  homeAddress: string;
  status: 'ACTIVE' | 'PENDING' | 'VACATED';
  createdAt: Date;
  updatedAt: Date;
}

const ResidentSchema = new Schema<IResident>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    room: { type: Schema.Types.ObjectId, ref: 'Room', index: true },
    roomNumber: { type: String, default: '204' },
    bed: { type: Schema.Types.ObjectId, ref: 'Bed' },
    bedCode: { type: String, default: 'B' },
    floorNumber: { type: Number, default: 2 },
    wing: { type: String, default: 'Wing A' },
    kycVerified: { type: Boolean, default: true },
    checkedIn: { type: Boolean, default: true },
    joiningDate: { type: Date, default: () => new Date('2026-01-10') },
    agreementStartDate: { type: Date, default: () => new Date('2026-01-10') },
    agreementEndDate: { type: Date, default: () => new Date('2026-12-31') },
    monthlyRent: { type: Number, default: 8000 },
    securityDeposit: { type: Number, default: 10000 },
    agreementType: { type: String, default: '11 Months Standard Residential' },
    emergencyContact: {
      name: { type: String, default: 'Rajesh Sharma' },
      relation: { type: String, default: 'Father' },
      phone: { type: String, default: '+91 98480 12345' },
    },
    workOrCollege: { type: String, default: 'Software Engineer @ Hitec City' },
    homeAddress: { type: String, default: 'Plot 42, Jubilee Enclave, Hyderabad' },
    status: { type: String, enum: ['ACTIVE', 'PENDING', 'VACATED'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

export const Resident = mongoose.model<IResident>('Resident', ResidentSchema);
