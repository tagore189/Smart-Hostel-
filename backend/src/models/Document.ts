import mongoose, { Document, Schema } from 'mongoose';

export type DocumentType =
  | 'AADHAAR'
  | 'PAN'
  | 'COLLEGE_ID'
  | 'EMPLOYMENT_ID'
  | 'RENTAL_AGREEMENT'
  | 'POLICE_VERIFICATION'
  | 'OTHER';

export interface IDocument extends Document {
  resident: mongoose.Types.ObjectId;
  title: string;
  type: DocumentType;
  fileUrl: string;
  fileName: string;
  fileSize?: string;
  verified: boolean;
  uploadedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    resident: { type: Schema.Types.ObjectId, ref: 'Resident', required: true, index: true },
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ['AADHAAR', 'PAN', 'COLLEGE_ID', 'EMPLOYMENT_ID', 'RENTAL_AGREEMENT', 'POLICE_VERIFICATION', 'OTHER'],
      default: 'OTHER',
    },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: String, default: '1.2 MB' },
    verified: { type: Boolean, default: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const ResidentDocument = mongoose.model<IDocument>('Document', DocumentSchema);
