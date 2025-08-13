import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';

jest.mock('react-native/Libraries/Utilities/Appearance', () => ({
  getColorScheme: () => 'light',
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
}));

describe('E4-S1: Bottom Tab Navigation Shell', () => {
  it('renders navigation container and does not crash', () => {
    const tree = render(<App />);
    expect(tree.toJSON()).toBeTruthy();
  });
});
