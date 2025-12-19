/**
 * Shopping List Service
 * 
 * Core service for generating shopping lists from meal plans.
 * Handles ingredient extraction, aggregation, categorization, and filtering.
 * 
 * @module shoppingListService
 */

import { getWeeklyMealPlan, getMealRecipes, DAYS_OF_WEEK } from './mealPlanningService';

/**
 * Ingredient Category Mappings
 * Maps ingredient names to their categories
 */
const INGREDIENT_CATEGORIES = {
  // Produce
  'tomato': 'Produce',
  'lettuce': 'Produce',
  'cucumber': 'Produce',
  'onion': 'Produce',
  'garlic': 'Produce',
  'carrot': 'Produce',
  'potato': 'Produce',
  'broccoli': 'Produce',
  'spinach': 'Produce',
  'apple': 'Produce',
  'banana': 'Produce',
  'orange': 'Produce',
  'lemon': 'Produce',
  'lime': 'Produce',
  'strawberry': 'Produce',
  'blueberry': 'Produce',
  'peach': 'Produce',
  'bell pepper': 'Produce',
  'mushroom': 'Produce',
  'celery': 'Produce',
  
  // Dairy
  'milk': 'Dairy',
  'cheese': 'Dairy',
  'yogurt': 'Dairy',
  'butter': 'Dairy',
  'cream': 'Dairy',
  'sour cream': 'Dairy',
  'cottage cheese': 'Dairy',
  'mozzarella': 'Dairy',
  'cheddar': 'Dairy',
  'parmesan': 'Dairy',
  'ricotta': 'Dairy',
  'egg': 'Dairy',
  'eggs': 'Dairy',
  
  // Meat & Seafood
  'chicken': 'Meat & Seafood',
  'beef': 'Meat & Seafood',
  'pork': 'Meat & Seafood',
  'fish': 'Meat & Seafood',
  'salmon': 'Meat & Seafood',
  'tuna': 'Meat & Seafood',
  'shrimp': 'Meat & Seafood',
  'bacon': 'Meat & Seafood',
  'ham': 'Meat & Seafood',
  'turkey': 'Meat & Seafood',
  'lamb': 'Meat & Seafood',
  'ground beef': 'Meat & Seafood',
  'ground chicken': 'Meat & Seafood',
  
  // Grains & Pasta
  'flour': 'Grains & Pasta',
  'rice': 'Grains & Pasta',
  'pasta': 'Grains & Pasta',
  'bread': 'Grains & Pasta',
  'cereal': 'Grains & Pasta',
  'oats': 'Grains & Pasta',
  'quinoa': 'Grains & Pasta',
  'wheat': 'Grains & Pasta',
  'tortilla': 'Grains & Pasta',
  'noodles': 'Grains & Pasta',
  
  // Pantry/Dry Goods
  'salt': 'Pantry',
  'sugar': 'Pantry',
  'oil': 'Pantry',
  'olive oil': 'Pantry',
  'soy sauce': 'Pantry',
  'vinegar': 'Pantry',
  'spice': 'Pantry',
  'pepper': 'Pantry',
  'paprika': 'Pantry',
  'cumin': 'Pantry',
  'cinnamon': 'Pantry',
  'vanilla': 'Pantry',
  'baking powder': 'Pantry',
  'baking soda': 'Pantry',
  'bean': 'Pantry',
  'lentil': 'Pantry',
  'peanut': 'Pantry',
  'almond': 'Pantry',
  
  // Condiments & Sauces
  'ketchup': 'Condiments',
  'mustard': 'Condiments',
  'mayonnaise': 'Condiments',
  'salsa': 'Condiments',
  'sauce': 'Condiments',
  'dressing': 'Condiments',
  'jam': 'Condiments',
  'peanut butter': 'Condiments',
  'honey': 'Condiments',
  
  // Beverages
  'juice': 'Beverages',
  'coffee': 'Beverages',
  'tea': 'Beverages',
  'water': 'Beverages',
  'soda': 'Beverages',
  'wine': 'Beverages',
  'beer': 'Beverages',
};

/**
 * Default category for unmatched ingredients
 */
const DEFAULT_CATEGORY = 'Other';

/**
 * Parse ingredient string into structured format
 * Handles formats like "2 cups flour" or "250g chicken"
 * 
 * @param {string} ingredientStr - Ingredient string
 * @returns {Object} { name, quantity, unit, originalString }
 */
export const parseIngredient = (ingredientStr) => {
  if (!ingredientStr || typeof ingredientStr !== 'string') {
    return {
      name: 'Unknown',
      quantity: 1,
      unit: 'piece',
      originalString: '',
    };
  }

  const trimmed = ingredientStr.trim();
  
  // Regex to match quantity and unit
  const quantityMatch = trimmed.match(/^([\d.]+)\s*([a-zA-Z]*)\s+(.+)$/);
  
  if (quantityMatch) {
    const [, quantity, unit, name] = quantityMatch;
    return {
      name: name.toLowerCase().trim(),
      quantity: parseFloat(quantity) || 1,
      unit: unit.toLowerCase().trim() || 'piece',
      originalString: trimmed,
    };
  }

  // If no quantity/unit pattern, treat whole string as ingredient name
  return {
    name: trimmed.toLowerCase(),
    quantity: 1,
    unit: 'piece',
    originalString: trimmed,
  };
};

/**
 * Get category for an ingredient
 * 
 * @param {string} ingredientName - Ingredient name
 * @returns {string} Category name
 */
export const getCategoryForIngredient = (ingredientName) => {
  if (!ingredientName) return DEFAULT_CATEGORY;
  
  const lowerName = ingredientName.toLowerCase();
  
  // Check for exact matches
  if (INGREDIENT_CATEGORIES[lowerName]) {
    return INGREDIENT_CATEGORIES[lowerName];
  }

  // Check for partial matches
  for (const [key, category] of Object.entries(INGREDIENT_CATEGORIES)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      return category;
    }
  }

  return DEFAULT_CATEGORY;
};

/**
 * Get recipes for a specific day
 * 
 * @param {number} dayOfWeek - Day index (0-6)
 * @param {Array} mealPlan - Meal plan array
 * @returns {Array} Recipe IDs for the day
 */
const getRecipesForDay = (dayOfWeek, mealPlan) => {
  const recipes = new Set();
  mealPlan.forEach((meal) => {
    if (meal.dayOfWeek === dayOfWeek) {
      recipes.add(meal.recipeId);
    }
  });
  return Array.from(recipes);
};

/**
 * Generate mock recipe data
 * In production, this would fetch from a recipes database
 * 
 * @param {string} recipeId - Recipe ID
 * @returns {Object} Recipe with ingredients
 */
export const getMockRecipe = (recipeId) => {
  const mockRecipes = {
    'pasta1': {
      id: 'pasta1',
      name: 'Pasta Carbonara',
      ingredients: '400g pasta\n3 eggs\n200g bacon\n100g parmesan\n2 cups heavy cream',
    },
    'salad1': {
      id: 'salad1',
      name: 'Caesar Salad',
      ingredients: '500g lettuce\n2 cups croutons\n200g parmesan\n1 cup dressing',
    },
    'soup1': {
      id: 'soup1',
      name: 'Tomato Soup',
      ingredients: '5 tomatoes\n2 cups vegetable broth\n200ml cream\n1 onion\n2 garlic cloves',
    },
    'chicken1': {
      id: 'chicken1',
      name: 'Grilled Chicken',
      ingredients: '800g chicken breast\n2 tbsp olive oil\n1 lemon\n2 garlic cloves',
    },
  };

  return mockRecipes[recipeId] || {
    id: recipeId,
    name: recipeId,
    ingredients: '',
  };
};

/**
 * Extract ingredients from recipe
 * Parses newline-separated ingredient list
 * 
 * @param {Object} recipe - Recipe object with ingredients string
 * @returns {Array} Parsed ingredients
 */
export const extractRecipeIngredients = (recipe) => {
  if (!recipe || !recipe.ingredients) return [];

  return recipe.ingredients
    .split('\n')
    .map((ingredient) => ingredient.trim())
    .filter((ingredient) => ingredient.length > 0)
    .map((ingredient) => ({
      ...parseIngredient(ingredient),
      recipe: recipe.name || recipe.id,
    }));
};

/**
 * Aggregate ingredients combining quantities
 * Sums quantities of the same ingredient
 * 
 * @param {Array} ingredients - Array of parsed ingredients
 * @returns {Array} Aggregated ingredients with combined quantities
 */
export const aggregateIngredients = (ingredients) => {
  const aggregated = {};

  ingredients.forEach((ingredient) => {
    const key = `${ingredient.name}||${ingredient.unit}`;

    if (aggregated[key]) {
      aggregated[key].quantity += ingredient.quantity;
      aggregated[key].recipes.push(ingredient.recipe);
    } else {
      aggregated[key] = {
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        recipes: [ingredient.recipe],
      };
    }
  });

  return Object.values(aggregated);
};

/**
 * Categorize and sort ingredients
 * 
 * @param {Array} ingredients - Array of aggregated ingredients
 * @returns {Object} Ingredients grouped by category
 */
export const categorizeIngredients = (ingredients) => {
  const categorized = {};

  ingredients.forEach((ingredient) => {
    const category = getCategoryForIngredient(ingredient.name);
    if (!categorized[category]) {
      categorized[category] = [];
    }
    categorized[category].push(ingredient);
  });

  // Sort ingredients within each category
  Object.keys(categorized).forEach((category) => {
    categorized[category].sort((a, b) => a.name.localeCompare(b.name));
  });

  return categorized;
};

/**
 * Generate shopping list for entire week
 * 
 * @param {Array} mealPlan - Meal plan array from AsyncStorage
 * @returns {Object} Weekly shopping list organized by category
 */
export const generateWeeklyShoppingList = (mealPlan) => {
  if (!mealPlan || mealPlan.length === 0) {
    return {};
  }

  const allIngredients = [];

  // Extract unique recipes
  const uniqueRecipes = new Set(mealPlan.map((meal) => meal.recipeId));

  // Extract ingredients from all recipes
  uniqueRecipes.forEach((recipeId) => {
    const recipe = getMockRecipe(recipeId);
    const ingredients = extractRecipeIngredients(recipe);
    allIngredients.push(...ingredients);
  });

  // Aggregate and categorize
  const aggregated = aggregateIngredients(allIngredients);
  return categorizeIngredients(aggregated);
};

/**
 * Generate shopping list for a specific day
 * 
 * @param {number} dayOfWeek - Day index (0-6)
 * @param {Array} mealPlan - Meal plan array
 * @returns {Object} Daily shopping list organized by category
 */
export const generateDailyShoppingList = (dayOfWeek, mealPlan) => {
  if (!mealPlan || !Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    return {};
  }

  const allIngredients = [];
  const recipesForDay = getRecipesForDay(dayOfWeek, mealPlan);

  // Extract ingredients from day's recipes
  recipesForDay.forEach((recipeId) => {
    const recipe = getMockRecipe(recipeId);
    const ingredients = extractRecipeIngredients(recipe);
    allIngredients.push(...ingredients);
  });

  // Aggregate and categorize
  if (allIngredients.length === 0) return {};
  const aggregated = aggregateIngredients(allIngredients);
  return categorizeIngredients(aggregated);
};

/**
 * Generate shopping list for a specific day range
 * 
 * @param {Array<number>} dayIndices - Array of day indices (0-6)
 * @param {Array} mealPlan - Meal plan array
 * @returns {Object} Shopping list for selected days
 */
export const generateCustomShoppingList = (dayIndices, mealPlan) => {
  if (!dayIndices || !Array.isArray(dayIndices) || dayIndices.length === 0) {
    return {};
  }

  const allIngredients = [];

  // Extract ingredients from selected days
  dayIndices.forEach((dayOfWeek) => {
    if (Number.isInteger(dayOfWeek) && dayOfWeek >= 0 && dayOfWeek <= 6) {
      const recipesForDay = getRecipesForDay(dayOfWeek, mealPlan);
      recipesForDay.forEach((recipeId) => {
        const recipe = getMockRecipe(recipeId);
        const ingredients = extractRecipeIngredients(recipe);
        allIngredients.push(...ingredients);
      });
    }
  });

  if (allIngredients.length === 0) return {};
  const aggregated = aggregateIngredients(allIngredients);
  return categorizeIngredients(aggregated);
};

/**
 * Get total item count in shopping list
 * 
 * @param {Object} shoppingList - Categorized shopping list
 * @returns {number} Total number of unique ingredients
 */
export const getShoppingListItemCount = (shoppingList) => {
  if (!shoppingList || typeof shoppingList !== 'object') {
    return 0;
  }

  let count = 0;
  Object.values(shoppingList).forEach((items) => {
    if (Array.isArray(items)) {
      count += items.length;
    }
  });

  return count;
};

/**
 * Get category order for display
 * Returns predefined order for consistent UI
 * 
 * @returns {Array} Ordered category names
 */
export const getCategoryOrder = () => {
  return [
    'Produce',
    'Meat & Seafood',
    'Dairy',
    'Grains & Pasta',
    'Pantry',
    'Condiments',
    'Beverages',
    'Other',
  ];
};

/**
 * Sort shopping list by category order
 * 
 * @param {Object} shoppingList - Categorized shopping list
 * @returns {Object} Sorted shopping list
 */
export const sortShoppingList = (shoppingList) => {
  if (!shoppingList || typeof shoppingList !== 'object') {
    return {};
  }

  const categoryOrder = getCategoryOrder();
  const sorted = {};

  categoryOrder.forEach((category) => {
    if (shoppingList[category]) {
      sorted[category] = shoppingList[category];
    }
  });

  // Add any categories not in predefined order
  Object.keys(shoppingList).forEach((category) => {
    if (!sorted[category]) {
      sorted[category] = shoppingList[category];
    }
  });

  return sorted;
};

/**
 * Create a shopping list item with checkbox state
 * 
 * @param {string} id - Unique ID for item
 * @param {Object} ingredient - Ingredient object
 * @returns {Object} Shopping list item
 */
export const createShoppingListItem = (id, ingredient) => {
  return {
    id,
    ...ingredient,
    purchased: false,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Toggle purchase status of shopping list item
 * 
 * @param {Object} item - Shopping list item
 * @returns {Object} Updated item with toggled status
 */
export const toggleItemPurchased = (item) => {
  return {
    ...item,
    purchased: !item.purchased,
  };
};

/**
 * Clear all purchased items from shopping list
 * 
 * @param {Object} shoppingList - Categorized shopping list
 * @returns {Object} Shopping list without purchased items
 */
export const clearPurchasedItems = (shoppingList) => {
  const cleared = {};

  Object.entries(shoppingList).forEach(([category, items]) => {
    const unpurchased = items.filter((item) => !item.purchased);
    if (unpurchased.length > 0) {
      cleared[category] = unpurchased;
    }
  });

  return cleared;
};

export default {
  parseIngredient,
  getCategoryForIngredient,
  getMockRecipe,
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
  INGREDIENT_CATEGORIES,
  DEFAULT_CATEGORY,
};
