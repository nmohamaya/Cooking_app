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
import { getYoutubeTranscript } from '../services/youtubeExtractorService';
import { getTikTokContent } from '../services/socialMediaExtractorService';
import { getInstagramContent } from '../services/socialMediaExtractorService';
import { extractRecipeFromText } from '../services/recipeExtraction';

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
      // Real extraction workflow
      await extractRecipeFromVideo();
    } catch (err) {
      setError(err.message || 'Failed to extract recipe from video');
      setIsProcessing(false);
      setStep('input');
    }
  };

  const extractRecipeFromVideo = async () => {
    try {
      // Step 1: Get video transcript based on URL platform
      setProgressStep(1);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const provider = urlValidator.getVideoProvider(url);
      const videoId = urlValidator.extractVideoId(url);

      if (!videoId) {
        throw new Error(`Could not extract video ID from ${provider} URL`);
      }

      let transcript = null;

      // Fetch transcript based on platform
      if (provider === 'youtube') {
        const result = await getYoutubeTranscript(videoId, 'en');
        if (!result.success) {
          throw new Error(`YouTube: ${result.error || 'Could not retrieve video transcript'}`);
        }
        transcript = result.transcript;
      } else if (provider === 'tiktok') {
        const result = await getTikTokContent(videoId);
        if (!result.success) {
          throw new Error(`TikTok: ${result.error || 'Could not retrieve video content'}`);
        }
        transcript = result.content;
      } else if (provider === 'instagram') {
        const result = await getInstagramContent(videoId);
        if (!result.success) {
          throw new Error(`Instagram: ${result.error || 'Could not retrieve post content'}`);
        }
        transcript = result.content;
      } else if (provider === 'twitter' || provider === 'facebook') {
        throw new Error(`${provider} extraction is not yet supported. Currently supporting: YouTube, TikTok, Instagram`);
      } else {
        throw new Error(`Unsupported platform: ${provider}`);
      }

      if (!transcript || transcript.trim().length === 0) {
        throw new Error(
          `No transcript or description found for this ${provider} video. ` +
          `The video may not have captions/description available. ` +
          `Please try another video with captions enabled.`
        );
      }

      // Step 2: Extract audio (simulated - shows progress)
      setProgressStep(2);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Process with AI
      setProgressStep(3);
      const recipe = await extractRecipeFromText(transcript);

      if (!recipe || !recipe.title) {
        throw new Error(
          'The AI could not identify a recipe in this video. ' +
          'Please ensure the video contains clear cooking instructions. ' +
          'Try a different video that focuses on recipe preparation.'
        );
      }

      setExtractedRecipe(recipe);
      setIsProcessing(false);
      setStep('preview');
    } catch (err) {
      console.error('Video extraction error:', err);
      throw err;
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
              onExtractStart={() => {
                setIsProcessing(true);
                setStep('progress');
                setProgressStep(1);
                setError(null);
              }}
              onExtractSuccess={async () => {
                // Trigger the extraction workflow
                try {
                  await simulateExtractionWorkflow();
                } catch (err) {
                  setError(err.message || 'Failed to extract recipe from video');
                  setIsProcessing(false);
                  setStep('input');
                }
              }}
              onExtractError={(errorInfo) => {
                setError(errorInfo.message || 'Failed to extract recipe');
                setIsProcessing(false);
              }}
              isLoading={isProcessing}
              disabled={isProcessing}
              platforms={['YouTube', 'TikTok', 'Instagram', 'Blog']}
            />

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
