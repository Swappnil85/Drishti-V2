const NativeModules = {
  ImageLoader: {
    prefetchImage: jest.fn(),
    getSize: jest.fn((uri, success) => setTimeout(() => success(320, 240), 0)),
  },
  ImageViewManager: {
    prefetchImage: jest.fn(),
    getSize: jest.fn((uri, success) => setTimeout(() => success(320, 240), 0)),
  },
  Linking: {},
  UIManager: {
    RCTView: {
      directEventTypes: {},
    },
  },
  NativeUnimoduleProxy: {
    modulesConstants: {
      ExponentConstants: { experienceUrl: 'exp://localhost:8081' },
    },
    viewManagersMetadata: {},
  },
  // Mock AppState for SecurityService
  AppState: {
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    removeEventListener: jest.fn(),
    currentState: 'active',
  },
  // Mock ExpoLocalAuthentication
  ExpoLocalAuthentication: {
    hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
    isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
    supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve([1])), // FINGERPRINT
    authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
  },
  // Mock ExpoSecureStore
  ExpoSecureStore: {
    setItemAsync: jest.fn(() => Promise.resolve()),
    getItemAsync: jest.fn(() => Promise.resolve(null)),
    deleteItemAsync: jest.fn(() => Promise.resolve()),
  },
};

export default NativeModules;
