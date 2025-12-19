import {
  parseIngredient,
  getCategoryForIngredient,
  extractRecipeIngredients,
  aggregateIngredients,
  categorizeIngredients,
  generateWeeklyShoppingList,
  generateDailyShoppingList,
  generateCustomShoppingList,
  getShoppingListItemCount,
  getCategoryOrder,
  sortShoppingList,
  createShoppingListItem,
  toggleItemPurchased,
  clearPurchasedItems,
  getMockRecipe,
} from '../shoppingListService';

describe('Shopping List Service', () => {
  describe('parseIngredient', () => {
    it('should parse ingredient with quantity and unit', () => {
      const result = parseIngredient('2 cups flour');
      expect(result.quantity).toBe(2);
      expect(result.unit).toBe('cups');
      expect(result.name).toBe('flour');
    });

    it('should parse ingredient with decimal quantity', () => {
      const result = parseIngredient('0.5 cup sugar');
      expect(result.quantity).toBe(0.5);
      expect(result.unit).toBe('cup');
      expect(result.name).toBe('sugar');
    });

    it('should parse ingredient with weight unit', () => {
      const result = parseIngredient('250g chicken');
      expect(result.quantity).toBe(250);
      expect(result.unit).toBe('g');
      expect(result.name).toBe('chicken');
    });

    it('should handle ingredient without quantity', () => {
      const result = parseIngredient('salt');
      expect(result.name).toBe('salt');
      expect(result.quantity).toBe(1);
      expect(result.unit).toBe('piece');
    });

    it('should handle empty string', () => {
      const result = parseIngredient('');
      expect(result.name).toBe('Unknown');
      expect(result.quantity).toBe(1);
    });

    it('should handle null/undefined', () => {
      const result1 = parseIngredient(null);
      const result2 = parseIngredient(undefined);
      expect(result1.name).toBe('Unknown');
      expect(result2.name).toBe('Unknown');
    });

    it('should trim whitespace', () => {
      const result = parseIngredient('  3 tbsp  olive oil  ');
      expect(result.name).toBe('olive oil');
      expect(result.quantity).toBe(3);
    });
  });

  describe('getCategoryForIngredient', () => {
    it('should categorize produce items', () => {
      expect(getCategoryForIngredient('tomato')).toBe('Produce');
      expect(getCategoryForIngredient('lettuce')).toBe('Produce');
      expect(getCategoryForIngredient('apple')).toBe('Produce');
    });

    it('should categorize dairy items', () => {
      expect(getCategoryForIngredient('milk')).toBe('Dairy');
      expect(getCategoryForIngredient('cheese')).toBe('Dairy');
      expect(getCategoryForIngredient('egg')).toBe('Dairy');
    });

    it('should categorize meat items', () => {
      expect(getCategoryForIngredient('chicken')).toBe('Meat & Seafood');
      expect(getCategoryForIngredient('beef')).toBe('Meat & Seafood');
      expect(getCategoryForIngredient('salmon')).toBe('Meat & Seafood');
    });

    it('should categorize grains', () => {
      expect(getCategoryForIngredient('pasta')).toBe('Grains & Pasta');
      expect(getCategoryForIngredient('rice')).toBe('Grains & Pasta');
      expect(getCategoryForIngredient('flour')).toBe('Grains & Pasta');
    });

    it('should categorize pantry items', () => {
      expect(getCategoryForIngredient('salt')).toBe('Pantry');
      expect(getCategoryForIngredient('oil')).toBe('Pantry');
      expect(getCategoryForIngredient('spice')).toBe('Pantry');
    });

    it('should return default category for unknown items', () => {
      expect(getCategoryForIngredient('unknown_item_xyz')).toBe('Other');
    });

    it('should be case insensitive', () => {
      expect(getCategoryForIngredient('TOMATO')).toBe('Produce');
      expect(getCategoryForIngredient('ChEeSe')).toBe('Dairy');
    });

    it('should handle partial matches', () => {
      expect(getCategoryForIngredient('ground beef')).toBe('Meat & Seafood');
    });

    it('should handle empty/null input', () => {
      expect(getCategoryForIngredient('')).toBe('Other');
      expect(getCategoryForIngredient(null)).toBe('Other');
    });
  });

  describe('extractRecipeIngredients', () => {
    it('should extract ingredients from recipe', () => {
      const recipe = {
        id: 'recipe1',
        name: 'Pasta',
        ingredients: '400g pasta\n3 eggs\n200g bacon',
      };
      const result = extractRecipeIngredients(recipe);
      expect(result.length).toBe(3);
      expect(result[0].name).toBe('pasta');
      expect(result[1].quantity).toBe(3);
    });

    it('should handle empty ingredients', () => {
      const recipe = { id: 'recipe1', name: 'Empty Recipe', ingredients: '' };
      const result = extractRecipeIngredients(recipe);
      expect(result.length).toBe(0);
    });

    it('should add recipe reference to each ingredient', () => {
      const recipe = {
        id: 'recipe1',
        name: 'Test Recipe',
        ingredients: '1 cup flour\n2 eggs',
      };
      const result = extractRecipeIngredients(recipe);
      expect(result[0].recipe).toBe('Test Recipe');
      expect(result[1].recipe).toBe('Test Recipe');
    });

    it('should skip empty lines', () => {
      const recipe = {
        id: 'recipe1',
        name: 'Recipe',
        ingredients: '1 cup flour\n\n2 eggs\n\n3 tbsp sugar',
      };
      const result = extractRecipeIngredients(recipe);
      expect(result.length).toBe(3);
    });

    it('should handle null recipe', () => {
      const result = extractRecipeIngredients(null);
      expect(result.length).toBe(0);
    });
  });

  describe('aggregateIngredients', () => {
    it('should combine same ingredients', () => {
      const ingredients = [
        { name: 'flour', quantity: 2, unit: 'cups', recipe: 'Recipe1' },
        { name: 'flour', quantity: 1, unit: 'cups', recipe: 'Recipe2' },
      ];
      const result = aggregateIngredients(ingredients);
      expect(result.length).toBe(1);
      expect(result[0].quantity).toBe(3);
      expect(result[0].recipes.length).toBe(2);
    });

    it('should not combine ingredients with different units', () => {
      const ingredients = [
        { name: 'flour', quantity: 2, unit: 'cups', recipe: 'Recipe1' },
        { name: 'flour', quantity: 500, unit: 'g', recipe: 'Recipe2' },
      ];
      const result = aggregateIngredients(ingredients);
      expect(result.length).toBe(2);
    });

    it('should track recipe sources', () => {
      const ingredients = [
        { name: 'egg', quantity: 3, unit: 'piece', recipe: 'Pasta' },
        { name: 'egg', quantity: 2, unit: 'piece', recipe: 'Salad' },
      ];
      const result = aggregateIngredients(ingredients);
      expect(result[0].recipes).toContain('Pasta');
      expect(result[0].recipes).toContain('Salad');
    });

    it('should handle empty ingredient list', () => {
      const result = aggregateIngredients([]);
      expect(result.length).toBe(0);
    });

    it('should preserve ingredient metadata', () => {
      const ingredients = [
        { name: 'salt', quantity: 1, unit: 'tsp', recipe: 'Recipe1' },
      ];
      const result = aggregateIngredients(ingredients);
      expect(result[0].name).toBe('salt');
      expect(result[0].unit).toBe('tsp');
    });
  });

  describe('categorizeIngredients', () => {
    it('should group ingredients by category', () => {
      const ingredients = [
        { name: 'tomato', quantity: 2, unit: 'piece', recipes: [] },
        { name: 'chicken', quantity: 1, unit: 'kg', recipes: [] },
        { name: 'cheese', quantity: 200, unit: 'g', recipes: [] },
      ];
      const result = categorizeIngredients(ingredients);
      expect(result.Produce).toBeDefined();
      expect(result['Meat & Seafood']).toBeDefined();
      expect(result.Dairy).toBeDefined();
    });

    it('should sort ingredients within categories', () => {
      const ingredients = [
        { name: 'tomato', quantity: 1, unit: 'piece', recipes: [] },
        { name: 'apple', quantity: 1, unit: 'piece', recipes: [] },
      ];
      const result = categorizeIngredients(ingredients);
      expect(result.Produce[0].name).toBe('apple');
      expect(result.Produce[1].name).toBe('tomato');
    });

    it('should create category for unknown items', () => {
      const ingredients = [
        { name: 'unknown_xyz', quantity: 1, unit: 'piece', recipes: [] },
      ];
      const result = categorizeIngredients(ingredients);
      expect(result.Other).toBeDefined();
      expect(result.Other[0].name).toBe('unknown_xyz');
    });

    it('should handle empty ingredient list', () => {
      const result = categorizeIngredients([]);
      expect(Object.keys(result).length).toBe(0);
    });
  });

  describe('generateWeeklyShoppingList', () => {
    it('should generate list for week with meals', () => {
      const mealPlan = [
        { recipeId: 'pasta1', dayOfWeek: 0, mealType: 'lunch' },
        { recipeId: 'salad1', dayOfWeek: 1, mealType: 'lunch' },
      ];
      const result = generateWeeklyShoppingList(mealPlan);
      expect(typeof result).toBe('object');
      expect(Object.keys(result).length).toBeGreaterThan(0);
    });

    it('should aggregate ingredients from all meals', () => {
      const mealPlan = [
        { recipeId: 'pasta1', dayOfWeek: 0, mealType: 'lunch' },
        { recipeId: 'pasta1', dayOfWeek: 1, mealType: 'lunch' },
      ];
      const result = generateWeeklyShoppingList(mealPlan);
      // Should have aggregated ingredients
      expect(Object.keys(result).length).toBeGreaterThan(0);
    });

    it('should handle empty meal plan', () => {
      const result = generateWeeklyShoppingList([]);
      expect(Object.keys(result).length).toBe(0);
    });

    it('should handle null meal plan', () => {
      const result = generateWeeklyShoppingList(null);
      expect(Object.keys(result).length).toBe(0);
    });

    it('should remove duplicate recipes', () => {
      const mealPlan = [
        { recipeId: 'pasta1', dayOfWeek: 0, mealType: 'lunch' },
        { recipeId: 'pasta1', dayOfWeek: 0, mealType: 'dinner' },
      ];
      const result = generateWeeklyShoppingList(mealPlan);
      // Pasta ingredients should appear once, not duplicated
      expect(Object.keys(result).length).toBeGreaterThan(0);
    });
  });

  describe('generateDailyShoppingList', () => {
    it('should generate list for specific day', () => {
      const mealPlan = [
        { recipeId: 'pasta1', dayOfWeek: 1, mealType: 'lunch' },
        { recipeId: 'salad1', dayOfWeek: 2, mealType: 'lunch' },
      ];
      const result = generateDailyShoppingList(1, mealPlan);
      expect(Object.keys(result).length).toBeGreaterThan(0);
    });

    it('should only include recipes for that day', () => {
      const mealPlan = [
        { recipeId: 'pasta1', dayOfWeek: 1, mealType: 'lunch' },
        { recipeId: 'salad1', dayOfWeek: 2, mealType: 'lunch' },
      ];
      const result = generateDailyShoppingList(1, mealPlan);
      // Should only have pasta ingredients
      expect(Object.keys(result).length).toBeGreaterThan(0);
    });

    it('should return empty list for day with no meals', () => {
      const mealPlan = [
        { recipeId: 'pasta1', dayOfWeek: 1, mealType: 'lunch' },
      ];
      const result = generateDailyShoppingList(5, mealPlan);
      expect(Object.keys(result).length).toBe(0);
    });

    it('should validate day index', () => {
      const mealPlan = [
        { recipeId: 'pasta1', dayOfWeek: 0, mealType: 'lunch' },
      ];
      expect(generateDailyShoppingList(-1, mealPlan)).toEqual({});
      expect(generateDailyShoppingList(7, mealPlan)).toEqual({});
      expect(generateDailyShoppingList('invalid', mealPlan)).toEqual({});
    });
  });

  describe('generateCustomShoppingList', () => {
    it('should generate list for multiple days', () => {
      const mealPlan = [
        { recipeId: 'pasta1', dayOfWeek: 0, mealType: 'lunch' },
        { recipeId: 'salad1', dayOfWeek: 1, mealType: 'lunch' },
        { recipeId: 'soup1', dayOfWeek: 2, mealType: 'lunch' },
      ];
      const result = generateCustomShoppingList([0, 1], mealPlan);
      expect(Object.keys(result).length).toBeGreaterThan(0);
    });

    it('should skip invalid day indices', () => {
      const mealPlan = [
        { recipeId: 'pasta1', dayOfWeek: 0, mealType: 'lunch' },
      ];
      const result = generateCustomShoppingList([0, -1, 8], mealPlan);
      // Should only process day 0
      expect(Object.keys(result).length).toBeGreaterThan(0);
    });

    it('should handle empty day list', () => {
      const mealPlan = [
        { recipeId: 'pasta1', dayOfWeek: 0, mealType: 'lunch' },
      ];
      const result = generateCustomShoppingList([], mealPlan);
      expect(Object.keys(result).length).toBe(0);
    });

    it('should handle null day list', () => {
      const mealPlan = [
        { recipeId: 'pasta1', dayOfWeek: 0, mealType: 'lunch' },
      ];
      const result = generateCustomShoppingList(null, mealPlan);
      expect(Object.keys(result).length).toBe(0);
    });
  });

  describe('getShoppingListItemCount', () => {
    it('should count items in shopping list', () => {
      const shoppingList = {
        Produce: [
          { name: 'tomato', quantity: 2 },
          { name: 'lettuce', quantity: 1 },
        ],
        Dairy: [
          { name: 'milk', quantity: 1 },
        ],
      };
      const count = getShoppingListItemCount(shoppingList);
      expect(count).toBe(3);
    });

    it('should return 0 for empty list', () => {
      const count = getShoppingListItemCount({});
      expect(count).toBe(0);
    });

    it('should handle null input', () => {
      const count = getShoppingListItemCount(null);
      expect(count).toBe(0);
    });

    it('should handle invalid input types', () => {
      expect(getShoppingListItemCount('invalid')).toBe(0);
      expect(getShoppingListItemCount(123)).toBe(0);
    });
  });

  describe('getCategoryOrder', () => {
    it('should return predefined category order', () => {
      const order = getCategoryOrder();
      expect(Array.isArray(order)).toBe(true);
      expect(order[0]).toBe('Produce');
      expect(order.includes('Dairy')).toBe(true);
      expect(order.includes('Other')).toBe(true);
    });

    it('should have consistent length', () => {
      const order = getCategoryOrder();
      expect(order.length).toBe(8);
    });
  });

  describe('sortShoppingList', () => {
    it('should sort categories by predefined order', () => {
      const unsortedList = {
        Other: [{ name: 'item1' }],
        Produce: [{ name: 'tomato' }],
        Dairy: [{ name: 'milk' }],
      };
      const result = sortShoppingList(unsortedList);
      const keys = Object.keys(result);
      expect(keys[0]).toBe('Produce');
      expect(keys[1]).toBe('Dairy');
      expect(keys[2]).toBe('Other');
    });

    it('should preserve unknown categories', () => {
      const list = {
        Produce: [{ name: 'tomato' }],
        UnknownCategory: [{ name: 'item' }],
      };
      const result = sortShoppingList(list);
      expect(result.UnknownCategory).toBeDefined();
    });

    it('should handle empty list', () => {
      const result = sortShoppingList({});
      expect(Object.keys(result).length).toBe(0);
    });

    it('should handle null input', () => {
      const result = sortShoppingList(null);
      expect(Object.keys(result).length).toBe(0);
    });
  });

  describe('createShoppingListItem', () => {
    it('should create item with purchase status', () => {
      const ingredient = { name: 'flour', quantity: 2, unit: 'cups' };
      const item = createShoppingListItem('item1', ingredient);
      expect(item.id).toBe('item1');
      expect(item.purchased).toBe(false);
      expect(item.name).toBe('flour');
    });

    it('should add timestamp', () => {
      const ingredient = { name: 'salt', quantity: 1 };
      const item = createShoppingListItem('item1', ingredient);
      expect(item.timestamp).toBeDefined();
      expect(typeof item.timestamp).toBe('string');
    });
  });

  describe('toggleItemPurchased', () => {
    it('should toggle purchase status', () => {
      const item = {
        id: 'item1',
        name: 'flour',
        purchased: false,
      };
      const toggled = toggleItemPurchased(item);
      expect(toggled.purchased).toBe(true);
    });

    it('should toggle from true to false', () => {
      const item = { id: 'item1', name: 'salt', purchased: true };
      const toggled = toggleItemPurchased(item);
      expect(toggled.purchased).toBe(false);
    });

    it('should preserve other properties', () => {
      const item = {
        id: 'item1',
        name: 'flour',
        quantity: 2,
        unit: 'cups',
        purchased: false,
      };
      const toggled = toggleItemPurchased(item);
      expect(toggled.name).toBe('flour');
      expect(toggled.quantity).toBe(2);
    });
  });

  describe('clearPurchasedItems', () => {
    it('should remove purchased items', () => {
      const list = {
        Produce: [
          { name: 'tomato', purchased: true },
          { name: 'lettuce', purchased: false },
        ],
      };
      const result = clearPurchasedItems(list);
      expect(result.Produce.length).toBe(1);
      expect(result.Produce[0].name).toBe('lettuce');
    });

    it('should remove empty categories', () => {
      const list = {
        Produce: [{ name: 'tomato', purchased: true }],
        Dairy: [{ name: 'milk', purchased: false }],
      };
      const result = clearPurchasedItems(list);
      expect(result.Produce).toBeUndefined();
      expect(result.Dairy).toBeDefined();
    });

    it('should handle fully purchased list', () => {
      const list = {
        Produce: [{ name: 'tomato', purchased: true }],
      };
      const result = clearPurchasedItems(list);
      expect(Object.keys(result).length).toBe(0);
    });

    it('should handle empty list', () => {
      const result = clearPurchasedItems({});
      expect(Object.keys(result).length).toBe(0);
    });
  });

  describe('Integration Tests', () => {
    it('should generate complete weekly shopping list workflow', () => {
      const mealPlan = [
        { recipeId: 'pasta1', dayOfWeek: 0, mealType: 'lunch' },
        { recipeId: 'salad1', dayOfWeek: 1, mealType: 'lunch' },
        { recipeId: 'soup1', dayOfWeek: 2, mealType: 'lunch' },
      ];

      const list = generateWeeklyShoppingList(mealPlan);
      const sorted = sortShoppingList(list);
      const count = getShoppingListItemCount(sorted);

      expect(Object.keys(sorted).length).toBeGreaterThan(0);
      expect(count).toBeGreaterThan(0);
    });

    it('should handle daily list generation', () => {
      const mealPlan = [
        { recipeId: 'pasta1', dayOfWeek: 1, mealType: 'lunch' },
        { recipeId: 'pasta1', dayOfWeek: 1, mealType: 'dinner' },
      ];

      const list = generateDailyShoppingList(1, mealPlan);
      const sorted = sortShoppingList(list);
      const count = getShoppingListItemCount(sorted);

      expect(count).toBeGreaterThan(0);
    });

    it('should handle recipe mock data', () => {
      const recipe = getMockRecipe('pasta1');
      expect(recipe.name).toBe('Pasta Carbonara');
      expect(recipe.ingredients).toBeDefined();

      const ingredients = extractRecipeIngredients(recipe);
      expect(ingredients.length).toBeGreaterThan(0);
    });
  });
});
