import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SettingsScreen from '../screens/SettingsScreen';
import { ThemeProvider } from '../theme/ThemeProvider';
import { SecurityProvider } from '../state/security';
import { clearOnboardingState, clearAllPreferences } from '../utils/storage';
import { logEvent } from '../telemetry';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  multiRemove: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../utils/storage', () => ({
  clearOnboardingState: jest.fn(),
  clearAllPreferences: jest.fn(),
  getOnboardingCompleted: jest.fn().mockResolvedValue(true),
  getPrivacyModeEnabled: jest.fn().mockResolvedValue(false),
  setPrivacyModeEnabled: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../telemetry', () => ({
  logEvent: jest.fn(),
}));

jest.mock('../services/SecurityService', () => ({
  securityService: {
    isAppLockEnabled: jest.fn().mockResolvedValue(false),
    getCurrentLockState: jest.fn().mockResolvedValue('UNLOCKED'),
    addLockStateListener: jest.fn(),
    removeLockStateListener: jest.fn(),
    getSecuritySettings: jest.fn().mockResolvedValue({
      appLockEnabled: false,
      biometricEnabled: false,
      pinEnabled: false,
      autoLockTimeout: 5,
    }),
  },
  AppLockState: {
    LOCKED: 'LOCKED',
    UNLOCKED: 'UNLOCKED',
  },
}));

jest.mock('../services/BiometricService', () => ({
  biometricService: {
    checkAvailability: jest.fn().mockResolvedValue({
      isAvailable: false,
      biometryType: null,
      error: null,
    }),
    checkBiometricAvailability: jest.fn().mockResolvedValue({
      isAvailable: false,
      biometryType: null,
      error: null,
    }),
  },
}));

// Mock React Native modules individually to avoid conflicts
const mockAccessibilityInfo = {
  isReduceMotionEnabled: jest.fn().mockResolvedValue(false),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
};

const mockAppearance = {
  getColorScheme: jest.fn().mockReturnValue('light'),
  addChangeListener: jest.fn(() => ({ remove: jest.fn() })),
};

jest.doMock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    AccessibilityInfo: mockAccessibilityInfo,
    Appearance: mockAppearance,
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../utils/haptics', () => ({
  useHaptics: () => ({
    light: { safeImpactLight: jest.fn() },
  }),
}));

const mockClearOnboardingState = clearOnboardingState as jest.MockedFunction<
  typeof clearOnboardingState
>;
const mockClearAllPreferences = clearAllPreferences as jest.MockedFunction<
  typeof clearAllPreferences
>;
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
    <SecurityProvider>{children}</SecurityProvider>
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
    const { findByText } = render(
      <TestWrapper>
        <SettingsScreen />
      </TestWrapper>
    );

    fireEvent.press(await findByText('Reset Onboarding (QA)'));

    await waitFor(() => {
      expect(mockClearOnboardingState).toHaveBeenCalled();
      expect(mockLogEvent).toHaveBeenCalledWith('qa_reset_onboarding');
    });
  });

  it('reset all preferences calls clearAllPreferences and logs telemetry', async () => {
    const { findByText } = render(
      <TestWrapper>
        <SettingsScreen />
      </TestWrapper>
    );

    fireEvent.press(await findByText('Reset ALL Preferences (QA)'));

    await waitFor(() => {
      expect(mockClearAllPreferences).toHaveBeenCalled();
      expect(mockLogEvent).toHaveBeenCalledWith('qa_reset_all_preferences');
    });
  });

  it('renders tri-state reduced motion options', async () => {
    const { findByText, findAllByText } = render(
      <TestWrapper>
        <SettingsScreen />
      </TestWrapper>
    );

    expect(await findByText('Motion')).toBeTruthy();
    expect((await findAllByText('System Default')).length).toBeGreaterThan(0);
    expect((await findAllByText('Reduced Motion On')).length).toBeGreaterThan(
      0
    );
    expect((await findAllByText('Reduced Motion Off')).length).toBeGreaterThan(
      0
    );
  });
});
