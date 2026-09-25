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
import { api } from '../../services/api';
import { LoadingView, EmptyView, ErrorView } from '../../components/StateViews';

export default function AdminNoticesScreen() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState<'NORMAL' | 'URGENT' | 'CRITICAL'>('NORMAL');
  const [audienceScope, setAudienceScope] = useState<'ALL' | 'FLOOR' | 'ROOM'>('ALL');
  const [targetFloor, setTargetFloor] = useState('1');
  const [targetRoom, setTargetRoom] = useState('');

  const {
    data: notices,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['admin-notices'],
    queryFn: async () => {
      const res = await api.get('/admin/notices');
      return (res.data || []) as any[];
    },
  });

  const createNoticeMutation = useMutation({
    mutationFn: async () => {
      return await api.post('/admin/notices', {
        title: title.trim(),
        content: content.trim(),
        category,
        priority,
        audienceScope,
        targetFloor: audienceScope === 'FLOOR' ? Number(targetFloor) : undefined,
        targetRoom: audienceScope === 'ROOM' ? targetRoom.trim() : undefined,
      });
    },
    onSuccess: (res) => {
      Alert.alert('Notice Published', res.message || 'Notice broadcasted to residents.');
      setShowCreateModal(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-notices'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Could not publish notice');
    },
  });

  const resetForm = () => {
    setTitle('');
    setContent('');
    setCategory('General');
    setPriority('NORMAL');
    setAudienceScope('ALL');
    setTargetFloor('1');
    setTargetRoom('');
  };

  const getPriorityStyle = (p: string) => {
    switch (p) {
      case 'CRITICAL':
        return { bg: '#FEE2E2', color: '#DC2626' };
      case 'URGENT':
        return { bg: '#FEF3C7', color: '#D97706' };
      default:
        return { bg: '#EDE9FE', color: Colors.primary };
    }
  };

  const noticeList = notices || [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader subtitle="Hostel Broadcasts & Bulletins" showBack />

      {/* Top Bar with Broadcast Action */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topTitle}>Announcements</Text>
          <Text style={styles.topSub}>Broadcast to hostel residents</Text>
        </View>

        <TouchableOpacity
          style={styles.broadcastBtn}
          onPress={() => setShowCreateModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="megaphone" size={16} color="#FFF" />
          <Text style={styles.broadcastBtnText}>New Notice</Text>
        </TouchableOpacity>
      </View>

      {/* Notice List */}
      {isLoading ? (
        <LoadingView message="Loading published notices..." />
      ) : isError ? (
        <ErrorView error={error} onRetry={refetch} title="Failed to load notices" />
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
          {noticeList.length > 0 ? (
            noticeList.map((n) => {
              const pStyle = getPriorityStyle(n.priority);
              return (
                <View key={n._id} style={styles.cardWrapper}>
                  <Card>
                    <View style={styles.cardHeader}>
                      <View style={styles.badgeRow}>
                        <View style={[styles.priorityBadge, { backgroundColor: pStyle.bg }]}>
                          <Text style={[styles.priorityText, { color: pStyle.color }]}>
                            {n.priority}
                          </Text>
                        </View>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryText}>{n.category || 'General'}</Text>
                        </View>
                        <View style={styles.scopeBadge}>
                          <Text style={styles.scopeText}>
                            {n.audienceScope === 'ALL' ? 'All Residents' : `${n.audienceScope}: ${n.targetFloor || n.targetRoom}`}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Text style={styles.noticeTitle}>{n.title}</Text>
                    <Text style={styles.noticeContent}>{n.content}</Text>

                    <View style={styles.cardFooter}>
                      <Text style={styles.authorText}>By {n.publishedByName || 'Administration'}</Text>
                      <Text style={styles.dateText}>
                        {n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                      </Text>
                    </View>
                  </Card>
                </View>
              );
            })
          ) : (
            <EmptyView
              icon="megaphone-outline"
              title="No Notices Published"
              message="Broadcast important hostel announcements or maintenance updates."
              actionLabel="Create First Notice"
              onAction={() => setShowCreateModal(true)}
            />
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Broadcast Notice Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Broadcast Notice</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
              <Text style={styles.fieldLabel}>Notice Title *</Text>
              <TextInput
                style={styles.inputField}
                placeholder="e.g. Water Tank Maintenance Tomorrow"
                placeholderTextColor={Colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.fieldLabel}>Notice Body *</Text>
              <TextInput
                style={[styles.inputField, { height: 90, textAlignVertical: 'top' }]}
                placeholder="Detailed announcement content..."
                placeholderTextColor={Colors.textMuted}
                value={content}
                onChangeText={setContent}
                multiline
              />

              <Text style={styles.fieldLabel}>Priority Level</Text>
              <View style={styles.choiceRow}>
                {(['NORMAL', 'URGENT', 'CRITICAL'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.choiceChip, priority === p && styles.choiceChipActive]}
                    onPress={() => setPriority(p)}
                  >
                    <Text style={[styles.choiceText, priority === p && styles.choiceTextActive]}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.choiceRow}>
                {['General', 'Dining', 'Maintenance', 'Policy', 'Security'].map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.choiceChip, category === c && styles.choiceChipActive]}
                    onPress={() => setCategory(c)}
                  >
                    <Text style={[styles.choiceText, category === c && styles.choiceTextActive]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Audience Target</Text>
              <View style={styles.choiceRow}>
                {(['ALL', 'FLOOR', 'ROOM'] as const).map((a) => (
                  <TouchableOpacity
                    key={a}
                    style={[styles.choiceChip, audienceScope === a && styles.choiceChipActive]}
                    onPress={() => setAudienceScope(a)}
                  >
                    <Text style={[styles.choiceText, audienceScope === a && styles.choiceTextActive]}>
                      {a === 'ALL' ? 'All Residents' : `By ${a}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {audienceScope === 'FLOOR' && (
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.fieldLabel}>Target Floor Number</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="e.g. 2"
                    keyboardType="numeric"
                    value={targetFloor}
                    onChangeText={setTargetFloor}
                  />
                </View>
              )}

              {audienceScope === 'ROOM' && (
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.fieldLabel}>Target Room Number</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="e.g. 201"
                    value={targetRoom}
                    onChangeText={setTargetRoom}
                  />
                </View>
              )}

              <TouchableOpacity
                style={styles.publishBtn}
                onPress={() => {
                  if (!title.trim() || !content.trim()) {
                    Alert.alert('Missing Info', 'Please enter a title and notice content.');
                    return;
                  }
                  createNoticeMutation.mutate();
                }}
                disabled={createNoticeMutation.isPending}
              >
                {createNoticeMutation.isPending ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.publishBtnText}>Publish Announcement</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  topTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  topSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  broadcastBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  broadcastBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: 12,
    paddingBottom: 40,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  cardHeader: {
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '800',
  },
  categoryBadge: {
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  scopeBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  scopeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  noticeContent: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  authorText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  dateText: {
    fontSize: 11,
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
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 10,
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
  },
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  choiceChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  choiceChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  choiceText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  choiceTextActive: {
    color: '#FFF',
  },
  publishBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  publishBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
