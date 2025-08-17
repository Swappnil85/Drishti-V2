import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from '../navigation/RootNavigator';
import { ThemeProvider } from '../theme/ThemeProvider';
import { getOnboardingCompleted } from '../utils/storage';
import { logEvent } from '../telemetry';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  multiRemove: jest.fn(),
}));

jest.mock('../utils/storage', () => ({
  getOnboardingCompleted: jest.fn(),
}));

jest.mock('../telemetry', () => ({
  logEvent: jest.fn(),
}));

const mockGetOnboardingCompleted = getOnboardingCompleted as jest.MockedFunction<typeof getOnboardingCompleted>;
const mockLogEvent = logEvent as jest.MockedFunction<typeof logEvent>;

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <NavigationContainer>
      {children}
    </NavigationContainer>
  </ThemeProvider>
);

describe('Onboarding Gate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows onboarding when not completed', async () => {
    mockGetOnboardingCompleted.mockResolvedValue(false);

    const { getByText } = render(
      <TestWrapper>
        <RootNavigator />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Welcome to Drishti')).toBeTruthy();
    });

    expect(mockLogEvent).toHaveBeenCalledWith('onboarding_start');
  });

  it('shows main app when onboarding completed', async () => {
    mockGetOnboardingCompleted.mockResolvedValue(true);

    const { queryByText } = render(
      <TestWrapper>
        <RootNavigator />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(queryByText('Welcome to Drishti')).toBeNull();
    });

    expect(mockLogEvent).not.toHaveBeenCalledWith('onboarding_start');
  });

  it('defaults to onboarding on storage error', async () => {
    mockGetOnboardingCompleted.mockRejectedValue(new Error('Storage error'));

    const { getByText } = render(
      <TestWrapper>
        <RootNavigator />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Welcome to Drishti')).toBeTruthy();
    });

    expect(mockLogEvent).toHaveBeenCalledWith('onboarding_start');
  });
});
