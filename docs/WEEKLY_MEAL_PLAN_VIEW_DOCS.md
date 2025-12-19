# Weekly Meal Plan View - Component Documentation

## Overview

The **Weekly Meal Plan View** is a comprehensive React Native component that displays a user's entire week's meal plan in an intuitive, organized format. It integrates seamlessly with the [Meal Planning Service](./MEAL_PLANNING_SERVICE_DOCS.md) to provide full CRUD operations on meal assignments.

## Features

✅ **7-Day Visual Grid** - Display all days of the week with organized meal slots
✅ **4 Meal Types** - Breakfast, Lunch, Dinner, and Snacks for each day
✅ **Color-Coded Meals** - Visually distinct colors for each meal type
✅ **Week Navigation** - Browse current and future weeks
✅ **Quick Actions** - Add/remove recipes with single tap
✅ **Today Indicator** - Highlights current day for quick reference
✅ **Week Summary** - Shows total unique recipes and meals
✅ **Empty States** - Clear indication when no meals are planned
✅ **AsyncStorage Integration** - Automatic persistence of meal plans
✅ **Responsive Design** - Works on all screen sizes

## Component Hierarchy

```
WeeklyMealPlanView (Main Container)
├── Navigation Bar
│   ├── Previous Week Button
│   ├── Week Info (number, summary)
│   └── Next Week Button
└── Days Container (ScrollView)
    └── DayCard (×7 for each day)
        ├── Day Header (name, today badge)
        └── Meals Container
            └── MealSection (×4 for each meal type)
                ├── Meal Header (type, count)
                ├── Recipes List
                │   └── RecipeItem (×n recipes)
                │       ├── Recipe Name (tappable)
                │       └── Remove Button
                └── Empty Slot (+ Add meal)
```

## Component API

### WeeklyMealPlanView

Main component that manages the entire meal plan view.

**Props:**
```javascript
{
  onRecipePress: (recipeId: string) => void,       // Called when recipe is tapped
  onMealSlotPress: (dayOfWeek: number, mealType: string) => void,  // Empty slot tap
  onRecipeRemove: (recipeId: string, dayOfWeek: number, mealType: string) => void  // Remove
}
```

**State:**
```javascript
{
  mealPlan: Array,           // Current meal plan from AsyncStorage
  weekOffset: number,        // Current week offset (0 = this week)
  loading: boolean,          // Loading state
  weekPlanData: Object       // Organized week data
}
```

**Methods:**
- `loadMealPlan()` - Loads meal plan from AsyncStorage
- `saveMealPlan(newPlan)` - Saves updated plan to AsyncStorage
- `handleRecipeRemove(recipeId, dayOfWeek, mealType)` - Removes recipe and saves
- `getTotalRecipes()` - Counts unique recipes
- `getWeekSummary()` - Returns summary statistics

**Example Usage:**
```javascript
import WeeklyMealPlanView from './components/WeeklyMealPlanView';

function MealPlanScreen() {
  const handleRecipePress = (recipeId) => {
    navigation.navigate('RecipeDetail', { recipeId });
  };

  const handleMealSlotPress = (dayOfWeek, mealType) => {
    navigation.navigate('AddRecipe', { dayOfWeek, mealType });
  };

  const handleRecipeRemove = (recipeId, dayOfWeek, mealType) => {
    showAlert(`Removed ${recipeId} from ${mealType}`);
  };

  return (
    <WeeklyMealPlanView
      onRecipePress={handleRecipePress}
      onMealSlotPress={handleMealSlotPress}
      onRecipeRemove={handleRecipeRemove}
    />
  );
}
```

---

### DayCard

Displays a single day's meals organized by meal type.

**Internal Component (not exported)**

**Props:**
```javascript
{
  dayOfWeek: number,         // 0-6 (0=Sunday)
  dayName: string,          // Day name (Monday, Tuesday, etc.)
  mealData: Object,         // Meal data for the day
  onRecipePress: Function,
  onMealSlotPress: Function,
  onRecipeRemove: Function
}
```

**Features:**
- Displays day name and date
- Highlights today's card with special styling
- Shows all 4 meal types for the day
- Organizes meals by type

---

### MealSection

Displays a single meal type with its assigned recipes.

**Internal Component (not exported)**

**Props:**
```javascript
{
  mealType: string,         // 'breakfast' | 'lunch' | 'dinner' | 'snacks'
  recipes: Array,           // Recipe IDs for this meal
  dayOfWeek: number,
  onRecipePress: Function,
  onAddRecipe: Function,    // Called for empty slots
  onRemoveRecipe: Function
}
```

**Color Mapping:**
- Breakfast: `#FF9500` (Orange)
- Lunch: `#34C759` (Green)
- Dinner: `#FF3B30` (Red)
- Snacks: `#AF52DE` (Purple)

**Features:**
- Color-coded headers by meal type
- Shows recipe count
- Displays recipes with remove buttons
- Shows empty slot for adding recipes

---

### RecipeItem

Displays a single recipe in a meal section.

**Internal Component (not exported)**

**Props:**
```javascript
{
  recipeId: string,
  mealColor: string,        // Hex color for meal type
  onPress: Function,
  onRemove: Function
}
```

**Features:**
- Tappable recipe name
- Remove button (✕)
- Color-coded left border

---

## Styling

The component uses React Native's `StyleSheet` for optimized performance.

**Key Styles:**
- **Navigation Bar**: Fixed top with week controls
- **Day Cards**: White cards with subtle shadows and borders
- **Today Card**: Special border and background color
- **Meal Sections**: Organized with color-coded left borders
- **Empty Slots**: Dashed borders indicating slots to fill
- **Color Scheme**: Consistent with meal type colors

## Data Flow

```
┌─────────────────────────────────────────┐
│   AsyncStorage (Persistent Storage)     │
│   Key: '@myrecipeapp/meal_plan'        │
└──────────────┬──────────────────────────┘
               │
               ↓
      ┌────────────────────┐
      │  WeeklyMealPlanView│ (Load on mount)
      │  - mealPlan state  │
      └────────┬───────────┘
               │
      ┌────────↓────────┐
      │ getWeeklyMealPlan│ (From mealPlanningService)
      │ Transforms data │
      └────────┬────────┘
               │
               ↓
      ┌─────────────────┐
      │  weekPlanData   │ (Organized by day/meal type)
      │  7 Days × 4     │
      │  Meal Types     │
      └─────────────────┘
               │
               ↓
      ┌─────────────────┐
      │   UI Rendering  │
      │  DayCards       │
      │  MealSections   │
      │  RecipeItems    │
      └─────────────────┘
```

## Storage

Meal plans are persisted in AsyncStorage as JSON:

**Key:** `@myrecipeapp/meal_plan`

**Format:**
```javascript
[
  {
    id: "recipe1-1-lunch-1702988400000",
    recipeId: "recipe1",
    dayOfWeek: 1,
    mealType: "lunch",
    assignedDate: "2025-12-19T12:00:00Z"
  },
  // ... more meals
]
```

## Test Coverage

Comprehensive test suite with 26+ tests covering:

✅ **Data Processing**
- Calculating total/unique recipes
- Meal organization by type and day
- Duplicate recipe handling

✅ **Navigation**
- Week offset calculations
- Previous/next week controls
- Week number display

✅ **Empty States**
- Empty meal plan detection
- Empty day detection
- Empty meal slot handling

✅ **Organization**
- Days of week mapping
- Meal type grouping
- Color coding

✅ **Edge Cases**
- Special characters in recipe names
- Very long recipe names
- Multiple recipes in single slot
- Full week meal plans (28 recipes)

✅ **Integration**
- Meal planning service integration
- MEAL_TYPES constant usage
- DAYS_OF_WEEK constant usage

**Run Tests:**
```bash
npm test -- WeeklyMealPlanView.test.js
```

## Performance Considerations

1. **FlatList Alternative**: Uses ScrollView for simplicity. For 1000+ items, consider FlatList
2. **AsyncStorage Calls**: Debounce save operations if making frequent updates
3. **State Management**: Consider Redux for complex state in larger apps
4. **Memoization**: Use `React.memo()` for DayCard/MealSection if performance degrades

## Accessibility

- Color-coded meals use contrasting colors for visibility
- Touch targets are adequate for accessibility (44x44 minimum)
- Clear labels for all interactive elements
- Consider adding `accessible` prop and `accessibilityLabel` for screen readers

## Future Enhancements

1. **Swipe Navigation** - Swipe left/right to change weeks
2. **Drag & Drop** - Reorder meals by dragging
3. **Quick Actions** - Swipe to remove recipes
4. **Filters** - Filter by meal type, dietary preferences
5. **Sharing** - Share meal plan with family
6. **Export** - Export as PDF/image
7. **Analytics** - Track meal planning patterns
8. **Notifications** - Remind users to cook today's meals

## Integration with Related Features

This component works with:
- **[Meal Planning Service](./MEAL_PLANNING_SERVICE_DOCS.md)** - Core meal management
- **[Shopping List Generator](../SHOPPING_LIST_DOCS.md)** - Generate shopping lists from meals (Issue #67)
- **[Recipe Details Screen](../screens/RecipeDetailScreen.js)** - View full recipe info
- **[Add Recipe Screen](../screens/AddRecipeScreen.js)** - Add meals to plan

## Troubleshooting

### Issue: Meals not persisting
**Solution:** Verify AsyncStorage is properly initialized and permissions are granted

### Issue: Week navigation not working
**Solution:** Check if `weekOffset` state is updating correctly

### Issue: Colors not displaying
**Solution:** Ensure React Native Styles are being applied; check StyleSheet.create()

### Issue: Performance degradation with many recipes
**Solution:** Consider switching to FlatList or virtualizing the list

## Related Issues

- **Issue #65**: Meal Planning Service (core functionality)
- **Issue #66**: Weekly Meal Plan View UI (this component)
- **Issue #67**: Shopping List Generator
- **Issue #68**: PR for Meal Planning Service

---

**Version:** 1.0.0
**Last Updated:** December 19, 2025
**Status:** Development Complete - Ready for Integration Testing
