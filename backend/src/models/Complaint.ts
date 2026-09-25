import mongoose, { Document, Schema } from 'mongoose';

export type ComplaintCategory =
  | 'Room'
  | 'Plumbing'
  | 'Electricity'
  | 'Electrical'
  | 'Wi-Fi'
  | 'Cleaning'
  | 'Food'
  | 'Maintenance'
  | 'AC/Fan'
  | 'Furniture'
  | 'Bathroom'
  | 'Other';

export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ComplaintStatus =
  | 'NEW'
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

export interface IComplaintAttachment {
  url: string;
  fileType: 'image' | 'video' | 'document';
  originalName: string;
  size?: number;
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
  attachments: IComplaintAttachment[];
  status: ComplaintStatus;
  assignedStaff?: mongoose.Types.ObjectId;
  assignedStaffName?: string;
  adminResponse?: string;
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

const AttachmentSchema = new Schema<IComplaintAttachment>(
  {
    url: { type: String, required: true },
    fileType: { type: String, enum: ['image', 'video', 'document'], default: 'image' },
    originalName: { type: String, required: true },
    size: { type: Number },
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
      enum: [
        'Room',
        'Plumbing',
        'Electricity',
        'Electrical',
        'Wi-Fi',
        'Cleaning',
        'Food',
        'Maintenance',
        'AC/Fan',
        'Furniture',
        'Bathroom',
        'Other',
      ],
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
    attachments: [AttachmentSchema],
    status: {
      type: String,
      enum: ['NEW', 'SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'],
      default: 'NEW',
      index: true,
    },
    assignedStaff: { type: Schema.Types.ObjectId, ref: 'Staff' },
    assignedStaffName: { type: String },
    adminResponse: { type: String },
    timeline: [TimelineEntrySchema],
    resolvedAt: { type: Date },
    feedbackRating: { type: Number, min: 1, max: 5 },
    feedbackComment: { type: String },
  },
  { timestamps: true }
);

export const Complaint = mongoose.model<IComplaint>('Complaint', ComplaintSchema);
