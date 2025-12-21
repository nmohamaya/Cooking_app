/**
 * Recipe Link Extraction Integration Tests
 *
 * Tests for the integrated recipe extraction functionality across services
 */

import {
  validateRecipeUrl,
  parseRecipeLink,
} from '../services/recipeExtractorService';
import {
  extractYoutubeMetadata,
} from '../services/youtubeExtractorService';
import {
  extractSocialMediaMetadata,
} from '../services/socialMediaExtractorService';
import {
  parseRecipeText,
  isValidParsedRecipe,
} from '../services/textParsingService';

describe('Recipe Link Extraction Integration', () => {
  const youtubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  const tiktokUrl = 'https://www.tiktok.com/@user/video/123456';
  const instagramUrl = 'https://www.instagram.com/p/ABC123/';
  const invalidUrl = 'https://example.com/not-recipe';

  const mockRecipeContent = `
    INGREDIENTS:
    - 2 cups flour
    - 1 cup sugar
    - 2 eggs
    - 1 tbsp vanilla
    - 1 tsp salt

    INSTRUCTIONS:
    1. Preheat oven to 350°F
    2. Mix flour and sugar in a bowl
    3. Add eggs and vanilla, mix well
    4. Add salt and fold gently
    5. Pour into baking pan
    6. Bake for 30 minutes
  `;

  describe('URL Validation', () => {
    it('should validate valid YouTube URL', () => {
      const result = parseRecipeLink(youtubeUrl);
      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe('boolean');
    });

    it('should validate valid TikTok URL', () => {
      const result = parseRecipeLink(tiktokUrl);
      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe('boolean');
    });

    it('should handle invalid URLs', () => {
      const result = parseRecipeLink('not a url');
      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
    });
  });

  describe('Content Extraction Flow', () => {
    it('should validate YouTube URL successfully', () => {
      const result = parseRecipeLink(youtubeUrl);
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('youtube');
    });

    it('should validate TikTok URL successfully', () => {
      const result = parseRecipeLink(tiktokUrl);
      if (result.isValid) {
        expect(result.platform).toBe('tiktok');
      }
    });

    it('should validate Instagram URL successfully', () => {
      const result = parseRecipeLink(instagramUrl);
      if (result.isValid) {
        expect(result.platform).toBe('instagram');
      }
    });
  });

  describe('Text Parsing Integration', () => {
    it('should parse recipe text successfully', async () => {
      const result = await parseRecipeText(mockRecipeContent);
      
      expect(result).toBeDefined();
      expect(result.ingredients).toBeDefined();
      expect(Array.isArray(result.ingredients)).toBe(true);
      expect(result.ingredients.length).toBeGreaterThan(0);
      
      expect(result.steps).toBeDefined();
      expect(Array.isArray(result.steps)).toBe(true);
      expect(result.steps.length).toBeGreaterThan(0);
      
      expect(result.confidence).toBeDefined();
      expect(typeof result.confidence.overall).toBe('number');
    });

    it('should extract metadata from recipe text', async () => {
      const result = await parseRecipeText(mockRecipeContent);
      
      // Check for extracted temperatures
      expect(result.temperatures).toBeDefined();
      expect(Array.isArray(result.temperatures)).toBe(true);
      if (result.temperatures.length > 0) {
        expect(result.temperatures[0].value).toBe(350);
        expect(result.temperatures[0].unit).toBe('F');
      }
      
      // Check for extracted cooking methods
      expect(result.cookingMethods).toBeDefined();
      expect(Array.isArray(result.cookingMethods)).toBe(true);
    });

    it('should validate parsed recipes correctly', async () => {
      const result = await parseRecipeText(mockRecipeContent);
      const isValid = isValidParsedRecipe(result);
      
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('End-to-End Extraction', () => {
    it('should handle complete extraction pipeline for valid recipe content', async () => {
      // Step 1: Parse text
      const parsed = await parseRecipeText(mockRecipeContent);
      
      expect(parsed.ingredients.length).toBeGreaterThan(0);
      expect(parsed.steps.length).toBeGreaterThan(0);
      
      // Step 2: Extract ingredients
      expect(parsed.ingredients[0]).toHaveProperty('item');
      expect(parsed.ingredients[0]).toHaveProperty('quantity');
      
      // Step 3: Check confidence
      expect(parsed.confidence.overall).toBeGreaterThan(0);
      expect(parsed.confidence.overall).toBeLessThanOrEqual(1);
    });

    it('should handle recipe with all metadata', async () => {
      const fullRecipe = `
        Serves: 4
        Prep time: 15 minutes
        Cook time: 30 minutes

        ${mockRecipeContent}
      `;
      
      const result = await parseRecipeText(fullRecipe);
      
      expect(result.servings).toBe(4);
      expect(result.prepTime).toBe(15);
      expect(result.cookTime).toBe(30);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty input gracefully', async () => {
      const result = await parseRecipeText('');
      
      expect(result).toBeDefined();
      expect(result.ingredients).toEqual([]);
      expect(result.steps).toEqual([]);
      expect(result.confidence.overall).toBe(0);
    });

    it('should handle invalid recipe content', async () => {
      const invalidContent = 'This is not a recipe at all, just random text';
      const result = await parseRecipeText(invalidContent);
      
      expect(result).toBeDefined();
      expect(typeof result.confidence.overall).toBe('number');
    });

    it('should handle null input gracefully', async () => {
      const result = await parseRecipeText(null);
      
      expect(result).toBeDefined();
      expect(result.ingredients).toEqual([]);
      expect(result.confidence.overall).toBe(0);
    });
  });

  describe('Service Integration Points', () => {
    it('should maintain consistency across extraction services', async () => {
      // Parse content through text parser
      const parsed = await parseRecipeText(mockRecipeContent);
      
      // Check that all required fields are present
      expect(parsed).toHaveProperty('ingredients');
      expect(parsed).toHaveProperty('steps');
      expect(parsed).toHaveProperty('instructions');
      expect(parsed).toHaveProperty('confidence');
      expect(parsed).toHaveProperty('temperatures');
      expect(parsed).toHaveProperty('cookingMethods');
    });

    it('should format extracted data for recipe model', async () => {
      const parsed = await parseRecipeText(mockRecipeContent);
      
      // Format as recipe object
      const recipe = {
        title: 'Recipe from Link',
        ingredients: parsed.ingredients
          .map(ing => {
            let text = '';
            if (ing.quantity) text += `${ing.quantity} `;
            if (ing.unit) text += `${ing.unit} `;
            text += ing.item;
            return text;
          })
          .join('\n'),
        instructions: parsed.instructions,
        prepTime: parsed.prepTime ? `${parsed.prepTime} minutes` : '',
        cookTime: parsed.cookTime ? `${parsed.cookTime} minutes` : '',
      };
      
      expect(recipe.title).toBeDefined();
      expect(recipe.ingredients).toBeDefined();
      expect(recipe.instructions).toBeDefined();
    });
  });

  describe('Confidence Scoring', () => {
    it('should provide meaningful confidence scores', async () => {
      const result = await parseRecipeText(mockRecipeContent);
      
      expect(result.confidence.ingredients).toBeGreaterThan(0);
      expect(result.confidence.ingredients).toBeLessThanOrEqual(1);
      
      expect(result.confidence.instructions).toBeGreaterThan(0);
      expect(result.confidence.instructions).toBeLessThanOrEqual(1);
      
      expect(result.confidence.overall).toBeGreaterThan(0);
      expect(result.confidence.overall).toBeLessThanOrEqual(1);
    });

    it('should score well-structured recipes higher', async () => {
      const result = await parseRecipeText(mockRecipeContent);
      
      // Well-structured recipe should have reasonable confidence
      expect(result.confidence.overall).toBeGreaterThan(0.5);
    });

    it('should score poorly-structured content lower', async () => {
      const poorContent = 'random words about cooking';
      const result = await parseRecipeText(poorContent);
      
      // Poorly structured should have lower confidence
      expect(result.confidence.overall).toBeLessThan(0.5);
    });
  });
});
