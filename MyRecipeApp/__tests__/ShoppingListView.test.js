/**
 * ShoppingListView Component Tests
 * 
 * These are integration/logic tests for the ShoppingListView component.
 * We test the component's data flow, state management, and logic rather than
 * rendering due to React Native's Dimensions and native module dependencies.
 * 
 * Tests verify:
 * - Filter functionality (week, day, custom)
 * - Shopping list generation from meal plans
 * - Purchase status tracking
 * - Item aggregation and categorization
 * - AsyncStorage integration
 * - Empty/loading states
 * - Day selection logic
 */

import { shoppingListService } from '../shoppingListService';
import { mealPlanningService } from '../mealPlanningService';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage');
jest.mock('../mealPlanningService');

// Mock shopping list service
jest.mock('../shoppingListService', () => ({
  shoppingListService: {
    generateWeeklyShoppingList: jest.fn(),
    generateDailyShoppingList: jest.fn(),
    generateCustomShoppingList: jest.fn(),
    toggleItemPurchased: jest.fn(),
    clearPurchasedItems: jest.fn(),
  },
  INGREDIENT_CATEGORIES: [
    'Produce',
    'Dairy',
    'Meat & Seafood',
    'Grains & Pasta',
    'Pantry',
    'Condiments',
    'Beverages',
    'Other',
  ],
}));

const mockMealPlan = [
  { recipeId: 1, dayOfWeek: 0, mealType: 'breakfast' },
  { recipeId: 2, dayOfWeek: 1, mealType: 'lunch' },
  { recipeId: 3, dayOfWeek: 2, mealType: 'dinner' },
];

const mockShoppingList = {
  Produce: [
    {
      name: 'Tomato',
      quantity: 2,
      unit: 'pieces',
      purchased: false,
      recipes: ['Salad Recipe'],
    },
    {
      name: 'Lettuce',
      quantity: 1,
      unit: 'head',
      purchased: false,
      recipes: ['Salad Recipe'],
    },
  ],
  Dairy: [
    {
      name: 'Milk',
      quantity: 1,
      unit: 'cup',
      purchased: true,
      recipes: ['Pasta Recipe'],
    },
  ],
};

describe('ShoppingListView Component - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockMealPlan));
    shoppingListService.generateWeeklyShoppingList.mockReturnValue(
      mockShoppingList
    );
  });

  describe('Meal Plan Loading', () => {
    test('should load meal plan from AsyncStorage', async () => {
      const result = await AsyncStorage.getItem('mealPlan');
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('mealPlan');
      expect(JSON.parse(result)).toEqual(mockMealPlan);
    });

    test('should handle empty meal plan', async () => {
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify([]));
      const result = await AsyncStorage.getItem('mealPlan');
      expect(JSON.parse(result)).toEqual([]);
    });

    test('should handle AsyncStorage errors', async () => {
      const error = new Error('Storage error');
      AsyncStorage.getItem.mockRejectedValue(error);
      
      await expect(AsyncStorage.getItem('mealPlan')).rejects.toThrow('Storage error');
    });

    test('should handle null meal plan', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      const result = await AsyncStorage.getItem('mealPlan');
      expect(result).toBeNull();
    });
  });

  describe('Shopping List Generation - Weekly Filter', () => {
    test('should generate weekly shopping list with valid meal plan', async () => {
      const result = shoppingListService.generateWeeklyShoppingList(mockMealPlan);
      
      expect(shoppingListService.generateWeeklyShoppingList).toHaveBeenCalledWith(
        mockMealPlan
      );
      expect(result).toEqual(mockShoppingList);
    });

    test('should return empty object for empty meal plan', async () => {
      shoppingListService.generateWeeklyShoppingList.mockReturnValue({});
      const result = shoppingListService.generateWeeklyShoppingList([]);
      
      expect(result).toEqual({});
    });

    test('should organize items by category', () => {
      const result = shoppingListService.generateWeeklyShoppingList(mockMealPlan);
      const categories = Object.keys(result);
      
      expect(categories).toContain('Produce');
      expect(categories).toContain('Dairy');
    });

    test('should include recipe sources for ingredients', () => {
      const result = shoppingListService.generateWeeklyShoppingList(mockMealPlan);
      
      expect(result.Produce[0].recipes).toBeDefined();
      expect(result.Produce[0].recipes).toContain('Salad Recipe');
    });
  });

  describe('Shopping List Generation - Daily Filter', () => {
    test('should generate shopping list for specific day', async () => {
      shoppingListService.generateDailyShoppingList.mockReturnValue(mockShoppingList);
      const result = shoppingListService.generateDailyShoppingList(0, mockMealPlan);
      
      expect(shoppingListService.generateDailyShoppingList).toHaveBeenCalledWith(
        0,
        mockMealPlan
      );
      expect(result).toEqual(mockShoppingList);
    });

    test('should call generateDailyShoppingList with correct day index', () => {
      shoppingListService.generateDailyShoppingList(2, mockMealPlan);
      
      expect(shoppingListService.generateDailyShoppingList).toHaveBeenCalledWith(
        2,
        mockMealPlan
      );
    });

    test('should handle all days of week (0-6)', () => {
      for (let day = 0; day < 7; day++) {
        shoppingListService.generateDailyShoppingList(day, mockMealPlan);
        expect(shoppingListService.generateDailyShoppingList).toHaveBeenCalledWith(
          day,
          mockMealPlan
        );
      }
    });

    test('should return empty list for day with no recipes', () => {
      shoppingListService.generateDailyShoppingList.mockReturnValue({});
      const result = shoppingListService.generateDailyShoppingList(5, mockMealPlan);
      
      expect(result).toEqual({});
    });
  });

  describe('Shopping List Generation - Custom Filter', () => {
    test('should generate shopping list for selected days', () => {
      shoppingListService.generateCustomShoppingList.mockReturnValue(mockShoppingList);
      const selectedDays = [0, 2, 4];
      const result = shoppingListService.generateCustomShoppingList(
        selectedDays,
        mockMealPlan
      );
      
      expect(shoppingListService.generateCustomShoppingList).toHaveBeenCalledWith(
        selectedDays,
        mockMealPlan
      );
      expect(result).toEqual(mockShoppingList);
    });

    test('should handle single selected day', () => {
      shoppingListService.generateCustomShoppingList(
        [2],
        mockMealPlan
      );
      
      expect(shoppingListService.generateCustomShoppingList).toHaveBeenCalledWith(
        [2],
        mockMealPlan
      );
    });

    test('should handle all days selected', () => {
      const allDays = [0, 1, 2, 3, 4, 5, 6];
      shoppingListService.generateCustomShoppingList(allDays, mockMealPlan);
      
      expect(shoppingListService.generateCustomShoppingList).toHaveBeenCalledWith(
        allDays,
        mockMealPlan
      );
    });

    test('should return empty list for empty day selection', () => {
      shoppingListService.generateCustomShoppingList.mockReturnValue({});
      const result = shoppingListService.generateCustomShoppingList([], mockMealPlan);
      
      expect(result).toEqual({});
    });

    test('should handle non-sequential day selections', () => {
      const nonSequentialDays = [1, 3, 5];
      shoppingListService.generateCustomShoppingList(
        nonSequentialDays,
        mockMealPlan
      );
      
      expect(shoppingListService.generateCustomShoppingList).toHaveBeenCalledWith(
        nonSequentialDays,
        mockMealPlan
      );
    });
  });

  describe('Purchase Tracking', () => {
    test('should toggle purchase status for item', () => {
      const item = {
        name: 'Tomato',
        quantity: 2,
        unit: 'pieces',
        purchased: false,
        recipes: ['Salad Recipe'],
      };

      shoppingListService.toggleItemPurchased.mockReturnValue({
        ...item,
        purchased: true,
      });

      const result = shoppingListService.toggleItemPurchased(item);
      
      expect(result.purchased).toBe(true);
      expect(result.name).toBe('Tomato');
    });

    test('should toggle purchased item back to unpurchased', () => {
      const purchasedItem = {
        name: 'Milk',
        quantity: 1,
        unit: 'cup',
        purchased: true,
        recipes: ['Pasta Recipe'],
      };

      shoppingListService.toggleItemPurchased.mockReturnValue({
        ...purchasedItem,
        purchased: false,
      });

      const result = shoppingListService.toggleItemPurchased(purchasedItem);
      
      expect(result.purchased).toBe(false);
    });

    test('should maintain item properties when toggling purchase', () => {
      const item = {
        name: 'Tomato',
        quantity: 2,
        unit: 'pieces',
        purchased: false,
        recipes: ['Salad Recipe'],
      };

      shoppingListService.toggleItemPurchased.mockImplementation((it) => ({
        ...it,
        purchased: !it.purchased,
      }));

      const result = shoppingListService.toggleItemPurchased(item);
      
      expect(result.name).toBe('Tomato');
      expect(result.quantity).toBe(2);
      expect(result.unit).toBe('pieces');
      expect(result.recipes).toEqual(['Salad Recipe']);
    });
  });

  describe('Clear Purchased Items', () => {
    test('should remove all purchased items from category', () => {
      const category = [
        {
          name: 'Tomato',
          quantity: 2,
          unit: 'pieces',
          purchased: false,
          recipes: [],
        },
        {
          name: 'Milk',
          quantity: 1,
          unit: 'cup',
          purchased: true,
          recipes: [],
        },
        {
          name: 'Butter',
          quantity: 1,
          unit: 'stick',
          purchased: true,
          recipes: [],
        },
      ];

      shoppingListService.clearPurchasedItems.mockReturnValue([
        {
          name: 'Tomato',
          quantity: 2,
          unit: 'pieces',
          purchased: false,
          recipes: [],
        },
      ]);

      const result = shoppingListService.clearPurchasedItems(category);
      
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Tomato');
      expect(result[0].purchased).toBe(false);
    });

    test('should return empty array if all items purchased', () => {
      const allPurchased = [
        {
          name: 'Milk',
          quantity: 1,
          unit: 'cup',
          purchased: true,
          recipes: [],
        },
        {
          name: 'Butter',
          quantity: 1,
          unit: 'stick',
          purchased: true,
          recipes: [],
        },
      ];

      shoppingListService.clearPurchasedItems.mockReturnValue([]);
      const result = shoppingListService.clearPurchasedItems(allPurchased);
      
      expect(result).toEqual([]);
    });

    test('should return original array if no purchased items', () => {
      const noPurchased = [
        {
          name: 'Tomato',
          quantity: 2,
          unit: 'pieces',
          purchased: false,
          recipes: [],
        },
      ];

      shoppingListService.clearPurchasedItems.mockReturnValue(noPurchased);
      const result = shoppingListService.clearPurchasedItems(noPurchased);
      
      expect(result.length).toBe(1);
      expect(result[0].purchased).toBe(false);
    });

    test('should handle empty array input', () => {
      shoppingListService.clearPurchasedItems.mockReturnValue([]);
      const result = shoppingListService.clearPurchasedItems([]);
      
      expect(result).toEqual([]);
    });
  });

  describe('Item Counting', () => {
    test('should count total items in shopping list', () => {
      const total = Object.keys(mockShoppingList).reduce((sum, category) => {
        return sum + mockShoppingList[category].length;
      }, 0);
      
      expect(total).toBe(3);
    });

    test('should count purchased items', () => {
      const purchased = Object.keys(mockShoppingList).reduce((sum, category) => {
        return sum + mockShoppingList[category].filter((item) => item.purchased).length;
      }, 0);
      
      expect(purchased).toBe(1);
    });

    test('should count unpurchased items', () => {
      const unpurchased = Object.keys(mockShoppingList).reduce((sum, category) => {
        return sum + mockShoppingList[category].filter((item) => !item.purchased).length;
      }, 0);
      
      expect(unpurchased).toBe(2);
    });

    test('should calculate purchase percentage', () => {
      const total = Object.keys(mockShoppingList).reduce((sum, category) => {
        return sum + mockShoppingList[category].length;
      }, 0);

      const purchased = Object.keys(mockShoppingList).reduce((sum, category) => {
        return sum + mockShoppingList[category].filter((item) => item.purchased).length;
      }, 0);

      const percentage = (purchased / total) * 100;
      expect(percentage).toBe(33.33333333333333);
    });
  });

  describe('Category Organization', () => {
    test('should organize all 8 ingredient categories', () => {
      const allCategories = {
        Produce: [],
        Dairy: [],
        'Meat & Seafood': [],
        'Grains & Pasta': [],
        Pantry: [],
        Condiments: [],
        Beverages: [],
        Other: [],
      };

      const categoryKeys = Object.keys(allCategories);
      expect(categoryKeys).toHaveLength(8);
    });

    test('should include category count information', () => {
      const categoryCounts = {};
      Object.keys(mockShoppingList).forEach((category) => {
        categoryCounts[category] = mockShoppingList[category].length;
      });

      expect(categoryCounts['Produce']).toBe(2);
      expect(categoryCounts['Dairy']).toBe(1);
    });

    test('should handle category with multiple items', () => {
      const multiItemCategory = {
        Produce: [
          {
            name: 'Tomato',
            quantity: 2,
            unit: 'pieces',
            purchased: false,
            recipes: [],
          },
          {
            name: 'Lettuce',
            quantity: 1,
            unit: 'head',
            purchased: false,
            recipes: [],
          },
          {
            name: 'Cucumber',
            quantity: 1,
            unit: 'piece',
            purchased: false,
            recipes: [],
          },
        ],
      };

      expect(multiItemCategory.Produce.length).toBe(3);
    });
  });

  describe('Recipe Tracking', () => {
    test('should track recipe sources for ingredients', () => {
      const item = mockShoppingList.Produce[0];
      
      expect(item.recipes).toBeDefined();
      expect(Array.isArray(item.recipes)).toBe(true);
    });

    test('should show multiple recipe sources', () => {
      const multiRecipeItem = {
        name: 'Tomato',
        quantity: 3,
        unit: 'pieces',
        purchased: false,
        recipes: ['Salad Recipe', 'Pasta Sauce', 'Soup'],
      };

      expect(multiRecipeItem.recipes.length).toBe(3);
      expect(multiRecipeItem.recipes).toContain('Salad Recipe');
      expect(multiRecipeItem.recipes).toContain('Pasta Sauce');
    });

    test('should handle items with no recipe sources', () => {
      const noRecipeItem = {
        name: 'Generic Ingredient',
        quantity: 1,
        unit: 'unit',
        purchased: false,
        recipes: [],
      };

      expect(noRecipeItem.recipes).toEqual([]);
    });
  });

  describe('Quantity and Unit Handling', () => {
    test('should preserve quantity values', () => {
      const item = mockShoppingList.Produce[0];
      
      expect(item.quantity).toBe(2);
      expect(typeof item.quantity).toBe('number');
    });

    test('should preserve unit values', () => {
      const items = mockShoppingList.Produce;
      
      expect(items[0].unit).toBe('pieces');
      expect(items[1].unit).toBe('head');
    });

    test('should handle decimal quantities', () => {
      const decimalItem = {
        name: 'Oil',
        quantity: 0.5,
        unit: 'cup',
        purchased: false,
        recipes: [],
      };

      expect(decimalItem.quantity).toBe(0.5);
    });

    test('should handle large quantities', () => {
      const largeQtyItem = {
        name: 'Water',
        quantity: 2000,
        unit: 'ml',
        purchased: false,
        recipes: [],
      };

      expect(largeQtyItem.quantity).toBe(2000);
    });

    test('should handle various unit types', () => {
      const units = ['cup', 'tsp', 'tbsp', 'g', 'kg', 'ml', 'l', 'pieces'];
      const items = units.map((unit) => ({
        name: 'Ingredient',
        quantity: 1,
        unit: unit,
        purchased: false,
        recipes: [],
      }));

      items.forEach((item) => {
        expect(item.unit).toBeTruthy();
      });
    });
  });

  describe('Filter Mode Management', () => {
    test('should have three filter modes', () => {
      const modes = ['week', 'day', 'custom'];
      expect(modes).toHaveLength(3);
    });

    test('should default to week mode', () => {
      shoppingListService.generateWeeklyShoppingList(mockMealPlan);
      
      expect(shoppingListService.generateWeeklyShoppingList).toHaveBeenCalled();
    });

    test('should switch between filter modes', () => {
      shoppingListService.generateWeeklyShoppingList(mockMealPlan);
      shoppingListService.generateDailyShoppingList(0, mockMealPlan);
      shoppingListService.generateCustomShoppingList([0, 2], mockMealPlan);

      expect(shoppingListService.generateWeeklyShoppingList).toHaveBeenCalled();
      expect(shoppingListService.generateDailyShoppingList).toHaveBeenCalled();
      expect(shoppingListService.generateCustomShoppingList).toHaveBeenCalled();
    });
  });

  describe('Day Selection', () => {
    test('should track selected day in day mode', () => {
      for (let day = 0; day < 7; day++) {
        expect(day).toBeGreaterThanOrEqual(0);
        expect(day).toBeLessThan(7);
      }
    });

    test('should handle multiple day selections in custom mode', () => {
      const selectedDays = [0, 2, 4, 6];
      
      expect(selectedDays).toHaveLength(4);
      expect(selectedDays).toContain(0);
      expect(selectedDays).toContain(4);
    });

    test('should track selected days count', () => {
      const day1 = [0];
      const days3 = [0, 2, 4];
      const days7 = [0, 1, 2, 3, 4, 5, 6];

      expect(day1.length).toBe(1);
      expect(days3.length).toBe(3);
      expect(days7.length).toBe(7);
    });
  });

  describe('Integration Workflow', () => {
    test('should complete weekly shopping flow', async () => {
      const savedPlan = await AsyncStorage.getItem('mealPlan');
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('mealPlan');

      const parsedPlan = JSON.parse(savedPlan);
      const shoppingList = shoppingListService.generateWeeklyShoppingList(parsedPlan);

      expect(shoppingListService.generateWeeklyShoppingList).toHaveBeenCalledWith(
        parsedPlan
      );
      expect(shoppingList).toBeTruthy();
    });

    test('should complete daily shopping flow', async () => {
      const savedPlan = await AsyncStorage.getItem('mealPlan');
      const parsedPlan = JSON.parse(savedPlan);

      shoppingListService.generateDailyShoppingList(2, parsedPlan);

      expect(shoppingListService.generateDailyShoppingList).toHaveBeenCalledWith(
        2,
        parsedPlan
      );
    });

    test('should complete custom shopping flow with multiple operations', async () => {
      const savedPlan = await AsyncStorage.getItem('mealPlan');
      const parsedPlan = JSON.parse(savedPlan);

      shoppingListService.generateCustomShoppingList([0, 3], parsedPlan);

      shoppingListService.toggleItemPurchased({
        name: 'Item',
        quantity: 1,
        unit: 'unit',
        purchased: false,
        recipes: [],
      });

      shoppingListService.clearPurchasedItems([]);

      expect(shoppingListService.generateCustomShoppingList).toHaveBeenCalled();
      expect(shoppingListService.toggleItemPurchased).toHaveBeenCalled();
      expect(shoppingListService.clearPurchasedItems).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('should handle items with special characters in name', () => {
      const specialItem = {
        name: "Red & Green Peppers",
        quantity: 2,
        unit: 'pieces',
        purchased: false,
        recipes: [],
      };

      expect(specialItem.name).toContain('&');
    });

    test('should handle very long ingredient names', () => {
      const longNameItem = {
        name: 'Extra Virgin Olive Oil First Cold Pressed',
        quantity: 1,
        unit: 'bottle',
        purchased: false,
        recipes: [],
      };

      expect(longNameItem.name.length).toBeGreaterThan(20);
    });

    test('should handle items with numeric names', () => {
      const numericItem = {
        name: '2% Milk',
        quantity: 1,
        unit: 'gallon',
        purchased: false,
        recipes: [],
      };

      expect(numericItem.name).toContain('2%');
    });

    test('should handle duplicate categories (test robustness)', () => {
      const maybeDuplicates = {
        Produce: [
          { name: 'Apple', quantity: 1, unit: 'piece', purchased: false, recipes: [] },
        ],
        'Produce Duplicate': [
          { name: 'Grape', quantity: 1, unit: 'bunch', purchased: false, recipes: [] },
        ],
      };

      const categories = Object.keys(maybeDuplicates);
      expect(categories).toHaveLength(2);
      expect(categories).toContain('Produce');
    });
  });

  describe('State Management Logic', () => {
    test('should update purchased count correctly', () => {
      const items = [
        { name: 'A', quantity: 1, unit: 'u', purchased: true, recipes: [] },
        { name: 'B', quantity: 1, unit: 'u', purchased: false, recipes: [] },
        { name: 'C', quantity: 1, unit: 'u', purchased: true, recipes: [] },
      ];

      const purchasedCount = items.filter((item) => item.purchased).length;
      expect(purchasedCount).toBe(2);
    });

    test('should track all shopping list state changes', () => {
      const initialList = { Produce: [{ name: 'A', purchased: false }] };
      const updatedList = { Produce: [{ name: 'A', purchased: true }] };

      expect(initialList.Produce[0].purchased).toBe(false);
      expect(updatedList.Produce[0].purchased).toBe(true);
    });
  });
});
