# Meal Planning Service Documentation

## Overview

The Meal Planning Service provides core functionality for assigning recipes to specific days and meal types, enabling users to plan their weekly meals.

## Data Structure

### Meal Plan Assignment
Each assignment in the meal plan array contains:
```javascript
{
  id: "recipe1-1-lunch-1702988400000",  // Unique ID
  recipeId: "recipe1",                   // Recipe reference
  dayOfWeek: 1,                          // 0=Sunday, 6=Saturday
  mealType: "lunch",                     // breakfast, lunch, dinner, snacks
  assignedDate: "2025-12-19T..."        // ISO timestamp
}
```

## Constants

### DAYS_OF_WEEK
Array of day names: `['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']`

### MEAL_TYPES
Object with meal type constants:
- `BREAKFAST`: 'breakfast'
- `LUNCH`: 'lunch'
- `DINNER`: 'dinner'
- `SNACKS`: 'snacks'

## API Reference

### assignRecipeToMeal(recipeId, dayOfWeek, mealType, currentMealPlan)
Assign a recipe to a specific day and meal type.

**Parameters:**
- `recipeId` (string): Recipe ID to assign
- `dayOfWeek` (number): Day of week (0-6)
- `mealType` (string): Meal type constant
- `currentMealPlan` (array): Current meal plan array

**Returns:** Updated meal plan array

**Throws:** Error if invalid recipeId or dayOfWeek

**Example:**
```javascript
let mealPlan = [];
mealPlan = assignRecipeToMeal('pasta1', 1, MEAL_TYPES.LUNCH, mealPlan);
```

---

### removeRecipeFromMeal(recipeId, dayOfWeek, mealType, currentMealPlan)
Remove a recipe from meal plan.

**Parameters:** Same as assignRecipeToMeal

**Returns:** Updated meal plan array

**Example:**
```javascript
mealPlan = removeRecipeFromMeal('pasta1', 1, MEAL_TYPES.LUNCH, mealPlan);
```

---

### getRecipesForDay(dayOfWeek, mealPlan)
Get all recipes for a specific day grouped by meal type.

**Parameters:**
- `dayOfWeek` (number): Day of week (0-6)
- `mealPlan` (array): Meal plan array

**Returns:** Object with meal type keys and recipe ID arrays as values

**Example:**
```javascript
const dayRecipes = getRecipesForDay(1, mealPlan);
// Result:
// {
//   breakfast: ['recipe1'],
//   lunch: ['recipe2', 'recipe3'],
//   dinner: ['recipe4'],
//   snacks: []
// }
```

---

### getRecipesByMealType(mealType, mealPlan)
Get all recipes for a meal type across entire week.

**Parameters:**
- `mealType` (string): Meal type constant
- `mealPlan` (array): Meal plan array

**Returns:** Object with day of week keys and recipe ID arrays as values

**Example:**
```javascript
const lunches = getRecipesByMealType(MEAL_TYPES.LUNCH, mealPlan);
// Result:
// {
//   0: [],
//   1: ['pasta1'],
//   2: ['salad1', 'soup1'],
//   // ...
// }
```

---

### getWeeklyMealPlan(mealPlan)
Get entire week's meal plan organized by day and meal type.

**Parameters:**
- `mealPlan` (array): Meal plan array

**Returns:** Object with day index keys containing day name and meal type data

**Example:**
```javascript
const weekPlan = getWeeklyMealPlan(mealPlan);
// Result:
// {
//   0: { day: 'Sunday', breakfast: [], lunch: [], ... },
//   1: { day: 'Monday', breakfast: ['recipe1'], lunch: ['recipe2'], ... },
//   // ...
// }
```

---

### getMealRecipes(dayOfWeek, mealType, mealPlan)
Get recipe IDs for a specific meal.

**Parameters:**
- `dayOfWeek` (number): Day of week (0-6)
- `mealType` (string): Meal type constant
- `mealPlan` (array): Meal plan array

**Returns:** Array of recipe IDs

**Example:**
```javascript
const mondayLunches = getMealRecipes(1, MEAL_TYPES.LUNCH, mealPlan);
// Result: ['pasta1', 'salad1']
```

---

### isRecipeAssignedToMeal(recipeId, dayOfWeek, mealType, mealPlan)
Check if a recipe is assigned to a specific meal.

**Parameters:** Same as assignRecipeToMeal

**Returns:** Boolean

**Example:**
```javascript
if (isRecipeAssignedToMeal('pasta1', 1, MEAL_TYPES.LUNCH, mealPlan)) {
  console.log('Already assigned');
}
```

---

### getRecipeMealAssignments(recipeId, mealPlan)
Get all meal assignments for a specific recipe.

**Parameters:**
- `recipeId` (string): Recipe ID
- `mealPlan` (array): Meal plan array

**Returns:** Array of assignment objects

**Example:**
```javascript
const assignments = getRecipeMealAssignments('pasta1', mealPlan);
// Result:
// [
//   { dayOfWeek: 1, mealType: 'lunch' },
//   { dayOfWeek: 3, mealType: 'dinner' }
// ]
```

---

### clearDayMeals(dayOfWeek, mealPlan)
Remove all meals for a specific day.

**Parameters:**
- `dayOfWeek` (number): Day of week (0-6)
- `mealPlan` (array): Meal plan array

**Returns:** Updated meal plan array

**Example:**
```javascript
mealPlan = clearDayMeals(1, mealPlan); // Clear all of Monday
```

---

### getUniqueMealCount(mealPlan)
Get count of unique recipes in meal plan.

**Parameters:**
- `mealPlan` (array): Meal plan array

**Returns:** Number of unique recipes

**Example:**
```javascript
const uniqueCount = getUniqueMealCount(mealPlan);
// If pasta1 appears 2x and salad1 appears 1x: returns 2
```

---

## Storage

Meal plan should be stored in AsyncStorage as JSON:
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

const MEAL_PLAN_STORAGE_KEY = '@myrecipeapp/meal_plan';

// Save meal plan
await AsyncStorage.setItem(MEAL_PLAN_STORAGE_KEY, JSON.stringify(mealPlan));

// Load meal plan
const savedPlan = await AsyncStorage.getItem(MEAL_PLAN_STORAGE_KEY);
const mealPlan = savedPlan ? JSON.parse(savedPlan) : [];
```

## Testing

Service includes comprehensive test suite with 30+ tests covering:
- ✅ Recipe assignment and removal
- ✅ Duplicate prevention
- ✅ Day and meal type filtering
- ✅ Weekly view generation
- ✅ Error handling
- ✅ Edge cases

Run tests:
```bash
npm test -- mealPlanningService.test.js
```

## Usage Example

```javascript
import {
  assignRecipeToMeal,
  getWeeklyMealPlan,
  MEAL_TYPES
} from './mealPlanningService';

// Initialize empty meal plan
let mealPlan = [];

// Assign recipes to week
mealPlan = assignRecipeToMeal('pasta1', 1, MEAL_TYPES.LUNCH, mealPlan);    // Monday lunch
mealPlan = assignRecipeToMeal('salad1', 1, MEAL_TYPES.DINNER, mealPlan);   // Monday dinner
mealPlan = assignRecipeToMeal('soup1', 2, MEAL_TYPES.LUNCH, mealPlan);     // Tuesday lunch

// View entire week
const weekPlan = getWeeklyMealPlan(mealPlan);
console.log(weekPlan);

// Save to AsyncStorage
await AsyncStorage.setItem('@myrecipeapp/meal_plan', JSON.stringify(mealPlan));
```

---

**Related to:** Issue #65 - Meal Planning Feature
