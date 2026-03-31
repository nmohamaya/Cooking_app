import React, { useState, useEffect, useRef } from 'react';
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
import { extractRecipeFromVideo as extractViaApi, cancelExtraction } from '../services/videoExtractionService';

/**
 * VideoRecipeExtractionWorkflow Component
 *
 * Orchestrates the complete video recipe extraction workflow:
 * 1. VideoRecipeInput - User enters and validates URL
 * 2. TranscriptionProgress - Shows extraction progress
 * 3. RecipePreviewModal - Display and edit extracted recipe
 *
 * Uses the backend /api/extract endpoint which implements a fallback cascade:
 * description → transcript → linked websites
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
  const [extractionSteps, setExtractionSteps] = useState([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [extractionSource, setExtractionSource] = useState(null);
  const jobIdRef = useRef(null);

  // Elapsed time timer
  useEffect(() => {
    let timer;
    if (isProcessing) {
      timer = setInterval(() => setElapsedTime(t => t + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isProcessing]);

  const handleUrlChange = (newUrl) => {
    setUrl(newUrl);
    setError(null);
  };

  const handleStartExtraction = async (videoUrl) => {
    const targetUrl = (videoUrl || url || '').trim();

    if (!targetUrl) {
      setError('Please enter a URL');
      return;
    }

    // Move to progress screen
    setStep('progress');
    setIsProcessing(true);
    setExtractionSteps([]);
    setProgress(0);
    setElapsedTime(0);
    setError(null);
    setExtractionSource(null);
    jobIdRef.current = null;

    try {
      console.log('Starting video extraction for URL:', targetUrl);

      const result = await extractViaApi(targetUrl, {
        language: 'en',
        onStepUpdate: (steps) => setExtractionSteps(steps),
        onProgress: (p) => setProgress(p),
        onJobCreated: (id) => { jobIdRef.current = id; },
      });

      if (result.success && result.recipe) {
        console.log('Recipe extracted from:', result.source, '- Title:', result.recipe.title);
        setExtractionSource(result.source);
        setExtractedRecipe(result.recipe);
        setIsProcessing(false);
        setStep('preview');
      } else {
        throw new Error('No recipe could be extracted from this video.');
      }
    } catch (err) {
      console.error('Extraction failed:', err.message);
      const errorMessage = formatErrorMessage(err);
      setError(errorMessage);
      setIsProcessing(false);
      setStep('input');
    }
  };

  /**
   * Format error message with attempt details when available
   */
  const formatErrorMessage = (err) => {
    if (err.attempts && Array.isArray(err.attempts)) {
      const details = err.attempts.map(a => {
        const name = a.source.replace('linked-url', 'Linked sites').replace('linked-urls', 'Linked sites');
        const label = name.charAt(0).toUpperCase() + name.slice(1);
        if (a.status === 'tried') return `${label}: no recipe found`;
        if (a.status === 'skipped') return `${label}: ${a.reason || 'skipped'}`;
        if (a.status === 'insufficient') return `${label}: content too short`;
        return `${label}: ${a.status}`;
      }).join(', ');
      return `Could not extract a recipe. Tried: ${details}. Try a different video.`;
    }
    return err.message || 'Failed to extract recipe from video';
  };

  const handleCancel = () => {
    if (jobIdRef.current) {
      cancelExtraction(jobIdRef.current);
    }
    setIsProcessing(false);
    setStep('input');
    jobIdRef.current = null;
    setExtractionSteps([]);
    setProgress(0);
    setElapsedTime(0);
  };

  const handleRecipeUse = (recipe) => {
    // Format recipe for AddRecipeScreen — normalize to strings
    const formattedRecipe = {
      title: recipe.title || '',
      category: recipe.category || '',
      ingredients: Array.isArray(recipe.ingredients)
        ? recipe.ingredients.join('\n')
        : recipe.ingredients || '',
      instructions: Array.isArray(recipe.instructions)
        ? recipe.instructions.join('\n\n')
        : recipe.instructions || '',
      prepTime: recipe.prepTime || '',
      cookTime: recipe.cookTime || recipe.duration || '',
    };

    onExtractComplete(formattedRecipe);
    handleClose();
  };

  const handleRecipeEdit = () => {
    // Allow editing in the preview modal
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
    setExtractedRecipe(updatedRecipe);
  };

  const handleClose = () => {
    if (isProcessing) {
      handleCancel();
    }
    setStep('input');
    setUrl('');
    setIsValidUrl(false);
    setExtractedRecipe(null);
    setIsProcessing(false);
    setExtractionSteps([]);
    setProgress(0);
    setElapsedTime(0);
    setError(null);
    setExtractionSource(null);
    jobIdRef.current = null;
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

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            <VideoRecipeInput
              onVideoSelected={(video) => handleUrlChange(video?.url ?? '')}
              onExtractStart={() => {}}
              onExtractSuccess={async (data) => {
                await handleStartExtraction(data?.url);
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
              steps={extractionSteps}
              progress={progress}
              isActive={isProcessing}
              onCancel={handleCancel}
              elapsedTime={elapsedTime}
              cancelable={true}
            />
            {extractionSource && (
              <Text style={styles.sourceText}>
                Recipe found via: {extractionSource}
              </Text>
            )}
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
  sourceText: {
    fontSize: 13,
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
});

export default VideoRecipeExtractionWorkflow;
