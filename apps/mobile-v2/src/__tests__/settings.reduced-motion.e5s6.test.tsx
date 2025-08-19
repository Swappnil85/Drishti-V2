import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccessibilityInfo } from 'react-native';
import SettingsScreen from '../screens/SettingsScreen';
import { ThemeProvider } from '../theme/ThemeProvider';
import { SecurityProvider } from '../state/security';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
}));

// Mock React Native modules
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
      autoLockTimeout: 5,
    }),
  },
  AppLockState: {
    LOCKED: 'LOCKED',
    UNLOCKED: 'UNLOCKED',
  },
}));

jest.mock('../utils/storage', () => ({
  getOnboardingCompleted: jest.fn().mockResolvedValue(true),
  clearOnboardingData: jest.fn().mockResolvedValue(undefined),
  clearAllPreferences: jest.fn().mockResolvedValue(undefined),
  getPrivacyModeEnabled: jest.fn().mockResolvedValue(false),
  setPrivacyModeEnabled: jest.fn().mockResolvedValue(undefined),
  clearOnboardingState: jest.fn().mockResolvedValue(undefined),
}));

describe('E5-S6: Settings Screen Reduced Motion Controls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    mockAccessibilityInfo.isReduceMotionEnabled.mockResolvedValue(false);
  });

  const renderSettingsScreen = () => {
    return render(
      <ThemeProvider>
        <SecurityProvider>
          <SettingsScreen />
        </SecurityProvider>
      </ThemeProvider>
    );
  };

  describe('Reduced Motion UI Display', () => {
    it('should display current reduced motion state', async () => {
      const { getAllByLabelText } = renderSettingsScreen();

      await waitFor(() => {
        const labels = getAllByLabelText('reduced-motion-label');
        expect(labels.length).toBeGreaterThan(0);
        expect(labels[0]).toBeTruthy();
      });
    });

    it('should show reduced motion controls section', async () => {
      const { getByText } = renderSettingsScreen();

      await waitFor(() => {
        expect(getByText('Motion')).toBeTruthy();
      });
    });

    it('should display motion control buttons', async () => {
      const { getAllByText } = renderSettingsScreen();

      await waitFor(() => {
        expect(getAllByText('System Default').length).toBeGreaterThan(0);
        expect(getAllByText('Reduced Motion On').length).toBeGreaterThan(0);
        expect(getAllByText('Reduced Motion Off').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Reduced Motion Control Interactions', () => {
    it('should handle system default button press', async () => {
      const { getAllByText } = renderSettingsScreen();

      await waitFor(() => {
        const systemButtons = getAllByText('System Default');
        fireEvent.press(systemButtons[0]);
      });

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          'theme_prefs',
          expect.stringContaining('"reducedMotionOverride":"system"')
        );
      });
    });

    it('should handle reduced motion on button press', async () => {
      const { getAllByText } = renderSettingsScreen();

      await waitFor(() => {
        const onButtons = getAllByText('Reduced Motion On');
        fireEvent.press(onButtons[0]);
      });

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          'theme_prefs',
          expect.stringContaining('"reducedMotionOverride":"on"')
        );
      });
    });

    it('should handle reduced motion off button press', async () => {
      const { getAllByText } = renderSettingsScreen();

      await waitFor(() => {
        const offButtons = getAllByText('Reduced Motion Off');
        fireEvent.press(offButtons[0]);
      });

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          'theme_prefs',
          expect.stringContaining('"reducedMotionOverride":"off"')
        );
      });
    });
  });

  describe('Active State Indicators', () => {
    it('should show system as active by default', async () => {
      const { getAllByText } = renderSettingsScreen();

      await waitFor(() => {
        const systemButtons = getAllByText('System Default');
        expect(systemButtons[0]).toBeTruthy();
      });
    });

    it('should render motion controls without crashing', async () => {
      const { getAllByLabelText } = renderSettingsScreen();

      await waitFor(() => {
        const labels = getAllByLabelText('reduced-motion-label');
        expect(labels.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper accessibility labels', async () => {
      const { getAllByLabelText } = renderSettingsScreen();

      await waitFor(() => {
        const labels = getAllByLabelText('reduced-motion-label');
        expect(labels.length).toBeGreaterThan(0);
      });
    });

    it('should display current state for screen readers', async () => {
      mockAccessibilityInfo.isReduceMotionEnabled.mockResolvedValue(true);

      const { getAllByLabelText } = renderSettingsScreen();

      await waitFor(() => {
        const labels = getAllByLabelText('reduced-motion-label');
        expect(labels[0]).toBeTruthy();
      });
    });
  });

  describe('Theme Integration', () => {
    it('should use theme tokens for text colors', async () => {
      const { getByText } = renderSettingsScreen();

      await waitFor(() => {
        const motionSection = getByText('Motion');
        expect(motionSection.props.style).toEqual(
          expect.objectContaining({
            color: expect.any(String),
          })
        );
      });
    });

    it('should render with theme context', async () => {
      const { getAllByLabelText } = renderSettingsScreen();

      await waitFor(() => {
        const labels = getAllByLabelText('reduced-motion-label');
        expect(labels[0]).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      const { getAllByText } = renderSettingsScreen();

      await waitFor(() => {
        const onButtons = getAllByText('Reduced Motion On');
        fireEvent.press(onButtons[0]);
      });

      // Should not crash the app
      await waitFor(() => {
        const onButtons = getAllByText('Reduced Motion On');
        expect(onButtons[0]).toBeTruthy();
      });
    });
  });

  describe('Telemetry Integration', () => {
    it('should log motion preference changes', async () => {
      const { logEvent } = require('../telemetry');

      const { getAllByText } = renderSettingsScreen();

      await waitFor(() => {
        const onButtons = getAllByText('Reduced Motion On');
        fireEvent.press(onButtons[0]);
      });

      await waitFor(() => {
        expect(logEvent).toHaveBeenCalledWith('motion_pref_changed', {
          reducedMotionOverride: 'on',
        });
      });
    });
  });
});
