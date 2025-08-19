import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

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
