/**
 * Preferences Context for E5-S2
 * Manages user preferences including currency, theme, and privacy settings
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { Profile, DEFAULT_PROFILE } from '../types/onboarding';
import { OnboardingStorageService } from '../services/onboardingStorage';
import { useThemeContext } from '../theme/ThemeProvider';
import { logEvent } from '../telemetry';

interface PreferencesContextValue {
  // Profile data
  profile: Profile;

  // Actions
  updateCurrency: (currency: string) => Promise<void>;
  updatePrivacyMode: (localOnly: boolean) => Promise<void>;
  updateSampleDataSetting: (hasSampleData: boolean) => Promise<void>;
  resetPreferences: () => Promise<void>;

  // Loading state
  isLoading: boolean;
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(
  undefined
);

interface PreferencesProviderProps {
  children: React.ReactNode;
}

export function PreferencesProvider({ children }: PreferencesProviderProps) {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const { setMode } = useThemeContext();

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setIsLoading(true);
        const savedProfile = await OnboardingStorageService.loadProfile();
        setProfile(savedProfile);

        // Sync theme with profile
        if (savedProfile.theme !== 'system') {
          setMode(savedProfile.theme);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to load preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [setMode]);

  const updateCurrency = useCallback(
    async (currency: string) => {
      const updatedProfile = { ...profile, currency };
      setProfile(updatedProfile);

      try {
        await OnboardingStorageService.saveProfile(updatedProfile);
        logEvent('pref_currency_set', { currency });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to save currency preference:', error);
        // Revert on error
        setProfile(profile);
      }
    },
    [profile]
  );

  const updatePrivacyMode = useCallback(
    async (localOnly: boolean) => {
      const updatedProfile = { ...profile, privacyLocalOnly: localOnly };
      setProfile(updatedProfile);

      try {
        await OnboardingStorageService.saveProfile(updatedProfile);
        if (localOnly) {
          logEvent('privacy_local_only_enabled');
        } else {
          logEvent('privacy_cloud_sync_enabled');
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to save privacy preference:', error);
        // Revert on error
        setProfile(profile);
      }
    },
    [profile]
  );

  const updateSampleDataSetting = useCallback(
    async (hasSampleData: boolean) => {
      const updatedProfile = { ...profile, hasSampleData };
      setProfile(updatedProfile);

      try {
        await OnboardingStorageService.saveProfile(updatedProfile);
        if (hasSampleData) {
          logEvent('sample_data_load');
        } else {
          logEvent('sample_data_clear');
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to save sample data preference:', error);
        // Revert on error
        setProfile(profile);
      }
    },
    [profile]
  );

  const resetPreferences = useCallback(async () => {
    setProfile(DEFAULT_PROFILE);

    try {
      await OnboardingStorageService.saveProfile(DEFAULT_PROFILE);
      setMode('system');
      logEvent('preferences_reset');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to reset preferences:', error);
    }
  }, [setMode]);

  const value: PreferencesContextValue = {
    profile,
    updateCurrency,
    updatePrivacyMode,
    updateSampleDataSetting,
    resetPreferences,
    isLoading,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return context;
}
