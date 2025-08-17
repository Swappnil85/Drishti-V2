import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text } from 'react-native';
import { ThemeProvider } from '../theme/ThemeProvider';

// Mock security service for App rendering
jest.mock('../services/SecurityService', () => ({
  securityService: {
    isAppLockEnabled: jest.fn().mockResolvedValue(false),
    getCurrentLockState: jest.fn().mockResolvedValue('UNLOCKED'),
    addLockStateListener: jest.fn(),
    removeLockStateListener: jest.fn(),
  },
  AppLockState: {
    LOCKED: 'LOCKED',
    UNLOCKED: 'UNLOCKED',
  },
}));

describe('E4-S2: Theme provider smoke', () => {
  it('renders theme provider without crashing', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <View testID='theme-test'>
          <Text>Theme test</Text>
        </View>
      </ThemeProvider>
    );
    expect(getByTestId('theme-test')).toBeTruthy();
  });
});
