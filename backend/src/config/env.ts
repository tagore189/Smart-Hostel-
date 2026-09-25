import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DEV_JWT_SECRET = 'slg_dev_only_jwt_secret_DO_NOT_USE_IN_PRODUCTION';

const getJwtSecret = (): string => {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv === 'production') {
    console.error('[FATAL] JWT_SECRET environment variable is required in production.');
    console.error('[FATAL] Set JWT_SECRET in your .env file or environment variables.');
    process.exit(1);
  }
  console.warn('[Security] Using development JWT secret. Do NOT use this in production.');
  return DEV_JWT_SECRET;
};

export const env = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/slg_luxury_pg',
  JWT_SECRET: getJwtSecret(),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '30d',
  CLIENT_URL: process.env.CLIENT_URL || '*',
  HOSTEL_NAME: process.env.HOSTEL_NAME || 'SLG Luxury Ladies PG',
  HOSTEL_CITY: process.env.HOSTEL_CITY || 'Hyderabad',
  HOSTEL_LOCALITY: process.env.HOSTEL_LOCALITY || 'KPHB / Kukatpally',
  HOSTEL_STATE: process.env.HOSTEL_STATE || 'Telangana',
};
