import React, { useEffect, useState, createContext, useContext } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { getToken, getUserData, saveToken, saveUserData, clearAuthStorage } from '../services/storage';
import { api } from '../services/api';
import { Colors } from '../constants/Theme';

// ─── Auth Context ─────────────────────────────────────────────────────────
interface AuthContextType {
  user: any | null;
  resident: any | null;
  token: string | null;
  isLoading: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  devSignIn: (role?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  resident: null,
  token: null,
  isLoading: true,
  signIn: async () => {},
  devSignIn: async () => {},
  signOut: async () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 30_000 },
  },
});

// ─── Root Layout ──────────────────────────────────────────────────────────
export default function RootLayout() {
  const [user, setUser] = useState<any | null>(null);
  const [resident, setResident] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // Restore session on app launch
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await getToken();
        const storedUser = await getUserData();
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser.user || storedUser);
          setResident(storedUser.resident || null);
        }
      } catch (e) {
        console.warn('[Auth] Error restoring session:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Protect routes
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(resident)/home');
    }
  }, [user, segments, isLoading]);

  const signIn = async (identifier: string, password: string) => {
    const response = await api.post<any>('/auth/login', { identifier, password });
    if (response.success) {
      await saveToken(response.token);
      await saveUserData({ user: response.user, resident: response.resident });
      setToken(response.token);
      setUser(response.user);
      setResident(response.resident);
    } else {
      throw new Error(response.message || 'Login failed');
    }
  };

  const devSignIn = async (role: string = 'RESIDENT') => {
    const response = await api.post<any>('/auth/dev-login', { role });
    if (response.success) {
      await saveToken(response.token);
      await saveUserData({ user: response.user, resident: response.resident });
      setToken(response.token);
      setUser(response.user);
      setResident(response.resident);
    } else {
      throw new Error(response.message || 'Dev login failed');
    }
  };

  const signOut = async () => {
    await clearAuthStorage();
    setUser(null);
    setResident(null);
    setToken(null);
    queryClient.clear();
  };

  const refreshUser = async () => {
    try {
      const response = await api.get<any>('/auth/me');
      if (response.success) {
        setUser(response.user);
        setResident(response.resident);
        await saveUserData({ user: response.user, resident: response.resident });
      }
    } catch (e) {
      console.warn('[Auth] Error refreshing user:', e);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <AuthContext.Provider
      value={{ user, resident, token, isLoading, signIn, devSignIn, signOut, refreshUser }}
    >
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(resident)" />
        </Stack>
      </QueryClientProvider>
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
