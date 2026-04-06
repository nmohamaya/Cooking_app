const { scoreRecipe, THRESHOLDS } = require('../services/recipeCompletenessScorer');

describe('recipeCompletenessScorer', () => {
  describe('scoreRecipe', () => {
    it('should return score 0 for null recipe', () => {
      const result = scoreRecipe(null);
      expect(result.score).toBe(0);
      expect(result.phase).toBe('insufficient');
      expect(Object.values(result.breakdown).every(v => v === false)).toBe(true);
    });

    it('should return score 0 for empty recipe', () => {
      const result = scoreRecipe({});
      expect(result.score).toBe(0);
      expect(result.phase).toBe('insufficient');
    });

    it('should score a complete recipe as 12 (complete phase)', () => {
      const recipe = {
        title: 'Chicken Tikka Masala',
        category: 'Asian',
        ingredients: '2 cups chicken breast, diced\n1 tbsp olive oil\n1 tsp cumin\n400g tomato sauce',
        instructions: '1. Marinate the chicken in spices for 30 minutes\n2. Heat oil in a pan\n3. Cook chicken until golden\n4. Add sauce and simmer at 350°F for 20 minutes',
        prepTime: '30 minutes',
        cookTime: '25 minutes',
        servings: '4 servings',
      };

      const result = scoreRecipe(recipe);
      expect(result.score).toBe(12);
      expect(result.phase).toBe('complete');
      expect(result.breakdown.hasTitle).toBe(true);
      expect(result.breakdown.hasIngredients).toBe(true);
      expect(result.breakdown.hasMeasurements).toBe(true);
      expect(result.breakdown.hasInstructions).toBe(true);
      expect(result.breakdown.hasOrderedSteps).toBe(true);
      expect(result.breakdown.hasTime).toBe(true);
      expect(result.breakdown.hasServings).toBe(true);
      expect(result.breakdown.hasTemperature).toBe(true);
      expect(result.breakdown.hasCategory).toBe(true);
    });

    it('should score recipe without measurements (10 points)', () => {
      const recipe = {
        title: 'Simple Pasta',
        category: 'Dinner',
        ingredients: 'pasta\ntomato sauce\ngarlic\nonion\nbasil leaves',
        instructions: '1. Boil pasta in salted water\n2. Sauté garlic and onion\n3. Add sauce and simmer at 180°C',
        prepTime: '10 minutes',
        cookTime: '20 minutes',
        servings: '2 servings',
      };

      const result = scoreRecipe(recipe);
      // title(1) + ingredients(2) + no measurements(0) + instructions(2) + ordered(1) + time(1) + servings(1) + temp(1) + category(1) = 10
      expect(result.score).toBe(10);
      expect(result.phase).toBe('complete');
      expect(result.breakdown.hasMeasurements).toBe(false);
    });

    it('should score title + ingredients only as partial', () => {
      const recipe = {
        title: 'Quick Salad',
        ingredients: '2 cups lettuce\n1 tbsp dressing\nsome tomatoes',
        instructions: '',
      };

      const result = scoreRecipe(recipe);
      // title(1) + ingredients(2) + measurements(2) = 5
      expect(result.score).toBe(5);
      expect(result.phase).toBe('partial');
    });

    it('should detect various measurement units', () => {
      const testCases = [
        { ingredients: '2 cups flour', expected: true },
        { ingredients: '1 tbsp oil', expected: true },
        { ingredients: '3 tsp salt', expected: true },
        { ingredients: '500g chicken', expected: true },
        { ingredients: '250 ml milk', expected: true },
        { ingredients: '2 lbs beef', expected: true },
        { ingredients: '100 grams sugar', expected: true },
        { ingredients: 'some flour and eggs', expected: false },
      ];

      for (const tc of testCases) {
        const result = scoreRecipe({ title: 'Test', ingredients: tc.ingredients });
        expect(result.breakdown.hasMeasurements).toBe(tc.expected);
      }
    });

    it('should detect ordered steps', () => {
      const ordered = scoreRecipe({
        title: 'Test',
        instructions: '1. First step\n2. Second step',
      });
      expect(ordered.breakdown.hasOrderedSteps).toBe(true);

      const unordered = scoreRecipe({
        title: 'Test',
        instructions: 'Mix everything together and then bake it for a while',
      });
      expect(unordered.breakdown.hasOrderedSteps).toBe(false);
    });

    it('should detect temperature in instructions', () => {
      const fahrenheit = scoreRecipe({
        title: 'Test',
        instructions: 'Preheat oven to 350°F',
      });
      expect(fahrenheit.breakdown.hasTemperature).toBe(true);

      const celsius = scoreRecipe({
        title: 'Test',
        instructions: 'Bake at 180°C for 30 minutes',
      });
      expect(celsius.breakdown.hasTemperature).toBe(true);

      const degrees = scoreRecipe({
        title: 'Test',
        instructions: 'Heat to 200 degrees',
      });
      expect(degrees.breakdown.hasTemperature).toBe(true);
    });

    it('should reject invalid categories', () => {
      const invalid = scoreRecipe({ title: 'Test', category: 'NotACategory' });
      expect(invalid.breakdown.hasCategory).toBe(false);

      const valid = scoreRecipe({ title: 'Test', category: 'Breakfast' });
      expect(valid.breakdown.hasCategory).toBe(true);
    });

    it('should require title to be at least 3 characters', () => {
      const short = scoreRecipe({ title: 'Hi' });
      expect(short.breakdown.hasTitle).toBe(false);

      const ok = scoreRecipe({ title: 'Pie' });
      expect(ok.breakdown.hasTitle).toBe(true);
    });

    it('should require ingredients and instructions to be at least 10 chars', () => {
      const short = scoreRecipe({ title: 'Test', ingredients: 'flour', instructions: 'mix' });
      expect(short.breakdown.hasIngredients).toBe(false);
      expect(short.breakdown.hasInstructions).toBe(false);

      const ok = scoreRecipe({
        title: 'Test',
        ingredients: 'flour, eggs, sugar, butter',
        instructions: 'Mix all ingredients together well',
      });
      expect(ok.breakdown.hasIngredients).toBe(true);
      expect(ok.breakdown.hasInstructions).toBe(true);
    });
  });

  describe('THRESHOLDS', () => {
    it('should have correct threshold values', () => {
      expect(THRESHOLDS.COMPLETE).toBe(9);
      expect(THRESHOLDS.PARTIAL).toBe(5);
    });
  });
});
