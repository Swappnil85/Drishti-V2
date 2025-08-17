import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getOnboardingCompleted,
  setOnboardingCompleted,
  clearOnboardingState,
  clearAllPreferences,
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
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.ONBOARDING_COMPLETED);
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
    it('removes all preference keys', async () => {
      await clearAllPreferences();
      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        STORAGE_KEYS.ONBOARDING_COMPLETED,
        STORAGE_KEYS.ONBOARDING_PROGRESS,
        STORAGE_KEYS.THEME_PREFS,
      ]);
    });
  });
});
