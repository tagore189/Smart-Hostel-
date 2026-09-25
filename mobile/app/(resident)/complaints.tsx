import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Spacing, BorderRadius } from '../../constants/Theme';
import { AppHeader } from '../../components/AppHeader';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { api } from '../../services/api';

type TabKey = 'list' | 'new';

export default function ComplaintsScreen() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('list');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('maintenance');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['complaints'],
    queryFn: async () => {
      try {
        const res = await api.get('/complaints');
        return res.data || res.complaints || [];
      } catch {
        return [];
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return api.post('/complaints', { title, description, category });
    },
    onSuccess: () => {
      Alert.alert('Success', 'Your complaint has been submitted.');
      setTitle('');
      setDescription('');
      setActiveTab('list');
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to submit complaint.');
    },
  });

  const complaints = Array.isArray(data) ? data : [];

  const formatDate = (d: string) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return { status: 'success' as const, label: 'Resolved' };
      case 'in_progress':
      case 'in progress':
        return { status: 'warning' as const, label: 'In Progress' };
      case 'open':
      case 'pending':
        return { status: 'info' as const, label: 'Open' };
      default:
        return { status: 'info' as const, label: status || 'Open' };
    }
  };

  const categories = [
    { key: 'maintenance', label: 'Maintenance', icon: 'construct' as const },
    { key: 'plumbing', label: 'Plumbing', icon: 'water' as const },
    { key: 'electrical', label: 'Electrical', icon: 'flash' as const },
    { key: 'cleaning', label: 'Cleaning', icon: 'sparkles' as const },
    { key: 'other', label: 'Other', icon: 'ellipsis-horizontal' as const },
  ];

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a complaint title.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Missing Description', 'Please describe the issue.');
      return;
    }
    createMutation.mutate();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader subtitle="Complaints" showBack />

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['list', 'new'] as TabKey[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Ionicons
              name={tab === 'list' ? 'list' : 'add-circle'}
              size={18}
              color={activeTab === tab ? '#FFF' : Colors.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'list' ? 'My Complaints' : 'New Complaint'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[Colors.primary]} tintColor={Colors.primary} />
        }
      >
        {activeTab === 'list' ? (
          complaints.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-circle-outline" size={52} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Complaints</Text>
              <Text style={styles.emptySubtitle}>Everything looks great! Submit a complaint if you need help.</Text>
            </View>
          ) : (
            complaints.map((c: any, idx: number) => {
              const badge = getStatusStyle(c.status);
              return (
                <Card key={c._id || idx}>
                  <View style={styles.complaintHeader}>
                    <View style={styles.complaintTitleRow}>
                      <Text style={styles.complaintTitle}>{c.title}</Text>
                      <StatusBadge status={badge.status} label={badge.label} />
                    </View>
                    <Text style={styles.complaintDate}>{formatDate(c.createdAt)}</Text>
                  </View>
                  <Text style={styles.complaintDesc} numberOfLines={3}>{c.description}</Text>
                  {c.category && (
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{c.category}</Text>
                    </View>
                  )}
                </Card>
              );
            })
          )
        ) : (
          <View>
            {/* Category Selection */}
            <Text style={styles.formLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.categoryChip, category === cat.key && styles.categoryChipActive]}
                  onPress={() => setCategory(cat.key)}
                >
                  <Ionicons name={cat.icon} size={16} color={category === cat.key ? '#FFF' : Colors.textSecondary} />
                  <Text style={[styles.categoryChipText, category === cat.key && styles.categoryChipTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Title */}
            <Text style={styles.formLabel}>Title</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Leaking faucet in bathroom"
              placeholderTextColor={Colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            {/* Description */}
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Describe the issue in detail..."
              placeholderTextColor={Colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            {/* Submit */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={createMutation.isPending}
              activeOpacity={0.85}
            >
              {createMutation.isPending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#FFF" />
                  <Text style={styles.submitText}>Submit Complaint</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.gutter, paddingBottom: 32 },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surfaceSecondary,
  },
  activeTab: { backgroundColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  activeTabText: { color: '#FFF' },
  complaintHeader: { marginBottom: 8 },
  complaintTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  complaintTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, flex: 1, marginRight: 8 },
  complaintDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  complaintDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginTop: 4 },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 8,
  },
  categoryText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, textTransform: 'capitalize' },
  emptyState: { alignItems: 'center', paddingVertical: 50, gap: 6 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, marginTop: 8 },
  emptySubtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', maxWidth: 260 },
  formLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  categoryScroll: { marginBottom: 4 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  categoryChipTextActive: { color: '#FFF' },
  textInput: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    marginTop: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
