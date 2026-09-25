import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'slg_auth_token';
const USER_KEY = 'slg_auth_user';

// In-memory fallback for web/testing environment where SecureStore is unsupported
let memoryStorage: Record<string, string> = {};

export const saveToken = async (token: string): Promise<void> => {
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      memoryStorage[TOKEN_KEY] = token;
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(TOKEN_KEY, token);
      }
    }
  } catch (error) {
    console.warn('[Storage] Error saving token to SecureStore:', error);
    memoryStorage[TOKEN_KEY] = token;
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS !== 'web') {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } else {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(TOKEN_KEY) || memoryStorage[TOKEN_KEY] || null;
      }
      return memoryStorage[TOKEN_KEY] || null;
    }
  } catch (error) {
    console.warn('[Storage] Error reading token from SecureStore:', error);
    return memoryStorage[TOKEN_KEY] || null;
  }
};

export const removeToken = async (): Promise<void> => {
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
    delete memoryStorage[TOKEN_KEY];
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (error) {
    console.warn('[Storage] Error deleting token:', error);
    delete memoryStorage[TOKEN_KEY];
  }
};

export const saveUserData = async (userData: any): Promise<void> => {
  try {
    const jsonStr = JSON.stringify(userData);
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(USER_KEY, jsonStr);
    } else {
      memoryStorage[USER_KEY] = jsonStr;
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(USER_KEY, jsonStr);
      }
    }
  } catch (error) {
    console.warn('[Storage] Error saving user data:', error);
  }
};

export const getUserData = async (): Promise<any | null> => {
  try {
    let jsonStr: string | null = null;
    if (Platform.OS !== 'web') {
      jsonStr = await SecureStore.getItemAsync(USER_KEY);
    } else {
      if (typeof window !== 'undefined' && window.localStorage) {
        jsonStr = localStorage.getItem(USER_KEY);
      }
      if (!jsonStr) jsonStr = memoryStorage[USER_KEY] || null;
    }
    return jsonStr ? JSON.parse(jsonStr) : null;
  } catch (error) {
    return null;
  }
};

export const clearAuthStorage = async (): Promise<void> => {
  await removeToken();
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync(USER_KEY);
    }
    delete memoryStorage[USER_KEY];
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(USER_KEY);
    }
  } catch (e) {}
};
