// Mock for react-native Modal component to avoid portal behavior in jsdom
const React = require('react');

const MockModal = ({ children, visible, ...props }) => {
  if (!visible) return null;
  
  return React.createElement(
    'div',
    {
      testID: 'MockModal',
      'data-testid': 'MockModal',
      ...props,
    },
    children
  );
};

module.exports = MockModal;
