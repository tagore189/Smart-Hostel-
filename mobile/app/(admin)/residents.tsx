import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Modal,
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

export default function AdminResidentsScreen() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [selectedResident, setSelectedResident] = useState<any | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New resident form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [bedCode, setBedCode] = useState('A');
  const [monthlyRent, setMonthlyRent] = useState('8500');
  const [securityDeposit, setSecurityDeposit] = useState('10000');
  const [workOrCollege, setWorkOrCollege] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  const {
    data: residents,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['admin-residents', search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      const res = await api.get(`/admin/residents?${params.toString()}`);
      return (res.data || []) as any[];
    },
  });

  const addResidentMutation = useMutation({
    mutationFn: async () => {
      return await api.post('/admin/residents', {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        roomNumber: roomNumber.trim(),
        bedCode: bedCode.trim().toUpperCase(),
        monthlyRent: Number(monthlyRent),
        securityDeposit: Number(securityDeposit),
        workOrCollege: workOrCollege.trim(),
        emergencyContactName: emergencyName.trim(),
        emergencyContactPhone: emergencyPhone.trim(),
      });
    },
    onSuccess: (response: any) => {
      const temporaryPassword = response?.data?.temporaryPassword;
      Alert.alert(
        'Resident created',
        temporaryPassword
          ? `Share this temporary password securely with the resident, then ask them to change it: ${temporaryPassword}`
          : 'Resident profile registered successfully.'
      );
      setShowAddModal(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-residents'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
    onError: (err: any) => {
      Alert.alert('Registration Failed', err.message || 'Could not register resident');
    },
  });

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setRoomNumber('');
    setBedCode('A');
    setMonthlyRent('8500');
    setSecurityDeposit('10000');
    setWorkOrCollege('');
    setEmergencyName('');
    setEmergencyPhone('');
  };

  const handleCall = (phoneNumber: string) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader subtitle="Resident Directory" showBack />

      {/* Top Controls & Search Bar */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, room or phone..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add" size={18} color="#FFF" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Status Filters */}
      <View style={styles.filterRow}>
        {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
          <TouchableOpacity
            key={st}
            style={[styles.filterChip, statusFilter === st && styles.filterChipActive]}
            onPress={() => setStatusFilter(st)}
          >
            <Text style={[styles.filterChipText, statusFilter === st && styles.filterChipTextActive]}>
              {st === 'ALL' ? 'All Residents' : st}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main List */}
      {isLoading ? (
        <LoadingView message="Loading resident directory..." />
      ) : isError ? (
        <ErrorView error={error} onRetry={refetch} title="Failed to load residents" />
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
          {residents && residents.length > 0 ? (
            residents.map((res: any) => (
              <TouchableOpacity
                key={res._id}
                style={styles.residentCardWrapper}
                onPress={() => setSelectedResident(res)}
                activeOpacity={0.75}
              >
                <Card>
                  <View style={styles.cardHeader}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {res.name ? res.name.substring(0, 2).toUpperCase() : 'PG'}
                      </Text>
                    </View>
                    <View style={styles.headerInfo}>
                      <Text style={styles.residentName}>{res.name}</Text>
                      <Text style={styles.residentRoom}>
                        Room {res.roomNumber} · Bed {res.bedCode}
                      </Text>
                    </View>
                    <StatusBadge status={res.status} />
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.cardDetails}>
                    <View style={styles.detailItem}>
                      <Ionicons name="call-outline" size={14} color={Colors.textMuted} />
                      <Text style={styles.detailText}>{res.phone}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="cash-outline" size={14} color={Colors.textMuted} />
                      <Text style={styles.detailText}>₹{res.monthlyRent}/mo</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
                      <Text style={styles.detailText}>
                        Joined {res.joiningDate ? new Date(res.joiningDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Recent'}
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          ) : (
            <EmptyView
              icon="people-outline"
              title="No Residents Found"
              message={search ? `No resident matches "${search}".` : 'No resident registered yet.'}
              actionLabel={search ? 'Clear Search' : 'Add First Resident'}
              onAction={search ? () => setSearch('') : () => setShowAddModal(true)}
            />
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Resident Details Modal */}
      <Modal
        visible={!!selectedResident}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedResident(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Resident Details</Text>
              <TouchableOpacity onPress={() => setSelectedResident(null)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedResident && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailTop}>
                  <View style={styles.detailAvatar}>
                    <Text style={styles.detailAvatarText}>
                      {selectedResident.name.substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.detailName}>{selectedResident.name}</Text>
                  <Text style={styles.detailSubtitle}>
                    Room {selectedResident.roomNumber} (Bed {selectedResident.bedCode}) · Wing {selectedResident.wing || 'A'}
                  </Text>
                  <View style={{ marginTop: 6 }}>
                    <StatusBadge status={selectedResident.status} />
                  </View>
                </View>

                <View style={styles.infoSection}>
                  <Text style={styles.sectionLabel}>Contact Information</Text>
                  <TouchableOpacity
                    style={styles.infoRow}
                    onPress={() => handleCall(selectedResident.phone)}
                  >
                    <Ionicons name="call" size={18} color={Colors.primary} />
                    <Text style={[styles.infoVal, { color: Colors.primary }]}>{selectedResident.phone}</Text>
                    <Ionicons name="open-outline" size={16} color={Colors.primary} />
                  </TouchableOpacity>
                  <View style={styles.infoRow}>
                    <Ionicons name="mail" size={18} color={Colors.textMuted} />
                    <Text style={styles.infoVal}>{selectedResident.email}</Text>
                  </View>
                  {selectedResident.workOrCollege && (
                    <View style={styles.infoRow}>
                      <Ionicons name="briefcase" size={18} color={Colors.textMuted} />
                      <Text style={styles.infoVal}>{selectedResident.workOrCollege}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.infoSection}>
                  <Text style={styles.sectionLabel}>Stay & Financials</Text>
                  <View style={styles.infoRow}>
                    <Ionicons name="wallet-outline" size={18} color={Colors.textMuted} />
                    <Text style={styles.infoVal}>Monthly Rent: ₹{selectedResident.monthlyRent}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="shield-checkmark-outline" size={18} color={Colors.textMuted} />
                    <Text style={styles.infoVal}>Security Deposit: ₹{selectedResident.securityDeposit}</Text>
                  </View>
                </View>

                {selectedResident.emergencyContact && (
                  <View style={styles.infoSection}>
                    <Text style={styles.sectionLabel}>Emergency Contact</Text>
                    <TouchableOpacity
                      style={styles.infoRow}
                      onPress={() => handleCall(selectedResident.emergencyContact.phone)}
                    >
                      <Ionicons name="heart" size={18} color="#DC2626" />
                      <Text style={styles.infoVal}>
                        {selectedResident.emergencyContact.name} ({selectedResident.emergencyContact.relation || 'Parent'}): {selectedResident.emergencyContact.phone}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Add Resident Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.formModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register New Resident</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
              <Text style={styles.fieldLabel}>Full Name *</Text>
              <TextInput style={styles.formInput} placeholder="e.g. Priya Sharma" value={name} onChangeText={setName} />

              <Text style={styles.fieldLabel}>Phone Number *</Text>
              <TextInput style={styles.formInput} placeholder="10-digit phone number" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

              <Text style={styles.fieldLabel}>Email Address *</Text>
              <TextInput style={styles.formInput} placeholder="priya@example.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Room Number *</Text>
                  <TextInput style={styles.formInput} placeholder="e.g. 201" value={roomNumber} onChangeText={setRoomNumber} />
                </View>
                <View style={{ width: 100 }}>
                  <Text style={styles.fieldLabel}>Bed Code *</Text>
                  <TextInput style={styles.formInput} placeholder="A, B, C" autoCapitalize="characters" value={bedCode} onChangeText={setBedCode} />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Monthly Rent (₹)</Text>
                  <TextInput style={styles.formInput} keyboardType="numeric" value={monthlyRent} onChangeText={setMonthlyRent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Deposit (₹)</Text>
                  <TextInput style={styles.formInput} keyboardType="numeric" value={securityDeposit} onChangeText={setSecurityDeposit} />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Company or College</Text>
              <TextInput style={styles.formInput} placeholder="e.g. Tech Mahindra / JNTU" value={workOrCollege} onChangeText={setWorkOrCollege} />

              <Text style={styles.fieldLabel}>Emergency Contact Name</Text>
              <TextInput style={styles.formInput} placeholder="e.g. Ramesh Sharma (Father)" value={emergencyName} onChangeText={setEmergencyName} />

              <Text style={styles.fieldLabel}>Emergency Phone</Text>
              <TextInput style={styles.formInput} placeholder="Emergency phone" keyboardType="phone-pad" value={emergencyPhone} onChangeText={setEmergencyPhone} />

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={() => {
                  if (!name.trim() || !phone.trim() || !email.trim() || !roomNumber.trim()) {
                    Alert.alert('Missing Info', 'Please fill in Name, Phone, Email, and Room Number.');
                    return;
                  }
                  addResidentMutation.mutate();
                }}
                disabled={addResidentMutation.isPending}
              >
                {addResidentMutation.isPending ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Register Resident</Text>
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
    alignItems: 'center',
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: Colors.surface,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  residentCardWrapper: {
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
  },
  headerInfo: { flex: 1 },
  residentName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  residentRoom: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  detailModalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  formModalCard: {
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
  detailTop: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 16,
  },
  detailAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailAvatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },
  detailName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  detailSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  infoSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceSecondary,
  },
  infoVal: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 10,
    marginBottom: 4,
  },
  formInput: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});
