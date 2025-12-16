import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [recipes, setRecipes] = useState([]);
  const [screen, setScreen] = useState('home'); // 'home', 'add', 'detail', 'edit'
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [form, setForm] = useState({ title: '', category: '', ingredients: '', instructions: '', prepTime: '', cookTime: '' });

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
    setForm({ title: '', category: '', ingredients: '', instructions: '', prepTime: '', cookTime: '' });
    setSelectedRecipe(null);
  };

  // Home Screen
  if (screen === 'home') {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>My Recipes</Text>
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.recipeItem}
              onPress={() => {
                setSelectedRecipe(item);
                setScreen('detail');
              }}
            >
              <Text style={styles.recipeTitle}>{item.title}</Text>
              <Text style={styles.recipeCategory}>{item.category || 'No category'}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No recipes yet</Text>}
          scrollEnabled={recipes.length > 5}
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
      </View>
    );
  }

  // Add Recipe Screen
  if (screen === 'add') {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Add Recipe</Text>
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
        <TouchableOpacity style={styles.button} onPress={addRecipe}>
          <Text style={styles.buttonText}>Save Recipe</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#666' }]} onPress={() => setScreen('home')}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Recipe Detail Screen
  if (screen === 'detail' && selectedRecipe) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.header}>{selectedRecipe.title}</Text>
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
        <TouchableOpacity style={styles.button} onPress={updateRecipe}>
          <Text style={styles.buttonText}>Save Changes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#666' }]} onPress={() => setScreen('home')}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
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
  recipeItem: {
    backgroundColor: 'white',
    padding: 12,
    marginBottom: 8,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
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
});
