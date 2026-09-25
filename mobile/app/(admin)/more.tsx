import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/Theme';
import { AppHeader } from '../../components/AppHeader';
import { useAuth } from '../_layout';

export default function AdminMoreScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out from the administration console?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const menuSections = [
    {
      title: 'Finance & Records',
      items: [
        { label: 'Payments & Revenue', icon: 'card', route: '/(admin)/payments', color: '#059669', bg: '#D1FAE5', desc: 'Rent collections, receipts & pending dues' },
        { label: 'Building Reports', icon: 'bar-chart', route: '/(admin)/reports', color: '#2563EB', bg: '#DBEAFE', desc: 'Financial, occupancy & complaint analytics' },
      ],
    },
    {
      title: 'Dining & Communication',
      items: [
        { label: 'Mess & Dining Hall', icon: 'restaurant', route: '/(admin)/mess', color: '#EA580C', bg: '#FFEDD5', desc: 'Weekly menu schedule & feedback' },
        { label: 'Hostel Notices', icon: 'megaphone', route: '/(admin)/notices', color: '#4F46E5', bg: '#E0E7FF', desc: 'Broadcast announcements to residents' },
      ],
    },
    {
      title: 'Safety & Administration',
      items: [
        { label: 'Emergency Console', icon: 'alert-circle', route: '/(admin)/emergency', color: '#DC2626', bg: '#FEE2E2', desc: 'Live welfare alerts & SOS tracker' },
        { label: 'Staff Management', icon: 'people-circle', route: '/(admin)/staff', color: '#7C3AED', bg: '#EDE9FE', desc: 'Security, maintenance & kitchen team' },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader subtitle="Operations & Settings Hub" showNotification={false} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Admin Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {user?.name ? user.name.substring(0, 2).toUpperCase() : 'AD'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'Hostel Administrator'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'admin@slghostel.com'}</Text>
            <View style={styles.roleBadge}>
              <Ionicons name="shield-checkmark" size={12} color={Colors.primary} />
              <Text style={styles.roleText}>{user?.role || 'WARDEN'}</Text>
            </View>
          </View>
        </View>

        {/* Operational Modules */}
        {menuSections.map((sec) => (
          <View key={sec.title} style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>{sec.title}</Text>
            <View style={styles.menuGroup}>
              {sec.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.menuItem, idx > 0 && styles.itemBorder]}
                  onPress={() => router.push(item.route as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: item.bg }]}>
                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <View style={styles.menuTextWrap}>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <Text style={styles.menuDesc}>{item.desc}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={styles.signOutText}>Sign Out from Console</Text>
        </TouchableOpacity>

        {/* Footer info */}
        <View style={styles.footer}>
          <Text style={styles.footerBranding}>SLG Luxury Ladies PG</Text>
          <Text style={styles.footerLocation}>KPHB / Kukatpally, Hyderabad, Telangana</Text>
          <Text style={styles.footerVersion}>Admin Console v1.0.0</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: 16,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
    gap: 14,
    ...Shadows.sm,
  },
  profileAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  profileEmail: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  sectionWrap: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuGroup: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  itemBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextWrap: { flex: 1 },
  menuLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  menuDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    marginTop: 10,
    marginBottom: 24,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },
  footer: {
    alignItems: 'center',
    gap: 4,
  },
  footerBranding: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  footerLocation: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  footerVersion: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
