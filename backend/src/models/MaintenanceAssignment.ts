import mongoose, { Document, Schema } from 'mongoose';

export interface IMaintenanceAssignment extends Document {
  complaint: mongoose.Types.ObjectId;
  staff: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  assignedDate: Date;
  scheduledTime?: string;
  notes?: string;
  completedDate?: Date;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

const MaintenanceAssignmentSchema = new Schema<IMaintenanceAssignment>(
  {
    complaint: { type: Schema.Types.ObjectId, ref: 'Complaint', required: true, index: true },
    staff: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedDate: { type: Date, default: Date.now },
    scheduledTime: { type: String },
    notes: { type: String },
    completedDate: { type: Date },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
    },
  },
  { timestamps: true }
);

export const MaintenanceAssignment = mongoose.model<IMaintenanceAssignment>(
  'MaintenanceAssignment',
  MaintenanceAssignmentSchema
);
