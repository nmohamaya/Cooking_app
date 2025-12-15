import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRecipes } from '../contexts/RecipeContext';

const EditRecipeScreen = ({ route, navigation }) => {
  const { recipe } = route.params;
  const { updateRecipe } = useRecipes();

  const [title, setTitle] = useState(String(recipe.title || ''));
  const [category, setCategory] = useState(String(recipe.category || ''));
  const [ingredients, setIngredients] = useState(String(recipe.ingredients || ''));
  const [instructions, setInstructions] = useState(String(recipe.instructions || ''));
  const [prepTime, setPrepTime] = useState(String(recipe.prepTime || ''));
  const [cookTime, setCookTime] = useState(String(recipe.cookTime || ''));

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a recipe title');
      return;
    }

    const updatedRecipe = {
      title: title.trim(),
      category: category.trim(),
      ingredients: ingredients.trim(),
      instructions: instructions.trim(),
      prepTime: prepTime.trim(),
      cookTime: cookTime.trim(),
    };

    updateRecipe(recipe.id, updatedRecipe);
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Edit Recipe</Text>

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
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>
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
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
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

export default EditRecipeScreen;