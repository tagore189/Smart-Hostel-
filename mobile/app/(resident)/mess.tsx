import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/Theme';
import { AppHeader } from '../../components/AppHeader';
import { Card } from '../../components/Card';
import { api } from '../../services/api';
import { LoadingView, ErrorView, EmptyView } from '../../components/StateViews';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
type DayName = typeof DAYS[number];
const TODAY_INDEX = new Date().getDay();

interface MealItem {
  _id?: string;
  dayOfWeek: string;
  mealType: 'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner';
  items: string[];
  timing: string;
  isSpecial?: boolean;
  specialTitle?: string;
  calories?: number;
  isVeg?: boolean;
}

interface OptOutItem {
  _id: string;
  mealType: string;
  dateStr: string;
  reason?: string;
}

export default function MessScreen() {
  const queryClient = useQueryClient();
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(TODAY_INDEX);
  const selectedDayName: DayName = DAYS[selectedDayIndex];

  // Feedback modal state
  const [feedbackMeal, setFeedbackMeal] = useState<MealItem | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [tasteRating, setTasteRating] = useState<number>(5);
  const [hygieneRating, setHygieneRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');

  // Weekly Menu Query
  const {
    data: weeklyData,
    isLoading: isWeeklyLoading,
    isError: isWeeklyError,
    error: weeklyError,
    refetch: refetchWeekly,
    isRefetching,
  } = useQuery({
    queryKey: ['mess-weekly'],
    queryFn: async () => {
      const res = await api.get('/mess/weekly');
      // Backend returns { success: true, data: { Monday: [...], Tuesday: [...], ... } }
      return res.data || {};
    },
  });

  // Opt-out Query
  const { data: optOutsData, refetch: refetchOptOuts } = useQuery({
    queryKey: ['mess-opt-outs'],
    queryFn: async () => {
      try {
        const res = await api.get('/mess/opt-out');
        return (res.data || []) as OptOutItem[];
      } catch {
        return [];
      }
    },
  });

  // Toggle Opt-Out Mutation
  const optOutMutation = useMutation({
    mutationFn: async ({ mealType }: { mealType: string }) => {
      const todayStr = new Date().toISOString().split('T')[0];
      return await api.post('/mess/opt-out', {
        mealType,
        dateStr: todayStr,
        reason: 'Resident opted out via app',
      });
    },
    onSuccess: (res) => {
      Alert.alert('Mess Opt-Out', res.message || 'Preference updated');
      queryClient.invalidateQueries({ queryKey: ['mess-opt-outs'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to update opt-out status');
    },
  });

  // Submit Feedback Mutation
  const feedbackMutation = useMutation({
    mutationFn: async () => {
      if (!feedbackMeal) return;
      const todayStr = new Date().toISOString().split('T')[0];
      return await api.post('/mess/feedback', {
        mealType: feedbackMeal.mealType,
        dateStr: todayStr,
        rating,
        tasteRating,
        hygieneRating,
        comment,
      });
    },
    onSuccess: () => {
      Alert.alert('Thank You', 'Your dining feedback has been recorded for the kitchen supervisor.');
      setFeedbackMeal(null);
      setComment('');
    },
    onError: (err: any) => {
      Alert.alert('Submission Failed', err.message || 'Could not record feedback');
    },
  });

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
      case 'dinner': return '#7C3AED';
      default: return Colors.primary;
    }
  };

  const handleRefresh = async () => {
    await Promise.all([refetchWeekly(), refetchOptOuts()]);
  };

  // Extract meals for selected day
  const mealsForDay: MealItem[] = (weeklyData && weeklyData[selectedDayName]) ? weeklyData[selectedDayName] : [];

  // Standard ordered meal types to ensure all 4 are visible
  const standardMealOrder = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];
  const sortedMeals = [...mealsForDay].sort((a, b) => {
    const aIdx = standardMealOrder.indexOf(a.mealType);
    const bIdx = standardMealOrder.indexOf(b.mealType);
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const isSelectedToday = selectedDayIndex === TODAY_INDEX;

  const isOptedOut = (mealType: string) => {
    if (!isSelectedToday || !optOutsData) return false;
    return optOutsData.some((o: OptOutItem) => o.mealType === mealType && o.dateStr === todayStr);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader subtitle="Mess & Dining Menu" showBack />

      {/* Day Selector Bar */}
      <View style={styles.daySelectorContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayScrollContent}
        >
          {DAYS.map((day, index) => {
            const isSelected = selectedDayIndex === index;
            const isToday = index === TODAY_INDEX;
            return (
              <TouchableOpacity
                key={day}
                style={[styles.dayChip, isSelected && styles.dayChipActive]}
                onPress={() => setSelectedDayIndex(index)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dayChipText, isSelected && styles.dayChipTextActive]}>
                  {day.substring(0, 3)}
                </Text>
                {isToday && (
                  <View style={[styles.todayIndicator, isSelected && styles.todayIndicatorActive]} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content Area */}
      {isWeeklyLoading ? (
        <LoadingView message="Loading dining menu..." />
      ) : isWeeklyError ? (
        <ErrorView error={weeklyError} onRetry={handleRefresh} title="Menu Unavailable" />
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
          {/* Day Title & Subheader */}
          <View style={styles.dayHeader}>
            <View>
              <Text style={styles.dayTitle}>{selectedDayName}'s Dining</Text>
              <Text style={styles.daySubtitle}>
                {isSelectedToday ? "Today's Fresh Meals · North & South Indian" : `Menu for ${selectedDayName}`}
              </Text>
            </View>
            <View style={styles.dietBadge}>
              <Ionicons name="leaf" size={14} color="#059669" />
              <Text style={styles.dietText}>100% Hygienic</Text>
            </View>
          </View>

          {sortedMeals.length === 0 ? (
            <EmptyView
              icon="restaurant-outline"
              title={`No Menu Set for ${selectedDayName}`}
              message="The hostel management has not published items for this day yet."
              actionLabel="Refresh Menu"
              onAction={handleRefresh}
            />
          ) : (
            sortedMeals.map((meal, idx) => {
              const optedOut = isOptedOut(meal.mealType);
              const mealColor = getMealColor(meal.mealType);

              return (
                <View key={meal._id || idx} style={styles.mealCardWrapper}>
                  <Card>
                    <View style={styles.mealHeader}>
                      <View style={[styles.mealIconBox, { backgroundColor: mealColor + '18' }]}>
                        <Ionicons name={getMealIcon(meal.mealType)} size={22} color={mealColor} />
                      </View>
                      <View style={styles.mealHeaderText}>
                        <View style={styles.mealTypeRow}>
                          <Text style={styles.mealType}>{meal.mealType}</Text>
                          {meal.isSpecial && (
                            <View style={styles.specialBadge}>
                              <Ionicons name="star" size={10} color="#B45309" />
                              <Text style={styles.specialText}>Special</Text>
                            </View>
                          )}
                          {meal.isVeg !== false && (
                            <View style={styles.vegIndicator}>
                              <View style={styles.vegDot} />
                            </View>
                          )}
                        </View>
                        <Text style={styles.mealTime}>{meal.timing || 'Standard Timings'}</Text>
                      </View>
                    </View>

                    {/* Menu Items */}
                    <View style={styles.itemsContainer}>
                      {meal.items && meal.items.length > 0 ? (
                        meal.items.map((item, itemIdx) => (
                          <View key={itemIdx} style={styles.itemRow}>
                            <View style={[styles.itemBullet, { backgroundColor: mealColor }]} />
                            <Text style={styles.itemText}>{item}</Text>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.noItemsText}>Items will be announced by chef.</Text>
                      )}
                    </View>

                    {/* Meal Actions (Opt-Out & Feedback) for Today */}
                    {isSelectedToday && (
                      <View style={styles.mealActionRow}>
                        <TouchableOpacity
                          style={[styles.optOutBtn, optedOut && styles.optOutBtnActive]}
                          onPress={() => optOutMutation.mutate({ mealType: meal.mealType })}
                          disabled={optOutMutation.isPending}
                        >
                          <Ionicons
                            name={optedOut ? 'checkmark-circle' : 'close-circle-outline'}
                            size={16}
                            color={optedOut ? '#059669' : Colors.textSecondary}
                          />
                          <Text style={[styles.optOutText, optedOut && styles.optOutTextActive]}>
                            {optedOut ? 'Opted Out' : 'Skip Meal'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.feedbackBtn}
                          onPress={() => setFeedbackMeal(meal)}
                        >
                          <Ionicons name="chatbubble-ellipses-outline" size={16} color={Colors.primary} />
                          <Text style={styles.feedbackBtnText}>Rate & Feedback</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </Card>
                </View>
              );
            })
          )}

          {/* Standard Mess Timings Card */}
          <Text style={styles.sectionHeader}>Dining Hall Timings</Text>
          <Card variant="lavender">
            {[
              { meal: 'Breakfast', time: '7:30 AM — 9:00 AM', icon: 'sunny' as const },
              { meal: 'Lunch', time: '12:30 PM — 2:00 PM', icon: 'restaurant' as const },
              { meal: 'Evening Snacks', time: '4:30 PM — 5:30 PM', icon: 'cafe' as const },
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

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Feedback Modal */}
      <Modal
        visible={!!feedbackMeal}
        animationType="slide"
        transparent
        onRequestClose={() => setFeedbackMeal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate {feedbackMeal?.mealType}</Text>
              <TouchableOpacity onPress={() => setFeedbackMeal(null)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Help us maintain authentic taste and high kitchen hygiene standards at SLG.
            </Text>

            {/* Overall Rating */}
            <Text style={styles.ratingLabel}>Overall Satisfaction</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={32}
                    color="#F59E0B"
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Taste & Hygiene Quick Ratings */}
            <View style={styles.quickRatings}>
              <View style={styles.quickRatingItem}>
                <Text style={styles.quickRatingText}>Taste: {tasteRating}/5</Text>
                <View style={styles.miniStars}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <TouchableOpacity key={s} onPress={() => setTasteRating(s)}>
                      <Ionicons
                        name={s <= tasteRating ? 'star' : 'star-outline'}
                        size={18}
                        color="#F59E0B"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.quickRatingItem}>
                <Text style={styles.quickRatingText}>Hygiene: {hygieneRating}/5</Text>
                <View style={styles.miniStars}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <TouchableOpacity key={s} onPress={() => setHygieneRating(s)}>
                      <Ionicons
                        name={s <= hygieneRating ? 'star' : 'star-outline'}
                        size={18}
                        color="#10B981"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Comment Input */}
            <TextInput
              style={styles.commentInput}
              placeholder="Any comments, item preferences or suggestions..."
              placeholderTextColor={Colors.textMuted}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={3}
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitFeedbackBtn}
              onPress={() => feedbackMutation.mutate()}
              disabled={feedbackMutation.isPending}
            >
              {feedbackMutation.isPending ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.submitFeedbackBtnText}>Submit Meal Feedback</Text>
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
  daySelectorContainer: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dayScrollContent: {
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 12,
    gap: 8,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    marginRight: 6,
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
  todayIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginTop: 4,
  },
  todayIndicatorActive: {
    backgroundColor: '#FFF',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: 16,
    paddingBottom: 40,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  daySubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dietBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dietText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  mealCardWrapper: {
    marginBottom: 14,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  mealIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealHeaderText: { flex: 1 },
  mealTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealType: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  specialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  specialText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  vegIndicator: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
  },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  mealTime: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  itemsContainer: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.sm,
    padding: 12,
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  itemText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  noItemsText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  mealActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  optOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: Colors.surfaceSecondary,
  },
  optOutBtnActive: {
    backgroundColor: '#D1FAE5',
  },
  optOutText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  optOutTextActive: {
    color: '#065F46',
  },
  feedbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  feedbackBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 20,
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
    borderTopColor: '#DDD6FE',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  modalDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  ratingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 18,
  },
  quickRatings: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickRatingItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  miniStars: {
    flexDirection: 'row',
    gap: 4,
  },
  commentInput: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    textAlignVertical: 'top',
    height: 80,
    marginBottom: 18,
  },
  submitFeedbackBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitFeedbackBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
