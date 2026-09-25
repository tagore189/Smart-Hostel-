import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getApiUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Production-safe default. Set EXPO_PUBLIC_API_URL explicitly per environment.
  return 'https://api.example.com/api';
};

export const API_BASE_URL = getApiUrl();

export const APP_CONFIG = {
  appName: 'SLG Luxury Ladies PG',
  tagline: 'Premium & Secure Coliving for Women',
  location: 'KPHB / Kukatpally, Hyderabad, Telangana',
  pincode: '500072',
  wardenPhone: '+91 98765 43210',
  securityPhone: '+91 98765 43211',
  supportEmail: 'support@slgluxurypg.com',
  apiUrl: API_BASE_URL,
};
