/**
 * Meal Planning Service
 * Manages user meal plans - assigning recipes to days and meal types
 */

// Constants
export const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const MEAL_TYPES = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  DINNER: 'dinner',
  SNACKS: 'snacks'
};

/**
 * Assign a recipe to a specific day and meal type
 * @param {string} recipeId - Recipe ID to assign
 * @param {number} dayOfWeek - Day of week (0-6, 0=Sunday)
 * @param {string} mealType - Meal type (breakfast, lunch, dinner, snacks)
 * @param {Array} currentMealPlan - Current meal plan array
 * @returns {Array} Updated meal plan
 */
export const assignRecipeToMeal = (recipeId, dayOfWeek, mealType, currentMealPlan = []) => {
  if (!recipeId || dayOfWeek < 0 || dayOfWeek > 6) {
    throw new Error('Invalid recipe ID or day of week');
  }

  // Check if assignment already exists
  const existingIndex = currentMealPlan.findIndex(
    meal => meal.recipeId === recipeId && meal.dayOfWeek === dayOfWeek && meal.mealType === mealType
  );

  if (existingIndex >= 0) {
    // Already assigned, return unchanged
    return currentMealPlan;
  }

  // Add new assignment
  const newAssignment = {
    id: `${recipeId}-${dayOfWeek}-${mealType}-${Date.now()}`, // Unique ID
    recipeId,
    dayOfWeek,
    mealType,
    assignedDate: new Date().toISOString()
  };

  return [...currentMealPlan, newAssignment];
};

/**
 * Remove a recipe from meal plan
 * @param {string} recipeId - Recipe ID to remove
 * @param {number} dayOfWeek - Day of week
 * @param {string} mealType - Meal type
 * @param {Array} currentMealPlan - Current meal plan array
 * @returns {Array} Updated meal plan
 */
export const removeRecipeFromMeal = (recipeId, dayOfWeek, mealType, currentMealPlan = []) => {
  return currentMealPlan.filter(
    meal => !(meal.recipeId === recipeId && meal.dayOfWeek === dayOfWeek && meal.mealType === mealType)
  );
};

/**
 * Get all recipes for a specific day
 * @param {number} dayOfWeek - Day of week (0-6)
 * @param {Array} mealPlan - Meal plan array
 * @returns {Object} Recipes grouped by meal type
 */
export const getRecipesForDay = (dayOfWeek, mealPlan = []) => {
  const dayMeals = {
    [MEAL_TYPES.BREAKFAST]: [],
    [MEAL_TYPES.LUNCH]: [],
    [MEAL_TYPES.DINNER]: [],
    [MEAL_TYPES.SNACKS]: []
  };

  mealPlan.forEach(meal => {
    if (meal.dayOfWeek === dayOfWeek) {
      if (dayMeals[meal.mealType]) {
        dayMeals[meal.mealType].push(meal.recipeId);
      }
    }
  });

  return dayMeals;
};

/**
 * Get all recipes for a specific meal type across entire week
 * @param {string} mealType - Meal type (breakfast, lunch, dinner, snacks)
 * @param {Array} mealPlan - Meal plan array
 * @returns {Object} Recipes grouped by day
 */
export const getRecipesByMealType = (mealType, mealPlan = []) => {
  const mealTypeRecipes = {};

  DAYS_OF_WEEK.forEach((_, dayIndex) => {
    mealTypeRecipes[dayIndex] = [];
  });

  mealPlan.forEach(meal => {
    if (meal.mealType === mealType) {
      if (!mealTypeRecipes[meal.dayOfWeek]) {
        mealTypeRecipes[meal.dayOfWeek] = [];
      }
      mealTypeRecipes[meal.dayOfWeek].push(meal.recipeId);
    }
  });

  return mealTypeRecipes;
};

/**
 * Get entire week's meal plan
 * @param {Array} mealPlan - Meal plan array
 * @returns {Object} Full week meal plan organized by day and meal type
 */
export const getWeeklyMealPlan = (mealPlan = [], weekOffset = 0) => {
  const weekPlan = {};

  DAYS_OF_WEEK.forEach((day, dayIndex) => {
    weekPlan[dayIndex] = {
      day,
      [MEAL_TYPES.BREAKFAST]: [],
      [MEAL_TYPES.LUNCH]: [],
      [MEAL_TYPES.DINNER]: [],
      [MEAL_TYPES.SNACKS]: []
    };
  });

  // Calculate the week start date
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + (weekOffset * 7));
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  mealPlan.forEach(meal => {
    // Check if meal belongs to this week
    const mealDate = new Date(meal.assignedDate);
    if (mealDate >= weekStart && mealDate <= weekEnd) {
      if (weekPlan[meal.dayOfWeek] && weekPlan[meal.dayOfWeek][meal.mealType]) {
        weekPlan[meal.dayOfWeek][meal.mealType].push(meal.recipeId);
      }
    }
  });

  return weekPlan;
};

/**
 * Get recipes assigned to meal
 * @param {number} dayOfWeek - Day of week
 * @param {string} mealType - Meal type
 * @param {Array} mealPlan - Meal plan array
 * @returns {Array} Array of recipe IDs
 */
export const getMealRecipes = (dayOfWeek, mealType, mealPlan = []) => {
  return mealPlan
    .filter(meal => meal.dayOfWeek === dayOfWeek && meal.mealType === mealType)
    .map(meal => meal.recipeId);
};

/**
 * Check if recipe is assigned to meal
 * @param {string} recipeId - Recipe ID
 * @param {number} dayOfWeek - Day of week
 * @param {string} mealType - Meal type
 * @param {Array} mealPlan - Meal plan array
 * @returns {boolean} True if assigned
 */
export const isRecipeAssignedToMeal = (recipeId, dayOfWeek, mealType, mealPlan = []) => {
  return mealPlan.some(
    meal => meal.recipeId === recipeId && meal.dayOfWeek === dayOfWeek && meal.mealType === mealType
  );
};

/**
 * Get all meal assignments for a recipe
 * @param {string} recipeId - Recipe ID
 * @param {Array} mealPlan - Meal plan array
 * @returns {Array} Array of assignments
 */
export const getRecipeMealAssignments = (recipeId, mealPlan = []) => {
  return mealPlan.filter(meal => meal.recipeId === recipeId);
};

/**
 * Clear all meals for a specific day
 * @param {number} dayOfWeek - Day of week
 * @param {Array} mealPlan - Meal plan array
 * @returns {Array} Updated meal plan
 */
export const clearDayMeals = (dayOfWeek, mealPlan = []) => {
  return mealPlan.filter(meal => meal.dayOfWeek !== dayOfWeek);
};

/**
 * Get meals that need to be cooked
 * @param {Array} mealPlan - Meal plan array
 * @returns {number} Count of unique recipes in meal plan
 */
export const getUniqueMealCount = (mealPlan = []) => {
  const uniqueRecipes = new Set(mealPlan.map(meal => meal.recipeId));
  return uniqueRecipes.size;
};

export default {
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
};
