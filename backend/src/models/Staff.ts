import mongoose, { Document, Schema } from 'mongoose';

export type StaffDepartment = 'Security' | 'Maintenance' | 'Housekeeping' | 'Kitchen' | 'Administration';

export interface IStaff extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  role: string;
  department: StaffDepartment;
  status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
  shift: 'DAY' | 'NIGHT' | 'ROTATIONAL';
  emergencyContact: string;
}

const StaffSchema = new Schema<IStaff>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, required: true },
    department: {
      type: String,
      enum: ['Security', 'Maintenance', 'Housekeeping', 'Kitchen', 'Administration'],
      required: true,
      index: true,
    },
    status: { type: String, enum: ['ACTIVE', 'ON_LEAVE', 'INACTIVE'], default: 'ACTIVE' },
    shift: { type: String, enum: ['DAY', 'NIGHT', 'ROTATIONAL'], default: 'DAY' },
    emergencyContact: { type: String },
  },
  { timestamps: true }
);

export const Staff = mongoose.model<IStaff>('Staff', StaffSchema);
