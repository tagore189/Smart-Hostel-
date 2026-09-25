import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType =
  | 'RENT_DUE'
  | 'PAYMENT_SUCCESS'
  | 'COMPLAINT_UPDATE'
  | 'OUTING_APPROVED'
  | 'OUTING_REJECTED'
  | 'VISITOR_APPROVED'
  | 'VISITOR_REJECTED'
  | 'NEW_NOTICE'
  | 'EMERGENCY_ALERT'
  | 'SYSTEM';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'RENT_DUE',
        'PAYMENT_SUCCESS',
        'COMPLAINT_UPDATE',
        'OUTING_APPROVED',
        'OUTING_REJECTED',
        'VISITOR_APPROVED',
        'VISITOR_REJECTED',
        'NEW_NOTICE',
        'EMERGENCY_ALERT',
        'SYSTEM',
      ],
      default: 'SYSTEM',
    },
    data: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
