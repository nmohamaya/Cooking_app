import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mealPlanningService } from './mealPlanningService';
import shoppingListService, { INGREDIENT_CATEGORIES } from './shoppingListService';

/**
 * ShoppingListView Component
 * 
 * Main shopping list display component. Features:
 * - Display categorized ingredients
 * - Filter by week, specific day, or custom date range
 * - Mark items as purchased with checkboxes
 * - Show which recipes need each ingredient
 * - Clear purchased items
 * - Scroll through categories
 */
export const ShoppingListView = ({ onBack, recipes = [], onSaveShoppingList = null }) => {
  const [filterMode, setFilterMode] = useState('week'); // 'week', 'day', 'custom'
  const [selectedDay, setSelectedDay] = useState(0); // 0 = Monday
  const [selectedDays, setSelectedDays] = useState([]);
  const [shoppingList, setShoppingList] = useState({});
  const [mealPlan, setMealPlan] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load meal plan from AsyncStorage and generate shopping list
  const loadAndGenerateList = useCallback(async () => {
    try {
      setIsLoading(true);
      // Prefer the namespaced key but fall back to legacy key for compatibility
      let savedMealPlan = await AsyncStorage.getItem('@myrecipeapp/meal_plan');
      if (!savedMealPlan) {
        savedMealPlan = await AsyncStorage.getItem('mealPlan');
      }

      const parsedMealPlan = savedMealPlan ? JSON.parse(savedMealPlan) : [];
      setMealPlan(parsedMealPlan);

      // Generate list based on filter mode
      // Pass recipes array so the service can look up real recipes
      let generatedList = {};
      if (filterMode === 'week') {
        generatedList = shoppingListService.generateWeeklyShoppingList(
          parsedMealPlan,
          0,
          recipes
        );
      } else if (filterMode === 'day') {
        generatedList = shoppingListService.generateDailyShoppingList(
          selectedDay,
          parsedMealPlan,
          recipes
        );
      } else if (filterMode === 'custom' && selectedDays.length > 0) {
        generatedList = shoppingListService.generateCustomShoppingList(
          selectedDays,
          parsedMealPlan,
          recipes
        );
      }

      setShoppingList(generatedList);
    } catch (error) {
      console.error('Error loading shopping list:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filterMode, selectedDay, selectedDays, recipes]);

  // Load list on component mount and when filters change
  React.useEffect(() => {
    loadAndGenerateList();
  }, [loadAndGenerateList]);

  const clearAllShoppingList = () => {
    setShoppingList({});
  };

  // Toggle purchase status for an item
  const togglePurchaseStatus = (category, ingredientIndex) => {
    const updatedList = { ...shoppingList };
    if (updatedList[category] && updatedList[category][ingredientIndex]) {
      updatedList[category][ingredientIndex] = shoppingListService.toggleItemPurchased(
        updatedList[category][ingredientIndex]
      );
      setShoppingList(updatedList);
    }
  };

  // Clear all purchased items
  const clearPurchased = () => {
    const updatedList = {};
    Object.keys(shoppingList).forEach((category) => {
      const unpurchased = shoppingList[category].filter((item) => !item.purchased);
      if (unpurchased.length > 0) {
        updatedList[category] = unpurchased;
      }
    });
    setShoppingList(updatedList);
  };

  // Get count of purchased vs total items
  const getPurchasedCounts = () => {
    let purchased = 0;
    let total = 0;
    Object.keys(shoppingList).forEach((category) => {
      shoppingList[category].forEach((item) => {
        total++;
        if (item.purchased) purchased++;
      });
    });
    return { purchased, total };
  };

  const { purchased, total } = getPurchasedCounts();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.title}>Shopping List</Text>
        </View>
        <Text style={styles.subtitle}>
          {purchased}/{total} items purchased
        </Text>
      </View>

      {/* Filter Controls */}
      <View style={styles.filterContainer}>
        <FilterButton
          label="Week"
          active={filterMode === 'week'}
          onPress={() => setFilterMode('week')}
        />
        <FilterButton
          label="Day"
          active={filterMode === 'day'}
          onPress={() => setFilterMode('day')}
        />
        <FilterButton
          label="Custom"
          active={filterMode === 'custom'}
          onPress={() => setFilterMode('custom')}
        />
      </View>

      {/* Day Selector (shown only in 'day' mode) */}
      {filterMode === 'day' && (
        <DaySelector selectedDay={selectedDay} onSelectDay={setSelectedDay} />
      )}

      {/* Custom Days Selector (shown only in 'custom' mode) */}
      {filterMode === 'custom' && (
        <CustomDaysSelector
          selectedDays={selectedDays}
          onSelectDays={setSelectedDays}
        />
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.refreshButton]}
          onPress={loadAndGenerateList}
        >
          <Text style={styles.actionButtonText}>↻ Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.clearButton]}
          onPress={clearPurchased}
          disabled={purchased === 0}
        >
          <Text style={styles.actionButtonText}>
            Clear Purchased ({purchased})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.clearAllButton]}
          onPress={clearAllShoppingList}
          disabled={total === 0}
        >
          <Text style={styles.actionButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Save Shopping List Button (if callback provided) */}
      {onSaveShoppingList && total > 0 && (
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => onSaveShoppingList(shoppingList)}
          >
            <Text style={styles.saveButtonText}>✓ Save Shopping List</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Shopping List Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : total === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No items in shopping list</Text>
          <Text style={styles.emptySubtext}>Add recipes to your meal plan</Text>
        </View>
      ) : (
        <ScrollView style={styles.listContainer}>
          {Object.keys(shoppingList).map((category) => (
            <CategorySection
              key={category}
              category={category}
              items={shoppingList[category]}
              onTogglePurchase={(index) => togglePurchaseStatus(category, index)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

/**
 * FilterButton Component
 * Reusable button for filter selection
 */
const FilterButton = ({ label, active, onPress }) => (
  <TouchableOpacity
    style={[styles.filterButton, active && styles.filterButtonActive]}
    onPress={onPress}
  >
    <Text
      style={[
        styles.filterButtonText,
        active && styles.filterButtonTextActive,
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

/**
 * DaySelector Component
 * Allows selecting a specific day of the week
 */
const DaySelector = ({ selectedDay, onSelectDay }) => {
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <View style={styles.daySelectorContainer}>
      <Text style={styles.daySelectorLabel}>Select Day:</Text>
      <View style={styles.dayButtonsRow}>
        {daysOfWeek.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayButton,
              selectedDay === index && styles.dayButtonActive,
            ]}
            onPress={() => onSelectDay(index)}
          >
            <Text
              style={[
                styles.dayButtonText,
                selectedDay === index && styles.dayButtonTextActive,
              ]}
            >
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

/**
 * CustomDaysSelector Component
 * Allows selecting multiple days
 */
const CustomDaysSelector = ({ selectedDays, onSelectDays }) => {
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const toggleDay = (dayIndex) => {
    if (selectedDays.includes(dayIndex)) {
      onSelectDays(selectedDays.filter((d) => d !== dayIndex));
    } else {
      onSelectDays([...selectedDays, dayIndex]);
    }
  };

  return (
    <View style={styles.customSelectorContainer}>
      <Text style={styles.customSelectorLabel}>Select Days ({selectedDays.length}):</Text>
      <View style={styles.dayButtonsRow}>
        {daysOfWeek.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayButton,
              selectedDays.includes(index) && styles.dayButtonActive,
            ]}
            onPress={() => toggleDay(index)}
          >
            <Text
              style={[
                styles.dayButtonText,
                selectedDays.includes(index) && styles.dayButtonTextActive,
              ]}
            >
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

/**
 * CategorySection Component
 * Displays all items in a category
 */
const CategorySection = ({ category, items, onTogglePurchase }) => {
  const getCategoryColor = (cat) => {
    const colorMap = {
      Produce: '#34C759',
      Dairy: '#87CEEB',
      'Meat & Seafood': '#FF6B6B',
      'Grains & Pasta': '#FFB84D',
      Pantry: '#D4A574',
      Condiments: '#FF9500',
      Beverages: '#5B9BD5',
      Other: '#A9A9A9',
    };
    return colorMap[cat] || '#999';
  };

  return (
    <View style={styles.categorySection}>
      <View style={[
        styles.categoryHeader,
        { backgroundColor: getCategoryColor(category) },
      ]}>
        <Text style={styles.categoryTitle}>{category}</Text>
        <Text style={styles.categoryCount}>{items.length}</Text>
      </View>

      <View style={styles.itemsContainer}>
        {items.map((item, index) => (
          <IngredientItem
            key={`${category}-${index}`}
            item={item}
            onTogglePurchase={() => onTogglePurchase(index)}
          />
        ))}
      </View>
    </View>
  );
};

/**
 * IngredientItem Component
 * Individual ingredient with checkbox and recipe info
 */
const IngredientItem = ({ item, onTogglePurchase }) => {
  const [recipesVisible, setRecipesVisible] = useState(false);

  return (
    <View style={styles.itemContainer}>
      <TouchableOpacity
        style={styles.itemCheckbox}
        onPress={onTogglePurchase}
      >
        <View
          style={[
            styles.checkbox,
            item.purchased && styles.checkboxChecked,
          ]}
        >
          {item.purchased && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>

      <View style={styles.itemDetails}>
        <Text
          style={[
            styles.itemName,
            item.purchased && styles.itemNameStrikethrough,
          ]}
        >
          {item.name}
        </Text>
        <Text style={styles.itemQuantity}>
          {item.quantity} {item.unit}
        </Text>

        {item.recipes && item.recipes.length > 0 && (
          <TouchableOpacity onPress={() => setRecipesVisible(!recipesVisible)}>
            <Text style={styles.recipesLink}>
              From {item.recipes.length} recipe{item.recipes.length !== 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {recipesVisible && item.recipes && (
        <View style={styles.recipesList}>
          {item.recipes.map((recipe, idx) => (
            <Text key={idx} style={styles.recipeName}>
              • {recipe}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#333',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  backButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#ccc',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  daySelectorContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  daySelectorLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
  },
  customSelectorContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  customSelectorLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
  },
  dayButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#34C759',
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  dayButtonTextActive: {
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
  },
  clearButton: {
    backgroundColor: '#FF9500',
  },
  clearAllButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  saveButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#34C759',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  listContainer: {
    flex: 1,
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  categorySection: {
    marginBottom: 16,
    marginHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  categoryCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  itemsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemCheckbox: {
    paddingRight: 12,
    paddingTop: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  itemNameStrikethrough: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  recipesLink: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  recipesList: {
    marginTop: 8,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#e0e0e0',
  },
  recipeName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
});

export default ShoppingListView;
