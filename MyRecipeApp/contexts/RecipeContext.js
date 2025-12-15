import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RecipeContext = createContext();

export const useRecipes = () => useContext(RecipeContext);

export const RecipeProvider = ({ children }) => {
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      const storedRecipes = await AsyncStorage.getItem('recipes');
      if (storedRecipes) {
        const parsed = JSON.parse(storedRecipes);
        // Normalize types to prevent casting errors
        const normalized = parsed.map(recipe => ({
          ...recipe,
          title: String(recipe.title || ''),
          category: String(recipe.category || ''),
          ingredients: String(recipe.ingredients || ''),
          instructions: String(recipe.instructions || ''),
          prepTime: String(recipe.prepTime || ''),
          cookTime: String(recipe.cookTime || ''),
          id: String(recipe.id || Date.now())
        }));
        setRecipes(normalized);
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

  const addRecipe = (recipe) => {
    const normalizedRecipe = {
      ...recipe,
      id: Date.now().toString(),
      title: String(recipe.title || ''),
      category: String(recipe.category || ''),
      ingredients: String(recipe.ingredients || ''),
      instructions: String(recipe.instructions || ''),
      prepTime: String(recipe.prepTime || ''),
      cookTime: String(recipe.cookTime || '')
    };
    const newRecipes = [...recipes, normalizedRecipe];
    saveRecipes(newRecipes);
  };

  const updateRecipe = (id, updatedRecipe) => {
    const normalizedRecipe = {
      ...updatedRecipe,
      id: String(id),
      title: String(updatedRecipe.title || ''),
      category: String(updatedRecipe.category || ''),
      ingredients: String(updatedRecipe.ingredients || ''),
      instructions: String(updatedRecipe.instructions || ''),
      prepTime: String(updatedRecipe.prepTime || ''),
      cookTime: String(updatedRecipe.cookTime || '')
    };
    const newRecipes = recipes.map(recipe =>
      recipe.id === id ? normalizedRecipe : recipe
    );
    saveRecipes(newRecipes);
  };

  const deleteRecipe = (id) => {
    const newRecipes = recipes.filter(recipe => recipe.id !== id);
    saveRecipes(newRecipes);
  };

  return (
    <RecipeContext.Provider value={{ recipes, addRecipe, updateRecipe, deleteRecipe }}>
      {children}
    </RecipeContext.Provider>
  );
};