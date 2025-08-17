// Mock for React Native AppState
module.exports = {
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  removeEventListener: jest.fn(),
  currentState: 'active',
};
