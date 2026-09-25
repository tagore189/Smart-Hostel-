import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/Theme';
import { AppHeader } from '../../components/AppHeader';
import { api } from '../../services/api';
import { useAuth } from '../_layout';
import { LoadingView, ErrorView } from '../../components/StateViews';

const { width } = Dimensions.get('window');

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard');
      return res.data;
    },
  });

  const quickAccess = [
    { label: 'Residents', icon: 'people', route: '/(admin)/residents', color: '#7C3AED', bg: '#EDE9FE', desc: 'All registered residents' },
    { label: 'Floors & Rooms', icon: 'business', route: '/(admin)/rooms', color: '#2563EB', bg: '#DBEAFE', desc: 'Floor by floor bed matrix' },
    { label: 'Payments', icon: 'card', route: '/(admin)/payments', color: '#059669', bg: '#D1FAE5', desc: 'Rent records & dues' },
    { label: 'Food / Mess', icon: 'restaurant', route: '/(admin)/mess', color: '#EA580C', bg: '#FFEDD5', desc: 'Menu schedules & feedback' },
    { label: 'Complaints', icon: 'construct', route: '/(admin)/complaints', color: '#D97706', bg: '#FEF3C7', desc: 'Maintenance tickets' },
    { label: 'Notices', icon: 'megaphone', route: '/(admin)/notices', color: '#4F46E5', bg: '#E0E7FF', desc: 'Community broadcasts' },
    { label: 'Emergency', icon: 'alert-circle', route: '/(admin)/emergency', color: '#DC2626', bg: '#FEE2E2', desc: 'Live alerts & SOS' },
    { label: 'Staff Roster', icon: 'people-circle', route: '/(admin)/staff', color: '#0D9488', bg: '#CCFBF1', desc: 'Hostel team & shifts' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader subtitle="Admin Dashboard" showNotification={false} />

      {isLoading ? (
        <LoadingView message="Loading building overview..." />
      ) : isError ? (
        <ErrorView error={error} onRetry={refetch} title="Dashboard Unavailable" />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        >
          {/* Welcome & Admin Identity */}
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeLeft}>
              <Text style={styles.hostelTag}>SLG Luxury Ladies PG · KPHB</Text>
              <Text style={styles.welcomeName}>Welcome, {user?.name || 'Administrator'}</Text>
              <View style={styles.roleBadge}>
                <Ionicons name="shield-checkmark" size={12} color={Colors.primary} />
                <Text style={styles.roleText}>{user?.role || 'WARDEN'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={signOut} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Active Emergency Alert Banner */}
          {stats?.recentAlerts && stats.recentAlerts.length > 0 && stats.recentAlerts[0].status !== 'RESOLVED' && (
            <TouchableOpacity
              style={styles.emergencyBanner}
              onPress={() => router.push('/(admin)/emergency' as any)}
              activeOpacity={0.85}
            >
              <View style={styles.emergencyIconPulse}>
                <Ionicons name="warning" size={22} color="#DC2626" />
              </View>
              <View style={styles.emergencyTextWrap}>
                <Text style={styles.emergencyTitle}>Active Emergency Alert</Text>
                <Text style={styles.emergencyDesc}>
                  {stats.recentAlerts[0].residentName} (Room {stats.recentAlerts[0].roomNumber}) · Tap to review & respond
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#DC2626" />
            </TouchableOpacity>
          )}

          {/* Section 17: Core Building Statistics */}
          <Text style={styles.sectionTitle}>Overview & Key Metrics</Text>
          <View style={styles.statsGrid}>
            {/* Total Residents */}
            <TouchableOpacity
              style={[styles.statBox, { borderLeftColor: '#7C3AED' }]}
              onPress={() => router.push('/(admin)/residents' as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.statNumber}>{stats?.totalResidents ?? 0}</Text>
              <Text style={styles.statLabel}>Total Residents</Text>
            </TouchableOpacity>

            {/* Occupied Beds */}
            <TouchableOpacity
              style={[styles.statBox, { borderLeftColor: '#2563EB' }]}
              onPress={() => router.push('/(admin)/rooms' as any)}
              activeOpacity={0.8}
            >
              <Text style={[styles.statNumber, { color: '#2563EB' }]}>{stats?.occupiedBeds ?? 0}</Text>
              <Text style={styles.statLabel}>Occupied Beds</Text>
            </TouchableOpacity>

            {/* Vacant Beds */}
            <TouchableOpacity
              style={[styles.statBox, { borderLeftColor: '#059669' }]}
              onPress={() => router.push('/(admin)/rooms' as any)}
              activeOpacity={0.8}
            >
              <Text style={[styles.statNumber, { color: '#059669' }]}>{stats?.vacantBeds ?? stats?.availableBeds ?? 0}</Text>
              <Text style={styles.statLabel}>Vacant Beds</Text>
            </TouchableOpacity>

            {/* Fees Paid */}
            <TouchableOpacity
              style={[styles.statBox, { borderLeftColor: '#10B981' }]}
              onPress={() => router.push('/(admin)/payments' as any)}
              activeOpacity={0.8}
            >
              <Text style={[styles.statNumber, { color: '#10B981' }]}>{stats?.feesPaid ?? 0}</Text>
              <Text style={styles.statLabel}>Fees Paid</Text>
            </TouchableOpacity>

            {/* Fees Pending */}
            <TouchableOpacity
              style={[styles.statBox, { borderLeftColor: '#DC2626' }]}
              onPress={() => router.push('/(admin)/payments' as any)}
              activeOpacity={0.8}
            >
              <Text style={[styles.statNumber, { color: '#DC2626' }]}>{stats?.feesPending ?? stats?.pendingPayments ?? 0}</Text>
              <Text style={styles.statLabel}>Fees Pending</Text>
            </TouchableOpacity>

            {/* Open Complaints */}
            <TouchableOpacity
              style={[styles.statBox, { borderLeftColor: '#D97706' }]}
              onPress={() => router.push('/(admin)/complaints' as any)}
              activeOpacity={0.8}
            >
              <Text style={[styles.statNumber, { color: '#D97706' }]}>{stats?.openComplaints ?? 0}</Text>
              <Text style={styles.statLabel}>Open Complaints</Text>
            </TouchableOpacity>

            {/* Emergency Alerts */}
            <TouchableOpacity
              style={[styles.statBox, { borderLeftColor: (stats?.emergencyAlerts ?? 0) > 0 ? '#DC2626' : '#6B7280' }]}
              onPress={() => router.push('/(admin)/emergency' as any)}
              activeOpacity={0.8}
            >
              <Text style={[styles.statNumber, { color: (stats?.emergencyAlerts ?? 0) > 0 ? '#DC2626' : '#6B7280' }]}>
                {stats?.emergencyAlerts ?? 0}
              </Text>
              <Text style={styles.statLabel}>Emergency Alerts</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Access Navigation (Section 17) */}
          <Text style={styles.sectionTitle}>Hostel Management</Text>
          <View style={styles.quickAccessGrid}>
            {quickAccess.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.accessCard}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.75}
              >
                <View style={[styles.accessIconBox, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon as any} size={22} color={item.color} />
                </View>
                <View style={styles.accessTextWrap}>
                  <Text style={styles.accessLabel}>{item.label}</Text>
                  <Text style={styles.accessDesc}>{item.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: 16,
    paddingBottom: 40,
  },
  welcomeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 18,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    ...Shadows.card,
  },
  welcomeLeft: { flex: 1 },
  hostelTag: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  welcomeName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
    gap: 4,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  logoutBtn: {
    padding: 10,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: 16,
    gap: 12,
  },
  emergencyIconPulse: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyTextWrap: { flex: 1 },
  emergencyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
  },
  emergencyDesc: {
    fontSize: 12,
    color: '#991B1B',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    width: (width - 32 - 10) / 2,
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    ...Shadows.card,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  quickAccessGrid: {
    gap: 10,
  },
  accessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
    ...Shadows.card,
  },
  accessIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessTextWrap: { flex: 1 },
  accessLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  accessDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
