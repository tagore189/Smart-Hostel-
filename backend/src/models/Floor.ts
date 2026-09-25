import mongoose, { Document, Schema } from 'mongoose';

export interface IFloor extends Document {
  building: mongoose.Types.ObjectId;
  floorNumber: number;
  name: string;
  totalRooms: number;
}

const FloorSchema = new Schema<IFloor>(
  {
    building: { type: Schema.Types.ObjectId, ref: 'Building', required: true },
    floorNumber: { type: Number, required: true },
    name: { type: String, required: true },
    totalRooms: { type: Number, default: 8 },
  },
  { timestamps: true }
);

export const Floor = mongoose.model<IFloor>('Floor', FloorSchema);
