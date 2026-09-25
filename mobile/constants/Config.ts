import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getApiUrl = (): string => {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');
  if (configuredUrl) {
    if (process.env.EAS_BUILD_PROFILE === 'production' && !configuredUrl.startsWith('https://')) {
      throw new Error('Production builds require an HTTPS EXPO_PUBLIC_API_URL.');
    }
    return configuredUrl;
  }

  if (process.env.EAS_BUILD_PROFILE === 'production') {
    throw new Error('Set EXPO_PUBLIC_API_URL to the deployed HTTPS backend before a production build.');
  }
  return `${Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000'}/api`;
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
