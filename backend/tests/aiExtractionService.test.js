/**
 * Tests for AI Extraction Service
 */

const { isValidRecipe, normalizeRecipe, inferCategory, VALID_CATEGORIES } = require('../services/aiExtractionService');

describe('AI Extraction Service', () => {

  describe('isValidRecipe', () => {
    it('should accept recipe with title and ingredients', () => {
      expect(isValidRecipe({
        title: 'Chicken Curry',
        ingredients: '2 cups rice\n1 lb chicken',
        instructions: '',
      })).toBe(true);
    });

    it('should accept recipe with title and instructions', () => {
      expect(isValidRecipe({
        title: 'Quick Pasta',
        ingredients: '',
        instructions: '1. Boil water\n2. Cook pasta',
      })).toBe(true);
    });

    it('should reject recipe without title', () => {
      expect(isValidRecipe({
        title: '',
        ingredients: 'flour, sugar',
        instructions: 'Mix and bake',
      })).toBe(false);
    });

    it('should reject recipe with no content', () => {
      expect(isValidRecipe({
        title: 'Empty Recipe',
        ingredients: '',
        instructions: '',
      })).toBe(false);
    });

    it('should reject null', () => {
      expect(isValidRecipe(null)).toBe(false);
    });

    it('should reject undefined', () => {
      expect(isValidRecipe(undefined)).toBe(false);
    });
  });

  describe('normalizeRecipe', () => {
    it('should normalize a well-formed recipe', () => {
      const result = normalizeRecipe({
        title: 'Test Recipe',
        category: 'Dinner',
        ingredients: 'flour\nsugar',
        instructions: '1. Mix\n2. Bake',
        prepTime: '10 minutes',
        cookTime: '30 minutes',
      });

      expect(result.title).toBe('Test Recipe');
      expect(result.category).toBe('Dinner');
      expect(result.ingredients).toBe('flour\nsugar');
      expect(result.prepTime).toBe('10 minutes');
    });

    it('should fix invalid category using inference', () => {
      const result = normalizeRecipe({
        title: 'Chocolate Cake',
        category: 'Invalid Category',
        ingredients: 'chocolate, sugar, flour',
      });

      expect(VALID_CATEGORIES).toContain(result.category);
      expect(result.category).toBe('Dessert');
    });

    it('should handle missing fields', () => {
      const result = normalizeRecipe({
        title: 'Simple Recipe',
      });

      expect(result.title).toBe('Simple Recipe');
      expect(result.ingredients).toBe('');
      expect(result.instructions).toBe('');
      expect(result.prepTime).toBe('');
      expect(result.cookTime).toBe('');
    });
  });

  describe('inferCategory', () => {
    it('should infer Breakfast from title', () => {
      expect(inferCategory('Fluffy Pancakes', '')).toBe('Breakfast');
    });

    it('should infer Asian from ingredients', () => {
      expect(inferCategory('Dinner', 'soy sauce, tofu, ginger')).toBe('Asian');
    });

    it('should infer Dessert from keywords', () => {
      expect(inferCategory('Chocolate Brownies', 'cocoa, sugar')).toBe('Dessert');
    });

    it('should infer Vegan with priority', () => {
      expect(inferCategory('Vegan Breakfast Bowl', '')).toBe('Vegan');
    });

    it('should default to Dinner', () => {
      expect(inferCategory('My Recipe', 'stuff')).toBe('Dinner');
    });
  });

  describe('VALID_CATEGORIES', () => {
    it('should contain all expected categories', () => {
      expect(VALID_CATEGORIES).toContain('Breakfast');
      expect(VALID_CATEGORIES).toContain('Lunch');
      expect(VALID_CATEGORIES).toContain('Dinner');
      expect(VALID_CATEGORIES).toContain('Dessert');
      expect(VALID_CATEGORIES).toContain('Asian');
      expect(VALID_CATEGORIES).toContain('Vegan');
      expect(VALID_CATEGORIES).toContain('Vegetarian');
      expect(VALID_CATEGORIES).toHaveLength(9);
    });
  });
});
