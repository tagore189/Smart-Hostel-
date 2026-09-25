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
import { Colors, Spacing, Shadows, BorderRadius } from '../../constants/Theme';
import { AppHeader } from '../../components/AppHeader';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../_layout';
import { api } from '../../services/api';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user, resident } = useAuth();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 1. Dashboard query
  const {
    data: dashData,
    refetch: refetchDash,
    isRefetching: isDashRefetching,
  } = useQuery({
    queryKey: ['resident-dashboard'],
    queryFn: async () => {
      const res = await api.get('/residents/dashboard');
      return res.data;
    },
  });

  // 2. Payments Overview query (real fee status)
  const {
    data: paymentOverview,
    refetch: refetchPayments,
  } = useQuery({
    queryKey: ['payments-overview'],
    queryFn: async () => {
      const res = await api.get('/payments/overview');
      return res.data;
    },
  });

  // 3. Today's Mess Menu query (real meals data)
  const {
    data: todayMess,
    refetch: refetchMess,
  } = useQuery({
    queryKey: ['mess-today'],
    queryFn: async () => {
      const res = await api.get('/mess/today');
      return res.data;
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

  const handleRefreshAll = () => {
    refetchDash();
    refetchPayments();
    refetchMess();
  };

  const firstName = user?.name?.split(' ')[0] || resident?.name?.split(' ')[0] || 'Resident';
  const monthlyRent = paymentOverview?.monthlyRent ?? resident?.monthlyRent;
  const currentStatus = paymentOverview?.currentStatus || 'NO_RECORD';
  const isPaid = currentStatus === 'PAID';
  const mealsList = todayMess?.meals || [];

  const quickActions = [
    { label: 'Food', icon: 'restaurant', route: '/(resident)/mess', color: '#EA580C', bg: '#FFEDD5' },
    { label: 'Fees', icon: 'card', route: '/(resident)/payments', color: '#059669', bg: '#D1FAE5' },
    { label: 'Complaint', icon: 'construct', route: '/(resident)/complaints', color: '#D97706', bg: '#FEF3C7' },
    { label: 'Notices', icon: 'megaphone', route: '/(resident)/notices', color: '#4F46E5', bg: '#E0E7FF' },
    { label: 'Emergency', icon: 'alert-circle', route: '/(resident)/emergency', color: '#DC2626', bg: '#FEE2E2' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader subtitle="Home" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isDashRefetching}
            onRefresh={handleRefreshAll}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Section 7: Greeting Header */}
        <Animated.View style={[styles.greetingSection, { opacity: fadeAnim }]}>
          <View style={styles.greetingCard}>
            <View style={styles.greetingLeft}>
              <Text style={styles.greetingText}>{getGreeting()},</Text>
              <Text style={styles.userName}>{firstName} ✨</Text>
              <View style={styles.roomBadge}>
                <Ionicons name="bed-outline" size={14} color="#FFF" />
                <Text style={styles.roomBadgeText}>
                  {resident?.roomNumber ? `Room ${resident.roomNumber}` : 'Room unassigned'} · {resident?.bedCode ? `Bed ${resident.bedCode}` : 'Bed unassigned'} · {resident?.floorNumber ? `Floor ${resident.floorNumber}` : 'Floor unassigned'}
                </Text>
              </View>
            </View>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {firstName.substring(0, 2).toUpperCase()}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Section 7: Monthly Fee Card */}
        <View style={styles.feeBannerCard}>
          <View style={styles.feeBannerLeft}>
            <Text style={styles.feeBannerLabel}>Monthly Fee</Text>
            <Text style={styles.feeBannerAmount}>{monthlyRent == null ? 'Fee not set' : `₹${monthlyRent.toLocaleString('en-IN')}`}</Text>
            <Text style={styles.feeBannerMonth}>
              {paymentOverview?.currentMonth || 'Current Billing Cycle'}
            </Text>
          </View>
          <View style={styles.feeBannerRight}>
            <View style={[styles.statusPill, isPaid ? styles.pillPaid : styles.pillPending]}>
              <Ionicons
                name={isPaid ? 'checkmark-circle' : 'time'}
                size={14}
                color={isPaid ? '#059669' : '#DC2626'}
              />
              <Text style={[styles.statusPillText, isPaid ? styles.textPaid : styles.textPending]}>
                {currentStatus}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.viewPaymentsBtn}
              onPress={() => router.push('/(resident)/payments')}
            >
              <Text style={styles.viewPaymentsText}>Receipts →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 7: Quick Actions Grid */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
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
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Section 7: Today's Food Section */}
        <View style={styles.foodSectionHeader}>
          <Text style={styles.sectionTitle}>Today's Food</Text>
          <TouchableOpacity onPress={() => router.push('/(resident)/mess')}>
            <Text style={styles.seeWeeklyText}>Weekly Menu →</Text>
          </TouchableOpacity>
        </View>

        {mealsList.length > 0 ? (
          <View style={styles.mealsContainer}>
            {mealsList.map((meal: any) => (
              <Card key={meal._id || meal.mealType} style={styles.mealCard}>
                <View style={styles.mealCardHeader}>
                  <View style={styles.mealTypeRow}>
                    <Ionicons
                      name={
                        meal.mealType === 'Breakfast'
                          ? 'sunny'
                          : meal.mealType === 'Lunch'
                          ? 'restaurant'
                          : meal.mealType === 'Snacks'
                          ? 'cafe'
                          : 'moon'
                      }
                      size={16}
                      color={Colors.primary}
                    />
                    <Text style={styles.mealTypeTitle}>{meal.mealType}</Text>
                  </View>
                  <Text style={styles.mealTiming}>{meal.timing}</Text>
                </View>

                <Text style={styles.mealItemsText}>
                  {Array.isArray(meal.items) ? meal.items.join(' · ') : meal.items}
                </Text>
              </Card>
            ))}
          </View>
        ) : (
          <Card style={styles.mealCard}>
            <View style={styles.mealTypeRow}>
              <Ionicons name="restaurant" size={16} color={Colors.primary} />
              <Text style={styles.mealTypeTitle}>Dining Schedule</Text>
            </View>
            <Text style={styles.mealItemsText}>
              Meal times and today's menu are shown when published by hostel management.
            </Text>
          </Card>
        )}

        {/* Prominent Emergency Assistance Safety Banner */}
        <TouchableOpacity
          style={styles.sosBanner}
          onPress={() => router.push('/(resident)/emergency')}
          activeOpacity={0.85}
        >
          <View style={styles.sosIconBox}>
            <Ionicons name="warning" size={24} color="#FFF" />
          </View>
          <View style={styles.sosTextWrap}>
            <Text style={styles.sosTitle}>Emergency / SOS</Text>
            <Text style={styles.sosSub}>Immediate warden & security assistance</Text>
          </View>
          <View style={styles.sosActionPill}>
            <Text style={styles.sosActionText}>HELP</Text>
          </View>
        </TouchableOpacity>

        {/* Hostel Location Info */}
        <View style={styles.hostelInfoCard}>
          <Ionicons name="location" size={16} color={Colors.primary} />
          <Text style={styles.hostelInfoText}>
            SLG Luxury Ladies PG · KPHB / Kukatpally, Hyderabad
          </Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.gutter,
    paddingBottom: 32,
  },
  greetingSection: {
    marginTop: 14,
    marginBottom: 14,
  },
  greetingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    padding: 18,
    ...Shadows.card,
  },
  greetingLeft: { flex: 1 },
  greetingText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 2,
    marginBottom: 8,
  },
  roomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
  },
  roomBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
  },
  feeBannerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 18,
    ...Shadows.card,
  },
  feeBannerLeft: { flex: 1 },
  feeBannerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  feeBannerAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 2,
  },
  feeBannerMonth: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  feeBannerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  pillPaid: { backgroundColor: '#D1FAE5' },
  pillPending: { backgroundColor: '#FEE2E2' },
  statusPillText: { fontSize: 12, fontWeight: '800' },
  textPaid: { color: '#059669' },
  textPending: { color: '#DC2626' },
  viewPaymentsBtn: {
    paddingVertical: 2,
  },
  viewPaymentsText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 10,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionCard: {
    alignItems: 'center',
    flex: 1,
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
  },
  foodSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  seeWeeklyText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  mealsContainer: {
    gap: 8,
    marginBottom: 16,
  },
  mealCard: {
    padding: 12,
  },
  mealCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  mealTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mealTypeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  mealTiming: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  mealItemsText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  sosBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: BorderRadius.lg,
    padding: 14,
    marginBottom: 14,
    gap: 12,
    ...Shadows.card,
  },
  sosIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosTextWrap: { flex: 1 },
  sosTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
  },
  sosSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 1,
  },
  sosActionPill: {
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  sosActionText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#DC2626',
  },
  hostelInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  hostelInfoText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
