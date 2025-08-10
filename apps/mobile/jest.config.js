module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@expo|expo|expo-modules-core|react-native-web|@nozbe/watermelondb|react-native-vector-icons)/)',
  ],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{ts,tsx,js,jsx}', '!src/**/__tests__/**'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
