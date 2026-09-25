import mongoose, { Document, Schema } from 'mongoose';

export type NoticeCategory = 'All' | 'Important' | 'Mess' | 'Maintenance' | 'Finance' | 'Events';
export type NoticePriority = 'NORMAL' | 'HIGH' | 'URGENT';
export type NoticeAudience = 'ALL' | 'FLOOR' | 'ROOM' | 'RESIDENT';

export interface INotice extends Document {
  title: string;
  content: string;
  category: NoticeCategory;
  priority: NoticePriority;
  audienceScope: NoticeAudience;
  targetFloor?: number;
  targetRoom?: string;
  targetResident?: mongoose.Types.ObjectId;
  iconName?: string;
  publishedBy: mongoose.Types.ObjectId;
  publishedByName: string;
  isArchived: boolean;
  effectiveDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NoticeSchema = new Schema<INotice>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: {
      type: String,
      enum: ['All', 'Important', 'Mess', 'Maintenance', 'Finance', 'Events'],
      default: 'All',
      index: true,
    },
    priority: {
      type: String,
      enum: ['NORMAL', 'HIGH', 'URGENT'],
      default: 'NORMAL',
    },
    audienceScope: {
      type: String,
      enum: ['ALL', 'FLOOR', 'ROOM', 'RESIDENT'],
      default: 'ALL',
    },
    targetFloor: { type: Number },
    targetRoom: { type: String },
    targetResident: { type: Schema.Types.ObjectId, ref: 'Resident' },
    iconName: { type: String, default: 'notifications' },
    publishedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    publishedByName: { type: String, required: true },
    isArchived: { type: Boolean, default: false, index: true },
    effectiveDate: { type: String },
  },
  { timestamps: true }
);

export const Notice = mongoose.model<INotice>('Notice', NoticeSchema);
