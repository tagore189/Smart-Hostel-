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

  // Restore and validate the secure session with the backend before routing.
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await getToken();
        if (!storedToken) return;

        setToken(storedToken);
        const response = await api.get<any>('/auth/me');
        if (!response?.success || !response.user) {
          throw new Error('Session is no longer valid');
        }
        setUser(response.user);
        setResident(response.resident || null);
        await saveUserData({ user: response.user, resident: response.resident || null });
      } catch (e) {
        const statusCode = e && typeof e === 'object' && 'statusCode' in e ? (e as any).statusCode : undefined;
        if (statusCode === 0 || statusCode === 408) {
          // Keep the encrypted session for a temporary outage; protected API calls
          // still require backend authorization before returning private data.
          const storedUser = await getUserData();
          setUser(storedUser?.user || null);
          setResident(storedUser?.resident || null);
        } else {
          await clearAuthStorage();
          setToken(null);
          setUser(null);
          setResident(null);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Protect routes with role-based routing
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAdminGroup = (segments[0] as string) === '(admin)';
    const inResidentGroup = (segments[0] as string) === '(resident)';

    if (!user) {
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
      return;
    }

    const isAdminRole = ['ADMIN', 'WARDEN', 'SUPER_ADMIN'].includes(user.role);

    // If authenticated user lands in (auth) group, redirect based on role
    if (inAuthGroup) {
      if (isAdminRole) {
        router.replace('/(admin)/dashboard' as any);
      } else {
        router.replace('/(resident)/home');
      }
      return;
    }

    // Role protection: Residents can NEVER access (admin) screens
    if (!isAdminRole && inAdminGroup) {
      router.replace('/(resident)/home');
      return;
    }

    // Role protection: Admins/Wardens without resident profile entering resident routes redirect to admin dashboard
    if (isAdminRole && inResidentGroup) {
      router.replace('/(admin)/dashboard' as any);
      return;
    }
  }, [user, resident, segments, isLoading]);

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
      if (e instanceof Error && 'statusCode' in e && (e as any).statusCode === 401) {
        await clearAuthStorage();
        setUser(null);
        setResident(null);
        setToken(null);
        queryClient.clear();
      }
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
          <Stack.Screen name="(admin)" />
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
