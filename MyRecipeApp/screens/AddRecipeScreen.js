import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRecipes } from '../contexts/RecipeContext';
import VideoRecipeExtractionWorkflow from '../components/VideoRecipeExtractionWorkflow';

const AddRecipeScreen = ({ navigation }) => {
  const { addRecipe } = useRecipes();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [extractionModalVisible, setExtractionModalVisible] = useState(false);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a recipe title');
      return;
    }

    const recipe = {
      title: title.trim(),
      category: category.trim(),
      ingredients: ingredients.trim(),
      instructions: instructions.trim(),
      prepTime: prepTime.trim(),
      cookTime: cookTime.trim(),
    };

    addRecipe(recipe);
    navigation.goBack();
  };

  const handleExtractComplete = (extractedRecipe) => {
    // Auto-fill fields from extracted recipe
    setTitle(extractedRecipe.title || '');
    setCategory(extractedRecipe.category || '');
    setIngredients(extractedRecipe.ingredients || '');
    setInstructions(extractedRecipe.instructions || '');
    setPrepTime(extractedRecipe.prepTime || '');
    setCookTime(extractedRecipe.cookTime || '');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Add New Recipe</Text>

      <TouchableOpacity
        style={styles.extractButton}
        onPress={() => setExtractionModalVisible(true)}
      >
        <Text style={styles.extractButtonIcon}>🔗</Text>
        <View style={styles.extractButtonContent}>
          <Text style={styles.extractButtonTitle}>Extract from Link</Text>
          <Text style={styles.extractButtonSubtitle}>
            YouTube, TikTok, Instagram, or blog
          </Text>
        </View>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Recipe Title"
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        style={styles.input}
        placeholder="Category (e.g., Italian, Dessert)"
        value={category}
        onChangeText={setCategory}
      />

      <TextInput
        style={[styles.input, styles.multilineInput]}
        placeholder="Ingredients (one per line)"
        value={ingredients}
        onChangeText={setIngredients}
        multiline
        numberOfLines={4}
      />

      <TextInput
        style={[styles.input, styles.multilineInput]}
        placeholder="Instructions"
        value={instructions}
        onChangeText={setInstructions}
        multiline
        numberOfLines={6}
      />

      <TextInput
        style={styles.input}
        placeholder="Prep Time (e.g., 15 mins)"
        value={prepTime}
        onChangeText={setPrepTime}
      />

      <TextInput
        style={styles.input}
        placeholder="Cook Time (e.g., 30 mins)"
        value={cookTime}
        onChangeText={setCookTime}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Recipe</Text>
      </TouchableOpacity>

      <VideoRecipeExtractionWorkflow
        visible={extractionModalVisible}
        onClose={() => setExtractionModalVisible(false)}
        onExtractComplete={handleExtractComplete}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  extractButton: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#2196f3',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  extractButtonIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  extractButtonContent: {
    flex: 1,
  },
  extractButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 4,
  },
  extractButtonSubtitle: {
    fontSize: 13,
    color: '#1565c0',
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AddRecipeScreen;