// Mock more RN modules that read from native bridge in tests

// Mock AccessibilityInfo at module path to avoid TurboModuleRegistry lookups
jest.mock(
  'react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo',
  () => ({
    isReduceMotionEnabled: () => Promise.resolve(false),
    addEventListener: () => ({ remove: () => {} }),
    removeEventListener: () => {},
  })
);

// Mock Appearance via its module path
jest.mock('react-native/Libraries/Utilities/Appearance', () => ({
  getColorScheme: () => 'light',
  addChangeListener: () => ({ remove: () => {} }),
  removeChangeListener: () => {},
}));
// Patch @testing-library/react-native peer dep check to avoid strict renderer version pin in monorepo
jest.mock(
  '@testing-library/react-native/src/helpers/ensure-peer-deps',
  () => ({ ensurePeerDeps: () => {} }),
  { virtual: true }
);
// Mock AsyncStorage to avoid NativeModule null under Jest
jest.mock(
  '@react-native-async-storage/async-storage',
  () => ({
    __esModule: true,
    default: {
      setItem: jest.fn().mockResolvedValue(undefined),
      getItem: jest.fn().mockResolvedValue(null),
      removeItem: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
    },
  }),
  { virtual: true }
);

// Mock expo-haptics globally for tests
jest.mock(
  'expo-haptics',
  () => ({
    impactAsync: jest.fn().mockResolvedValue(undefined),
    notificationAsync: jest.fn().mockResolvedValue(undefined),
    ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
    NotificationFeedbackType: {
      Success: 'Success',
      Warning: 'Warning',
      Error: 'Error',
    },
  }),
  { virtual: true }
);

// Inform React 19 that we're in act-enabled test env
// See https://react.dev/reference/react/act
// Avoid TS syntax in JS file
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
// Mock NativePlatformConstantsIOS to avoid TurboModuleRegistry access
jest.mock(
  'react-native/src/private/specs_DEPRECATED/modules/NativePlatformConstantsIOS',
  () => ({
    getConstants: () => ({
      forceTouchAvailable: false,
      interfaceIdiom: 'phone',
      osVersion: '17.0',
      systemName: 'iOS',
    }),
  })
);
jest.mock(
  'react-native/Libraries/Utilities/NativePlatformConstantsIOS',
  () => ({
    getConstants: () => ({
      forceTouchAvailable: false,
      interfaceIdiom: 'phone',
      osVersion: '17.0',
      systemName: 'iOS',
    }),
  })
);

// Mock NativeSourceCode to satisfy resolveAssetSource and host components
jest.mock(
  'react-native/src/private/specs_DEPRECATED/modules/NativeSourceCode',
  () => ({
    getConstants: () => ({ scriptURL: 'http://localhost' }),
  })
);
jest.mock(
  'react-native/Libraries/NativeModules/specs/NativeSourceCode',
  () => ({
    __esModule: true,
    default: { getConstants: () => ({ scriptURL: 'http://localhost' }) },
  })
);

// Mock NativeDeviceInfo for Dimensions/PixelRatio
jest.mock(
  'react-native/src/private/specs_DEPRECATED/modules/NativeDeviceInfo',
  () => ({
    getConstants: () => ({
      Dimensions: {
        windowPhysicalPixels: {
          width: 1080,
          height: 1920,
          scale: 3,
          fontScale: 3,
        },
        screenPhysicalPixels: {
          width: 1080,
          height: 1920,
          scale: 3,
          fontScale: 3,
        },
      },
    }),
  })
);

// Bottom tabs: provide a minimal navigator structure
jest.mock('@react-navigation/bottom-tabs', () => {
  const React = require('react');
  return {
    __esModule: true,
    createBottomTabNavigator: () => {
      const Navigator = ({ children }) =>
        React.createElement(React.Fragment, null, children);
      const Screen = ({ component: Comp, children }) =>
        Comp ? React.createElement(Comp) : (children ?? null);
      return { Navigator, Screen };
    },
  };
});

// Make NavigationContainer a passthrough to render children in tests
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    NavigationContainer: ({ children }) => children,
  };
});

// RN Animated helper mock to avoid native driver errors with React 19 test renderer
// Use virtual mock to avoid resolution errors across RN versions
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}), {
  virtual: true,
});
// Mock React Native UIManager to avoid TurboModule dependency for View
jest.mock('react-native/Libraries/ReactNative/UIManager', () => ({
  getViewManagerConfig: () => ({ Commands: {}, NativeProps: {} }),
  hasViewManagerConfig: () => true,
  RCTView: { directEventTypes: {} },
}));

jest.mock('react-native/Libraries/ReactNative/NativeUIManager', () => ({
  __esModule: true,
  default: { getConstants: () => ({}) },
}));

// Mock KeyboardAvoidingView to avoid native keyboard module dependencies
jest.mock(
  'react-native/Libraries/Components/Keyboard/KeyboardAvoidingView',
  () => {
    const React = require('react');
    return {
      __esModule: true,
      default: ({ children, ...props }) =>
        React.createElement('View', props, children),
    };
  }
);
