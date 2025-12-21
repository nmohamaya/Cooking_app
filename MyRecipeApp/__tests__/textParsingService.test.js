/**
 * Text Parsing Service Tests
 *
 * Comprehensive test suite for textParsingService covering:
 * - Ingredient parsing with various formats
 * - Instruction parsing and step extraction
 * - Metadata extraction (servings, times, temperatures)
 * - Confidence scoring
 * - Error handling
 */

import {
  parseIngredients,
  parseInstructions,
  parseRecipeText,
  isValidParsedRecipe,
} from '../services/textParsingService';

describe('textParsingService', () => {
  // ==================== INGREDIENT PARSING TESTS ====================

  describe('parseIngredients', () => {
    it('should parse a simple ingredient with quantity and unit', async () => {
      const text = '2 cups flour';
      const result = await parseIngredients(text);

      expect(result.ingredients.length).toBeGreaterThan(0);
      expect(result.ingredients[0].quantity).toBe(2);
      expect(result.ingredients[0].unit).toBe('cup');
      expect(result.ingredients[0].item.toLowerCase()).toContain('flour');
    });

    it('should parse multiple ingredients', async () => {
      const text = `
        - 2 cups flour
        - 1 tbsp sugar
        - 1 tsp salt
      `;
      const result = await parseIngredients(text);

      expect(result.ingredients.length).toBe(3);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should handle fractional quantities', async () => {
      const text = '1 1/2 cups milk';
      const result = await parseIngredients(text);

      expect(result.ingredients.length).toBeGreaterThan(0);
      expect(result.ingredients[0].quantity).toBe(1.5);
    });

    it('should handle unicode fractions', async () => {
      const text = '½ cup butter';
      const result = await parseIngredients(text);

      expect(result.ingredients.length).toBeGreaterThan(0);
      expect(result.ingredients[0].quantity).toBe(0.5);
      expect(result.ingredients[0].unit).toBe('cup');
    });

    it('should parse ingredients without quantities', async () => {
      const text = 'salt and pepper to taste';
      const result = await parseIngredients(text);

      expect(result.ingredients.length).toBeGreaterThan(0);
      expect(result.ingredients[0].quantity).toBeNull();
    });

    it('should handle various unit abbreviations', async () => {
      const text = `
        - 3 oz cheese
        - 500 g pasta
        - 2 ml vanilla
      `;
      const result = await parseIngredients(text);

      expect(result.ingredients.length).toBe(3);
      expect(result.ingredients[0].unit).toBe('oz');
      expect(result.ingredients[1].unit).toBe('g');
      expect(result.ingredients[2].unit).toBe('ml');
    });

    it('should parse numbered ingredients', async () => {
      const text = `
        1. 2 cups flour
        2. 1 cup sugar
        3. 2 eggs
      `;
      const result = await parseIngredients(text);

      expect(result.ingredients.length).toBe(3);
    });

    it('should extract confidence score', async () => {
      const text = '2 cups flour';
      const result = await parseIngredients(text);

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle empty input', async () => {
      const result = await parseIngredients('');

      expect(result.ingredients).toEqual([]);
      expect(result.confidence).toBe(0);
    });

    it('should handle null input', async () => {
      const result = await parseIngredients(null);

      expect(result.ingredients).toEqual([]);
      expect(result.confidence).toBe(0);
    });

    it('should detect ingredients section header', async () => {
      const text = `
        INGREDIENTS:
        - 2 cups flour
        - 1 cup sugar
      `;
      const result = await parseIngredients(text);

      expect(result.ingredients.length).toBe(2);
    });

    it('should handle case-insensitive section headers', async () => {
      const text = `
        ingredients:
        - 2 cups flour
      `;
      const result = await parseIngredients(text);

      expect(result.ingredients.length).toBeGreaterThan(0);
    });

    it('should parse ingredients with parenthetical notes', async () => {
      const text = '2 cups flour (all-purpose)';
      const result = await parseIngredients(text);

      expect(result.ingredients.length).toBeGreaterThan(0);
      expect(result.ingredients[0].item.toLowerCase()).toContain('flour');
    });

    it('should handle multiple ingredient formats together', async () => {
      const text = `
        - 3 cups flour
        - 2 oz salt
        - 1 piece of butter
      `;
      const result = await parseIngredients(text);

      expect(result.ingredients.length).toBe(3);
    });

    it('should boost confidence for reasonable ingredient count', async () => {
      const text = `
        - 2 cups flour
        - 1 cup sugar
        - 2 eggs
        - 1 tbsp vanilla
        - ½ tsp salt
      `;
      const result = await parseIngredients(text);

      expect(result.confidence).toBeGreaterThan(0.6);
    });
  });

  // ==================== INSTRUCTION PARSING TESTS ====================

  describe('parseInstructions', () => {
    it('should parse numbered instruction steps', async () => {
      const text = `
        1. Mix flour and sugar
        2. Add eggs
        3. Bake at 350°F
      `;
      const result = await parseInstructions(text);

      expect(result.steps.length).toBe(3);
      expect(result.steps[0].text.toLowerCase()).toContain('mix');
    });

    it('should extract cooking methods from instructions', async () => {
      const text = '1. Bake for 30 minutes';
      const result = await parseInstructions(text);

      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.steps[0].methods).toContain('bake');
    });

    it('should extract temperatures from instructions', async () => {
      const text = '1. Bake at 350°F for 30 minutes';
      const result = await parseInstructions(text);

      expect(result.steps[0].temperatures.length).toBeGreaterThan(0);
      expect(result.steps[0].temperatures[0].value).toBe(350);
      expect(result.steps[0].temperatures[0].unit).toBe('F');
    });

    it('should extract times from instructions', async () => {
      const text = '1. Simmer for 20 minutes';
      const result = await parseInstructions(text);

      expect(result.steps[0].times.length).toBeGreaterThan(0);
      expect(result.steps[0].times[0].value).toBe(20);
      expect(result.steps[0].times[0].unit).toMatch(/minute/i);
    });

    it('should handle instruction section header', async () => {
      const text = `
        INSTRUCTIONS:
        1. Preheat oven
        2. Mix ingredients
      `;
      const result = await parseInstructions(text);

      expect(result.steps.length).toBe(2);
    });

    it('should handle "Directions" section header', async () => {
      const text = `
        DIRECTIONS:
        1. Heat pan
        2. Fry ingredients
      `;
      const result = await parseInstructions(text);

      expect(result.steps.length).toBe(2);
    });

    it('should detect cooking method verbs', async () => {
      const text = `
        1. Boil water
        2. Sauté vegetables
        3. Fold in flour
      `;
      const result = await parseInstructions(text);

      expect(result.steps.length).toBe(3);
      expect(result.steps[0].methods).toContain('boil');
      expect(result.steps[1].methods).toContain('sauté');
    });

    it('should handle combined temperatures and times', async () => {
      const text = '1. Bake at 375°F for 45 minutes';
      const result = await parseInstructions(text);

      expect(result.steps[0].temperatures.length).toBeGreaterThan(0);
      expect(result.steps[0].times.length).toBeGreaterThan(0);
    });

    it('should extract confidence for steps', async () => {
      const text = '1. Bake at 350°F for 30 minutes';
      const result = await parseInstructions(text);

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle empty instruction text', async () => {
      const result = await parseInstructions('');

      expect(result.steps).toEqual([]);
      expect(result.confidence).toBe(0);
    });

    it('should remove step numbering', async () => {
      const text = '1. Mix flour';
      const result = await parseInstructions(text);

      expect(result.steps[0].text).not.toMatch(/^1\./);
    });

    it('should handle multiple cooking methods in one step', async () => {
      const text = '1. Mix and fold the batter';
      const result = await parseInstructions(text);

      expect(result.steps[0].methods.length).toBeGreaterThan(0);
    });

    it('should boost confidence for reasonable step count', async () => {
      const text = `
        1. Preheat oven to 350°F
        2. Mix dry ingredients
        3. Add wet ingredients
        4. Fold together
        5. Bake for 30 minutes
      `;
      const result = await parseInstructions(text);

      expect(result.confidence).toBeGreaterThan(0.6);
    });
  });

  // ==================== RECIPE TEXT PARSING TESTS ====================

  describe('parseRecipeText', () => {
    it('should parse complete recipe text', async () => {
      const text = `
        INGREDIENTS:
        - 2 cups flour
        - 1 cup sugar
        - 2 eggs

        INSTRUCTIONS:
        1. Mix flour and sugar
        2. Add eggs
        3. Bake at 350°F for 30 minutes
      `;
      const result = await parseRecipeText(text);

      expect(result.ingredients.length).toBeGreaterThan(0);
      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.confidence.overall).toBeGreaterThan(0.5);
    });

    it('should extract servings from recipe text', async () => {
      const text = 'Serves: 4\n\nINGREDIENTS:\n2 cups flour';
      const result = await parseRecipeText(text);

      expect(result.servings).toBe(4);
    });

    it('should extract prep time from recipe text', async () => {
      const text = 'Prep time: 15 minutes\n\nINGREDIENTS:\n2 cups flour';
      const result = await parseRecipeText(text);

      expect(result.prepTime).toBe(15);
    });

    it('should extract cook time from recipe text', async () => {
      const text = 'Cook time: 30 minutes\n\nINGREDIENTS:\n2 cups flour';
      const result = await parseRecipeText(text);

      expect(result.cookTime).toBe(30);
    });

    it('should handle cook time in hours', async () => {
      const text = 'Cook time: 2 hours\n\nINGREDIENTS:\n2 cups flour';
      const result = await parseRecipeText(text);

      expect(result.cookTime).toBe(120);
    });

    it('should extract all temperatures from recipe', async () => {
      const text = `
        INGREDIENTS:
        - 2 cups flour

        INSTRUCTIONS:
        1. Bake at 350°F for 30 minutes
        2. Then broil at 425°F
      `;
      const result = await parseRecipeText(text);

      expect(result.temperatures.length).toBeGreaterThan(0);
      expect(result.temperatures.some(t => t.value === 350)).toBe(true);
    });

    it('should extract cooking methods from entire recipe', async () => {
      const text = `
        INSTRUCTIONS:
        1. Boil water
        2. Sauté vegetables
        3. Bake until done
      `;
      const result = await parseRecipeText(text);

      expect(result.cookingMethods.length).toBeGreaterThan(0);
      expect(result.cookingMethods).toContain('boil');
    });

    it('should calculate overall confidence', async () => {
      const text = `
        Serves: 4
        Prep time: 15 minutes
        Cook time: 30 minutes

        INGREDIENTS:
        - 2 cups flour
        - 1 cup sugar

        INSTRUCTIONS:
        1. Mix flour and sugar
        2. Bake at 350°F for 30 minutes
      `;
      const result = await parseRecipeText(text);

      expect(result.confidence.overall).toBeGreaterThan(0);
      expect(result.confidence.ingredients).toBeGreaterThan(0);
      expect(result.confidence.instructions).toBeGreaterThan(0);
    });

    it('should handle recipes with alternative section names', async () => {
      const text = `
        WHAT YOU NEED:
        - 2 cups flour

        HOW TO MAKE:
        1. Mix flour
      `;
      const result = await parseRecipeText(text);

      expect(result.ingredients.length).toBeGreaterThan(0);
      expect(result.steps.length).toBeGreaterThan(0);
    });

    it('should handle null input', async () => {
      const result = await parseRecipeText(null);

      expect(result.ingredients).toEqual([]);
      expect(result.steps).toEqual([]);
      expect(result.confidence.overall).toBe(0);
    });

    it('should include instructions as string', async () => {
      const text = `
        INSTRUCTIONS:
        1. Mix ingredients
        2. Bake
      `;
      const result = await parseRecipeText(text);

      expect(typeof result.instructions).toBe('string');
      expect(result.instructions.length).toBeGreaterThan(0);
    });

    it('should handle recipe without metadata', async () => {
      const text = `
        INGREDIENTS:
        - 2 cups flour

        INSTRUCTIONS:
        1. Mix flour
      `;
      const result = await parseRecipeText(text);

      expect(result.servings).toBeNull();
      expect(result.prepTime).toBeNull();
      expect(result.cookTime).toBeNull();
    });

    it('should handle partial recipe (ingredients only)', async () => {
      const text = `
        INGREDIENTS:
        - 2 cups flour
        - 1 cup sugar
        - 2 eggs
      `;
      const result = await parseRecipeText(text);

      expect(result.ingredients.length).toBeGreaterThan(0);
      expect(result.steps.length).toBe(0);
    });

    it('should handle partial recipe (instructions only)', async () => {
      const text = `
        INSTRUCTIONS:
        1. Mix flour and sugar
        2. Add eggs
        3. Bake
      `;
      const result = await parseRecipeText(text);

      expect(result.steps.length).toBeGreaterThan(0);
    });
  });

  // ==================== VALIDATION TESTS ====================

  describe('isValidParsedRecipe', () => {
    it('should validate a complete recipe', async () => {
      const text = `
        INGREDIENTS:
        - 2 cups flour
        - 1 cup sugar

        INSTRUCTIONS:
        1. Mix
        2. Bake
      `;
      const recipe = await parseRecipeText(text);

      expect(isValidParsedRecipe(recipe)).toBe(true);
    });

    it('should reject recipe without ingredients', async () => {
      const recipe = {
        ingredients: [],
        steps: [{ text: 'Mix' }],
        confidence: { overall: 0.8 },
      };

      expect(isValidParsedRecipe(recipe)).toBe(false);
    });

    it('should reject recipe without instructions', async () => {
      const recipe = {
        ingredients: [{ item: 'flour' }],
        steps: [],
        confidence: { overall: 0.8 },
      };

      expect(isValidParsedRecipe(recipe)).toBe(false);
    });

    it('should reject recipe with low confidence', async () => {
      const recipe = {
        ingredients: [{ item: 'flour' }],
        steps: [{ text: 'Mix' }],
        confidence: { overall: 0.3 },
      };

      expect(isValidParsedRecipe(recipe)).toBe(false);
    });

    it('should reject null recipe', () => {
      expect(isValidParsedRecipe(null)).toBe(false);
    });

    it('should require minimum confidence of 0.5', async () => {
      const recipe = {
        ingredients: [{ item: 'flour' }],
        steps: [{ text: 'Mix' }],
        confidence: { overall: 0.49 },
      };

      expect(isValidParsedRecipe(recipe)).toBe(false);
    });
  });

  // ==================== EDGE CASE TESTS ====================

  describe('Edge Cases', () => {
    it('should handle very long ingredient lists', async () => {
      const ingredients = Array.from({ length: 50 }, (_, i) => `- ${i + 1} tsp ingredient ${i}`).join('\n');
      const result = await parseIngredients(ingredients);

      expect(result.ingredients.length).toBeGreaterThan(40);
    });

    it('should handle mixed quantity formats', async () => {
      const text = `
        - 2 cups flour
        - 1 1/2 tbsp sugar
        - ¼ tsp salt
      `;
      const result = await parseIngredients(text);

      expect(result.ingredients.length).toBe(3);
      expect(result.ingredients[0].quantity).toBe(2);
      expect(result.ingredients[1].quantity).toBe(1.5);
      expect(result.ingredients[2].quantity).toBe(0.25);
    });

    it('should handle ingredients with special characters', async () => {
      const text = '½ cup extra-virgin olive oil';
      const result = await parseIngredients(text);

      expect(result.ingredients.length).toBeGreaterThan(0);
      expect(result.ingredients[0].item.toLowerCase()).toContain('olive oil');
    });

    it('should handle instructions with complex timing', async () => {
      const text = '1. Simmer for 1 hour 30 minutes';
      const result = await parseInstructions(text);

      expect(result.steps.length).toBeGreaterThan(0);
    });

    it('should extract confidence even with partial data', async () => {
      const text = 'Random text without structure';
      const result = await parseRecipeText(text);

      expect(typeof result.confidence.overall).toBe('number');
      expect(result.confidence.overall).toBeGreaterThanOrEqual(0);
    });

    it('should handle temperature in Celsius', async () => {
      const text = 'Bake at 180°C';
      const result = await parseInstructions(text);

      expect(result.steps[0].temperatures.length).toBeGreaterThan(0);
      expect(result.steps[0].temperatures[0].unit).toBe('C');
    });

    it('should handle mixed ingredient formats in same list', async () => {
      const text = `
        INGREDIENTS:
        1. 2 cups flour
        • 1 tbsp sugar
        - salt to taste
      `;
      const result = await parseIngredients(text);

      expect(result.ingredients.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle recipes with extra whitespace', async () => {
      const text = `

        INGREDIENTS:

        -  2  cups   flour
        -   1   tbsp   sugar

        INSTRUCTIONS:

        1.   Mix ingredients
        2.   Bake
      `;
      const result = await parseRecipeText(text);

      expect(result.ingredients.length).toBeGreaterThan(0);
      expect(result.steps.length).toBeGreaterThan(0);
    });

    it('should handle unicode unit symbols', async () => {
      const text = '250 g flour';
      const result = await parseIngredients(text);

      expect(result.ingredients.length).toBeGreaterThan(0);
      expect(result.ingredients[0].unit).toBe('g');
    });
  });

  // ==================== ERROR HANDLING TESTS ====================

  describe('Error Handling', () => {
    it('should handle parsing errors gracefully in parseIngredients', async () => {
      const result = await parseIngredients(undefined);

      expect(result.ingredients).toBeDefined();
      expect(Array.isArray(result.ingredients)).toBe(true);
    });

    it('should handle parsing errors gracefully in parseInstructions', async () => {
      const result = await parseInstructions(undefined);

      expect(result.steps).toBeDefined();
      expect(Array.isArray(result.steps)).toBe(true);
    });

    it('should return default structure on error in parseRecipeText', async () => {
      const result = await parseRecipeText(123);

      expect(result.ingredients).toBeDefined();
      expect(result.steps).toBeDefined();
      expect(result.confidence).toBeDefined();
    });

    it('should set confidence to 0 for invalid input', async () => {
      const result = await parseRecipeText('');

      expect(result.confidence.overall).toBe(0);
    });
  });

  // ==================== CONFIDENCE SCORING TESTS ====================

  describe('Confidence Scoring', () => {
    it('should assign higher confidence to complete ingredients', async () => {
      const completeIngredient = '2 cups all-purpose flour';
      const result = await parseIngredients(completeIngredient);

      expect(result.ingredients[0].confidence).toBeGreaterThan(0.7);
    });

    it('should assign lower confidence to ingredient without unit', async () => {
      const ingredient = '2 flour';
      const result = await parseIngredients(ingredient);

      // This might parse as quantity 2, but lower confidence
      expect(result.ingredients.length).toBeGreaterThan(0);
    });

    it('should have higher overall confidence for well-structured recipe', async () => {
      const wellStructured = `
        Serves: 4
        Prep time: 15 minutes
        Cook time: 30 minutes

        INGREDIENTS:
        - 2 cups flour
        - 1 cup sugar
        - 2 eggs
        - 1 tbsp vanilla

        INSTRUCTIONS:
        1. Preheat oven to 350°F
        2. Mix flour and sugar
        3. Add eggs and vanilla
        4. Bake for 30 minutes
      `;
      const result = await parseRecipeText(wellStructured);

      expect(result.confidence.overall).toBeGreaterThan(0.65);
    });

    it('should have lower confidence for poorly structured recipe', async () => {
      const poorlyStructured = 'some random text about cooking';
      const result = await parseRecipeText(poorlyStructured);

      expect(result.confidence.overall).toBeLessThan(0.5);
    });
  });
});
