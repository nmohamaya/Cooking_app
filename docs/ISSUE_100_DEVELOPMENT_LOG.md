# Issue #100: Meal Planning Integration - Development Log

**Status:** ✅ COMPLETED  
**Issue:** Enable users to add recipes to weekly meal plans and generate shopping lists  
**PR:** #101  
**Test Issue:** #102

---

## Overview

This document details all challenges encountered during the meal planning integration feature development and the solutions implemented. This serves as a reference for future developers.

---

## Issues Encountered & Solutions

### 1. **Meal Slot Buttons Non-Functional**

**Problem:**
- "+ Add Breakfast/Lunch/Dinner/Snacks" buttons in the meal plan view weren't responding to taps
- No way to add recipes to specific meal slots

**Root Cause:**
- `onMealSlotPress` callback was not wired up in the button handlers
- Modal for recipe picker wasn't implemented

**Solution:**
- Implemented `handleMealSlotPress` callback in App.js to capture day and meal type
- Created recipe picker modal with recipe list
- Added `handleAddRecipeToMealSlot` async handler to save selected recipe to AsyncStorage
- Wired callbacks through component hierarchy: `WeeklyMealPlanView` → `DayCard` → `MealSection` → buttons

**Files Modified:**
- `App.js`: Added state and handlers for recipe selection
- `components/WeeklyMealPlanView.js`: Passed callbacks to child components

**Commits:**
- `7b63b27`: feat: integrate meal plan with shopping list generator

---

### 2. **Recipe Titles Not Displaying - Showing Recipe IDs Instead**

**Problem:**
- Selected recipes appeared in meal plan but displayed as IDs (e.g., "1705...") instead of recipe titles
- No way to identify which recipe was added

**Root Cause:**
- WeeklyMealPlanView had recipe IDs but no way to look up recipe titles
- Recipe data wasn't being passed to the component

**Solution:**
- Passed `recipes` array as prop from App.js to WeeklyMealPlanView
- Implemented `getRecipeTitle` function to look up recipe name by ID:
  ```javascript
  const getRecipeTitle = (recipeId) => {
    const recipe = recipes.find(r => r.id === recipeId);
    return recipe ? recipe.title : recipeId;
  };
  ```
- Used `useMemo` hook for memoization to prevent unnecessary re-renders
- Passed `getRecipeTitle` through component chain to RecipeItem component

**Files Modified:**
- `App.js`: Added recipes prop to WeeklyMealPlanView
- `components/WeeklyMealPlanView.js`: Implemented recipe lookup and passed to children

---

### 3. **mealType Undefined in New Meal Objects**

**Problem:**
- New meals saved to AsyncStorage had undefined `mealType`
- Meal objects structure: `{recipeId, dayOfWeek, mealType, assignedDate}` but `mealType` was missing
- Prevented proper meal type identification and filtering

**Root Cause:**
- `onMealSlotPress` callback was wrapped in an arrow function
- Only `dayOfWeek` parameter was being passed through the wrapper
- `mealType` parameter was lost in callback chain

**Solution:**
- Changed to pass raw `onMealSlotPress` function instead of wrapper:
  ```javascript
  // Before: Wrapper prevented parameter passing
  onMealSlotPress={() => onMealSlotPress(dayOfWeek, mealType)}
  
  // After: Direct function reference allows both parameters
  onMealSlotPress={onMealSlotPress}
  ```
- Updated button handlers to pass both parameters:
  ```javascript
  onPress={() => onMealSlotPress(dayOfWeek, mealType)}
  ```

**Files Modified:**
- `components/WeeklyMealPlanView.js`: Fixed callback wrapping

---

### 4. **Recipes Appearing in All Weeks Instead of Current Week Only**

**Problem:**
- Adding recipes to one week made them appear in all weeks
- No week isolation - meal plan showed all meals regardless of week offset
- Users couldn't plan different meals for different weeks

**Root Cause:**
- `getWeeklyMealPlan` was returning all meals from the array without filtering
- No date-based filtering logic
- `mealPlan` array contained meals with `assignedDate` but wasn't being filtered by it

**Solution:**
- Updated `getWeeklyMealPlan` function to filter by date range:
  ```javascript
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + (weekOffset * 7));
  
  mealPlan.forEach(meal => {
    const mealDate = new Date(meal.assignedDate);
    if (mealDate >= weekStart && mealDate <= weekEnd) {
      // Include in current week
    }
  });
  ```
- Filters meals based on `assignedDate` and week boundaries
- Supports week navigation with `weekOffset` parameter

**Files Modified:**
- `mealPlanningService.js`: Implemented week-based filtering
- `components/WeeklyMealPlanView.js`: Updated to pass `weekOffset` parameter

**Impact:**
- Users can now plan different meals for different weeks
- Proper week isolation prevents meal conflicts

---

### 5. **Incorrect Meal Count Display (Showing 29 Instead of 3)**

**Problem:**
- Meal summary showed 29 meals for the week instead of actual count (3)
- Clear indication that counts were including ALL meals globally, not just current week

**Root Cause:**
- `getTotalRecipes()` and `getWeekSummary()` functions counted entire `mealPlan` array
- These functions didn't filter by current week - they aggregated globally
- Discrepancy between displayed meals and actual week-specific meals

**Solution:**
- Changed summary functions to count `weekPlanData` instead of `mealPlan`:
  ```javascript
  const getTotalRecipes = () => {
    const allRecipes = Object.values(weekPlanData).reduce((acc, dayData) => {
      if (dayData && typeof dayData === 'object') {
        Object.values(dayData).forEach(mealRecipes => {
          if (Array.isArray(mealRecipes)) {
            acc.push(...mealRecipes);
          }
        });
      }
      return acc;
    }, []);
    return new Set(allRecipes).size;
  };
  ```
- `weekPlanData` is already filtered to current week, so counts are accurate

**Files Modified:**
- `components/WeeklyMealPlanView.js`: Fixed count functions

**Result:**
- Week-specific meal counts now display correctly
- 3 meals shown for week 1, 0 for week 2, etc.

---

### 6. **Shopping List Not Showing Ingredients**

**Problem:**
- Generated shopping list displayed "No items in shopping list"
- Console error: "Cannot read properties of undefined (reading 'generateWeeklyShoppingList')"
- No ingredients appeared even with recipes added to meal plan

**Root Causes:**
Multiple issues:

**Issue 6a: Incorrect Import Statement**
- ShoppingListView was trying to destructure `shoppingListService` as named export
- Service was exported as default object
```javascript
// Wrong:
import { shoppingListService } from './shoppingListService';

// Correct:
import shoppingListService from './shoppingListService';
```

**Issue 6b: Shopping List Couldn't Find Recipes**
- `generateWeeklyShoppingList` only used mock recipe data
- Real recipes from app weren't accessible
- When recipe ID didn't match mock data (e.g., timestamp IDs), `getMockRecipe` returned undefined

**Solution:**
- Fixed import statement in ShoppingListView
- Passed `recipes` array to shopping list generation functions:
  ```javascript
  generateWeeklyShoppingList(parsedMealPlan, 0, recipes)
  ```
- Updated shopping list service functions to look up real recipes:
  ```javascript
  const recipeMap = {};
  recipes.forEach(recipe => {
    recipeMap[recipe.id] = recipe;
  });
  
  uniqueRecipes.forEach((recipeId) => {
    let recipe = recipeMap[recipeId]; // Look up from app's recipes
    if (!recipe) {
      recipe = getMockRecipe(recipeId); // Fall back to mock
    }
    if (recipe) {
      const ingredients = extractRecipeIngredients(recipe);
      allIngredients.push(...ingredients);
    }
  });
  ```

**Files Modified:**
- `ShoppingListView.js`: Fixed import and added recipes prop
- `App.js`: Passed recipes to ShoppingListView
- `shoppingListService.js`: Updated all three generation functions (weekly, daily, custom)

**Result:**
- Shopping list now properly displays all ingredients
- Works with both real recipes and mock data

---

### 7. **Generated Shopping List Items Reappearing After Clear**

**Problem:**
- Clicking "Clear All" button cleared the list for ~1 second
- Items reappeared automatically after 1 second
- Could not permanently clear the list

**Root Cause:**
- Auto-refresh mechanism with `setInterval(() => loadAndGenerateList(), 1000)`
- Interval ran every second and regenerated shopping list from meal plan
- Conflicted with manual "Clear All" action

**Solution:**
- Removed aggressive auto-refresh with setInterval
- Kept manual "↻ Refresh" button for when user wants updated list
- Implemented single-run load on component mount
- Users can now click "Clear All" and it persists until they manually refresh

**Files Modified:**
- `ShoppingListView.js`: Removed setInterval, kept useEffect for initial load

**Result:**
- "Clear All" now works as expected
- List persists until user clicks refresh
- Better user control over when to update

---

### 8. **Clear Purchased Button Throwing Error**

**Problem:**
- Clicking "Clear Purchased" button threw error:
- `items.filter is not a function`
- Purchased items couldn't be removed

**Root Cause:**
- `clearPurchased` function called `shoppingListService.clearPurchasedItems(shoppingList[category])`
- Service expected full categorized object `{category: items}`
- Was receiving just the items array instead

**Solution:**
- Changed to direct array filtering instead of service function call:
  ```javascript
  const clearPurchased = () => {
    const updatedList = {};
    Object.keys(shoppingList).forEach((category) => {
      const unpurchased = shoppingList[category].filter((item) => !item.purchased);
      if (unpurchased.length > 0) {
        updatedList[category] = unpurchased;
      }
    });
    setShoppingList(updatedList);
  };
  ```

**Files Modified:**
- `ShoppingListView.js`: Fixed clearPurchased function

---

### 9. **Ingredients Miscategorized**

**Problem:**
- "Prawns" and "Prosciutto" appeared under "Other" instead of "Meat & Seafood"
- Incorrect categorization affected shopping list organization

**Root Cause:**
- Ingredients not in `INGREDIENT_CATEGORIES` mapping fell back to "Other"
- Prawns and prosciutto were missing from the mapping

**Solution:**
- Added missing ingredients to proper categories in `INGREDIENT_CATEGORIES`:
  ```javascript
  // Meat & Seafood
  'prawns': 'Meat & Seafood',
  'prosciutto': 'Meat & Seafood',
  ```

**Files Modified:**
- `shoppingListService.js`: Updated ingredient category mapping

**Result:**
- Prawns and prosciutto now categorized correctly
- Improved shopping list organization

---

### 10. **Generated Shopping List Not Persisting to Main App**

**Problem:**
- Generated shopping list from meal plan didn't appear when clicking "List" button
- Shopping list generator showed items but main shopping list was empty
- User experience broken - generated list wasn't accessible

**Root Cause:**
- ShoppingListView generated list locally but didn't save to app's main `shoppingList` state
- Two separate shopping list implementations not connected
- No callback to persist generated list back to app

**Solution:**
- Added `onSaveShoppingList` callback to ShoppingListView
- Updated App.js to handle save and navigate:
  ```javascript
  onSaveShoppingList={(generatedList) => {
    const items = [];
    Object.values(generatedList).forEach((itemsInCategory) => {
      itemsInCategory.forEach((item) => {
        items.push({
          id: `${item.name}-${Date.now()}-${Math.random()}`,
          ingredient: item.name,
          quantity: item.quantity || 1,
          unit: item.unit || 'piece',
          checked: false,
          recipeIds: item.recipes || [],
        });
      });
    });
    setShoppingList(items);
    setScreen('shopping');
  }}
  ```
- Added green "✓ Save Shopping List" button to ShoppingListView
- Converts categorized format to app's flat item list format

**Files Modified:**
- `ShoppingListView.js`: Added save button and onSaveShoppingList prop
- `App.js`: Added callback to persist and navigate

**Result:**
- Generated shopping lists now persist to main app
- Users can save and view generated lists in main shopping screen
- Complete workflow functional

---

## Testing & Validation

### Test Coverage
- ✅ All 532 unit tests passing
- ✅ Pre-commit checks: All passed
- ✅ Security audit: 0 vulnerabilities

### Manual QA Testing (Issue #102)
Tested all critical user flows:
- ✅ Add recipes to meal plan
- ✅ View recipes with titles and counts
- ✅ Navigate between weeks
- ✅ Generate shopping list
- ✅ Save shopping list to app
- ✅ Check off items
- ✅ Clear purchased items
- ✅ Clear all items
- ✅ Clear all recipes from meal plan
- ✅ Refresh shopping list

---

## Key Learnings

### Architecture Decisions

1. **Dual-Key AsyncStorage Strategy**
   - Store meal plan under both `@myrecipeapp/meal_plan` (namespaced) and `mealPlan` (legacy)
   - Ensures compatibility during migration period

2. **Date-Based Week Filtering**
   - Calculate week boundaries based on current date and weekOffset
   - Filter meals by comparing `assignedDate` with week start/end
   - Enables multi-week planning capability

3. **Recipe Lookup Pattern**
   - Create map of recipes: `recipeMap[recipe.id] = recipe`
   - Perform O(1) lookups instead of O(n) array searches
   - Fall back to mock data when real recipe not found

4. **State Management Flow**
   - Generated shopping list needs callback to main app
   - Convert between data formats (categorized → flat) at boundaries
   - Navigation should occur after state update completes

### Common Pitfalls Avoided

1. **Callback Parameter Loss**
   - Wrapping callbacks in extra arrow functions loses parameters
   - Pass raw function reference when possible

2. **Auto-Refresh Conflicts**
   - Aggressive auto-refresh interferes with user actions like clear
   - Use single initial load + manual refresh button instead

3. **Function Signature Mismatches**
   - Service functions expect specific input shapes
   - Direct implementation is clearer than service abstraction for simple operations

4. **Missing Ingredient Mappings**
   - Add new ingredients as they're discovered during testing
   - Map to most specific category, not "Other"

---

## Commits Referenced

| Commit | Message |
|--------|---------|
| `7b63b27` | feat: integrate meal plan with shopping list generator |
| `5ddde5b` | fix: resolve shopping list and meal plan UI issues |
| `5a19b6c` | feat: add save shopping list button to persist generated list |

---

## Files Modified Summary

| File | Purpose |
|------|---------|
| `App.js` | State management, callbacks, modal UI |
| `components/WeeklyMealPlanView.js` | Week-based display, recipe lookup, clear functionality |
| `ShoppingListView.js` | Shopping list UI, save functionality |
| `mealPlanningService.js` | Week filtering logic |
| `shoppingListService.js` | Shopping list generation, recipe lookup |

---

## Future Improvements

1. **Persist Shopping List State**
   - Save shopping list selections to AsyncStorage
   - Allow pausing/resuming shopping sessions

2. **Recipe Quantity Scaling**
   - Scale ingredient quantities based on serving size
   - Support dietary preference adjustments

3. **Shopping List Analytics**
   - Track most purchased ingredients
   - Suggest recipes based on purchase history

4. **Improved Week Navigation**
   - Calendar view for week selection
   - Jump to specific dates

---

## Questions for Developers

When implementing similar features, consider:

1. How will different data formats interact?
2. Should state changes trigger auto-updates or manual refresh?
3. What happens when components have access to multiple data sources?
4. How can we ensure consistency across AsyncStorage + state?
5. Should callbacks be wrapped or passed directly?

---

**Last Updated:** January 5, 2026  
**Status:** ✅ COMPLETED AND TESTED
