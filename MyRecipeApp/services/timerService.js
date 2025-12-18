/**
 * Timer Service for Cooking App
 * Handles multiple simultaneous cooking timers with notifications
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Timer status constants
export const TIMER_STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETED: 'completed',
};

// Timer type presets
export const TIMER_PRESETS = {
  PREP: { label: 'Prep', icon: '🔪', defaultMinutes: 15 },
  COOK: { label: 'Cook', icon: '🍳', defaultMinutes: 30 },
  BAKE: { label: 'Bake', icon: '🥧', defaultMinutes: 45 },
  SIMMER: { label: 'Simmer', icon: '🍲', defaultMinutes: 20 },
  REST: { label: 'Rest', icon: '⏸️', defaultMinutes: 10 },
  MARINATE: { label: 'Marinate', icon: '🥩', defaultMinutes: 60 },
  CHILL: { label: 'Chill', icon: '❄️', defaultMinutes: 30 },
  CUSTOM: { label: 'Custom', icon: '⏱️', defaultMinutes: 5 },
};

/**
 * Create a new timer object
 * @param {Object} options - Timer options
 * @param {string} options.label - Timer label/name
 * @param {number} options.durationSeconds - Total duration in seconds
 * @param {string} options.recipeId - Associated recipe ID (optional)
 * @param {string} options.recipeTitle - Associated recipe title (optional)
 * @param {string} options.type - Timer type from TIMER_PRESETS
 * @returns {Object} Timer object
 */
export const createTimer = ({
  label = 'Timer',
  durationSeconds = 300, // 5 minutes default
  recipeId = null,
  recipeTitle = null,
  type = 'CUSTOM',
}) => {
  return {
    id: `timer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    label,
    durationSeconds,
    remainingSeconds: durationSeconds,
    status: TIMER_STATUS.IDLE,
    recipeId,
    recipeTitle,
    type,
    icon: TIMER_PRESETS[type]?.icon || '⏱️',
    createdAt: new Date().toISOString(),
    startedAt: null,
    pausedAt: null,
    completedAt: null,
    notificationId: null,
  };
};

/**
 * Convert time parts to total seconds
 * @param {number} hours - Hours
 * @param {number} minutes - Minutes
 * @param {number} seconds - Seconds
 * @returns {number} Total seconds
 */
export const timeToSeconds = (hours = 0, minutes = 0, seconds = 0) => {
  return (hours * 3600) + (minutes * 60) + seconds;
};

/**
 * Convert total seconds to time parts
 * @param {number} totalSeconds - Total seconds
 * @returns {Object} { hours, minutes, seconds }
 */
export const secondsToTime = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds };
};

/**
 * Format seconds to display string (HH:MM:SS or MM:SS)
 * @param {number} totalSeconds - Total seconds
 * @returns {string} Formatted time string
 */
export const formatTimerDisplay = (totalSeconds) => {
  if (totalSeconds < 0) totalSeconds = 0;
  
  const { hours, minutes, seconds } = secondsToTime(totalSeconds);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Parse recipe instructions text for time-related phrases
 * Returns suggested timers based on detected cooking times
 * @param {string} instructions - Recipe instructions text
 * @param {string} recipeId - Recipe ID
 * @param {string} recipeTitle - Recipe title
 * @returns {Array} Array of suggested timer objects
 */
export const parseInstructionsForTimers = (instructions, recipeId = null, recipeTitle = null) => {
  if (!instructions || typeof instructions !== 'string') {
    return [];
  }

  const timers = [];
  const text = instructions.toLowerCase();
  
  // Regex patterns for time detection
  const patterns = [
    // "for X minutes/hours"
    /(?:for|about|approximately|around|roughly)\s+(\d+(?:\s*-\s*\d+)?)\s*(minutes?|mins?|hours?|hrs?|seconds?|secs?)/gi,
    // "X minutes/hours"
    /(\d+(?:\s*-\s*\d+)?)\s*(minutes?|mins?|hours?|hrs?|seconds?|secs?)/gi,
    // "X to Y minutes"
    /(\d+)\s*(?:to|-)\s*(\d+)\s*(minutes?|mins?|hours?|hrs?)/gi,
  ];

  // Action keywords that indicate timer-worthy steps
  const actionKeywords = {
    bake: { type: 'BAKE', label: 'Baking' },
    roast: { type: 'BAKE', label: 'Roasting' },
    cook: { type: 'COOK', label: 'Cooking' },
    simmer: { type: 'SIMMER', label: 'Simmering' },
    boil: { type: 'COOK', label: 'Boiling' },
    fry: { type: 'COOK', label: 'Frying' },
    sauté: { type: 'COOK', label: 'Sautéing' },
    saute: { type: 'COOK', label: 'Sautéing' },
    grill: { type: 'COOK', label: 'Grilling' },
    rest: { type: 'REST', label: 'Resting' },
    cool: { type: 'REST', label: 'Cooling' },
    chill: { type: 'CHILL', label: 'Chilling' },
    refrigerate: { type: 'CHILL', label: 'Refrigerating' },
    marinate: { type: 'MARINATE', label: 'Marinating' },
    prep: { type: 'PREP', label: 'Prep' },
    rise: { type: 'REST', label: 'Rising' },
    proof: { type: 'REST', label: 'Proofing' },
    steep: { type: 'REST', label: 'Steeping' },
    broil: { type: 'BAKE', label: 'Broiling' },
  };

  // Split instructions into sentences for context
  const sentences = instructions.split(/[.!?\n]+/);
  
  sentences.forEach((sentence, index) => {
    const lowerSentence = sentence.toLowerCase();
    
    // Find action keyword in sentence
    let action = null;
    for (const [keyword, config] of Object.entries(actionKeywords)) {
      if (lowerSentence.includes(keyword)) {
        action = config;
        break;
      }
    }

    // Find time values in sentence
    for (const pattern of patterns) {
      pattern.lastIndex = 0; // Reset regex
      let match;
      
      while ((match = pattern.exec(sentence)) !== null) {
        let minutes = 0;
        const timeValue = match[1];
        const unit = match[2]?.toLowerCase() || 'minutes';
        
        // Handle range (e.g., "25-30")
        if (timeValue.includes('-') || timeValue.includes('to')) {
          const parts = timeValue.split(/[-to]+/).map(p => parseInt(p.trim()));
          // Use the average or higher value for safety
          minutes = Math.ceil((parts[0] + (parts[1] || parts[0])) / 2);
        } else {
          minutes = parseInt(timeValue);
        }
        
        // Convert to minutes based on unit
        if (unit.startsWith('hour') || unit.startsWith('hr')) {
          minutes = minutes * 60;
        } else if (unit.startsWith('sec')) {
          minutes = Math.ceil(minutes / 60);
        }
        
        // Skip very short or very long times
        if (minutes < 1 || minutes > 1440) continue; // 1 min to 24 hours
        
        // Create timer suggestion
        const timerType = action?.type || 'CUSTOM';
        const timerLabel = action?.label || `Step ${index + 1}`;
        
        // Check for duplicate (same duration within 2 minutes)
        const isDuplicate = timers.some(t => 
          Math.abs(t.durationSeconds - (minutes * 60)) < 120 &&
          t.type === timerType
        );
        
        if (!isDuplicate) {
          timers.push(createTimer({
            label: timerLabel,
            durationSeconds: minutes * 60,
            recipeId,
            recipeTitle,
            type: timerType,
          }));
        }
      }
    }
  });

  // Sort by duration
  timers.sort((a, b) => a.durationSeconds - b.durationSeconds);
  
  return timers;
};

/**
 * Configure notifications for the app
 * Should be called on app startup
 */
export const configureNotifications = async () => {
  // Set notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowInForeground: true,
    }),
  });

  // Request permissions
  if (Platform.OS !== 'web') {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  }
  
  return true; // Web doesn't need permission for basic notifications
};

/**
 * Schedule a notification for when timer completes
 * @param {Object} timer - Timer object
 * @returns {string|null} Notification identifier or null
 */
export const scheduleTimerNotification = async (timer) => {
  try {
    // Cancel any existing notification for this timer
    if (timer.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(timer.notificationId);
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${timer.icon} Timer Complete!`,
        body: `${timer.label}${timer.recipeTitle ? ` for ${timer.recipeTitle}` : ''} is done!`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { timerId: timer.id, type: 'timer_complete' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: timer.remainingSeconds,
      },
    });

    return notificationId;
  } catch (error) {
    console.error('Failed to schedule notification:', error);
    return null;
  }
};

/**
 * Cancel a scheduled notification
 * @param {string} notificationId - Notification identifier
 */
export const cancelTimerNotification = async (notificationId) => {
  if (notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }
};

/**
 * Show immediate notification (for timer completion)
 * @param {Object} timer - Timer object
 */
export const showTimerCompleteNotification = async (timer) => {
  try {
    await Notifications.presentNotificationAsync({
      title: `${timer.icon} Timer Complete!`,
      body: `${timer.label}${timer.recipeTitle ? ` for ${timer.recipeTitle}` : ''} is done!`,
      sound: true,
    });
  } catch (error) {
    console.error('Failed to show notification:', error);
  }
};

/**
 * Quick add time helpers
 */
export const addTime = (timer, secondsToAdd) => {
  return {
    ...timer,
    durationSeconds: timer.durationSeconds + secondsToAdd,
    remainingSeconds: timer.remainingSeconds + secondsToAdd,
  };
};

export const addOneMinute = (timer) => addTime(timer, 60);
export const addFiveMinutes = (timer) => addTime(timer, 300);

/**
 * Calculate progress percentage
 * @param {Object} timer - Timer object
 * @returns {number} Progress percentage (0-100)
 */
export const getTimerProgress = (timer) => {
  if (timer.durationSeconds === 0) return 100;
  const elapsed = timer.durationSeconds - timer.remainingSeconds;
  return Math.min(100, Math.max(0, (elapsed / timer.durationSeconds) * 100));
};
