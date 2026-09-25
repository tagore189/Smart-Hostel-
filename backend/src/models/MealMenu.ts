import mongoose, { Document, Schema } from 'mongoose';

export type MealType = 'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner';

export interface IMealMenu extends Document {
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  dateStr?: string; // e.g. "2026-09-24"
  mealType: MealType;
  items: string[];
  timing: string;
  isSpecial: boolean;
  specialTitle?: string;
  calories?: number;
  isVeg: boolean;
}

const MealMenuSchema = new Schema<IMealMenu>(
  {
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true,
      index: true,
    },
    dateStr: { type: String },
    mealType: {
      type: String,
      enum: ['Breakfast', 'Lunch', 'Snacks', 'Dinner'],
      required: true,
      index: true,
    },
    items: [{ type: String, required: true }],
    timing: { type: String, required: true },
    isSpecial: { type: Boolean, default: false },
    specialTitle: { type: String },
    calories: { type: Number },
    isVeg: { type: Boolean, default: true },
  },
  { timestamps: true }
);

MealMenuSchema.index({ dayOfWeek: 1, mealType: 1 }, { unique: true });

export const MealMenu = mongoose.model<IMealMenu>('MealMenu', MealMenuSchema);
