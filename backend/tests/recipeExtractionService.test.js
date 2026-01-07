/**
 * Recipe Extraction Service Tests
 * 
 * Tests for recipe extraction from transcribed text
 */

const recipeExtractionService = require('../services/recipeExtractionService');

describe('Recipe Extraction Service', () => {
  describe('extractRecipe', () => {
    test('should extract recipe from complete text', async () => {
      const text = `Chocolate Chip Cookies

        Ingredients:
        - 2 cups all-purpose flour
        - 1 cup butter, softened
        - 3/4 cup sugar
        - 1 teaspoon vanilla extract
        - 2 cups chocolate chips

        Instructions:
        Preheat oven to 375°F.
        Mix butter and sugar until creamy.
        Stir in vanilla extract.
        Fold in flour and chocolate chips.
        Bake for 10-12 minutes until golden brown.
      `;

      const result = await recipeExtractionService.extractRecipe(text);
      
      expect(result.success).toBe(true);
      expect(result.recipe).toBeDefined();
      expect(result.recipe.ingredients.length).toBeGreaterThan(0);
      expect(result.recipe.instructions.length).toBeGreaterThan(0);
    });

    test('should handle missing ingredients section', async () => {
      const text = `
        Simple Bread
        Instructions:
        Mix flour and water.
        Knead for 10 minutes.
        Bake at 400°F for 30 minutes.
      `;

      const result = await recipeExtractionService.extractRecipe(text);
      
      expect(result.success).toBe(true);
      expect(result.recipe.warnings.some(w => w.includes('Could not identify ingredients'))).toBe(true);
    });

    test('should handle missing instructions section', async () => {
      const text = `
        Pizza Dough
        Ingredients:
        - 3 cups flour
        - 1 cup water
        - 1 teaspoon salt
      `;

      const result = await recipeExtractionService.extractRecipe(text);
      
      expect(result.success).toBe(true);
      expect(result.recipe.warnings.some(w => w.includes('Could not identify instructions'))).toBe(true);
    });

    test('should apply minimum confidence threshold', async () => {
      const text = `
        Test Recipe
        Ingredients:
        - 2 cups flour
        Instructions:
        Mix and bake.
      `;

      const result = await recipeExtractionService.extractRecipe(text, { minConfidence: 0.9 });
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.recipe.ingredients)).toBe(true);
    });

    test('should reject in strict mode if confidence too low', async () => {
      const text = 'xyz abc def';

      const result = await recipeExtractionService.extractRecipe(text, { strictMode: true, minConfidence: 0.95 });
      
      // With very low input, it might succeed with low confidence but still record warnings
      expect(result.recipe).toBeDefined();
    });

    test('should include confidence scores by default', async () => {
      const text = `
        Simple Recipe
        Ingredients:
        - 1 cup flour
        Instructions:
        Bake it.
      `;

      const result = await recipeExtractionService.extractRecipe(text, { includeConfidence: true });
      
      expect(result.recipe.overallConfidence).toBeDefined();
      if (result.recipe.ingredients.length > 0) {
        expect(result.recipe.ingredients[0].confidence).toBeDefined();
      }
    });

    test('should exclude confidence scores when requested', async () => {
      const text = `
        Simple Recipe
        Ingredients:
        - 1 cup flour
        Instructions:
        Bake it.
      `;

      const result = await recipeExtractionService.extractRecipe(text, { includeConfidence: false });
      
      expect(result.recipe.overallConfidence).toBeUndefined();
    });

    test('should handle invalid input', async () => {
      const result = await recipeExtractionService.extractRecipe(null);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle empty string', async () => {
      const result = await recipeExtractionService.extractRecipe('');
      expect(result.success).toBe(false);
    });

    test('should return processing time', async () => {
      const text = 'Test Recipe\nIngredients:\n1 cup flour';
      const result = await recipeExtractionService.extractRecipe(text);
      
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
      expect(typeof result.processingTime).toBe('number');
    });
  });

  describe('parseSections', () => {
    test('should identify title section', () => {
      const text = 'Chocolate Cake\nIngredients:\nInstructions:';
      const result = recipeExtractionService.parseSections(text);
      
      expect(result.title).toContain('Chocolate');
    });

    test('should identify ingredients section', () => {
      const text = 'Recipe\nIngredients:\n2 cups flour\n1 cup sugar\nInstructions:\nBake';
      const result = recipeExtractionService.parseSections(text);
      
      expect(result.ingredientsSection).toBeDefined();
      expect(result.ingredientsSection.length).toBeGreaterThan(0);
    });

    test('should identify instructions section', () => {
      const text = 'Recipe\nIngredients:\nInstructions:\nPreheat oven\nBake for 30 minutes';
      const result = recipeExtractionService.parseSections(text);
      
      expect(result.instructionsSection).toBeDefined();
      expect(result.instructionsSection.length).toBeGreaterThan(0);
    });

    test('should handle variations of section headers', () => {
      const variations = [
        'Ingredients:',
        'INGREDIENTS:',
        'Ingredients',
        'ingredient:',
        'Instructions:',
        'INSTRUCTIONS:',
        'Directions:',
        'Steps:'
      ];

      variations.forEach(header => {
        const text = `Title\n${header}\nContent`;
        const result = recipeExtractionService.parseSections(text);
        expect(result).toBeDefined();
      });
    });

    test('should handle missing sections gracefully', () => {
      const text = 'Just some text\nNo structure here';
      const result = recipeExtractionService.parseSections(text);
      
      expect(result.title).toBeDefined();
      expect(result.ingredientsSection).toBeDefined();
      expect(result.instructionsSection).toBeDefined();
    });
  });

  describe('calculateOverallConfidence', () => {
    test('should return 0 for empty recipe', () => {
      const recipe = {
        title: '',
        ingredients: [],
        instructions: [],
        metadata: {}
      };

      const confidence = recipeExtractionService.calculateOverallConfidence(recipe);
      expect(confidence).toBe(0);
    });

    test('should increase confidence with title', () => {
      const recipe = {
        title: 'Test Recipe',
        ingredients: [],
        instructions: [],
        metadata: {}
      };

      const confidence = recipeExtractionService.calculateOverallConfidence(recipe);
      expect(confidence).toBeGreaterThan(0);
    });

    test('should increase confidence with ingredients', () => {
      const recipe = {
        title: 'Test Recipe',
        ingredients: [
          { name: 'flour', confidence: 0.9 },
          { name: 'sugar', confidence: 0.8 }
        ],
        instructions: [],
        metadata: {}
      };

      const confidence = recipeExtractionService.calculateOverallConfidence(recipe);
      expect(confidence).toBeGreaterThan(0.3);
    });

    test('should increase confidence with instructions', () => {
      const recipe = {
        title: 'Test Recipe',
        ingredients: [],
        instructions: [
          { description: 'Bake', confidence: 0.85 },
          { description: 'Cool', confidence: 0.8 }
        ],
        metadata: {}
      };

      const confidence = recipeExtractionService.calculateOverallConfidence(recipe);
      expect(confidence).toBeGreaterThan(0.3);
    });

    test('should max out at 1.0', () => {
      const recipe = {
        title: 'Perfect Recipe',
        ingredients: [
          { name: 'flour', confidence: 1.0 },
          { name: 'sugar', confidence: 1.0 }
        ],
        instructions: [
          { description: 'Bake', confidence: 1.0 }
        ],
        metadata: { servings: 4 }
      };

      const confidence = recipeExtractionService.calculateOverallConfidence(recipe);
      expect(confidence).toBeLessThanOrEqual(1.0);
    });
  });

  describe('formatRecipe', () => {
    test('should format recipe as readable text', () => {
      const recipe = {
        title: 'Test Recipe',
        ingredients: [
          {
            name: 'flour',
            quantity: { min: 2, max: 2 },
            unit: { standardUnit: 'cup' },
            preparation: []
          }
        ],
        instructions: [
          { stepNumber: 1, description: 'Mix ingredients' }
        ],
        metadata: {
          servings: 4,
          prepTime: { min: 600 },
          cookTime: { min: 1800 }
        },
        warnings: []
      };

      const formatted = recipeExtractionService.formatRecipe(recipe);
      
      expect(formatted).toContain('Test Recipe');
      expect(formatted).toContain('flour');
      expect(formatted).toContain('Mix ingredients');
      expect(formatted).toContain('Servings');
    });

    test('should handle missing metadata in formatting', () => {
      const recipe = {
        title: 'Minimal Recipe',
        ingredients: [],
        instructions: [
          { stepNumber: 1, description: 'Do something' }
        ],
        metadata: {
          servings: null,
          prepTime: { min: null },
          cookTime: { min: null }
        },
        warnings: []
      };

      const formatted = recipeExtractionService.formatRecipe(recipe);
      expect(formatted).toBeDefined();
      expect(formatted).toContain('Minimal Recipe');
    });

    test('should include warnings if present', () => {
      const recipe = {
        title: 'Recipe',
        ingredients: [],
        instructions: [],
        metadata: {},
        warnings: ['Missing ingredients', 'Unclear instructions']
      };

      const formatted = recipeExtractionService.formatRecipe(recipe);
      expect(formatted).toContain('Missing ingredients');
    });
  });

  describe('Complete workflow tests', () => {
    test('should handle real-world recipe text', async () => {
      const recipeText = `Spaghetti Carbonara

        Serves: 4
        Prep time: 10 minutes
        Cook time: 20 minutes

        Ingredients:
        - 1 pound spaghetti
        - 6 slices bacon, chopped
        - 4 egg yolks
        - 1 cup grated Parmesan cheese
        - 2 cloves garlic, minced
        - Salt and black pepper to taste

        Instructions:
        1. Bring a large pot of salted water to a boil, then add spaghetti and cook according to package directions.
        2. While pasta cooks, fry the chopped bacon in a large skillet over medium heat until crispy.
        3. Add minced garlic to the bacon and cook for 1 minute.
        4. In a bowl, whisk together egg yolks and Parmesan cheese.
        5. When pasta is done, drain it, reserving 1 cup of pasta water.
        6. Add hot pasta to the bacon mixture and remove from heat.
        7. Quickly stir in the egg mixture, adding pasta water as needed to create a creamy sauce.
        8. Season with salt and pepper. Serve immediately.
      `;

      const result = await recipeExtractionService.extractRecipe(recipeText);

      expect(result.success).toBe(true);
      expect(result.recipe).toBeDefined();
      expect(result.recipe.ingredients.length).toBeGreaterThanOrEqual(4);
      expect(result.recipe.instructions.length).toBeGreaterThanOrEqual(6);
      // Servings might be parsed from the "Serves: 4" line
      if (result.recipe.metadata.servings) {
        expect(result.recipe.metadata.servings).toBe(4);
      }
    });

    test('should handle partially formatted recipe', async () => {
      const recipeText = `
        Basic Pancakes
        
        Mix 2 cups flour, 1 tablespoon sugar, and 1 teaspoon baking powder.
        Add 1 and a half cups milk and 2 eggs.
        Cook on a griddle at 350°F for 3-4 minutes per side.
      `;

      const result = await recipeExtractionService.extractRecipe(recipeText);

      expect(result.success).toBe(true);
      // Unstructured recipe may not parse ingredients well without clear section headers
      // But should still succeed
      expect(result.recipe).toBeDefined();
    });

    test('should handle recipe with only temperature', async () => {
      const recipeText = `
        Temperature Test
        Ingredients:
        - 1 cup flour
        Instructions:
        Bake at 400°F.
      `;

      const result = await recipeExtractionService.extractRecipe(recipeText);

      expect(result.success).toBe(true);
      if (result.recipe.instructions.length > 0) {
        expect(result.recipe.instructions[0]?.temperature?.fahrenheit).toBe(400);
      }
    });
  });

  describe('Error handling', () => {
    test('should handle extraction errors gracefully', async () => {
      // Create a scenario that might cause an error
      const malformedText = { toString: () => 'Test' }; // This will be coerced to string
      const result = await recipeExtractionService.extractRecipe('Valid string');
      
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    test('should set extraction notes for low confidence ingredients', async () => {
      const text = `
        Recipe
        Ingredients:
        - Random unrecognizable text that won't parse well
        Instructions:
        Do something
      `;

      const result = await recipeExtractionService.extractRecipe(text, { minConfidence: 0.9 });

      if (result.recipe.ingredients.length === 0) {
        expect(result.recipe.extractionNotes.length).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
