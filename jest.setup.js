// Fix Expo import.meta polyfill issue in Jest
if (typeof globalThis.__ExpoImportMetaRegistry === 'undefined') {
  globalThis.__ExpoImportMetaRegistry = {
    url: 'file:///test',
  };
}

// Mock nativewind / react-native-css-interop
jest.mock('nativewind', () => ({}));
jest.mock('react-native-css-interop', () => ({
  cssInterop: jest.fn(),
  remapProps: jest.fn(),
}));

// Mock expo/src/winter modules that cause import.meta issues
jest.mock('expo/src/winter/runtime.native', () => ({}));
jest.mock('expo/src/winter/installGlobal', () => ({}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  return {
    __esModule: true,
    default: {
      View,
      createAnimatedComponent: (comp) => comp,
      call: () => {},
    },
    useSharedValue: jest.fn((init) => ({ value: init })),
    useAnimatedStyle: jest.fn((fn) => fn()),
    withTiming: jest.fn((val) => val),
    withDelay: jest.fn((_delay, val) => val),
    withSequence: jest.fn((...vals) => vals[vals.length - 1]),
    runOnJS: jest.fn((fn) => fn),
    Easing: { linear: jest.fn(), ease: jest.fn() },
    View,
  };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const mockInsets = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: jest.fn(() => mockInsets),
  };
});

// Mock lucide-react-native
jest.mock('lucide-react-native', () => {
  return new Proxy(
    {},
    {
      get: (_, prop) => {
        if (prop === '__esModule') return true;
        const MockIcon = (props) => {
          const React = require('react');
          const { View } = require('react-native');
          return React.createElement(View, { ...props, testID: `icon-${String(prop)}` });
        };
        MockIcon.displayName = String(prop);
        return MockIcon;
      },
    }
  );
});

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// Mock react-native-url-polyfill
jest.mock('react-native-url-polyfill/auto', () => {});

// Suppress expected console.error
const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Warning:')) return;
  originalConsoleError.call(console, ...args);
};
