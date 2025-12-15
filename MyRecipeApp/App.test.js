import React from 'react';
import { render } from '@testing-library/react-native';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    // Note: Full navigation testing is complex with mocks.
    // This is a basic smoke test.
    expect(() => render(<App />)).not.toThrow();
  });
});