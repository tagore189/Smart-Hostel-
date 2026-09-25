import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
  Linking,
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

export default function AdminVisitorsScreen() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [selectedVisitor, setSelectedVisitor] = useState<any | null>(null);

  const {
    data: visitors,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['admin-visitors', statusFilter],
    queryFn: async () => {
      const url = statusFilter === 'ALL'
        ? '/admin/visitors'
        : `/admin/visitors?status=${statusFilter}`;
      const res = await api.get(url);
      return (res.data || []) as any[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.put(`/admin/visitors/${id}/approve`);
    },
    onSuccess: (res) => {
      Alert.alert('Approved', res.message || 'Visitor pass issued successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-visitors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Could not approve visitor');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.put(`/admin/visitors/${id}/reject`);
    },
    onSuccess: (res) => {
      Alert.alert('Rejected', res.message || 'Visitor entry rejected');
      queryClient.invalidateQueries({ queryKey: ['admin-visitors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Could not reject visitor');
    },
  });

  const visitorList = visitors || [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader subtitle="Hostel Visitor Passes & Security Log" showBack />

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

      {/* Visitors List */}
      {isLoading ? (
        <LoadingView message="Loading visitor registrations..." />
      ) : isError ? (
        <ErrorView error={error} onRetry={refetch} title="Failed to load visitors" />
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
          {visitorList.length > 0 ? (
            visitorList.map((v) => (
              <TouchableOpacity
                key={v._id}
                style={styles.cardWrapper}
                onPress={() => setSelectedVisitor(v)}
                activeOpacity={0.8}
              >
                <Card>
                  <View style={styles.cardHeader}>
                    <View style={styles.avatar}>
                      <Ionicons name="person" size={20} color={Colors.primary} />
                    </View>
                    <View style={styles.visitorInfo}>
                      <Text style={styles.visitorName}>{v.visitorName}</Text>
                      <Text style={styles.relationText}>
                        {v.relationship || 'Visitor'} of {v.residentName || 'Resident'} (Room {v.roomNumber || '—'})
                      </Text>
                    </View>
                    <StatusBadge status={v.status} />
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
                      <Text style={styles.metaText}>{v.visitDate || 'Today'}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="call-outline" size={14} color={Colors.textMuted} />
                      <Text style={styles.metaText}>{v.phone || 'No phone'}</Text>
                    </View>
                  </View>

                  {v.visitorPassCode && (
                    <View style={styles.passBox}>
                      <Ionicons name="shield-checkmark" size={16} color="#059669" />
                      <Text style={styles.passCodeText}>Pass Code: {v.visitorPassCode}</Text>
                    </View>
                  )}

                  {/* Actions for PENDING */}
                  {v.status === 'PENDING' && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={() => approveMutation.mutate(v._id)}
                        disabled={approveMutation.isPending}
                      >
                        <Ionicons name="checkmark" size={16} color="#FFF" />
                        <Text style={styles.approveBtnText}>Approve Pass</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => rejectMutation.mutate(v._id)}
                        disabled={rejectMutation.isPending}
                      >
                        <Ionicons name="close" size={16} color="#DC2626" />
                        <Text style={styles.rejectBtnText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </Card>
              </TouchableOpacity>
            ))
          ) : (
            <EmptyView
              icon="person-add-outline"
              title="No Visitors Found"
              message="No visitor registrations match the current filter."
            />
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Details Modal */}
      <Modal
        visible={!!selectedVisitor}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedVisitor(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Visitor Pass Info</Text>
              <TouchableOpacity onPress={() => setSelectedVisitor(null)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedVisitor && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailName}>{selectedVisitor.visitorName}</Text>
                  <Text style={styles.detailSub}>
                    Relationship: {selectedVisitor.relationship || 'Guest'}
                  </Text>
                  <View style={{ marginTop: 6 }}>
                    <StatusBadge status={selectedVisitor.status} />
                  </View>
                </View>

                <View style={styles.infoSection}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoKey}>Visiting Resident</Text>
                    <Text style={styles.infoVal}>
                      {selectedVisitor.residentName} (Room {selectedVisitor.roomNumber})
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoKey}>Visit Date</Text>
                    <Text style={styles.infoVal}>{selectedVisitor.visitDate}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoKey}>Phone Number</Text>
                    <TouchableOpacity onPress={() => selectedVisitor.phone && Linking.openURL(`tel:${selectedVisitor.phone}`)}>
                      <Text style={[styles.infoVal, { color: Colors.primary }]}>{selectedVisitor.phone || 'N/A'}</Text>
                    </TouchableOpacity>
                  </View>
                  {selectedVisitor.purpose && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoKey}>Purpose of Visit</Text>
                      <Text style={styles.infoVal}>{selectedVisitor.purpose}</Text>
                    </View>
                  )}
                  {selectedVisitor.visitorPassCode && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoKey}>Digital Pass Code</Text>
                      <Text style={[styles.infoVal, { fontFamily: 'monospace', color: '#059669', fontWeight: '700' }]}>
                        {selectedVisitor.visitorPassCode}
                      </Text>
                    </View>
                  )}
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
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visitorInfo: { flex: 1 },
  visitorName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  relationText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  passBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D1FAE5',
    padding: 8,
    borderRadius: BorderRadius.sm,
    marginTop: 10,
  },
  passCodeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
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
    paddingVertical: 9,
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
    paddingVertical: 9,
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
  detailHeader: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 16,
  },
  detailName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  detailSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  infoSection: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: 14,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoKey: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
});
