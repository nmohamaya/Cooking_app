import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getWeeklyMealPlan,
  MEAL_TYPES,
  DAYS_OF_WEEK,
} from '../mealPlanningService';

let screenWidth = 375; // Default width
try {
  screenWidth = Dimensions.get('window').width;
} catch (e) {
  // Fallback for tests
}

/**
 * WeeklyMealPlanView Component
 * 
 * Displays a visual representation of the week's meal plan with all planned meals
 * organized by day and meal type.
 * 
 * Features:
 * - View all 7 days with meal types (breakfast, lunch, dinner, snacks)
 * - Color-coded meal types for quick visual identification
 * - Tap recipe to view details
 * - Tap meal slot to add/remove recipes
 * - Navigate between current and future weeks
 * - Shows summary of planned meals for the week
 * 
 * Props:
 * - onRecipePress: (recipeId) => void - Called when a recipe is tapped
 * - onMealSlotPress: (dayOfWeek, mealType) => void - Called when an empty meal slot is tapped
 * - onRecipeRemove: (recipeId, dayOfWeek, mealType) => void - Called to remove a recipe
 * 
 * @component
 */
export const WeeklyMealPlanView = ({
  onRecipePress = () => {},
  onMealSlotPress = () => {},
  onRecipeRemove = () => {},
}) => {
  const [mealPlan, setMealPlan] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [weekPlanData, setWeekPlanData] = useState({});

  useEffect(() => {
    loadMealPlan();
  }, [weekOffset]);

  const loadMealPlan = async () => {
    try {
      setLoading(true);
      const savedPlan = await AsyncStorage.getItem('@myrecipeapp/meal_plan');
      const plan = savedPlan ? JSON.parse(savedPlan) : [];
      setMealPlan(plan);

      // Generate week plan data
      const weekData = getWeeklyMealPlan(plan);
      setWeekPlanData(weekData);
    } catch (error) {
      console.error('Error loading meal plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveMealPlan = async (newPlan) => {
    try {
      await AsyncStorage.setItem('@myrecipeapp/meal_plan', JSON.stringify(newPlan));
      setMealPlan(newPlan);
      
      const weekData = getWeeklyMealPlan(newPlan);
      setWeekPlanData(weekData);
    } catch (error) {
      console.error('Error saving meal plan:', error);
    }
  };

  const handleRecipeRemove = (recipeId, dayOfWeek, mealType) => {
    const updatedPlan = mealPlan.filter(
      (item) =>
        !(
          item.recipeId === recipeId &&
          item.dayOfWeek === dayOfWeek &&
          item.mealType === mealType
        )
    );
    saveMealPlan(updatedPlan);
    onRecipeRemove(recipeId, dayOfWeek, mealType);
  };

  const getTotalRecipes = () => {
    const uniqueRecipes = new Set(mealPlan.map((item) => item.recipeId));
    return uniqueRecipes.size;
  };

  const getWeekSummary = () => {
    const totalMeals = mealPlan.length;
    const uniqueRecipes = getTotalRecipes();
    return { totalMeals, uniqueRecipes };
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  const { totalMeals, uniqueRecipes } = getWeekSummary();

  return (
    <View style={styles.container}>
      {/* Week Navigation */}
      <View style={styles.navigationBar}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setWeekOffset(weekOffset - 1)}
          disabled={weekOffset <= 0}
        >
          <Text style={styles.navButtonText}>← Previous</Text>
        </TouchableOpacity>

        <View style={styles.weekInfo}>
          <Text style={styles.weekTitle}>Week {weekOffset + 1}</Text>
          <Text style={styles.weekSummary}>
            {uniqueRecipes} recipes • {totalMeals} meals planned
          </Text>
        </View>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setWeekOffset(weekOffset + 1)}
        >
          <Text style={styles.navButtonText}>Next →</Text>
        </TouchableOpacity>
      </View>

      {/* Days Grid */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.daysContainer}>
          {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
            <DayCard
              key={dayIndex}
              dayOfWeek={dayIndex}
              dayName={DAYS_OF_WEEK[dayIndex]}
              mealData={weekPlanData[dayIndex] || {}}
              onRecipePress={onRecipePress}
              onMealSlotPress={() => onMealSlotPress(dayIndex)}
              onRecipeRemove={handleRecipeRemove}
            />
          ))}
        </View>

        {/* Empty State */}
        {totalMeals === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No meals planned</Text>
            <Text style={styles.emptyStateText}>
              Start by adding recipes to your meal plan!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

/**
 * DayCard Component
 * 
 * Displays a single day's meals organized by meal type.
 * 
 * Props:
 * - dayOfWeek: number - Day index (0-6)
 * - dayName: string - Day name (Monday, Tuesday, etc.)
 * - mealData: object - Meal data for the day
 * - onRecipePress: (recipeId) => void
 * - onMealSlotPress: () => void
 * - onRecipeRemove: (recipeId, dayOfWeek, mealType) => void
 */
const DayCard = ({
  dayOfWeek,
  dayName,
  mealData,
  onRecipePress,
  onMealSlotPress,
  onRecipeRemove,
}) => {
  const getTodayIndicator = () => {
    const today = new Date().getDay();
    const adjustedToday = today === 0 ? 6 : today - 1; // Convert Sunday(0) to 6
    return dayOfWeek === adjustedToday;
  };

  return (
    <View style={[styles.dayCard, getTodayIndicator() && styles.todayCard]}>
      <View style={styles.dayHeader}>
        <Text style={styles.dayName}>{dayName}</Text>
        {getTodayIndicator() && <Text style={styles.todayBadge}>Today</Text>}
      </View>

      <View style={styles.mealsContainer}>
        {[MEAL_TYPES.BREAKFAST, MEAL_TYPES.LUNCH, MEAL_TYPES.DINNER, MEAL_TYPES.SNACKS].map(
          (mealType) => (
            <MealSection
              key={mealType}
              mealType={mealType}
              recipes={mealData[mealType] || []}
              dayOfWeek={dayOfWeek}
              onRecipePress={onRecipePress}
              onAddRecipe={onMealSlotPress}
              onRemoveRecipe={(recipeId) =>
                onRecipeRemove(recipeId, dayOfWeek, mealType)
              }
            />
          )
        )}
      </View>
    </View>
  );
};

/**
 * MealSection Component
 * 
 * Displays a meal type (breakfast, lunch, etc.) with its assigned recipes.
 * 
 * Props:
 * - mealType: string - Meal type (breakfast, lunch, dinner, snacks)
 * - recipes: array - List of recipe IDs assigned to this meal
 * - dayOfWeek: number - Day index
 * - onRecipePress: (recipeId) => void
 * - onAddRecipe: () => void
 * - onRemoveRecipe: (recipeId) => void
 */
const MealSection = ({
  mealType,
  recipes,
  dayOfWeek,
  onRecipePress,
  onAddRecipe,
  onRemoveRecipe,
}) => {
  const mealColors = {
    breakfast: '#FF9500',
    lunch: '#34C759',
    dinner: '#FF3B30',
    snacks: '#AF52DE',
  };

  const mealLabels = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snacks: 'Snacks',
  };

  return (
    <View style={styles.mealSection}>
      <View style={[styles.mealHeader, { borderLeftColor: mealColors[mealType] }]}>
        <Text style={styles.mealType}>{mealLabels[mealType]}</Text>
        <Text style={styles.mealCount}>{recipes.length}</Text>
      </View>

      {recipes.length > 0 ? (
        <View style={styles.recipesList}>
          {recipes.map((recipeId, index) => (
            <RecipeItem
              key={`${recipeId}-${index}`}
              recipeId={recipeId}
              mealColor={mealColors[mealType]}
              onPress={() => onRecipePress(recipeId)}
              onRemove={() => onRemoveRecipe(recipeId)}
            />
          ))}
        </View>
      ) : (
        <TouchableOpacity
          style={styles.emptySlot}
          onPress={onAddRecipe}
        >
          <Text style={styles.emptySlotText}>+ Add {mealLabels[mealType]}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

/**
 * RecipeItem Component
 * 
 * Displays a single recipe in a meal section.
 * 
 * Props:
 * - recipeId: string - Recipe ID
 * - mealColor: string - Color for the meal type
 * - onPress: () => void
 * - onRemove: () => void
 */
const RecipeItem = ({ recipeId, mealColor, onPress, onRemove }) => {
  return (
    <View style={styles.recipeItem}>
      <TouchableOpacity
        style={[styles.recipeName, { borderLeftColor: mealColor }]}
        onPress={onPress}
      >
        <Text style={styles.recipeText}>{recipeId}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.removeButton}
        onPress={onRemove}
      >
        <Text style={styles.removeButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  navButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  weekInfo: {
    alignItems: 'center',
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  weekSummary: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  daysContainer: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 12,
  },
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  todayCard: {
    borderColor: '#FF6B6B',
    borderWidth: 2,
    backgroundColor: '#fff9f8',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dayName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  todayBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B6B',
    backgroundColor: '#ffe0e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  mealsContainer: {
    gap: 10,
  },
  mealSection: {
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderLeftWidth: 4,
    backgroundColor: '#fff',
  },
  mealType: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  mealCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  recipesList: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 6,
  },
  recipeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recipeName: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderLeftWidth: 3,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  recipeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  removeButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#ffcccc',
    borderRadius: 4,
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  emptySlot: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  emptySlotText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
  },
});

export default WeeklyMealPlanView;
