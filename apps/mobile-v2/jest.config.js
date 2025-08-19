module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.preset-prep.js'],
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/jest.setup.after.js',
    '<rootDir>/jest.setup.mobile.ts',
  ],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-reanimated|expo|expo-router|expo-constants|expo-modules-core)/)',
  ],
  moduleNameMapper: {
    '^react$': '<rootDir>/node_modules/react',
    '^react-dom$': '<rootDir>/node_modules/react-dom',
    '^react-test-renderer$': '<rootDir>/node_modules/react-test-renderer',

    '^expo-local-authentication$':
      '<rootDir>/__mocks__/expo-local-authentication.js',
    '^react-native-gesture-handler/jestSetup$':
      '<rootDir>/node_modules/react-native-gesture-handler/jestSetup.js',
    '^react-native-safe-area-context$':
      '<rootDir>/src/test/__mocks__/react-native-safe-area-context.js',
    '^@react-native/assets-registry/registry$':
      '<rootDir>/src/test/__mocks__/react-native-assets-registry.js',
    '^react-native/Libraries/BatchedBridge/NativeModules$':
      '<rootDir>/src/test/__mocks__/react-native-NativeModules.js',
    '^@testing-library/react-native/src/helpers/ensure-peer-deps(\\.ts|\\.js)?$':
      '<rootDir>/src/test/__mocks__/atl-ensure-peer-deps.js',
    '^@testing-library/react-native/dist/helpers/ensure-peer-deps(\\.js)?$':
      '<rootDir>/src/test/__mocks__/atl-ensure-peer-deps.js',
    '^react-native/Libraries/AppState/AppState$':
      '<rootDir>/src/test/__mocks__/AppState.js',
  },
};
