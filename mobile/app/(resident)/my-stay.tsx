import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing, Shadows, BorderRadius } from '../../constants/Theme';
import { AppHeader } from '../../components/AppHeader';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../_layout';
import { api } from '../../services/api';

export default function MyStayScreen() {
  const { user, resident } = useAuth();

  const { data: stayData, refetch, isRefetching } = useQuery({
    queryKey: ['my-stay'],
    queryFn: async () => {
      try {
        const res = await api.get('/residents/my-stay');
        return res?.data || null;
      } catch {
        return null;
      }
    },
  });

  const stay = stayData;

  const formatDate = (d: string | undefined) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const roomNumber = resident?.roomNumber || stay?.room?.roomNumber || 'Unassigned';
  const bedCode = resident?.bedCode || resident?.bedNumber || stay?.bed?.bedCode || 'Unassigned';
  const floorNumber = resident?.floorNumber || stay?.room?.floorNumber;
  const wing = resident?.wing || stay?.room?.wing || 'Not assigned';
  const monthlyRent = resident?.monthlyRent ?? resident?.rentAmount ?? stay?.bed?.monthlyRent;
  const securityDeposit = resident?.securityDeposit ?? resident?.depositAmount;
  const moveInDate = resident?.joiningDate || resident?.moveInDate;
  const contractEndDate = resident?.agreementEndDate || resident?.contractEndDate;

  const emergencyName =
    resident?.emergencyContact?.name || resident?.emergencyContactName || 'Not provided';
  const emergencyRelation = resident?.emergencyContact?.relation || '';
  const emergencyPhone =
    resident?.emergencyContact?.phone || resident?.emergencyContactPhone || 'Not provided';

  const roommates = stay?.roommates || [];

  const facilities = stay?.room?.facilities || [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader subtitle="My Stay" />
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
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroOverlay}>
            <View style={[styles.heroAvatar, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#EDE9FE' }]}>
              <Text style={{ color: Colors.primary, fontSize: 22, fontWeight: '800' }}>{(user?.name || 'R').slice(0, 1).toUpperCase()}</Text>
            </View>
            <Text style={styles.heroName}>{user?.name || 'Resident'}</Text>
            <Text style={styles.heroEmail}>{user?.email || '—'}</Text>
            <View style={styles.heroBadges}>
              <StatusBadge status="success" label="Active Resident" />
              <View style={styles.roomCodePill}>
                <Ionicons name="bed" size={13} color="#FFFFFF" />
                <Text style={styles.roomCodePillText}>
                  Room {roomNumber} · Bed {bedCode}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Room Details */}
        <Text style={styles.sectionTitle}>Room Information</Text>
        <Card>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="home" size={20} color={Colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Room & Floor</Text>
              <Text style={styles.detailValue}>
                Room {roomNumber} · {floorNumber ? `Floor ${floorNumber}` : 'Floor unassigned'} · {wing}
              </Text>
            </View>
          </View>
          <View style={styles.separator} />
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="bed" size={20} color={Colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Assigned Bed</Text>
              <Text style={styles.detailValue}>Bed {bedCode} (Single Occupancy)</Text>
            </View>
          </View>
          <View style={styles.separator} />
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="people" size={20} color={Colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Sharing Type</Text>
              <Text style={styles.detailValue}>2-Sharing (Double Occupancy Room)</Text>
            </View>
          </View>
          <View style={styles.separator} />
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="wifi" size={20} color={Colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Room Wi-Fi Network</Text>
              <Text style={styles.detailValue}>{stay?.room?.wifiSsid || 'Ask hostel management for the room Wi-Fi details.'}</Text>
            </View>
          </View>
        </Card>

        {/* Roommates */}
        <Text style={styles.sectionTitle}>Roommates</Text>
        <Card>
          {roommates.map((rm: any, idx: number) => (
            <React.Fragment key={idx}>
              {idx > 0 && <View style={styles.separator} />}
              <View style={styles.detailRow}>
                <View style={[styles.detailIcon, { backgroundColor: '#F3E8FF' }]}>
                  <Ionicons name="person" size={20} color={Colors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.detailValue}>{rm.name}</Text>
                    <View style={styles.bedBadge}>
                      <Text style={styles.bedBadgeText}>Bed {rm.bedCode}</Text>
                    </View>
                  </View>
                  <Text style={styles.detailLabel}>{rm.workOrCollege}</Text>
                </View>
              </View>
            </React.Fragment>
          ))}
        </Card>

        {/* Stay Duration */}
        <Text style={styles.sectionTitle}>Stay & Agreement Duration</Text>
        <Card>
          <View style={styles.detailRow}>
            <View style={[styles.detailIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="calendar" size={20} color="#10B981" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Move-in Date</Text>
              <Text style={styles.detailValue}>{formatDate(moveInDate)}</Text>
            </View>
          </View>
          <View style={styles.separator} />
          <View style={styles.detailRow}>
            <View style={[styles.detailIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="time" size={20} color="#F59E0B" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Agreement End Date</Text>
              <Text style={styles.detailValue}>{formatDate(contractEndDate)}</Text>
            </View>
          </View>
        </Card>

        {/* Financial Summary */}
        <Text style={styles.sectionTitle}>Financial Summary</Text>
        <Card variant="lavender">
          <View style={styles.financeRow}>
            <View style={styles.financeItem}>
              <Text style={styles.financeLabel}>Monthly Rent</Text>
              <Text style={styles.financeValue}>{monthlyRent == null ? 'Not set' : `₹${monthlyRent.toLocaleString('en-IN')}`}</Text>
            </View>
            <View style={styles.financeDivider} />
            <View style={styles.financeItem}>
              <Text style={styles.financeLabel}>Security Deposit</Text>
              <Text style={[styles.financeValue, { color: Colors.success }]}>
                {securityDeposit == null ? 'Not set' : `₹${securityDeposit.toLocaleString('en-IN')}`}
              </Text>
            </View>
          </View>
        </Card>

        {/* Room Facilities */}
        <Text style={styles.sectionTitle}>Included Amenities & Facilities</Text>
        <Card>
          <View style={styles.facilitiesGrid}>
            {facilities.map((fac: string, idx: number) => (
              <View key={idx} style={styles.facilityItem}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                <Text style={styles.facilityText}>{fac}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Emergency Contact */}
        <Text style={styles.sectionTitle}>Emergency Contact</Text>
        <Card>
          <View style={styles.detailRow}>
            <View style={[styles.detailIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="call" size={20} color="#EF4444" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>
                {emergencyName} ({emergencyRelation})
              </Text>
              <Text style={styles.detailValue}>{emergencyPhone}</Text>
            </View>
          </View>
        </Card>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.gutter, paddingBottom: 32 },
  heroCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 16,
    marginBottom: 24,
    backgroundColor: Colors.primary,
    ...Shadows.elevated,
  },
  heroOverlay: {
    padding: 24,
    alignItems: 'center',
  },
  heroAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    marginBottom: 12,
  },
  heroName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  heroEmail: {
    fontSize: 13,
    color: '#E9D5FF',
    marginTop: 2,
    marginBottom: 12,
  },
  heroBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roomCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  roomCodePillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
    marginTop: 16,
    letterSpacing: -0.2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 14,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  bedBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  bedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  financeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  financeItem: {
    flex: 1,
    alignItems: 'center',
  },
  financeDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#DDD6FE',
  },
  financeLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  financeValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
  },
  facilitiesGrid: {
    gap: 10,
    paddingVertical: 4,
  },
  facilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  facilityText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
});
