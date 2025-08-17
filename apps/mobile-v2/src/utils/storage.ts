import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  ONBOARDING_COMPLETED: 'onboarding.completed',
  THEME_PREFS: 'theme_prefs',
  ONBOARDING_PROGRESS: 'onboarding.progress',
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
    ]);
  } catch {}
}
