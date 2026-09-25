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

export default function AdminEmergencyScreen() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'TRIGGERED' | 'ACKNOWLEDGED' | 'RESOLVED'>('ALL');
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [actionStatus, setActionStatus] = useState<'ACKNOWLEDGED' | 'RESOLVED'>('ACKNOWLEDGED');
  const [actionNotes, setActionNotes] = useState('');

  const {
    data: alerts,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['admin-emergency-alerts'],
    queryFn: async () => {
      const res = await api.get('/admin/emergency');
      return (res.data || []) as any[];
    },
    refetchInterval: 10000, // Poll every 10 seconds for safety
  });

  const updateAlertMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAlert) return;
      return await api.put(`/admin/emergency/${selectedAlert._id}/status`, {
        status: actionStatus,
        notes: actionNotes.trim() || undefined,
      });
    },
    onSuccess: (res) => {
      Alert.alert('Status Updated', res.message || 'Emergency alert record updated');
      setSelectedAlert(null);
      setActionNotes('');
      queryClient.invalidateQueries({ queryKey: ['admin-emergency-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Could not update alert status');
    },
  });

  const handleCall = (phone: string) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const alertList = alerts || [];
  const filteredAlerts = statusFilter === 'ALL'
    ? alertList
    : alertList.filter((a) => a.status === statusFilter);

  const activeCount = alertList.filter((a) => a.status === 'TRIGGERED').length;

  const openActionModal = (alertItem: any, targetStatus: 'ACKNOWLEDGED' | 'RESOLVED') => {
    setSelectedAlert(alertItem);
    setActionStatus(targetStatus);
    setActionNotes('');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader subtitle="Hostel Safety & Emergency Response Console" showBack />

      {/* Safety Status Banner */}
      <View style={[styles.statusBanner, activeCount > 0 ? styles.bannerAlert : styles.bannerSafe]}>
        <Ionicons
          name={activeCount > 0 ? 'warning' : 'shield-checkmark'}
          size={24}
          color={activeCount > 0 ? '#DC2626' : '#059669'}
        />
        <View style={styles.bannerTextWrap}>
          <Text style={[styles.bannerTitle, { color: activeCount > 0 ? '#991B1B' : '#065F46' }]}>
            {activeCount > 0 ? `${activeCount} Unresolved Emergency Alert(s)` : 'All Clear — No Active SOS Alerts'}
          </Text>
          <Text style={styles.bannerSub}>
            Direct response channel for Warden Mrs. Shanti Reddy & 24/7 Security Guard Desk
          </Text>
        </View>
      </View>

      {/* Filter Row */}
      <View style={styles.filterRow}>
        {(['ALL', 'TRIGGERED', 'ACKNOWLEDGED', 'RESOLVED'] as const).map((st) => (
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

      {/* Alerts List */}
      {isLoading ? (
        <LoadingView message="Connecting to emergency responder logs..." />
      ) : isError ? (
        <ErrorView error={error} onRetry={refetch} title="Failed to load emergency alerts" />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={['#DC2626']}
              tintColor="#DC2626"
            />
          }
        >
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((item) => {
              const isTriggered = item.status === 'TRIGGERED';

              return (
                <View key={item._id} style={styles.alertCardWrapper}>
                  <Card style={isTriggered ? styles.triggeredCard : undefined}>
                    <View style={styles.cardHeader}>
                      <View style={styles.typeBadge}>
                        <Ionicons name="alert-circle" size={14} color="#DC2626" />
                        <Text style={styles.typeText}>{item.type?.replace('_', ' ') || 'ALERT'}</Text>
                      </View>
                      <StatusBadge status={item.status} />
                    </View>

                    <Text style={styles.residentTitle}>
                      {item.residentName} · Room {item.roomNumber} (Bed {item.bedCode || 'A'})
                    </Text>

                    {item.notes && <Text style={styles.alertNotes}>{item.notes}</Text>}

                    <View style={styles.infoMeta}>
                      <View style={styles.infoItem}>
                        <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
                        <Text style={styles.infoText}>
                          {item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
                        <Text style={styles.infoText}>
                          {item.locationAddress || 'SLG Luxury PG, KPHB'}
                        </Text>
                      </View>
                    </View>

                    {/* Action Row */}
                    <View style={styles.actionRow}>
                      {item.residentPhone && (
                        <TouchableOpacity
                          style={styles.callResidentBtn}
                          onPress={() => handleCall(item.residentPhone)}
                        >
                          <Ionicons name="call" size={15} color="#FFF" />
                          <Text style={styles.callResidentText}>Call Resident</Text>
                        </TouchableOpacity>
                      )}

                      {isTriggered && (
                        <TouchableOpacity
                          style={styles.ackBtn}
                          onPress={() => openActionModal(item, 'ACKNOWLEDGED')}
                        >
                          <Ionicons name="eye-outline" size={15} color="#D97706" />
                          <Text style={styles.ackBtnText}>Acknowledge</Text>
                        </TouchableOpacity>
                      )}

                      {item.status !== 'RESOLVED' && (
                        <TouchableOpacity
                          style={styles.resolveBtn}
                          onPress={() => openActionModal(item, 'RESOLVED')}
                        >
                          <Ionicons name="checkmark-circle-outline" size={15} color="#059669" />
                          <Text style={styles.resolveBtnText}>Mark Resolved</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </Card>
                </View>
              );
            })
          ) : (
            <EmptyView
              icon="shield-checkmark-outline"
              title="No Emergency Alerts"
              message="No security or welfare alerts match the selected status."
            />
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Action Modal */}
      <Modal
        visible={!!selectedAlert}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedAlert(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {actionStatus === 'ACKNOWLEDGED' ? 'Acknowledge Alert' : 'Mark Alert Resolved'}
              </Text>
              <TouchableOpacity onPress={() => setSelectedAlert(null)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Updating emergency response status for {selectedAlert?.residentName} (Room {selectedAlert?.roomNumber}).
            </Text>

            <Text style={styles.fieldLabel}>Responder Notes</Text>
            <TextInput
              style={styles.inputField}
              placeholder="e.g. Warden visited room, resident assisted, issue verified resolved."
              placeholderTextColor={Colors.textMuted}
              value={actionNotes}
              onChangeText={setActionNotes}
              multiline
            />

            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: actionStatus === 'RESOLVED' ? '#059669' : '#D97706' }]}
              onPress={() => updateAlertMutation.mutate()}
              disabled={updateAlertMutation.isPending}
            >
              {updateAlertMutation.isPending ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.confirmBtnText}>
                  Confirm {actionStatus === 'RESOLVED' ? 'Resolution' : 'Acknowledgment'}
                </Text>
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
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginHorizontal: Spacing.gutter,
    marginTop: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  bannerAlert: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  bannerSafe: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  bannerTextWrap: { flex: 1 },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  bannerSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.primary,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: 4,
    paddingBottom: 40,
  },
  alertCardWrapper: {
    marginBottom: 12,
  },
  triggeredCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    backgroundColor: '#FFFBFB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#991B1B',
  },
  residentTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  alertNotes: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  infoMeta: {
    gap: 4,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  callResidentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  callResidentText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  ackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  ackBtnText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '700',
  },
  resolveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resolveBtnText: {
    color: '#065F46',
    fontSize: 12,
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
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  inputField: {
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
  confirmBtn: {
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
