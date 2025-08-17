import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getOnboardingCompleted,
  setOnboardingCompleted,
  clearOnboardingState,
  clearAllPreferences,
  getPrivacyModeEnabled,
  setPrivacyModeEnabled,
  getAppLockEnabled,
  setAppLockEnabled,
  getAutoLockTimeout,
  setAutoLockTimeout,
  clearSecuritySettings,
  STORAGE_KEYS,
} from '../utils/storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  multiRemove: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('Storage Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOnboardingCompleted', () => {
    it('returns true when value is "1"', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('1');
      const result = await getOnboardingCompleted();
      expect(result).toBe(true);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(
        STORAGE_KEYS.ONBOARDING_COMPLETED
      );
    });

    it('returns false when value is not "1"', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('0');
      const result = await getOnboardingCompleted();
      expect(result).toBe(false);
    });

    it('returns false when value is null', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      const result = await getOnboardingCompleted();
      expect(result).toBe(false);
    });

    it('returns false on storage error', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
      const result = await getOnboardingCompleted();
      expect(result).toBe(false);
    });
  });

  describe('setOnboardingCompleted', () => {
    it('sets "1" when true', async () => {
      await setOnboardingCompleted(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.ONBOARDING_COMPLETED,
        '1'
      );
    });

    it('sets "0" when false', async () => {
      await setOnboardingCompleted(false);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.ONBOARDING_COMPLETED,
        '0'
      );
    });
  });

  describe('clearOnboardingState', () => {
    it('removes onboarding keys', async () => {
      await clearOnboardingState();
      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        STORAGE_KEYS.ONBOARDING_COMPLETED,
        STORAGE_KEYS.ONBOARDING_PROGRESS,
      ]);
    });
  });

  describe('clearAllPreferences', () => {
    it('removes all preference keys including security settings', async () => {
      await clearAllPreferences();
      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        STORAGE_KEYS.ONBOARDING_COMPLETED,
        STORAGE_KEYS.ONBOARDING_PROGRESS,
        STORAGE_KEYS.THEME_PREFS,
        STORAGE_KEYS.PRIVACY_MODE,
        STORAGE_KEYS.APP_LOCK_ENABLED,
        STORAGE_KEYS.AUTO_LOCK_TIMEOUT,
        STORAGE_KEYS.BIOMETRIC_ENABLED,
        STORAGE_KEYS.PIN_ENABLED,
      ]);
    });
  });

  describe('Privacy Mode', () => {
    describe('getPrivacyModeEnabled', () => {
      it('returns true when enabled', async () => {
        mockAsyncStorage.getItem.mockResolvedValue('1');
        const result = await getPrivacyModeEnabled();
        expect(result).toBe(true);
        expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(
          STORAGE_KEYS.PRIVACY_MODE
        );
      });

      it('returns false when disabled', async () => {
        mockAsyncStorage.getItem.mockResolvedValue('0');
        const result = await getPrivacyModeEnabled();
        expect(result).toBe(false);
      });

      it('returns false when not set', async () => {
        mockAsyncStorage.getItem.mockResolvedValue(null);
        const result = await getPrivacyModeEnabled();
        expect(result).toBe(false);
      });
    });

    describe('setPrivacyModeEnabled', () => {
      it('sets privacy mode to enabled', async () => {
        await setPrivacyModeEnabled(true);
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          STORAGE_KEYS.PRIVACY_MODE,
          '1'
        );
      });

      it('sets privacy mode to disabled', async () => {
        await setPrivacyModeEnabled(false);
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          STORAGE_KEYS.PRIVACY_MODE,
          '0'
        );
      });
    });
  });

  describe('App Lock', () => {
    describe('getAppLockEnabled', () => {
      it('returns true when enabled', async () => {
        mockAsyncStorage.getItem.mockResolvedValue('1');
        const result = await getAppLockEnabled();
        expect(result).toBe(true);
        expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(
          STORAGE_KEYS.APP_LOCK_ENABLED
        );
      });

      it('returns false when disabled', async () => {
        mockAsyncStorage.getItem.mockResolvedValue('0');
        const result = await getAppLockEnabled();
        expect(result).toBe(false);
      });
    });

    describe('setAppLockEnabled', () => {
      it('sets app lock to enabled', async () => {
        await setAppLockEnabled(true);
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          STORAGE_KEYS.APP_LOCK_ENABLED,
          '1'
        );
      });

      it('sets app lock to disabled', async () => {
        await setAppLockEnabled(false);
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          STORAGE_KEYS.APP_LOCK_ENABLED,
          '0'
        );
      });
    });
  });

  describe('Auto-lock Timeout', () => {
    describe('getAutoLockTimeout', () => {
      it('returns stored timeout', async () => {
        mockAsyncStorage.getItem.mockResolvedValue('3');
        const result = await getAutoLockTimeout();
        expect(result).toBe(3);
      });

      it('returns default when not set', async () => {
        mockAsyncStorage.getItem.mockResolvedValue(null);
        const result = await getAutoLockTimeout();
        expect(result).toBe(5); // Default 5 minutes
      });

      it('clamps timeout to valid range', async () => {
        mockAsyncStorage.getItem.mockResolvedValue('15'); // Above max
        const result = await getAutoLockTimeout();
        expect(result).toBe(10); // Clamped to max
      });

      it('clamps timeout to minimum', async () => {
        mockAsyncStorage.getItem.mockResolvedValue('0'); // Below min
        const result = await getAutoLockTimeout();
        expect(result).toBe(1); // Clamped to min
      });
    });

    describe('setAutoLockTimeout', () => {
      it('sets valid timeout', async () => {
        await setAutoLockTimeout(7);
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          STORAGE_KEYS.AUTO_LOCK_TIMEOUT,
          '7'
        );
      });

      it('clamps timeout above maximum', async () => {
        await setAutoLockTimeout(15);
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          STORAGE_KEYS.AUTO_LOCK_TIMEOUT,
          '10'
        );
      });

      it('clamps timeout below minimum', async () => {
        await setAutoLockTimeout(0);
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          STORAGE_KEYS.AUTO_LOCK_TIMEOUT,
          '1'
        );
      });
    });
  });

  describe('clearSecuritySettings', () => {
    it('removes all security-related keys', async () => {
      await clearSecuritySettings();
      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        STORAGE_KEYS.PRIVACY_MODE,
        STORAGE_KEYS.APP_LOCK_ENABLED,
        STORAGE_KEYS.AUTO_LOCK_TIMEOUT,
        STORAGE_KEYS.BIOMETRIC_ENABLED,
        STORAGE_KEYS.PIN_ENABLED,
      ]);
    });
  });
});
