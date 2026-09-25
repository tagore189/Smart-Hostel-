import mongoose, { Document, Schema } from 'mongoose';

export interface IHostelSettings extends Document {
  hostelName: string;
  tagline: string;
  doorOrPlotNumber: string;
  streetName: string;
  locality: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phonePrimary: string;
  phoneWarden: string;
  phoneSecurity: string;
  emailContact: string;
  wifiSsidDefault: string;
  wifiPasswordDefault: string;
  upiPaymentId: string;
  upiReceiverName: string;
  standardMonthlyRent: number;
  securityDepositAmount: number;
  gateClosingTime: string;
  breakfastTiming: string;
  lunchTiming: string;
  dinnerTiming: string;
  rules: string[];
}

const HostelSettingsSchema = new Schema<IHostelSettings>(
  {
    hostelName: { type: String, default: 'SLG Luxury Ladies PG', required: true },
    tagline: { type: String, default: 'Premium & Secure Coliving for Women' },
    doorOrPlotNumber: { type: String, default: 'Plot No. 142 & 143' },
    streetName: { type: String, default: 'Road No. 2, Phase 1' },
    locality: { type: String, default: 'KPHB / Kukatpally', required: true },
    landmark: { type: String, default: 'Near KPHB Metro Station & Forum Sujana Mall' },
    city: { type: String, default: 'Hyderabad', required: true },
    state: { type: String, default: 'Telangana', required: true },
    pincode: { type: String, default: '500072' },
    country: { type: String, default: 'India' },
    phonePrimary: { type: String, default: '+91 98765 43210' },
    phoneWarden: { type: String, default: '+91 98765 43210' },
    phoneSecurity: { type: String, default: '+91 98765 43211' },
    emailContact: { type: String, default: 'support@slgluxurypg.com' },
    wifiSsidDefault: { type: String, default: 'Hostel_5G_Secured' },
    wifiPasswordDefault: { type: String, default: 'SLG@204Safe' },
    upiPaymentId: { type: String, default: 'slgluxurypg@icici' },
    upiReceiverName: { type: String, default: 'SLG Luxury Coliving Services' },
    standardMonthlyRent: { type: Number, default: 8000 },
    securityDepositAmount: { type: Number, default: 10000 },
    gateClosingTime: { type: String, default: '10:00 PM' },
    breakfastTiming: { type: String, default: '8:00 AM – 10:00 AM' },
    lunchTiming: { type: String, default: '12:30 PM – 2:30 PM' },
    dinnerTiming: { type: String, default: '7:30 PM – 9:30 PM' },
    rules: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

export const HostelSettings = mongoose.model<IHostelSettings>('HostelSettings', HostelSettingsSchema);
