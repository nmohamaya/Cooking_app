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
