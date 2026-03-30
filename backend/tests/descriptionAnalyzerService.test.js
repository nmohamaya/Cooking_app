/**
 * Tests for Description Analyzer Service
 */

const { analyze, extractUrls } = require('../services/descriptionAnalyzerService');

describe('Description Analyzer Service', () => {

  describe('analyze', () => {
    it('should detect recipe content in description with ingredients', () => {
      const description = `
        Easy Chicken Curry Recipe

        Ingredients:
        2 cups rice
        1 lb chicken breast
        2 tablespoons curry powder
        1 cup coconut milk

        Instructions:
        1. Cook rice according to package directions
        2. Dice chicken and fry in oil
        3. Add curry powder and coconut milk
        4. Simmer for 20 minutes
      `;

      const result = analyze(description);
      expect(result.hasRecipeContent).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.recipeText).toBeTruthy();
    });

    it('should detect recipe content with measurements', () => {
      const description = '1/2 cup butter, 2 cups flour, 1 tsp vanilla, bake at 350F for 25 min';
      const result = analyze(description);
      expect(result.hasRecipeContent).toBe(true);
    });

    it('should detect recipe content with cooking verbs', () => {
      const description = 'Preheat oven to 400 degrees. Chop onions, dice tomatoes, sauté garlic. Mix flour and eggs. Bake for 30 minutes.';
      const result = analyze(description);
      expect(result.hasRecipeContent).toBe(true);
    });

    it('should not detect recipe content in generic description', () => {
      const description = 'Hey guys! Like and subscribe for more content. Follow me on Instagram @chef123';
      const result = analyze(description);
      expect(result.hasRecipeContent).toBe(false);
    });

    it('should not detect recipe content in music video description', () => {
      const description = 'Official music video for "Song Title" by Artist Name. Stream now on Spotify.';
      const result = analyze(description);
      expect(result.hasRecipeContent).toBe(false);
    });

    it('should handle empty or null description', () => {
      expect(analyze('').hasRecipeContent).toBe(false);
      expect(analyze(null).hasRecipeContent).toBe(false);
      expect(analyze(undefined).hasRecipeContent).toBe(false);
    });

    it('should extract URLs from description', () => {
      const description = 'Full recipe at https://example.com/chicken-curry and check out https://myblog.com/recipes';
      const result = analyze(description);
      expect(result.linkedUrls).toHaveLength(2);
      expect(result.linkedUrls).toContain('https://example.com/chicken-curry');
      expect(result.linkedUrls).toContain('https://myblog.com/recipes');
    });

    it('should return confidence between 0 and 1', () => {
      const result = analyze('1 cup sugar, 2 cups flour, bake at 350');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('extractUrls', () => {
    it('should extract URLs from text', () => {
      const text = 'Visit https://example.com and http://other.com/page';
      const urls = extractUrls(text);
      expect(urls).toHaveLength(2);
    });

    it('should filter out social media profile links', () => {
      const text = 'Follow me https://twitter.com/chef123 and https://instagram.com/chef123';
      const urls = extractUrls(text);
      expect(urls).toHaveLength(0);
    });

    it('should filter out donation links', () => {
      const text = 'Support me at https://patreon.com/chef and https://ko-fi.com/chef';
      const urls = extractUrls(text);
      expect(urls).toHaveLength(0);
    });

    it('should keep recipe blog URLs', () => {
      const text = 'Full recipe: https://allrecipes.com/recipe/chicken-curry Follow me https://instagram.com/chef';
      const urls = extractUrls(text);
      expect(urls).toHaveLength(1);
      expect(urls[0]).toContain('allrecipes.com');
    });

    it('should handle text with no URLs', () => {
      const urls = extractUrls('No links here');
      expect(urls).toHaveLength(0);
    });
  });
});
