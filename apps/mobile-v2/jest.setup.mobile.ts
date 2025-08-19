/**
 * Jest setup for React Native + Expo on CI
 */

// Silence RN Reanimated / Animated warnings and provide mocks
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock')
);
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Expo modules light mocks (prevent native lookups on CI)
jest.mock('expo-constants', () => ({
  default: { manifest: {}, expoConfig: {} },
}));
jest.mock('expo-modules-core', () => ({
  NativeModulesProxy: {},
  EventEmitter: jest.fn(),
}));

// Expo Router minimal mocks if used by tests
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
  Stack: ({ children }: any) => children,
  Slot: ({ children }: any) => children,
}));

// Window.matchMedia & prefers-reduced-motion in jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? false : false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }),
});

// Increase test timeout for CI stability
jest.setTimeout(10000);
