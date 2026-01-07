import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * RecipePreviewModal Component
 * 
 * Displays extracted recipe details with full edit capability.
 * Users can review, edit, and save recipe data before adding to their collection.
 * 
 * Features:
 * - Display extracted recipe details (title, ingredients, steps, duration)
 * - Thumbnail preview of source video
 * - Edit mode with form inputs for manual corrections
 * - Action buttons: Use Recipe, Edit, Discard
 * - Validation and error handling
 * - Loading states during save
 */

const RecipePreviewModal = ({
  visible = false,
  recipe = null,
  onUse = () => {},
  onEdit = () => {},
  onDiscard = () => {},
  onSave = () => {},
  isLoading = false,
}) => {
  const [editMode, setEditMode] = useState(false);
  const [editedRecipe, setEditedRecipe] = useState(recipe || {});
  const [isSaving, setIsSaving] = useState(false);

  // Update edited recipe when recipe prop changes
  React.useEffect(() => {
    if (recipe) {
      setEditedRecipe(recipe);
    }
  }, [recipe]);

  const handleUseRecipe = () => {
    if (!recipe || !recipe.title) {
      Alert.alert('Invalid Recipe', 'Recipe title is required');
      return;
    }
    onUse(recipe);
  };

  const handleEditRecipe = () => {
    setEditMode(!editMode);
  };

  const handleDiscardRecipe = () => {
    Alert.alert(
      'Discard Recipe',
      'Are you sure you want to discard this recipe?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Discard',
          onPress: () => {
            setEditMode(false);
            setEditedRecipe(recipe || {});
            onDiscard();
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleSaveRecipe = async () => {
    if (!editedRecipe.title) {
      Alert.alert('Validation Error', 'Recipe title is required');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editedRecipe);
      setEditMode(false);
      // Success feedback handled by parent component
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save recipe');
    } finally {
      setIsSaving(false);
    }
  };

  const updateEditedField = (field, value) => {
    setEditedRecipe(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const displayRecipe = editMode ? editedRecipe : recipe;

  if (!recipe) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onDiscard}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {editMode ? 'Edit Recipe' : 'Recipe Preview'}
          </Text>
          <TouchableOpacity
            onPress={onDiscard}
            style={styles.closeButton}
          >
            <Ionicons name="close-outline" size={28} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Thumbnail */}
          {displayRecipe.thumbnail && (
            <View style={styles.thumbnailContainer}>
              <Image
                source={{ uri: displayRecipe.thumbnail }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
              <View style={styles.sourceOverlay}>
                <Ionicons name="play-circle-outline" size={40} color="#fff" />
                <Text style={styles.sourceText}>
                  Source: {displayRecipe.provider || 'Video'}
                </Text>
              </View>
            </View>
          )}

          {/* Recipe Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recipe Information</Text>

            {/* Title */}
            <View style={styles.field}>
              <Text style={styles.label}>Title *</Text>
              {editMode ? (
                <TextInput
                  style={styles.input}
                  value={editedRecipe.title || ''}
                  onChangeText={text => updateEditedField('title', text)}
                  placeholder="Recipe title"
                  editable={!isSaving}
                />
              ) : (
                <Text style={styles.value}>{displayRecipe.title}</Text>
              )}
            </View>

            {/* Duration */}
            <View style={styles.field}>
              <Text style={styles.label}>Duration</Text>
              {editMode ? (
                <TextInput
                  style={styles.input}
                  value={editedRecipe.duration || ''}
                  onChangeText={text => updateEditedField('duration', text)}
                  placeholder="e.g., 30 minutes"
                  editable={!isSaving}
                />
              ) : (
                <Text style={styles.value}>
                  {displayRecipe.duration || 'Not specified'}
                </Text>
              )}
            </View>

            {/* Difficulty */}
            <View style={styles.field}>
              <Text style={styles.label}>Difficulty</Text>
              {editMode ? (
                <TextInput
                  style={styles.input}
                  value={editedRecipe.difficulty || ''}
                  onChangeText={text => updateEditedField('difficulty', text)}
                  placeholder="e.g., Easy, Medium, Hard"
                  editable={!isSaving}
                />
              ) : (
                <Text style={styles.value}>
                  {displayRecipe.difficulty || 'Not specified'}
                </Text>
              )}
            </View>

            {/* Source */}
            <View style={styles.field}>
              <Text style={styles.label}>Source</Text>
              <View style={styles.sourceInfo}>
                <Ionicons name="link-outline" size={16} color="#666" />
                <Text style={styles.sourceUrl} numberOfLines={1}>
                  {displayRecipe.provider || 'Video Extract'}
                </Text>
              </View>
            </View>
          </View>

          {/* Ingredients */}
          {displayRecipe.ingredients && displayRecipe.ingredients.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              {editMode ? (
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  value={
                    Array.isArray(displayRecipe.ingredients)
                      ? displayRecipe.ingredients.join('\n')
                      : displayRecipe.ingredients
                  }
                  onChangeText={text =>
                    updateEditedField('ingredients', text.split('\n'))
                  }
                  placeholder="One ingredient per line"
                  multiline
                  editable={!isSaving}
                />
              ) : (
                <View style={styles.ingredientList}>
                  {(Array.isArray(displayRecipe.ingredients)
                    ? displayRecipe.ingredients
                    : [displayRecipe.ingredients]
                  ).map((ingredient, index) => (
                    <View key={index} style={styles.ingredientItem}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#4CAF50"
                        style={styles.ingredientIcon}
                      />
                      <Text style={styles.ingredientText}>{ingredient}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Instructions */}
          {displayRecipe.instructions && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Instructions</Text>
              {editMode ? (
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  value={
                    Array.isArray(displayRecipe.instructions)
                      ? displayRecipe.instructions.join('\n\n')
                      : displayRecipe.instructions
                  }
                  onChangeText={text =>
                    updateEditedField('instructions', text.split('\n\n'))
                  }
                  placeholder="One step per paragraph"
                  multiline
                  editable={!isSaving}
                />
              ) : (
                <View style={styles.instructionList}>
                  {(Array.isArray(displayRecipe.instructions)
                    ? displayRecipe.instructions
                    : [displayRecipe.instructions]
                  ).map((instruction, index) => (
                    <View key={index} style={styles.instructionItem}>
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.instructionText}>{instruction}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Additional Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            {editMode ? (
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={displayRecipe.notes || ''}
                onChangeText={text => updateEditedField('notes', text)}
                placeholder="Add any additional notes..."
                multiline
                editable={!isSaving}
              />
            ) : (
              <Text style={styles.value}>
                {displayRecipe.notes || 'No additional notes'}
              </Text>
            )}
          </View>

          {/* Spacing for button visibility */}
          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionBar}>
          {editMode ? (
            <>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setEditMode(false);
                  setEditedRecipe(recipe);
                }}
                disabled={isSaving}
              >
                <Ionicons name="close-outline" size={20} color="#666" />
                <Text style={[styles.buttonText, { color: '#666' }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSaveRecipe}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-outline" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.button, styles.discardButton]}
                onPress={handleDiscardRecipe}
                disabled={isLoading}
              >
                <Ionicons name="trash-outline" size={20} color="#D32F2F" />
                <Text style={[styles.buttonText, { color: '#D32F2F' }]}>
                  Discard
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.editButton]}
                onPress={handleEditRecipe}
                disabled={isLoading}
              >
                <Ionicons name="create-outline" size={20} color="#1976D2" />
                <Text style={[styles.buttonText, { color: '#1976D2' }]}>
                  Edit
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.useButton]}
                onPress={handleUseRecipe}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Use Recipe</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  thumbnailContainer: {
    position: 'relative',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: 200,
    backgroundColor: '#e0e0e0',
  },
  sourceOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  sourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  sourceUrl: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
  },
  ingredientList: {
    marginBottom: 8,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ingredientIcon: {
    marginRight: 8,
  },
  ingredientText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  instructionList: {
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  instructionText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 80,
  },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    marginHorizontal: 3,
  },
  useButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  editButton: {
    backgroundColor: '#fff',
    borderColor: '#1976D2',
  },
  discardButton: {
    backgroundColor: '#fff',
    borderColor: '#D32F2F',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});

export default RecipePreviewModal;
