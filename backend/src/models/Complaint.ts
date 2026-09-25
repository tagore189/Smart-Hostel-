import mongoose, { Document, Schema } from 'mongoose';

export type ComplaintCategory =
  | 'Electrical'
  | 'Plumbing'
  | 'AC/Fan'
  | 'Wi-Fi'
  | 'Cleaning'
  | 'Furniture'
  | 'Bathroom'
  | 'Other';

export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ComplaintStatus =
  | 'SUBMITTED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REJECTED';

export interface ITimelineEntry {
  status: ComplaintStatus;
  note: string;
  updatedBy: string;
  timestamp: Date;
}

export interface IComplaint extends Document {
  resident: mongoose.Types.ObjectId;
  residentName: string;
  roomNumber: string;
  category: ComplaintCategory;
  title: string;
  description: string;
  priority: ComplaintPriority;
  photoUrl?: string;
  status: ComplaintStatus;
  assignedStaff?: mongoose.Types.ObjectId;
  assignedStaffName?: string;
  timeline: ITimelineEntry[];
  resolvedAt?: Date;
  feedbackRating?: number;
  feedbackComment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TimelineEntrySchema = new Schema<ITimelineEntry>(
  {
    status: { type: String, required: true },
    note: { type: String, required: true },
    updatedBy: { type: String, default: 'System' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ComplaintSchema = new Schema<IComplaint>(
  {
    resident: { type: Schema.Types.ObjectId, ref: 'Resident', required: true, index: true },
    residentName: { type: String, required: true },
    roomNumber: { type: String, required: true },
    category: {
      type: String,
      enum: ['Electrical', 'Plumbing', 'AC/Fan', 'Wi-Fi', 'Cleaning', 'Furniture', 'Bathroom', 'Other'],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    photoUrl: { type: String },
    status: {
      type: String,
      enum: ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'],
      default: 'SUBMITTED',
      index: true,
    },
    assignedStaff: { type: Schema.Types.ObjectId, ref: 'Staff' },
    assignedStaffName: { type: String },
    timeline: [TimelineEntrySchema],
    resolvedAt: { type: Date },
    feedbackRating: { type: Number, min: 1, max: 5 },
    feedbackComment: { type: String },
  },
  { timestamps: true }
);

export const Complaint = mongoose.model<IComplaint>('Complaint', ComplaintSchema);
