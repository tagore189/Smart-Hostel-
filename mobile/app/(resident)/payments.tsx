import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing, Shadows } from '../../constants/Theme';
import { AppHeader } from '../../components/AppHeader';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../_layout';
import { api } from '../../services/api';

type TabKey = 'upcoming' | 'history';

export default function PaymentsScreen() {
  const { resident } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      try {
        const res = await api.get('/payments');
        return res.data || res.payments || [];
      } catch {
        return [];
      }
    },
  });

  const payments = Array.isArray(data) ? data : [];

  const formatDate = (d: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'completed':
        return { status: 'success' as const, label: 'Paid' };
      case 'pending':
        return { status: 'warning' as const, label: 'Pending' };
      case 'overdue':
        return { status: 'error' as const, label: 'Overdue' };
      default:
        return { status: 'info' as const, label: status || 'Unknown' };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader subtitle="Payments" showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[Colors.primary]} tintColor={Colors.primary} />
        }
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Monthly Rent</Text>
          <Text style={styles.balanceAmount}>₹{resident?.rentAmount?.toLocaleString('en-IN') || '—'}</Text>
          <Text style={styles.balanceNote}>Due on 1st of every month</Text>
          <TouchableOpacity style={styles.payButton} activeOpacity={0.85}>
            <Ionicons name="card" size={18} color="#FFF" />
            <Text style={styles.payButtonText}>Pay Rent Now</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {(['upcoming', 'history'] as TabKey[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab === 'upcoming' ? 'Upcoming' : 'History'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment List */}
        {payments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Payments Yet</Text>
            <Text style={styles.emptySubtitle}>Your payment history will appear here.</Text>
          </View>
        ) : (
          payments.map((payment: any, index: number) => {
            const badge = getStatusBadge(payment.status);
            return (
              <Card key={payment._id || index}>
                <View style={styles.paymentRow}>
                  <View style={styles.paymentIcon}>
                    <Ionicons
                      name={payment.status === 'paid' ? 'checkmark-circle' : 'time'}
                      size={22}
                      color={payment.status === 'paid' ? Colors.success : Colors.warning}
                    />
                  </View>
                  <View style={styles.paymentContent}>
                    <Text style={styles.paymentTitle}>{payment.description || 'Monthly Rent'}</Text>
                    <Text style={styles.paymentDate}>{formatDate(payment.dueDate || payment.createdAt)}</Text>
                  </View>
                  <View style={styles.paymentRight}>
                    <Text style={styles.paymentAmount}>₹{payment.amount?.toLocaleString('en-IN') || '—'}</Text>
                    <StatusBadge status={badge.status} label={badge.label} />
                  </View>
                </View>
              </Card>
            );
          })
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
  balanceCard: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 24,
    marginTop: 16,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 4,
    letterSpacing: -1,
  },
  balanceNote: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  payButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: '#FFF',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentContent: { flex: 1 },
  paymentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  paymentDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  paymentRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
