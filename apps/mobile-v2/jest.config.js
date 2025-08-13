module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.preset-prep.js'],
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/jest.setup.after.js',
  ],
  moduleNameMapper: {
    '^react-native-safe-area-context$':
      '<rootDir>/src/test/__mocks__/react-native-safe-area-context.js',
    '^@react-native/assets-registry/registry$':
      '<rootDir>/src/test/__mocks__/react-native-assets-registry.js',
    '^react-native/Libraries/BatchedBridge/NativeModules$':
      '<rootDir>/src/test/__mocks__/react-native-NativeModules.js',
  },
};
