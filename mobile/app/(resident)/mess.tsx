import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing } from '../../constants/Theme';
import { AppHeader } from '../../components/AppHeader';
import { Card } from '../../components/Card';
import { api } from '../../services/api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TODAY_INDEX = new Date().getDay();

type TabKey = 'menu' | 'feedback';

export default function MessScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('menu');
  const [selectedDay, setSelectedDay] = useState(TODAY_INDEX);

  const { data: menuData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['mess-menu'],
    queryFn: async () => {
      try {
        const res = await api.get('/mess/menu');
        return res.data || res.menus || res.menu || [];
      } catch {
        return [];
      }
    },
  });

  const menus = Array.isArray(menuData) ? menuData : [];

  const getMealIcon = (mealType: string): keyof typeof Ionicons.glyphMap => {
    switch (mealType?.toLowerCase()) {
      case 'breakfast': return 'sunny';
      case 'lunch': return 'restaurant';
      case 'snacks': return 'cafe';
      case 'dinner': return 'moon';
      default: return 'restaurant';
    }
  };

  const getMealColor = (mealType: string) => {
    switch (mealType?.toLowerCase()) {
      case 'breakfast': return '#F59E0B';
      case 'lunch': return '#10B981';
      case 'snacks': return '#EC4899';
      case 'dinner': return '#6366F1';
      default: return Colors.primary;
    }
  };

  const todayMenu = menus.find((m: any) => m.day === DAYS[selectedDay]) || null;
  const meals = todayMenu?.meals || [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader subtitle="Mess & Meals" showBack />

      {/* Day Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll} contentContainerStyle={styles.dayScrollContent}>
        {DAYS.map((day, index) => (
          <TouchableOpacity
            key={day}
            style={[styles.dayChip, selectedDay === index && styles.dayChipActive]}
            onPress={() => setSelectedDay(index)}
          >
            <Text style={[styles.dayChipText, selectedDay === index && styles.dayChipTextActive]}>
              {day.substring(0, 3)}
            </Text>
            {index === TODAY_INDEX && (
              <View style={[styles.todayDot, selectedDay === index && styles.todayDotActive]} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[Colors.primary]} tintColor={Colors.primary} />
        }
      >
        <Text style={styles.dayTitle}>{DAYS[selectedDay]}'s Menu</Text>

        {meals.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Menu Available</Text>
            <Text style={styles.emptySubtitle}>The menu for this day hasn't been set yet.</Text>
          </View>
        ) : (
          meals.map((meal: any, index: number) => (
            <Card key={meal._id || index}>
              <View style={styles.mealHeader}>
                <View style={[styles.mealIconBox, { backgroundColor: getMealColor(meal.type) + '18' }]}>
                  <Ionicons name={getMealIcon(meal.type)} size={22} color={getMealColor(meal.type)} />
                </View>
                <View style={styles.mealHeaderText}>
                  <Text style={styles.mealType}>{meal.type || 'Meal'}</Text>
                  <Text style={styles.mealTime}>{meal.time || ''}</Text>
                </View>
              </View>
              {meal.items && meal.items.length > 0 && (
                <View style={styles.mealItems}>
                  {meal.items.map((item: string, i: number) => (
                    <View key={i} style={styles.mealItemRow}>
                      <View style={styles.mealItemDot} />
                      <Text style={styles.mealItemText}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          ))
        )}

        {/* Mess Timings */}
        <Text style={styles.sectionTitle}>Mess Timings</Text>
        <Card variant="lavender">
          {[
            { meal: 'Breakfast', time: '7:30 AM — 9:00 AM', icon: 'sunny' as const },
            { meal: 'Lunch', time: '12:30 PM — 2:00 PM', icon: 'restaurant' as const },
            { meal: 'Snacks', time: '4:30 PM — 5:30 PM', icon: 'cafe' as const },
            { meal: 'Dinner', time: '7:30 PM — 9:00 PM', icon: 'moon' as const },
          ].map((t, i) => (
            <View key={t.meal} style={[styles.timingRow, i > 0 && styles.timingSeparator]}>
              <View style={styles.timingLeft}>
                <Ionicons name={t.icon} size={18} color={Colors.primary} />
                <Text style={styles.timingMeal}>{t.meal}</Text>
              </View>
              <Text style={styles.timingTime}>{t.time}</Text>
            </View>
          ))}
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
  dayScroll: { maxHeight: 56 },
  dayScrollContent: {
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 10,
    gap: 8,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    marginRight: 8,
  },
  dayChipActive: {
    backgroundColor: Colors.primary,
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  dayChipTextActive: {
    color: '#FFF',
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 3,
  },
  todayDotActive: {
    backgroundColor: '#FFF',
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 12,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  mealIconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealHeaderText: { flex: 1 },
  mealType: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    textTransform: 'capitalize',
  },
  mealTime: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  mealItems: {
    gap: 6,
    marginTop: 4,
  },
  mealItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealItemDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  mealItemText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 24,
    marginBottom: 10,
  },
  timingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  timingSeparator: {
    borderTopWidth: 1,
    borderTopColor: '#C4B5FD',
  },
  timingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timingMeal: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  timingTime: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  emptyState: { alignItems: 'center', paddingVertical: 50, gap: 6 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, marginTop: 8 },
  emptySubtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
});
