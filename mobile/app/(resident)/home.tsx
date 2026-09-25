import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors, Typography, Spacing, Shadows, BorderRadius } from '../../constants/Theme';
import { AppHeader } from '../../components/AppHeader';
import { Card } from '../../components/Card';
import { useAuth } from '../_layout';
import { api } from '../../services/api';

const { width } = Dimensions.get('window');

interface QuickAction {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: string;
  gradient: string;
  bgColor: string;
}

const quickActions: QuickAction[] = [
  { icon: 'card', label: 'Payments', route: '/(resident)/payments', gradient: Colors.primary, bgColor: Colors.primaryLight },
  { icon: 'restaurant', label: 'Mess & Food', route: '/(resident)/mess', gradient: '#10B981', bgColor: '#D1FAE5' },
  { icon: 'construct', label: 'Complaints', route: '/(resident)/complaints', gradient: '#F59E0B', bgColor: '#FEF3C7' },
  { icon: 'warning', label: 'Emergency', route: '/(resident)/emergency', gradient: '#EF4444', bgColor: '#FEE2E2' },
];

export default function HomeScreen() {
  const { user, resident } = useAuth();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const { data: dashData, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await api.get('/residents/dashboard');
      return res.data || res;
    },
  });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const firstName = user?.name?.split(' ')[0] || 'Resident';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader subtitle="Home" />
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
        {/* Greeting Section */}
        <Animated.View style={[styles.greetingSection, { opacity: fadeAnim }]}>
          <View style={styles.greetingCard}>
            <View style={styles.greetingLeft}>
              <Text style={styles.greetingText}>{getGreeting()},</Text>
              <Text style={styles.userName}>{firstName} ✨</Text>
              <View style={styles.roomBadge}>
                <Ionicons name="bed-outline" size={14} color={Colors.primary} />
                <Text style={styles.roomBadgeText}>
                  Room {resident?.roomNumber || '—'} · Bed {resident?.bedCode || resident?.bedNumber || '—'}
                </Text>
              </View>
            </View>
            <Image
              source={require('../../assets/ananya.jpg')}
              style={styles.greetingAvatar}
            />
          </View>
        </Animated.View>

        {/* Quick Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: Colors.primaryLight }]}>
            <Ionicons name="calendar" size={20} color={Colors.primary} />
            <Text style={styles.statValue}>
              {resident?.joiningDate || resident?.moveInDate
                ? `${Math.max(1, Math.ceil((Date.now() - new Date(resident.joiningDate || resident.moveInDate).getTime()) / 86400000))} days`
                : '258 days'}
            </Text>
            <Text style={styles.statLabel}>Your Stay</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.statValue}>Active</Text>
            <Text style={styles.statLabel}>Status</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="receipt" size={20} color="#F59E0B" />
            <Text style={styles.statValue}>₹{(resident?.monthlyRent || resident?.rentAmount || 8000).toLocaleString('en-IN')}</Text>
            <Text style={styles.statLabel}>Monthly Rent</Text>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionCard}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBox, { backgroundColor: action.bgColor }]}>
                <Ionicons name={action.icon} size={24} color={action.gradient} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Upcoming Payment Banner */}
        <Card variant="lavender" style={styles.paymentBanner}>
          <View style={styles.bannerRow}>
            <View style={styles.bannerLeft}>
              <View style={styles.bannerIconCircle}>
                <Ionicons name="card" size={22} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.bannerTitle}>Rent Due</Text>
                <Text style={styles.bannerSubtitle}>
                  ₹{(resident?.monthlyRent || resident?.rentAmount || 8000).toLocaleString('en-IN')} · 1st of month
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.payNowButton}
              onPress={() => router.push('/(resident)/payments')}
              activeOpacity={0.85}
            >
              <Text style={styles.payNowText}>Pay Now</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Hostel Info */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={18} color={Colors.primary} />
            <Text style={styles.infoText}>KPHB / Kukatpally, Hyderabad, Telangana</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call" size={18} color={Colors.success} />
            <Text style={styles.infoText}>Warden: +91 98765 43210</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark" size={18} color={Colors.warning} />
            <Text style={styles.infoText}>Security: +91 98765 43211</Text>
          </View>
        </Card>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.gutter,
    paddingBottom: 32,
  },
  greetingSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  greetingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  greetingLeft: {
    flex: 1,
  },
  greetingText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
    letterSpacing: -0.3,
  },
  roomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  roomBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  greetingAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    marginLeft: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    width: (width - 32 - 12) / 2,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  paymentBanner: {
    marginBottom: 16,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  bannerIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  payNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  payNowText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoCard: {
    marginBottom: 0,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
});
