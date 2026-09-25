import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing } from '../../constants/Theme';
import { AppHeader } from '../../components/AppHeader';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { api } from '../../services/api';

export default function NoticesScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['notices'],
    queryFn: async () => {
      try {
        const res = await api.get('/notices');
        return res.data || res.notices || [];
      } catch {
        return [];
      }
    },
  });

  const notices = Array.isArray(data) ? data : [];

  const formatDate = (d: string) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
      case 'high':
        return Colors.error;
      case 'medium':
        return Colors.warning;
      default:
        return Colors.primary;
    }
  };

  const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
    switch (category?.toLowerCase()) {
      case 'maintenance':
        return 'construct';
      case 'event':
        return 'calendar';
      case 'rules':
        return 'document-text';
      case 'safety':
        return 'shield-checkmark';
      default:
        return 'megaphone';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader subtitle="Notices" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[Colors.primary]} tintColor={Colors.primary} />
        }
      >
        <Text style={styles.pageTitle}>Notices & Announcements</Text>
        <Text style={styles.pageSubtitle}>Stay updated with hostel news</Text>

        {notices.length === 0 && !isLoading ? (
          <View style={styles.emptyState}>
            <Ionicons name="megaphone-outline" size={52} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Notices Yet</Text>
            <Text style={styles.emptySubtitle}>
              Important announcements from the hostel management will appear here.
            </Text>
          </View>
        ) : (
          notices.map((notice: any, index: number) => (
            <Card key={notice._id || index}>
              <View style={styles.noticeHeader}>
                <View style={[styles.categoryIcon, { backgroundColor: getPriorityColor(notice.priority) + '18' }]}>
                  <Ionicons name={getCategoryIcon(notice.category)} size={20} color={getPriorityColor(notice.priority)} />
                </View>
                <View style={styles.noticeHeaderText}>
                  <Text style={styles.noticeTitle}>{notice.title}</Text>
                  <Text style={styles.noticeDate}>{formatDate(notice.createdAt)}</Text>
                </View>
                {notice.priority && (
                  <StatusBadge
                    status={notice.priority?.toLowerCase() === 'urgent' ? 'error' : notice.priority?.toLowerCase() === 'medium' ? 'warning' : 'info'}
                    label={notice.priority}
                  />
                )}
              </View>
              <Text style={styles.noticeBody}>{notice.content || notice.body || notice.description}</Text>
              {notice.postedBy && (
                <Text style={styles.postedBy}>— {notice.postedBy?.name || 'Hostel Management'}</Text>
              )}
            </Card>
          ))
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
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 20,
    letterSpacing: -0.4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 24,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noticeHeaderText: { flex: 1 },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  noticeDate: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  noticeBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: 4,
  },
  postedBy: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 10,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 260,
  },
});
