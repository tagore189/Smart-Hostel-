import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Shadows } from '../../constants/Theme';
import { AppHeader } from '../../components/AppHeader';
import { Card } from '../../components/Card';
import { useAuth } from '../_layout';
import { APP_CONFIG } from '../../constants/Config';

export default function ProfileScreen() {
  const { user, resident, signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of SLG Luxury PG?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const profileSections = [
    {
      title: 'Account',
      items: [
        { icon: 'person-outline' as const, label: 'Full Name', value: user?.name || '—' },
        { icon: 'mail-outline' as const, label: 'Email', value: user?.email || '—' },
        { icon: 'call-outline' as const, label: 'Phone', value: user?.phone || '—' },
        { icon: 'shield-checkmark-outline' as const, label: 'Role', value: user?.role || 'RESIDENT' },
      ],
    },
    {
      title: 'Stay Details',
      items: [
        { icon: 'home-outline' as const, label: 'Room', value: `Room ${resident?.roomNumber || '204'}` },
        { icon: 'bed-outline' as const, label: 'Bed', value: `Bed ${resident?.bedCode || resident?.bedNumber || 'B'}` },
        { icon: 'card-outline' as const, label: 'Monthly Rent', value: `₹${(resident?.monthlyRent || resident?.rentAmount || 8000).toLocaleString('en-IN')}` },
      ],
    },
    {
      title: 'Hostel',
      items: [
        { icon: 'business-outline' as const, label: 'Name', value: APP_CONFIG.appName },
        { icon: 'location-outline' as const, label: 'Location', value: APP_CONFIG.location },
        { icon: 'call-outline' as const, label: 'Warden', value: APP_CONFIG.wardenPhone },
        { icon: 'mail-outline' as const, label: 'Support', value: APP_CONFIG.supportEmail },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader subtitle="Profile" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Hero */}
        <View style={styles.heroSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={require('../../assets/ananya.jpg')}
              style={styles.avatar}
            />
            <View style={styles.activeDot} />
          </View>
          <Text style={styles.heroName}>{user?.name || 'Resident'}</Text>
          <Text style={styles.heroEmail}>{user?.email || ''}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
            <Text style={styles.roleText}>{user?.role || 'RESIDENT'}</Text>
          </View>
        </View>

        {/* Sections */}
        {profileSections.map((section) => (
          <View key={section.title}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Card>
              {section.items.map((item, index) => (
                <React.Fragment key={item.label}>
                  <View style={styles.row}>
                    <View style={styles.rowIcon}>
                      <Ionicons name={item.icon} size={18} color={Colors.primary} />
                    </View>
                    <View style={styles.rowContent}>
                      <Text style={styles.rowLabel}>{item.label}</Text>
                      <Text style={styles.rowValue}>{item.value}</Text>
                    </View>
                  </View>
                  {index < section.items.length - 1 && <View style={styles.separator} />}
                </React.Fragment>
              ))}
            </Card>
          </View>
        ))}

        {/* App Info */}
        <Card variant="outlined" style={styles.appInfoCard}>
          <View style={styles.appInfoRow}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.textMuted} />
            <Text style={styles.appInfoText}>SLG Luxury Ladies PG · v1.0.0</Text>
          </View>
        </Card>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.gutter, paddingBottom: 32 },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  avatarContainer: { position: 'relative' },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: Colors.primaryLight,
  },
  activeDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  heroName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 14,
    letterSpacing: -0.3,
  },
  heroEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 10,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowContent: { flex: 1 },
  rowLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 1,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 46,
  },
  appInfoCard: {
    marginTop: 16,
  },
  appInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  appInfoText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.errorLight,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.error,
  },
});
