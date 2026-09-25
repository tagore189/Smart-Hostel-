import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/Theme';
import { AppHeader } from '../../components/AppHeader';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { api } from '../../services/api';
import { LoadingView, EmptyView, ErrorView } from '../../components/StateViews';

const DEPARTMENTS = ['ALL', 'Security', 'Maintenance', 'Housekeeping', 'Kitchen', 'Administration'] as const;

export default function AdminStaffScreen() {
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  const {
    data: staff,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['admin-staff'],
    queryFn: async () => {
      const res = await api.get('/admin/staff');
      return (res.data || []) as any[];
    },
  });

  const staffList = staff || [];
  const filteredStaff = selectedDept === 'ALL'
    ? staffList
    : staffList.filter((s) => s.department === selectedDept);

  const getDeptIcon = (dept: string): keyof typeof Ionicons.glyphMap => {
    switch (dept) {
      case 'Security': return 'shield-checkmark';
      case 'Maintenance': return 'construct';
      case 'Housekeeping': return 'sparkles';
      case 'Kitchen': return 'restaurant';
      default: return 'briefcase';
    }
  };

  const handleCall = (phone: string) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader subtitle="Hostel On-Site Staff & Duty Roster" showBack />

      {/* Department Filter Chips */}
      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {DEPARTMENTS.map((dept) => (
            <TouchableOpacity
              key={dept}
              style={[styles.filterChip, selectedDept === dept && styles.filterChipActive]}
              onPress={() => setSelectedDept(dept)}
            >
              <Text style={[styles.filterChipText, selectedDept === dept && styles.filterChipTextActive]}>
                {dept}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Staff List */}
      {isLoading ? (
        <LoadingView message="Loading staff directory..." />
      ) : isError ? (
        <ErrorView error={error} onRetry={refetch} title="Failed to load staff" />
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
          {filteredStaff.length > 0 ? (
            filteredStaff.map((person) => (
              <View key={person._id} style={styles.staffCardWrapper}>
                <Card>
                  <View style={styles.cardHeader}>
                    <View style={styles.deptIconBox}>
                      <Ionicons name={getDeptIcon(person.department)} size={22} color={Colors.primary} />
                    </View>
                    <View style={styles.headerInfo}>
                      <Text style={styles.staffName}>{person.name}</Text>
                      <Text style={styles.staffRole}>{person.role} · {person.department}</Text>
                    </View>
                    <StatusBadge status={person.status || 'ACTIVE'} />
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.metaRow}>
                    <View style={styles.shiftBadge}>
                      <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
                      <Text style={styles.shiftText}>{person.shift || 'DAY'} Shift</Text>
                    </View>

                    {person.phone && (
                      <TouchableOpacity
                        style={styles.callBtn}
                        onPress={() => handleCall(person.phone)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="call" size={14} color="#FFF" />
                        <Text style={styles.callBtnText}>Call ({person.phone})</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </Card>
              </View>
            ))
          ) : (
            <EmptyView
              icon="people-outline"
              title="No Staff Found"
              message="No staff members registered in this department."
            />
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  filterWrap: {
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
  staffCardWrapper: {
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deptIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: { flex: 1 },
  staffName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  staffRole: {
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
    alignItems: 'center',
  },
  shiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  shiftText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  callBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
