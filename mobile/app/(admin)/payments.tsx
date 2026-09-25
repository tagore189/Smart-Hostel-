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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/Theme';
import { AppHeader } from '../../components/AppHeader';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { api } from '../../services/api';
import { LoadingView, EmptyView, ErrorView } from '../../components/StateViews';

export default function AdminPaymentsScreen() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'OVERDUE'>('ALL');
  const [floorFilter, setFloorFilter] = useState<'ALL' | number>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('Current');
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);

  // Record Payment Modal State
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordResidentId, setRecordResidentId] = useState('');
  const [recordAmount, setRecordAmount] = useState('8000');
  const [recordMonth, setRecordMonth] = useState('September 2026');
  const [recordMethod, setRecordMethod] = useState<'Cash' | 'UPI' | 'Bank Transfer'>('UPI');
  const [recordTxnId, setRecordTxnId] = useState('');
  const [recordNotes, setRecordNotes] = useState('');

  // 1. Query Payment Summary Stats
  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['admin-payment-stats', selectedMonth],
    queryFn: async () => {
      const res = await api.get('/admin/payments/stats');
      return res.data;
    },
  });

  // 2. Query Payments List
  const {
    data: payments,
    isLoading,
    isError,
    error,
    refetch: refetchPayments,
    isRefetching,
  } = useQuery({
    queryKey: ['admin-payments', search, statusFilter, floorFilter, selectedMonth],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (floorFilter !== 'ALL') params.append('floor', String(floorFilter));
      if (selectedMonth !== 'Current' && selectedMonth !== 'ALL') params.append('month', selectedMonth);

      const res = await api.get(`/admin/payments?${params.toString()}`);
      return (res.data || []) as any[];
    },
  });

  // 3. Query Residents for Record Payment dropdown
  const { data: residentsList } = useQuery({
    queryKey: ['admin-residents-for-payment'],
    queryFn: async () => {
      const res = await api.get('/admin/residents');
      return (res.data || []) as any[];
    },
    enabled: isRecordModalOpen,
  });

  // Record Payment Mutation
  const recordMutation = useMutation({
    mutationFn: async () => {
      if (!recordResidentId) throw new Error('Please select a resident');
      if (!recordAmount || isNaN(Number(recordAmount))) throw new Error('Please enter a valid amount');

      return await api.post('/admin/payments/record', {
        residentId: recordResidentId,
        amount: Number(recordAmount),
        month: recordMonth,
        paymentMethod: recordMethod,
        transactionId: recordTxnId.trim() || undefined,
        notes: recordNotes.trim() || undefined,
      });
    },
    onSuccess: (res) => {
      Alert.alert('Payment Recorded', res.message || 'Payment saved successfully');
      setIsRecordModalOpen(false);
      setRecordResidentId('');
      setRecordTxnId('');
      setRecordNotes('');
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-payment-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
    onError: (err: any) => {
      Alert.alert('Payment Error', err.message || 'Could not record payment');
    },
  });

  const verifyMutation = useMutation({
    mutationFn: () => api.put(`/admin/payments/${selectedPayment._id}/verify`),
    onSuccess: (res) => {
      Alert.alert('Payment verified', res.message || 'Reference verified and receipt issued.');
      setSelectedPayment(null);
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-payment-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
    onError: (err: any) => Alert.alert('Verification failed', err.message || 'Could not verify this reference.'),
  });

  const handleRefresh = () => {
    refetchStats();
    refetchPayments();
  };

  const paymentList = payments || [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader subtitle="Hostel Rent & Fee Records" showBack />

      {/* Action Header: Record Payment Button */}
      <View style={styles.topActionRow}>
        <Text style={styles.sectionTitle}>Monthly Fee Collections</Text>
        <TouchableOpacity
          style={styles.recordPaymentBtn}
          onPress={() => setIsRecordModalOpen(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={16} color="#FFF" />
          <Text style={styles.recordPaymentText}>Record Payment</Text>
        </TouchableOpacity>
      </View>

      {/* Monthly Fees Summary (Section 20 Example) */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryTopRow}>
          <View style={styles.summaryCardLarge}>
            <Text style={styles.sumLabel}>Expected Revenue</Text>
            <Text style={styles.sumValueExpected}>
              ₹{(statsData?.expectedFees || 1496000).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.summaryCardLarge}>
            <Text style={styles.sumLabel}>Collected</Text>
            <Text style={styles.sumValueCollected}>
              ₹{(statsData?.collectedFees || 1312000).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        <View style={styles.summaryBottomRow}>
          {/* Pending Revenue */}
          <TouchableOpacity
            style={[styles.smallStatBox, statusFilter === 'PENDING' && styles.statBoxActive]}
            onPress={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
          >
            <Text style={styles.sumSubLabel}>Pending Fees</Text>
            <Text style={styles.sumValuePending}>
              ₹{(statsData?.pendingFees || 184000).toLocaleString('en-IN')}
            </Text>
          </TouchableOpacity>

          {/* Paid Residents */}
          <TouchableOpacity
            style={[styles.smallStatBox, statusFilter === 'PAID' && styles.statBoxActive]}
            onPress={() => setStatusFilter(statusFilter === 'PAID' ? 'ALL' : 'PAID')}
          >
            <Text style={styles.sumSubLabel}>Paid</Text>
            <Text style={[styles.sumCount, { color: '#059669' }]}>
              {statsData?.paidCount ?? 164}
            </Text>
          </TouchableOpacity>

          {/* Pending Residents (Tap to view actual residents whose payments are pending) */}
          <TouchableOpacity
            style={[styles.smallStatBox, statusFilter === 'PENDING' && styles.statBoxActivePending]}
            onPress={() => setStatusFilter('PENDING')}
          >
            <Text style={[styles.sumSubLabel, { color: '#DC2626' }]}>Pending</Text>
            <Text style={[styles.sumCount, { color: '#DC2626' }]}>
              {statsData?.pendingCount ?? 23}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by resident name, room, or receipt..."
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

      {/* Filter Row: Floor & Status Chips */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipRow}>
          {/* Status filters */}
          {(['ALL', 'PAID', 'PENDING', 'OVERDUE'] as const).map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.filterChip, statusFilter === st && styles.filterChipActive]}
              onPress={() => setStatusFilter(st)}
            >
              <Text style={[styles.filterChipText, statusFilter === st && styles.filterChipTextActive]}>
                {st === 'ALL' ? 'All Status' : st}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={styles.filterDivider} />

          {/* Floor filters */}
          {(['ALL', 1, 2, 3, 4] as const).map((fl) => (
            <TouchableOpacity
              key={fl}
              style={[styles.filterChip, floorFilter === fl && styles.filterChipActive]}
              onPress={() => setFloorFilter(fl)}
            >
              <Text style={[styles.filterChipText, floorFilter === fl && styles.filterChipTextActive]}>
                {fl === 'ALL' ? 'All Floors' : `Floor ${fl}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Payment List */}
      {isLoading ? (
        <LoadingView message="Loading payment transactions..." />
      ) : isError ? (
        <ErrorView error={error} onRetry={handleRefresh} title="Failed to load payments" />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
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
                        Room {p.roomNumber || '—'} · {p.month || 'Current Month'}
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
                      Receipt: <Text style={styles.metaVal}>{p.receiptNumber || 'Pending Issuance'}</Text>
                    </Text>
                    <Text style={styles.metaText}>
                      Method: <Text style={styles.metaVal}>{p.method || p.paymentMethod || 'UPI'}</Text>
                    </Text>
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          ) : (
            <EmptyView
              icon="card-outline"
              title="No Payments Found"
              message="No rent or fee records match your selected filter."
            />
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* RECORD PAYMENT MODAL */}
      <Modal
        visible={isRecordModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsRecordModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.recordModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Offline / Manual Payment</Text>
              <TouchableOpacity onPress={() => setIsRecordModalOpen(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Select Resident</Text>
              <ScrollView style={styles.residentPickerScroll} showsVerticalScrollIndicator={false}>
                {(residentsList || []).map((r) => (
                  <TouchableOpacity
                    key={r._id}
                    style={[styles.resPickerRow, recordResidentId === r._id && styles.resPickerRowActive]}
                    onPress={() => {
                      setRecordResidentId(r._id);
                      setRecordAmount(String(r.monthlyRent || 8000));
                    }}
                  >
                    <Text style={styles.resPickerName}>{r.name} (Room {r.roomNumber})</Text>
                    {recordResidentId === r._id && (
                      <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Payment Amount (₹)</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={recordAmount}
                onChangeText={setRecordAmount}
                placeholder="e.g. 8000"
              />

              <Text style={styles.inputLabel}>Billing Month</Text>
              <TextInput
                style={styles.modalInput}
                value={recordMonth}
                onChangeText={setRecordMonth}
                placeholder="e.g. September 2026"
              />

              <Text style={styles.inputLabel}>Payment Method</Text>
              <View style={styles.methodToggleRow}>
                {(['UPI', 'Cash', 'Bank Transfer'] as const).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.methodBtn, recordMethod === m && styles.methodBtnActive]}
                    onPress={() => setRecordMethod(m)}
                  >
                    <Text style={[styles.methodBtnText, recordMethod === m && styles.methodBtnTextActive]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Transaction / Reference # (Optional for Cash)</Text>
              <TextInput
                style={styles.modalInput}
                value={recordTxnId}
                onChangeText={setRecordTxnId}
                placeholder="e.g. UTR / IMPS / Cash Slip #"
                autoCapitalize="characters"
              />

              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.modalInput, { height: 60 }]}
                value={recordNotes}
                onChangeText={setRecordNotes}
                placeholder="e.g. Collected at front desk"
                multiline
              />

              <TouchableOpacity
                style={[styles.submitRecordBtn, !recordResidentId && styles.btnDisabled]}
                onPress={() => recordMutation.mutate()}
                disabled={!recordResidentId || recordMutation.isPending}
              >
                {recordMutation.isPending ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.submitRecordText}>Confirm & Issue Receipt</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* RECEIPT DETAILS MODAL */}
      <Modal
        visible={!!selectedPayment}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedPayment(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.receiptModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Official Payment Receipt</Text>
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
                    <Text style={[styles.rowVal, { fontFamily: 'monospace', color: Colors.primary }]}>
                      {selectedPayment.receiptNumber || 'SLG-REC-PENDING'}
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.rowKey}>Payment Method</Text>
                    <Text style={styles.rowVal}>{selectedPayment.method || selectedPayment.paymentMethod || 'UPI'}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.rowKey}>Billing Month</Text>
                    <Text style={styles.rowVal}>{selectedPayment.month || 'Current'}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.rowKey}>Transaction ID</Text>
                    <Text style={styles.rowVal}>{selectedPayment.transactionId || 'N/A'}</Text>
                  </View>
                  {selectedPayment.notes && (
                    <View style={styles.receiptRow}>
                      <Text style={styles.rowKey}>Notes</Text>
                      <Text style={styles.rowVal}>{selectedPayment.notes}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.verifiedNotice}>
                  <Ionicons name={selectedPayment.status === 'PAID' ? 'shield-checkmark' : 'time'} size={16} color={selectedPayment.status === 'PAID' ? '#059669' : '#D97706'} />
                  <Text style={styles.verifiedText}>{selectedPayment.status === 'PAID' ? 'SLG Luxury Ladies PG · Verified Payment' : 'Reference awaiting staff verification; no receipt has been issued.'}</Text>
                </View>
                {selectedPayment.status === 'PENDING' && (
                  <TouchableOpacity
                    style={[styles.submitRecordBtn, verifyMutation.isPending && { opacity: 0.6 }]}
                    disabled={verifyMutation.isPending}
                    onPress={() => Alert.alert(
                      'Verify payment reference?',
                      'Confirm only after checking the transaction in the hostel bank or UPI account.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Verify and issue receipt', onPress: () => verifyMutation.mutate() },
                      ]
                    )}
                  >
                    {verifyMutation.isPending ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitRecordText}>Verify Reference & Issue Receipt</Text>}
                  </TouchableOpacity>
                )}
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
  topActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.gutter,
    paddingTop: 12,
    paddingBottom: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  recordPaymentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  recordPaymentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  summaryContainer: {
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 8,
    gap: 8,
  },
  summaryTopRow: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryCardLarge: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  sumLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '700' },
  sumValueExpected: { fontSize: 18, fontWeight: '800', color: Colors.text, marginTop: 2 },
  sumValueCollected: { fontSize: 18, fontWeight: '800', color: '#059669', marginTop: 2 },
  summaryBottomRow: {
    flexDirection: 'row',
    gap: 8,
  },
  smallStatBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  statBoxActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  statBoxActivePending: {
    borderColor: '#DC2626',
    backgroundColor: '#FEE2E2',
  },
  sumSubLabel: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary },
  sumValuePending: { fontSize: 14, fontWeight: '800', color: '#DC2626', marginTop: 2 },
  sumCount: { fontSize: 16, fontWeight: '800', marginTop: 2 },
  searchWrap: {
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: Colors.text },
  filterSection: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterChipRow: {
    paddingHorizontal: Spacing.gutter,
    gap: 6,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  filterChipTextActive: { color: '#FFF' },
  filterDivider: { width: 1, height: 20, backgroundColor: Colors.border, marginHorizontal: 4 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: 12,
    paddingBottom: 40,
  },
  paymentCardWrapper: { marginBottom: 8 },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: { flex: 1 },
  residentName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  roomSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  amountCol: { alignItems: 'flex-end', gap: 4 },
  amountText: { fontSize: 15, fontWeight: '800', color: Colors.text },
  cardDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
  paymentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: { fontSize: 11, color: Colors.textSecondary },
  metaVal: { fontWeight: '700', color: Colors.text },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  recordModalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  receiptModalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  inputLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginTop: 10, marginBottom: 4 },
  modalInput: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 13,
    color: Colors.text,
  },
  residentPickerScroll: {
    maxHeight: 120,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 6,
  },
  resPickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  resPickerRowActive: {
    backgroundColor: Colors.primaryLight,
  },
  resPickerName: { fontSize: 13, fontWeight: '600', color: Colors.text },
  methodToggleRow: { flexDirection: 'row', gap: 8 },
  methodBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  methodBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  methodBtnText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  methodBtnTextActive: { color: '#FFF' },
  submitRecordBtn: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  submitRecordText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  btnDisabled: { opacity: 0.5 },
  receiptTop: { alignItems: 'center', paddingVertical: 12 },
  receiptLabel: { fontSize: 12, color: Colors.textSecondary },
  receiptAmount: { fontSize: 28, fontWeight: '800', color: Colors.text, marginTop: 2 },
  receiptSection: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.lg,
    padding: 14,
    marginVertical: 12,
    gap: 10,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowKey: { fontSize: 12, color: Colors.textSecondary },
  rowVal: { fontSize: 13, fontWeight: '700', color: Colors.text },
  verifiedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  verifiedText: { fontSize: 11, fontWeight: '600', color: '#059669' },
});
