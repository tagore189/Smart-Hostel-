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

const STATUS_FILTERS = ['ALL', 'SUBMITTED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;

export default function AdminComplaintsScreen() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);

  // Status update modal state
  const [newStatus, setNewStatus] = useState<string>('IN_PROGRESS');
  const [staffName, setStaffName] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const {
    data: complaints,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['admin-complaints', statusFilter],
    queryFn: async () => {
      const url = statusFilter === 'ALL'
        ? '/admin/complaints'
        : `/admin/complaints?status=${statusFilter}`;
      const res = await api.get(url);
      return (res.data || []) as any[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      if (!selectedComplaint) return;
      return await api.put(`/admin/complaints/${selectedComplaint._id}/status`, {
        status: newStatus,
        staffName: staffName.trim() || undefined,
        note: note.trim() || undefined,
      });
    },
    onSuccess: (res) => {
      Alert.alert('Status Updated', res.message || 'Ticket status updated successfully');
      setSelectedComplaint(null);
      setNote('');
      setStaffName('');
      queryClient.invalidateQueries({ queryKey: ['admin-complaints'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
    onError: (err: any) => {
      Alert.alert('Update Failed', err.message || 'Could not update ticket status');
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL':
      case 'URGENT':
        return '#DC2626';
      case 'HIGH':
        return '#EA580C';
      case 'MEDIUM':
        return '#D97706';
      default:
        return Colors.primary;
    }
  };

  const openUpdateModal = (complaint: any) => {
    setSelectedComplaint(complaint);
    setNewStatus(complaint.status === 'SUBMITTED' ? 'IN_PROGRESS' : 'RESOLVED');
    setStaffName(complaint.assignedStaffName || '');
    setNote('');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader subtitle="Maintenance & Complaint Tickets" showBack />

      {/* Filter Row */}
      <View style={styles.filterScrollWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {STATUS_FILTERS.map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.filterChip, statusFilter === st && styles.filterChipActive]}
              onPress={() => setStatusFilter(st)}
            >
              <Text style={[styles.filterChipText, statusFilter === st && styles.filterChipTextActive]}>
                {st === 'ALL' ? 'All Tickets' : st.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Complaint List */}
      {isLoading ? (
        <LoadingView message="Loading maintenance tickets..." />
      ) : isError ? (
        <ErrorView error={error} onRetry={refetch} title="Failed to load tickets" />
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
          {complaints && complaints.length > 0 ? (
            complaints.map((c) => (
              <TouchableOpacity
                key={c._id}
                style={styles.ticketCardWrapper}
                onPress={() => openUpdateModal(c)}
                activeOpacity={0.75}
              >
                <Card>
                  <View style={styles.ticketHeader}>
                    <View style={styles.ticketHeaderLeft}>
                      <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(c.priority) + '18' }]}>
                        <Text style={[styles.priorityText, { color: getPriorityColor(c.priority) }]}>
                          {c.priority || 'NORMAL'}
                        </Text>
                      </View>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{c.category || 'General'}</Text>
                      </View>
                    </View>
                    <StatusBadge status={c.status} />
                  </View>

                  <Text style={styles.ticketTitle}>{c.title}</Text>
                  <Text style={styles.ticketDesc} numberOfLines={2}>{c.description}</Text>

                  <View style={styles.ticketFooter}>
                    <View style={styles.residentMeta}>
                      <Ionicons name="person-outline" size={14} color={Colors.textMuted} />
                      <Text style={styles.metaResident}>
                        {c.residentName || 'Resident'} · Room {c.roomNumber || '—'}
                      </Text>
                    </View>
                    <Text style={styles.ticketDate}>
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                    </Text>
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          ) : (
            <EmptyView
              icon="checkmark-done-circle-outline"
              title="No Complaints in this category"
              message="All maintenance items are either resolved or clear."
            />
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Ticket Details & Action Modal */}
      <Modal
        visible={!!selectedComplaint}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedComplaint(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Maintenance Ticket</Text>
              <TouchableOpacity onPress={() => setSelectedComplaint(null)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedComplaint && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
                <View style={styles.ticketSummaryBox}>
                  <Text style={styles.summaryTitle}>{selectedComplaint.title}</Text>
                  <Text style={styles.summaryDesc}>{selectedComplaint.description}</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryMeta}>
                      👤 {selectedComplaint.residentName} · Room {selectedComplaint.roomNumber}
                    </Text>
                    <StatusBadge status={selectedComplaint.status} />
                  </View>
                </View>

                {/* Status Selection */}
                <Text style={styles.fieldLabel}>Set New Status</Text>
                <View style={styles.statusSelectRow}>
                  {['IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[styles.statusSelectChip, newStatus === st && styles.statusSelectChipActive]}
                      onPress={() => setNewStatus(st)}
                    >
                      <Text style={[styles.statusSelectText, newStatus === st && styles.statusSelectTextActive]}>
                        {st.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Assign Staff (Optional)</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="e.g. Electrician Suresh / Plumber Raju"
                  placeholderTextColor={Colors.textMuted}
                  value={staffName}
                  onChangeText={setStaffName}
                />

                <Text style={styles.fieldLabel}>Resolution / Warden Note</Text>
                <TextInput
                  style={[styles.inputField, { height: 75, textAlignVertical: 'top' }]}
                  placeholder="Add note on action taken or technician dispatch..."
                  placeholderTextColor={Colors.textMuted}
                  value={note}
                  onChangeText={setNote}
                  multiline
                />

                {/* Timeline */}
                {selectedComplaint.timeline && selectedComplaint.timeline.length > 0 && (
                  <View style={styles.timelineSection}>
                    <Text style={styles.timelineTitle}>Activity Timeline</Text>
                    {selectedComplaint.timeline.map((entry: any, i: number) => (
                      <View key={i} style={styles.timelineItem}>
                        <View style={styles.timelineDot} />
                        <View style={styles.timelineContent}>
                          <Text style={styles.timelineStatus}>{entry.status}</Text>
                          <Text style={styles.timelineNote}>{entry.note}</Text>
                          <Text style={styles.timelineTime}>
                            {entry.updatedBy} · {new Date(entry.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={() => updateStatusMutation.mutate()}
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>Update Ticket</Text>
                  )}
                </TouchableOpacity>
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
  filterScrollWrap: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterRow: {
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 10,
    gap: 8,
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
  ticketCardWrapper: {
    marginBottom: 10,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  categoryBadge: {
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  ticketDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  residentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaResident: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  ticketDate: {
    fontSize: 12,
    color: Colors.textMuted,
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
    maxHeight: '85%',
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
  ticketSummaryBox: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: 14,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  summaryDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  summaryMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 10,
    marginBottom: 6,
  },
  statusSelectRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  statusSelectChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusSelectChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  statusSelectText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  statusSelectTextActive: {
    color: '#FFF',
  },
  inputField: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  timelineSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 5,
  },
  timelineContent: { flex: 1 },
  timelineStatus: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  timelineNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  timelineTime: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
