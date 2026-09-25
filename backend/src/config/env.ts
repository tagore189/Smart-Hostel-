import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DEV_JWT_SECRET = 'slg_dev_only_jwt_secret_DO_NOT_USE_IN_PRODUCTION';

const getJwtSecret = (): string => {
  if (process.env.JWT_SECRET) {
    if ((process.env.NODE_ENV || 'development') === 'production' && process.env.JWT_SECRET.length < 32) {
      console.error('[FATAL] JWT_SECRET must be at least 32 characters in production.');
      process.exit(1);
    }
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

const nodeEnv = process.env.NODE_ENV || 'development';
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/slg_luxury_pg';
const clientUrl = process.env.CLIENT_URL || '*';
if (nodeEnv === 'production') {
  if (mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost')) {
    console.error('[FATAL] Configure a persistent cloud MongoDB URI in production.');
    process.exit(1);
  }
  if (!process.env.CLIENT_URL || clientUrl === '*') {
    console.error('[FATAL] Configure CLIENT_URL explicitly in production.');
    process.exit(1);
  }
}

export const env = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: nodeEnv,
  MONGODB_URI: mongoUri,
  JWT_SECRET: getJwtSecret(),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '30d',
  CLIENT_URL: clientUrl,
  HOSTEL_NAME: process.env.HOSTEL_NAME || 'SLG Luxury Ladies PG',
  HOSTEL_CITY: process.env.HOSTEL_CITY || 'Hyderabad',
  HOSTEL_LOCALITY: process.env.HOSTEL_LOCALITY || 'KPHB / Kukatpally',
  HOSTEL_STATE: process.env.HOSTEL_STATE || 'Telangana',
};
