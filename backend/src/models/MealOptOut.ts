import mongoose, { Document, Schema } from 'mongoose';

export interface IMealOptOut extends Document {
  resident: mongoose.Types.ObjectId;
  residentName: string;
  roomNumber: string;
  dateStr: string;
  mealType: string;
  reason?: string;
}

const MealOptOutSchema = new Schema<IMealOptOut>(
  {
    resident: { type: Schema.Types.ObjectId, ref: 'Resident', required: true, index: true },
    residentName: { type: String, required: true },
    roomNumber: { type: String, required: true },
    dateStr: { type: String, required: true },
    mealType: { type: String, required: true },
    reason: { type: String },
  },
  { timestamps: true }
);

MealOptOutSchema.index({ resident: 1, dateStr: 1, mealType: 1 }, { unique: true });

export const MealOptOut = mongoose.model<IMealOptOut>('MealOptOut', MealOptOutSchema);
