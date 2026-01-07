/**
 * Ingredient Service Tests
 * 
 * Tests for ingredient parsing and normalization
 */

const ingredientService = require('../services/ingredientService');

describe('Ingredient Service', () => {
  describe('parseQuantity', () => {
    test('should parse simple integers', () => {
      const result = ingredientService.parseQuantity('2');
      expect(result.min).toBe(2);
      expect(result.max).toBe(2);
      expect(result.confidence).toBe(1.0);
    });

    test('should parse decimals', () => {
      const result = ingredientService.parseQuantity('1.5');
      expect(result.min).toBe(1.5);
      expect(result.max).toBe(1.5);
      expect(result.confidence).toBe(1.0);
    });

    test('should parse fractions', () => {
      const result = ingredientService.parseQuantity('1/2');
      expect(result.min).toBe(0.5);
      expect(result.max).toBe(0.5);
      expect(result.confidence).toBe(1.0);
    });

    test('should parse mixed numbers', () => {
      const result = ingredientService.parseQuantity('2 3/4');
      expect(result.min).toBe(2.75);
      expect(result.max).toBe(2.75);
      expect(result.confidence).toBe(1.0);
    });

    test('should parse ranges', () => {
      const result = ingredientService.parseQuantity('1-2');
      expect(result.min).toBe(1);
      expect(result.max).toBe(2);
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    test('should parse ranges with "to"', () => {
      const result = ingredientService.parseQuantity('1 to 2');
      expect(result.min).toBe(1);
      expect(result.max).toBe(2);
    });

    test('should handle invalid input', () => {
      const result = ingredientService.parseQuantity('invalid');
      expect(result.min).toBeNull();
      expect(result.max).toBeNull();
      expect(result.confidence).toBe(0);
    });

    test('should handle empty input', () => {
      const result = ingredientService.parseQuantity('');
      expect(result.confidence).toBe(0);
    });
  });

  describe('normalizeUnit', () => {
    test('should normalize common volume units', () => {
      const units = ['cup', 'tsp', 'tbsp', 'ml', 'l'];
      units.forEach(unit => {
        const result = ingredientService.normalizeUnit(unit);
        expect(result.standardUnit).toBe(unit);
        expect(result.confidence).toBe(1.0);
      });
    });

    test('should normalize common weight units', () => {
      const units = ['g', 'kg', 'oz', 'lb'];
      units.forEach(unit => {
        const result = ingredientService.normalizeUnit(unit);
        expect(result.standardUnit).toBe(unit);
        expect(result.confidence).toBe(1.0);
      });
    });

    test('should normalize plural forms', () => {
      const result = ingredientService.normalizeUnit('cups');
      expect(result.standardUnit).toBe('cup');
      expect(result.confidence).toBe(1.0);
    });

    test('should normalize spelled-out units', () => {
      const result = ingredientService.normalizeUnit('tablespoon');
      expect(result.standardUnit).toBe('tbsp');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    test('should handle unknown units', () => {
      const result = ingredientService.normalizeUnit('xyz');
      expect(result.confidence).toBeLessThanOrEqual(0.7);
      // Very dissimilar units may get fuzzy matched with low confidence
    });

    test('should identify unit types', () => {
      expect(ingredientService.normalizeUnit('cup').type).toBe('volume');
      expect(ingredientService.normalizeUnit('g').type).toBe('weight');
      expect(ingredientService.normalizeUnit('pinch').type).toBe('cooking-specific');
    });
  });

  describe('parseIngredient', () => {
    test('should parse basic ingredient with quantity and unit', () => {
      const result = ingredientService.parseIngredient('2 cups flour');
      expect(result.name).toBe('flour');
      expect(result.quantity.min).toBe(2);
      expect(result.unit.standardUnit).toBe('cup');
    });

    test('should parse ingredient with fraction', () => {
      const result = ingredientService.parseIngredient('1/2 teaspoon salt');
      expect(result.name).toBe('salt');
      expect(result.quantity.min).toBe(0.5);
      expect(result.unit.standardUnit).toBe('tsp');
    });

    test('should parse ingredient with preparation notes', () => {
      const result = ingredientService.parseIngredient('3 cloves garlic, minced');
      expect(result.name).toBe('garlic');
      expect(result.quantity.min).toBe(3);
      expect(result.preparation).toContain('minced');
    });

    test('should parse ingredient with parenthetical preparation', () => {
      const result = ingredientService.parseIngredient('1 cup butter (softened)');
      expect(result.name).toBe('butter');
      expect(result.preparation).toContain('softened');
    });

    test('should parse ingredient without quantity', () => {
      const result = ingredientService.parseIngredient('salt and pepper to taste');
      expect(result.name).toContain('salt');
      expect(result.quantity.min).toBeNull();
    });

    test('should handle multiple preparation notes', () => {
      const result = ingredientService.parseIngredient('2 tbsp olive oil (extra virgin, cold-pressed)');
      expect(result.preparation.length).toBeGreaterThan(0);
    });

    test('should return null for empty input', () => {
      expect(ingredientService.parseIngredient('')).toBeNull();
      expect(ingredientService.parseIngredient('   ')).toBeNull();
    });

    test('should set confidence based on parsed components', () => {
      const withQuantityAndUnit = ingredientService.parseIngredient('2 cups flour');
      const withoutQuantity = ingredientService.parseIngredient('salt');
      expect(withQuantityAndUnit.confidence).toBeGreaterThan(withoutQuantity.confidence);
    });
  });

  describe('parseIngredients', () => {
    test('should parse multiple ingredients', () => {
      const ingredients = [
        '2 cups flour',
        '1 cup sugar',
        '1/2 teaspoon salt'
      ];
      const results = ingredientService.parseIngredients(ingredients);
      expect(results.length).toBe(3);
      expect(results[0].name).toBe('flour');
      expect(results[1].name).toBe('sugar');
      expect(results[2].name).toBe('salt');
    });

    test('should filter out null results', () => {
      const ingredients = [
        '2 cups flour',
        '',
        '1 cup sugar'
      ];
      const results = ingredientService.parseIngredients(ingredients);
      expect(results.length).toBe(2);
    });

    test('should handle non-array input', () => {
      const results = ingredientService.parseIngredients('not an array');
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    test('should handle empty array', () => {
      const results = ingredientService.parseIngredients([]);
      expect(results.length).toBe(0);
    });
  });

  describe('Complex ingredient scenarios', () => {
    test('should handle metric measurements', () => {
      const result = ingredientService.parseIngredient('250 g butter');
      expect(result.quantity.min).toBe(250);
      expect(result.unit.standardUnit).toBe('g');
    });

    test('should handle imperial measurements', () => {
      const result = ingredientService.parseIngredient('8 oz chocolate');
      expect(result.quantity.min).toBe(8);
      expect(result.unit.standardUnit).toBe('oz');
    });

    test('should handle cooking-specific units', () => {
      const result = ingredientService.parseIngredient('1 stick butter');
      expect(result.unit.type).toBe('cooking-specific');
    });

    test('should handle ranges', () => {
      const result = ingredientService.parseIngredient('2-3 cups milk');
      expect(result.quantity.min).toBe(2);
      expect(result.quantity.max).toBe(3);
    });

    test('should handle common recipe variations', () => {
      const variations = [
        '2 tablespoons sugar',
        '2 TBSP sugar',
        '2 Tbsp. sugar',
        '2 tbsp sugar'
      ];
      variations.forEach(ing => {
        const result = ingredientService.parseIngredient(ing);
        expect(result.quantity.min).toBe(2);
      });
    });
  });

  describe('Edge cases', () => {
    test('should handle ingredient names with multiple words', () => {
      const result = ingredientService.parseIngredient('2 cups all purpose flour');
      expect(result.name).toContain('flour');
    });

    test('should preserve case in original ingredient string', () => {
      const result = ingredientService.parseIngredient('2 cups All Purpose Flour');
      expect(result.raw).toBe('2 cups All Purpose Flour');
    });

    test('should handle null input gracefully', () => {
      expect(ingredientService.parseIngredient(null)).toBeNull();
      expect(ingredientService.parseIngredient(undefined)).toBeNull();
    });

    test('should handle very small quantities', () => {
      const result = ingredientService.parseIngredient('1/8 teaspoon vanilla');
      expect(result.quantity.min).toBe(0.125);
    });
  });
});
