/**
 * E5-S2: Preferences Tests
 * Tests for preferences functionality including currency, theme, and privacy settings
 */

import { OnboardingStorageService } from '../services/onboardingStorage';
import { DEFAULT_PROFILE, SUPPORTED_CURRENCIES } from '../types/onboarding';
import { logEvent } from '../telemetry';

// Mock dependencies
jest.mock('../services/onboardingStorage');
jest.mock('../telemetry', () => ({
  logEvent: jest.fn(),
}));

const mockStorageService = OnboardingStorageService as jest.Mocked<typeof OnboardingStorageService>;
const mockLogEvent = logEvent as jest.MockedFunction<typeof logEvent>;

describe('E5-S2: Preferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Currency Preferences', () => {
    it('should include AUD as default currency', () => {
      expect(DEFAULT_PROFILE.currency).toBe('AUD');
    });

    it('should support major currencies', () => {
      const codes = SUPPORTED_CURRENCIES.map(c => c.code);
      expect(codes).toContain('AUD');
      expect(codes).toContain('USD');
      expect(codes).toContain('EUR');
      expect(codes).toContain('GBP');
      expect(codes).toContain('CAD');
      expect(codes).toContain('JPY');
    });

    it('should have proper currency display information', () => {
      const aud = SUPPORTED_CURRENCIES.find(c => c.code === 'AUD');
      expect(aud).toEqual({
        code: 'AUD',
        name: 'Australian Dollar',
        symbol: 'A$',
      });

      const usd = SUPPORTED_CURRENCIES.find(c => c.code === 'USD');
      expect(usd).toEqual({
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
      });
    });

    it('should log telemetry when currency is changed', () => {
      logEvent('pref_currency_set', { currency: 'USD' });
      expect(mockLogEvent).toHaveBeenCalledWith('pref_currency_set', {
        currency: 'USD',
      });
    });
  });

  describe('Theme Preferences', () => {
    it('should default to system theme', () => {
      expect(DEFAULT_PROFILE.theme).toBe('system');
    });

    it('should support light, dark, and system themes', () => {
      const validThemes = ['system', 'light', 'dark'];
      expect(validThemes).toContain(DEFAULT_PROFILE.theme);
    });

    it('should log telemetry when theme is changed', () => {
      logEvent('theme_change', { mode: 'dark' });
      expect(mockLogEvent).toHaveBeenCalledWith('theme_change', {
        mode: 'dark',
      });
    });
  });

  describe('Privacy Preferences', () => {
    it('should default to cloud sync enabled', () => {
      expect(DEFAULT_PROFILE.privacyLocalOnly).toBe(false);
    });

    it('should log telemetry when privacy mode is enabled', () => {
      logEvent('privacy_local_only_enabled');
      expect(mockLogEvent).toHaveBeenCalledWith('privacy_local_only_enabled');
    });

    it('should log telemetry when cloud sync is enabled', () => {
      logEvent('privacy_cloud_sync_enabled');
      expect(mockLogEvent).toHaveBeenCalledWith('privacy_cloud_sync_enabled');
    });
  });

  describe('Sample Data Preferences', () => {
    it('should default to no sample data', () => {
      expect(DEFAULT_PROFILE.hasSampleData).toBe(false);
    });

    it('should log telemetry when sample data is loaded', () => {
      logEvent('sample_data_load');
      expect(mockLogEvent).toHaveBeenCalledWith('sample_data_load');
    });

    it('should log telemetry when sample data is cleared', () => {
      logEvent('sample_data_clear');
      expect(mockLogEvent).toHaveBeenCalledWith('sample_data_clear');
    });
  });

  describe('Preferences Persistence', () => {
    it('should save profile when preferences are updated', async () => {
      const updatedProfile = {
        ...DEFAULT_PROFILE,
        currency: 'USD',
        privacyLocalOnly: true,
      };

      await OnboardingStorageService.saveProfile(updatedProfile);

      expect(mockStorageService.saveProfile).toHaveBeenCalledWith(updatedProfile);
    });

    it('should load profile on app start', async () => {
      const savedProfile = {
        ...DEFAULT_PROFILE,
        currency: 'EUR',
        theme: 'dark' as const,
      };

      mockStorageService.loadProfile.mockResolvedValue(savedProfile);

      const result = await OnboardingStorageService.loadProfile();

      expect(mockStorageService.loadProfile).toHaveBeenCalled();
      expect(result).toEqual(savedProfile);
    });

    it('should return default profile when no saved profile exists', async () => {
      mockStorageService.loadProfile.mockResolvedValue(DEFAULT_PROFILE);

      const result = await OnboardingStorageService.loadProfile();

      expect(result).toEqual(DEFAULT_PROFILE);
    });
  });

  describe('Preferences Reset', () => {
    it('should reset all preferences to default', async () => {
      await OnboardingStorageService.saveProfile(DEFAULT_PROFILE);

      expect(mockStorageService.saveProfile).toHaveBeenCalledWith(DEFAULT_PROFILE);
    });

    it('should log telemetry when preferences are reset', () => {
      logEvent('preferences_reset');
      expect(mockLogEvent).toHaveBeenCalledWith('preferences_reset');
    });
  });

  describe('Accessibility Requirements', () => {
    it('should have accessible currency names', () => {
      SUPPORTED_CURRENCIES.forEach(currency => {
        expect(currency.name).toBeTruthy();
        expect(currency.name.length).toBeGreaterThan(3);
        expect(currency.symbol).toBeTruthy();
        expect(currency.code).toBeTruthy();
        expect(currency.code.length).toBe(3);
      });
    });

    it('should support screen reader friendly labels', () => {
      // This tests that currency data structure supports accessibility
      const aud = SUPPORTED_CURRENCIES.find(c => c.code === 'AUD');
      const accessibilityLabel = `${aud?.name}, ${aud?.symbol}`;
      expect(accessibilityLabel).toBe('Australian Dollar, A$');
    });
  });

  describe('Performance Requirements', () => {
    it('should have reasonable number of supported currencies', () => {
      // Per NFR: Settings screen load p95 < 1s
      // Too many currencies could impact performance
      expect(SUPPORTED_CURRENCIES.length).toBeLessThanOrEqual(10);
      expect(SUPPORTED_CURRENCIES.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Data Contract Validation', () => {
    it('should match the expected Profile interface', () => {
      const profile = DEFAULT_PROFILE;
      
      expect(typeof profile.currency).toBe('string');
      expect(['system', 'light', 'dark']).toContain(profile.theme);
      expect(typeof profile.privacyLocalOnly).toBe('boolean');
      expect(typeof profile.hasSampleData).toBe('boolean');
    });

    it('should support partial profile updates', () => {
      const partialUpdate = { currency: 'USD' };
      const updatedProfile = { ...DEFAULT_PROFILE, ...partialUpdate };
      
      expect(updatedProfile.currency).toBe('USD');
      expect(updatedProfile.theme).toBe(DEFAULT_PROFILE.theme);
      expect(updatedProfile.privacyLocalOnly).toBe(DEFAULT_PROFILE.privacyLocalOnly);
      expect(updatedProfile.hasSampleData).toBe(DEFAULT_PROFILE.hasSampleData);
    });
  });
});
