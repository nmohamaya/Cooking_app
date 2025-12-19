import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Only mock if the package is installed
try {
  require.resolve('react-native-gesture-handler');
  jest.mock('react-native-gesture-handler', () => ({
    install: jest.fn(),
    GestureHandlerRootView: ({ children }) => children,
    PanGestureHandler: ({ children }) => children,
    TapGestureHandler: ({ children }) => children,
    State: {},
    Directions: {},
  }));
} catch (e) {
  // Package not installed, skip mock
}

jest.mock('react-native/Libraries/Interaction/InteractionManager', () => ({
  runAfterInteractions: jest.fn(),
  createInteractionHandle: jest.fn(),
  clearInteractionHandle: jest.fn(),
  setDeadline: jest.fn(),
}));

global.__DEV__ = true;