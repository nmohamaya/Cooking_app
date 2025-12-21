/**
 * Recipe Link Extraction Modal Component
 *
 * Provides UI for extracting recipe content from URLs (YouTube, TikTok, Instagram).
 * Features:
 * - URL input and validation
 * - Real-time extraction preview
 * - Extracted content editing
 * - Auto-fill recipe fields with extracted data
 * - Error handling and retry logic
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { recipeExtractorService } from '../services/recipeExtractorService';
import { youtubeExtractorService } from '../services/youtubeExtractorService';
import { socialMediaExtractorService } from '../services/socialMediaExtractorService';
import { textParsingService } from '../services/textParsingService';

const RecipeLinkExtractionModal = ({
  visible,
  onClose,
  onExtractComplete,
}) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [parsedRecipe, setParsedRecipe] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('input'); // 'input', 'preview', 'edit'
  const [editedRecipe, setEditedRecipe] = useState(null);

  // Reset modal state when opened
  useEffect(() => {
    if (visible) {
      resetModal();
    }
  }, [visible]);

  const resetModal = () => {
    setUrl('');
    setLoading(false);
    setExtractedData(null);
    setParsedRecipe(null);
    setError(null);
    setStep('input');
    setEditedRecipe(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const validateUrl = (urlString) => {
    try {
      const urlObj = new URL(urlString);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const extractContent = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!validateUrl(url)) {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Validate and extract URL content
      const validation = await recipeExtractorService.validateRecipeUrl(url);
      
      if (!validation.isRecipeUrl) {
        setError('This URL does not appear to contain recipe content');
        setLoading(false);
        return;
      }

      // Step 2: Extract content based on platform
      let rawContent = null;
      const urlLower = url.toLowerCase();

      if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
        const youtubeResult = await youtubeExtractorService.getYouTubeContent(url);
        if (youtubeResult) {
          rawContent = youtubeResult;
        }
      } else if (urlLower.includes('tiktok.com') || urlLower.includes('instagram.com')) {
        const socialResult = await socialMediaExtractorService.getSocialMediaContentCached(url);
        if (socialResult) {
          rawContent = socialResult;
        }
      } else {
        // Generic extraction
        rawContent = { url, title: 'Recipe Content', content: url };
      }

      if (!rawContent) {
        setError('Unable to extract content from this URL. The content may be restricted or unavailable.');
        setLoading(false);
        return;
      }

      setExtractedData(rawContent);

      // Step 3: Parse extracted content
      const textToParse = rawContent.caption || rawContent.content || rawContent.title || '';
      const parsed = await textParsingService.parseRecipeText(textToParse);

      // Validate parsed recipe
      if (!textParsingService.isValidParsedRecipe(parsed)) {
        setError('Could not extract recipe information from this content. The content may not contain structured recipe data.');
        setLoading(false);
        return;
      }

      setParsedRecipe(parsed);
      setEditedRecipe({
        title: rawContent.title || 'Recipe from Link',
        category: '',
        ingredients: formatIngredientsForDisplay(parsed.ingredients),
        instructions: parsed.instructions,
        prepTime: parsed.prepTime ? `${parsed.prepTime} minutes` : '',
        cookTime: parsed.cookTime ? `${parsed.cookTime} minutes` : '',
      });

      setStep('preview');
    } catch (err) {
      console.error('Extraction error:', err);
      setError(`Error during extraction: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatIngredientsForDisplay = (ingredients) => {
    if (!Array.isArray(ingredients)) return '';
    
    return ingredients
      .map(ing => {
        let formatted = '';
        if (ing.quantity && ing.unit) {
          formatted = `${ing.quantity} ${ing.unit} `;
        } else if (ing.quantity) {
          formatted = `${ing.quantity} `;
        }
        formatted += ing.item || '';
        return formatted;
      })
      .join('\n');
  };

  const handleUseExtracted = () => {
    if (editedRecipe && onExtractComplete) {
      onExtractComplete(editedRecipe);
      handleClose();
    }
  };

  const updateEditedField = (field, value) => {
    setEditedRecipe(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const renderInputStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Enter Recipe URL</Text>
      <Text style={styles.stepDescription}>
        Paste a link from YouTube, TikTok, Instagram, or a recipe blog
      </Text>

      <TextInput
        style={styles.urlInput}
        placeholder="https://www.youtube.com/watch?v=..."
        placeholderTextColor="#999"
        value={url}
        onChangeText={setUrl}
        editable={!loading}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity
        style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled]}
        onPress={extractContent}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.buttonText}>Extract Recipe</Text>
        )}
      </TouchableOpacity>

      {extractedData && (
        <View style={styles.sourceInfo}>
          <Text style={styles.sourceLabel}>Source:</Text>
          <Text style={styles.sourceValue}>{extractedData.title || url}</Text>
        </View>
      )}
    </View>
  );

  const renderPreviewStep = () => (
    <ScrollView style={styles.stepContainer} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.stepTitle}>Review Extracted Recipe</Text>
      
      {parsedRecipe && (
        <View style={styles.confidenceBox}>
          <Text style={styles.confidenceLabel}>Extraction Confidence:</Text>
          <View style={styles.confidenceBar}>
            <View
              style={[
                styles.confidenceFill,
                { width: `${Math.round(parsedRecipe.confidence.overall * 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.confidenceValue}>
            {Math.round(parsedRecipe.confidence.overall * 100)}%
          </Text>
        </View>
      )}

      <View style={styles.previewSection}>
        <Text style={styles.sectionLabel}>Title</Text>
        <TextInput
          style={styles.editInput}
          value={editedRecipe?.title}
          onChangeText={(val) => updateEditedField('title', val)}
          placeholder="Recipe Title"
        />
      </View>

      <View style={styles.previewSection}>
        <Text style={styles.sectionLabel}>Category</Text>
        <TextInput
          style={styles.editInput}
          value={editedRecipe?.category}
          onChangeText={(val) => updateEditedField('category', val)}
          placeholder="e.g., Italian, Dessert"
        />
      </View>

      <View style={styles.previewSection}>
        <Text style={styles.sectionLabel}>Prep Time</Text>
        <TextInput
          style={styles.editInput}
          value={editedRecipe?.prepTime}
          onChangeText={(val) => updateEditedField('prepTime', val)}
          placeholder="e.g., 15 minutes"
        />
      </View>

      <View style={styles.previewSection}>
        <Text style={styles.sectionLabel}>Cook Time</Text>
        <TextInput
          style={styles.editInput}
          value={editedRecipe?.cookTime}
          onChangeText={(val) => updateEditedField('cookTime', val)}
          placeholder="e.g., 30 minutes"
        />
      </View>

      <View style={styles.previewSection}>
        <Text style={styles.sectionLabel}>Ingredients</Text>
        <TextInput
          style={[styles.editInput, styles.multilineInput]}
          value={editedRecipe?.ingredients}
          onChangeText={(val) => updateEditedField('ingredients', val)}
          placeholder="Ingredients (one per line)"
          multiline
          numberOfLines={6}
        />
      </View>

      <View style={styles.previewSection}>
        <Text style={styles.sectionLabel}>Instructions</Text>
        <TextInput
          style={[styles.editInput, styles.multilineInput]}
          value={editedRecipe?.instructions}
          onChangeText={(val) => updateEditedField('instructions', val)}
          placeholder="Cooking instructions"
          multiline
          numberOfLines={6}
        />
      </View>

      {parsedRecipe?.temperatures && parsedRecipe.temperatures.length > 0 && (
        <View style={styles.metadataSection}>
          <Text style={styles.metadataLabel}>Temperatures Found:</Text>
          <Text style={styles.metadataValue}>
            {parsedRecipe.temperatures.map(t => `${t.value}°${t.unit}`).join(', ')}
          </Text>
        </View>
      )}

      {parsedRecipe?.cookingMethods && parsedRecipe.cookingMethods.length > 0 && (
        <View style={styles.metadataSection}>
          <Text style={styles.metadataLabel}>Cooking Methods:</Text>
          <Text style={styles.metadataValue}>
            {parsedRecipe.cookingMethods.join(', ')}
          </Text>
        </View>
      )}

      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => setStep('input')}
        >
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleUseExtracted}
        >
          <Text style={styles.buttonText}>Use This Recipe</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Extract Recipe from Link</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {step === 'input' && renderInputStep()}
        {step === 'preview' && renderPreviewStep()}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  stepContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  urlInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 14,
    marginBottom: 15,
    backgroundColor: '#fafafa',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  primaryButton: {
    backgroundColor: '#28a745',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    flex: 1,
    marginRight: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#ffebee',
    borderRadius: 4,
  },
  sourceInfo: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sourceLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  sourceValue: {
    fontSize: 14,
    color: '#333',
  },
  confidenceBox: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  confidenceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  confidenceBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#4caf50',
  },
  confidenceValue: {
    fontSize: 12,
    color: '#666',
  },
  previewSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fafafa',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  metadataSection: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 6,
  },
  metadataLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 5,
  },
  metadataValue: {
    fontSize: 13,
    color: '#1b5e20',
  },
  buttonGroup: {
    flexDirection: 'row',
    marginTop: 20,
    paddingHorizontal: 10,
  },
});

export default RecipeLinkExtractionModal;
