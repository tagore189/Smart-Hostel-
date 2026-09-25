import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/Theme';
import { AppHeader } from '../../components/AppHeader';
import { Card } from '../../components/Card';
import { api } from '../../services/api';
import { LoadingView, EmptyView, ErrorView } from '../../components/StateViews';

export default function AdminRoomsScreen() {
  const [selectedFloor, setSelectedFloor] = useState<number | 'ALL'>('ALL');
  const [selectedBed, setSelectedBed] = useState<any | null>(null);

  const {
    data: rooms,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['admin-rooms'],
    queryFn: async () => {
      const res = await api.get('/admin/rooms');
      return (res.data || []) as any[];
    },
  });

  const allRooms = rooms || [];
  const floors = Array.from(new Set(allRooms.map((r) => r.floorNumber))).sort((a, b) => a - b);

  const filteredRooms = selectedFloor === 'ALL'
    ? allRooms
    : allRooms.filter((r) => r.floorNumber === selectedFloor);

  // Compute stats
  let totalBeds = 0;
  let occupiedBeds = 0;
  let availableBeds = 0;

  allRooms.forEach((r) => {
    (r.beds || []).forEach((b: any) => {
      totalBeds++;
      if (b.status === 'OCCUPIED') occupiedBeds++;
      else if (b.status === 'AVAILABLE') availableBeds++;
    });
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader subtitle="Hostel Rooms & Bed Matrix" showBack />

      {/* Capacity Summary Bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{allRooms.length}</Text>
          <Text style={styles.summaryLabel}>Rooms</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: Colors.primary }]}>{occupiedBeds}</Text>
          <Text style={styles.summaryLabel}>Occupied Beds</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#059669' }]}>{availableBeds}</Text>
          <Text style={styles.summaryLabel}>Vacant Beds</Text>
        </View>
      </View>

      {/* Floor Filter */}
      <View style={styles.floorRow}>
        <TouchableOpacity
          style={[styles.floorChip, selectedFloor === 'ALL' && styles.floorChipActive]}
          onPress={() => setSelectedFloor('ALL')}
        >
          <Text style={[styles.floorChipText, selectedFloor === 'ALL' && styles.floorChipTextActive]}>
            All Floors
          </Text>
        </TouchableOpacity>
        {floors.map((fl) => (
          <TouchableOpacity
            key={fl}
            style={[styles.floorChip, selectedFloor === fl && styles.floorChipActive]}
            onPress={() => setSelectedFloor(fl)}
          >
            <Text style={[styles.floorChipText, selectedFloor === fl && styles.floorChipTextActive]}>
              Floor {fl}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main List */}
      {isLoading ? (
        <LoadingView message="Loading room allocations..." />
      ) : isError ? (
        <ErrorView error={error} onRetry={refetch} title="Failed to load rooms" />
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
          {filteredRooms.length > 0 ? (
            filteredRooms.map((room) => {
              const beds = room.beds || [];
              const occCount = beds.filter((b: any) => b.status === 'OCCUPIED').length;

              return (
                <View key={room._id} style={styles.roomCardWrapper}>
                  <Card>
                    <View style={styles.roomHeader}>
                      <View>
                        <View style={styles.roomTitleRow}>
                          <Text style={styles.roomNum}>Room {room.roomNumber}</Text>
                          <View style={styles.sharingBadge}>
                            <Text style={styles.sharingText}>{room.sharingType || `${beds.length}-Share`}</Text>
                          </View>
                          {room.hasAc && (
                            <View style={styles.acBadge}>
                              <Ionicons name="snow" size={11} color="#2563EB" />
                              <Text style={styles.acText}>AC</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.roomSub}>
                          Floor {room.floorNumber} · Wing {room.wing || 'A'} · ₹{room.monthlyRent || 8500}/mo
                        </Text>
                      </View>

                      <View style={styles.occupancyIndicator}>
                        <Text style={styles.occupancyRatio}>{occCount}/{beds.length}</Text>
                        <Text style={styles.occupancyLabel}>Occupied</Text>
                      </View>
                    </View>

                    <View style={styles.bedGrid}>
                      {beds.map((bed: any) => {
                        const isOccupied = bed.status === 'OCCUPIED';
                        const resident = bed.currentResident;

                        return (
                          <TouchableOpacity
                            key={bed._id || bed.bedCode}
                            style={[
                              styles.bedBox,
                              isOccupied ? styles.bedBoxOccupied : styles.bedBoxVacant,
                            ]}
                            onPress={() => setSelectedBed({ ...bed, roomNumber: room.roomNumber })}
                            activeOpacity={0.8}
                          >
                            <View style={styles.bedTop}>
                              <Ionicons
                                name="bed"
                                size={18}
                                color={isOccupied ? Colors.primary : '#059669'}
                              />
                              <Text style={styles.bedCodeText}>Bed {bed.bedCode}</Text>
                            </View>

                            {isOccupied && resident ? (
                              <Text style={styles.residentMiniName} numberOfLines={1}>
                                {resident.name}
                              </Text>
                            ) : (
                              <Text style={styles.vacantMiniText}>Vacant</Text>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </Card>
                </View>
              );
            })
          ) : (
            <EmptyView
              icon="business-outline"
              title="No Rooms Found"
              message="No rooms mapped for the selected floor."
            />
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Bed Details Modal */}
      <Modal
        visible={!!selectedBed}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedBed(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bedModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bed Details</Text>
              <TouchableOpacity onPress={() => setSelectedBed(null)}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedBed && (
              <View style={{ gap: 12 }}>
                <View style={styles.bedModalHeader}>
                  <View style={styles.bedModalIcon}>
                    <Ionicons name="bed" size={26} color={Colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.bedModalTitle}>
                      Room {selectedBed.roomNumber} — Bed {selectedBed.bedCode}
                    </Text>
                    <Text style={styles.bedModalStatus}>
                      Status: {selectedBed.status}
                    </Text>
                  </View>
                </View>

                {selectedBed.status === 'OCCUPIED' && selectedBed.currentResident ? (
                  <View style={styles.residentDetailBox}>
                    <Text style={styles.boxTitle}>Current Resident</Text>
                    <Text style={styles.boxValName}>{selectedBed.currentResident.name}</Text>
                    {selectedBed.currentResident.phone && (
                      <Text style={styles.boxValPhone}>📞 {selectedBed.currentResident.phone}</Text>
                    )}
                  </View>
                ) : (
                  <View style={styles.vacantDetailBox}>
                    <Ionicons name="checkmark-circle" size={22} color="#059669" />
                    <Text style={styles.vacantDetailText}>
                      This bed is currently available and ready for resident allocation.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: Spacing.gutter,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  floorRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  floorChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.surfaceSecondary,
  },
  floorChipActive: {
    backgroundColor: Colors.primaryLight,
  },
  floorChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  floorChipTextActive: {
    color: Colors.primary,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: 12,
    paddingBottom: 40,
  },
  roomCardWrapper: {
    marginBottom: 12,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  roomTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roomNum: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  sharingBadge: {
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sharingText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  acBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  acText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  roomSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  occupancyIndicator: {
    alignItems: 'flex-end',
  },
  occupancyRatio: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
  },
  occupancyLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  bedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bedBox: {
    flex: 1,
    minWidth: '28%',
    padding: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  bedBoxOccupied: {
    backgroundColor: Colors.primaryLight,
    borderColor: '#DDD6FE',
  },
  bedBoxVacant: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  bedTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  bedCodeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  residentMiniName: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  vacantMiniText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  bedModalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  bedModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bedModalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bedModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  bedModalStatus: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  residentDetailBox: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: 12,
    marginTop: 8,
  },
  boxTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  boxValName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  boxValPhone: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  vacantDetailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0FDF4',
    padding: 14,
    borderRadius: BorderRadius.md,
    marginTop: 8,
  },
  vacantDetailText: {
    fontSize: 13,
    color: '#065F46',
    flex: 1,
    fontWeight: '500',
  },
});
