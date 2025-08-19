import * as LocalAuthentication from 'expo-local-authentication';

export const verifyPin = async (
  pin: string,
  storedPin: string | null
): Promise<boolean> => {
  return storedPin === pin;
};

export const isBiometricAvailable = async (): Promise<boolean> => {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && isEnrolled;
};

export const authenticateWithBiometrics = async (): Promise<{
  success: boolean;
}> => {
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
