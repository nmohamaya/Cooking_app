// Set up environment flags before importing anything
global.__DEV__ = true;
global.__JEST__ = true;

// Mock the React Native BatchedBridge before any imports
jest.mock('react-native/Libraries/BatchedBridge/NativeModules', () => ({
  __esModule: true,
  default: {},
}));

// Mock Native modules registry
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
  __esModule: true,
  getEnforcing: jest.fn(() => ({})),
  get: jest.fn(() => ({})),
}));

// Mock Feature Flags
jest.mock('react-native/src/private/featureflags/ReactNativeFeatureFlags', () => ({
  __esModule: true,
  default: {},
}));

// Setup AsyncStorage mock
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock Gesture Handler
try {
  require.resolve('react-native-gesture-handler');
  jest.mock('react-native-gesture-handler', () => ({
    __esModule: true,
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

// Mock InteractionManager
jest.mock('react-native/Libraries/Interaction/InteractionManager', () => ({
  __esModule: true,
  runAfterInteractions: jest.fn(),
  createInteractionHandle: jest.fn(),
  clearInteractionHandle: jest.fn(),
  setDeadline: jest.fn(),
}));

// Mock React Native Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  __esModule: true,
  alert: jest.fn(),
  alert: jest.fn(),
}));