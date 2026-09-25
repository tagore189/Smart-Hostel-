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
import { Card } from '../../components/Card';
import { api } from '../../services/api';
import { useAuth } from '../_layout';
import { LoadingView, ErrorView } from '../../components/StateViews';

const { width } = Dimensions.get('window');
const actionCardWidth = (width - 32 - 12) / 3;

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

  const quickActions = [
    { label: 'Residents', icon: 'people', route: '/(admin)/residents', color: '#7C3AED', bg: '#EDE9FE', count: stats?.totalResidents },
    { label: 'Rooms & Beds', icon: 'business', route: '/(admin)/rooms', color: '#2563EB', bg: '#DBEAFE', count: `${stats?.occupiedBeds || 0}/${stats?.totalBeds || 0}` },
    { label: 'Payments', icon: 'card', route: '/(admin)/payments', color: '#059669', bg: '#D1FAE5', count: stats?.pendingPayments ? `${stats.pendingPayments} Due` : 'Clear' },
    { label: 'Complaints', icon: 'construct', route: '/(admin)/complaints', color: '#D97706', bg: '#FEF3C7', count: stats?.openComplaints ? `${stats.openComplaints} Open` : '0' },
    { label: 'Outings', icon: 'walk', route: '/(admin)/outings', color: '#9333EA', bg: '#F3E8FF', count: stats?.todaysOutings ? `${stats.todaysOutings} Today` : '0' },
    { label: 'Visitors', icon: 'person-add', route: '/(admin)/visitors', color: '#0D9488', bg: '#CCFBF1', count: stats?.todaysVisitors ? `${stats.todaysVisitors} Today` : '0' },
    { label: 'Mess & Menu', icon: 'restaurant', route: '/(admin)/mess', color: '#EA580C', bg: '#FFEDD5', count: 'Active' },
    { label: 'Notices', icon: 'megaphone', route: '/(admin)/notices', color: '#4F46E5', bg: '#E0E7FF', count: 'Broadcast' },
    { label: 'Emergency', icon: 'alert-circle', route: '/(admin)/emergency', color: '#DC2626', bg: '#FEE2E2', count: stats?.recentAlerts?.length ? `${stats.recentAlerts.length} Alerts` : 'Safe' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader subtitle="Hostel Operations Console" showNotification={false} />

      {isLoading ? (
        <LoadingView message="Loading operational dashboard..." />
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
          {/* Welcome & Role Card */}
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeLeft}>
              <Text style={styles.welcomeGreeting}>Welcome back,</Text>
              <Text style={styles.welcomeName}>{user?.name || 'Administrator'}</Text>
              <View style={styles.roleBadge}>
                <Ionicons name="shield-checkmark" size={12} color={Colors.primary} />
                <Text style={styles.roleText}>{user?.role || 'WARDEN'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
              <Ionicons name="log-out-outline" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Emergency Alert Banner (if any recent alerts) */}
          {stats?.recentAlerts && stats.recentAlerts.length > 0 && (
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
                  {stats.recentAlerts[0].residentName} (Room {stats.recentAlerts[0].roomNumber}) · Tap to review
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#DC2626" />
            </TouchableOpacity>
          )}

          {/* Key Metrics Overview */}
          <Text style={styles.sectionTitle}>Hostel Capacity & Occupancy</Text>
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { borderLeftColor: Colors.primary }]}>
              <Text style={styles.kpiValue}>{stats?.totalResidents ?? 0}</Text>
              <Text style={styles.kpiLabel}>Total Residents</Text>
              <Text style={styles.kpiSub}>Active stays</Text>
            </View>

            <View style={[styles.kpiCard, { borderLeftColor: '#2563EB' }]}>
              <Text style={styles.kpiValue}>{stats?.occupancyRate ?? 0}%</Text>
              <Text style={styles.kpiLabel}>Occupancy Rate</Text>
              <Text style={styles.kpiSub}>{stats?.occupiedBeds ?? 0} of {stats?.totalBeds ?? 0} beds</Text>
            </View>

            <View style={[styles.kpiCard, { borderLeftColor: '#059669' }]}>
              <Text style={styles.kpiValue}>{stats?.availableBeds ?? 0}</Text>
              <Text style={styles.kpiLabel}>Available Beds</Text>
              <Text style={styles.kpiSub}>Ready for move-in</Text>
            </View>
          </View>

          {/* Action Center Grid */}
          <Text style={styles.sectionTitle}>Operations & Management</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.actionCard}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.75}
              >
                <View style={[styles.actionIconBox, { backgroundColor: action.bg }]}>
                  <Ionicons name={action.icon as any} size={22} color={action.color} />
                </View>
                <Text style={styles.actionLabel} numberOfLines={1}>{action.label}</Text>
                <Text style={[styles.actionCount, { color: action.color }]} numberOfLines={1}>
                  {action.count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Important Attention Items */}
          <Text style={styles.sectionTitle}>Pending Approvals & Attention</Text>
          <View style={styles.attentionGrid}>
            <TouchableOpacity
              style={styles.attentionCard}
              onPress={() => router.push('/(admin)/complaints' as any)}
            >
              <View style={styles.attentionIcon}>
                <Ionicons name="construct-outline" size={20} color="#D97706" />
              </View>
              <View style={styles.attentionTextWrap}>
                <Text style={styles.attentionNum}>{stats?.openComplaints ?? 0}</Text>
                <Text style={styles.attentionLabel}>Open Complaints</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.attentionCard}
              onPress={() => router.push('/(admin)/payments' as any)}
            >
              <View style={styles.attentionIcon}>
                <Ionicons name="cash-outline" size={20} color="#DC2626" />
              </View>
              <View style={styles.attentionTextWrap}>
                <Text style={styles.attentionNum}>{(stats?.pendingPayments ?? 0) + (stats?.overduePayments ?? 0)}</Text>
                <Text style={styles.attentionLabel}>Pending Dues</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.attentionCard}
              onPress={() => router.push('/(admin)/outings' as any)}
            >
              <View style={styles.attentionIcon}>
                <Ionicons name="walk-outline" size={20} color="#7C3AED" />
              </View>
              <View style={styles.attentionTextWrap}>
                <Text style={styles.attentionNum}>{stats?.todaysOutings ?? 0}</Text>
                <Text style={styles.attentionLabel}>Today's Outings</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.attentionCard}
              onPress={() => router.push('/(admin)/visitors' as any)}
            >
              <View style={styles.attentionIcon}>
                <Ionicons name="people-outline" size={20} color="#0D9488" />
              </View>
              <View style={styles.attentionTextWrap}>
                <Text style={styles.attentionNum}>{stats?.todaysVisitors ?? 0}</Text>
                <Text style={styles.attentionLabel}>Today's Visitors</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
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
    padding: 16,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    ...Shadows.sm,
  },
  welcomeLeft: { flex: 1 },
  welcomeGreeting: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  welcomeName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
    marginTop: 1,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    padding: 14,
    borderRadius: BorderRadius.md,
    marginBottom: 16,
    gap: 12,
  },
  emergencyIconPulse: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyTextWrap: { flex: 1 },
  emergencyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
  },
  emergencyDesc: {
    fontSize: 12,
    color: '#B91C1C',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    ...Shadows.sm,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  kpiSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  actionCard: {
    width: actionCardWidth,
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    ...Shadows.sm,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  actionCount: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  attentionGrid: {
    gap: 10,
  },
  attentionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  attentionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attentionTextWrap: { flex: 1 },
  attentionNum: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  attentionLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
});
