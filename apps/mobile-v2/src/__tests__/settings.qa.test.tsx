import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SettingsScreen from '../screens/SettingsScreen';
import { ThemeProvider } from '../theme/ThemeProvider';
import { clearOnboardingState, clearAllPreferences } from '../utils/storage';
import { logEvent } from '../telemetry';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  multiRemove: jest.fn(),
}));

jest.mock('../utils/storage', () => ({
  clearOnboardingState: jest.fn(),
  clearAllPreferences: jest.fn(),
}));

jest.mock('../telemetry', () => ({
  logEvent: jest.fn(),
}));

const mockClearOnboardingState = clearOnboardingState as jest.MockedFunction<typeof clearOnboardingState>;
const mockClearAllPreferences = clearAllPreferences as jest.MockedFunction<typeof clearAllPreferences>;
const mockLogEvent = logEvent as jest.MockedFunction<typeof logEvent>;

jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
  if (buttons && buttons.length > 1) {
    const destructiveButton = buttons.find(b => b.style === 'destructive');
    if (destructiveButton && destructiveButton.onPress) {
      destructiveButton.onPress();
    }
  }
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('Settings QA Tools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders QA tools section', () => {
    const { getByText } = render(
      <TestWrapper>
        <SettingsScreen />
      </TestWrapper>
    );

    expect(getByText('QA Tools')).toBeTruthy();
    expect(getByText('Reset Onboarding (QA)')).toBeTruthy();
    expect(getByText('Reset ALL Preferences (QA)')).toBeTruthy();
  });

  it('reset onboarding calls clearOnboardingState and logs telemetry', async () => {
    const { getByText } = render(
      <TestWrapper>
        <SettingsScreen />
      </TestWrapper>
    );

    fireEvent.press(getByText('Reset Onboarding (QA)'));

    await waitFor(() => {
      expect(mockClearOnboardingState).toHaveBeenCalled();
      expect(mockLogEvent).toHaveBeenCalledWith('qa_reset_onboarding');
    });
  });

  it('reset all preferences calls clearAllPreferences and logs telemetry', async () => {
    const { getByText } = render(
      <TestWrapper>
        <SettingsScreen />
      </TestWrapper>
    );

    fireEvent.press(getByText('Reset ALL Preferences (QA)'));

    await waitFor(() => {
      expect(mockClearAllPreferences).toHaveBeenCalled();
      expect(mockLogEvent).toHaveBeenCalledWith('qa_reset_all_preferences');
    });
  });

  it('renders tri-state reduced motion options', () => {
    const { getByText } = render(
      <TestWrapper>
        <SettingsScreen />
      </TestWrapper>
    );

    expect(getByText('Motion')).toBeTruthy();
    expect(getByText('System Default')).toBeTruthy();
    expect(getByText('Reduced Motion On')).toBeTruthy();
    expect(getByText('Reduced Motion Off')).toBeTruthy();
  });
});
