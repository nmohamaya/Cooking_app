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
    Alert.alert(
      'Import Recipes',
      'To import recipes, paste the JSON content or use file picker',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Paste JSON',
          onPress: () => {
            Alert.prompt(
              'Import JSON',
              'Paste your recipe JSON here:',
              async (text) => {
                try {
                  const data = JSON.parse(text);
                  if (data.recipes && Array.isArray(data.recipes)) {
                    const imported = data.recipes.filter(r => r.id && r.title);
                    saveRecipes([...recipes, ...imported]);
                    Alert.alert('Success', `Imported ${imported.length} recipes!`);
                  } else {
                    Alert.alert('Error', 'Invalid format');
                  }
                } catch (error) {
                  Alert.alert('Error', 'Failed to parse JSON');
                }
              }
            );
          },
        },
      ]
    );
  };

  // Home Screen
  if (screen === 'home') {
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
              {item.imageUri ? (
                <Image source={{ uri: item.imageUri }} style={styles.recipeThumbnail} />
              ) : null}
              <View style={styles.recipeInfo}>
                <Text style={styles.recipeTitle}>{item.title}</Text>
                <Text style={styles.recipeCategory}>{item.category || 'No category'}</Text>
                {item.videoUrl ? <Text style={styles.videoIndicator}>🎥 Has video</Text> : null}
              </View>
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
});
