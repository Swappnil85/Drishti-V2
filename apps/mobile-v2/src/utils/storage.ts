import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  ONBOARDING_COMPLETED: 'onboarding.completed',
  THEME_PREFS: 'theme_prefs',
  ONBOARDING_PROGRESS: 'onboarding.progress',
  // Security and Privacy settings
  PRIVACY_MODE: 'privacy_mode_enabled',
  APP_LOCK_ENABLED: 'app_lock_enabled',
  AUTO_LOCK_TIMEOUT: 'auto_lock_timeout',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  PIN_ENABLED: 'pin_enabled',
} as const;

export async function getOnboardingCompleted(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
    return value === '1';
  } catch {
    return false;
  }
}

export async function setOnboardingCompleted(
  completed: boolean
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.ONBOARDING_COMPLETED,
      completed ? '1' : '0'
    );
  } catch {}
}

export async function clearOnboardingState(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ONBOARDING_COMPLETED,
      STORAGE_KEYS.ONBOARDING_PROGRESS,
    ]);
  } catch {}
}

export async function clearAllPreferences(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ONBOARDING_COMPLETED,
      STORAGE_KEYS.ONBOARDING_PROGRESS,
      STORAGE_KEYS.THEME_PREFS,
      STORAGE_KEYS.PRIVACY_MODE,
      STORAGE_KEYS.APP_LOCK_ENABLED,
      STORAGE_KEYS.AUTO_LOCK_TIMEOUT,
      STORAGE_KEYS.BIOMETRIC_ENABLED,
      STORAGE_KEYS.PIN_ENABLED,
    ]);
  } catch {}
}

// Privacy Mode utilities
export async function getPrivacyModeEnabled(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.PRIVACY_MODE);
    return value === '1';
  } catch {
    return false;
  }
}

export async function setPrivacyModeEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PRIVACY_MODE, enabled ? '1' : '0');
  } catch {}
}

// App Lock utilities
export async function getAppLockEnabled(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.APP_LOCK_ENABLED);
    return value === '1';
  } catch {
    return false;
  }
}

export async function setAppLockEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.APP_LOCK_ENABLED,
      enabled ? '1' : '0'
    );
  } catch {}
}

// Auto-lock timeout utilities
export async function getAutoLockTimeout(): Promise<number> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.AUTO_LOCK_TIMEOUT);
    const timeout = value ? parseInt(value, 10) : 5; // Default 5 minutes
    return Math.max(1, Math.min(10, timeout)); // Clamp between 1-10 minutes
  } catch {
    return 5; // Default 5 minutes
  }
}

export async function setAutoLockTimeout(minutes: number): Promise<void> {
  try {
    const validTimeout = Math.max(1, Math.min(10, minutes)); // Clamp between 1-10 minutes
    await AsyncStorage.setItem(
      STORAGE_KEYS.AUTO_LOCK_TIMEOUT,
      validTimeout.toString()
    );
  } catch {}
}

// Security settings cleanup
export async function clearSecuritySettings(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.PRIVACY_MODE,
      STORAGE_KEYS.APP_LOCK_ENABLED,
      STORAGE_KEYS.AUTO_LOCK_TIMEOUT,
      STORAGE_KEYS.BIOMETRIC_ENABLED,
      STORAGE_KEYS.PIN_ENABLED,
    ]);
  } catch {}
}
