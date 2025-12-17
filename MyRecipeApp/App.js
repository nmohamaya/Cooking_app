import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput, ScrollView, Image, Linking, ActivityIndicator, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { extractRecipeFromText } from './services/recipeExtraction';

export default function App() {
  const [recipes, setRecipes] = useState([]);
  const [screen, setScreen] = useState('home'); // 'home', 'add', 'detail', 'edit'
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [extracting, setExtracting] = useState(false); // Loading state for extraction
  const [showExtractionModal, setShowExtractionModal] = useState(false);
  const [extractionText, setExtractionText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateRecipeTitle, setDuplicateRecipeTitle] = useState('');
  
  // Search and Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    prepTimeMax: null, // in minutes
    cookTimeMax: null, // in minutes
  });
  const [sortBy, setSortBy] = useState('title-asc'); // 'title-asc', 'title-desc', 'date-new', 'date-old'
  
  // Shopping List state
  const [shoppingList, setShoppingList] = useState([]); // Array of { ingredient, quantity, unit, checked, recipeIds }
  
  const [form, setForm] = useState({ 
    title: '', 
    category: '', 
    ingredients: '', 
    instructions: '', 
    prepTime: '', 
    cookTime: '', 
    imageUri: '',
    videoUrl: ''
  });

  // Load recipes and shopping list on mount
  useEffect(() => {
    loadRecipes();
    loadShoppingList();
  }, []);

  const loadRecipes = async () => {
    try {
      const stored = await AsyncStorage.getItem('recipes');
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecipes(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
    }
  };

  const saveRecipes = async (newRecipes) => {
    try {
      await AsyncStorage.setItem('recipes', JSON.stringify(newRecipes));
      setRecipes(newRecipes);
    } catch (error) {
      console.error('Error saving recipes:', error);
    }
  };

  const loadShoppingList = async () => {
    try {
      const stored = await AsyncStorage.getItem('shoppingList');
      if (stored) {
        const parsed = JSON.parse(stored);
        setShoppingList(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Error loading shopping list:', error);
    }
  };

  const saveShoppingList = async (newList) => {
    try {
      await AsyncStorage.setItem('shoppingList', JSON.stringify(newList));
      setShoppingList(newList);
    } catch (error) {
      console.error('Error saving shopping list:', error);
    }
  };

  const addRecipe = () => {
    if (!form.title.trim()) {
      Alert.alert('Error', 'Please enter a recipe title');
      return;
    }
    const newRecipe = {
      id: String(Date.now()),
      title: String(form.title),
      category: String(form.category),
      ingredients: String(form.ingredients),
      instructions: String(form.instructions),
      prepTime: String(form.prepTime),
      cookTime: String(form.cookTime),
      imageUri: String(form.imageUri || ''),
      videoUrl: String(form.videoUrl || ''),
    };
    saveRecipes([...recipes, newRecipe]);
    resetForm();
    setScreen('home');
  };

  const updateRecipe = () => {
    if (!form.title.trim()) {
      Alert.alert('Error', 'Please enter a recipe title');
      return;
    }
    const updated = recipes.map(r =>
      r.id === selectedRecipe.id
        ? {
            id: String(selectedRecipe.id),
            title: String(form.title),
            category: String(form.category),
            ingredients: String(form.ingredients),
            instructions: String(form.instructions),
            prepTime: String(form.prepTime),
            cookTime: String(form.cookTime),
            imageUri: String(form.imageUri || ''),
            videoUrl: String(form.videoUrl || ''),
          }
        : r
    );
    saveRecipes(updated);
    resetForm();
    setScreen('home');
  };

  const deleteRecipe = (id) => {
    setRecipeToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (recipeToDelete) {
      saveRecipes(recipes.filter(r => r.id !== recipeToDelete));
      setShowDeleteModal(false);
      setRecipeToDelete(null);
      setScreen('home');
    }
  };

  const resetForm = () => {
    setForm({ title: '', category: '', ingredients: '', instructions: '', prepTime: '', cookTime: '', imageUri: '', videoUrl: '' });
    setSelectedRecipe(null);
  };

  // Helper function to parse time strings (e.g., "15 minutes", "1 hour", "30 min")
  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const lower = timeStr.toLowerCase();
    let minutes = 0;
    
    // Extract numbers
    const hourMatch = lower.match(/(\d+)\s*(hour|hr)/);
    const minMatch = lower.match(/(\d+)\s*(minute|min)/);
    
    if (hourMatch) minutes += parseInt(hourMatch[1]) * 60;
    if (minMatch) minutes += parseInt(minMatch[1]);
    
    // If no match but contains a number, assume minutes
    if (minutes === 0) {
      const numMatch = timeStr.match(/(\d+)/);
      if (numMatch) minutes = parseInt(numMatch[1]);
    }
    
    return minutes;
  };

  // Search and filter logic
  const getFilteredRecipes = () => {
    let filtered = [...recipes];

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(recipe =>
        recipe.title.toLowerCase().includes(query) ||
        recipe.ingredients.toLowerCase().includes(query) ||
        recipe.category.toLowerCase().includes(query)
      );
    }

    // Apply time filters
    if (filters.prepTimeMax !== null) {
      filtered = filtered.filter(recipe => {
        const prepMinutes = parseTimeToMinutes(recipe.prepTime);
        // Include recipes with no prep time (0) or prep time within limit
        return prepMinutes <= filters.prepTimeMax;
      });
    }

    if (filters.cookTimeMax !== null) {
      filtered = filtered.filter(recipe => {
        const cookMinutes = parseTimeToMinutes(recipe.cookTime);
        // Include recipes with no cook time (0) or cook time within limit
        return cookMinutes <= filters.cookTimeMax;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'date-new':
          return parseInt(b.id) - parseInt(a.id); // Newer first
        case 'date-old':
          return parseInt(a.id) - parseInt(b.id); // Older first
        default:
          return 0;
      }
    });

    return filtered;
  };

  const clearFilters = () => {
    setFilters({ prepTimeMax: null, cookTimeMax: null });
    setSearchQuery('');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.prepTimeMax !== null) count++;
    if (filters.cookTimeMax !== null) count++;
    return count;
  };

  // Shopping List Functions
  const normalizeUnit = (unit) => {
    if (!unit) return '';
    const lower = unit.toLowerCase();
    // Normalize plural forms
    const unitMap = {
      'cups': 'cup', 'tablespoons': 'tablespoon', 'tbsp': 'tablespoon',
      'teaspoons': 'teaspoon', 'tsp': 'teaspoon',
      'ounces': 'ounce', 'oz': 'ounce',
      'pounds': 'pound', 'lbs': 'pound', 'lb': 'pound',
      'grams': 'gram', 'g': 'gram',
      'kilograms': 'kilogram', 'kg': 'kilogram',
      'milliliters': 'milliliter', 'ml': 'milliliter',
      'liters': 'liter', 'l': 'liter',
      'cloves': 'clove', 'pieces': 'piece', 'slices': 'slice'
    };
    return unitMap[lower] || lower;
  };

  const parseIngredient = (ingredientLine) => {
    // Parse ingredient line into quantity, unit, and ingredient
    const line = ingredientLine.trim();
    if (!line) return null;

    // Skip section headers (lines ending with colon, or starting with "For")
    if (line.endsWith(':') || /^For (the|a|an)\s/i.test(line)) {
      return null;
    }

    // Handle combined ingredients like "salt and pepper"
    if (line.toLowerCase().includes(' and ')) {
      const parts = line.split(/\s+and\s+/i);
      if (parts.length === 2) {
        // Check if it's something like "1 salt and pepper" or "salt and pepper"
        const firstPart = parts[0].trim();
        const secondPart = parts[1].trim();
        
        // Check if first part has just a number
        const numberMatch = firstPart.match(/^(\d+)\s+(.+)$/);
        if (numberMatch) {
          const quantity = parseFloat(numberMatch[1]);
          const firstIngredient = numberMatch[2].trim();
          
          // Return array of two ingredients with same quantity
          return [
            { ingredient: firstIngredient, quantity: quantity, unit: '' },
            { ingredient: secondPart, quantity: quantity, unit: '' }
          ];
        }
        
        // Check if entire thing is "salt and pepper" (no quantity)
        if (!firstPart.match(/\d/) && !secondPart.match(/\d/)) {
          return [
            { ingredient: firstPart, quantity: 1, unit: '' },
            { ingredient: secondPart, quantity: 1, unit: '' }
          ];
        }
      }
    }

    // Common units to match
    const units = ['cup', 'cups', 'tablespoon', 'tablespoons', 'tbsp', 'teaspoon', 'teaspoons', 'tsp', 
                   'ounce', 'ounces', 'oz', 'pound', 'pounds', 'lb', 'lbs', 'gram', 'grams', 'g', 
                   'kilogram', 'kilograms', 'kg', 'milliliter', 'milliliters', 'ml', 'liter', 'liters', 'l',
                   'clove', 'cloves', 'piece', 'pieces', 'slice', 'slices', 'pinch', 'dash',
                   'large', 'medium', 'small'];
    
    // Try to match numbers and fractions at the start
    const numberPattern = /^(\d+)?\s*(\d+\/\d+)?\s+(.+)$/;
    const match = line.match(numberPattern);
    
    if (match) {
      const [, whole, fraction, remainder] = match;
      let quantity = 0;
      
      // Parse quantity
      if (whole) quantity += parseFloat(whole);
      if (fraction) {
        const [num, den] = fraction.split('/').map(Number);
        if (num && den) quantity += num / den;
      }
      
      // If no quantity found, set to 1
      if (!whole && !fraction) quantity = 1;
      
      // Now parse remainder for unit and ingredient
      const remainderParts = remainder.trim().split(/\s+/);
      const firstWord = remainderParts[0];
      const isUnit = firstWord && units.some(u => u.toLowerCase() === firstWord.toLowerCase());
      
      if (isUnit) {
        const unit = normalizeUnit(firstWord);
        let ingredient = remainderParts.slice(1).join(' ');
        
        // Clean up ingredient name
        ingredient = cleanIngredientName(ingredient);
        
        return {
          ingredient: ingredient || firstWord,
          quantity: quantity,
          unit: unit,
        };
      } else {
        // No unit, remainder is all ingredient
        let ingredient = remainder.trim();
        ingredient = cleanIngredientName(ingredient);
        
        return {
          ingredient: ingredient,
          quantity: quantity,
          unit: '',
        };
      }
    }
    
    // If no match, treat entire line as ingredient with quantity 1
    return {
      ingredient: cleanIngredientName(line),
      quantity: 1,
      unit: '',
    };
  };

  // Helper function to clean ingredient names for better aggregation
  const cleanIngredientName = (name) => {
    if (!name) return '';
    
    // Remove parenthetical notes (e.g., "about 3 large eggs", "room temperature")
    name = name.replace(/\([^)]*\)/g, '').trim();
    
    // Remove preparation notes after commas (e.g., "sifted", "chopped", "minced")
    name = name.replace(/,\s*(sifted|chopped|minced|diced|sliced|cubed|finely chopped|at room temperature|softened|melted|beaten|whisked).*$/i, '').trim();
    
    // Remove common trailing preparation phrases
    name = name.replace(/\s+(at room temperature|room temperature|softened|melted|beaten|whisked|finely chopped|chopped|minced|diced|sliced)$/i, '').trim();
    
    return name;
  };

  // Normalize ingredient names to base forms for better aggregation
  const normalizeIngredientForAggregation = (parsed) => {
    if (!parsed) return null;
    
    let { ingredient, quantity, unit } = parsed;
    const lowerIngredient = ingredient.toLowerCase();
    
    // Normalize egg-based ingredients to "eggs"
    if (lowerIngredient.includes('egg white') || lowerIngredient === 'egg whites') {
      // Approximate conversion: 30-33g egg white ≈ 1 egg white, 2 egg whites ≈ 1 egg
      if (unit === 'gram' && quantity >= 30) {
        quantity = Math.ceil(quantity / 60); // ~60g = 1 egg
      } else if (unit === '') {
        quantity = Math.ceil(quantity / 2); // 2 whites ≈ 1 egg
      }
      ingredient = 'eggs';
      unit = '';
    } else if (lowerIngredient.includes('egg yolk') || lowerIngredient === 'egg yolks') {
      // Approximate conversion: ~18g egg yolk ≈ 1 yolk, 3 yolks ≈ 1 egg
      if (unit === 'gram' && quantity >= 18) {
        quantity = Math.ceil(quantity / 54); // ~54g = 1 egg
      } else if (unit === '') {
        quantity = Math.ceil(quantity / 3); // 3 yolks ≈ 1 egg
      }
      ingredient = 'eggs';
      unit = '';
    } else if (lowerIngredient === 'egg' || lowerIngredient === 'eggs' || 
               lowerIngredient.includes('large egg') || lowerIngredient.includes('whole egg')) {
      ingredient = 'eggs';
      unit = '';
    }
    
    // Normalize sugar types
    if (lowerIngredient.includes('brown sugar')) {
      ingredient = 'brown sugar';
      // Convert to grams for aggregation
      if (unit === 'cup' || unit === 'cups') {
        quantity = quantity * 220; // 1 cup = 220g
        unit = 'gram';
      } else if (unit === 'tablespoon' || unit === 'tbsp') {
        quantity = quantity * 14; // 1 tbsp = 14g
        unit = 'gram';
      } else if (unit === 'teaspoon' || unit === 'tsp') {
        quantity = quantity * 4.5; // 1 tsp = 4.5g
        unit = 'gram';
      } else if (unit === '') {
        unit = 'gram';
      }
    } else if (lowerIngredient.includes('powdered sugar') || lowerIngredient.includes('confectioners') || 
               lowerIngredient.includes('icing sugar') || lowerIngredient.includes("confectioner's sugar")) {
      ingredient = 'powdered sugar';
      // Convert to grams for aggregation
      if (unit === 'cup' || unit === 'cups') {
        quantity = quantity * 120; // 1 cup = 120g
        unit = 'gram';
      } else if (unit === 'tablespoon' || unit === 'tbsp') {
        quantity = quantity * 7.5; // 1 tbsp = 7.5g
        unit = 'gram';
      } else if (unit === 'teaspoon' || unit === 'tsp') {
        quantity = quantity * 2.5; // 1 tsp = 2.5g
        unit = 'gram';
      } else if (unit === '') {
        unit = 'gram';
      }
    } else if (lowerIngredient.includes('granulated sugar') || lowerIngredient.includes('white sugar') || 
               lowerIngredient === 'sugar' || lowerIngredient === 'caster sugar') {
      ingredient = 'sugar';
      // Convert to grams for aggregation
      if (unit === 'cup' || unit === 'cups') {
        quantity = quantity * 200; // 1 cup = 200g
        unit = 'gram';
      } else if (unit === 'tablespoon' || unit === 'tbsp') {
        quantity = quantity * 12.5; // 1 tbsp = 12.5g
        unit = 'gram';
      } else if (unit === 'teaspoon' || unit === 'tsp') {
        quantity = quantity * 4; // 1 tsp = 4g
        unit = 'gram';
      } else if (unit === '') {
        unit = 'gram';
      }
    }
    
    // Normalize butter
    if (lowerIngredient.includes('butter') && !lowerIngredient.includes('peanut') && !lowerIngredient.includes('almond')) {
      ingredient = 'butter';
      // Convert stick/ounce to grams for aggregation
      if (unit === '' || unit === 'stick' || unit === 'sticks') {
        quantity = quantity * 113; // 1 stick = 113g (4 oz)
        unit = 'gram';
      } else if (unit === 'ounce' || unit === 'oz') {
        quantity = quantity * 28.35; // 1 oz = 28.35g
        unit = 'gram';
      } else if (unit === 'pound' || unit === 'lb') {
        quantity = quantity * 453.6; // 1 lb = 453.6g
        unit = 'gram';
      }
    }
    
    // Normalize flour types
    if (lowerIngredient.includes('all-purpose flour') || lowerIngredient.includes('all purpose flour')) {
      ingredient = 'all-purpose flour';
      // Convert to grams for aggregation
      if (unit === 'cup' || unit === 'cups') {
        quantity = quantity * 125; // 1 cup = 125g
        unit = 'gram';
      } else if (unit === 'tablespoon' || unit === 'tbsp') {
        quantity = quantity * 8; // 1 tbsp = 8g
        unit = 'gram';
      } else if (unit === 'teaspoon' || unit === 'tsp') {
        quantity = quantity * 2.6; // 1 tsp = 2.6g
        unit = 'gram';
      } else if (unit === '' || unit === 'ounce' || unit === 'oz') {
        if (unit === 'ounce' || unit === 'oz') {
          quantity = quantity * 28.35;
        }
        unit = 'gram';
      }
    } else if (lowerIngredient.includes('flour') && !lowerIngredient.includes('almond')) {
      ingredient = 'flour';
      // Convert to grams for aggregation
      if (unit === 'cup' || unit === 'cups') {
        quantity = quantity * 125; // 1 cup = 125g
        unit = 'gram';
      } else if (unit === 'tablespoon' || unit === 'tbsp') {
        quantity = quantity * 8; // 1 tbsp = 8g
        unit = 'gram';
      } else if (unit === 'teaspoon' || unit === 'tsp') {
        quantity = quantity * 2.6; // 1 tsp = 2.6g
        unit = 'gram';
      } else if (unit === '' || unit === 'ounce' || unit === 'oz') {
        if (unit === 'ounce' || unit === 'oz') {
          quantity = quantity * 28.35;
        }
        unit = 'gram';
      }
    }
    
    // Normalize salt types
    if (lowerIngredient === 'salt' || lowerIngredient.includes('sea salt') || 
        lowerIngredient.includes('kosher salt') || lowerIngredient.includes('table salt') ||
        lowerIngredient.includes('fine salt') || lowerIngredient.includes('coarse salt') ||
        lowerIngredient === 'of salt' || lowerIngredient.endsWith(' salt')) {
      ingredient = 'salt';
      // Convert pinch/dash to teaspoons for aggregation
      if (unit === 'pinch' || unit === 'dash') {
        quantity = quantity * 0.0625; // 1 pinch ≈ 1/16 teaspoon
        unit = 'teaspoon';
      } else if (unit === '') {
        unit = 'teaspoon';
      }
    }
    
    // Normalize garlic
    if (lowerIngredient === 'garlic' || lowerIngredient === 'garlic clove' || 
        lowerIngredient === 'garlic cloves' || lowerIngredient.includes('clove of garlic') ||
        lowerIngredient.includes('cloves of garlic') || lowerIngredient === 'of garlic' ||
        lowerIngredient.endsWith(' garlic')) {
      ingredient = 'garlic';
      // Normalize unit to clove
      if (unit === 'cloves' || unit === 'clove') {
        unit = 'clove';
      } else if (unit === '') {
        unit = 'clove';
      }
    }
    
    // Normalize pepper
    if (lowerIngredient === 'black pepper' || lowerIngredient === 'pepper' ||
        lowerIngredient.includes('ground black pepper') || lowerIngredient.includes('freshly ground pepper') ||
        lowerIngredient === 'of pepper' || lowerIngredient === 'of black pepper' ||
        lowerIngredient.endsWith(' pepper') || lowerIngredient.endsWith(' black pepper')) {
      ingredient = 'black pepper';
      // Convert pinch/dash to teaspoons for aggregation
      if (unit === 'pinch' || unit === 'dash') {
        quantity = quantity * 0.0625; // 1 pinch ≈ 1/16 teaspoon
        unit = 'teaspoon';
      } else if (unit === '') {
        unit = 'teaspoon';
      }
    }
    
    // Convert common units to grams for better aggregation
    const convertedToGrams = convertToGrams(ingredient, quantity, unit);
    if (convertedToGrams) {
      quantity = convertedToGrams.quantity;
      unit = convertedToGrams.unit;
    }
    
    return { ingredient, quantity, unit };
  };

  // Convert measurements to grams for common ingredients
  const convertToGrams = (ingredient, quantity, unit) => {
    if (unit === 'gram' || unit === 'g') {
      return { quantity, unit: 'gram' };
    }
    
    const lowerIngredient = ingredient.toLowerCase();
    const conversions = {
      'powdered sugar': { 'cup': 120, 'tablespoon': 7.5, 'teaspoon': 2.5 },
      'sugar': { 'cup': 200, 'tablespoon': 12.5, 'teaspoon': 4 },
      'brown sugar': { 'cup': 220, 'tablespoon': 14, 'teaspoon': 4.5 },
      'flour': { 'cup': 125, 'tablespoon': 8, 'teaspoon': 2.6 },
      'all-purpose flour': { 'cup': 125, 'tablespoon': 8, 'teaspoon': 2.6 },
      'butter': { 'cup': 227, 'tablespoon': 14, 'teaspoon': 4.7 },
    };
    
    // Check if we have a conversion for this ingredient and unit
    if (conversions[lowerIngredient] && conversions[lowerIngredient][unit]) {
      const gramsPerUnit = conversions[lowerIngredient][unit];
      return { quantity: Math.round(quantity * gramsPerUnit), unit: 'gram' };
    }
    
    // If no conversion available, keep original
    return null;
  };

  const addRecipeToShoppingList = (recipe) => {
    if (!recipe.ingredients) {
      Alert.alert('No Ingredients', 'This recipe has no ingredients to add.');
      return;
    }

    // Check if this recipe has already been added to the shopping list
    const alreadyAdded = shoppingList.some(item => item.recipeIds && item.recipeIds.includes(recipe.id));
    
    if (alreadyAdded) {
      setDuplicateRecipeTitle(recipe.title);
      setShowDuplicateModal(true);
      return;
    }

    const ingredientLines = recipe.ingredients.split('\n').filter(line => line.trim());
    const newItems = [];
    const updatedExistingItems = [...shoppingList]; // Create a copy to track updates

    ingredientLines.forEach(line => {
      const parsed = parseIngredient(line);
      if (!parsed) return;

      // Handle case where parseIngredient returns an array (for combined ingredients like "salt and pepper")
      const parsedArray = Array.isArray(parsed) ? parsed : [parsed];

      parsedArray.forEach(item => {
        // Normalize ingredient for better aggregation
        const normalized = normalizeIngredientForAggregation(item);
        if (!normalized) return;

        // Check if ingredient already exists in shopping list
        const existingIndex = updatedExistingItems.findIndex(existingItem => 
          existingItem.ingredient.toLowerCase() === normalized.ingredient.toLowerCase() &&
          existingItem.unit.toLowerCase() === normalized.unit.toLowerCase()
        );

        if (existingIndex >= 0) {
          // Aggregate quantities with existing shopping list item
          updatedExistingItems[existingIndex] = {
            ...updatedExistingItems[existingIndex],
            quantity: updatedExistingItems[existingIndex].quantity + normalized.quantity,
            recipeIds: [...(updatedExistingItems[existingIndex].recipeIds || []), recipe.id]
          };
        } else {
          // Check if ingredient already exists in newItems from this recipe
          const newItemIndex = newItems.findIndex(newItem =>
            newItem.ingredient.toLowerCase() === normalized.ingredient.toLowerCase() &&
            newItem.unit.toLowerCase() === normalized.unit.toLowerCase()
          );

          if (newItemIndex >= 0) {
            // Aggregate quantities with existing new item
            newItems[newItemIndex].quantity += normalized.quantity;
          } else {
            // Add new item
            newItems.push({
              id: String(Date.now() + Math.random()),
              ingredient: normalized.ingredient,
              quantity: normalized.quantity,
              unit: normalized.unit,
              checked: false,
              recipeIds: [recipe.id],
            });
          }
        }
      });
    });

    const updatedList = [...updatedExistingItems, ...newItems];
    saveShoppingList(updatedList);
    
    Alert.alert(
      'Added to Shopping List',
      `Added ${newItems.length} items from "${recipe.title}"`,
      [{ text: 'OK' }]
    );
  };

  const toggleShoppingItem = (itemId) => {
    const updated = shoppingList.map(item =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    saveShoppingList(updated);
  };

  const removeShoppingItem = (itemId) => {
    const updated = shoppingList.filter(item => item.id !== itemId);
    saveShoppingList(updated);
  };

  const clearShoppingList = () => {
    setShowClearModal(true);
  };

  const confirmClearShoppingList = () => {
    saveShoppingList([]);
    setShowClearModal(false);
  };

  const shareShoppingList = async () => {
    if (shoppingList.length === 0) {
      Alert.alert('Empty List', 'Add some items to your shopping list first!');
      return;
    }

    const unchecked = shoppingList.filter(item => !item.checked);
    const checked = shoppingList.filter(item => item.checked);
    
    let text = '🛒 Shopping List\n\n';
    
    if (unchecked.length > 0) {
      text += '📋 To Buy:\n';
      unchecked.forEach(item => {
        const qty = item.quantity ? `${item.quantity} ${item.unit} `.trim() + ' ' : '';
        text += `☐ ${qty}${item.ingredient}\n`;
      });
    }
    
    if (checked.length > 0) {
      text += '\n✅ Checked Off:\n';
      checked.forEach(item => {
        const qty = item.quantity ? `${item.quantity} ${item.unit} `.trim() + ' ' : '';
        text += `☑ ${qty}${item.ingredient}\n`;
      });
    }
    
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        // Web Share API
        await navigator.share({ text, title: 'Shopping List' });
      } else if (typeof document !== 'undefined') {
        // Web fallback - copy to clipboard
        await navigator.clipboard.writeText(text);
        Alert.alert('Copied!', 'Shopping list copied to clipboard');
      } else {
        // Mobile - use Sharing
        const fileUri = FileSystem.documentDirectory + 'shopping_list.txt';
        await FileSystem.writeAsStringAsync(fileUri, text);
        await Sharing.shareAsync(fileUri);
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Share Failed', 'Could not share shopping list');
    }
  };

  // Pick image from gallery
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setForm({ ...form, imageUri: result.assets[0].uri });
    }
  };

  // Extract recipe from video description or transcript
  const handleExtractRecipe = () => {
    setShowExtractionModal(true);
  };

  const performExtraction = async () => {
    if (!extractionText || !extractionText.trim()) {
      Alert.alert('Error', 'Please provide recipe text to extract');
      return;
    }

    setShowExtractionModal(false);
    setExtracting(true);
    
    try {
      const extractedRecipe = await extractRecipeFromText(extractionText);
      
      // Merge extracted data with existing form data (keep videoUrl and imageUri)
      setForm({
        ...form,
        title: extractedRecipe.title || form.title,
        category: extractedRecipe.category || form.category,
        ingredients: extractedRecipe.ingredients || form.ingredients,
        instructions: extractedRecipe.instructions || form.instructions,
        prepTime: extractedRecipe.prepTime || form.prepTime,
        cookTime: extractedRecipe.cookTime || form.cookTime,
      });

      setExtractionText('');
      Alert.alert(
        'Success',
        'Recipe extracted! Please review and edit the fields as needed.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Extraction error:', error);
      Alert.alert(
        'Extraction Failed',
        error.message || 'Failed to extract recipe. Please check your GitHub token in .env file and try again.'
      );
    } finally {
      setExtracting(false);
    }
  };

  // Export recipes to JSON file
  const exportRecipes = async () => {
    try {
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        recipes: recipes,
      };

      // Web-compatible export using blob download
      if (typeof document !== 'undefined') {
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'recipes_export.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        Alert.alert('Success', 'Recipes exported successfully!');
      } else {
        // Mobile export using FileSystem
        const fileUri = FileSystem.documentDirectory + 'recipes_export.json';
        await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportData, null, 2));

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
          Alert.alert('Success', 'Recipes exported successfully!');
        } else {
          Alert.alert('Success', `Recipes saved to: ${fileUri}`);
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export recipes');
    }
  };

  // Import recipes from JSON file
  const importRecipes = async () => {
    // Web: use file input
    if (typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          try {
            const text = await file.text();
            const data = JSON.parse(text);
            if (data.recipes && Array.isArray(data.recipes)) {
              const imported = data.recipes.filter(r => r.id && r.title);
              saveRecipes([...recipes, ...imported]);
              Alert.alert('Success', `Imported ${imported.length} recipes!`);
            } else {
              Alert.alert('Error', 'Invalid format. Expected JSON with "recipes" array.');
            }
          } catch (error) {
            console.error('Import error:', error);
            Alert.alert('Error', 'Failed to parse JSON file.');
          }
        }
      };
      input.click();
    } else {
      // Mobile: show paste modal
      setShowImportModal(true);
    }
  };

  const performImport = async () => {
    try {
      const data = JSON.parse(importText);
      if (data.recipes && Array.isArray(data.recipes)) {
        const imported = data.recipes.filter(r => r.id && r.title);
        saveRecipes([...recipes, ...imported]);
        Alert.alert('Success', `Imported ${imported.length} recipes!`);
        setShowImportModal(false);
        setImportText('');
      } else {
        Alert.alert('Error', 'Invalid format. Expected JSON with "recipes" array.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to parse JSON. Please check the format.');
    }
  };

  // Shopping List Screen
  if (screen === 'shopping') {
    const uncheckedItems = shoppingList.filter(item => !item.checked);
    const checkedItems = shoppingList.filter(item => item.checked);

    return (
      <View style={styles.container}>
        <Text style={styles.header}>Shopping List</Text>
        
        {shoppingList.length === 0 ? (
          <Text style={styles.emptyText}>
            Your shopping list is empty.{'\n'}
            Add ingredients from recipe details!
          </Text>
        ) : (
          <>
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                style={[styles.smallButton, { backgroundColor: '#4CAF50', marginRight: 8 }]}
                onPress={shareShoppingList}
              >
                <Text style={styles.smallButtonText}>📤 Share</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.smallButton, { backgroundColor: '#d32f2f' }]}
                onPress={clearShoppingList}
              >
                <Text style={styles.smallButtonText}>🗑️ Clear</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.shoppingListSummary}>
              {uncheckedItems.length} items to buy, {checkedItems.length} checked off
            </Text>

            <FlatList
              data={shoppingList}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.shoppingItem}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => toggleShoppingItem(item.id)}
                  >
                    <Text style={styles.checkboxText}>
                      {item.checked ? '☑' : '☐'}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.shoppingItemContent}>
                    <Text style={[
                      styles.shoppingItemText,
                      item.checked && styles.shoppingItemChecked
                    ]}>
                      {item.quantity > 0 && `${item.quantity} `}
                      {item.unit && `${item.unit} `}
                      {item.ingredient}
                    </Text>
                    {item.recipeIds.length > 1 && (
                      <Text style={styles.shoppingItemRecipes}>
                        From {item.recipeIds.length} recipes
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.deleteItemButton}
                    onPress={() => removeShoppingItem(item.id)}
                  >
                    <Text style={styles.deleteItemText}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </>
        )}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#666' }]}
          onPress={() => setScreen('home')}
        >
          <Text style={styles.buttonText}>Back to Recipes</Text>
        </TouchableOpacity>

        {/* Clear Confirmation Modal */}
        <Modal
          visible={showClearModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowClearModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxWidth: 400 }]}>
              <Text style={styles.modalTitle}>Clear Shopping List</Text>
              <Text style={[styles.modalSubtitle, { marginBottom: 25 }]}>
                Are you sure you want to clear the entire shopping list? This action cannot be undone.
              </Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonCancel]} 
                  onPress={() => setShowClearModal(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: '#d32f2f' }]} 
                  onPress={confirmClearShoppingList}
                >
                  <Text style={styles.modalButtonText}>Clear All</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Duplicate Recipe Modal */}
        <Modal
          visible={showDuplicateModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDuplicateModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxWidth: 400 }]}>
              <Text style={styles.modalTitle}>Already Added</Text>
              <Text style={[styles.modalSubtitle, { marginBottom: 25 }]}>
                "{duplicateRecipeTitle}" has already been added to your shopping list.
              </Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: '#2196F3' }]} 
                  onPress={() => setShowDuplicateModal(false)}
                >
                  <Text style={styles.modalButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Home Screen
  if (screen === 'home') {
    const filteredRecipes = getFilteredRecipes();
    const activeFilters = getActiveFilterCount();

    return (
      <View style={styles.container}>
        <Text style={styles.header}>My Recipes</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={[styles.smallButton, { marginRight: 8, backgroundColor: '#4CAF50' }]}
            onPress={() => setScreen('shopping')}
          >
            <Text style={styles.smallButtonText}>
              🛒 List {shoppingList.length > 0 ? `(${shoppingList.filter(i => !i.checked).length})` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.smallButton, { marginRight: 8 }]}
            onPress={exportRecipes}
          >
            <Text style={styles.smallButtonText}>📤 Export</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.smallButton}
            onPress={importRecipes}
          >
            <Text style={styles.smallButtonText}>📥 Import</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes, ingredients..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter/Sort Bar */}
        <View style={styles.filterBar}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <Text style={styles.filterButtonText}>
              🔍 Filters {activeFilters > 0 ? `(${activeFilters})` : ''}
            </Text>
          </TouchableOpacity>
          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Sort: </Text>
            <TouchableOpacity
              onPress={() => {
                const sortOptions = ['title-asc', 'title-desc', 'date-new', 'date-old'];
                const currentIndex = sortOptions.indexOf(sortBy);
                const nextIndex = (currentIndex + 1) % sortOptions.length;
                setSortBy(sortOptions[nextIndex]);
              }}
            >
              <Text style={styles.sortValue}>
                {sortBy === 'title-asc' ? 'A-Z' : 
                 sortBy === 'title-desc' ? 'Z-A' : 
                 sortBy === 'date-new' ? 'Newest' : 'Oldest'} ▼
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Results count */}
        {(searchQuery || activeFilters > 0) && (
          <Text style={styles.resultCount}>
            {filteredRecipes.length} of {recipes.length} recipes
          </Text>
        )}

        <FlatList
          data={filteredRecipes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.recipeItem}
              onPress={() => {
                setSelectedRecipe(item);
                setScreen('detail');
              }}
            >
              {item.imageUri ? (
                <Image source={{ uri: item.imageUri }} style={styles.recipeThumbnail} />
              ) : null}
              <View style={styles.recipeInfo}>
                <Text style={styles.recipeTitle}>{item.title}</Text>
                <Text style={styles.recipeCategory}>{item.category || 'No category'}</Text>
                <View style={styles.recipeMetadata}>
                  {item.prepTime && <Text style={styles.timeText}>⏱️ {item.prepTime}</Text>}
                  {item.cookTime && <Text style={styles.timeText}>🔥 {item.cookTime}</Text>}
                  {item.videoUrl && <Text style={styles.videoIndicator}>🎥</Text>}
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {searchQuery || activeFilters > 0 
                ? 'No recipes match your search' 
                : 'No recipes yet'}
            </Text>
          }
          scrollEnabled={filteredRecipes.length > 5}
        />
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            resetForm();
            setScreen('add');
          }}
        >
          <Text style={styles.buttonText}>+ Add Recipe</Text>
        </TouchableOpacity>

        {/* Filter Modal */}
        <Modal
          visible={showFilters}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowFilters(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.filterModal}>
              <Text style={styles.modalTitle}>Filter & Sort Recipes</Text>
              
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Max Prep Time (minutes)</Text>
                <View style={styles.timeFilterRow}>
                  <TouchableOpacity
                    style={[styles.timeChip, filters.prepTimeMax === 15 && styles.timeChipActive]}
                    onPress={() => setFilters({ ...filters, prepTimeMax: 15 })}
                  >
                    <Text style={styles.timeChipText}>15 min</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.timeChip, filters.prepTimeMax === 30 && styles.timeChipActive]}
                    onPress={() => setFilters({ ...filters, prepTimeMax: 30 })}
                  >
                    <Text style={styles.timeChipText}>30 min</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.timeChip, filters.prepTimeMax === 60 && styles.timeChipActive]}
                    onPress={() => setFilters({ ...filters, prepTimeMax: 60 })}
                  >
                    <Text style={styles.timeChipText}>1 hour</Text>
                  </TouchableOpacity>
                  {filters.prepTimeMax !== null && (
                    <TouchableOpacity
                      style={styles.timeChipClear}
                      onPress={() => setFilters({ ...filters, prepTimeMax: null })}
                    >
                      <Text style={styles.timeChipText}>Clear</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Max Cook Time (minutes)</Text>
                <View style={styles.timeFilterRow}>
                  <TouchableOpacity
                    style={[styles.timeChip, filters.cookTimeMax === 15 && styles.timeChipActive]}
                    onPress={() => setFilters({ ...filters, cookTimeMax: 15 })}
                  >
                    <Text style={styles.timeChipText}>15 min</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.timeChip, filters.cookTimeMax === 30 && styles.timeChipActive]}
                    onPress={() => setFilters({ ...filters, cookTimeMax: 30 })}
                  >
                    <Text style={styles.timeChipText}>30 min</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.timeChip, filters.cookTimeMax === 60 && styles.timeChipActive]}
                    onPress={() => setFilters({ ...filters, cookTimeMax: 60 })}
                  >
                    <Text style={styles.timeChipText}>1 hour</Text>
                  </TouchableOpacity>
                  {filters.cookTimeMax !== null && (
                    <TouchableOpacity
                      style={styles.timeChipClear}
                      onPress={() => setFilters({ ...filters, cookTimeMax: null })}
                    >
                      <Text style={styles.timeChipText}>Clear</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.clearButton]}
                  onPress={() => {
                    clearFilters();
                    setShowFilters(false);
                  }}
                >
                  <Text style={styles.modalButtonText}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.applyButton]}
                  onPress={() => setShowFilters(false)}
                >
                  <Text style={[styles.modalButtonText, styles.applyButtonText]}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Import Modal */}
        <Modal
          visible={showImportModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowImportModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Import Recipes</Text>
              <Text style={styles.modalSubtitle}>
                Paste your exported recipe JSON below:
              </Text>
              
              <TextInput
                style={styles.modalTextInput}
                multiline
                numberOfLines={10}
                value={importText}
                onChangeText={setImportText}
                placeholder='{"version":"1.0","recipes":[...]}'
                textAlignVertical="top"
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonCancel]} 
                  onPress={() => {
                    setShowImportModal(false);
                    setImportText('');
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonExtract]} 
                  onPress={performImport}
                  disabled={!importText.trim()}
                >
                  <Text style={styles.modalButtonText}>Import</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={showDeleteModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDeleteModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxWidth: 400 }]}>
              <Text style={styles.modalTitle}>Delete Recipe</Text>
              <Text style={[styles.modalSubtitle, { marginBottom: 25 }]}>
                Are you sure you want to delete this recipe? This action cannot be undone.
              </Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonCancel]} 
                  onPress={() => {
                    setShowDeleteModal(false);
                    setRecipeToDelete(null);
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: '#d32f2f' }]} 
                  onPress={confirmDelete}
                >
                  <Text style={styles.modalButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Add Recipe Screen
  if (screen === 'add') {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Add Recipe</Text>
        
        {/* AI Extraction Button */}
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: '#6366f1', marginBottom: 10 }]} 
          onPress={handleExtractRecipe}
          disabled={extracting}
        >
          {extracting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>🤖 Extract Recipe from Text</Text>
          )}
        </TouchableOpacity>
        {extracting && <Text style={styles.loadingText}>Extracting recipe using AI...</Text>}
        
        <TextInput
          style={styles.input}
          placeholder="Recipe Title"
          value={form.title}
          onChangeText={(text) => setForm({ ...form, title: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Category"
          value={form.category}
          onChangeText={(text) => setForm({ ...form, category: text })}
        />
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Ingredients"
          value={form.ingredients}
          onChangeText={(text) => setForm({ ...form, ingredients: text })}
          multiline
        />
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Instructions"
          value={form.instructions}
          onChangeText={(text) => setForm({ ...form, instructions: text })}
          multiline
        />
        <TextInput
          style={styles.input}
          placeholder="Prep Time"
          value={form.prepTime}
          onChangeText={(text) => setForm({ ...form, prepTime: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Cook Time"
          value={form.cookTime}
          onChangeText={(text) => setForm({ ...form, cookTime: text })}
        />
        
        <Text style={styles.subHeader}>Media</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#5a6' }]} onPress={pickImage}>
          <Text style={styles.buttonText}>📷 {form.imageUri ? 'Change Image' : 'Add Image'}</Text>
        </TouchableOpacity>
        {form.imageUri ? (
          <Image source={{ uri: form.imageUri }} style={styles.previewImage} />
        ) : null}
        
        <TextInput
          style={styles.input}
          placeholder="Video URL (TikTok, YouTube, etc.)"
          value={form.videoUrl}
          onChangeText={(text) => setForm({ ...form, videoUrl: text })}
        />
        
        <TouchableOpacity style={styles.button} onPress={addRecipe}>
          <Text style={styles.buttonText}>Save Recipe</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#666' }]} onPress={() => setScreen('home')}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>

        {/* Extraction Modal */}
        <Modal
          visible={showExtractionModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowExtractionModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Extract Recipe</Text>
              <Text style={styles.modalSubtitle}>
                Paste video description, transcript, or recipe text:
              </Text>
              
              <TextInput
                style={styles.modalTextInput}
                multiline
                numberOfLines={10}
                value={extractionText}
                onChangeText={setExtractionText}
                placeholder="Example: Today I'm making spaghetti carbonara. You'll need pasta, eggs, cheese..."
                textAlignVertical="top"
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonCancel]} 
                  onPress={() => {
                    setShowExtractionModal(false);
                    setExtractionText('');
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonExtract]} 
                  onPress={performExtraction}
                  disabled={!extractionText.trim()}
                >
                  <Text style={styles.modalButtonText}>Extract</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Duplicate Recipe Modal */}
        <Modal
          visible={showDuplicateModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDuplicateModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxWidth: 400 }]}>
              <Text style={styles.modalTitle}>Already Added</Text>
              <Text style={[styles.modalSubtitle, { marginBottom: 25 }]}>
                "{duplicateRecipeTitle}" has already been added to your shopping list.
              </Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: '#2196F3' }]} 
                  onPress={() => setShowDuplicateModal(false)}
                >
                  <Text style={styles.modalButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    );
  }

  // Recipe Detail Screen
  if (screen === 'detail' && selectedRecipe) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.header}>{selectedRecipe.title}</Text>
        
        {selectedRecipe.imageUri ? (
          <Image source={{ uri: selectedRecipe.imageUri }} style={styles.detailImage} />
        ) : null}
        
        {selectedRecipe.videoUrl ? (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#e53' }]}
            onPress={() => Linking.openURL(selectedRecipe.videoUrl)}
          >
            <Text style={styles.buttonText}>🎥 Watch Video</Text>
          </TouchableOpacity>
        ) : null}
        
        <Text style={styles.detail}>Category: {selectedRecipe.category}</Text>
        <Text style={styles.detail}>Prep: {selectedRecipe.prepTime}</Text>
        <Text style={styles.detail}>Cook: {selectedRecipe.cookTime}</Text>

        <Text style={styles.subHeader}>Ingredients</Text>
        <Text style={styles.detail}>{selectedRecipe.ingredients}</Text>

        <Text style={styles.subHeader}>Instructions</Text>
        <Text style={styles.detail}>{selectedRecipe.instructions}</Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#4CAF50' }]}
          onPress={() => addRecipeToShoppingList(selectedRecipe)}
        >
          <Text style={styles.buttonText}>🛒 Add to Shopping List</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            setForm({
              title: selectedRecipe.title,
              category: selectedRecipe.category,
              ingredients: selectedRecipe.ingredients,
              instructions: selectedRecipe.instructions,
              prepTime: selectedRecipe.prepTime,
              cookTime: selectedRecipe.cookTime,
              imageUri: selectedRecipe.imageUri || '',
              videoUrl: selectedRecipe.videoUrl || '',
            });
            setScreen('edit');
          }}
        >
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#d32f2f' }]}
          onPress={() => deleteRecipe(selectedRecipe.id)}
        >
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { backgroundColor: '#666' }]} onPress={() => setScreen('home')}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={showDeleteModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDeleteModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxWidth: 400 }]}>
              <Text style={styles.modalTitle}>Delete Recipe</Text>
              <Text style={[styles.modalSubtitle, { marginBottom: 25 }]}>
                Are you sure you want to delete this recipe? This action cannot be undone.
              </Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonCancel]} 
                  onPress={() => {
                    setShowDeleteModal(false);
                    setRecipeToDelete(null);
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: '#d32f2f' }]} 
                  onPress={confirmDelete}
                >
                  <Text style={styles.modalButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Duplicate Recipe Modal */}
        <Modal
          visible={showDuplicateModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDuplicateModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxWidth: 400 }]}>
              <Text style={styles.modalTitle}>Already Added</Text>
              <Text style={[styles.modalSubtitle, { marginBottom: 25 }]}>
                "{duplicateRecipeTitle}" has already been added to your shopping list.
              </Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: '#2196F3' }]} 
                  onPress={() => setShowDuplicateModal(false)}
                >
                  <Text style={styles.modalButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    );
  }

  // Edit Recipe Screen
  if (screen === 'edit' && selectedRecipe) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Edit Recipe</Text>
        
        {/* AI Extraction Button */}
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: '#6366f1', marginBottom: 10 }]} 
          onPress={handleExtractRecipe}
          disabled={extracting}
        >
          {extracting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>🤖 Extract Recipe from Text</Text>
          )}
        </TouchableOpacity>
        {extracting && <Text style={styles.loadingText}>Extracting recipe using AI...</Text>}
        
        <TextInput
          style={styles.input}
          placeholder="Recipe Title"
          value={form.title}
          onChangeText={(text) => setForm({ ...form, title: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Category"
          value={form.category}
          onChangeText={(text) => setForm({ ...form, category: text })}
        />
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Ingredients"
          value={form.ingredients}
          onChangeText={(text) => setForm({ ...form, ingredients: text })}
          multiline
        />
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Instructions"
          value={form.instructions}
          onChangeText={(text) => setForm({ ...form, instructions: text })}
          multiline
        />
        <TextInput
          style={styles.input}
          placeholder="Prep Time"
          value={form.prepTime}
          onChangeText={(text) => setForm({ ...form, prepTime: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Cook Time"
          value={form.cookTime}
          onChangeText={(text) => setForm({ ...form, cookTime: text })}
        />
        
        <Text style={styles.subHeader}>Media</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#5a6' }]} onPress={pickImage}>
          <Text style={styles.buttonText}>📷 {form.imageUri ? 'Change Image' : 'Add Image'}</Text>
        </TouchableOpacity>
        {form.imageUri ? (
          <Image source={{ uri: form.imageUri }} style={styles.previewImage} />
        ) : null}
        
        <TextInput
          style={styles.input}
          placeholder="Video URL (TikTok, YouTube, etc.)"
          value={form.videoUrl}
          onChangeText={(text) => setForm({ ...form, videoUrl: text })}
        />
        
        <TouchableOpacity style={styles.button} onPress={updateRecipe}>
          <Text style={styles.buttonText}>Save Changes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#666' }]} onPress={() => setScreen('home')}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>

        {/* Extraction Modal */}
        <Modal
          visible={showExtractionModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowExtractionModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Extract Recipe</Text>
              <Text style={styles.modalSubtitle}>
                Paste video description, transcript, or recipe text:
              </Text>
              
              <TextInput
                style={styles.modalTextInput}
                multiline
                numberOfLines={10}
                value={extractionText}
                onChangeText={setExtractionText}
                placeholder="Example: Today I'm making spaghetti carbonara. You'll need pasta, eggs, cheese..."
                textAlignVertical="top"
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonCancel]} 
                  onPress={() => {
                    setShowExtractionModal(false);
                    setExtractionText('');
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonExtract]} 
                  onPress={performExtraction}
                  disabled={!extractionText.trim()}
                >
                  <Text style={styles.modalButtonText}>Extract</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Duplicate Recipe Modal */}
        <Modal
          visible={showDuplicateModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDuplicateModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxWidth: 400 }]}>
              <Text style={styles.modalTitle}>Already Added</Text>
              <Text style={[styles.modalSubtitle, { marginBottom: 25 }]}>
                "{duplicateRecipeTitle}" has already been added to your shopping list.
              </Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: '#2196F3' }]} 
                  onPress={() => setShowDuplicateModal(false)}
                >
                  <Text style={styles.modalButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    marginTop: 10,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  smallButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    flex: 1,
    maxWidth: 120,
  },
  smallButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  recipeItem: {
    backgroundColor: 'white',
    padding: 12,
    marginBottom: 8,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    flexDirection: 'row',
  },
  recipeThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 12,
  },
  recipeInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  recipeCategory: {
    fontSize: 13,
    color: '#666',
    marginTop: 3,
  },
  videoIndicator: {
    fontSize: 12,
    color: '#e53',
    marginTop: 3,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  detailImage: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    marginBottom: 15,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  detail: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginTop: 30,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6366f1',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalTextInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    minHeight: 200,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 14,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#666',
  },
  modalButtonExtract: {
    backgroundColor: '#6366f1',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Search & Filter Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchInput: {
    flex: 1,
    padding: 10,
    fontSize: 15,
  },
  clearButton: {
    padding: 5,
  },
  clearButtonText: {
    fontSize: 18,
    color: '#999',
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  filterButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  filterButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  sortValue: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  resultCount: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  recipeMetadata: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#888',
  },
  filterModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  timeFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  timeChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  timeChipText: {
    fontSize: 13,
    color: '#333',
  },
  timeChipClear: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e53',
  },
  applyButton: {
    backgroundColor: '#007AFF',
  },
  applyButtonText: {
    color: 'white',
  },
  // Shopping List Styles
  shoppingListSummary: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  shoppingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    marginBottom: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  checkbox: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxText: {
    fontSize: 24,
    color: '#4CAF50',
  },
  shoppingItemContent: {
    flex: 1,
  },
  shoppingItemText: {
    fontSize: 15,
    color: '#333',
  },
  shoppingItemChecked: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  shoppingItemRecipes: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    fontStyle: 'italic',
  },
  deleteItemButton: {
    padding: 8,
  },
  deleteItemText: {
    fontSize: 20,
    color: '#d32f2f',
  },
});
