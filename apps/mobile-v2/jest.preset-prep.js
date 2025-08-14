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
// Patch @testing-library/react-native peer dep check before anything imports it
try {
  const jestRef = require('jest-mock');
  if (jestRef && typeof jest !== 'undefined') {
    jest.mock(
      '@testing-library/react-native/src/helpers/ensure-peer-deps',
      () => ({ ensurePeerDeps: () => {} }),
      { virtual: true }
    );
  }
} catch {}

// As a fallback, mock the resolved ensure-peer-deps module by absolute path to bypass renderer pin checks
try {
  const resolvedSrc = require.resolve(
    '@testing-library/react-native/src/helpers/ensure-peer-deps'
  );
  jest.mock(resolvedSrc, () => ({ ensurePeerDeps: () => {} }), {
    virtual: true,
  });
} catch {}
try {
  const resolvedDist = require.resolve(
    '@testing-library/react-native/dist/helpers/ensure-peer-deps'
  );
  jest.mock(resolvedDist, () => ({ ensurePeerDeps: () => {} }), {
    virtual: true,
  });
} catch {}
// Extra-hard override: directly mock the files inside the installed package by absolute path
try {
  const path = require('path');
  const pkgDir = path.dirname(
    require.resolve('@testing-library/react-native/package.json')
  );
  const srcPath = path.join(pkgDir, 'src', 'helpers', 'ensure-peer-deps.ts');
  const distPath = path.join(pkgDir, 'dist', 'helpers', 'ensure-peer-deps.js');
  try {
    jest.mock(srcPath, () => ({ ensurePeerDeps: () => {} }), {
      virtual: true,
    });
  } catch {}
  try {
    jest.mock(distPath, () => ({ ensurePeerDeps: () => {} }), {
      virtual: true,
    });
  } catch {}
} catch {}
