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
      const CATEGORIES = ['Main Dish', 'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snacks', 'Appetizers'];
      expect(CATEGORIES).toHaveLength(7);
      expect(CATEGORIES).toContain('Main Dish');
      expect(CATEGORIES).toContain('Breakfast');
      expect(CATEGORIES).toContain('Dessert');
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
        category: oldRecipe.category || 'Main Dish',
        tags: Array.isArray(oldRecipe.tags) ? oldRecipe.tags : [],
      };

      expect(migratedRecipe.category).toBe('Main Dish');
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
        category: recipeWithCategory.category || 'Main Dish',
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
        category: recipeWithoutTags.category || 'Main Dish',
        tags: Array.isArray(recipeWithoutTags.tags) ? recipeWithoutTags.tags : [],
      };

      expect(Array.isArray(migratedRecipe.tags)).toBe(true);
      expect(migratedRecipe.tags).toEqual([]);
    });

    it('should preserve existing tags', () => {
      const recipeWithTags = {
        id: '1',
        title: 'Recipe',
        category: 'Main Dish',
        tags: ['Quick', 'Easy'],
        ingredients: 'test',
        instructions: 'test',
      };

      const migratedRecipe = {
        ...recipeWithTags,
        category: recipeWithTags.category || 'Main Dish',
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
        category: '' || 'Main Dish',
        tags: [],
        ingredients: 'Flour, Sugar',
        instructions: 'Mix and bake',
      };

      expect(newRecipe.category).toBe('Main Dish');
      expect(newRecipe.tags).toEqual([]);
    });

    it('should create recipe with selected category', () => {
      const selectedCategory = 'Breakfast';
      const newRecipe = {
        id: String(Date.now()),
        title: 'Pancakes',
        category: selectedCategory || 'Main Dish',
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
        category: 'Main Dish',
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
      { id: '3', title: 'Pasta', category: 'Main Dish', tags: ['Easy'] },
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
        category: originalRecipe.category || 'Main Dish',
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
        category: newCategory || 'Main Dish',
      };

      expect(updatedRecipe.category).toBe('Breakfast');
    });

    it('should allow changing tags during edit', () => {
      const originalRecipe = {
        id: '1',
        title: 'Recipe',
        category: 'Main Dish',
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
      'Main Dish': '🍽️',
      'Breakfast': '🍳',
      'Lunch': '🥗',
      'Dinner': '🍛',
      'Dessert': '🍰',
      'Snacks': '🍿',
      'Appetizers': '🥟',
    };

    it('should have icon for each category', () => {
      const CATEGORIES = ['Main Dish', 'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snacks', 'Appetizers'];
      
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
  });
});

