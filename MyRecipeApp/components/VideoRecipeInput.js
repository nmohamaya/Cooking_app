import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Animated,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import urlValidator from '../utils/urlValidator';

const VideoRecipeInput = ({
  onExtractStart = () => {},
  onExtractSuccess = () => {},
  onExtractError = () => {},
  isLoading = false,
  disabled = false,
  platforms = ['youtube', 'tiktok', 'instagram', 'twitter', 'facebook'],
  onVideoSelected = () => {},
}) => {
  const [url, setUrl] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [validationState, setValidationState] = useState(null); // 'valid', 'invalid', or null
  const [extractedData, setExtractedData] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Handle URL input change
  const handleUrlChange = useCallback(
    (text) => {
      const normalized = text.trim();
      setUrl(normalized);

      // Check validation
      if (normalized.length > 0) {
        const isValid = urlValidator.isValidVideoUrl(normalized);
        setValidationState(isValid ? 'valid' : 'invalid');

        // Generate suggestions for invalid URLs
        if (!isValid) {
          const suggestions = generateSuggestions(normalized);
          setSuggestions(suggestions);
          setShowSuggestions(suggestions.length > 0);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } else {
        setValidationState(null);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    },
    []
  );

  // Generate helpful suggestions for invalid URLs
  const generateSuggestions = (invalidUrl) => {
    const suggestions = [];

    // Detect provider
    const provider = urlValidator.getVideoProvider(invalidUrl);

    // If URL is close to valid, suggest the correct format
    const supportedProviders = urlValidator.getSupportedProviders();

    // Check if user is trying to use a supported platform
    const lowerUrl = invalidUrl.toLowerCase();
    for (const p of supportedProviders) {
      if (
        lowerUrl.includes(p.toLowerCase()) ||
        lowerUrl.includes(p.substring(0, 4))
      ) {
        suggestions.push({
          id: p,
          text: `Using ${urlValidator.getProviderDisplayName(p)}`,
          provider: p,
        });
      }
    }

    // Add generic suggestion if no platform detected
    if (suggestions.length === 0) {
      suggestions.push({
        id: 'platforms',
        text: `Supported platforms: ${supportedProviders
          .map((p) => urlValidator.getProviderDisplayName(p))
          .join(', ')}`,
        provider: null,
      });
    }

    return suggestions;
  };

  // Extract video data
  const handleExtract = useCallback(async () => {
    if (!url.trim() || !urlValidator.isValidVideoUrl(url)) {
      onExtractError({
        error: 'Invalid URL',
        message: urlValidator.getUrlErrorMessage(url),
      });
      return;
    }

    try {
      onExtractStart();
      setShowSuggestions(false);
      Keyboard.dismiss();

      // Simulate extraction process
      const provider = urlValidator.getVideoProvider(url);
      const videoId = urlValidator.extractVideoId(url);

      const data = {
        url,
        provider,
        videoId,
        title: `${urlValidator.getProviderDisplayName(provider)} Video`,
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        duration: 0,
        extractedAt: new Date().toISOString(),
      };

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      setExtractedData(data);
      onExtractSuccess(data);
      setValidationState('valid');
    } catch (error) {
      onExtractError({
        error: 'Extraction failed',
        message: error.message,
      });
      setValidationState('invalid');
    }
  }, [url, onExtractStart, onExtractSuccess, onExtractError]);

  // Paste from clipboard
  const handlePaste = useCallback(async () => {
    try {
      const { Clipboard } = require('react-native');
      const pastedText = await Clipboard.getString();
      if (pastedText) {
        handleUrlChange(pastedText);
      }
    } catch (error) {
      console.warn('Failed to paste from clipboard:', error);
    }
  }, [handleUrlChange]);

  // Clear input
  const handleClear = useCallback(() => {
    setUrl('');
    setValidationState(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setExtractedData(null);
  }, []);

  // Render validation icon
  const renderValidationIcon = () => {
    if (validationState === 'valid') {
      return (
        <Ionicons
          name="checkmark-circle"
          size={24}
          color="#4CAF50"
          style={styles.validationIcon}
        />
      );
    }
    if (validationState === 'invalid') {
      return (
        <Ionicons
          name="close-circle"
          size={24}
          color="#FF6B6B"
          style={styles.validationIcon}
        />
      );
    }
    return null;
  };

  // Render platform indicator
  const renderPlatformIndicator = () => {
    if (!url.trim()) return null;

    const provider = urlValidator.getVideoProvider(url);
    if (!provider) return null;

    return (
      <View style={styles.platformBadge}>
        <Ionicons
          name={urlValidator.getProviderIcon(provider)}
          size={16}
          color="#FFF"
        />
        <Text style={styles.platformText}>
          {urlValidator.getProviderDisplayName(provider)}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      <Text style={styles.label}>Video URL</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            validationState === 'valid' && styles.inputValid,
            validationState === 'invalid' && styles.inputInvalid,
          ]}
          placeholder="Paste video URL (YouTube, TikTok, Instagram, Twitter, Facebook)"
          placeholderTextColor="#999"
          value={url}
          onChangeText={handleUrlChange}
          editable={!disabled && !isLoading}
          multiline={false}
          selectTextOnFocus
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.inputActions}>
          {renderValidationIcon()}

          {url.trim().length > 0 && !isLoading && (
            <TouchableOpacity
              onPress={handleClear}
              disabled={disabled || isLoading}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Ionicons name="close" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {renderPlatformIndicator()}

      {/* Suggestions list */}
      {showSuggestions && suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.suggestion}
              onPress={() => {
                setShowSuggestions(false);
              }}
            >
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#2196F3"
              />
              <Text style={styles.suggestionText}>{item.text}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Error message */}
      {validationState === 'invalid' && url.trim().length > 0 && (
        <Text style={styles.errorText}>
          {urlValidator.getUrlErrorMessage(url)}
        </Text>
      )}

      {/* Action buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.pasteButton, disabled && styles.buttonDisabled]}
          onPress={handlePaste}
          disabled={disabled || isLoading}
        >
          <Ionicons name="clipboard" size={18} color="#2196F3" />
          <Text style={styles.pasteButtonText}>Paste</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.extractButton,
            !url.trim() && styles.buttonDisabled,
            !urlValidator.isValidVideoUrl(url) && styles.buttonDisabled,
            isLoading && styles.buttonLoading,
          ]}
          onPress={handleExtract}
          disabled={
            disabled ||
            isLoading ||
            !url.trim() ||
            !urlValidator.isValidVideoUrl(url)
          }
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="play-outline" size={18} color="#FFF" />
              <Text style={styles.extractButtonText}>Extract Recipe</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Info message */}
      <Text style={styles.infoText}>
        📱 Supports YouTube, TikTok, Instagram, Twitter/X, and Facebook video
        links
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginVertical: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingRight: 12,
    backgroundColor: '#FAFAFA',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  inputValid: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8F4',
  },
  inputInvalid: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF1F1',
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  validationIcon: {
    marginRight: 4,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
    gap: 6,
    alignSelf: 'flex-start',
  },
  platformText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 6,
    marginTop: 8,
    gap: 8,
  },
  suggestionText: {
    flex: 1,
    fontSize: 12,
    color: '#1976D2',
  },
  errorText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 8,
    fontStyle: 'italic',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  pasteButton: {
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  pasteButtonText: {
    color: '#2196F3',
    fontWeight: '600',
    fontSize: 14,
  },
  extractButton: {
    backgroundColor: '#2196F3',
  },
  extractButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonLoading: {
    backgroundColor: '#1976D2',
  },
  infoText: {
    fontSize: 11,
    color: '#999',
    marginTop: 10,
    fontStyle: 'italic',
  },
});

export default VideoRecipeInput;
