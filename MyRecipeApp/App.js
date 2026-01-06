import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput, ScrollView, Image, Linking, ActivityIndicator, Modal, Vibration, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { extractRecipeFromText, inferCategoryFromContent } from './services/recipeExtraction';
import WeeklyMealPlanView from './components/WeeklyMealPlanView';
import ShoppingListView from './ShoppingListView';
import { checkForDuplicate, formatDuplicateMessage } from './services/recipeComparison';
import { Picker } from '@react-native-picker/picker';
import * as timerService from './services/timerService';
import { 
  FloatingTimerWidget, 
  TimerWidgetModal, 
  CreateTimerModal, 
  TimerSuggestionsModal 
} from './components/TimerComponents';
import { NavigationContainer } from '@react-navigation/native';
import TopTabBar from './components/TopTabBar';

// Predefined categories and tags
const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snacks', 'Appetizers', 'Asian', 'Vegan', 'Vegetarian'];
const TAGS = ['Quick', 'Vegetarian', 'Vegan', 'Spicy', 'Easy', 'Healthy'];

// Storage keys for extraction features
const EXTRACTION_HISTORY_KEY = 'extractionHistory';
const EXTRACTION_FEEDBACK_KEY = 'extractionFeedback';
const MAX_EXTRACTION_HISTORY = 10;
const TIMERS_STORAGE_KEY = 'cookingTimers';

function AppContent() {
  const [recipes, setRecipes] = useState([]);
  const [screen, setScreen] = useState('home'); // 'home', 'add', 'detail', 'edit'
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [extracting, setExtracting] = useState(false); // Loading state for extraction
  const [showExtractionModal, setShowExtractionModal] = useState(false);
  const [extractionText, setExtractionText] = useState('');
  const [extractionHistory, setExtractionHistory] = useState([]); // Last 10 extractions
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [extractionError, setExtractionError] = useState(null); // { message, canRetry }
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [lastExtractedRecipe, setLastExtractedRecipe] = useState(null);
  const [wasExtracted, setWasExtracted] = useState(false); // Track if current recipe was created via extraction
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateRecipeTitle, setDuplicateRecipeTitle] = useState('');
  const [pendingRecipe, setPendingRecipe] = useState(null); // Recipe waiting for duplicate confirmation
  const [duplicateInfo, setDuplicateInfo] = useState(null); // Info about the potential duplicate
  
  // Search and Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    prepTimeMax: null, // in minutes
    cookTimeMax: null, // in minutes
    category: 'All', // 'All' or specific category
  });
  const [sortBy, setSortBy] = useState('title-asc'); // 'title-asc', 'title-desc', 'date-new', 'date-old'
  
  // Shopping List state
  const [shoppingList, setShoppingList] = useState([]); // Array of { ingredient, quantity, unit, checked, recipeIds }
  
  // Timer state
  const [timers, setTimers] = useState([]); // Array of timer objects from timerService
  const [showTimerWidget, setShowTimerWidget] = useState(false); // Show/hide timer widget
  const [showCreateTimer, setShowCreateTimer] = useState(false); // Create timer modal
  const [showTimerSuggestions, setShowTimerSuggestions] = useState(false); // Suggested timers modal
  const [suggestedTimers, setSuggestedTimers] = useState([]); // Parsed timer suggestions
  const [newTimerForm, setNewTimerForm] = useState({ hours: 0, minutes: 5, seconds: 0, label: '' });
  const [timerForRecipe, setTimerForRecipe] = useState(null); // Recipe context for timer creation
  const timerIntervalRef = useRef(null);

  // Meal Plan state
  const [showMealRecipePicker, setShowMealRecipePicker] = useState(false);
  const [selectedMealSlot, setSelectedMealSlot] = useState(null); // { dayOfWeek, mealType }
  const [mealPlanRefresh, setMealPlanRefresh] = useState(0); // Trigger to refresh meal plan view
  
  const [form, setForm] = useState({ 
    title: '', 
    category: 'Dinner', 
    tags: [],
    ingredients: '', 
    instructions: '', 
    prepTime: '', 
    cookTime: '', 
    imageUri: '',
    videoUrl: ''
  });

  // Load recipes, shopping list, and extraction history on mount
  useEffect(() => {
    loadRecipes();
    loadShoppingList();
    loadExtractionHistory();
    loadTimers();
    timerService.configureNotifications();
  }, []);

  // Timer countdown interval
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prevTimers => {
        let hasChanges = false;
        const updatedTimers = prevTimers.map(timer => {
          if (timer.status !== timerService.TIMER_STATUS.RUNNING) {
            return timer;
          }
          
          hasChanges = true;
          const newRemaining = timer.remainingSeconds - 1;
          
          if (newRemaining <= 0) {
            // Timer completed
            if (Platform.OS !== 'web') {
              Vibration.vibrate([0, 500, 200, 500]); // Vibrate pattern
            }
            return {
              ...timer,
              remainingSeconds: 0,
              status: timerService.TIMER_STATUS.COMPLETED,
              completedAt: new Date().toISOString(),
            };
          }
          
          return {
            ...timer,
            remainingSeconds: newRemaining,
          };
        });
        
        // Save to storage if there were changes
        if (hasChanges) {
          saveTimers(updatedTimers);
        }
        
        return updatedTimers;
      });
    }, 1000);

    timerIntervalRef.current = interval;

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Timer tick effect - update running timers every second
  useEffect(() => {
    const hasRunningTimers = timers.some(t => t.status === timerService.TIMER_STATUS.RUNNING);
    
    if (hasRunningTimers && !timerIntervalRef.current) {
      timerIntervalRef.current = setInterval(() => {
        setTimers(prevTimers => {
          let hasCompleted = false;
          const updated = prevTimers.map(timer => {
            if (timer.status !== timerService.TIMER_STATUS.RUNNING) return timer;
            
            const newRemaining = timer.remainingSeconds - 1;
            
            if (newRemaining <= 0) {
              hasCompleted = true;
              // Timer completed
              if (Platform.OS !== 'web') {
                Vibration.vibrate([0, 500, 200, 500]); // Vibrate pattern
              }
              return {
                ...timer,
                remainingSeconds: 0,
                status: timerService.TIMER_STATUS.COMPLETED,
                completedAt: new Date().toISOString(),
              };
            }
            
            return { ...timer, remainingSeconds: newRemaining };
          });
          
          // Show alert for completed timers
          if (hasCompleted) {
            const completedTimer = updated.find(t => 
              t.status === timerService.TIMER_STATUS.COMPLETED && 
              t.completedAt && 
              !prevTimers.find(p => p.id === t.id && p.status === timerService.TIMER_STATUS.COMPLETED)
            );
            if (completedTimer) {
              const message = `${completedTimer.icon} ${completedTimer.label} is done!`;
              if (typeof window !== 'undefined' && window.alert) {
                window.alert(message);
              } else {
                Alert.alert('Timer Complete!', message);
              }
            }
          }
          
          return updated;
        });
      }, 1000);
    } else if (!hasRunningTimers && timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [timers]);

  // Persist timers when they change
  useEffect(() => {
    if (timers.length > 0 || AsyncStorage.getItem(TIMERS_STORAGE_KEY)) {
      saveTimers(timers);
    }
  }, [timers]);

  const loadExtractionHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(EXTRACTION_HISTORY_KEY);
      if (stored) {
        setExtractionHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load extraction history:', error);
    }
  };

  const saveExtractionToHistory = async (text, result) => {
    try {
      const entry = {
        id: Date.now().toString(),
        text: text.substring(0, 200), // Store first 200 chars for display
        fullText: text,
        resultTitle: result.title,
        timestamp: new Date().toISOString(),
      };
      
      const newHistory = [entry, ...extractionHistory].slice(0, MAX_EXTRACTION_HISTORY);
      setExtractionHistory(newHistory);
      await AsyncStorage.setItem(EXTRACTION_HISTORY_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Failed to save extraction history:', error);
    }
  };

  const clearExtractionHistory = async () => {
    try {
      setExtractionHistory([]);
      await AsyncStorage.removeItem(EXTRACTION_HISTORY_KEY);
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Extraction history cleared');
      } else {
        Alert.alert('Success', 'Extraction history cleared');
      }
    } catch (error) {
      console.error('Failed to clear extraction history:', error);
    }
  };

  // Timer functions
  const loadTimers = async () => {
    try {
      const stored = await AsyncStorage.getItem(TIMERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Filter out completed timers older than 1 hour
        const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
        const validTimers = parsed.filter(t => 
          t.status !== timerService.TIMER_STATUS.COMPLETED || 
          (t.completedAt && t.completedAt > oneHourAgo)
        );
        setTimers(validTimers);
      }
    } catch (error) {
      console.error('Failed to load timers:', error);
    }
  };

  const saveTimers = async (newTimers) => {
    try {
      await AsyncStorage.setItem(TIMERS_STORAGE_KEY, JSON.stringify(newTimers));
    } catch (error) {
      console.error('Failed to save timers:', error);
    }
  };

  const createNewTimer = (options = {}) => {
    const duration = timerService.timeToSeconds(
      options.hours || newTimerForm.hours,
      options.minutes || newTimerForm.minutes,
      options.seconds || newTimerForm.seconds
    );
    
    if (duration <= 0) {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Please set a time greater than 0');
      } else {
        Alert.alert('Invalid Time', 'Please set a time greater than 0');
      }
      return;
    }

    const timer = timerService.createTimer({
      label: options.label || newTimerForm.label || 'Cooking Timer',
      durationSeconds: duration,
      recipeId: options.recipeId || timerForRecipe?.id,
      recipeTitle: options.recipeTitle || timerForRecipe?.title,
      type: options.type || 'CUSTOM',
    });

    setTimers(prev => [...prev, timer]);
    setShowCreateTimer(false);
    setNewTimerForm({ hours: 0, minutes: 5, seconds: 0, label: '' });
    setTimerForRecipe(null);
    
    // Auto-start the timer
    startTimer(timer.id);
  };

  const startTimer = async (timerId) => {
    setTimers(prev => prev.map(timer => {
      if (timer.id !== timerId) return timer;
      
      const updated = {
        ...timer,
        status: timerService.TIMER_STATUS.RUNNING,
        startedAt: new Date().toISOString(),
      };
      
      // Schedule notification
      timerService.scheduleTimerNotification(updated).then(notificationId => {
        if (notificationId) {
          setTimers(t => t.map(tm => 
            tm.id === timerId ? { ...tm, notificationId } : tm
          ));
        }
      });
      
      return updated;
    }));
  };

  const pauseTimer = (timerId) => {
    setTimers(prev => prev.map(timer => {
      if (timer.id !== timerId) return timer;
      
      // Cancel scheduled notification
      if (timer.notificationId) {
        timerService.cancelTimerNotification(timer.notificationId);
      }
      
      return {
        ...timer,
        status: timerService.TIMER_STATUS.PAUSED,
        pausedAt: new Date().toISOString(),
        notificationId: null,
      };
    }));
  };

  const resumeTimer = (timerId) => {
    startTimer(timerId);
  };

  const cancelTimer = (timerId) => {
    setTimers(prev => {
      const timer = prev.find(t => t.id === timerId);
      if (timer?.notificationId) {
        timerService.cancelTimerNotification(timer.notificationId);
      }
      return prev.filter(t => t.id !== timerId);
    });
  };

  const addTimeToTimer = (timerId, seconds) => {
    setTimers(prev => prev.map(timer => {
      if (timer.id !== timerId) return timer;
      return timerService.addTime(timer, seconds);
    }));
  };

  const dismissCompletedTimer = (timerId) => {
    cancelTimer(timerId);
  };

  const showTimerSuggestionsForRecipe = (recipe) => {
    const suggestions = timerService.parseInstructionsForTimers(
      recipe.instructions,
      recipe.id,
      recipe.title
    );
    setSuggestedTimers(suggestions);
    setTimerForRecipe(recipe);
    if (suggestions.length > 0) {
      setShowTimerSuggestions(true);
    } else {
      // No suggestions, just open create timer modal
      setShowCreateTimer(true);
    }
  };

  const addSuggestedTimer = (suggestedTimer) => {
    const timer = { ...suggestedTimer, id: `timer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` };
    setTimers(prev => [...prev, timer]);
    startTimer(timer.id);
  };

  const getRunningTimersCount = () => {
    return timers.filter(t => 
      t.status === timerService.TIMER_STATUS.RUNNING || 
      t.status === timerService.TIMER_STATUS.PAUSED
    ).length;
  };

  const getCompletedTimersCount = () => {
    return timers.filter(t => t.status === timerService.TIMER_STATUS.COMPLETED).length;
  };

  const saveFeedback = async (isPositive, comment = '') => {
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
      
      // Close modal first, then show thank you message
      setShowFeedbackModal(false);
      setFeedbackComment('');
      setWasExtracted(false); // Clear flag after feedback
      
      // Show thank you message - use window.alert on web for reliability
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.alert) {
          window.alert('Thank you! Your feedback helps improve our AI extraction.');
        } else {
          Alert.alert('Thank you!', 'Your feedback helps improve our AI extraction.');
        }
      }, 200);
    } catch (error) {
      console.error('Failed to save feedback:', error);
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Error: Failed to save feedback. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to save feedback. Please try again.');
      }
    }
  };

  const loadRecipes = async () => {
    try {
      const stored = await AsyncStorage.getItem('recipes');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migration: add default category and tags to existing recipes, convert Main Dish to Dinner
        const migrated = (Array.isArray(parsed) ? parsed : []).map(recipe => {
          let category = recipe.category || 'Dinner';
          // Convert deprecated Main Dish category to Dinner
          if (category === 'Main Dish') {
            category = 'Dinner';
          }
          return {
            ...recipe,
            category,
            tags: Array.isArray(recipe.tags) ? recipe.tags : [],
          };
        });
        setRecipes(migrated);
        // Save migrated data back if any changes were made
        if (JSON.stringify(parsed) !== JSON.stringify(migrated)) {
          await AsyncStorage.setItem('recipes', JSON.stringify(migrated));
        }
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
      category: String(form.category || 'Dinner'),
      tags: Array.isArray(form.tags) ? form.tags : [],
      ingredients: String(form.ingredients),
      instructions: String(form.instructions),
      prepTime: String(form.prepTime),
      cookTime: String(form.cookTime),
      imageUri: String(form.imageUri || ''),
      videoUrl: String(form.videoUrl || ''),
    };
    
    // Check for duplicate recipes
    const ingredientsList = form.ingredients
      ? form.ingredients.split('\n').filter(i => i.trim())
      : [];
    const recipeForComparison = {
      title: form.title,
      ingredients: ingredientsList,
    };
    
    // Prepare existing recipes for comparison
    const existingForComparison = recipes.map(r => ({
      ...r,
      ingredients: typeof r.ingredients === 'string' 
        ? r.ingredients.split('\n').filter(i => i.trim())
        : r.ingredients || [],
    }));
    
    const duplicate = checkForDuplicate(recipeForComparison, existingForComparison);
    
    if (duplicate) {
      // Store the pending recipe and show duplicate modal
      setPendingRecipe(newRecipe);
      setDuplicateInfo(duplicate);
      setShowDuplicateModal(true);
      return;
    }
    
    saveRecipes([...recipes, newRecipe]);
    // If recipe was created via extraction, show feedback modal
    if (wasExtracted) {
      setShowFeedbackModal(true);
      setWasExtracted(false);
    }
    resetForm();
    setScreen('home');
  };

  // Duplicate modal handlers
  const handleDuplicateCancel = () => {
    setShowDuplicateModal(false);
    setPendingRecipe(null);
    setDuplicateInfo(null);
  };

  const handleDuplicateAddAsVariant = () => {
    if (pendingRecipe && duplicateInfo) {
      const variantRecipe = {
        ...pendingRecipe,
        variantOf: duplicateInfo.recipe.id,
        title: `${pendingRecipe.title} (Variant)`,
      };
      saveRecipes([...recipes, variantRecipe]);
      resetForm();
      setScreen('home');
    }
    setShowDuplicateModal(false);
    setPendingRecipe(null);
    setDuplicateInfo(null);
  };

  const handleDuplicateAddAnyway = () => {
    if (pendingRecipe) {
      saveRecipes([...recipes, pendingRecipe]);
      resetForm();
      setScreen('home');
    }
    setShowDuplicateModal(false);
    setPendingRecipe(null);
    setDuplicateInfo(null);
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
            category: String(form.category || 'Dinner'),
            tags: Array.isArray(form.tags) ? form.tags : [],
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
    setForm({ title: '', category: 'Dinner', tags: [], ingredients: '', instructions: '', prepTime: '', cookTime: '', imageUri: '', videoUrl: '' });
    setSelectedRecipe(null);
    setWasExtracted(false); // Clear flag on form reset
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

    // Apply category filter
    if (filters.category && filters.category !== 'All') {
      filtered = filtered.filter(recipe => recipe.category === filters.category);
    }

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
    
    // Remove preparation notes after commas (e.g., "sifted", "chopped", "minced", "diced", "cubed", "finely chopped", "at room temperature", "softened", "melted", "beaten", "whisked")
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

  const performExtraction = async (textToExtract = null) => {
    const text = textToExtract || extractionText;
    if (!text || !text.trim()) {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Please provide recipe text to extract');
      } else {
        Alert.alert('Error', 'Please provide recipe text to extract');
      }
      return;
    }

    setShowExtractionModal(false);
    setExtracting(true);
    setExtractionError(null);
    try {
      const extractedRecipe = await extractRecipeFromText(text);
      await saveExtractionToHistory(text, extractedRecipe);
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
      setLastExtractedRecipe(extractedRecipe);
      setWasExtracted(true); // Mark that the next save should trigger feedback
      // Show success message only
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Recipe extracted! Please review and edit the fields as needed.');
      } else {
        Alert.alert('Success', 'Recipe extracted! Please review and edit the fields as needed.');
      }
    } catch (error) {
      console.error('Extraction error:', error);
      const errorMessage = error.message || 'Failed to extract recipe. Please check your GitHub token in .env file and try again.';
      
      setExtractionError({
        message: errorMessage,
        canRetry: error.canRetry !== false,
        lastText: text
      });
      
      // On mobile, also show an alert dialog
      // On web, we rely on the UI error display which is more reliable
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        // Mobile platform - use Alert
        Alert.alert(
          'Extraction Failed',
          errorMessage,
          error.canRetry !== false 
            ? [
                { text: 'Retry', onPress: () => performExtraction(text) },
                { text: 'Cancel', style: 'cancel' }
              ]
            : [{ text: 'OK' }]
        );
      }
      // Web platform - error will be shown in UI via extractionError state
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
      // Mobile: use document picker to select file
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: 'application/json',
          copyToCacheDirectory: true,
        });
        
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          const fileContent = await FileSystem.readAsStringAsync(asset.uri);
          const data = JSON.parse(fileContent);
          
          if (data.recipes && Array.isArray(data.recipes)) {
            const imported = data.recipes.filter(r => r.id && r.title);
            saveRecipes([...recipes, ...imported]);
            Alert.alert('Success', `Imported ${imported.length} recipes!`);
          } else {
            Alert.alert('Error', 'Invalid format. Expected JSON with "recipes" array.');
          }
        }
      } catch (error) {
        console.error('Import error:', error);
        Alert.alert('Error', 'Failed to import file. Please ensure it is a valid JSON file.');
      }
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

  // Meal Plan: Add recipe to meal slot
  const handleAddRecipeToMealSlot = async (recipe) => {
    if (!selectedMealSlot) {
      console.warn('No meal slot selected');
      return;
    }

    try {
      console.log('Adding recipe to meal slot:', recipe.title, selectedMealSlot);
      // Load current meal plan
      let mealPlan = await AsyncStorage.getItem('@myrecipeapp/meal_plan');
      console.log('Current meal plan from AsyncStorage:', mealPlan);
      const plan = mealPlan ? JSON.parse(mealPlan) : [];
      console.log('Parsed meal plan:', plan);

      // Create new meal assignment
      const newMeal = {
        id: `${recipe.id}-${selectedMealSlot.dayOfWeek}-${selectedMealSlot.mealType}-${Date.now()}`,
        recipeId: recipe.id,
        dayOfWeek: selectedMealSlot.dayOfWeek,
        mealType: selectedMealSlot.mealType,
        assignedDate: new Date().toISOString(),
      };

      console.log('New meal object:', newMeal);

      // Add to both keys for compatibility
      const updatedPlan = [...plan, newMeal];
      console.log('Updated plan:', updatedPlan);
      
      await AsyncStorage.setItem('@myrecipeapp/meal_plan', JSON.stringify(updatedPlan));
      console.log('Saved to @myrecipeapp/meal_plan');
      
      await AsyncStorage.setItem('mealPlan', JSON.stringify(updatedPlan));
      console.log('Saved to mealPlan key');

      // Close modal and reset state
      setShowMealRecipePicker(false);
      setSelectedMealSlot(null);
      // Trigger refresh of meal plan view
      setMealPlanRefresh(prev => prev + 1);
      console.log('Triggered meal plan refresh');

      Alert.alert('Success', `Added ${recipe.title} to your meal plan!`);
    } catch (error) {
      console.error('Error adding recipe to meal plan:', error);
      Alert.alert('Error', 'Failed to add recipe to meal plan. Check console for details.');
    }
  };

  const handleMealSlotPress = (dayOfWeek, mealType) => {
    console.log('Meal slot pressed:', dayOfWeek, mealType);
    console.log('Current recipes count:', recipes?.length || 0);
    console.log('Recipes:', recipes);
    setSelectedMealSlot({ dayOfWeek, mealType });
    setShowMealRecipePicker(true);
  };

  // Meal Plan screen (Weekly planner)
  if (screen === 'mealPlan') {
    screenContent = (
      <>
        <View style={styles.container}>
          <View style={[styles.headerButtons, { paddingHorizontal: 16, paddingTop: 12 }]}>
            <TouchableOpacity
              style={[styles.smallButton, { backgroundColor: '#f0f0f0' }]}
              onPress={() => setScreen('home')}
            >
              <Text style={[styles.smallButtonText, { color: '#333' }]}>← Back</Text>
            </TouchableOpacity>
          </View>

          <WeeklyMealPlanView
            recipes={recipes}
            onMealSlotPress={handleMealSlotPress}
            onGenerateShoppingList={() => setScreen('shoppingGenerator')}
            refreshTrigger={mealPlanRefresh}
          />
        </View>

        {/* Recipe Picker Modal */}
        <Modal
          transparent={true}
          visible={showMealRecipePicker === true}
          onRequestClose={() => {
            console.log('Modal close requested');
            setShowMealRecipePicker(false);
            setSelectedMealSlot(null);
          }}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { width: '90%', maxHeight: 500 }]}>
              <View style={{ paddingBottom: 12 }}>
                <Text style={styles.modalTitle}>Select Recipe</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedMealSlot && selectedMealSlot.mealType 
                    ? selectedMealSlot.mealType.charAt(0).toUpperCase() + selectedMealSlot.mealType.slice(1)
                    : 'Recipe'}
                </Text>
              </View>

              {!recipes || recipes.length === 0 ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, color: '#999' }}>No recipes available</Text>
                </View>
              ) : (
                <ScrollView style={{ height: 300 }}>
                  {recipes.map((recipe) => (
                    <View key={recipe.id || Math.random()}>
                      <TouchableOpacity
                        style={{ paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}
                        onPress={() => {
                          console.log('Selected recipe:', recipe.title);
                          handleAddRecipeToMealSlot(recipe);
                        }}
                      >
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 }}>{recipe.title || 'Untitled'}</Text>
                        <Text style={{ fontSize: 13, color: '#999' }}>{recipe.category || 'N/A'}</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              <View style={{ marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' }}>
                <TouchableOpacity
                  style={{ paddingVertical: 12, paddingHorizontal: 12, backgroundColor: '#666', borderRadius: 6, alignItems: 'center' }}
                  onPress={() => {
                    console.log('Modal cancel');
                    setShowMealRecipePicker(false);
                    setSelectedMealSlot(null);
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </>
    );
  }

  // Shopping List Generator screen (from meal plan)
  if (screen === 'shoppingGenerator') {
    screenContent = (
      <View style={styles.container}>
        <ShoppingListView 
          onBack={() => setScreen('mealPlan')} 
          recipes={recipes}
          onSaveShoppingList={(generatedList) => {
            // Convert the categorized shopping list to the app's format
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
        />
      </View>
    );
  }

  // Shopping List Screen
  if (screen === 'shopping') {
    const uncheckedItems = shoppingList.filter(item => !item.checked);
    const checkedItems = shoppingList.filter(item => item.checked);

    screenContent = (
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

  // Render screen content with top tab navigation
  let screenContent = null;

  // Home Screen
  if (screen === 'home') {
    const filteredRecipes = getFilteredRecipes();
    const activeFilters = getActiveFilterCount();

    screenContent = (
      <View style={styles.container}>
        <Text style={styles.header}>My Recipes</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={[styles.smallButton, { marginRight: 8, backgroundColor: '#FF6B6B' }]}
            onPress={() => setScreen('mealPlan')}
          >
            <Text style={styles.smallButtonText}>📅 Meal Plan</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.smallButton, { marginRight: 8, backgroundColor: '#4CAF50' }]}
            onPress={() => setScreen('shopping')}
          >
            <Text style={styles.smallButtonText}>
              🛒 List {shoppingList.length > 0 ? `(${shoppingList.filter(i => !i.checked).length})` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.smallButton, { marginRight: 8, backgroundColor: getRunningTimersCount() > 0 ? '#FF9800' : '#2196F3' }]}
            onPress={() => setShowTimerWidget(true)}
          >
            <Text style={styles.smallButtonText}>
              ⏱️ {getRunningTimersCount() > 0 ? `(${getRunningTimersCount()})` : 'Timer'}
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

        {/* Category Filter Buttons */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilterContainer}
          contentContainerStyle={{ alignItems: 'center', paddingRight: 10 }}
        >
          <TouchableOpacity
            style={[
              styles.categoryFilterButton,
              filters.category === 'All' && styles.categoryFilterButtonActive
            ]}
            onPress={() => setFilters({ ...filters, category: 'All' })}
          >
            <Text style={[
              styles.categoryFilterButtonText,
              filters.category === 'All' && styles.categoryFilterButtonTextActive
            ]}>
              All
            </Text>
          </TouchableOpacity>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryFilterButton,
                filters.category === cat && styles.categoryFilterButtonActive
              ]}
              onPress={() => setFilters({ ...filters, category: cat })}
            >
              <Text style={[
                styles.categoryFilterButtonText,
                filters.category === cat && styles.categoryFilterButtonTextActive
              ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

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
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{item.category || 'Dinner'}</Text>
                </View>
                <View style={styles.recipeMetadata}>
                  {item.prepTime ? <Text style={styles.timeText}>⏱️ {item.prepTime}</Text> : null}
                  {item.cookTime ? <Text style={styles.timeText}>🔥 {item.cookTime}</Text> : null}
                  {item.videoUrl ? <Text style={styles.videoIndicator}>🎥</Text> : null}
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

        {/* Duplicate Recipe Detection Modal */}
        <Modal
          visible={showDuplicateModal}
          transparent={true}
          animationType="fade"
          onRequestClose={handleDuplicateCancel}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxWidth: 450 }]}>
              <Text style={styles.modalTitle}>⚠️ Similar Recipe Found</Text>
              <Text style={[styles.modalSubtitle, { marginBottom: 15 }]}>
                {duplicateInfo ? formatDuplicateMessage(duplicateInfo) : ''}
              </Text>
              
              <View>
                <TouchableOpacity 
                  style={{ backgroundColor: '#4CAF50', width: '100%', marginBottom: 10, padding: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }} 
                  onPress={handleDuplicateAddAsVariant}
                >
                  <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>Add as Variant</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={{ backgroundColor: '#2196F3', width: '100%', marginBottom: 10, padding: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }} 
                  onPress={handleDuplicateAddAnyway}
                >
                  <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>Add Anyway</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={{ backgroundColor: '#666666', width: '100%', padding: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }} 
                  onPress={handleDuplicateCancel}
                >
                  <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Timer Floating Widget */}
        <FloatingTimerWidget
          timers={timers}
          visible={!showTimerWidget && getRunningTimersCount() > 0}
          onPress={() => setShowTimerWidget(true)}
        />

        {/* Timer Widget Modal */}
        <TimerWidgetModal
          visible={showTimerWidget}
          onClose={() => setShowTimerWidget(false)}
          timers={timers}
          onStartTimer={startTimer}
          onPauseTimer={pauseTimer}
          onResumeTimer={resumeTimer}
          onCancelTimer={cancelTimer}
          onAddTime={addTimeToTimer}
          onDismissCompleted={dismissCompletedTimer}
          onCreateNew={() => {
            setShowTimerWidget(false);
            setShowCreateTimer(true);
          }}
        />

        {/* Create Timer Modal */}
        <CreateTimerModal
          visible={showCreateTimer}
          onClose={() => {
            setShowCreateTimer(false);
            setTimerForRecipe(null);
            setNewTimerForm({ hours: 0, minutes: 5, seconds: 0, label: '' });
          }}
          onCreate={createNewTimer}
          timerForm={newTimerForm}
          setTimerForm={setNewTimerForm}
          recipeContext={timerForRecipe}
        />

        {/* Timer Suggestions Modal */}
        <TimerSuggestionsModal
          visible={showTimerSuggestions}
          onClose={() => {
            setShowTimerSuggestions(false);
            setTimerForRecipe(null);
            setSuggestedTimers([]);
          }}
          suggestions={suggestedTimers}
          onAddSuggestion={addSuggestedTimer}
          onCreateCustom={() => setShowCreateTimer(true)}
          recipeTitle={timerForRecipe?.title}
        />
      </View>
    );
  }

  // Add Recipe Screen
  if (screen === 'add') {
    screenContent = (
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
        
        {/* Error display for extraction failures */}
        {extractionError && (
          <View style={{ backgroundColor: '#ffebee', padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#f44336' }}>
            <Text style={{ color: '#c62828', fontWeight: 'bold', marginBottom: 4 }}>❌ Extraction Failed</Text>
            <Text style={{ color: '#c62828', marginBottom: 8 }}>{extractionError.message}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {extractionError.canRetry && (
                <TouchableOpacity 
                  style={{ backgroundColor: '#f44336', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4 }}
                  onPress={() => {
                    setExtractionError(null);
                    performExtraction(extractionError.lastText);
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Retry</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={{ backgroundColor: '#666', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4 }}
                onPress={() => setExtractionError(null)}
              >
                <Text style={{ color: '#fff' }}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        <TextInput
          style={styles.input}
          placeholder="Recipe Title"
          value={form.title}
          onChangeText={(text) => setForm({ ...form, title: text })}
        />
        
        <Text style={styles.label}>Category</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={form.category}
            onValueChange={(value) => setForm({ ...form, category: value })}
            style={styles.picker}
          >
            {CATEGORIES.map(cat => (
              <Picker.Item key={cat} label={cat} value={cat} />
            ))}
          </Picker>
        </View>
        
        <Text style={styles.label}>Tags (Optional)</Text>
        <View style={styles.tagsContainer}>
          {TAGS.map(tag => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.tagChip,
                form.tags.includes(tag) && styles.tagChipSelected
              ]}
              onPress={() => {
                const newTags = form.tags.includes(tag)
                  ? form.tags.filter(t => t !== tag)
                  : [...form.tags, tag];
                setForm({ ...form, tags: newTags });
              }}
            >
              <Text style={[
                styles.tagChipText,
                form.tags.includes(tag) && styles.tagChipTextSelected
              ]}>
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
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
              
              {/* Extraction History */}
              {extractionHistory.length > 0 && (
                <View style={{ marginBottom: 10 }}>
                  <TouchableOpacity 
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}
                    onPress={() => setShowHistoryDropdown(!showHistoryDropdown)}
                  >
                    <Text style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                      📜 Recent Extractions ({extractionHistory.length})
                    </Text>
                    <Text style={{ color: '#4CAF50', marginLeft: 5 }}>
                      {showHistoryDropdown ? '▲' : '▼'}
                    </Text>
                  </TouchableOpacity>
                  
                  {showHistoryDropdown && (
                    <View style={{ backgroundColor: '#f5f5f5', borderRadius: 8, padding: 8, maxHeight: 150 }}>
                      <ScrollView>
                        {extractionHistory.map((item) => (
                          <TouchableOpacity 
                            key={item.id}
                            style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#ddd' }}
                            onPress={() => {
                              setExtractionText(item.fullText);
                              setShowHistoryDropdown(false);
                            }}
                          >
                            <Text style={{ fontWeight: 'bold', fontSize: 14 }} numberOfLines={1}>
                              {item.resultTitle || 'Untitled'}
                            </Text>
                            <Text style={{ fontSize: 12, color: '#666' }} numberOfLines={1}>
                              {item.text}...
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <TouchableOpacity 
                        style={{ marginTop: 8, padding: 8, backgroundColor: '#ff6b6b', borderRadius: 4, alignItems: 'center' }}
                        onPress={() => {
                          if (typeof window !== 'undefined' && window.confirm) {
                            if (window.confirm('Are you sure you want to clear extraction history?')) {
                              clearExtractionHistory();
                            }
                          } else {
                            Alert.alert(
                              'Clear History',
                              'Are you sure you want to clear extraction history?',
                              [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Clear', style: 'destructive', onPress: clearExtractionHistory }
                              ]
                            );
                          }
                        }}
                      >
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Clear History</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
              
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
                    setShowHistoryDropdown(false);
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonExtract]} 
                  onPress={() => performExtraction()}
                  disabled={!extractionText.trim()}
                >
                  <Text style={styles.modalButtonText}>Extract</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Feedback Modal */}
        <Modal
          visible={showFeedbackModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowFeedbackModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxWidth: 400 }]}>
              <Text style={styles.modalTitle}>Was this extraction accurate?</Text>
              <Text style={styles.modalSubtitle}>
                Your feedback helps improve our AI extraction.
              </Text>
              
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, marginVertical: 20 }}>
                <TouchableOpacity 
                  style={{ padding: 20, backgroundColor: '#4CAF50', borderRadius: 50 }}
                  onPress={() => saveFeedback(true, feedbackComment)}
                >
                  <Text style={{ fontSize: 32 }}>👍</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{ padding: 20, backgroundColor: '#f44336', borderRadius: 50 }}
                  onPress={() => saveFeedback(false, feedbackComment)}
                >
                  <Text style={{ fontSize: 32 }}>👎</Text>
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={[styles.input, { marginBottom: 15 }]}
                placeholder="Optional: Tell us what could be improved..."
                value={feedbackComment}
                onChangeText={setFeedbackComment}
                multiline
                numberOfLines={3}
              />
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonCancel, { width: '100%' }]}
                onPress={() => {
                  setShowFeedbackModal(false);
                  setFeedbackComment('');
                }}
              >
                <Text style={styles.modalButtonText}>Skip</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Duplicate Recipe Detection Modal */}
        <Modal
          visible={showDuplicateModal}
          transparent={true}
          animationType="fade"
          onRequestClose={handleDuplicateCancel}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxWidth: 450 }]}>
              <Text style={styles.modalTitle}>⚠️ Similar Recipe Found</Text>
              <Text style={[styles.modalSubtitle, { marginBottom: 15 }]}>
                {duplicateInfo ? formatDuplicateMessage(duplicateInfo) : ''}
              </Text>
              
              <View>
                <TouchableOpacity 
                  style={{ backgroundColor: '#4CAF50', width: '100%', marginBottom: 10, padding: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }} 
                  onPress={handleDuplicateAddAsVariant}
                >
                  <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>Add as Variant</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={{ backgroundColor: '#2196F3', width: '100%', marginBottom: 10, padding: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }} 
                  onPress={handleDuplicateAddAnyway}
                >
                  <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>Add Anyway</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={{ backgroundColor: '#666666', width: '100%', padding: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }} 
                  onPress={handleDuplicateCancel}
                >
                  <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Timer Floating Widget */}
        <FloatingTimerWidget
          timers={timers}
          visible={!showTimerWidget && getRunningTimersCount() > 0}
          onPress={() => setShowTimerWidget(true)}
        />

        {/* Timer Widget Modal */}
        <TimerWidgetModal
          visible={showTimerWidget}
          onClose={() => setShowTimerWidget(false)}
          timers={timers}
          onStartTimer={startTimer}
          onPauseTimer={pauseTimer}
          onResumeTimer={resumeTimer}
          onCancelTimer={cancelTimer}
          onAddTime={addTimeToTimer}
          onDismissCompleted={dismissCompletedTimer}
          onCreateNew={() => {
            setShowTimerWidget(false);
            setShowCreateTimer(true);
          }}
        />

        {/* Create Timer Modal */}
        <CreateTimerModal
          visible={showCreateTimer}
          onClose={() => {
            setShowCreateTimer(false);
            setTimerForRecipe(null);
            setNewTimerForm({ hours: 0, minutes: 5, seconds: 0, label: '' });
          }}
          onCreate={createNewTimer}
          timerForm={newTimerForm}
          setTimerForm={setNewTimerForm}
          recipeContext={timerForRecipe}
        />

        {/* Timer Suggestions Modal */}
        <TimerSuggestionsModal
          visible={showTimerSuggestions}
          onClose={() => {
            setShowTimerSuggestions(false);
            setTimerForRecipe(null);
            setSuggestedTimers([]);
          }}
          suggestions={suggestedTimers}
          onAddSuggestion={addSuggestedTimer}
          onCreateCustom={() => setShowCreateTimer(true)}
          recipeTitle={timerForRecipe?.title}
        />
      </ScrollView>
    );
  }

  // Recipe Detail Screen
  if (screen === 'detail' && selectedRecipe) {
    screenContent = (
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
        
        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>Category:</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{selectedRecipe.category || 'Dinner'}</Text>
          </View>
        </View>
        
        {selectedRecipe.tags && selectedRecipe.tags.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Tags:</Text>
            <View style={styles.tagsContainer}>
              {selectedRecipe.tags.map(tag => (
                <View key={tag} style={styles.tagChipDisplay}>
                  <Text style={styles.tagChipDisplayText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
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
          style={[styles.button, { backgroundColor: '#FF9800' }]}
          onPress={() => showTimerSuggestionsForRecipe(selectedRecipe)}
        >
          <Text style={styles.buttonText}>⏱️ Set Timer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            setForm({
              title: selectedRecipe.title,
              category: selectedRecipe.category || 'Dinner',
              tags: Array.isArray(selectedRecipe.tags) ? selectedRecipe.tags : [],
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

        {/* Timer Floating Widget */}
        <FloatingTimerWidget
          timers={timers}
          visible={!showTimerWidget && getRunningTimersCount() > 0}
          onPress={() => setShowTimerWidget(true)}
        />

        {/* Timer Widget Modal */}
        <TimerWidgetModal
          visible={showTimerWidget}
          onClose={() => setShowTimerWidget(false)}
          timers={timers}
          onStartTimer={startTimer}
          onPauseTimer={pauseTimer}
          onResumeTimer={resumeTimer}
          onCancelTimer={cancelTimer}
          onAddTime={addTimeToTimer}
          onDismissCompleted={dismissCompletedTimer}
          onCreateNew={() => {
            setShowTimerWidget(false);
            setShowCreateTimer(true);
          }}
        />

        {/* Create Timer Modal */}
        <CreateTimerModal
          visible={showCreateTimer}
          onClose={() => {
            setShowCreateTimer(false);
            setTimerForRecipe(null);
            setNewTimerForm({ hours: 0, minutes: 5, seconds: 0, label: '' });
          }}
          onCreate={createNewTimer}
          timerForm={newTimerForm}
          setTimerForm={setNewTimerForm}
          recipeContext={timerForRecipe}
        />

        {/* Timer Suggestions Modal */}
        <TimerSuggestionsModal
          visible={showTimerSuggestions}
          onClose={() => {
            setShowTimerSuggestions(false);
            setTimerForRecipe(null);
            setSuggestedTimers([]);
          }}
          suggestions={suggestedTimers}
          onAddSuggestion={addSuggestedTimer}
          onCreateCustom={() => setShowCreateTimer(true)}
          recipeTitle={timerForRecipe?.title}
        />
      </ScrollView>
    );
  }

  // Edit Recipe Screen
  if (screen === 'edit' && selectedRecipe) {
    screenContent = (
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
        
        {/* Error display for extraction failures */}
        {extractionError && (
          <View style={{ backgroundColor: '#ffebee', padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#f44336' }}>
            <Text style={{ color: '#c62828', fontWeight: 'bold', marginBottom: 4 }}>❌ Extraction Failed</Text>
            <Text style={{ color: '#c62828', marginBottom: 8 }}>{extractionError.message}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {extractionError.canRetry && (
                <TouchableOpacity 
                  style={{ backgroundColor: '#f44336', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4 }}
                  onPress={() => {
                    setExtractionError(null);
                    performExtraction(extractionError.lastText);
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Retry</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={{ backgroundColor: '#666', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4 }}
                onPress={() => setExtractionError(null)}
              >
                <Text style={{ color: '#fff' }}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        <TextInput
          style={styles.input}
          placeholder="Recipe Title"
          value={form.title}
          onChangeText={(text) => setForm({ ...form, title: text })}
        />
        
        <Text style={styles.label}>Category</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={form.category}
            onValueChange={(value) => setForm({ ...form, category: value })}
            style={styles.picker}
          >
            {CATEGORIES.map(cat => (
              <Picker.Item key={cat} label={cat} value={cat} />
            ))}
          </Picker>
        </View>
        
        <Text style={styles.label}>Tags (Optional)</Text>
        <View style={styles.tagsContainer}>
          {TAGS.map(tag => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.tagChip,
                form.tags.includes(tag) && styles.tagChipSelected
              ]}
              onPress={() => {
                const newTags = form.tags.includes(tag)
                  ? form.tags.filter(t => t !== tag)
                  : [...form.tags, tag];
                setForm({ ...form, tags: newTags });
              }}
            >
              <Text style={[
                styles.tagChipText,
                form.tags.includes(tag) && styles.tagChipTextSelected
              ]}>
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
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
              
              {/* Extraction History */}
              {extractionHistory.length > 0 && (
                <View style={{ marginBottom: 10 }}>
                  <TouchableOpacity 
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}
                    onPress={() => setShowHistoryDropdown(!showHistoryDropdown)}
                  >
                    <Text style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                      📜 Recent Extractions ({extractionHistory.length})
                    </Text>
                    <Text style={{ color: '#4CAF50', marginLeft: 5 }}>
                      {showHistoryDropdown ? '▲' : '▼'}
                    </Text>
                  </TouchableOpacity>
                  
                  {showHistoryDropdown && (
                    <View style={{ backgroundColor: '#f5f5f5', borderRadius: 8, padding: 8, maxHeight: 150 }}>
                      <ScrollView>
                        {extractionHistory.map((item) => (
                          <TouchableOpacity 
                            key={item.id}
                            style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#ddd' }}
                            onPress={() => {
                              setExtractionText(item.fullText);
                              setShowHistoryDropdown(false);
                            }}
                          >
                            <Text style={{ fontWeight: 'bold', fontSize: 14 }} numberOfLines={1}>
                              {item.resultTitle || 'Untitled'}
                            </Text>
                            <Text style={{ fontSize: 12, color: '#666' }} numberOfLines={1}>
                              {item.text}...
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <TouchableOpacity 
                        style={{ marginTop: 8, padding: 8, backgroundColor: '#ff6b6b', borderRadius: 4, alignItems: 'center' }}
                        onPress={() => {
                          if (typeof window !== 'undefined' && window.confirm) {
                            if (window.confirm('Are you sure you want to clear extraction history?')) {
                              clearExtractionHistory();
                            }
                          } else {
                            Alert.alert(
                              'Clear History',
                              'Are you sure you want to clear extraction history?',
                              [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Clear', style: 'destructive', onPress: clearExtractionHistory }
                              ]
                            );
                          }
                        }}
                      >
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Clear History</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
              
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
                    setShowHistoryDropdown(false);
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonExtract]} 
                  onPress={() => performExtraction()}
                  disabled={!extractionText.trim()}
                >
                  <Text style={styles.modalButtonText}>Extract</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Feedback Modal */}
        <Modal
          visible={showFeedbackModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowFeedbackModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxWidth: 400 }]}>
              <Text style={styles.modalTitle}>Was this extraction accurate?</Text>
              <Text style={styles.modalSubtitle}>
                Your feedback helps improve our AI extraction.
              </Text>
              
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, marginVertical: 20 }}>
                <TouchableOpacity 
                  style={{ padding: 20, backgroundColor: '#4CAF50', borderRadius: 50 }}
                  onPress={() => saveFeedback(true, feedbackComment)}
                >
                  <Text style={{ fontSize: 32 }}>👍</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{ padding: 20, backgroundColor: '#f44336', borderRadius: 50 }}
                  onPress={() => saveFeedback(false, feedbackComment)}
                >
                  <Text style={{ fontSize: 32 }}>👎</Text>
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={[styles.input, { marginBottom: 15 }]}
                placeholder="Optional: Tell us what could be improved..."
                value={feedbackComment}
                onChangeText={setFeedbackComment}
                multiline
                numberOfLines={3}
              />
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonCancel, { width: '100%' }]}
                onPress={() => {
                  setShowFeedbackModal(false);
                  setFeedbackComment('');
                }}
              >
                <Text style={styles.modalButtonText}>Skip</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Duplicate Recipe Detection Modal */}
        <Modal
          visible={showDuplicateModal}
          transparent={true}
          animationType="fade"
          onRequestClose={handleDuplicateCancel}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxWidth: 450 }]}>
              <Text style={styles.modalTitle}>⚠️ Similar Recipe Found</Text>
              <Text style={[styles.modalSubtitle, { marginBottom: 15 }]}>
                {duplicateInfo ? formatDuplicateMessage(duplicateInfo) : ''}
              </Text>
              
              <View>
                <TouchableOpacity 
                  style={{ backgroundColor: '#4CAF50', width: '100%', marginBottom: 10, padding: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }} 
                  onPress={handleDuplicateAddAsVariant}
                >
                  <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>Add as Variant</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={{ backgroundColor: '#2196F3', width: '100%', marginBottom: 10, padding: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }} 
                  onPress={handleDuplicateAddAnyway}
                >
                  <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>Add Anyway</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={{ backgroundColor: '#666666', width: '100%', padding: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }} 
                  onPress={handleDuplicateCancel}
                >
                  <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Timer Floating Widget */}
        <FloatingTimerWidget
          timers={timers}
          visible={!showTimerWidget && getRunningTimersCount() > 0}
          onPress={() => setShowTimerWidget(true)}
        />

        {/* Timer Widget Modal */}
        <TimerWidgetModal
          visible={showTimerWidget}
          onClose={() => setShowTimerWidget(false)}
          timers={timers}
          onStartTimer={startTimer}
          onPauseTimer={pauseTimer}
          onResumeTimer={resumeTimer}
          onCancelTimer={cancelTimer}
          onAddTime={addTimeToTimer}
          onDismissCompleted={dismissCompletedTimer}
          onCreateNew={() => {
            setShowTimerWidget(false);
            setShowCreateTimer(true);
          }}
        />

        {/* Create Timer Modal */}
        <CreateTimerModal
          visible={showCreateTimer}
          onClose={() => {
            setShowCreateTimer(false);
            setTimerForRecipe(null);
            setNewTimerForm({ hours: 0, minutes: 5, seconds: 0, label: '' });
          }}
          onCreate={createNewTimer}
          timerForm={newTimerForm}
          setTimerForm={setNewTimerForm}
          recipeContext={timerForRecipe}
        />

        {/* Timer Suggestions Modal */}
        <TimerSuggestionsModal
          visible={showTimerSuggestions}
          onClose={() => {
            setShowTimerSuggestions(false);
            setTimerForRecipe(null);
            setSuggestedTimers([]);
          }}
          suggestions={suggestedTimers}
          onAddSuggestion={addSuggestedTimer}
          onCreateCustom={() => setShowCreateTimer(true)}
          recipeTitle={timerForRecipe?.title}
        />
      </ScrollView>
    );
  }

  // Return wrapped with TopTabBar
  return (
    <View style={{ flex: 1 }}>
      <TopTabBar activeTab={screen} onTabChange={setScreen} />
      <View style={{ flex: 1 }}>
        {screenContent}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <AppContent />
    </NavigationContainer>
  );
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
  // Category and Tags styles
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 10,
    marginLeft: 4,
  },
  pickerContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  picker: {
    height: 50,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  tagChip: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tagChipSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  tagChipText: {
    fontSize: 13,
    color: '#666',
  },
  tagChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  tagChipDisplay: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  tagChipDisplayText: {
    fontSize: 12,
    color: '#1976D2',
  },
  categoryFilterContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    minHeight: 44,
  },
  categoryFilterButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryFilterButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  categoryFilterButtonText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  categoryFilterButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  categoryBadge: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  categoryBadgeText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '600',
  },
  detailSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginRight: 10,
  },
  // Recipe list item styles
  recipeListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  recipeListItemContent: {
    flex: 1,
  },
  recipeListItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  recipeListItemCategory: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  recipeListItemArrow: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '300',
    marginLeft: 12,
  },
});
