// Ensure required objects exist before jest-expo preset runs
if (typeof globalThis.performance === 'undefined') {
  globalThis.performance = { now: () => Date.now() };
}
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {};
}
if (typeof globalThis.document === 'undefined') {
  globalThis.document = {};
}
if (
  typeof globalThis.navigator === 'undefined' ||
  globalThis.navigator === null
) {
  globalThis.navigator = {};
}

// React Native bridge config stub to satisfy NativeModules invariant
if (typeof globalThis.__fbBatchedBridgeConfig === 'undefined') {
  globalThis.__fbBatchedBridgeConfig = { remoteModuleConfig: [] };
}

// Tame Appearance to avoid hitting native paths in unit tests
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const jestRef = require('jest-mock');
  if (jestRef && typeof jest !== 'undefined') {
    jest.mock('react-native/Libraries/Utilities/Appearance', () => ({
      getColorScheme: () => 'light',
      addChangeListener: () => ({ remove: () => {} }),
      removeChangeListener: () => {},
    }));
  }
} catch {}
