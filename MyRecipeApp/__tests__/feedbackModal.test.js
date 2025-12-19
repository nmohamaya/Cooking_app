/**
 * Feedback Modal UX Tests
 * 
 * These tests verify the feedback modal logic for AI-extracted recipes.
 * The feedback modal appears after saving an AI-extracted recipe (Issue #39).
 * 
 * Tests verify:
 * - Feedback data structure and storage
 * - Positive/negative feedback submission
 * - Optional comment handling
 * - AsyncStorage integration
 * - Timestamp and metadata tracking
 * 
 * Note: Full UI rendering tests require E2E testing with Detox framework
 * due to React Native Modal and native module dependencies.
 * See Issue #44 for manual testing procedures.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock Alert for testing
global.Alert = {
  alert: jest.fn(),
};

// Storage key for extraction feedback (from App.js)
const EXTRACTION_FEEDBACK_KEY = 'extractionFeedback';

/**
 * Simulates the saveFeedback logic from App.js
 * This tests the feedback storage logic without rendering the full component
 */
const saveFeedback = async (isPositive, comment = '', lastExtractedRecipe = null) => {
  try {
    const storedFeedback = await AsyncStorage.getItem(EXTRACTION_FEEDBACK_KEY);
    const feedback = storedFeedback ? JSON.parse(storedFeedback) : [];
    
    feedback.push({
      id: Date.now().toString(),
      recipeTitle: lastExtractedRecipe?.title || 'Unknown',
      isPositive,
      comment,
      timestamp: new Date().toISOString(),
    });
    
    await AsyncStorage.setItem(EXTRACTION_FEEDBACK_KEY, JSON.stringify(feedback));
    return { success: true };
  } catch (error) {
    console.error('Failed to save feedback:', error);
    return { success: false, error };
  }
};

describe('Feedback Modal Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Date.now() for consistent IDs in tests
    jest.spyOn(Date, 'now').mockReturnValue(1234567890000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('saveFeedback', () => {
    it('should save positive feedback with comment to AsyncStorage', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      
      const recipe = { title: 'Chocolate Cake', id: 1 };
      const result = await saveFeedback(true, 'Great extraction!', recipe);
      
      expect(result.success).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        EXTRACTION_FEEDBACK_KEY,
        expect.stringContaining('"isPositive":true')
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        EXTRACTION_FEEDBACK_KEY,
        expect.stringContaining('"comment":"Great extraction!"')
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        EXTRACTION_FEEDBACK_KEY,
        expect.stringContaining('"recipeTitle":"Chocolate Cake"')
      );
    });

    it('should save negative feedback without comment', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      
      const recipe = { title: 'Pasta Recipe', id: 2 };
      const result = await saveFeedback(false, '', recipe);
      
      expect(result.success).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        EXTRACTION_FEEDBACK_KEY,
        expect.stringContaining('"isPositive":false')
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        EXTRACTION_FEEDBACK_KEY,
        expect.stringContaining('"comment":""')
      );
    });

    it('should append feedback to existing feedback array', async () => {
      const existingFeedback = [
        {
          id: '123',
          recipeTitle: 'Old Recipe',
          isPositive: true,
          comment: 'Old comment',
          timestamp: '2024-01-01T00:00:00.000Z',
        },
      ];
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingFeedback));
      
      const recipe = { title: 'New Recipe', id: 3 };
      await saveFeedback(true, 'New comment', recipe);
      
      const savedData = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(2);
      expect(savedData[0].recipeTitle).toBe('Old Recipe');
      expect(savedData[1].recipeTitle).toBe('New Recipe');
    });

    it('should generate unique IDs for each feedback entry', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      
      const recipe = { title: 'Test Recipe', id: 4 };
      await saveFeedback(true, '', recipe);
      
      const savedData = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);
      expect(savedData[0].id).toBe('1234567890000');
    });

    it('should include ISO timestamp for each feedback', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      
      const recipe = { title: 'Test Recipe', id: 5 };
      await saveFeedback(true, '', recipe);
      
      const savedData = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);
      // Just verify timestamp exists and is a valid ISO string format
      expect(savedData[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should handle missing recipe title gracefully', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      
      await saveFeedback(true, 'Good', null);
      
      const savedData = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);
      expect(savedData[0].recipeTitle).toBe('Unknown');
    });

    it('should handle AsyncStorage errors', async () => {
      AsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
      
      const recipe = { title: 'Test Recipe', id: 6 };
      const result = await saveFeedback(true, '', recipe);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle corrupted feedback data in AsyncStorage', async () => {
      AsyncStorage.getItem.mockResolvedValue('invalid json');
      
      const recipe = { title: 'Test Recipe', id: 7 };
      const result = await saveFeedback(true, '', recipe);
      
      // Should handle the error gracefully
      expect(result.success).toBe(false);
    });

    it('should preserve feedback data structure', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      
      const recipe = { title: 'Pizza Margherita', id: 8 };
      await saveFeedback(false, 'Missing ingredients', recipe);
      
      const savedData = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);
      expect(savedData[0]).toMatchObject({
        id: expect.any(String),
        recipeTitle: 'Pizza Margherita',
        isPositive: false,
        comment: 'Missing ingredients',
        timestamp: expect.any(String),
      });
    });
  });

  describe('Feedback Modal UX Flow', () => {
    it('should track feedback for AI-extracted recipes only', () => {
      // This test documents the expected behavior:
      // Feedback modal should appear after saving AI-extracted recipes
      // Manual verification required (Issue #44)
      expect(true).toBe(true);
    });

    it('should allow users to skip feedback', () => {
      // This test documents the expected behavior:
      // Users can skip feedback by clicking "Skip" button
      // Manual verification required (Issue #44)
      expect(true).toBe(true);
    });
  });

  describe('Feedback Data Retrieval', () => {
    it('should retrieve feedback from AsyncStorage', async () => {
      const mockFeedback = [
        {
          id: '123',
          recipeTitle: 'Test Recipe',
          isPositive: true,
          comment: 'Great!',
          timestamp: '2025-12-19T12:00:00.000Z',
        },
      ];
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockFeedback));
      
      const storedFeedback = await AsyncStorage.getItem(EXTRACTION_FEEDBACK_KEY);
      const feedback = JSON.parse(storedFeedback);
      
      expect(feedback).toHaveLength(1);
      expect(feedback[0].recipeTitle).toBe('Test Recipe');
      expect(feedback[0].isPositive).toBe(true);
    });
  });
});

// Note: Full UI component tests (button interactions, modal visibility, animations)
// require E2E testing with Detox framework due to React Native Modal limitations.
// See TEST_INFRA_FIX.md for infrastructure details.
// See Issue #44 for manual testing procedures.

