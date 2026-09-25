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
import { LoadingView, EmptyView, ErrorView } from '../../components/StateViews';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
type TabType = 'MENU' | 'OPTOUTS' | 'FEEDBACK';

export default function AdminMessScreen() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('MENU');
  const [selectedDay, setSelectedDay] = useState<string>('Monday');

  // Edit menu modal state
  const [editingMeal, setEditingMeal] = useState<any | null>(null);
  const [menuItemsText, setMenuItemsText] = useState('');
  const [menuTiming, setMenuTiming] = useState('');
  const [isVeg, setIsVeg] = useState(true);

  // Queries
  const {
    data: weeklyMenu,
    isLoading: isMenuLoading,
    isError: isMenuError,
    error: menuError,
    refetch: refetchMenu,
    isRefetching,
  } = useQuery({
    queryKey: ['admin-mess-weekly'],
    queryFn: async () => {
      const res = await api.get('/mess/weekly');
      return res.data || {};
    },
  });

  const { data: optOutsData, refetch: refetchOptOuts } = useQuery({
    queryKey: ['admin-mess-optouts'],
    queryFn: async () => {
      const res = await api.get('/admin/mess/opt-outs');
      return res.data;
    },
    enabled: activeTab === 'OPTOUTS',
  });

  const { data: feedbackData, refetch: refetchFeedback } = useQuery({
    queryKey: ['admin-mess-feedback'],
    queryFn: async () => {
      const res = await api.get('/admin/mess/feedback');
      return (res.data || []) as any[];
    },
    enabled: activeTab === 'FEEDBACK',
  });

  const updateMenuMutation = useMutation({
    mutationFn: async () => {
      if (!editingMeal) return;
      const items = menuItemsText
        .split('\n')
        .map((i) => i.trim())
        .filter((i) => i.length > 0);

      return await api.post('/admin/mess/menu', {
        dayOfWeek: editingMeal.dayOfWeek,
        mealType: editingMeal.mealType,
        items,
        timing: menuTiming.trim(),
        isVeg,
      });
    },
    onSuccess: (res) => {
      Alert.alert('Menu Updated', res.message || 'Meal menu updated successfully');
      setEditingMeal(null);
      queryClient.invalidateQueries({ queryKey: ['admin-mess-weekly'] });
      queryClient.invalidateQueries({ queryKey: ['mess-weekly'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Could not update menu');
    },
  });

  const handleRefresh = async () => {
    if (activeTab === 'MENU') await refetchMenu();
    else if (activeTab === 'OPTOUTS') await refetchOptOuts();
    else if (activeTab === 'FEEDBACK') await refetchFeedback();
  };

  const openEditModal = (day: string, meal: any) => {
    setEditingMeal({ ...meal, dayOfWeek: day });
    setMenuItemsText((meal.items || []).join('\n'));
    setMenuTiming(meal.timing || '');
    setIsVeg(meal.isVeg !== false);
  };

  const mealsForSelectedDay = (weeklyMenu && weeklyMenu[selectedDay]) ? weeklyMenu[selectedDay] : [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader subtitle="Mess & Dining Hall Administration" showBack />

      {/* Main Mode Tabs */}
      <View style={styles.mainTabs}>
        <TouchableOpacity
          style={[styles.mainTabBtn, activeTab === 'MENU' && styles.mainTabBtnActive]}
          onPress={() => setActiveTab('MENU')}
        >
          <Ionicons name="restaurant-outline" size={16} color={activeTab === 'MENU' ? Colors.primary : Colors.textSecondary} />
          <Text style={[styles.mainTabText, activeTab === 'MENU' && styles.mainTabTextActive]}>Weekly Menu</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainTabBtn, activeTab === 'OPTOUTS' && styles.mainTabBtnActive]}
          onPress={() => setActiveTab('OPTOUTS')}
        >
          <Ionicons name="fast-food-outline" size={16} color={activeTab === 'OPTOUTS' ? Colors.primary : Colors.textSecondary} />
          <Text style={[styles.mainTabText, activeTab === 'OPTOUTS' && styles.mainTabTextActive]}>Opt-Outs</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainTabBtn, activeTab === 'FEEDBACK' && styles.mainTabBtnActive]}
          onPress={() => setActiveTab('FEEDBACK')}
        >
          <Ionicons name="chatbubbles-outline" size={16} color={activeTab === 'FEEDBACK' ? Colors.primary : Colors.textSecondary} />
          <Text style={[styles.mainTabText, activeTab === 'FEEDBACK' && styles.mainTabTextActive]}>Feedback</Text>
        </TouchableOpacity>
      </View>

      {/* Tab 1: Weekly Menu */}
      {activeTab === 'MENU' && (
        <>
          <View style={styles.dayScrollWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayScroll}>
              {DAYS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.dayChip, selectedDay === d && styles.dayChipActive]}
                  onPress={() => setSelectedDay(d)}
                >
                  <Text style={[styles.dayChipText, selectedDay === d && styles.dayChipTextActive]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {isMenuLoading ? (
            <LoadingView message="Loading weekly meal menus..." />
          ) : isMenuError ? (
            <ErrorView error={menuError} onRetry={refetchMenu} title="Failed to load menus" />
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} colors={[Colors.primary]} />
              }
            >
              <Text style={styles.daySectionTitle}>{selectedDay}'s Kitchen Schedule</Text>

              {mealsForSelectedDay.length > 0 ? (
                mealsForSelectedDay.map((meal: any, idx: number) => (
                  <View key={meal._id || idx} style={styles.mealCardWrapper}>
                    <Card>
                      <View style={styles.mealCardHeader}>
                        <View style={styles.mealTypeBox}>
                          <Text style={styles.mealTypeName}>{meal.mealType}</Text>
                          <Text style={styles.mealTiming}>{meal.timing || '7:30 AM — 9:00 AM'}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.editBtn}
                          onPress={() => openEditModal(selectedDay, meal)}
                        >
                          <Ionicons name="create-outline" size={16} color={Colors.primary} />
                          <Text style={styles.editBtnText}>Edit</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.itemsBox}>
                        {(meal.items || []).map((item: string, i: number) => (
                          <View key={i} style={styles.itemRow}>
                            <View style={styles.itemDot} />
                            <Text style={styles.itemText}>{item}</Text>
                          </View>
                        ))}
                      </View>
                    </Card>
                  </View>
                ))
              ) : (
                <EmptyView
                  icon="restaurant-outline"
                  title={`No Menu for ${selectedDay}`}
                  message="Tap below to set up meals for this day."
                  actionLabel="Add Meal"
                  onAction={() => openEditModal(selectedDay, { mealType: 'Breakfast', items: ['Idli', 'Sambar', 'Chutney'], timing: '7:30 AM — 9:00 AM' })}
                />
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </>
      )}

      {/* Tab 2: Opt-Outs */}
      {activeTab === 'OPTOUTS' && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} colors={[Colors.primary]} />
          }
        >
          <View style={styles.statsCard}>
            <Text style={styles.statsCardTitle}>Today's Headcount Reductions</Text>
            <Text style={styles.statsCardSub}>
              Helps kitchen prepare exact quantities and prevent food waste
            </Text>

            <View style={styles.breakdownRow}>
              {['Breakfast', 'Lunch', 'Snacks', 'Dinner'].map((m) => (
                <View key={m} style={styles.breakdownItem}>
                  <Text style={styles.breakdownNum}>
                    {optOutsData?.breakdown?.[m] ?? 0}
                  </Text>
                  <Text style={styles.breakdownLabel}>{m}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.sectionHeader}>Residents Skipping Meals Today</Text>
          {optOutsData?.optOuts && optOutsData.optOuts.length > 0 ? (
            optOutsData.optOuts.map((o: any) => (
              <View key={o._id} style={styles.optOutCard}>
                <View style={styles.optOutIcon}>
                  <Ionicons name="close-circle" size={20} color="#DC2626" />
                </View>
                <View style={styles.optOutInfo}>
                  <Text style={styles.optOutName}>{o.residentName || 'Resident'}</Text>
                  <Text style={styles.optOutMeta}>
                    Room {o.roomNumber || '—'} · Meal: <Text style={{ fontWeight: '700', color: Colors.primary }}>{o.mealType}</Text>
                  </Text>
                  {o.reason && <Text style={styles.optOutReason}>Reason: {o.reason}</Text>}
                </View>
              </View>
            ))
          ) : (
            <EmptyView
              icon="restaurant-outline"
              title="All Residents Dining Today"
              message="No resident meal skip notifications logged for today."
            />
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Tab 3: Resident Feedback */}
      {activeTab === 'FEEDBACK' && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} colors={[Colors.primary]} />
          }
        >
          <Text style={styles.daySectionTitle}>Resident Dining Reviews</Text>
          {feedbackData && feedbackData.length > 0 ? (
            feedbackData.map((fb) => (
              <View key={fb._id} style={styles.feedbackCard}>
                <View style={styles.feedbackHeader}>
                  <View>
                    <Text style={styles.fbResident}>{fb.residentName || 'Resident'}</Text>
                    <Text style={styles.fbMeal}>
                      {fb.mealType} · {fb.dateStr || 'Recent'}
                    </Text>
                  </View>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.ratingText}>{fb.rating}/5</Text>
                  </View>
                </View>

                {fb.comment && <Text style={styles.fbComment}>"{fb.comment}"</Text>}

                <View style={styles.fbSubRatings}>
                  {fb.tasteRating && (
                    <Text style={styles.subRatingText}>Taste: {fb.tasteRating}/5</Text>
                  )}
                  {fb.hygieneRating && (
                    <Text style={styles.subRatingText}>Hygiene: {fb.hygieneRating}/5</Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <EmptyView
              icon="chatbubble-ellipses-outline"
              title="No Dining Feedback Yet"
              message="Resident ratings and comments will appear here."
            />
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Edit Menu Modal */}
      <Modal
        visible={!!editingMeal}
        animationType="slide"
        transparent
        onRequestClose={() => setEditingMeal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Edit {editingMeal?.dayOfWeek} {editingMeal?.mealType}
              </Text>
              <TouchableOpacity onPress={() => setEditingMeal(null)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Meal Timing</Text>
              <TextInput
                style={styles.inputField}
                placeholder="e.g. 7:30 AM — 9:00 AM"
                placeholderTextColor={Colors.textMuted}
                value={menuTiming}
                onChangeText={setMenuTiming}
              />

              <Text style={styles.fieldLabel}>Menu Items (One item per line)</Text>
              <TextInput
                style={[styles.inputField, { height: 120, textAlignVertical: 'top' }]}
                placeholder="Idli Sambhar&#10;Vada with Chutney&#10;Filter Coffee / Tea"
                placeholderTextColor={Colors.textMuted}
                value={menuItemsText}
                onChangeText={setMenuItemsText}
                multiline
              />

              <TouchableOpacity
                style={styles.vegToggle}
                onPress={() => setIsVeg(!isVeg)}
              >
                <Ionicons
                  name={isVeg ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={isVeg ? '#10B981' : Colors.textMuted}
                />
                <Text style={styles.vegToggleText}>100% Pure Vegetarian Meal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveMenuBtn}
                onPress={() => updateMenuMutation.mutate()}
                disabled={updateMenuMutation.isPending}
              >
                {updateMenuMutation.isPending ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.saveMenuBtnText}>Save Menu Update</Text>
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
  mainTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  mainTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceSecondary,
  },
  mainTabBtnActive: {
    backgroundColor: Colors.primaryLight,
  },
  mainTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  mainTabTextActive: {
    color: Colors.primary,
  },
  dayScrollWrap: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dayScroll: {
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 10,
    gap: 8,
  },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.surfaceSecondary,
  },
  dayChipActive: {
    backgroundColor: Colors.primary,
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  dayChipTextActive: {
    color: '#FFF',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: 14,
    paddingBottom: 40,
  },
  daySectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 12,
  },
  mealCardWrapper: {
    marginBottom: 12,
  },
  mealCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mealTypeBox: { flex: 1 },
  mealTypeName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  mealTiming: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  itemsBox: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.sm,
    padding: 12,
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  itemText: {
    fontSize: 14,
    color: Colors.text,
  },
  statsCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    ...Shadows.sm,
  },
  statsCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  statsCardSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 14,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownNum: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },
  breakdownLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
  },
  optOutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
    gap: 12,
  },
  optOutIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optOutInfo: { flex: 1 },
  optOutName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  optOutMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  optOutReason: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    fontStyle: 'italic',
  },
  feedbackCard: {
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    ...Shadows.sm,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fbResident: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  fbMeal: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  fbComment: {
    fontSize: 13,
    color: Colors.text,
    fontStyle: 'italic',
    lineHeight: 18,
    marginVertical: 4,
  },
  fbSubRatings: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceSecondary,
  },
  subRatingText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 10,
    marginBottom: 6,
  },
  inputField: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  vegToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 14,
  },
  vegToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  saveMenuBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveMenuBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
