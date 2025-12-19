// Fix for test environment: define __DEV__ before any imports
if (typeof global.__DEV__ === 'undefined') {
  global.__DEV__ = true;
}

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import App from '../App';

// Mock AsyncStorage and Alert
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: { alert: jest.fn() },
  };
});

// Skipped due to React Native/Jest environment limitations. See backlog issue for details.
describe.skip('Feedback Modal UX', () => {
  it('does not show feedback modal after extraction, only after Save Recipe', async () => {
    const { getByText, queryByText } = render(<App />);

    // Simulate extraction (mock performExtraction)
    await waitFor(() => {
      fireEvent.press(getByText('🤖 Extract Recipe from Text'));
    });
    // Extraction success message should show, but not feedback modal
    expect(queryByText('Was this extraction accurate?')).toBeNull();

    // Fill in required fields and save
    fireEvent.changeText(getByText('Recipe Title'), 'Test Recipe');
    fireEvent.press(getByText('Save Recipe'));

    // Feedback modal should now appear
    await waitFor(() => {
      expect(getByText('Was this extraction accurate?')).toBeTruthy();
    });
  });

  it('clears wasExtracted flag after feedback is given or skipped', async () => {
    const { getByText, queryByText } = render(<App />);
    // Simulate extraction and save
    await waitFor(() => {
      fireEvent.press(getByText('🤖 Extract Recipe from Text'));
    });
    fireEvent.changeText(getByText('Recipe Title'), 'Test Recipe');
    fireEvent.press(getByText('Save Recipe'));
    // Feedback modal appears
    await waitFor(() => {
      expect(getByText('Was this extraction accurate?')).toBeTruthy();
    });
    // Skip feedback
    fireEvent.press(getByText('Skip'));
    // Modal should close
    await waitFor(() => {
      expect(queryByText('Was this extraction accurate?')).toBeNull();
    });
    // Save again, modal should NOT reappear
    fireEvent.press(getByText('Save Recipe'));
    await waitFor(() => {
      expect(queryByText('Was this extraction accurate?')).toBeNull();
    });
  });
});
