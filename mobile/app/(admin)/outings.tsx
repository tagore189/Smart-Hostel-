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
import { api } from '../../services/api';
import { LoadingView, EmptyView, ErrorView } from '../../components/StateViews';

export default function AdminOutingsScreen() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [rejectingOuting, setRejectingOuting] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const {
    data: outings,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['admin-outings', statusFilter],
    queryFn: async () => {
      const url = statusFilter === 'ALL'
        ? '/admin/outings'
        : `/admin/outings?status=${statusFilter}`;
      const res = await api.get(url);
      return (res.data || []) as any[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.put(`/admin/outings/${id}/approve`);
    },
    onSuccess: (res) => {
      Alert.alert('Approved', res.message || 'Outing request approved and gate pass issued.');
      queryClient.invalidateQueries({ queryKey: ['admin-outings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Could not approve outing request');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      if (!rejectingOuting) return;
      return await api.put(`/admin/outings/${rejectingOuting._id}/reject`, {
        reason: rejectionReason.trim() || 'Late return timing constraint.',
      });
    },
    onSuccess: () => {
      Alert.alert('Outing Rejected', 'Resident has been notified of the decision.');
      setRejectingOuting(null);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-outings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Could not reject outing');
    },
  });

  const outingList = outings || [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader subtitle="Resident Outing Approvals & Gate Passes" showBack />

      {/* Filter Row */}
      <View style={styles.filterRow}>
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
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

      {/* Outings List */}
      {isLoading ? (
        <LoadingView message="Loading outing requests..." />
      ) : isError ? (
        <ErrorView error={error} onRetry={refetch} title="Failed to load outings" />
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
          {outingList.length > 0 ? (
            outingList.map((item) => (
              <View key={item._id} style={styles.cardWrapper}>
                <Card>
                  <View style={styles.cardHeader}>
                    <View style={styles.residentInfo}>
                      <Text style={styles.residentName}>{item.residentName || 'Resident'}</Text>
                      <Text style={styles.residentRoom}>Room {item.roomNumber || '—'}</Text>
                    </View>
                    <StatusBadge status={item.status} />
                  </View>

                  <View style={styles.destinationBox}>
                    <View style={styles.destRow}>
                      <Ionicons name="location" size={16} color={Colors.primary} />
                      <Text style={styles.destText}>Destination: {item.destination}</Text>
                    </View>
                    {item.reason && (
                      <Text style={styles.reasonText}>Purpose: {item.reason}</Text>
                    )}
                  </View>

                  <View style={styles.timeGrid}>
                    <View style={styles.timeBox}>
                      <Text style={styles.timeLabel}>Leaving</Text>
                      <Text style={styles.timeValue}>{item.leavingDate} at {item.leavingTime}</Text>
                    </View>
                    <View style={styles.timeBox}>
                      <Text style={styles.timeLabel}>Expected Return</Text>
                      <Text style={styles.timeValue}>{item.expectedReturnDate} at {item.expectedReturnTime}</Text>
                    </View>
                  </View>

                  {/* Gate Pass Code if Approved */}
                  {item.gatePassCode && (
                    <View style={styles.passBox}>
                      <Ionicons name="qr-code-outline" size={18} color="#059669" />
                      <Text style={styles.passCodeText}>Gate Pass: {item.gatePassCode}</Text>
                    </View>
                  )}

                  {/* Rejection reason if Rejected */}
                  {item.status === 'REJECTED' && item.rejectionReason && (
                    <View style={styles.rejectBox}>
                      <Text style={styles.rejectText}>Reason: {item.rejectionReason}</Text>
                    </View>
                  )}

                  {/* Action Buttons for Pending */}
                  {item.status === 'PENDING' && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={() => approveMutation.mutate(item._id)}
                        disabled={approveMutation.isPending}
                      >
                        <Ionicons name="checkmark-circle-outline" size={16} color="#FFF" />
                        <Text style={styles.approveBtnText}>Approve & Issue Pass</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => setRejectingOuting(item)}
                      >
                        <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
                        <Text style={styles.rejectBtnText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </Card>
              </View>
            ))
          ) : (
            <EmptyView
              icon="walk-outline"
              title="No Outing Requests"
              message="No outings in this category at the moment."
            />
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Reject Modal */}
      <Modal
        visible={!!rejectingOuting}
        animationType="slide"
        transparent
        onRequestClose={() => setRejectingOuting(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Outing Request</Text>
              <TouchableOpacity onPress={() => setRejectingOuting(null)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Provide reason for rejecting {rejectingOuting?.residentName}'s outing to {rejectingOuting?.destination}.
            </Text>

            <TextInput
              style={styles.reasonInput}
              placeholder="e.g. Return time exceeds 9:30 PM curfew without parent consent."
              placeholderTextColor={Colors.textMuted}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
            />

            <TouchableOpacity
              style={styles.confirmRejectBtn}
              onPress={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.confirmRejectBtnText}>Confirm Rejection</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
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
  cardWrapper: {
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  residentInfo: { flex: 1 },
  residentName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  residentRoom: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  destinationBox: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.sm,
    padding: 10,
    marginBottom: 10,
  },
  destRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  destText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  reasonText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  timeGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  timeBox: {
    flex: 1,
    backgroundColor: Colors.surfaceHighlight,
    padding: 8,
    borderRadius: 6,
  },
  timeLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  timeValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 2,
  },
  passBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#D1FAE5',
    padding: 10,
    borderRadius: BorderRadius.sm,
  },
  passCodeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  rejectBox: {
    backgroundColor: '#FEE2E2',
    padding: 8,
    borderRadius: BorderRadius.sm,
  },
  rejectText: {
    fontSize: 12,
    color: '#991B1B',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  approveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  approveBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  rejectBtnText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  modalDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
  },
  reasonInput: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  confirmRejectBtn: {
    backgroundColor: '#DC2626',
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmRejectBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
