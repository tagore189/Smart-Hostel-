import mongoose, { Document, Schema } from 'mongoose';

export interface IBuilding extends Document {
  name: string;
  address: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  totalFloors: number;
}

const BuildingSchema = new Schema<IBuilding>(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    locality: { type: String, default: 'KPHB / Kukatpally' },
    city: { type: String, default: 'Hyderabad' },
    state: { type: String, default: 'Telangana' },
    pincode: { type: String, default: '500072' },
    totalFloors: { type: Number, default: 4 },
  },
  { timestamps: true }
);

export const Building = mongoose.model<IBuilding>('Building', BuildingSchema);
