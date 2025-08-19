import { Platform } from 'react-native';

export const verifyPin = async (
  pin: string,
  storedPin: string | null
): Promise<boolean> => {
  return storedPin === pin;
};

export const isBiometricAvailable = async (): Promise<boolean> => {
  // Biometrics are not available on web
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    // Dynamic import to avoid top-level native API calls
    const LocalAuthentication = await import('expo-local-authentication');
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  } catch {
    return false;
  }
};

export const authenticateWithBiometrics = async (): Promise<{
  success: boolean;
}> => {
  // Biometrics are not available on web
  if (Platform.OS === 'web') {
    return { success: false };
  }

  try {
    // Dynamic import to avoid top-level native API calls
    const LocalAuthentication = await import('expo-local-authentication');
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Drishti',
      disableDeviceFallback: true,
      cancelLabel: 'Use PIN',
    });
    return result;
  } catch {
    return { success: false };
  }
};

export const getLockoutRemainingTime = (
  lockoutUntil: number | null
): number => {
  if (!lockoutUntil) {
    return 0;
  }
  const remaining = lockoutUntil - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
};
