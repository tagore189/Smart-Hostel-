import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
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
import { useAuth } from '../_layout';
import { api } from '../../services/api';
import { LoadingView, EmptyView, ErrorView } from '../../components/StateViews';

export default function PaymentsScreen() {
  const { resident } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [payMethod, setPayMethod] = useState<'UPI' | 'Bank Transfer'>('UPI');
  const [notes, setNotes] = useState('');

  // 1. Overview Query
  const {
    data: overview,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['payments-overview'],
    queryFn: async () => {
      const res = await api.get('/payments/overview');
      return res.data;
    },
  });

  // Submit UTR reference mutation
  const submitReferenceMutation = useMutation({
    mutationFn: async () => {
      if (!utrNumber.trim()) throw new Error('Please enter the transaction reference / UTR number');
      return await api.post('/payments/submit-reference', {
        amount: resident?.monthlyRent,
        method: payMethod,
        transactionId: utrNumber.trim(),
        notes: notes.trim(),
      });
    },
    onSuccess: (res) => {
      Alert.alert('Reference Submitted', res.message || 'Payment reference submitted to hostel management.');
      setIsSubmitModalOpen(false);
      setUtrNumber('');
      setNotes('');
      queryClient.invalidateQueries({ queryKey: ['payments-overview'] });
    },
    onError: (err: any) => {
      Alert.alert('Submission Error', err.message || 'Could not submit payment reference.');
    },
  });

  const paymentList = overview?.history || [];
  const currentRent = overview?.monthlyRent ?? resident?.monthlyRent;
  const currentStatus = overview?.currentStatus || 'NO_RECORD';
  const currentMonth = overview?.currentMonth || 'Current month';

  const isCurrentPaid = currentStatus === 'PAID';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader subtitle="Hostel Fees & Payments" showBack />

      {isLoading ? (
        <LoadingView message="Loading your fee records..." />
      ) : isError ? (
        <ErrorView error={error} onRetry={refetch} title="Could not load fees" />
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
          {/* SECTION 9: Current Month Fee Card */}
          <View style={styles.currentMonthCard}>
            <View style={styles.monthTopRow}>
              <View>
                <Text style={styles.monthLabel}>Current Month</Text>
                <Text style={styles.monthName}>{currentMonth}</Text>
              </View>
              <View style={[styles.statusBadgeLarge, isCurrentPaid ? styles.badgePaid : styles.badgePending]}>
                <Ionicons
                  name={isCurrentPaid ? 'checkmark-circle' : 'time'}
                  size={16}
                  color={isCurrentPaid ? '#059669' : '#DC2626'}
                />
                <Text style={[styles.statusBadgeText, isCurrentPaid ? styles.textPaid : styles.textPending]}>
                  {currentStatus}
                </Text>
              </View>
            </View>

            <View style={styles.amountDivider} />

            <View style={styles.feeBreakdownRow}>
              <View>
                <Text style={styles.feeSubLabel}>Monthly Rent</Text>
                <Text style={styles.feeAmountText}>{currentRent == null ? 'Not set' : `₹${currentRent.toLocaleString('en-IN')}`}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.feeSubLabel}>Room & Bed</Text>
                <Text style={styles.roomBedValue}>
                  Room {resident?.roomNumber || 'Unassigned'} · Bed {resident?.bedCode || 'Unassigned'}
                </Text>
              </View>
            </View>

            {/* Offline payment instructions */}
            <View style={styles.paymentInfoBox}>
              <Text style={styles.infoBoxHeading}>Hostel Payment Instructions</Text>
              <Text style={styles.infoBoxText}>
                Use the payment details provided directly by hostel management. After making a transfer, submit its reference here for staff verification. This app does not process online payments.
              </Text>

              {!isCurrentPaid && (
                <TouchableOpacity
                  style={styles.submitRefBtn}
                  onPress={() => setIsSubmitModalOpen(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="document-text" size={16} color="#FFF" />
                  <Text style={styles.submitRefBtnText}>Submit UPI / UTR Reference</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Payment History List (Section 9) */}
          <Text style={styles.historyHeading}>Payment History</Text>
          <Text style={styles.historySub}>Receipts & verified monthly rent transactions</Text>

          {paymentList.length > 0 ? (
            paymentList.map((payment: any, index: number) => {
              const isPaid = payment.status === 'PAID';
              return (
                <TouchableOpacity
                  key={payment._id || index}
                  style={styles.paymentCardWrapper}
                  onPress={() => setSelectedPayment(payment)}
                  activeOpacity={0.8}
                >
                  <Card>
                    <View style={styles.paymentRow}>
                      <View style={styles.paymentLeft}>
                        <View style={[styles.methodCircle, isPaid ? styles.methodCirclePaid : styles.methodCirclePending]}>
                          <Ionicons
                            name={payment.method === 'Cash' ? 'cash' : payment.method === 'Bank Transfer' ? 'business' : 'qr-code'}
                            size={18}
                            color={isPaid ? '#059669' : '#DC2626'}
                          />
                        </View>
                        <View>
                          <Text style={styles.paymentMonth}>{payment.month || 'Monthly Rent'}</Text>
                          <Text style={styles.paymentMeta}>
                            Method: {payment.method || payment.paymentMethod || 'UPI'}
                          </Text>
                          {payment.transactionId && (
                            <Text style={styles.txnIdText}>Ref: {payment.transactionId}</Text>
                          )}
                        </View>
                      </View>

                      <View style={styles.paymentRight}>
                        <Text style={styles.paymentAmount}>{payment.amount == null && currentRent == null ? 'Amount unavailable' : `₹${(payment.amount ?? currentRent).toLocaleString('en-IN')}`}</Text>
                        <View style={[styles.miniStatusBadge, isPaid ? styles.badgePaid : styles.badgePending]}>
                          <Text style={[styles.miniStatusText, isPaid ? styles.textPaid : styles.textPending]}>
                            {payment.status}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {payment.receiptNumber && (
                      <View style={styles.cardReceiptFooter}>
                        <Text style={styles.receiptNumText}>Receipt: {payment.receiptNumber}</Text>
                        <Text style={styles.viewReceiptLink}>View Details →</Text>
                      </View>
                    )}
                  </Card>
                </TouchableOpacity>
              );
            })
          ) : (
            <EmptyView
              icon="receipt-outline"
              title="No Payment History"
              message="Your verified hostel receipts will appear here."
            />
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* SUBMIT REFERENCE MODAL */}
      <Modal
        visible={isSubmitModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsSubmitModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.submitModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Submit Payment Verification</Text>
              <TouchableOpacity onPress={() => setIsSubmitModalOpen(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSub}>
                Have you paid via Google Pay, PhonePe, Paytm, or Bank Transfer? Provide your UTR / Transaction ID below so the warden can confirm and issue your receipt.
              </Text>

              <Text style={styles.inputLabel}>Payment Method</Text>
              <View style={styles.methodToggleRow}>
                {(['UPI', 'Bank Transfer'] as const).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.methodBtn, payMethod === m && styles.methodBtnActive]}
                    onPress={() => setPayMethod(m)}
                  >
                    <Text style={[styles.methodBtnText, payMethod === m && styles.methodBtnTextActive]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Transaction / UTR Reference #</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 423891024823"
                placeholderTextColor={Colors.textMuted}
                value={utrNumber}
                onChangeText={setUtrNumber}
                autoCapitalize="characters"
              />

              <Text style={styles.inputLabel}>Amount (₹)</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: '#F3F4F6' }]}
                value={currentRent == null ? '' : String(currentRent)}
                editable={false}
              />

              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.modalInput, { height: 60 }]}
                placeholder="e.g. Paid from HDFC account"
                placeholderTextColor={Colors.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
              />

              <TouchableOpacity
                style={[styles.submitActionBtn, !utrNumber.trim() && styles.btnDisabled]}
                onPress={() => submitReferenceMutation.mutate()}
                disabled={!utrNumber.trim() || submitReferenceMutation.isPending}
              >
                {submitReferenceMutation.isPending ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.submitActionText}>Submit for Warden Verification</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* RECEIPT DETAIL MODAL */}
      <Modal
        visible={!!selectedPayment}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedPayment(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.receiptModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hostel Fee Receipt</Text>
              <TouchableOpacity onPress={() => setSelectedPayment(null)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedPayment && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.receiptTop}>
                  <Text style={styles.receiptLabel}>Amount Paid</Text>
                  <Text style={styles.receiptAmount}>
                    {selectedPayment.amount == null && currentRent == null ? 'Amount unavailable' : `₹${(selectedPayment.amount ?? currentRent).toLocaleString('en-IN')}`}
                  </Text>
                  <View style={{ marginTop: 6 }}>
                    <StatusBadge status={selectedPayment.status} />
                  </View>
                </View>

                <View style={styles.receiptSection}>
                  <View style={styles.receiptRow}>
                    <Text style={styles.rowKey}>Hostel</Text>
                    <Text style={styles.rowVal}>SLG Luxury Ladies PG</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.rowKey}>Location</Text>
                    <Text style={styles.rowVal}>KPHB / Kukatpally, Hyderabad</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.rowKey}>Receipt Number</Text>
                    <Text style={[styles.rowVal, { fontFamily: 'monospace', color: Colors.primary }]}>
                      {selectedPayment.receiptNumber || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.rowKey}>Billing Month</Text>
                    <Text style={styles.rowVal}>{selectedPayment.month || currentMonth}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.rowKey}>Payment Method</Text>
                    <Text style={styles.rowVal}>{selectedPayment.method || selectedPayment.paymentMethod || 'UPI'}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.rowKey}>Transaction Ref</Text>
                    <Text style={styles.rowVal}>{selectedPayment.transactionId || 'N/A'}</Text>
                  </View>
                </View>

                <View style={styles.verifiedNotice}>
                  <Ionicons name="shield-checkmark" size={16} color="#059669" />
                  <Text style={styles.verifiedText}>Officially Verified Hostel Payment</Text>
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
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: 16,
    paddingBottom: 40,
  },
  currentMonthCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
    ...Shadows.card,
  },
  monthTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase' },
  monthName: { fontSize: 18, fontWeight: '800', color: Colors.text, marginTop: 2 },
  statusBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgePaid: { backgroundColor: '#D1FAE5' },
  badgePending: { backgroundColor: '#FEE2E2' },
  statusBadgeText: { fontSize: 12, fontWeight: '800' },
  textPaid: { color: '#059669' },
  textPending: { color: '#DC2626' },
  amountDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 14 },
  feeBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeSubLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  feeAmountText: { fontSize: 24, fontWeight: '800', color: Colors.text, marginTop: 2 },
  roomBedValue: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginTop: 2 },
  paymentInfoBox: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: 12,
    marginTop: 14,
  },
  infoBoxHeading: { fontSize: 12, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  infoBoxText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  boldText: { fontWeight: '700', color: Colors.primary },
  submitRefBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    marginTop: 12,
    gap: 6,
  },
  submitRefBtnText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  historyHeading: { fontSize: 16, fontWeight: '800', color: Colors.text },
  historySub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, marginBottom: 12 },
  paymentCardWrapper: { marginBottom: 10 },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  methodCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodCirclePaid: { backgroundColor: '#D1FAE5' },
  methodCirclePending: { backgroundColor: '#FEE2E2' },
  paymentMonth: { fontSize: 14, fontWeight: '700', color: Colors.text },
  paymentMeta: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  txnIdText: { fontSize: 10, color: Colors.textMuted, marginTop: 1, fontFamily: 'monospace' },
  paymentRight: { alignItems: 'flex-end', gap: 4 },
  paymentAmount: { fontSize: 15, fontWeight: '800', color: Colors.text },
  miniStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniStatusText: { fontSize: 9, fontWeight: '800' },
  cardReceiptFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  receiptNumText: { fontSize: 11, color: Colors.textSecondary, fontFamily: 'monospace' },
  viewReceiptLink: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  submitModalCard: {
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
    marginBottom: 14,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  modalSub: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18, marginBottom: 12 },
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
  methodBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  methodBtnText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  methodBtnTextActive: { color: '#FFF' },
  submitActionBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  submitActionText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
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
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between' },
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
