import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/Theme';
import { AppHeader } from '../../components/AppHeader';
import { Card } from '../../components/Card';
import { api } from '../../services/api';
import { LoadingView, ErrorView } from '../../components/StateViews';

const { width } = Dimensions.get('window');

type ReportTab = 'FINANCIALS' | 'OCCUPANCY' | 'COMPLAINTS' | 'FOOD';

export default function AdminReportsScreen() {
  const [activeTab, setActiveTab] = useState<ReportTab>('FINANCIALS');

  const {
    data: reportData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const res = await api.get('/admin/reports');
      return res.data;
    },
  });

  const financials = reportData?.financials || {};
  const occupancy = reportData?.occupancy || {};
  const complaints = reportData?.complaints || {};
  const food = reportData?.food || {};

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader subtitle="Hostel Operations Reports" showBack />

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['FINANCIALS', 'OCCUPANCY', 'COMPLAINTS', 'FOOD'] as ReportTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
              {tab === 'FINANCIALS' ? 'Revenue' : tab === 'OCCUPANCY' ? 'Beds' : tab === 'COMPLAINTS' ? 'Tickets' : 'Mess'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <LoadingView message="Compiling real-time hostel analytics..." />
      ) : isError ? (
        <ErrorView error={error} onRetry={refetch} title="Failed to generate reports" />
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
          {/* TAB 1: FINANCIALS */}
          {activeTab === 'FINANCIALS' && (
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>Monthly Fee Collections</Text>

              <View style={styles.kpiRow}>
                <View style={[styles.kpiCard, { borderLeftColor: '#059669' }]}>
                  <Text style={styles.kpiLabel}>Collected</Text>
                  <Text style={[styles.kpiValue, { color: '#059669' }]}>
                    ₹{(financials.totalCollected || 0).toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.kpiSub}>Collection Rate: {financials.collectionRate || 0}%</Text>
                </View>

                <View style={[styles.kpiCard, { borderLeftColor: '#DC2626' }]}>
                  <Text style={styles.kpiLabel}>Pending / Dues</Text>
                  <Text style={[styles.kpiValue, { color: '#DC2626' }]}>
                    ₹{(financials.pendingAmount || 0).toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.kpiSub}>Outstanding rent</Text>
                </View>
              </View>

              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Payment Method Breakdown</Text>
              <Card>
                {financials.paymentMethods && Object.keys(financials.paymentMethods).length > 0 ? (
                  Object.entries(financials.paymentMethods).map(([method, amount]: [string, any]) => (
                    <View key={method} style={styles.breakdownRow}>
                      <View style={styles.methodInfo}>
                        <Ionicons
                          name={method.toLowerCase().includes('upi') ? 'qr-code' : method.toLowerCase().includes('cash') ? 'cash' : 'business'}
                          size={18}
                          color={Colors.primary}
                        />
                        <Text style={styles.methodName}>{method}</Text>
                      </View>
                      <Text style={styles.methodAmount}>₹{Number(amount).toLocaleString('en-IN')}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No payment transaction records found.</Text>
                )}
              </Card>
            </View>
          )}

          {/* TAB 2: OCCUPANCY */}
          {activeTab === 'OCCUPANCY' && (
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>Building Bed Capacity</Text>

              <View style={styles.kpiRow}>
                <View style={[styles.kpiCard, { borderLeftColor: Colors.primary }]}>
                  <Text style={styles.kpiLabel}>Total Residents</Text>
                  <Text style={styles.kpiValue}>{occupancy.totalResidents || 0}</Text>
                  <Text style={styles.kpiSub}>Active living</Text>
                </View>

                <View style={[styles.kpiCard, { borderLeftColor: '#2563EB' }]}>
                  <Text style={styles.kpiLabel}>Occupied Beds</Text>
                  <Text style={[styles.kpiValue, { color: '#2563EB' }]}>{occupancy.occupiedBeds || 0}</Text>
                  <Text style={styles.kpiSub}>of {occupancy.totalBeds || 0} total beds</Text>
                </View>

                <View style={[styles.kpiCard, { borderLeftColor: '#059669' }]}>
                  <Text style={styles.kpiLabel}>Vacant Beds</Text>
                  <Text style={[styles.kpiValue, { color: '#059669' }]}>{occupancy.availableBeds || 0}</Text>
                  <Text style={styles.kpiSub}>Available for check-in</Text>
                </View>
              </View>

              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Occupancy Floor by Floor</Text>
              <View style={styles.floorList}>
                {occupancy.occupancyByFloor &&
                  Object.entries(occupancy.occupancyByFloor).map(([fl, data]: [string, any]) => (
                    <Card key={fl} style={styles.floorCard}>
                      <View style={styles.floorHeader}>
                        <Text style={styles.floorName}>Floor {fl}</Text>
                        <Text style={styles.floorRatio}>{data.occupied}/{data.total} Beds Occupied</Text>
                      </View>
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressBar,
                            {
                              width: `${data.total > 0 ? Math.min(100, Math.round((data.occupied / data.total) * 100)) : 0}%`,
                            },
                          ]}
                        />
                      </View>
                      <View style={styles.floorFooter}>
                        <Text style={styles.floorSubText}>{data.residents} active residents</Text>
                        <Text style={styles.floorSubText}>{data.total - data.occupied} vacant beds</Text>
                      </View>
                    </Card>
                  ))}
              </View>
            </View>
          )}

          {/* TAB 3: COMPLAINTS */}
          {activeTab === 'COMPLAINTS' && (
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>Maintenance & Ticket Resolution</Text>

              <View style={styles.kpiRow}>
                <View style={[styles.kpiCard, { borderLeftColor: '#7C3AED' }]}>
                  <Text style={styles.kpiLabel}>Total Logged</Text>
                  <Text style={styles.kpiValue}>{complaints.total || 0}</Text>
                  <Text style={styles.kpiSub}>All-time tickets</Text>
                </View>

                <View style={[styles.kpiCard, { borderLeftColor: '#10B981' }]}>
                  <Text style={styles.kpiLabel}>Resolved / Closed</Text>
                  <Text style={[styles.kpiValue, { color: '#10B981' }]}>{complaints.resolved || 0}</Text>
                  <Text style={styles.kpiSub}>Completed</Text>
                </View>

                <View style={[styles.kpiCard, { borderLeftColor: '#F59E0B' }]}>
                  <Text style={styles.kpiLabel}>Open / In Progress</Text>
                  <Text style={[styles.kpiValue, { color: '#F59E0B' }]}>{complaints.pending || 0}</Text>
                  <Text style={styles.kpiSub}>Needs attention</Text>
                </View>
              </View>

              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Complaints by Category</Text>
              <Card>
                {complaints.byCategory && Object.keys(complaints.byCategory).length > 0 ? (
                  Object.entries(complaints.byCategory).map(([cat, count]: [string, any]) => (
                    <View key={cat} style={styles.breakdownRow}>
                      <Text style={styles.methodName}>{cat}</Text>
                      <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{count} issues</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No complaints recorded.</Text>
                )}
              </Card>
            </View>
          )}

          {/* TAB 4: FOOD */}
          {activeTab === 'FOOD' && (
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>Dining Hall Feedback</Text>

              <View style={styles.foodOverviewCard}>
                <View style={styles.starCircle}>
                  <Ionicons name="star" size={32} color="#F59E0B" />
                  <Text style={styles.avgRatingText}>{food.averageRating ?? 'No ratings yet'}</Text>
                </View>
                <View style={styles.foodOverviewInfo}>
                  <Text style={styles.foodTitle}>Overall Food Rating</Text>
                  <Text style={styles.foodReviews}>{food.totalReviews || 0} reviews submitted by residents</Text>
                  <Text style={styles.foodSub}>Based on hygiene, taste, and freshness</Text>
                </View>
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
  },
  tabBtnActive: {
    backgroundColor: Colors.primary,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  tabBtnTextActive: {
    color: '#FFF',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: 16,
    paddingBottom: 40,
  },
  sectionWrap: {},
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 12,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  kpiCard: {
    flex: 1,
    minWidth: (width - 32 - 16) / 2,
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    ...Shadows.card,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 4,
  },
  kpiSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  methodName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  methodAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  countBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 16,
  },
  floorList: { gap: 10 },
  floorCard: { padding: 14 },
  floorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  floorName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  floorRatio: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  floorFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  floorSubText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  foodOverviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 18,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 16,
    ...Shadows.card,
  },
  starCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avgRatingText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#92400E',
    marginTop: 2,
  },
  foodOverviewInfo: { flex: 1 },
  foodTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  foodReviews: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  foodSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
});
