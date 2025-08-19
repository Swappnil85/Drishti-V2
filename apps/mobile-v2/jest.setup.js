// Minimal Jest setup for React 19 + RN 0.79 + Expo - focus on Modal fix

// Make sure global.performance exists for some RN shims
if (typeof global.performance === 'undefined') {
  global.performance = { now: () => Date.now() };
}

// Ensure window and document exist (jsdom env)
if (typeof window === 'undefined') {
  global.window = {};
}
if (typeof document === 'undefined') {
  global.document = {};
}

// Mock Linking to prevent nullthrows error
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  getInitialURL: jest.fn(() => Promise.resolve(null)),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock LogBox components to prevent Linking dependency issues
jest.mock('react-native/Libraries/LogBox/UI/LogBoxMessage', () => ({}));
jest.mock(
  'react-native/Libraries/LogBox/UI/LogBoxNotificationMessage',
  () => ({})
);
jest.mock('react-native/Libraries/LogBox/UI/LogBoxNotification', () => ({}));
jest.mock(
  'react-native/Libraries/LogBox/LogBoxNotificationContainer',
  () => ({})
);
jest.mock('react-native/Libraries/ReactNative/AppContainer-dev', () => ({}));
jest.mock('react-native/Libraries/ReactNative/AppContainer', () => ({}));

// Mock react-native to replace Modal with a simple View
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  const React = require('react');

  return {
    ...RN,
    Modal: ({ children, visible, ...props }) => {
      if (!visible) return null;
      return React.createElement(
        RN.View,
        {
          testID: 'MockModal',
          'data-testid': 'MockModal',
          ...props,
        },
        children
      );
    },
  };
});
