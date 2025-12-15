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
        setRecipes(JSON.parse(storedRecipes));
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
    const newRecipes = [...recipes, { ...recipe, id: Date.now().toString() }];
    saveRecipes(newRecipes);
  };

  const updateRecipe = (id, updatedRecipe) => {
    const newRecipes = recipes.map(recipe =>
      recipe.id === id ? { ...updatedRecipe, id } : recipe
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