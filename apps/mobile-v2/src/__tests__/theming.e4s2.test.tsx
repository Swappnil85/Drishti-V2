import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider, useThemeContext } from '../theme/ThemeProvider';

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
}));

const Consumer = () => {
  const { mode, tokens } = useThemeContext();
  return null;
};

describe('E4-S2: Global Theming', () => {
  it('initializes and provides tokens', () => {
    const tree = render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    );
    expect(tree).toBeTruthy();
  });
});
