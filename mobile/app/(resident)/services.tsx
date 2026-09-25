import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Shadows } from '../../constants/Theme';
import { AppHeader } from '../../components/AppHeader';

const { width } = Dimensions.get('window');

interface ServiceItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  route: string;
  color: string;
  bgColor: string;
}

const services: ServiceItem[] = [
  {
    icon: 'card',
    label: 'Payments & Rent',
    description: 'View dues, history & pay online',
    route: '/(resident)/payments',
    color: Colors.primary,
    bgColor: Colors.primaryLight,
  },
  {
    icon: 'restaurant',
    label: 'Mess & Meals',
    description: 'Weekly menu, timings & feedback',
    route: '/(resident)/mess',
    color: '#10B981',
    bgColor: '#D1FAE5',
  },
  {
    icon: 'construct',
    label: 'Complaints',
    description: 'Raise & track maintenance issues',
    route: '/(resident)/complaints',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
  },
  {
    icon: 'warning',
    label: 'Emergency SOS',
    description: 'Alert warden & security instantly',
    route: '/(resident)/emergency',
    color: '#EF4444',
    bgColor: '#FEE2E2',
  },
];

export default function ServicesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader subtitle="Services Hub" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>What do you need?</Text>
        <Text style={styles.pageSubtitle}>All hostel services at your fingertips</Text>

        <View style={styles.grid}>
          {services.map((service) => (
            <TouchableOpacity
              key={service.label}
              style={styles.serviceCard}
              onPress={() => router.push(service.route as any)}
              activeOpacity={0.75}
            >
              <View style={[styles.iconCircle, { backgroundColor: service.bgColor }]}>
                <Ionicons name={service.icon} size={28} color={service.color} />
              </View>
              <Text style={styles.serviceLabel}>{service.label}</Text>
              <Text style={styles.serviceDesc}>{service.description}</Text>
              <View style={styles.arrowRow}>
                <Text style={[styles.arrowText, { color: service.color }]}>Open</Text>
                <Ionicons name="arrow-forward" size={14} color={service.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Hostel Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={22} color={Colors.primary} />
            <Text style={styles.infoTitle}>Need Help?</Text>
          </View>
          <Text style={styles.infoText}>
            Contact the warden at +91 98765 43210 or visit the reception desk on the ground floor.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const cardWidth = (width - 32 - 14) / 2;

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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  serviceCard: {
    width: cardWidth,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: 12,
  },
  arrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  arrowText: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    padding: 18,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
});
