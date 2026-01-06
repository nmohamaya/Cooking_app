import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/theme';

// Import tab screens
import RecipesTab from '../screens/RecipesTab';
import MealPlanTab from '../screens/MealPlanTab';
import ShoppingTab from '../screens/ShoppingTab';

// Import detail screens
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import AddRecipeScreen from '../screens/AddRecipeScreen';
import EditRecipeScreen from '../screens/EditRecipeScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * Recipes Stack Navigator
 * Handles: Recipes List -> Recipe Detail -> Add/Edit
 */
function RecipesStackNavigator({ 
  recipes, 
  onAddRecipe, 
  onSelectRecipe, 
  onUpdateRecipe,
  onDeleteRecipe,
  searchQuery,
  setSearchQuery,
  filters,
  setFilters,
  sortBy,
  setSortBy,
  mealPlan,
  onAddToMealPlan
}) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}
    >
      <Stack.Screen
        name="RecipesList"
        options={{ headerShown: false }}
      >
        {(props) => (
          <RecipesTab
            {...props}
            recipes={recipes}
            onAddRecipe={onAddRecipe}
            onSelectRecipe={onSelectRecipe}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filters={filters}
            setFilters={setFilters}
            sortBy={sortBy}
            setSortBy={setSortBy}
            mealPlan={mealPlan}
            onAddToMealPlan={onAddToMealPlan}
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="RecipeDetail"
        options={{ headerShown: false }}
      >
        {(props) => (
          <RecipeDetailScreen
            {...props}
            recipe={props.route.params?.recipe}
            onEdit={() => {
              props.navigation.navigate('EditRecipe', { 
                recipe: props.route.params?.recipe 
              });
            }}
            onDelete={(recipeId) => {
              onDeleteRecipe(recipeId);
              props.navigation.goBack();
            }}
            mealPlan={mealPlan}
            onAddToMealPlan={onAddToMealPlan}
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="AddRecipe"
        options={{ headerShown: false }}
      >
        {(props) => (
          <AddRecipeScreen
            {...props}
            onAddRecipe={(newRecipe) => {
              onAddRecipe(newRecipe);
              props.navigation.goBack();
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="EditRecipe"
        options={{ headerShown: false }}
      >
        {(props) => (
          <EditRecipeScreen
            {...props}
            recipe={props.route.params?.recipe}
            onUpdateRecipe={(updatedRecipe) => {
              onUpdateRecipe(updatedRecipe);
              props.navigation.goBack();
            }}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

/**
 * Meal Plan Stack Navigator
 * Handles: Meal Plan view
 */
function MealPlanStackNavigator({ mealPlan, recipes, onUpdateMealPlan }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}
    >
      <Stack.Screen
        name="MealPlanScreen"
        options={{ headerShown: false }}
      >
        {(props) => (
          <MealPlanTab
            {...props}
            mealPlan={mealPlan}
            recipes={recipes}
            onUpdateMealPlan={onUpdateMealPlan}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

/**
 * Shopping Stack Navigator
 * Handles: Shopping List view
 */
function ShoppingStackNavigator({ shoppingList, recipes, onUpdateShoppingList }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}
    >
      <Stack.Screen
        name="ShoppingListScreen"
        options={{ headerShown: false }}
      >
        {(props) => (
          <ShoppingTab
            {...props}
            shoppingList={shoppingList}
            recipes={recipes}
            onUpdateShoppingList={onUpdateShoppingList}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

/**
 * Main Bottom Tab Navigator
 * Displays: Recipes, Meal Plan, Shopping List
 */
export function BottomTabsNavigator(props) {
  const {
    recipes,
    shoppingList,
    mealPlan,
    onAddRecipe,
    onSelectRecipe,
    onUpdateRecipe,
    onDeleteRecipe,
    onUpdateShoppingList,
    onUpdateMealPlan,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    sortBy,
    setSortBy,
  } = props;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primaryWarm,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.bgPrimary,
          borderTopColor: colors.borderLight,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'RecipesStack') {
            iconName = 'book';
          } else if (route.name === 'MealPlanStack') {
            iconName = 'calendar';
          } else if (route.name === 'ShoppingStack') {
            iconName = 'cart';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="RecipesStack"
        options={{
          title: 'Recipes',
          lazy: false,
        }}
      >
        {(props) => (
          <RecipesStackNavigator
            {...props}
            recipes={recipes}
            onAddRecipe={onAddRecipe}
            onSelectRecipe={onSelectRecipe}
            onUpdateRecipe={onUpdateRecipe}
            onDeleteRecipe={onDeleteRecipe}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filters={filters}
            setFilters={setFilters}
            sortBy={sortBy}
            setSortBy={setSortBy}
            mealPlan={mealPlan}
            onAddToMealPlan={onUpdateMealPlan}
          />
        )}
      </Tab.Screen>

      <Tab.Screen
        name="MealPlanStack"
        options={{
          title: 'Meal Plan',
          lazy: false,
        }}
      >
        {(props) => (
          <MealPlanStackNavigator
            {...props}
            mealPlan={mealPlan}
            recipes={recipes}
            onUpdateMealPlan={onUpdateMealPlan}
          />
        )}
      </Tab.Screen>

      <Tab.Screen
        name="ShoppingStack"
        options={{
          title: 'Shopping',
          lazy: false,
        }}
      >
        {(props) => (
          <ShoppingStackNavigator
            {...props}
            shoppingList={shoppingList}
            recipes={recipes}
            onUpdateShoppingList={onUpdateShoppingList}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

/**
 * Root Navigator with NavigationContainer
 */
export function RootNavigator(props) {
  return (
    <NavigationContainer>
      <BottomTabsNavigator {...props} />
    </NavigationContainer>
  );
}
