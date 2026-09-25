import mongoose, { Document, Schema } from 'mongoose';

export interface INoticeRead extends Document {
  notice: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  readAt: Date;
}

const NoticeReadSchema = new Schema<INoticeRead>(
  {
    notice: { type: Schema.Types.ObjectId, ref: 'Notice', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    readAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

NoticeReadSchema.index({ notice: 1, user: 1 }, { unique: true });

export const NoticeRead = mongoose.model<INoticeRead>('NoticeRead', NoticeReadSchema);
