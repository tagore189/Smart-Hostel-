import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/Theme';
import { AppHeader } from '../../components/AppHeader';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { api } from '../../services/api';
import { LoadingView, EmptyView, ErrorView } from '../../components/StateViews';

export default function AdminPaymentsScreen() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'OVERDUE'>('ALL');
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);

  const {
    data: payments,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['admin-payments', search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      const res = await api.get(`/admin/payments?${params.toString()}`);
      return (res.data || []) as any[];
    },
  });

  const paymentList = payments || [];

  // Calculate summaries
  const totalCollected = paymentList
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalPending = paymentList
    .filter((p) => p.status === 'PENDING' || p.status === 'OVERDUE')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader subtitle="Hostel Rent & Fee Records" showBack />

      {/* Revenue Stats Banner */}
      <View style={styles.statsBanner}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Collected (Filtered)</Text>
          <Text style={[styles.statValue, { color: '#059669' }]}>₹{totalCollected.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Pending / Overdue</Text>
          <Text style={[styles.statValue, { color: '#DC2626' }]}>₹{totalPending.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by resident, room, or receipt #..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Row */}
      <View style={styles.filterRow}>
        {(['ALL', 'PAID', 'PENDING', 'OVERDUE'] as const).map((st) => (
          <TouchableOpacity
            key={st}
            style={[styles.filterChip, statusFilter === st && styles.filterChipActive]}
            onPress={() => setStatusFilter(st)}
          >
            <Text style={[styles.filterChipText, statusFilter === st && styles.filterChipTextActive]}>
              {st}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Payment List */}
      {isLoading ? (
        <LoadingView message="Loading payment transactions..." />
      ) : isError ? (
        <ErrorView error={error} onRetry={refetch} title="Failed to load payments" />
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
          {paymentList.length > 0 ? (
            paymentList.map((p) => (
              <TouchableOpacity
                key={p._id}
                style={styles.paymentCardWrapper}
                onPress={() => setSelectedPayment(p)}
                activeOpacity={0.75}
              >
                <Card>
                  <View style={styles.paymentHeader}>
                    <View style={styles.iconCircle}>
                      <Ionicons
                        name={p.status === 'PAID' ? 'checkmark-circle' : 'time'}
                        size={22}
                        color={p.status === 'PAID' ? '#059669' : '#DC2626'}
                      />
                    </View>
                    <View style={styles.headerInfo}>
                      <Text style={styles.residentName}>{p.residentName || 'Resident'}</Text>
                      <Text style={styles.roomSub}>
                        Room {p.roomNumber || '—'} · Month of {p.month || 'Current'}
                      </Text>
                    </View>
                    <View style={styles.amountCol}>
                      <Text style={styles.amountText}>₹{(p.amount || 0).toLocaleString('en-IN')}</Text>
                      <StatusBadge status={p.status} />
                    </View>
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.paymentMeta}>
                    <Text style={styles.metaText}>
                      Receipt: <Text style={styles.metaVal}>{p.receiptNumber || 'N/A'}</Text>
                    </Text>
                    <Text style={styles.metaText}>
                      Method: <Text style={styles.metaVal}>{p.paymentMethod || 'UPI'}</Text>
                    </Text>
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          ) : (
            <EmptyView
              icon="card-outline"
              title="No Payment Records"
              message="No rent or fee payments match the selected criteria."
            />
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Payment Receipt Modal */}
      <Modal
        visible={!!selectedPayment}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedPayment(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Receipt Details</Text>
              <TouchableOpacity onPress={() => setSelectedPayment(null)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedPayment && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.receiptTop}>
                  <Text style={styles.receiptLabel}>Transaction Amount</Text>
                  <Text style={styles.receiptAmount}>
                    ₹{(selectedPayment.amount || 0).toLocaleString('en-IN')}
                  </Text>
                  <View style={{ marginTop: 6 }}>
                    <StatusBadge status={selectedPayment.status} />
                  </View>
                </View>

                <View style={styles.receiptSection}>
                  <View style={styles.receiptRow}>
                    <Text style={styles.rowKey}>Resident Name</Text>
                    <Text style={styles.rowVal}>{selectedPayment.residentName}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.rowKey}>Room Number</Text>
                    <Text style={styles.rowVal}>{selectedPayment.roomNumber}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.rowKey}>Receipt Number</Text>
                    <Text style={[styles.rowVal, { fontFamily: 'monospace' }]}>
                      {selectedPayment.receiptNumber || 'Generated upon payment'}
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.rowKey}>Payment Method</Text>
                    <Text style={styles.rowVal}>{selectedPayment.paymentMethod || 'UPI / Bank'}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.rowKey}>Billing Month</Text>
                    <Text style={styles.rowVal}>{selectedPayment.month || 'Current'}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.rowKey}>Date Recorded</Text>
                    <Text style={styles.rowVal}>
                      {selectedPayment.createdAt ? new Date(selectedPayment.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                    </Text>
                  </View>
                  {selectedPayment.notes && (
                    <View style={styles.receiptRow}>
                      <Text style={styles.rowKey}>Notes</Text>
                      <Text style={styles.rowVal}>{selectedPayment.notes}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.verifiedNotice}>
                  <Ionicons name="shield-checkmark" size={16} color="#059669" />
                  <Text style={styles.verifiedText}>Verified SLG Hostel System Transaction Record</Text>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  statsBanner: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: Spacing.gutter,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  searchWrap: {
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.surfaceSecondary,
  },
  filterChipActive: {
    backgroundColor: Colors.primaryLight,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.primary,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: 12,
    paddingBottom: 40,
  },
  paymentCardWrapper: {
    marginBottom: 10,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: { flex: 1 },
  residentName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  roomSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  amountCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  paymentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  metaVal: {
    fontWeight: '600',
    color: Colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  receiptTop: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 16,
  },
  receiptLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  receiptAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 4,
  },
  receiptSection: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: 14,
    gap: 10,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowKey: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  rowVal: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  verifiedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    justifyContent: 'center',
  },
  verifiedText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
});
