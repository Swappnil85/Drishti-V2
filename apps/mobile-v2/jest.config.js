module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.preset-prep.js'],
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/jest.setup.after.js',
  ],
  moduleNameMapper: {
    '^react$': '<rootDir>/node_modules/react',
    '^react-dom$': '<rootDir>/node_modules/react-dom',
    '^react-test-renderer$': '<rootDir>/node_modules/react-test-renderer',
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
  },
};
