/**
 * Timer UI Components
 * Floating widget, modals, and timer controls for cooking timers
 */

import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  TextInput,
  StyleSheet,
  Dimensions 
} from 'react-native';
import * as timerService from '../services/timerService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Floating Timer Widget - shows when timers are running
 */
export const FloatingTimerWidget = ({ 
  timers, 
  onPress, 
  visible 
}) => {
  const activeTimers = timers.filter(t => 
    t.status === timerService.TIMER_STATUS.RUNNING || 
    t.status === timerService.TIMER_STATUS.PAUSED ||
    t.status === timerService.TIMER_STATUS.COMPLETED
  );

  if (!visible || activeTimers.length === 0) return null;

  // Find the most urgent timer (shortest remaining or completed)
  const urgentTimer = activeTimers.reduce((prev, curr) => {
    if (curr.status === timerService.TIMER_STATUS.COMPLETED) return curr;
    if (prev.status === timerService.TIMER_STATUS.COMPLETED) return prev;
    return curr.remainingSeconds < prev.remainingSeconds ? curr : prev;
  });

  const isCompleted = urgentTimer.status === timerService.TIMER_STATUS.COMPLETED;
  const isPaused = urgentTimer.status === timerService.TIMER_STATUS.PAUSED;

  return (
    <TouchableOpacity 
      style={[
        styles.floatingWidget,
        isCompleted && styles.floatingWidgetCompleted,
        isPaused && styles.floatingWidgetPaused,
      ]} 
      onPress={onPress}
    >
      <Text style={styles.floatingWidgetIcon}>
        {isCompleted ? '🔔' : urgentTimer.icon}
      </Text>
      <View style={styles.floatingWidgetContent}>
        <Text style={styles.floatingWidgetLabel} numberOfLines={1}>
          {urgentTimer.label}
        </Text>
        <Text style={[
          styles.floatingWidgetTime,
          isCompleted && styles.floatingWidgetTimeCompleted
        ]}>
          {isCompleted ? 'Done!' : timerService.formatTimerDisplay(urgentTimer.remainingSeconds)}
        </Text>
      </View>
      {activeTimers.length > 1 && (
        <View style={styles.floatingWidgetBadge}>
          <Text style={styles.floatingWidgetBadgeText}>+{activeTimers.length - 1}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

/**
 * Timer Widget Modal - shows all timers
 */
export const TimerWidgetModal = ({
  visible,
  onClose,
  timers,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onCancelTimer,
  onAddTime,
  onDismissCompleted,
  onCreateNew,
}) => {
  const activeTimers = timers.filter(t => t.status !== timerService.TIMER_STATUS.IDLE);
  const completedTimers = timers.filter(t => t.status === timerService.TIMER_STATUS.COMPLETED);
  const runningTimers = timers.filter(t => 
    t.status === timerService.TIMER_STATUS.RUNNING || 
    t.status === timerService.TIMER_STATUS.PAUSED
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.timerWidgetModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>⏱️ Cooking Timers</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.timerList}>
            {/* Completed Timers */}
            {completedTimers.length > 0 && (
              <View style={styles.timerSection}>
                <Text style={styles.sectionTitle}>🔔 Completed</Text>
                {completedTimers.map(timer => (
                  <TimerCard
                    key={timer.id}
                    timer={timer}
                    onDismiss={() => onDismissCompleted(timer.id)}
                  />
                ))}
              </View>
            )}

            {/* Running/Paused Timers */}
            {runningTimers.length > 0 && (
              <View style={styles.timerSection}>
                <Text style={styles.sectionTitle}>⏳ Active</Text>
                {runningTimers.map(timer => (
                  <TimerCard
                    key={timer.id}
                    timer={timer}
                    onStart={() => onStartTimer(timer.id)}
                    onPause={() => onPauseTimer(timer.id)}
                    onResume={() => onResumeTimer(timer.id)}
                    onCancel={() => onCancelTimer(timer.id)}
                    onAddTime={(seconds) => onAddTime(timer.id, seconds)}
                  />
                ))}
              </View>
            )}

            {activeTimers.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>⏱️</Text>
                <Text style={styles.emptyStateText}>No active timers</Text>
                <Text style={styles.emptyStateSubtext}>
                  Create a timer or set one from a recipe
                </Text>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.createTimerButton} onPress={onCreateNew}>
            <Text style={styles.createTimerButtonText}>+ New Timer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Individual Timer Card
 */
const TimerCard = ({
  timer,
  onStart,
  onPause,
  onResume,
  onCancel,
  onAddTime,
  onDismiss,
}) => {
  const isRunning = timer.status === timerService.TIMER_STATUS.RUNNING;
  const isPaused = timer.status === timerService.TIMER_STATUS.PAUSED;
  const isCompleted = timer.status === timerService.TIMER_STATUS.COMPLETED;
  const progress = timerService.getTimerProgress(timer);

  return (
    <View style={[
      styles.timerCard,
      isCompleted && styles.timerCardCompleted,
    ]}>
      {/* Progress bar background */}
      {!isCompleted && (
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
      )}
      
      <View style={styles.timerCardContent}>
        <View style={styles.timerCardHeader}>
          <Text style={styles.timerIcon}>{timer.icon}</Text>
          <View style={styles.timerInfo}>
            <Text style={styles.timerLabel} numberOfLines={1}>{timer.label}</Text>
            {timer.recipeTitle && (
              <Text style={styles.timerRecipe} numberOfLines={1}>
                {timer.recipeTitle}
              </Text>
            )}
          </View>
          <Text style={[
            styles.timerTime,
            isCompleted && styles.timerTimeCompleted,
          ]}>
            {isCompleted ? '✓ Done!' : timerService.formatTimerDisplay(timer.remainingSeconds)}
          </Text>
        </View>

        <View style={styles.timerControls}>
          {isCompleted ? (
            <TouchableOpacity 
              style={[styles.timerButton, styles.dismissButton]} 
              onPress={onDismiss}
            >
              <Text style={styles.timerButtonText}>Dismiss</Text>
            </TouchableOpacity>
          ) : (
            <>
              {isRunning ? (
                <TouchableOpacity 
                  style={[styles.timerButton, styles.pauseButton]} 
                  onPress={onPause}
                >
                  <Text style={styles.timerButtonText}>⏸ Pause</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.timerButton, styles.playButton]} 
                  onPress={onResume || onStart}
                >
                  <Text style={styles.timerButtonText}>▶ {isPaused ? 'Resume' : 'Start'}</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.timerButton, styles.addTimeButton]} 
                onPress={() => onAddTime(60)}
              >
                <Text style={styles.timerButtonText}>+1m</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.timerButton, styles.addTimeButton]} 
                onPress={() => onAddTime(300)}
              >
                <Text style={styles.timerButtonText}>+5m</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.timerButton, styles.cancelButton]} 
                onPress={onCancel}
              >
                <Text style={styles.timerButtonText}>✕</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

/**
 * Create Timer Modal
 */
export const CreateTimerModal = ({
  visible,
  onClose,
  onCreate,
  timerForm,
  setTimerForm,
  recipeContext,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.createTimerModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>⏱️ New Timer</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {recipeContext && (
            <Text style={styles.recipeContextText}>
              For: {recipeContext.title}
            </Text>
          )}

          <View style={styles.timeInputContainer}>
            <View style={styles.timeInputGroup}>
              <Text style={styles.timeInputLabel}>Hours</Text>
              <TextInput
                style={styles.timeInput}
                keyboardType="number-pad"
                value={String(timerForm.hours)}
                onChangeText={(val) => setTimerForm(prev => ({ 
                  ...prev, 
                  hours: parseInt(val) || 0 
                }))}
                maxLength={2}
              />
            </View>
            <Text style={styles.timeSeparator}>:</Text>
            <View style={styles.timeInputGroup}>
              <Text style={styles.timeInputLabel}>Minutes</Text>
              <TextInput
                style={styles.timeInput}
                keyboardType="number-pad"
                value={String(timerForm.minutes)}
                onChangeText={(val) => setTimerForm(prev => ({ 
                  ...prev, 
                  minutes: Math.min(59, parseInt(val) || 0)
                }))}
                maxLength={2}
              />
            </View>
            <Text style={styles.timeSeparator}>:</Text>
            <View style={styles.timeInputGroup}>
              <Text style={styles.timeInputLabel}>Seconds</Text>
              <TextInput
                style={styles.timeInput}
                keyboardType="number-pad"
                value={String(timerForm.seconds)}
                onChangeText={(val) => setTimerForm(prev => ({ 
                  ...prev, 
                  seconds: Math.min(59, parseInt(val) || 0)
                }))}
                maxLength={2}
              />
            </View>
          </View>

          {/* Quick preset buttons */}
          <View style={styles.presetContainer}>
            <Text style={styles.presetLabel}>Quick set:</Text>
            <View style={styles.presetButtons}>
              {[1, 5, 10, 15, 30, 45, 60].map(mins => (
                <TouchableOpacity
                  key={mins}
                  style={styles.presetButton}
                  onPress={() => setTimerForm(prev => ({
                    ...prev,
                    hours: mins >= 60 ? Math.floor(mins / 60) : 0,
                    minutes: mins % 60,
                    seconds: 0,
                  }))}
                >
                  <Text style={styles.presetButtonText}>
                    {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TextInput
            style={styles.labelInput}
            placeholder="Timer label (e.g., Baking, Boiling pasta)"
            value={timerForm.label}
            onChangeText={(val) => setTimerForm(prev => ({ ...prev, label: val }))}
          />

          <TouchableOpacity style={styles.startTimerButton} onPress={onCreate}>
            <Text style={styles.startTimerButtonText}>▶ Start Timer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Timer Suggestions Modal - shows parsed times from recipe
 */
export const TimerSuggestionsModal = ({
  visible,
  onClose,
  suggestions,
  onAddSuggestion,
  onCreateCustom,
  recipeTitle,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.suggestionsModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>⏱️ Set Timer</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {recipeTitle && (
            <Text style={styles.recipeContextText}>For: {recipeTitle}</Text>
          )}

          {suggestions.length > 0 ? (
            <>
              <Text style={styles.suggestionsSubtitle}>
                Found {suggestions.length} timer suggestion{suggestions.length > 1 ? 's' : ''} in this recipe:
              </Text>
              <ScrollView style={styles.suggestionsList}>
                {suggestions.map((timer, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => {
                      onAddSuggestion(timer);
                      onClose();
                    }}
                  >
                    <Text style={styles.suggestionIcon}>{timer.icon}</Text>
                    <View style={styles.suggestionInfo}>
                      <Text style={styles.suggestionLabel}>{timer.label}</Text>
                      <Text style={styles.suggestionTime}>
                        {timerService.formatTimerDisplay(timer.durationSeconds)}
                      </Text>
                    </View>
                    <Text style={styles.suggestionAdd}>+ Add</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          ) : (
            <View style={styles.noSuggestionsContainer}>
              <Text style={styles.noSuggestionsText}>
                No specific times found in this recipe's instructions.
              </Text>
            </View>
          )}

          <TouchableOpacity 
            style={styles.customTimerButton} 
            onPress={() => {
              onClose();
              onCreateCustom();
            }}
          >
            <Text style={styles.customTimerButtonText}>⏱️ Create Custom Timer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Floating Widget
  floatingWidget: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: '#FF9800',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    minWidth: 120,
  },
  floatingWidgetCompleted: {
    backgroundColor: '#4CAF50',
  },
  floatingWidgetPaused: {
    backgroundColor: '#9E9E9E',
  },
  floatingWidgetIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  floatingWidgetContent: {
    flex: 1,
  },
  floatingWidgetLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  floatingWidgetTime: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  floatingWidgetTimeCompleted: {
    fontSize: 14,
  },
  floatingWidgetBadge: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  floatingWidgetBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Modal Common
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },

  // Timer Widget Modal
  timerWidgetModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  timerList: {
    maxHeight: 400,
  },
  timerSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  createTimerButton: {
    backgroundColor: '#FF9800',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  createTimerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Timer Card
  timerCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  timerCardCompleted: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  progressBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
  },
  timerCardContent: {
    padding: 15,
  },
  timerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  timerIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  timerInfo: {
    flex: 1,
  },
  timerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timerRecipe: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  timerTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  timerTimeCompleted: {
    color: '#4CAF50',
    fontSize: 18,
  },
  timerControls: {
    flexDirection: 'row',
    gap: 8,
  },
  timerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  playButton: {
    backgroundColor: '#4CAF50',
    flex: 1,
  },
  pauseButton: {
    backgroundColor: '#FF9800',
    flex: 1,
  },
  addTimeButton: {
    backgroundColor: '#2196F3',
  },
  cancelButton: {
    backgroundColor: '#d32f2f',
    paddingHorizontal: 14,
  },
  dismissButton: {
    backgroundColor: '#4CAF50',
    flex: 1,
  },

  // Create Timer Modal
  createTimerModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  recipeContextText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    fontStyle: 'italic',
  },
  timeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 25,
  },
  timeInputGroup: {
    alignItems: 'center',
  },
  timeInputLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  timeInput: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    width: 70,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 10,
  },
  timeSeparator: {
    fontSize: 36,
    fontWeight: 'bold',
    marginHorizontal: 5,
    color: '#666',
  },
  presetContainer: {
    marginBottom: 20,
  },
  presetLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  presetButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  presetButtonText: {
    color: '#1976D2',
    fontWeight: '600',
  },
  labelInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  startTimerButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  startTimerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Suggestions Modal
  suggestionsModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  suggestionsSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    marginBottom: 15,
  },
  suggestionsList: {
    maxHeight: 300,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 10,
  },
  suggestionIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  suggestionTime: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '500',
    marginTop: 2,
  },
  suggestionAdd: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 14,
  },
  noSuggestionsContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noSuggestionsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  customTimerButton: {
    backgroundColor: '#FF9800',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  customTimerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
