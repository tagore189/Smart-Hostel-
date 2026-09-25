import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/slg_luxury_pg',
  JWT_SECRET: process.env.JWT_SECRET || 'slg_super_secure_jwt_secret_dev_2026_ladies_pg_kphb',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '30d',
  CLIENT_URL: process.env.CLIENT_URL || '*',
  HOSTEL_NAME: process.env.HOSTEL_NAME || 'SLG Luxury Ladies PG',
  HOSTEL_CITY: process.env.HOSTEL_CITY || 'Hyderabad',
  HOSTEL_LOCALITY: process.env.HOSTEL_LOCALITY || 'KPHB / Kukatpally',
  HOSTEL_STATE: process.env.HOSTEL_STATE || 'Telangana',
};
