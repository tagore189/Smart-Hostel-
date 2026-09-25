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
  TextInput,
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

export default function AdminRoomsScreen() {
  const queryClient = useQueryClient();
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [targetBedCode, setTargetBedCode] = useState<string>('A');
  const [targetResidentId, setTargetResidentId] = useState<string>('');

  // 1. Query Floor Summaries
  const {
    data: floors,
    isLoading: isFloorsLoading,
    isError: isFloorsError,
    error: floorsError,
    refetch: refetchFloors,
    isRefetching,
  } = useQuery({
    queryKey: ['admin-floors'],
    queryFn: async () => {
      const res = await api.get('/admin/floors');
      return (res.data || []) as any[];
    },
  });

  // 2. Query Detailed Rooms
  const {
    data: rooms,
    isLoading: isRoomsLoading,
    refetch: refetchRooms,
  } = useQuery({
    queryKey: ['admin-rooms', selectedFloor],
    queryFn: async () => {
      const url = selectedFloor ? `/admin/rooms?floor=${selectedFloor}` : '/admin/rooms';
      const res = await api.get(url);
      return (res.data || []) as any[];
    },
  });

  // 3. Query Residents for Bed Assignment
  const { data: allResidents } = useQuery({
    queryKey: ['admin-residents-unassigned'],
    queryFn: async () => {
      const res = await api.get('/admin/residents');
      return (res.data || []) as any[];
    },
    enabled: isAssignModalOpen,
  });

  // Assign Bed Mutation
  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRoom || !targetResidentId) throw new Error('Please select a resident');
      return await api.put('/admin/rooms/assign', {
        roomNumber: selectedRoom.roomNumber,
        bedCode: targetBedCode,
        residentId: targetResidentId,
      });
    },
    onSuccess: (res) => {
      Alert.alert('Assignment Successful', res.message || 'Bed assigned');
      setIsAssignModalOpen(false);
      setSelectedRoom(null);
      queryClient.invalidateQueries({ queryKey: ['admin-floors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
    onError: (err: any) => {
      Alert.alert('Assignment Error', err.message || 'Failed to assign bed');
    },
  });

  // Vacate Bed Mutation
  const vacateMutation = useMutation({
    mutationFn: async (bedCode: string) => {
      if (!selectedRoom) return;
      return await api.put('/admin/rooms/vacate', {
        roomNumber: selectedRoom.roomNumber,
        bedCode,
      });
    },
    onSuccess: (res) => {
      Alert.alert('Bed Vacated', res.message || 'Bed marked vacant');
      setSelectedRoom(null);
      queryClient.invalidateQueries({ queryKey: ['admin-floors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to vacate bed');
    },
  });

  const handleRefresh = () => {
    refetchFloors();
    refetchRooms();
  };

  const floorsList = floors || [];
  const currentFloorData = floorsList.find((f) => f.floorNumber === selectedFloor);
  const roomsList = rooms || [];

  // Compute building total stats
  const totalBedsBuilding = floorsList.reduce((sum, f) => sum + (f.totalBeds || 0), 0);
  const occupiedBedsBuilding = floorsList.reduce((sum, f) => sum + (f.occupiedBeds || 0), 0);
  const vacantBedsBuilding = floorsList.reduce((sum, f) => sum + (f.vacantBeds || 0), 0);
  const totalResidentsBuilding = floorsList.reduce((sum, f) => sum + (f.totalResidents || 0), 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader subtitle="Floors & Rooms" showBack />

      {/* Building Overview Summary */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalResidentsBuilding}</Text>
          <Text style={styles.summaryLabel}>Total Residents</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: Colors.primary }]}>{occupiedBedsBuilding}</Text>
          <Text style={styles.summaryLabel}>Occupied Beds</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#059669' }]}>{vacantBedsBuilding}</Text>
          <Text style={styles.summaryLabel}>Vacant Beds</Text>
        </View>
      </View>

      {/* Navigation Breadcrumb if in Floor Detail */}
      {selectedFloor && (
        <View style={styles.breadcrumbBar}>
          <TouchableOpacity
            style={styles.backToBuildingBtn}
            onPress={() => setSelectedFloor(null)}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={16} color={Colors.primary} />
            <Text style={styles.backToBuildingText}>All Floors</Text>
          </TouchableOpacity>
          <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
          <Text style={styles.breadcrumbCurrent}>{currentFloorData?.name || `Floor ${selectedFloor}`}</Text>
        </View>
      )}

      {isFloorsLoading || isRoomsLoading ? (
        <LoadingView message="Loading building floor matrix..." />
      ) : isFloorsError ? (
        <ErrorView error={floorsError} onRetry={handleRefresh} title="Failed to load floors" />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        >
          {/* VIEW A: BUILDING OVERVIEW (ALL FLOORS LIST) */}
          {!selectedFloor ? (
            <View style={styles.floorsContainer}>
              <Text style={styles.sectionHeading}>Building Floor-by-Floor Overview</Text>
              <Text style={styles.sectionSub}>Tap any floor to inspect rooms and resident bed assignments</Text>

              {floorsList.map((floor) => (
                <TouchableOpacity
                  key={floor.floorNumber}
                  style={styles.floorCardWrapper}
                  onPress={() => setSelectedFloor(floor.floorNumber)}
                  activeOpacity={0.85}
                >
                  <Card style={styles.floorCard}>
                    <View style={styles.floorHeader}>
                      <View>
                        <Text style={styles.floorTitle}>{floor.name}</Text>
                        <Text style={styles.floorStatsSub}>
                          {floor.totalResidents} Residents · {floor.occupiedBeds} Occupied · {floor.vacantBeds} Vacant
                        </Text>
                      </View>
                      <View style={styles.floorArrowBox}>
                        <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
                      </View>
                    </View>

                    {/* Room Chips Matrix for this floor (e.g. Room 101 2/2, Room 102 1/2) */}
                    <View style={styles.roomsMiniGrid}>
                      {(floor.rooms || []).map((r: any) => {
                        const isFull = r.occupiedBeds >= r.totalBeds;
                        return (
                          <View
                            key={r.roomNumber}
                            style={[
                              styles.miniRoomChip,
                              isFull ? styles.miniRoomChipFull : styles.miniRoomChipVacant,
                            ]}
                          >
                            <Text style={styles.miniRoomNum}>Room {r.roomNumber}</Text>
                            <Text style={[styles.miniRoomRatio, isFull ? styles.textFull : styles.textVacant]}>
                              {r.ratio}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            /* VIEW B: FLOOR DRILL-DOWN (ROOMS LIST FOR SELECTED FLOOR) */
            <View style={styles.roomsContainer}>
              {currentFloorData && (
                <View style={styles.floorHeroCard}>
                  <Text style={styles.floorHeroTitle}>{currentFloorData.name}</Text>
                  <View style={styles.heroStatsRow}>
                    <View style={styles.heroStatItem}>
                      <Text style={styles.heroStatValue}>{currentFloorData.totalResidents}</Text>
                      <Text style={styles.heroStatLabel}>Total Residents</Text>
                    </View>
                    <View style={styles.heroStatItem}>
                      <Text style={[styles.heroStatValue, { color: Colors.primary }]}>
                        {currentFloorData.occupiedBeds}
                      </Text>
                      <Text style={styles.heroStatLabel}>Occupied Beds</Text>
                    </View>
                    <View style={styles.heroStatItem}>
                      <Text style={[styles.heroStatValue, { color: '#059669' }]}>
                        {currentFloorData.vacantBeds}
                      </Text>
                      <Text style={styles.heroStatLabel}>Vacant Beds</Text>
                    </View>
                  </View>
                </View>
              )}

              <Text style={styles.sectionHeading}>Rooms on {currentFloorData?.name || `Floor ${selectedFloor}`}</Text>
              <Text style={styles.sectionSub}>Tap any room to see bed occupants & payment status</Text>

              {roomsList.length > 0 ? (
                roomsList.map((room) => {
                  const beds = room.beds || [];
                  const occCount = beds.filter((b: any) => b.status === 'OCCUPIED').length;

                  return (
                    <TouchableOpacity
                      key={room._id || room.roomNumber}
                      style={styles.roomItemWrapper}
                      onPress={() => setSelectedRoom(room)}
                      activeOpacity={0.8}
                    >
                      <Card>
                        <View style={styles.roomHeaderRow}>
                          <View>
                            <View style={styles.roomTitleWrap}>
                              <Text style={styles.roomNumberText}>Room {room.roomNumber}</Text>
                              <View style={styles.sharingTag}>
                                <Text style={styles.sharingTagText}>{room.sharingType || `${beds.length}-Share`}</Text>
                              </View>
                              {room.hasAc && (
                                <View style={styles.acTag}>
                                  <Ionicons name="snow" size={12} color="#2563EB" />
                                  <Text style={styles.acTagText}>AC</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.roomSubInfo}>
                              Wing {room.wing || 'A'} · ₹{room.monthlyRent || 8000}/mo
                            </Text>
                          </View>

                          <View style={styles.roomRatioBadge}>
                            <Text style={styles.roomRatioNum}>{occCount}/{beds.length}</Text>
                            <Text style={styles.roomRatioLabel}>Beds Occupied</Text>
                          </View>
                        </View>

                        {/* Bed Row Inside Room Card */}
                        <View style={styles.bedMiniRow}>
                          {beds.map((b: any) => {
                            const isOcc = b.status === 'OCCUPIED';
                            const resObj = b.currentResident;
                            const isPaid = b.paymentStatus === 'PAID';

                            return (
                              <View
                                key={b.bedCode}
                                style={[styles.bedMiniBox, isOcc ? styles.bedMiniBoxOcc : styles.bedMiniBoxVac]}
                              >
                                <View style={styles.bedMiniTop}>
                                  <Ionicons name="bed" size={14} color={isOcc ? Colors.primary : '#059669'} />
                                  <Text style={styles.bedMiniCode}>Bed {b.bedCode}</Text>
                                </View>
                                {isOcc && resObj ? (
                                  <>
                                    <Text style={styles.resMiniName} numberOfLines={1}>{resObj.name}</Text>
                                    <View style={[styles.paymentPill, isPaid ? styles.pillPaid : styles.pillPending]}>
                                      <Text style={[styles.pillText, isPaid ? styles.textPaid : styles.textPending]}>
                                        {isPaid ? 'PAID' : 'PENDING'}
                                      </Text>
                                    </View>
                                  </>
                                ) : (
                                  <Text style={styles.vacMiniText}>Vacant</Text>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      </Card>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <EmptyView
                  icon="business-outline"
                  title="No Rooms Found"
                  message={`No rooms allocated on floor ${selectedFloor}.`}
                />
              )}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ROOM DETAIL MODAL (SECTION 19) */}
      <Modal
        visible={!!selectedRoom}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedRoom(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.roomModalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalRoomTitle}>Room {selectedRoom?.roomNumber}</Text>
                <Text style={styles.modalRoomSub}>
                  Floor {selectedRoom?.floorNumber} · Wing {selectedRoom?.wing || 'A'} · {selectedRoom?.sharingType || 'Double Share'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedRoom(null)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedRoom && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalSectionLabel}>Bed Assignments & Rent Status</Text>

                <View style={styles.modalBedsList}>
                  {(selectedRoom.beds || []).map((bed: any) => {
                    const isOccupied = bed.status === 'OCCUPIED';
                    const resident = bed.currentResident;
                    const isPaid = bed.paymentStatus === 'PAID';

                    return (
                      <View key={bed.bedCode} style={styles.bedDetailCard}>
                        <View style={styles.bedDetailTop}>
                          <View style={styles.bedCodeCircle}>
                            <Ionicons name="bed" size={20} color={isOccupied ? Colors.primary : '#059669'} />
                            <Text style={styles.bedCircleText}>Bed {bed.bedCode}</Text>
                          </View>

                          <View style={styles.bedStatusArea}>
                            {isOccupied ? (
                              <View style={[styles.paymentBadge, isPaid ? styles.badgePaid : styles.badgePending]}>
                                <Ionicons
                                  name={isPaid ? 'checkmark-circle' : 'time'}
                                  size={13}
                                  color={isPaid ? '#059669' : '#DC2626'}
                                />
                                <Text style={[styles.badgeText, isPaid ? styles.textPaid : styles.textPending]}>
                                  {isPaid ? 'PAID' : 'PENDING'}
                                </Text>
                              </View>
                            ) : (
                              <View style={styles.vacantBadge}>
                                <Text style={styles.vacantBadgeText}>AVAILABLE</Text>
                              </View>
                            )}
                          </View>
                        </View>

                        {isOccupied && resident ? (
                          <View style={styles.residentInfoRow}>
                            <View style={styles.resAvatarMini}>
                              <Text style={styles.resAvatarMiniText}>
                                {resident.name?.substring(0, 2).toUpperCase() || 'RE'}
                              </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.residentDetailName}>{resident.name}</Text>
                              {resident.phone && (
                                <Text style={styles.residentDetailPhone}>📞 {resident.phone}</Text>
                              )}
                            </View>

                            <TouchableOpacity
                              style={styles.vacateBtn}
                              onPress={() =>
                                Alert.alert(
                                  'Vacate Bed',
                                  `Are you sure you want to mark Bed ${bed.bedCode} in Room ${selectedRoom.roomNumber} as vacant?`,
                                  [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'Vacate', style: 'destructive', onPress: () => vacateMutation.mutate(bed.bedCode) },
                                  ]
                                )
                              }
                            >
                              <Text style={styles.vacateBtnText}>Vacate</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View style={styles.vacantActionRow}>
                            <Text style={styles.vacantReadyText}>This bed is vacant and ready for check-in.</Text>
                            <TouchableOpacity
                              style={styles.assignBtn}
                              onPress={() => {
                                setTargetBedCode(bed.bedCode);
                                setIsAssignModalOpen(true);
                              }}
                            >
                              <Ionicons name="person-add" size={14} color="#FFF" />
                              <Text style={styles.assignBtnText}>Assign Resident</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ASSIGN RESIDENT MODAL */}
      <Modal
        visible={isAssignModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsAssignModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.assignModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalRoomTitle}>
                Assign Bed {targetBedCode} (Room {selectedRoom?.roomNumber})
              </Text>
              <TouchableOpacity onPress={() => setIsAssignModalOpen(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.assignSub}>Select an active resident to assign to this bed:</Text>

            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              {allResidents && allResidents.length > 0 ? (
                allResidents.map((r) => (
                  <TouchableOpacity
                    key={r._id}
                    style={[
                      styles.resOptionRow,
                      targetResidentId === r._id && styles.resOptionRowActive,
                    ]}
                    onPress={() => setTargetResidentId(r._id)}
                  >
                    <View>
                      <Text style={styles.resOptionName}>{r.name}</Text>
                      <Text style={styles.resOptionSub}>
                        {r.phone} · Currently Room {r.roomNumber || 'None'}
                      </Text>
                    </View>
                    {targetResidentId === r._id && (
                      <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyText}>No residents available.</Text>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.confirmAssignBtn, !targetResidentId && styles.btnDisabled]}
              onPress={() => assignMutation.mutate()}
              disabled={!targetResidentId || assignMutation.isPending}
            >
              {assignMutation.isPending ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.confirmAssignText}>Confirm Bed Assignment</Text>
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
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: Spacing.gutter,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 18, fontWeight: '800', color: Colors.text },
  summaryLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', marginTop: 2 },
  divider: { width: 1, height: 28, backgroundColor: Colors.border },
  breadcrumbBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 8,
    gap: 6,
  },
  backToBuildingBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backToBuildingText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  breadcrumbCurrent: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: 16,
    paddingBottom: 40,
  },
  sectionHeading: { fontSize: 16, fontWeight: '800', color: Colors.text },
  sectionSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, marginBottom: 14 },
  floorsContainer: { gap: 14 },
  floorCardWrapper: { marginBottom: 6 },
  floorCard: { padding: 16 },
  floorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  floorTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  floorStatsSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  floorArrowBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomsMiniGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  miniRoomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  miniRoomChipFull: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  miniRoomChipVacant: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  miniRoomNum: { fontSize: 12, fontWeight: '700', color: Colors.text },
  miniRoomRatio: { fontSize: 11, fontWeight: '800' },
  textFull: { color: Colors.textSecondary },
  textVacant: { color: '#059669' },
  roomsContainer: { gap: 12 },
  floorHeroCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: 18,
    marginBottom: 16,
    ...Shadows.card,
  },
  floorHeroTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', textAlign: 'center' },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
  },
  heroStatItem: { alignItems: 'center' },
  heroStatValue: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  heroStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  roomItemWrapper: { marginBottom: 4 },
  roomHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  roomNumberText: { fontSize: 16, fontWeight: '800', color: Colors.text },
  sharingTag: {
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sharingTagText: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary },
  acTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  acTagText: { fontSize: 10, fontWeight: '700', color: '#2563EB' },
  roomSubInfo: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  roomRatioBadge: { alignItems: 'flex-end' },
  roomRatioNum: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  roomRatioLabel: { fontSize: 10, color: Colors.textSecondary },
  bedMiniRow: { flexDirection: 'row', gap: 8 },
  bedMiniBox: {
    flex: 1,
    padding: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  bedMiniBoxOcc: { backgroundColor: '#FAF5FF', borderColor: '#E9D5FF' },
  bedMiniBoxVac: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  bedMiniTop: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  bedMiniCode: { fontSize: 12, fontWeight: '700', color: Colors.text },
  resMiniName: { fontSize: 12, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  vacMiniText: { fontSize: 11, fontWeight: '600', color: '#059669', fontStyle: 'italic' },
  paymentPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  pillPaid: { backgroundColor: '#D1FAE5' },
  pillPending: { backgroundColor: '#FEE2E2' },
  pillText: { fontSize: 9, fontWeight: '800' },
  textPaid: { color: '#059669' },
  textPending: { color: '#DC2626' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  roomModalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalRoomTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  modalRoomSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  modalSectionLabel: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 10 },
  modalBedsList: { gap: 12, marginBottom: 20 },
  bedDetailCard: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bedDetailTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  bedCodeCircle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bedCircleText: { fontSize: 15, fontWeight: '800', color: Colors.text },
  bedStatusArea: {},
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  badgePaid: { backgroundColor: '#D1FAE5' },
  badgePending: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 11, fontWeight: '800' },
  vacantBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  vacantBadgeText: { fontSize: 10, fontWeight: '800', color: '#059669' },
  residentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 10,
    borderRadius: BorderRadius.md,
    gap: 10,
  },
  resAvatarMini: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resAvatarMiniText: { fontSize: 12, fontWeight: '800', color: Colors.primary },
  residentDetailName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  residentDetailPhone: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  vacateBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  vacateBtnText: { fontSize: 11, fontWeight: '700', color: '#DC2626' },
  vacantActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  vacantReadyText: { fontSize: 11, color: Colors.textSecondary, flex: 1 },
  assignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  assignBtnText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  assignModalCard: {
    backgroundColor: Colors.surface,
    margin: 20,
    borderRadius: BorderRadius.xl,
    padding: 20,
  },
  assignSub: { fontSize: 13, color: Colors.textSecondary, marginBottom: 12 },
  resOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceSecondary,
    marginBottom: 6,
  },
  resOptionRowActive: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  resOptionName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  resOptionSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  confirmAssignBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: 16,
  },
  confirmAssignText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  btnDisabled: { opacity: 0.5 },
  emptyText: { textAlign: 'center', color: Colors.textMuted, paddingVertical: 16 },
});
