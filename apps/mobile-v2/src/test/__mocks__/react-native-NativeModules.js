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
    modulesConstants: { ExponentConstants: { experienceUrl: 'exp://localhost:8081' } },
    viewManagersMetadata: {},
  },
};

export default NativeModules;

