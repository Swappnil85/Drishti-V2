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

// Mock expo-local-authentication for biometric tests
jest.mock(
  'expo-local-authentication',
  () => ({
    hasHardwareAsync: jest.fn().mockResolvedValue(true),
    isEnrolledAsync: jest.fn().mockResolvedValue(true),
    authenticateAsync: jest.fn().mockResolvedValue({ success: true }),
    supportedAuthenticationTypesAsync: jest.fn().mockResolvedValue([1, 2]),
    AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2 },
  }),
  { virtual: true }
);

// Mock expo-secure-store for secure storage tests
jest.mock(
  'expo-secure-store',
  () => ({
    setItemAsync: jest.fn().mockResolvedValue(undefined),
    getItemAsync: jest.fn().mockResolvedValue(null),
    deleteItemAsync: jest.fn().mockResolvedValue(undefined),
  }),
  { virtual: true }
);

// Mock AppState directly - avoid full RN mock to prevent Linking issues
jest.doMock('react-native/Libraries/AppState/AppState', () => ({
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  removeEventListener: jest.fn(),
  currentState: 'active',
}));

// Add global AppState mock for components that import from 'react-native'
global.AppState = {
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  removeEventListener: jest.fn(),
  currentState: 'active',
};

// Remove global security service mock - let individual tests handle their own mocking

// Mock TurboModuleRegistry to handle native module resolution
jest.doMock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
  getEnforcing: jest.fn(name => {
    // Return mock implementations for known modules
    const mocks = {
      AppState: {
        getConstants: () => ({ initialAppState: 'active' }),
        getCurrentAppState: jest.fn(success =>
          success({ app_state: 'active' })
        ),
        addListener: jest.fn(),
        removeListeners: jest.fn(),
      },
      ImageLoader: {
        getSize: jest.fn((uri, success) => success(100, 100)),
        getSizeWithHeaders: jest.fn((uri, headers, success) =>
          success(100, 100)
        ),
        prefetchImage: jest.fn(() => Promise.resolve(true)),
        queryCache: jest.fn(() => Promise.resolve({})),
      },
      Keyboard: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
        removeAllListeners: jest.fn(),
        dismiss: jest.fn(),
      },
    };
    return mocks[name] || {};
  }),
  get: jest.fn(() => null),
}));

// Mock NativeEventEmitter to handle Keyboard events
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter', () => {
  return class MockNativeEventEmitter {
    constructor() {}
    addListener = jest.fn(() => ({ remove: jest.fn() }));
    removeListener = jest.fn();
    removeAllListeners = jest.fn();
    emit = jest.fn();
  };
});

// Mock missing React Native feature flags
jest.mock(
  'react-native/src/private/featureflags/ReactNativeFeatureFlags',
  () => ({
    shouldEmitW3CPointerEvents: jest.fn(() => false),
    shouldPressibilityUseW3CPointerEventsForHover: jest.fn(() => false),
    shouldFlattenStyleAndApplyTransform: jest.fn(() => false),
    shouldUseAnimatedObjectForTransform: jest.fn(() => false),
    shouldUseSetNativePropsInFabric: jest.fn(() => false),
    shouldUseSetNativePropsInNativeAnimationsInFabric: jest.fn(() => false),
    enableAccessibilityChildrenDuplicateChildrenFix: jest.fn(() => false),
    enableAccessibilityChildrenDuplicateChildrenFixPartial: jest.fn(
      () => false
    ),
    enableAndroidLineHeightCentering: jest.fn(() => false),
    enableBridgelessArchitecture: jest.fn(() => false),
    enableCppPropsIteratorSetter: jest.fn(() => false),
    enableDeletionOfUnmountedViews: jest.fn(() => false),
    enableEagerRootViewAttachment: jest.fn(() => false),
    enableEventEmitterRetentionDuringGesturesOnAndroid: jest.fn(() => false),
    enableFabricLogs: jest.fn(() => false),
    enableFabricRenderer: jest.fn(() => false),
    enableGranularShadowTreeStateReconciliation: jest.fn(() => false),
    enableIOSViewClipToPaddingBox: jest.fn(() => false),
    enableLayoutAnimationsOnAndroid: jest.fn(() => false),
    enableLayoutAnimationsOnIOS: jest.fn(() => false),
    enableLongTaskAPI: jest.fn(() => false),
    enableMicrotasks: jest.fn(() => false),
    enablePropsUpdateReconciliationAndroid: jest.fn(() => false),
    enableReportEventPaintTime: jest.fn(() => false),
    enableSynchronousStateUpdates: jest.fn(() => false),
    enableUIConsistency: jest.fn(() => false),
    enableViewRecycling: jest.fn(() => false),
    excludeYogaFromRawProps: jest.fn(() => false),
    fixMappingOfEventPrioritiesBetweenFabricAndReact: jest.fn(() => false),
    fixMountingCoordinatorReportedPendingTransactionsOnAndroid: jest.fn(
      () => false
    ),
    fuseboxEnabledDebug: jest.fn(() => false),
    fuseboxEnabledRelease: jest.fn(() => false),
    initEagerTurboModulesOnNativeModulesQueueAndroid: jest.fn(() => false),
    lazyAnimationCallbacks: jest.fn(() => false),
    loadVectorDrawablesOnImages: jest.fn(() => false),
    setAndroidLayoutDirection: jest.fn(() => false),
    traceTurboModulePromiseRejectionsOnAndroid: jest.fn(() => false),
    useFabricInterop: jest.fn(() => false),
    useImmediateExecutorInAndroidBridgeless: jest.fn(() => false),
    useModernRuntimeScheduler: jest.fn(() => false),
    useNativeViewConfigsInBridgelessMode: jest.fn(() => false),
    useOptimisedViewPreallocationOnAndroid: jest.fn(() => false),
    useOptimizedEventBatchingOnAndroid: jest.fn(() => false),
    useRuntimeShadowNodeReferenceUpdate: jest.fn(() => false),
    useTurboModuleInterop: jest.fn(() => false),
    useTurboModules: jest.fn(() => false),
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

// Silence console noise in CI environment
if (process.env.CI === 'true') {
  const originalConsole = global.console;
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}
