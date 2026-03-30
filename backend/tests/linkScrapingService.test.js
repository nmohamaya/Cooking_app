/**
 * Tests for Link Scraping Service
 */

const {
  extractJsonLd,
  extractMicrodata,
  extractFromHtml,
  parseDuration,
  normalizeIngredients,
  normalizeInstructions,
} = require('../services/linkScrapingService');
const cheerio = require('cheerio');

describe('Link Scraping Service', () => {

  describe('extractJsonLd', () => {
    it('should extract recipe from JSON-LD script tag', () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": "Recipe",
            "name": "Chicken Curry",
            "recipeIngredient": ["2 cups rice", "1 lb chicken"],
            "recipeInstructions": ["Cook rice", "Prepare chicken"],
            "prepTime": "PT15M",
            "cookTime": "PT30M"
          }
          </script>
        </head>
        <body></body>
        </html>
      `;
      const $ = cheerio.load(html);
      const recipe = extractJsonLd($);

      expect(recipe).not.toBeNull();
      expect(recipe.title).toBe('Chicken Curry');
      expect(recipe.ingredients).toContain('2 cups rice');
      expect(recipe.prepTime).toBe('15 minutes');
      expect(recipe.cookTime).toBe('30 minutes');
    });

    it('should handle @graph wrapper in JSON-LD', () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@graph": [
              { "@type": "WebPage", "name": "Page" },
              {
                "@type": "Recipe",
                "name": "Pasta",
                "recipeIngredient": ["200g pasta", "100g cheese"]
              }
            ]
          }
          </script>
        </head>
        <body></body>
        </html>
      `;
      const $ = cheerio.load(html);
      const recipe = extractJsonLd($);

      expect(recipe).not.toBeNull();
      expect(recipe.title).toBe('Pasta');
    });

    it('should handle Recipe in array of types', () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": ["Recipe", "HowTo"],
            "name": "Test Recipe",
            "recipeIngredient": ["flour"]
          }
          </script>
        </head>
        <body></body>
        </html>
      `;
      const $ = cheerio.load(html);
      const recipe = extractJsonLd($);
      expect(recipe).not.toBeNull();
      expect(recipe.title).toBe('Test Recipe');
    });

    it('should return null if no JSON-LD recipe found', () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">
          { "@type": "WebPage", "name": "Not a recipe" }
          </script>
        </head>
        <body></body>
        </html>
      `;
      const $ = cheerio.load(html);
      expect(extractJsonLd($)).toBeNull();
    });

    it('should handle invalid JSON in script tag', () => {
      const html = `
        <html>
        <head>
          <script type="application/ld+json">{ invalid json }</script>
        </head>
        <body></body>
        </html>
      `;
      const $ = cheerio.load(html);
      expect(extractJsonLd($)).toBeNull();
    });
  });

  describe('extractMicrodata', () => {
    it('should extract recipe from microdata attributes', () => {
      const html = `
        <div itemtype="https://schema.org/Recipe">
          <h1 itemprop="name">Chocolate Cake</h1>
          <span itemprop="recipeIngredient">2 cups flour</span>
          <span itemprop="recipeIngredient">1 cup sugar</span>
          <div itemprop="recipeInstructions">Mix ingredients and bake</div>
        </div>
      `;
      const $ = cheerio.load(html);
      const recipe = extractMicrodata($);

      expect(recipe).not.toBeNull();
      expect(recipe.title).toBe('Chocolate Cake');
      expect(recipe.ingredients).toContain('2 cups flour');
    });

    it('should return null if no microdata recipe found', () => {
      const html = '<div><h1>Not a recipe</h1></div>';
      const $ = cheerio.load(html);
      expect(extractMicrodata($)).toBeNull();
    });
  });

  describe('extractFromHtml', () => {
    it('should extract recipe from common recipe card classes', () => {
      const html = `
        <div class="recipe-card">
          <h2 class="recipe-title">Simple Salad</h2>
          <ul>
            <li class="ingredient">Lettuce</li>
            <li class="ingredient">Tomatoes</li>
            <li class="ingredient">Dressing</li>
          </ul>
          <ol>
            <li class="instruction">Wash lettuce</li>
            <li class="instruction">Chop tomatoes</li>
          </ol>
        </div>
      `;
      const $ = cheerio.load(html);
      const recipe = extractFromHtml($);

      expect(recipe).not.toBeNull();
      expect(recipe.title).toBe('Simple Salad');
    });

    it('should return null if no recipe card found', () => {
      const html = '<div><p>Just a regular page</p></div>';
      const $ = cheerio.load(html);
      expect(extractFromHtml($)).toBeNull();
    });
  });

  describe('parseDuration', () => {
    it('should parse ISO 8601 duration', () => {
      expect(parseDuration('PT30M')).toBe('30 minutes');
      expect(parseDuration('PT1H')).toBe('1 hour');
      expect(parseDuration('PT1H30M')).toBe('1 hour 30 minutes');
      expect(parseDuration('PT2H15M')).toBe('2 hours 15 minutes');
    });

    it('should pass through already human-readable durations', () => {
      expect(parseDuration('30 minutes')).toBe('30 minutes');
      expect(parseDuration('1 hour')).toBe('1 hour');
    });

    it('should handle empty/null input', () => {
      expect(parseDuration('')).toBe('');
      expect(parseDuration(null)).toBe('');
      expect(parseDuration(undefined)).toBe('');
    });
  });

  describe('normalizeIngredients', () => {
    it('should join array of strings', () => {
      const result = normalizeIngredients(['flour', 'sugar', 'butter']);
      expect(result).toBe('flour\nsugar\nbutter');
    });

    it('should pass through strings', () => {
      expect(normalizeIngredients('flour\nsugar')).toBe('flour\nsugar');
    });

    it('should handle null', () => {
      expect(normalizeIngredients(null)).toBe('');
    });
  });

  describe('normalizeInstructions', () => {
    it('should number array of strings', () => {
      const result = normalizeInstructions(['Mix flour', 'Add sugar', 'Bake']);
      expect(result).toContain('1. Mix flour');
      expect(result).toContain('2. Add sugar');
      expect(result).toContain('3. Bake');
    });

    it('should handle objects with text property', () => {
      const result = normalizeInstructions([{ text: 'Step one' }, { text: 'Step two' }]);
      expect(result).toContain('1. Step one');
      expect(result).toContain('2. Step two');
    });

    it('should handle null', () => {
      expect(normalizeInstructions(null)).toBe('');
    });
  });
});
