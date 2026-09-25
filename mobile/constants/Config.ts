import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getDevApiUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // If running via Expo Go on physical device, resolve hostUri if available
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:5000/api`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }

  return 'http://127.0.0.1:5000/api';
};

export const API_BASE_URL = getDevApiUrl();

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
