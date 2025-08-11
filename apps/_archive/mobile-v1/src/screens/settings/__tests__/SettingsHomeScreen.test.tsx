import React from 'react';
import { render } from '@testing-library/react-native';
import SettingsHomeScreen from '../SettingsHomeScreen';
import { ThemeProvider } from '../../../contexts/ThemeContext';

describe('SettingsHomeScreen', () => {
  it('renders toggles', () => {
    const tree = render(
      <ThemeProvider>
        <SettingsHomeScreen />
      </ThemeProvider>
    );
    expect(tree.getByText('Settings')).toBeTruthy();
  });
});

