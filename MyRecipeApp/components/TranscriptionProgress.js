import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const STEPS = [
  { id: 'extracting', label: 'Extracting', icon: 'download-outline' },
  { id: 'processing', label: 'Processing', icon: 'pulse-outline' },
  { id: 'formatting', label: 'Formatting', icon: 'checkmark-done-outline' },
];

const TranscriptionProgress = ({
  currentStep = 'extracting', // 'extracting', 'processing', 'formatting'
  progress = 0, // 0-100
  isActive = true,
  onCancel = () => {},
  elapsedTime = 0, // in seconds
  estimatedTime = null, // in seconds
  showSteps = true,
  showProgressBar = true,
  cancelable = true,
}) => {
  const [displayTime, setDisplayTime] = useState(formatTime(elapsedTime));
  const [progressAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));
  const windowWidth = Dimensions.get('window').width - 32; // 16px padding on each side

  // Update display time
  useEffect(() => {
    setDisplayTime(formatTime(elapsedTime));
  }, [elapsedTime]);

  // Animate progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  // Pulse animation for active step
  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isActive, pulseAnim]);

  // Get current step index
  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const progressPercent = Math.min(progress, 100);
  const progressWidth = (progressPercent / 100) * windowWidth;

  // Format time helper
  function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  }

  // Get remaining time estimate
  const getRemainingTime = () => {
    if (!estimatedTime || elapsedTime >= estimatedTime) {
      return null;
    }
    const remaining = estimatedTime - elapsedTime;
    return formatTime(Math.max(0, remaining));
  };

  return (
    <View style={[styles.container, !isActive && styles.inactive]}>
      {/* Header with title and timer */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Extracting Recipe...</Text>
          <Text style={styles.subtitle}>
            {STEPS[currentStepIndex]?.label || currentStep}
          </Text>
        </View>

        <View style={styles.timerSection}>
          <View style={styles.timerContent}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.timerText}>{displayTime}</Text>
          </View>
          {getRemainingTime() && (
            <Text style={styles.remainingTime}>
              ~{getRemainingTime()} remaining
            </Text>
          )}
        </View>
      </View>

      {/* Steps indicator */}
      {showSteps && (
        <View style={styles.stepsContainer}>
          {STEPS.map((step, index) => (
            <View key={step.id} style={styles.stepWrapper}>
              {/* Step indicator */}
              <Animated.View
                style={[
                  styles.stepIndicator,
                  currentStepIndex === index && styles.stepActive,
                  currentStepIndex > index && styles.stepCompleted,
                  currentStepIndex === index && { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <Ionicons
                  name={
                    currentStepIndex > index
                      ? 'checkmark'
                      : step.icon
                  }
                  size={16}
                  color={
                    currentStepIndex >= index ? '#FFF' : '#999'
                  }
                />
              </Animated.View>

              {/* Step label */}
              <Text
                style={[
                  styles.stepLabel,
                  currentStepIndex >= index && styles.stepLabelActive,
                ]}
              >
                {step.label}
              </Text>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <View
                  style={[
                    styles.stepConnector,
                    currentStepIndex > index && styles.stepConnectorCompleted,
                  ]}
                />
              )}
            </View>
          ))}
        </View>
      )}

      {/* Progress bar */}
      {showProgressBar && (
        <View style={styles.progressSection}>
          <View style={styles.progressBarContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(progressPercent)}%</Text>
        </View>
      )}

      {/* Status message */}
      <View style={styles.statusSection}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>
          {currentStepIndex === 0 && 'Downloading video content...'}
          {currentStepIndex === 1 && 'Analyzing and transcribing...'}
          {currentStepIndex === 2 && 'Formatting recipe data...'}
        </Text>
      </View>

      {/* Cancel button */}
      {cancelable && isActive && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          activeOpacity={0.7}
        >
          <Ionicons name="close-circle-outline" size={18} color="#FF6B6B" />
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      )}

      {/* Completed state */}
      {!isActive && currentStepIndex === STEPS.length - 1 && (
        <View style={styles.completedBanner}>
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          <Text style={styles.completedText}>Extraction Complete!</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  inactive: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  timerSection: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  timerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  remainingTime: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  stepWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  stepIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E8E8E8',
  },
  stepActive: {
    backgroundColor: '#2196F3',
    borderColor: '#1976D2',
  },
  stepCompleted: {
    backgroundColor: '#4CAF50',
    borderColor: '#45A049',
  },
  stepLabel: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: '#333',
    fontWeight: '600',
  },
  stepConnector: {
    position: 'absolute',
    top: 20,
    left: '50%',
    right: -50,
    height: 2,
    backgroundColor: '#E8E8E8',
  },
  stepConnectorCompleted: {
    backgroundColor: '#4CAF50',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#E8E8E8',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    fontWeight: '500',
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
  },
  statusText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF1F1',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F1F8F4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  completedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
});

export default TranscriptionProgress;
