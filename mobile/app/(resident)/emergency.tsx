import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/Theme';
import { AppHeader } from '../../components/AppHeader';
import { Card } from '../../components/Card';
import { api } from '../../services/api';
import { useAuth } from '../_layout';

export default function EmergencyScreen() {
  const { user, resident } = useAuth();
  const [alertSuccess, setAlertSuccess] = useState(false);

  // Fetch Emergency Contacts
  const { data: contactsData, isLoading } = useQuery({
    queryKey: ['emergencyContacts'],
    queryFn: async () => {
      try {
        const res = await api.get('/emergency/contacts');
        return res.data || null;
      } catch {
        return null;
      }
    },
  });

  // Silent Welfare Alert Mutation
  const silentAlertMutation = useMutation({
    mutationFn: async () => {
      let coords: { latitude?: number; longitude?: number } = {};
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          coords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
        }
      } catch {
        // Fallback gracefully without location coordinates
      }

      return api.post('/emergency/silent-welfare-alert', {
        latitude: coords.latitude,
        longitude: coords.longitude,
        notes: `Urgent Silent Welfare check requested from Room ${resident?.roomNumber || '204'}, Bed ${resident?.bedCode || 'B'}.`,
      });
    },
    onSuccess: (res: any) => {
      setAlertSuccess(true);
      Alert.alert(
        '🚨 Silent Alert Dispatched',
        res.message ||
          'Warden Mrs. Shanti Reddy and Security Desk have been alerted with your room number. Stay calm, assistance is on the way.'
      );
    },
    onError: (err: any) => {
      Alert.alert('Alert Failed', err.message || 'Unable to broadcast silent alert. Please call the warden directly.');
    },
  });

  const handleTriggerAlert = () => {
    Alert.alert(
      'Trigger Silent Welfare Alert?',
      'This will instantly notify Warden Mrs. Shanti Reddy and Front Desk Security with your current room and location.\n\nOnly use in case of genuine concern or emergency.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'CONFIRM DISPATCH',
          style: 'destructive',
          onPress: () => silentAlertMutation.mutate(),
        },
      ]
    );
  };

  const handleCall = async (phone: string, name: string) => {
    try {
      await api.post('/emergency/sos-action', {
        actionType: 'CALL',
        contactName: name,
        contactPhone: phone,
      });
    } catch {
      // Non-blocking telemetry
    }

    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Call Error', `Unable to place call to ${phone}. Please dial manually.`);
    });
  };

  const hostelLocation = contactsData?.hostelLocation || {
    name: 'SLG Luxury Ladies PG',
    address: 'Plot No. 142 & 143, Road No. 2, Phase 1, KPHB Colony',
    city: 'Kukatpally, Hyderabad, Telangana',
    pincode: '500072',
    landmark: 'Near KPHB Metro Station & Forum Sujana Mall',
    policeStation: 'KPHB Police Station (0.8 km)',
  };

  const hostelResponders = contactsData?.hostelResponders || [
    {
      name: 'Mrs. Shanti Reddy (Warden)',
      phone: '+91 98765 43210',
      role: 'WARDEN',
      availability: '24/7 Inside Hostel',
    },
    {
      name: 'Security Front Desk',
      phone: '+91 98765 43219',
      role: 'SECURITY_DESK',
      availability: 'Main Gate & Reception',
    },
  ];

  const nationalHelplines = contactsData?.nationalHelplines || [
    { name: 'Women Helpline (She Team)', phone: '1091', role: 'WOMEN_HELPLINE' },
    { name: 'National Emergency Response', phone: '112', role: 'POLICE' },
    { name: 'Ambulance & Medical Emergency', phone: '108', role: 'AMBULANCE' },
  ];

  const familyContact = contactsData?.familyContact || resident?.emergencyContact || {
    name: 'Rajesh Sharma (Father)',
    phone: '+91 98765 43299',
    relationship: 'Father',
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Safety & Emergency" subtitle="24/7 Resident Protection Desk" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* BIG SOS SILENT ALERT BUTTON */}
        <View style={styles.sosContainer}>
          <TouchableOpacity
            style={[
              styles.sosCircle,
              silentAlertMutation.isPending && styles.sosCircleDisabled,
            ]}
            onPress={handleTriggerAlert}
            disabled={silentAlertMutation.isPending}
            activeOpacity={0.8}
          >
            {silentAlertMutation.isPending ? (
              <ActivityIndicator size="large" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="shield-half" size={48} color="#FFFFFF" />
                <Text style={styles.sosText}>SILENT SOS</Text>
                <Text style={styles.sosSubtext}>Tap to Dispatch Warden</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.sosDisclaimer}>
            Discreetly notifies Warden Mrs. Shanti Reddy & Gate Security with your exact room (
            {resident?.roomNumber || '204'}). No loud sirens on your device.
          </Text>

          {alertSuccess && (
            <View style={styles.alertSuccessBadge}>
              <Ionicons name="checkmark-circle" size={18} color="#059669" />
              <Text style={styles.alertSuccessText}>
                Active Alert Dispatched to SLG Security Command
              </Text>
            </View>
          )}
        </View>

        {/* RESIDENT ON-DUTY LOCATION BANNER */}
        <Card style={styles.roomBanner} variant="lavender">
          <View style={styles.roomBannerRow}>
            <View style={styles.roomIconBox}>
              <Ionicons name="home" size={24} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.roomBannerTitle}>YOUR REGISTERED LOCATION</Text>
              <Text style={styles.roomBannerValue}>
                Room {resident?.roomNumber || '204'} · Bed {resident?.bedCode || 'B'}
              </Text>
              <Text style={styles.roomBannerSub}>2nd Floor, Wing A · SLG Luxury Ladies PG</Text>
            </View>
          </View>
        </Card>

        {/* SECTION 1: HOSTEL RESPONDERS */}
        <Text style={styles.sectionHeading}>On-Duty Hostel Staff (24/7)</Text>
        {hostelResponders.map((item: any, idx: number) => (
          <Card key={idx} style={styles.contactCard}>
            <View style={styles.contactRow}>
              <View style={styles.contactAvatar}>
                <Ionicons
                  name={item.role === 'WARDEN' ? 'person' : 'shield-checkmark'}
                  size={22}
                  color={Colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactName}>{item.name}</Text>
                <Text style={styles.contactAvailability}>
                  {item.availability || 'Available 24/7'}
                </Text>
                <Text style={styles.contactPhone}>{item.phone}</Text>
              </View>
              <TouchableOpacity
                style={styles.callActionButton}
                onPress={() => handleCall(item.phone, item.name)}
              >
                <Ionicons name="call" size={18} color="#FFFFFF" />
                <Text style={styles.callActionButtonText}>Call</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}

        {/* SECTION 2: REGISTERED FAMILY CONTACT */}
        {familyContact && (
          <View>
            <Text style={styles.sectionHeading}>Family Emergency Contact</Text>
            <Card style={styles.contactCard}>
              <View style={styles.contactRow}>
                <View style={[styles.contactAvatar, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="heart" size={22} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactName}>{familyContact.name}</Text>
                  <Text style={styles.contactAvailability}>
                    {familyContact.relationship || 'Guardian'}
                  </Text>
                  <Text style={styles.contactPhone}>{familyContact.phone}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.callActionButton, { backgroundColor: '#D97706' }]}
                  onPress={() => handleCall(familyContact.phone, familyContact.name)}
                >
                  <Ionicons name="call" size={18} color="#FFFFFF" />
                  <Text style={styles.callActionButtonText}>Call</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </View>
        )}

        {/* SECTION 3: NATIONAL EMERGENCY SERVICES */}
        <Text style={styles.sectionHeading}>National Helplines & Women Safety</Text>
        {nationalHelplines.map((item: any, idx: number) => (
          <Card key={idx} style={styles.contactCard}>
            <View style={styles.contactRow}>
              <View style={[styles.contactAvatar, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons
                  name={
                    item.role === 'WOMEN_HELPLINE'
                      ? 'woman'
                      : item.role === 'POLICE'
                      ? 'shield'
                      : 'medkit'
                  }
                  size={20}
                  color="#DC2626"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactName}>{item.name}</Text>
                <Text style={styles.helplineNumber}>Toll-Free Dial: {item.phone}</Text>
              </View>
              <TouchableOpacity
                style={[styles.callActionButton, { backgroundColor: '#DC2626' }]}
                onPress={() => handleCall(item.phone, item.name)}
              >
                <Ionicons name="call" size={18} color="#FFFFFF" />
                <Text style={styles.callActionButtonText}>Dial</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}

        {/* SECTION 4: EXACT HOSTEL ADDRESS FOR RESPONDERS */}
        <Text style={styles.sectionHeading}>Hostel Address & Landmark</Text>
        <Card style={styles.addressCard}>
          <View style={styles.addressHeader}>
            <Ionicons name="location" size={22} color={Colors.primary} />
            <Text style={styles.addressTitle}>{hostelLocation.name}</Text>
          </View>
          <Text style={styles.addressLine}>{hostelLocation.address}</Text>
          <Text style={styles.addressLine}>
            {hostelLocation.city} - {hostelLocation.pincode}
          </Text>
          <View style={styles.landmarkBox}>
            <Text style={styles.landmarkText}>
              <Text style={{ fontWeight: '700' }}>Landmark: </Text>
              {hostelLocation.landmark}
            </Text>
            <Text style={styles.landmarkText}>
              <Text style={{ fontWeight: '700' }}>Nearest Station: </Text>
              {hostelLocation.policeStation}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.copyBtn}
            onPress={() => {
              Alert.alert(
                'Hostel Address',
                `${hostelLocation.name}\n${hostelLocation.address}\n${hostelLocation.city} - ${hostelLocation.pincode}\nLandmark: ${hostelLocation.landmark}`
              );
            }}
          >
            <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
            <Text style={styles.copyBtnText}>View Full Address Details</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  // Big SOS Center
  sosContainer: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  sosCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: '#FCA5A5',
    ...Shadows.lg,
  },
  sosCircleDisabled: {
    opacity: 0.6,
  },
  sosText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginTop: 6,
  },
  sosSubtext: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FEE2E2',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  sosDisclaimer: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  alertSuccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginTop: 10,
  },
  alertSuccessText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
  },
  // Room Location Banner
  roomBanner: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  roomBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roomIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FAF5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomBannerTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  roomBannerValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  roomBannerSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  // Headings
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    letterSpacing: 0.3,
  },
  // Contact Card
  contactCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  contactAvailability: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  contactPhone: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 2,
  },
  helplineNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    marginTop: 2,
  },
  callActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    ...Shadows.sm,
  },
  callActionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  // Address Card
  addressCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  addressTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  addressLine: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  landmarkBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.sm,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  landmarkText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
});
