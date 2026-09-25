import mongoose, { Document, Schema } from 'mongoose';

export interface IMealFeedback extends Document {
  resident: mongoose.Types.ObjectId;
  residentName: string;
  mealType: string;
  dateStr: string;
  rating: number; // 1 to 5
  tasteRating?: number;
  hygieneRating?: number;
  comment?: string;
  createdAt: Date;
}

const MealFeedbackSchema = new Schema<IMealFeedback>(
  {
    resident: { type: Schema.Types.ObjectId, ref: 'Resident', required: true, index: true },
    residentName: { type: String, required: true },
    mealType: { type: String, required: true },
    dateStr: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    tasteRating: { type: Number, min: 1, max: 5 },
    hygieneRating: { type: Number, min: 1, max: 5 },
    comment: { type: String },
  },
  { timestamps: true }
);

export const MealFeedback = mongoose.model<IMealFeedback>('MealFeedback', MealFeedbackSchema);
