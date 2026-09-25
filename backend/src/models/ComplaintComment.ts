import mongoose, { Document, Schema } from 'mongoose';

export interface IComplaintComment extends Document {
  complaint: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  userName: string;
  userRole: string;
  message: string;
  createdAt: Date;
}

const ComplaintCommentSchema = new Schema<IComplaintComment>(
  {
    complaint: { type: Schema.Types.ObjectId, ref: 'Complaint', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userRole: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

export const ComplaintComment = mongoose.model<IComplaintComment>('ComplaintComment', ComplaintCommentSchema);
