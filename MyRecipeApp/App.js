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
  
  // Search and Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    prepTimeMax: null, // in minutes
    cookTimeMax: null, // in minutes
  });
  const [sortBy, setSortBy] = useState('title-asc'); // 'title-asc', 'title-desc', 'date-new', 'date-old'
  
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

  // Load recipes on mount
  useEffect(() => {
    loadRecipes();
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
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: () => {
          saveRecipes(recipes.filter(r => r.id !== id));
          setScreen('home');
        },
      },
    ]);
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

  // Home Screen
  if (screen === 'home') {
    const filteredRecipes = getFilteredRecipes();
    const activeFilters = getActiveFilterCount();

    return (
      <View style={styles.container}>
        <Text style={styles.header}>My Recipes</Text>
        <View style={styles.headerButtons}>
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
});
