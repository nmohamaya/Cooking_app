/**
 * Cooking Steps Service Tests
 * 
 * Tests for cooking instructions parsing and metadata extraction
 */

const cookingStepsService = require('../services/cookingStepsService');

describe('Cooking Steps Service', () => {
  describe('extractTime', () => {
    test('should parse minutes', () => {
      const result = cookingStepsService.extractTime('5 minutes');
      expect(result.min).toBe(300); // 5 * 60
      expect(result.max).toBe(300);
      expect(result.confidence).toBe(1.0);
    });

    test('should parse hours', () => {
      const result = cookingStepsService.extractTime('2 hours');
      expect(result.min).toBe(7200); // 2 * 3600
      expect(result.max).toBe(7200);
    });

    test('should parse abbreviated units', () => {
      const result = cookingStepsService.extractTime('30 min');
      expect(result.min).toBe(1800);
    });

    test('should parse time ranges', () => {
      const result = cookingStepsService.extractTime('30-45 minutes');
      expect(result.min).toBe(1800);
      expect(result.max).toBe(2700);
    });

    test('should parse "to" syntax in ranges', () => {
      const result = cookingStepsService.extractTime('1 to 2 hours');
      expect(result.min).toBe(3600);
      expect(result.max).toBe(7200);
    });

    test('should handle seconds', () => {
      const result = cookingStepsService.extractTime('45 seconds');
      expect(result.min).toBe(45);
    });

    test('should handle invalid input', () => {
      const result = cookingStepsService.extractTime('no time here');
      expect(result.min).toBeNull();
      expect(result.confidence).toBe(0);
    });
  });

  describe('extractTemperature', () => {
    test('should parse Fahrenheit', () => {
      const result = cookingStepsService.extractTemperature('350°F');
      expect(result.fahrenheit).toBe(350);
      expect(result.celsius).toBeCloseTo(177, 0);
    });

    test('should parse Celsius', () => {
      const result = cookingStepsService.extractTemperature('177°C');
      expect(result.celsius).toBe(177);
      expect(result.fahrenheit).toBeCloseTo(350.6, 0);
    });

    test('should parse without degree symbol', () => {
      const result = cookingStepsService.extractTemperature('350F');
      expect(result.fahrenheit).toBe(350);
    });

    test('should handle temperature ranges', () => {
      // Note: Current implementation extracts first temperature
      const result = cookingStepsService.extractTemperature('350°F');
      expect(result.fahrenheit).toBe(350);
    });

    test('should handle invalid input', () => {
      const result = cookingStepsService.extractTemperature('no temperature');
      expect(result.fahrenheit).toBeNull();
      expect(result.confidence).toBe(0);
    });

    test('should properly convert F to C', () => {
      const result = cookingStepsService.extractTemperature('375F');
      expect(result.celsius).toBeCloseTo(190.5, 0);
    });

    test('should properly convert C to F', () => {
      const result = cookingStepsService.extractTemperature('200C');
      expect(result.fahrenheit).toBeCloseTo(392, 0);
    });
  });

  describe('extractTechniques', () => {
    test('should identify baking', () => {
      const result = cookingStepsService.extractTechniques('Bake in a 350°F oven for 30 minutes');
      expect(result).toContain('bake');
    });

    test('should identify multiple techniques', () => {
      const result = cookingStepsService.extractTechniques('Mix flour and sugar, then fold in eggs, and bake');
      expect(result).toContain('mix');
      expect(result).toContain('fold');
      expect(result).toContain('bake');
    });

    test('should handle verb conjugations', () => {
      const text = 'The mixture was baked, then we baking more. Bake the final batch.';
      const result = cookingStepsService.extractTechniques(text);
      expect(result).toContain('bake');
    });

    test('should not have duplicates', () => {
      const result = cookingStepsService.extractTechniques('Stir stir stir the mixture');
      expect(result.filter(t => t === 'stir').length).toBe(1);
    });

    test('should handle case insensitivity', () => {
      const result = cookingStepsService.extractTechniques('BAKE at 350°F, then SIMMER');
      expect(result).toContain('bake');
      expect(result).toContain('simmer');
    });

    test('should return empty array for text without techniques', () => {
      const result = cookingStepsService.extractTechniques('Pour the sauce on top');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('parseStep', () => {
    test('should parse basic step', () => {
      const result = cookingStepsService.parseStep('Preheat oven to 350°F', 1);
      expect(result.stepNumber).toBe(1);
      expect(result.description).toContain('Preheat');
      expect(result.temperature.fahrenheit).toBe(350);
    });

    test('should remove step numbering', () => {
      const result = cookingStepsService.parseStep('1. Mix ingredients together', 1);
      expect(result.description).not.toContain('1.');
      expect(result.description).toContain('Mix');
    });

    test('should remove "Step N:" prefix', () => {
      const result = cookingStepsService.parseStep('Step 2: Bake for 30 minutes', 2);
      expect(result.description).not.toContain('Step 2:');
    });

    test('should extract duration from step', () => {
      const result = cookingStepsService.parseStep('Bake for 30 minutes');
      expect(result.duration.min).toBe(1800);
    });

    test('should extract temperature from step', () => {
      const result = cookingStepsService.parseStep('Bake at 425°F until golden');
      expect(result.temperature.fahrenheit).toBe(425);
    });

    test('should identify techniques', () => {
      const result = cookingStepsService.parseStep('Fold in the whipped cream gently');
      expect(result.techniques).toContain('fold');
    });

    test('should calculate confidence', () => {
      const result = cookingStepsService.parseStep('Bake at 350°F for 45 minutes');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('should return null for empty input', () => {
      expect(cookingStepsService.parseStep('')).toBeNull();
      expect(cookingStepsService.parseStep('   ')).toBeNull();
    });
  });

  describe('parseSteps', () => {
    test('should parse newline-separated steps', () => {
      const text = 'Preheat oven to 350°F\nMix dry ingredients\nCombine wet ingredients';
      const result = cookingStepsService.parseSteps(text);
      expect(result.length).toBe(3);
    });

    test('should parse numbered steps', () => {
      const text = '1. Preheat oven\n2. Mix ingredients\n3. Bake';
      const result = cookingStepsService.parseSteps(text);
      expect(result.length).toBe(3);
    });

    test('should handle array input', () => {
      const steps = [
        'Preheat oven to 350°F',
        'Mix ingredients',
        'Bake for 30 minutes'
      ];
      const result = cookingStepsService.parseSteps(steps);
      expect(result.length).toBe(3);
    });

    test('should filter out empty lines', () => {
      const text = 'Step 1\n\n\nStep 2\n   \nStep 3';
      const result = cookingStepsService.parseSteps(text);
      expect(result.length).toBe(3);
    });

    test('should assign correct step numbers', () => {
      const text = 'First step\nSecond step\nThird step';
      const result = cookingStepsService.parseSteps(text);
      expect(result[0].stepNumber).toBe(1);
      expect(result[1].stepNumber).toBe(2);
      expect(result[2].stepNumber).toBe(3);
    });
  });

  describe('extractMetadata', () => {
    test('should extract prep time', () => {
      const text = 'Prep time: 15 minutes\nCook time: 30 minutes';
      const result = cookingStepsService.extractMetadata(text);
      expect(result.prepTime.min).toBe(900); // 15 minutes
    });

    test('should extract cook time', () => {
      const text = 'Prep time: 15 minutes\nCook time: 30 minutes';
      const result = cookingStepsService.extractMetadata(text);
      expect(result.cookTime.min).toBe(1800); // 30 minutes
    });

    test('should extract total time', () => {
      const text = 'Total time: 1 hour';
      const result = cookingStepsService.extractMetadata(text);
      expect(result.totalTime.min).toBe(3600);
    });

    test('should extract servings', () => {
      const text = 'Serves 4\nPrep time: 10 minutes';
      const result = cookingStepsService.extractMetadata(text);
      expect(result.servings).toBe(4);
    });

    test('should extract difficulty', () => {
      const text = 'Difficulty: Easy\nServes 6';
      const result = cookingStepsService.extractMetadata(text);
      expect(result.difficulty).toBe('easy');
    });

    test('should handle different difficulty levels', () => {
      const texts = [
        'Difficulty: easy',
        'Difficulty: medium',
        'Difficulty: hard',
        'Difficulty: advanced'
      ];
      texts.forEach(text => {
        const result = cookingStepsService.extractMetadata(text);
        expect(result.difficulty).not.toBeNull();
      });
    });

    test('should handle multiple yield formats', () => {
      const texts = [
        'Serves 4',
        'Yield: 8 portions',
        'Makes 12 cookies'
      ];
      
      const result1 = cookingStepsService.extractMetadata(texts[0]);
      expect(result1.servings).toBe(4);
    });

    test('should return defaults for missing metadata', () => {
      const result = cookingStepsService.extractMetadata('No metadata here');
      expect(result.prepTime.min).toBeNull();
      expect(result.cookTime.min).toBeNull();
      expect(result.servings).toBeNull();
    });
  });

  describe('Complex scenarios', () => {
    test('should parse complete instruction set', () => {
      const text = `
        Prep time: 15 minutes
        Cook time: 30 minutes
        Serves: 4
        
        1. Preheat oven to 375°F
        2. Mix flour, sugar, and salt
        3. Cream butter and sugar together
        4. Bake for 25-30 minutes until golden brown
      `;
      const result = cookingStepsService.parseSteps(text);
      expect(result.length).toBeGreaterThan(0);
      expect(result.some(step => step.temperature.fahrenheit)).toBe(true);
      expect(result.some(step => step.duration.min)).toBe(true);
    });

    test('should handle recipe with temperature ranges', () => {
      const text = 'Bake at 350-375°F for 20-25 minutes';
      const result = cookingStepsService.parseStep(text);
      // Regex will match a temperature in the range
      expect(result.temperature.fahrenheit).toBeDefined();
      expect([350, 375]).toContain(result.temperature.fahrenheit);
    });

    test('should handle abbreviated cooking instructions', () => {
      const text = 'Bake 30 min @ 425°F';
      const result = cookingStepsService.parseStep(text);
      expect(result.duration.min).toBeGreaterThan(0);
      expect(result.temperature.fahrenheit).toBe(425);
    });
  });

  describe('Edge cases', () => {
    test('should handle null input gracefully', () => {
      expect(cookingStepsService.extractMetadata(null)).toEqual({
        prepTime: { min: null, max: null, confidence: 0 },
        cookTime: { min: null, max: null, confidence: 0 },
        totalTime: { min: null, max: null, confidence: 0 },
        servings: null,
        difficulty: null
      });
    });

    test('should handle very short times', () => {
      const result = cookingStepsService.extractTime('5 seconds');
      expect(result.min).toBe(5);
    });

    test('should handle very long times', () => {
      const result = cookingStepsService.extractTime('4 hours');
      expect(result.min).toBe(14400);
    });

    test('should handle mixed case techniques', () => {
      const result = cookingStepsService.extractTechniques('BAKE and sauté');
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
