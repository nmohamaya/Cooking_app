import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import VideoRecipeInput from './VideoRecipeInput';
import TranscriptionProgress from './TranscriptionProgress';
import RecipePreviewModal from './RecipePreviewModal';
import urlValidator from '../utils/urlValidator';
import { extractRecipeFromYoutube } from '../services/youtubeExtractorService';
import { extractRecipeFromTikTokViaApi } from '../services/tiktokExtractorService';
import { extractRecipeFromInstagramViaApi } from '../services/instagramExtractorService';
import { extractRecipeFromWebsiteViaApi } from '../services/websiteExtractorService';

/**
 * VideoRecipeExtractionWorkflow Component
 *
 * Orchestrates the complete video recipe extraction workflow:
 * 1. VideoRecipeInput - User enters and validates URL
 * 2. TranscriptionProgress - Shows extraction progress
 * 3. RecipePreviewModal - Display and edit extracted recipe
 *
 * Integrates all Phase 5 UI components into a seamless workflow
 * for extracting recipes from video URLs.
 */
const VideoRecipeExtractionWorkflow = ({
  visible,
  onClose,
  onExtractComplete,
}) => {
  const [step, setStep] = useState('input'); // 'input', 'progress', 'preview'
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [extractedRecipe, setExtractedRecipe] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState(1);
  const [error, setError] = useState(null);

  const progressSteps = [
    { id: 1, label: 'Downloading video', icon: '📥' },
    { id: 2, label: 'Extracting audio', icon: '🎵' },
    { id: 3, label: 'Processing with AI', icon: '🤖' },
  ];

  const handleUrlChange = (newUrl) => {
    setUrl(newUrl);
    // Validate URL with urlValidator utility
    const isValid = urlValidator.isValidVideoUrl(newUrl);
    setIsValidUrl(isValid);
    setError(null);
  };

  const handleStartExtraction = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!isValidUrl) {
      setError('Invalid URL. Please enter a valid video URL');
      return;
    }

    // Move to progress screen
    setStep('progress');
    setIsProcessing(true);
    setProgressStep(1);
    setError(null);

    try {
      // Simulate extraction workflow with progress updates
      await simulateExtractionWorkflow();
    } catch (err) {
      setError(err.message || 'Failed to extract recipe from video');
      setIsProcessing(false);
      setStep('input');
    }
  };

  const simulateExtractionWorkflow = async () => {
    try {
      // Determine platform from URL
      let platformFunction = null;
      let platform = 'unknown';

      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        platform = 'youtube';
        platformFunction = extractRecipeFromYoutube;
      } else if (url.includes('tiktok.com') || url.includes('vm.tiktok') || url.includes('vt.tiktok')) {
        platform = 'tiktok';
        platformFunction = extractRecipeFromTikTokViaApi;
      } else if (url.includes('instagram.com') || url.includes('ig.me')) {
        platform = 'instagram';
        platformFunction = extractRecipeFromInstagramViaApi;
      } else {
        // Assume it's a website/blog
        platform = 'website';
        platformFunction = extractRecipeFromWebsiteViaApi;
      }

      // Step 1: Download/fetch video
      setProgressStep(1);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Extract audio/content
      setProgressStep(2);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Process with AI (actual API call)
      setProgressStep(3);

      // Call the appropriate extraction function based on platform
      const result = await platformFunction(url, {
        timeout: 60000,
        retryAttempts: 3,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to extract recipe');
      }

      // Format the recipe from API response
      const recipe = result.recipe || {
        title: 'Extracted Recipe',
        ingredients: [],
        instructions: [],
      };

      setExtractedRecipe({
        title: recipe.title || 'Extracted Recipe',
        duration: recipe.duration || 'N/A',
        difficulty: recipe.difficulty || 'Medium',
        provider: url,
        thumbnail: recipe.thumbnail || null,
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [recipe.ingredients || ''],
        instructions: Array.isArray(recipe.instructions) ? recipe.instructions : [recipe.instructions || ''],
        notes: recipe.notes || '',
      });

      setIsProcessing(false);
      setStep('preview');
    } catch (err) {
      console.error(`Failed to extract recipe from ${url}:`, err);
      setError(err.message || 'Failed to extract recipe from video');
      setIsProcessing(false);
      setStep('input');
    }
  };

  const handleRecipeUse = (recipe) => {
    // Format recipe for AddRecipeScreen
    const formattedRecipe = {
      title: recipe.title || '',
      category: '', // Could be extracted from tags/metadata
      ingredients: Array.isArray(recipe.ingredients)
        ? recipe.ingredients.join('\n')
        : recipe.ingredients || '',
      instructions: Array.isArray(recipe.instructions)
        ? recipe.instructions.join('\n\n')
        : recipe.instructions || '',
      prepTime: recipe.prepTime || '',
      cookTime: recipe.duration || '',
    };

    // Callback to AddRecipeScreen
    onExtractComplete(formattedRecipe);

    // Close workflow
    handleClose();
  };

  const handleRecipeEdit = () => {
    // For now, just allow editing in the preview modal
    // In future, could open edit screen
  };

  const handleRecipeDiscard = () => {
    Alert.alert('Discard Recipe', 'Are you sure you want to discard this recipe?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Discard',
        onPress: () => {
          setStep('input');
          setExtractedRecipe(null);
          setUrl('');
          setIsValidUrl(false);
        },
      },
    ]);
  };

  const handleRecipeSave = (updatedRecipe) => {
    // Update recipe in preview
    setExtractedRecipe(updatedRecipe);
  };

  const handleClose = () => {
    setStep('input');
    setUrl('');
    setIsValidUrl(false);
    setExtractedRecipe(null);
    setIsProcessing(false);
    setProgressStep(1);
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header with close button */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Extract Recipe from Video</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Step 1: URL Input */}
        {step === 'input' && (
          <View style={styles.content}>
            <Text style={styles.stepTitle}>Step 1: Enter Video URL</Text>
            <Text style={styles.description}>
              Paste a link to a cooking video from YouTube, TikTok, Instagram, or a blog.
            </Text>

            <VideoRecipeInput
              onVideoSelected={(video) => handleUrlChange(video?.url ?? '')}
              isLoading={isProcessing}
              disabled={isProcessing}
              platforms={['YouTube', 'TikTok', 'Instagram', 'Blog']}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[styles.nextButton, !isValidUrl && styles.buttonDisabled]}
              onPress={handleStartExtraction}
              disabled={!isValidUrl}
            >
              <Text style={styles.nextButtonText}>
                {isProcessing ? 'Processing...' : 'Extract Recipe'}
              </Text>
            </TouchableOpacity>

            <View style={styles.supportedPlatforms}>
              <Text style={styles.platformsTitle}>Supported Platforms:</Text>
              <Text style={styles.platformItem}>🎥 YouTube</Text>
              <Text style={styles.platformItem}>🎵 TikTok</Text>
              <Text style={styles.platformItem}>📸 Instagram</Text>
              <Text style={styles.platformItem}>🌐 Blog Posts</Text>
            </View>
          </View>
        )}

        {/* Step 2: Progress */}
        {step === 'progress' && (
          <View style={styles.content}>
            <Text style={styles.stepTitle}>Step 2: Processing Video</Text>
            <TranscriptionProgress
              steps={progressSteps}
              currentStep={progressStep}
              isLoading={isProcessing}
            />
            <Text style={styles.processingText}>
              Please wait while we extract the recipe from the video...
            </Text>
          </View>
        )}

        {/* Step 3: Recipe Preview */}
        {step === 'preview' && extractedRecipe && (
          <RecipePreviewModal
            visible={true}
            recipe={extractedRecipe}
            onUse={handleRecipeUse}
            onEdit={handleRecipeEdit}
            onDiscard={handleRecipeDiscard}
            onSave={handleRecipeSave}
            isLoading={false}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    marginBottom: 15,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#ffebee',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
  },
  nextButton: {
    backgroundColor: '#1976D2',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#bdbdbd',
    opacity: 0.6,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  supportedPlatforms: {
    marginTop: 40,
    paddingTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  platformsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  platformItem: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    paddingLeft: 5,
  },
  processingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default VideoRecipeExtractionWorkflow;
