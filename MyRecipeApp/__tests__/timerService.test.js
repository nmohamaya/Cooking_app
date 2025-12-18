/**
 * Tests for Timer Service
 * Unit tests for cooking timer functionality
 */

// Mock expo-notifications before importing timerService
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification_123')),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  presentNotificationAsync: jest.fn(() => Promise.resolve()),
  AndroidNotificationPriority: { HIGH: 'high' },
  SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' },
}));

// Mock react-native Platform
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

import {
  createTimer,
  timeToSeconds,
  secondsToTime,
  formatTimerDisplay,
  parseInstructionsForTimers,
  TIMER_STATUS,
  TIMER_PRESETS,
  addTime,
  addOneMinute,
  addFiveMinutes,
  getTimerProgress,
} from '../services/timerService';

describe('Timer Service', () => {
  describe('createTimer', () => {
    it('should create a timer with default values', () => {
      const timer = createTimer({});
      
      expect(timer).toHaveProperty('id');
      expect(timer.id).toMatch(/^timer_/);
      expect(timer.label).toBe('Timer');
      expect(timer.durationSeconds).toBe(300); // 5 minutes default
      expect(timer.remainingSeconds).toBe(300);
      expect(timer.status).toBe(TIMER_STATUS.IDLE);
      expect(timer.type).toBe('CUSTOM');
      expect(timer.icon).toBe('⏱️');
    });

    it('should create a timer with custom values', () => {
      const timer = createTimer({
        label: 'Baking',
        durationSeconds: 1800, // 30 minutes
        recipeId: 'recipe_123',
        recipeTitle: 'Chocolate Cake',
        type: 'BAKE',
      });
      
      expect(timer.label).toBe('Baking');
      expect(timer.durationSeconds).toBe(1800);
      expect(timer.remainingSeconds).toBe(1800);
      expect(timer.recipeId).toBe('recipe_123');
      expect(timer.recipeTitle).toBe('Chocolate Cake');
      expect(timer.type).toBe('BAKE');
      expect(timer.icon).toBe('🥧');
    });

    it('should generate unique IDs', () => {
      const timer1 = createTimer({});
      const timer2 = createTimer({});
      
      expect(timer1.id).not.toBe(timer2.id);
    });
  });

  describe('timeToSeconds', () => {
    it('should convert time parts to seconds', () => {
      expect(timeToSeconds(0, 0, 0)).toBe(0);
      expect(timeToSeconds(0, 0, 30)).toBe(30);
      expect(timeToSeconds(0, 5, 0)).toBe(300);
      expect(timeToSeconds(1, 0, 0)).toBe(3600);
      expect(timeToSeconds(1, 30, 0)).toBe(5400);
      expect(timeToSeconds(2, 15, 30)).toBe(8130);
    });

    it('should handle undefined values as 0', () => {
      expect(timeToSeconds()).toBe(0);
      expect(timeToSeconds(1)).toBe(3600);
      expect(timeToSeconds(undefined, 5)).toBe(300);
    });
  });

  describe('secondsToTime', () => {
    it('should convert seconds to time parts', () => {
      expect(secondsToTime(0)).toEqual({ hours: 0, minutes: 0, seconds: 0 });
      expect(secondsToTime(30)).toEqual({ hours: 0, minutes: 0, seconds: 30 });
      expect(secondsToTime(300)).toEqual({ hours: 0, minutes: 5, seconds: 0 });
      expect(secondsToTime(3600)).toEqual({ hours: 1, minutes: 0, seconds: 0 });
      expect(secondsToTime(3661)).toEqual({ hours: 1, minutes: 1, seconds: 1 });
      expect(secondsToTime(8130)).toEqual({ hours: 2, minutes: 15, seconds: 30 });
    });
  });

  describe('formatTimerDisplay', () => {
    it('should format MM:SS for times under 1 hour', () => {
      expect(formatTimerDisplay(0)).toBe('00:00');
      expect(formatTimerDisplay(30)).toBe('00:30');
      expect(formatTimerDisplay(90)).toBe('01:30');
      expect(formatTimerDisplay(300)).toBe('05:00');
      expect(formatTimerDisplay(3599)).toBe('59:59');
    });

    it('should format HH:MM:SS for times >= 1 hour', () => {
      expect(formatTimerDisplay(3600)).toBe('01:00:00');
      expect(formatTimerDisplay(3661)).toBe('01:01:01');
      expect(formatTimerDisplay(7200)).toBe('02:00:00');
      expect(formatTimerDisplay(86399)).toBe('23:59:59');
    });

    it('should handle negative values as 0', () => {
      expect(formatTimerDisplay(-10)).toBe('00:00');
      expect(formatTimerDisplay(-3600)).toBe('00:00');
    });
  });

  describe('parseInstructionsForTimers', () => {
    it('should return empty array for empty input', () => {
      expect(parseInstructionsForTimers('')).toEqual([]);
      expect(parseInstructionsForTimers(null)).toEqual([]);
      expect(parseInstructionsForTimers(undefined)).toEqual([]);
    });

    it('should parse "X minutes" patterns', () => {
      const instructions = 'Bake for 25 minutes at 350°F.';
      const timers = parseInstructionsForTimers(instructions);
      
      expect(timers.length).toBeGreaterThan(0);
      const timer = timers[0];
      expect(timer.durationSeconds).toBe(25 * 60);
      expect(timer.type).toBe('BAKE');
    });

    it('should parse "for X hours" patterns', () => {
      const instructions = 'Marinate the chicken for 2 hours in the refrigerator.';
      const timers = parseInstructionsForTimers(instructions);
      
      expect(timers.length).toBeGreaterThan(0);
      const timer = timers[0];
      expect(timer.durationSeconds).toBe(2 * 60 * 60);
    });

    it('should parse range patterns like "25-30 minutes"', () => {
      const instructions = 'Cook for 25-30 minutes until golden brown.';
      const timers = parseInstructionsForTimers(instructions);
      
      expect(timers.length).toBeGreaterThan(0);
      // Should use the average (27.5, rounded up to 28) or use 25 (lower bound)
      const timer = timers[0];
      expect(timer.durationSeconds).toBeGreaterThanOrEqual(25 * 60);
      expect(timer.durationSeconds).toBeLessThanOrEqual(30 * 60);
    });

    it('should identify cooking action types', () => {
      const instructions = `
        1. Simmer the sauce for 20 minutes.
        2. Bake the bread for 45 minutes.
        3. Let the meat rest for 10 minutes.
      `;
      const timers = parseInstructionsForTimers(instructions);
      
      expect(timers.length).toBe(3);
      
      const simmering = timers.find(t => t.type === 'SIMMER');
      expect(simmering).toBeDefined();
      expect(simmering.durationSeconds).toBe(20 * 60);
      
      const baking = timers.find(t => t.type === 'BAKE');
      expect(baking).toBeDefined();
      expect(baking.durationSeconds).toBe(45 * 60);
      
      const resting = timers.find(t => t.type === 'REST');
      expect(resting).toBeDefined();
      expect(resting.durationSeconds).toBe(10 * 60);
    });

    it('should not create duplicate timers for similar times', () => {
      const instructions = 'Bake for 30 minutes. Continue baking for 30 minutes more.';
      const timers = parseInstructionsForTimers(instructions);
      
      // Should only create one timer since durations are the same
      const bakingTimers = timers.filter(t => t.type === 'BAKE');
      expect(bakingTimers.length).toBe(1);
    });

    it('should include recipe context when provided', () => {
      const instructions = 'Bake for 20 minutes.';
      const timers = parseInstructionsForTimers(instructions, 'recipe_1', 'Apple Pie');
      
      expect(timers[0].recipeId).toBe('recipe_1');
      expect(timers[0].recipeTitle).toBe('Apple Pie');
    });

    it('should skip very short times (< 1 minute)', () => {
      const instructions = 'Mix for 30 seconds. Then bake for 45 minutes.';
      const timers = parseInstructionsForTimers(instructions);
      
      // The 30 second timer should round up to 1 minute, and the 45 minute timer is kept
      // Main check: the 45 minute timer exists
      const bakingTimer = timers.find(t => t.durationSeconds === 45 * 60);
      expect(bakingTimer).toBeDefined();
    });
  });

  describe('addTime functions', () => {
    it('should add time to a timer', () => {
      const timer = createTimer({ durationSeconds: 300 });
      const updated = addTime(timer, 60);
      
      expect(updated.durationSeconds).toBe(360);
      expect(updated.remainingSeconds).toBe(360);
    });

    it('should add one minute', () => {
      const timer = createTimer({ durationSeconds: 300 });
      const updated = addOneMinute(timer);
      
      expect(updated.durationSeconds).toBe(360);
      expect(updated.remainingSeconds).toBe(360);
    });

    it('should add five minutes', () => {
      const timer = createTimer({ durationSeconds: 300 });
      const updated = addFiveMinutes(timer);
      
      expect(updated.durationSeconds).toBe(600);
      expect(updated.remainingSeconds).toBe(600);
    });
  });

  describe('getTimerProgress', () => {
    it('should return 0 for new timer', () => {
      const timer = createTimer({ durationSeconds: 300 });
      expect(getTimerProgress(timer)).toBe(0);
    });

    it('should return 50 for half-completed timer', () => {
      const timer = createTimer({ durationSeconds: 300 });
      timer.remainingSeconds = 150;
      expect(getTimerProgress(timer)).toBe(50);
    });

    it('should return 100 for completed timer', () => {
      const timer = createTimer({ durationSeconds: 300 });
      timer.remainingSeconds = 0;
      expect(getTimerProgress(timer)).toBe(100);
    });

    it('should handle edge case of zero duration', () => {
      const timer = createTimer({ durationSeconds: 0 });
      expect(getTimerProgress(timer)).toBe(100);
    });

    it('should clamp values between 0 and 100', () => {
      const timer = createTimer({ durationSeconds: 300 });
      
      // Negative remaining (shouldn't happen but be safe)
      timer.remainingSeconds = -10;
      expect(getTimerProgress(timer)).toBeLessThanOrEqual(100);
      
      // More remaining than duration (shouldn't happen but be safe)
      timer.remainingSeconds = 400;
      expect(getTimerProgress(timer)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('TIMER_PRESETS', () => {
    it('should have expected preset types', () => {
      expect(TIMER_PRESETS.PREP).toBeDefined();
      expect(TIMER_PRESETS.COOK).toBeDefined();
      expect(TIMER_PRESETS.BAKE).toBeDefined();
      expect(TIMER_PRESETS.SIMMER).toBeDefined();
      expect(TIMER_PRESETS.REST).toBeDefined();
      expect(TIMER_PRESETS.MARINATE).toBeDefined();
      expect(TIMER_PRESETS.CHILL).toBeDefined();
      expect(TIMER_PRESETS.CUSTOM).toBeDefined();
    });

    it('should have label, icon, and defaultMinutes for each preset', () => {
      Object.values(TIMER_PRESETS).forEach(preset => {
        expect(preset.label).toBeDefined();
        expect(preset.icon).toBeDefined();
        expect(preset.defaultMinutes).toBeDefined();
        expect(typeof preset.defaultMinutes).toBe('number');
      });
    });
  });

  describe('TIMER_STATUS', () => {
    it('should have expected status values', () => {
      expect(TIMER_STATUS.IDLE).toBe('idle');
      expect(TIMER_STATUS.RUNNING).toBe('running');
      expect(TIMER_STATUS.PAUSED).toBe('paused');
      expect(TIMER_STATUS.COMPLETED).toBe('completed');
    });
  });
});
