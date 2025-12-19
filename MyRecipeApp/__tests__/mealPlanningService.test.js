import {
  assignRecipeToMeal,
  removeRecipeFromMeal,
  getRecipesForDay,
  getRecipesByMealType,
  getWeeklyMealPlan,
  getMealRecipes,
  isRecipeAssignedToMeal,
  getRecipeMealAssignments,
  clearDayMeals,
  getUniqueMealCount,
  DAYS_OF_WEEK,
  MEAL_TYPES
} from '../mealPlanningService';

describe('Meal Planning Service', () => {
  describe('Constants', () => {
    it('should have all days of week', () => {
      expect(DAYS_OF_WEEK).toHaveLength(7);
      expect(DAYS_OF_WEEK[0]).toBe('Sunday');
      expect(DAYS_OF_WEEK[6]).toBe('Saturday');
    });

    it('should have all meal types', () => {
      expect(MEAL_TYPES.BREAKFAST).toBe('breakfast');
      expect(MEAL_TYPES.LUNCH).toBe('lunch');
      expect(MEAL_TYPES.DINNER).toBe('dinner');
      expect(MEAL_TYPES.SNACKS).toBe('snacks');
    });
  });

  describe('assignRecipeToMeal', () => {
    it('should assign a recipe to a meal', () => {
      const mealPlan = [];
      const result = assignRecipeToMeal('recipe1', 1, MEAL_TYPES.LUNCH, mealPlan);

      expect(result).toHaveLength(1);
      expect(result[0].recipeId).toBe('recipe1');
      expect(result[0].dayOfWeek).toBe(1);
      expect(result[0].mealType).toBe(MEAL_TYPES.LUNCH);
    });

    it('should not add duplicate assignments', () => {
      let mealPlan = [];
      mealPlan = assignRecipeToMeal('recipe1', 1, MEAL_TYPES.LUNCH, mealPlan);
      const result = assignRecipeToMeal('recipe1', 1, MEAL_TYPES.LUNCH, mealPlan);

      expect(result).toHaveLength(1);
    });

    it('should allow same recipe on different days', () => {
      let mealPlan = [];
      mealPlan = assignRecipeToMeal('recipe1', 1, MEAL_TYPES.LUNCH, mealPlan);
      mealPlan = assignRecipeToMeal('recipe1', 2, MEAL_TYPES.LUNCH, mealPlan);

      expect(mealPlan).toHaveLength(2);
    });

    it('should throw error for invalid day', () => {
      expect(() => {
        assignRecipeToMeal('recipe1', 7, MEAL_TYPES.LUNCH, []);
      }).toThrow();
    });

    it('should throw error for missing recipe ID', () => {
      expect(() => {
        assignRecipeToMeal(null, 1, MEAL_TYPES.LUNCH, []);
      }).toThrow();
    });
  });

  describe('removeRecipeFromMeal', () => {
    it('should remove a recipe from meal plan', () => {
      let mealPlan = [];
      mealPlan = assignRecipeToMeal('recipe1', 1, MEAL_TYPES.LUNCH, mealPlan);
      mealPlan = assignRecipeToMeal('recipe2', 1, MEAL_TYPES.LUNCH, mealPlan);

      const result = removeRecipeFromMeal('recipe1', 1, MEAL_TYPES.LUNCH, mealPlan);

      expect(result).toHaveLength(1);
      expect(result[0].recipeId).toBe('recipe2');
    });

    it('should not remove if assignment does not exist', () => {
      let mealPlan = [];
      mealPlan = assignRecipeToMeal('recipe1', 1, MEAL_TYPES.LUNCH, mealPlan);

      const result = removeRecipeFromMeal('recipe2', 1, MEAL_TYPES.LUNCH, mealPlan);

      expect(result).toHaveLength(1);
    });
  });

  describe('getRecipesForDay', () => {
    it('should return all recipes for a day grouped by meal type', () => {
      let mealPlan = [];
      mealPlan = assignRecipeToMeal('recipe1', 1, MEAL_TYPES.BREAKFAST, mealPlan);
      mealPlan = assignRecipeToMeal('recipe2', 1, MEAL_TYPES.LUNCH, mealPlan);
      mealPlan = assignRecipeToMeal('recipe3', 1, MEAL_TYPES.DINNER, mealPlan);

      const result = getRecipesForDay(1, mealPlan);

      expect(result[MEAL_TYPES.BREAKFAST]).toEqual(['recipe1']);
      expect(result[MEAL_TYPES.LUNCH]).toEqual(['recipe2']);
      expect(result[MEAL_TYPES.DINNER]).toEqual(['recipe3']);
      expect(result[MEAL_TYPES.SNACKS]).toEqual([]);
    });

    it('should return empty arrays for day with no meals', () => {
      const result = getRecipesForDay(1, []);

      expect(result[MEAL_TYPES.BREAKFAST]).toEqual([]);
      expect(result[MEAL_TYPES.LUNCH]).toEqual([]);
      expect(result[MEAL_TYPES.DINNER]).toEqual([]);
      expect(result[MEAL_TYPES.SNACKS]).toEqual([]);
    });
  });

  describe('getRecipesByMealType', () => {
    it('should return all recipes for a meal type grouped by day', () => {
      let mealPlan = [];
      mealPlan = assignRecipeToMeal('recipe1', 1, MEAL_TYPES.LUNCH, mealPlan);
      mealPlan = assignRecipeToMeal('recipe2', 2, MEAL_TYPES.LUNCH, mealPlan);
      mealPlan = assignRecipeToMeal('recipe3', 1, MEAL_TYPES.DINNER, mealPlan);

      const result = getRecipesByMealType(MEAL_TYPES.LUNCH, mealPlan);

      expect(result[1]).toEqual(['recipe1']);
      expect(result[2]).toEqual(['recipe2']);
      expect(result[3]).toEqual([]);
    });
  });

  describe('getWeeklyMealPlan', () => {
    it('should return entire week meal plan', () => {
      let mealPlan = [];
      mealPlan = assignRecipeToMeal('recipe1', 1, MEAL_TYPES.LUNCH, mealPlan);
      mealPlan = assignRecipeToMeal('recipe2', 2, MEAL_TYPES.DINNER, mealPlan);

      const result = getWeeklyMealPlan(mealPlan);

      expect(Object.keys(result)).toHaveLength(7);
      expect(result[1][MEAL_TYPES.LUNCH]).toEqual(['recipe1']);
      expect(result[2][MEAL_TYPES.DINNER]).toEqual(['recipe2']);
    });
  });

  describe('getMealRecipes', () => {
    it('should return recipe IDs for specific meal', () => {
      let mealPlan = [];
      mealPlan = assignRecipeToMeal('recipe1', 1, MEAL_TYPES.LUNCH, mealPlan);
      mealPlan = assignRecipeToMeal('recipe2', 1, MEAL_TYPES.LUNCH, mealPlan);

      const result = getMealRecipes(1, MEAL_TYPES.LUNCH, mealPlan);

      expect(result).toEqual(['recipe1', 'recipe2']);
    });
  });

  describe('isRecipeAssignedToMeal', () => {
    it('should return true if recipe is assigned', () => {
      let mealPlan = [];
      mealPlan = assignRecipeToMeal('recipe1', 1, MEAL_TYPES.LUNCH, mealPlan);

      const result = isRecipeAssignedToMeal('recipe1', 1, MEAL_TYPES.LUNCH, mealPlan);

      expect(result).toBe(true);
    });

    it('should return false if recipe is not assigned', () => {
      const mealPlan = [];

      const result = isRecipeAssignedToMeal('recipe1', 1, MEAL_TYPES.LUNCH, mealPlan);

      expect(result).toBe(false);
    });
  });

  describe('getRecipeMealAssignments', () => {
    it('should return all assignments for a recipe', () => {
      let mealPlan = [];
      mealPlan = assignRecipeToMeal('recipe1', 1, MEAL_TYPES.LUNCH, mealPlan);
      mealPlan = assignRecipeToMeal('recipe1', 2, MEAL_TYPES.LUNCH, mealPlan);
      mealPlan = assignRecipeToMeal('recipe1', 3, MEAL_TYPES.DINNER, mealPlan);

      const result = getRecipeMealAssignments('recipe1', mealPlan);

      expect(result).toHaveLength(3);
      expect(result.every(a => a.recipeId === 'recipe1')).toBe(true);
    });
  });

  describe('clearDayMeals', () => {
    it('should remove all meals for a specific day', () => {
      let mealPlan = [];
      mealPlan = assignRecipeToMeal('recipe1', 1, MEAL_TYPES.LUNCH, mealPlan);
      mealPlan = assignRecipeToMeal('recipe2', 1, MEAL_TYPES.DINNER, mealPlan);
      mealPlan = assignRecipeToMeal('recipe3', 2, MEAL_TYPES.LUNCH, mealPlan);

      const result = clearDayMeals(1, mealPlan);

      expect(result).toHaveLength(1);
      expect(result[0].dayOfWeek).toBe(2);
    });
  });

  describe('getUniqueMealCount', () => {
    it('should return count of unique recipes', () => {
      let mealPlan = [];
      mealPlan = assignRecipeToMeal('recipe1', 1, MEAL_TYPES.LUNCH, mealPlan);
      mealPlan = assignRecipeToMeal('recipe1', 2, MEAL_TYPES.LUNCH, mealPlan);
      mealPlan = assignRecipeToMeal('recipe2', 3, MEAL_TYPES.LUNCH, mealPlan);

      const result = getUniqueMealCount(mealPlan);

      expect(result).toBe(2);
    });
  });
});
