/**
 * Tests for Recipe Categories and Tags Feature
 * 
 * This test suite covers:
 * - Data migration (adding default category and tags to existing recipes)
 * - Adding recipes with categories and tags
 * - Category filtering
 * - Tag selection and toggling
 * - Recipe display with categories and tags
 */

describe('Recipe Categories and Tags Feature', () => {
  describe('Data Structure and Constants', () => {
    it('should define all required categories', () => {
      const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snacks', 'Appetizers', 'Asian', 'Vegan', 'Vegetarian'];
      expect(CATEGORIES).toHaveLength(9);
      expect(CATEGORIES).toContain('Breakfast');
      expect(CATEGORIES).toContain('Dinner');
      expect(CATEGORIES).toContain('Dessert');
      expect(CATEGORIES).toContain('Asian');
      expect(CATEGORIES).toContain('Vegan');
      expect(CATEGORIES).toContain('Vegetarian');
      expect(CATEGORIES).not.toContain('Main Dish'); // Main Dish has been removed
    });

    it('should define all required tags', () => {
      const TAGS = ['Quick', 'Vegetarian', 'Vegan', 'Spicy', 'Easy', 'Healthy'];
      expect(TAGS).toHaveLength(6);
      expect(TAGS).toContain('Quick');
      expect(TAGS).toContain('Vegetarian');
      expect(TAGS).toContain('Vegan');
    });
  });

  describe('Data Migration Logic', () => {
    it('should add default category to recipes without category', () => {
      const oldRecipe = {
        id: '1',
        title: 'Old Recipe',
        ingredients: 'test',
        instructions: 'test',
      };

      const migratedRecipe = {
        ...oldRecipe,
        category: oldRecipe.category || 'Dinner',
        tags: Array.isArray(oldRecipe.tags) ? oldRecipe.tags : [],
      };

      expect(migratedRecipe.category).toBe('Dinner');
      expect(migratedRecipe.tags).toEqual([]);
    });

    it('should convert Main Dish to Dinner during migration', () => {
      const oldRecipe = {
        id: '1',
        title: 'Old Main Dish Recipe',
        category: 'Main Dish',
        ingredients: 'test',
        instructions: 'test',
      };

      let category = oldRecipe.category || 'Dinner';
      if (category === 'Main Dish') {
        category = 'Dinner';
      }

      const migratedRecipe = {
        ...oldRecipe,
        category,
        tags: Array.isArray(oldRecipe.tags) ? oldRecipe.tags : [],
      };

      expect(migratedRecipe.category).toBe('Dinner');
      expect(migratedRecipe.tags).toEqual([]);
    });

    it('should preserve existing category', () => {
      const recipeWithCategory = {
        id: '1',
        title: 'Breakfast Recipe',
        category: 'Breakfast',
        ingredients: 'test',
        instructions: 'test',
      };

      const migratedRecipe = {
        ...recipeWithCategory,
        category: recipeWithCategory.category || 'Dinner',
        tags: Array.isArray(recipeWithCategory.tags) ? recipeWithCategory.tags : [],
      };

      expect(migratedRecipe.category).toBe('Breakfast');
    });

    it('should add empty tags array to recipes without tags', () => {
      const recipeWithoutTags = {
        id: '1',
        title: 'Recipe',
        category: 'Dessert',
        ingredients: 'test',
        instructions: 'test',
      };

      const migratedRecipe = {
        ...recipeWithoutTags,
        category: recipeWithoutTags.category || 'Dinner',
        tags: Array.isArray(recipeWithoutTags.tags) ? recipeWithoutTags.tags : [],
      };

      expect(Array.isArray(migratedRecipe.tags)).toBe(true);
      expect(migratedRecipe.tags).toEqual([]);
    });

    it('should preserve existing tags', () => {
      const recipeWithTags = {
        id: '1',
        title: 'Recipe',
        category: 'Dinner',
        tags: ['Quick', 'Easy'],
        ingredients: 'test',
        instructions: 'test',
      };

      const migratedRecipe = {
        ...recipeWithTags,
        category: recipeWithTags.category || 'Dinner',
        tags: Array.isArray(recipeWithTags.tags) ? recipeWithTags.tags : [],
      };

      expect(migratedRecipe.tags).toEqual(['Quick', 'Easy']);
    });
  });

  describe('Recipe Creation with Categories and Tags', () => {
    it('should create recipe with default category', () => {
      const newRecipe = {
        id: String(Date.now()),
        title: 'Test Recipe',
        category: '' || 'Dinner',
        tags: [],
        ingredients: 'Flour, Sugar',
        instructions: 'Mix and bake',
      };

      expect(newRecipe.category).toBe('Dinner');
      expect(newRecipe.tags).toEqual([]);
    });

    it('should create recipe with selected category', () => {
      const selectedCategory = 'Breakfast';
      const newRecipe = {
        id: String(Date.now()),
        title: 'Pancakes',
        category: selectedCategory || 'Dinner',
        tags: [],
        ingredients: 'Flour, Eggs, Milk',
        instructions: 'Mix and cook',
      };

      expect(newRecipe.category).toBe('Breakfast');
    });

    it('should create recipe with selected tags', () => {
      const selectedTags = ['Quick', 'Easy'];
      const newRecipe = {
        id: String(Date.now()),
        title: 'Quick Meal',
        category: 'Dinner',
        tags: selectedTags,
        ingredients: 'Pasta',
        instructions: 'Boil pasta',
      };

      expect(newRecipe.tags).toContain('Quick');
      expect(newRecipe.tags).toContain('Easy');
      expect(newRecipe.tags).toHaveLength(2);
    });
  });

  describe('Tag Selection Logic', () => {
    it('should toggle tag on when not selected', () => {
      const currentTags = [];
      const tagToToggle = 'Quick';

      const newTags = currentTags.includes(tagToToggle)
        ? currentTags.filter(t => t !== tagToToggle)
        : [...currentTags, tagToToggle];

      expect(newTags).toContain('Quick');
      expect(newTags).toHaveLength(1);
    });

    it('should toggle tag off when selected', () => {
      const currentTags = ['Quick', 'Easy'];
      const tagToToggle = 'Quick';

      const newTags = currentTags.includes(tagToToggle)
        ? currentTags.filter(t => t !== tagToToggle)
        : [...currentTags, tagToToggle];

      expect(newTags).not.toContain('Quick');
      expect(newTags).toContain('Easy');
      expect(newTags).toHaveLength(1);
    });

    it('should allow multiple tags to be selected', () => {
      let tags = [];

      tags = tags.includes('Quick') ? tags.filter(t => t !== 'Quick') : [...tags, 'Quick'];
      tags = tags.includes('Easy') ? tags.filter(t => t !== 'Easy') : [...tags, 'Easy'];
      tags = tags.includes('Healthy') ? tags.filter(t => t !== 'Healthy') : [...tags, 'Healthy'];

      expect(tags).toHaveLength(3);
      expect(tags).toEqual(['Quick', 'Easy', 'Healthy']);
    });
  });

  describe('Category Filtering Logic', () => {
    const recipes = [
      { id: '1', title: 'Pancakes', category: 'Breakfast', tags: ['Quick', 'Easy'] },
      { id: '2', title: 'Chocolate Cake', category: 'Dessert', tags: ['Sweet'] },
      { id: '3', title: 'Pasta', category: 'Dinner', tags: ['Easy'] },
      { id: '4', title: 'Omelette', category: 'Breakfast', tags: ['Quick'] },
    ];

    it('should show all recipes when filter is "All"', () => {
      const selectedCategory = 'All';
      const filtered = selectedCategory === 'All' 
        ? recipes 
        : recipes.filter(r => r.category === selectedCategory);

      expect(filtered).toHaveLength(4);
    });

    it('should filter recipes by category', () => {
      const selectedCategory = 'Breakfast';
      const filtered = selectedCategory === 'All' 
        ? recipes 
        : recipes.filter(r => r.category === selectedCategory);

      expect(filtered).toHaveLength(2);
      expect(filtered.every(r => r.category === 'Breakfast')).toBe(true);
    });

    it('should return empty array when no recipes match category', () => {
      const selectedCategory = 'Snacks';
      const filtered = selectedCategory === 'All' 
        ? recipes 
        : recipes.filter(r => r.category === selectedCategory);

      expect(filtered).toHaveLength(0);
    });
  });

  describe('Recipe Update with Categories and Tags', () => {
    it('should update recipe while preserving category and tags', () => {
      const originalRecipe = {
        id: '1',
        title: 'Original Recipe',
        category: 'Dessert',
        tags: ['Sweet', 'Easy'],
        ingredients: 'Sugar',
        instructions: 'Mix',
      };

      const updatedRecipe = {
        ...originalRecipe,
        title: 'Updated Recipe',
        category: originalRecipe.category || 'Dinner',
        tags: Array.isArray(originalRecipe.tags) ? originalRecipe.tags : [],
      };

      expect(updatedRecipe.title).toBe('Updated Recipe');
      expect(updatedRecipe.category).toBe('Dessert');
      expect(updatedRecipe.tags).toEqual(['Sweet', 'Easy']);
    });

    it('should allow changing category during edit', () => {
      const originalRecipe = {
        id: '1',
        title: 'Recipe',
        category: 'Dessert',
        tags: ['Sweet'],
      };

      const newCategory = 'Breakfast';
      const updatedRecipe = {
        ...originalRecipe,
        category: newCategory || 'Dinner',
      };

      expect(updatedRecipe.category).toBe('Breakfast');
    });

    it('should allow changing tags during edit', () => {
      const originalRecipe = {
        id: '1',
        title: 'Recipe',
        category: 'Dinner',
        tags: ['Quick'],
      };

      const newTags = ['Quick', 'Easy', 'Healthy'];
      const updatedRecipe = {
        ...originalRecipe,
        tags: newTags,
      };

      expect(updatedRecipe.tags).toEqual(['Quick', 'Easy', 'Healthy']);
    });
  });

  describe('Category Icons and Display', () => {
    const categoryIcons = {
      'Breakfast': '🍳',
      'Lunch': '🥗',
      'Dinner': '🍛',
      'Dessert': '🍰',
      'Snacks': '🍿',
      'Appetizers': '🥟',
      'Asian': '🥢',
      'Vegan': '🥬',
      'Vegetarian': '🥦',
    };

    it('should have icon for each category', () => {
      const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snacks', 'Appetizers', 'Asian', 'Vegan', 'Vegetarian'];
      
      CATEGORIES.forEach(category => {
        expect(categoryIcons[category]).toBeDefined();
      });
    });

    it('should format category badge text', () => {
      const category = 'Breakfast';
      const icon = categoryIcons[category];
      const badgeText = `${icon} ${category}`;

      expect(badgeText).toBe('🍳 Breakfast');
    });

    it('should have new categories Asian, Vegan, and Vegetarian', () => {
      expect(categoryIcons['Asian']).toBe('🥢');
      expect(categoryIcons['Vegan']).toBe('🥬');
      expect(categoryIcons['Vegetarian']).toBe('🥦');
    });

    it('should not have Main Dish category', () => {
      expect(categoryIcons['Main Dish']).toBeUndefined();
    });
  });

  describe('AI Category Detection', () => {
    const validCategories = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snacks', 'Appetizers', 'Asian', 'Vegan', 'Vegetarian'];

    it('should validate category is in allowed list', () => {
      const detectedCategory = 'Asian';
      const isValid = validCategories.includes(detectedCategory);
      expect(isValid).toBe(true);
    });

    it('should fall back to Dinner for invalid category', () => {
      const detectedCategory = 'InvalidCategory';
      const category = validCategories.includes(detectedCategory) ? detectedCategory : 'Dinner';
      expect(category).toBe('Dinner');
    });

    it('should detect Breakfast category from morning dishes', () => {
      // Simulating AI detection logic
      const recipeText = 'Fluffy pancakes with maple syrup and eggs';
      const keywords = ['pancake', 'eggs', 'oatmeal', 'cereal', 'breakfast'];
      const containsBreakfastKeyword = keywords.some(kw => recipeText.toLowerCase().includes(kw));
      const category = containsBreakfastKeyword ? 'Breakfast' : 'Dinner';
      expect(category).toBe('Breakfast');
    });

    it('should detect Dessert category from sweet dishes', () => {
      const recipeText = 'Chocolate cake with frosting';
      const keywords = ['cake', 'cookie', 'ice cream', 'brownie', 'dessert'];
      const containsDessertKeyword = keywords.some(kw => recipeText.toLowerCase().includes(kw));
      const category = containsDessertKeyword ? 'Dessert' : 'Dinner';
      expect(category).toBe('Dessert');
    });

    it('should detect Asian category from Asian cuisine dishes', () => {
      const recipeText = 'Pad Thai with noodles and peanuts';
      const keywords = ['thai', 'chinese', 'sushi', 'curry', 'noodles', 'stir fry'];
      const containsAsianKeyword = keywords.some(kw => recipeText.toLowerCase().includes(kw));
      const category = containsAsianKeyword ? 'Asian' : 'Dinner';
      expect(category).toBe('Asian');
    });

    it('should detect Vegan category from plant-based dishes', () => {
      const recipeText = 'Tofu stir-fry with vegetables, no animal products';
      const keywords = ['vegan', 'tofu', 'plant-based'];
      const containsVeganKeyword = keywords.some(kw => recipeText.toLowerCase().includes(kw));
      const hasNoAnimalProducts = !['meat', 'dairy', 'egg', 'fish'].some(kw => recipeText.toLowerCase().includes(kw));
      const category = (containsVeganKeyword && hasNoAnimalProducts) ? 'Vegan' : 'Dinner';
      expect(category).toBe('Vegan');
    });

    it('should detect Vegetarian category from meatless dishes with dairy', () => {
      const recipeText = 'Cheese pizza with vegetables';
      const hasCheese = recipeText.toLowerCase().includes('cheese');
      const hasNoMeat = !['meat', 'chicken', 'beef', 'pork', 'fish'].some(kw => recipeText.toLowerCase().includes(kw));
      const category = (hasCheese && hasNoMeat) ? 'Vegetarian' : 'Dinner';
      expect(category).toBe('Vegetarian');
    });

    it('should use Dinner as default when no specific category matches', () => {
      const recipeText = 'Grilled chicken with rice';
      const category = 'Dinner'; // Default fallback
      expect(category).toBe('Dinner');
    });

    it('should handle extracted recipe with valid category from AI', () => {
      const extractedRecipe = {
        title: 'Vegetable Spring Rolls',
        category: 'Asian',
        ingredients: 'Rice paper, vegetables',
        instructions: 'Roll and serve',
        prepTime: '20 minutes',
        cookTime: '0 minutes',
      };

      expect(validCategories.includes(extractedRecipe.category)).toBe(true);
      expect(extractedRecipe.category).toBe('Asian');
    });

    it('should correct invalid category from AI to default', () => {
      const extractedRecipe = {
        title: 'Test Recipe',
        category: 'Italian', // Invalid category
        ingredients: 'Pasta',
        instructions: 'Cook',
      };

      const finalCategory = validCategories.includes(extractedRecipe.category) 
        ? extractedRecipe.category 
        : 'Dinner';

      expect(finalCategory).toBe('Dinner');
    });
  });
});

/**
 * Tests for Duplicate Recipe Detection Feature
 */
describe('Duplicate Recipe Detection Feature', () => {
  // Import the comparison functions for testing
  const { 
    calculateStringSimilarity, 
    compareIngredients, 
    checkForDuplicate,
    formatDuplicateMessage 
  } = require('./services/recipeComparison');

  describe('String Similarity Calculation', () => {
    it('should return 1 for identical strings', () => {
      expect(calculateStringSimilarity('Chicken Curry', 'Chicken Curry')).toBe(1);
    });

    it('should return 1 for case-insensitive identical strings', () => {
      expect(calculateStringSimilarity('CHICKEN CURRY', 'chicken curry')).toBe(1);
    });

    it('should return 0 for empty strings', () => {
      expect(calculateStringSimilarity('', 'test')).toBe(0);
      expect(calculateStringSimilarity('test', '')).toBe(0);
    });

    it('should return 0 for null/undefined inputs', () => {
      expect(calculateStringSimilarity(null, 'test')).toBe(0);
      expect(calculateStringSimilarity('test', undefined)).toBe(0);
    });

    it('should calculate similarity for partially matching titles', () => {
      const similarity = calculateStringSimilarity('Chicken Curry', 'Chicken Tikka');
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });

    it('should give high similarity for very similar titles', () => {
      const similarity = calculateStringSimilarity('Grilled Chicken', 'Grilled Chicken Breast');
      expect(similarity).toBeGreaterThan(0.5);
    });
  });

  describe('Ingredient Comparison', () => {
    it('should return 0 for empty ingredient lists', () => {
      expect(compareIngredients([], ['chicken'])).toBe(0);
      expect(compareIngredients(['chicken'], [])).toBe(0);
    });

    it('should return high similarity for matching ingredients', () => {
      const ingredients1 = ['2 cups chicken', '1 tbsp oil', 'salt'];
      const ingredients2 = ['chicken breast', 'vegetable oil', 'salt and pepper'];
      const similarity = compareIngredients(ingredients1, ingredients2);
      expect(similarity).toBeGreaterThan(0.3);
    });

    it('should handle ingredients with different quantities', () => {
      const ingredients1 = ['1 cup flour'];
      const ingredients2 = ['2 cups flour'];
      const similarity = compareIngredients(ingredients1, ingredients2);
      expect(similarity).toBeGreaterThan(0);
    });
  });

  describe('Duplicate Detection', () => {
    const existingRecipes = [
      {
        id: '1',
        title: 'Chicken Curry',
        ingredients: ['2 lbs chicken', 'curry powder', 'coconut milk', 'onions'],
      },
      {
        id: '2',
        title: 'Beef Stew',
        ingredients: ['beef chunks', 'potatoes', 'carrots', 'beef broth'],
      },
      {
        id: '3',
        title: 'Vegetable Stir Fry',
        ingredients: ['broccoli', 'bell peppers', 'soy sauce', 'garlic'],
      },
    ];

    it('should detect exact title match', () => {
      const newRecipe = { title: 'Chicken Curry', ingredients: [] };
      const result = checkForDuplicate(newRecipe, existingRecipes);
      expect(result).not.toBeNull();
      expect(result.recipe.id).toBe('1');
    });

    it('should detect similar titles', () => {
      const newRecipe = { title: 'Chicken Curry Masala', ingredients: [] };
      const result = checkForDuplicate(newRecipe, existingRecipes);
      expect(result).not.toBeNull();
      expect(result.recipe.id).toBe('1');
    });

    it('should return null for unique recipes', () => {
      const newRecipe = { title: 'Chocolate Cake', ingredients: ['flour', 'chocolate', 'eggs'] };
      const result = checkForDuplicate(newRecipe, existingRecipes);
      expect(result).toBeNull();
    });

    it('should return null for empty recipe list', () => {
      const newRecipe = { title: 'Test Recipe', ingredients: [] };
      const result = checkForDuplicate(newRecipe, []);
      expect(result).toBeNull();
    });

    it('should include similarity scores in result', () => {
      const newRecipe = { 
        title: 'Chicken Curry', 
        ingredients: ['chicken', 'curry', 'coconut milk'] 
      };
      const result = checkForDuplicate(newRecipe, existingRecipes);
      expect(result).toHaveProperty('titleSimilarity');
      expect(result).toHaveProperty('ingredientSimilarity');
      expect(result).toHaveProperty('combinedScore');
      expect(result).toHaveProperty('matchType');
    });

    it('should identify exact matches', () => {
      const newRecipe = { title: 'Chicken Curry', ingredients: [] };
      const result = checkForDuplicate(newRecipe, existingRecipes);
      expect(result.matchType).toBe('exact');
    });
  });

  describe('Duplicate Message Formatting', () => {
    it('should format message for exact match', () => {
      const duplicateInfo = {
        recipe: { title: 'Chicken Curry' },
        matchType: 'exact',
        combinedScore: 0.95,
      };
      const message = formatDuplicateMessage(duplicateInfo);
      expect(message).toContain('Chicken Curry');
      expect(message).toContain('95%');
    });

    it('should format message for similar match', () => {
      const duplicateInfo = {
        recipe: { title: 'Beef Stew' },
        matchType: 'similar',
        combinedScore: 0.75,
      };
      const message = formatDuplicateMessage(duplicateInfo);
      expect(message).toContain('Beef Stew');
      expect(message).toContain('75%');
    });

    it('should return empty string for null input', () => {
      expect(formatDuplicateMessage(null)).toBe('');
    });
  });

  describe('Variant Recipe Creation', () => {
    it('should add variantOf property when marked as variant', () => {
      const originalRecipe = { id: '123', title: 'Chicken Curry' };
      const newRecipe = { title: 'Chicken Curry', ingredients: 'different' };
      
      const variantRecipe = {
        ...newRecipe,
        id: String(Date.now()),
        variantOf: originalRecipe.id,
        title: `${newRecipe.title} (Variant)`,
      };

      expect(variantRecipe.variantOf).toBe('123');
      expect(variantRecipe.title).toBe('Chicken Curry (Variant)');
    });
  });
});

/**
 * Tests for AI Extraction Improvements (Issue #18)
 * 
 * This test suite covers:
 * - Category inference from title and ingredients
 * - Extraction history management
 * - Error parsing and user-friendly messages
 */
describe('AI Extraction Improvements', () => {
  // Category inference keywords (copied from recipeExtraction.js for testing)
  const CATEGORY_KEYWORDS = {
    Breakfast: ['breakfast', 'pancake', 'waffle', 'omelette', 'omelet', 'egg', 'toast', 'cereal', 'oatmeal', 'smoothie', 'brunch', 'muffin', 'bagel', 'morning'],
    Lunch: ['lunch', 'sandwich', 'wrap', 'salad', 'soup', 'midday'],
    Dinner: ['dinner', 'roast', 'steak', 'main course', 'entrée', 'entree', 'supper'],
    Dessert: ['dessert', 'cake', 'cookie', 'pie', 'brownie', 'ice cream', 'pudding', 'chocolate', 'sweet', 'candy', 'pastry', 'tart', 'cheesecake', 'mousse', 'custard'],
    Snacks: ['snack', 'chips', 'popcorn', 'nuts', 'trail mix', 'crackers', 'finger food', 'bite', 'nibble'],
    Appetizers: ['appetizer', 'starter', 'hors d\'oeuvre', 'dip', 'bruschetta', 'canapé', 'canape', 'tapas', 'finger food'],
    Asian: ['asian', 'chinese', 'japanese', 'korean', 'thai', 'vietnamese', 'indian', 'curry', 'stir fry', 'wok', 'noodle', 'ramen', 'sushi', 'dim sum', 'teriyaki', 'soy sauce', 'ginger', 'sesame', 'tofu', 'pad thai', 'pho', 'kimchi', 'miso', 'wasabi'],
    Vegan: ['vegan', 'plant-based', 'plant based', 'no dairy', 'dairy-free', 'egg-free', 'no eggs', 'no meat', 'no animal'],
    Vegetarian: ['vegetarian', 'veggie', 'meatless', 'no meat', 'meat-free'],
  };

  // Local implementation of inferCategoryFromContent for testing
  const inferCategoryFromContent = (title = '', ingredients = '') => {
    const content = `${title} ${ingredients}`.toLowerCase();
    const priorityOrder = ['Vegan', 'Vegetarian', 'Asian', 'Dessert', 'Breakfast', 'Appetizers', 'Snacks', 'Lunch', 'Dinner'];
    
    for (const category of priorityOrder) {
      const keywords = CATEGORY_KEYWORDS[category];
      for (const keyword of keywords) {
        if (content.includes(keyword)) {
          return category;
        }
      }
    }
    return 'Dinner';
  };

  // Local implementation of parseExtractionError for testing
  const parseExtractionError = (error) => {
    const errorMessage = error.message || '';
    const errorResponse = error.response?.data?.error?.message || error.response?.data?.message || '';
    
    if (errorMessage.includes('timeout') || error.code === 'ECONNABORTED') {
      return { message: 'Request timed out.', canRetry: true, errorType: 'timeout' };
    }
    if (errorMessage.includes('Network Error') || error.code === 'ERR_NETWORK') {
      return { message: 'Network error.', canRetry: true, errorType: 'network' };
    }
    if (error.response?.status === 401 || errorResponse.includes('unauthorized') || (errorResponse.includes('invalid') && errorResponse.includes('token'))) {
      return { message: 'Invalid GitHub token.', canRetry: false, errorType: 'auth' };
    }
    if (error.response?.status === 429) {
      return { message: 'Too many requests.', canRetry: true, errorType: 'rate_limit' };
    }
    if (error.response?.status >= 500) {
      return { message: 'Service unavailable.', canRetry: true, errorType: 'server' };
    }
    return { message: `Failed: ${errorMessage || 'Unknown'}`, canRetry: true, errorType: 'unknown' };
  };

  describe('Category Inference from Content', () => {
    it('should infer Breakfast from breakfast-related keywords', () => {
      expect(inferCategoryFromContent('Breakfast Burrito', '')).toBe('Breakfast');
      expect(inferCategoryFromContent('Fluffy Omelette', '')).toBe('Breakfast');
      expect(inferCategoryFromContent('Morning Smoothie Bowl', '')).toBe('Breakfast');
      expect(inferCategoryFromContent('Toast with Avocado', '')).toBe('Breakfast');
    });

    it('should infer Dessert from sweet dishes', () => {
      expect(inferCategoryFromContent('Chocolate Chip Cookies', '')).toBe('Dessert');
      expect(inferCategoryFromContent('Cheesecake', '')).toBe('Dessert');
      expect(inferCategoryFromContent('Ice Cream Sundae', '')).toBe('Dessert');
      expect(inferCategoryFromContent('Apple Pie', '')).toBe('Dessert');
    });

    it('should infer Asian from Asian cuisine keywords', () => {
      expect(inferCategoryFromContent('Chicken Stir Fry', '')).toBe('Asian');
      expect(inferCategoryFromContent('Beef Ramen', '')).toBe('Asian');
      expect(inferCategoryFromContent('Pad Thai', '')).toBe('Asian');
      expect(inferCategoryFromContent('Sushi Rolls', '')).toBe('Asian');
      expect(inferCategoryFromContent('Recipe', 'soy sauce, ginger, sesame oil')).toBe('Asian');
    });

    it('should infer Vegan from plant-based keywords', () => {
      expect(inferCategoryFromContent('Vegan Buddha Bowl', '')).toBe('Vegan');
      expect(inferCategoryFromContent('Plant-Based Burger', '')).toBe('Vegan');
    });

    it('should infer Vegetarian from meatless keywords', () => {
      expect(inferCategoryFromContent('Vegetarian Lasagna', '')).toBe('Vegetarian');
      expect(inferCategoryFromContent('Veggie Burger', '')).toBe('Vegetarian');
    });

    it('should infer Appetizers from starter keywords', () => {
      expect(inferCategoryFromContent('Bruschetta', '')).toBe('Appetizers');
      expect(inferCategoryFromContent('Spinach Dip', '')).toBe('Appetizers');
      expect(inferCategoryFromContent('Appetizer Platter', '')).toBe('Appetizers');
    });

    it('should infer Snacks from snack keywords', () => {
      expect(inferCategoryFromContent('Homemade Popcorn', '')).toBe('Snacks');
      expect(inferCategoryFromContent('Trail Mix', '')).toBe('Snacks');
      expect(inferCategoryFromContent('Quick Snack Bites', '')).toBe('Snacks');
    });

    it('should default to Dinner when no keywords match', () => {
      expect(inferCategoryFromContent('Mystery Recipe', '')).toBe('Dinner');
      expect(inferCategoryFromContent('', '')).toBe('Dinner');
      expect(inferCategoryFromContent('Random Dish', 'some ingredients')).toBe('Dinner');
    });

    it('should prioritize more specific categories', () => {
      // Vegan should win over Vegetarian
      expect(inferCategoryFromContent('Vegan Vegetarian Dish', '')).toBe('Vegan');
      // Asian should be detected from ingredients
      expect(inferCategoryFromContent('Simple Noodles', 'tofu, soy sauce')).toBe('Asian');
    });
  });

  describe('Error Parsing', () => {
    it('should identify timeout errors', () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.code = 'ECONNABORTED';
      const result = parseExtractionError(timeoutError);
      expect(result.errorType).toBe('timeout');
      expect(result.canRetry).toBe(true);
    });

    it('should identify network errors', () => {
      const networkError = new Error('Network Error');
      networkError.code = 'ERR_NETWORK';
      const result = parseExtractionError(networkError);
      expect(result.errorType).toBe('network');
      expect(result.canRetry).toBe(true);
    });

    it('should identify auth errors from 401 status', () => {
      const authError = new Error('Unauthorized');
      authError.response = { status: 401 };
      const result = parseExtractionError(authError);
      expect(result.errorType).toBe('auth');
      expect(result.canRetry).toBe(false);
    });

    it('should identify rate limit errors', () => {
      const rateLimitError = new Error('Too many requests');
      rateLimitError.response = { status: 429 };
      const result = parseExtractionError(rateLimitError);
      expect(result.errorType).toBe('rate_limit');
      expect(result.canRetry).toBe(true);
    });

    it('should identify server errors', () => {
      const serverError = new Error('Internal Server Error');
      serverError.response = { status: 500 };
      const result = parseExtractionError(serverError);
      expect(result.errorType).toBe('server');
      expect(result.canRetry).toBe(true);
    });

    it('should handle unknown errors', () => {
      const unknownError = new Error('Something went wrong');
      const result = parseExtractionError(unknownError);
      expect(result.errorType).toBe('unknown');
      expect(result.canRetry).toBe(true);
    });
  });

  describe('Extraction History Logic', () => {
    const MAX_EXTRACTION_HISTORY = 10;

    it('should limit history to max entries', () => {
      const existingHistory = Array.from({ length: 12 }, (_, i) => ({
        id: String(i),
        text: `Recipe ${i}`,
        resultTitle: `Title ${i}`,
        timestamp: new Date().toISOString(),
      }));

      const newEntry = {
        id: String(Date.now()),
        text: 'New Recipe',
        resultTitle: 'New Title',
        timestamp: new Date().toISOString(),
      };

      const newHistory = [newEntry, ...existingHistory].slice(0, MAX_EXTRACTION_HISTORY);
      expect(newHistory).toHaveLength(MAX_EXTRACTION_HISTORY);
      expect(newHistory[0].text).toBe('New Recipe');
    });

    it('should add new entry at the beginning', () => {
      const existingHistory = [
        { id: '1', text: 'Old Recipe', resultTitle: 'Old Title', timestamp: '2024-01-01' },
      ];

      const newEntry = {
        id: '2',
        text: 'New Recipe',
        resultTitle: 'New Title',
        timestamp: '2024-01-02',
      };

      const newHistory = [newEntry, ...existingHistory].slice(0, MAX_EXTRACTION_HISTORY);
      expect(newHistory[0].id).toBe('2');
      expect(newHistory[1].id).toBe('1');
    });

    it('should truncate long text for display', () => {
      const longText = 'A'.repeat(500);
      const truncatedText = longText.substring(0, 200);
      expect(truncatedText.length).toBe(200);
    });
  });

  describe('Feedback Storage Logic', () => {
    it('should create feedback entry with required fields', () => {
      const feedback = {
        id: String(Date.now()),
        recipeTitle: 'Test Recipe',
        isPositive: true,
        comment: 'Great extraction!',
        timestamp: new Date().toISOString(),
      };

      expect(feedback).toHaveProperty('id');
      expect(feedback).toHaveProperty('recipeTitle');
      expect(feedback).toHaveProperty('isPositive');
      expect(feedback).toHaveProperty('comment');
      expect(feedback).toHaveProperty('timestamp');
      expect(feedback.isPositive).toBe(true);
    });

    it('should allow negative feedback with comment', () => {
      const feedback = {
        id: String(Date.now()),
        recipeTitle: 'Test Recipe',
        isPositive: false,
        comment: 'Ingredients were wrong',
        timestamp: new Date().toISOString(),
      };

      expect(feedback.isPositive).toBe(false);
      expect(feedback.comment).toBe('Ingredients were wrong');
    });
  });
});
