import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Biometric authentication types
export enum BiometricType {
  NONE = 'none',
  TOUCH_ID = 'touchId',
  FACE_ID = 'faceId',
  FINGERPRINT = 'fingerprint',
  FACE_UNLOCK = 'faceUnlock',
  IRIS = 'iris',
}

// Authentication result interface
export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometricType?: BiometricType;
  fallbackToCredentials?: boolean;
}

// Biometric availability result
export interface BiometricAvailability {
  isAvailable: boolean;
  biometricTypes: BiometricType[];
  hasHardware: boolean;
  isEnrolled: boolean;
  error?: string;
}

// Secure storage keys
const STORAGE_KEYS = {
  BIOMETRIC_ENABLED: 'biometric_enabled',
  BIOMETRIC_TYPE: 'biometric_type',
  USER_CREDENTIALS: 'user_credentials_encrypted',
  FALLBACK_ENABLED: 'fallback_enabled',
  FAILED_ATTEMPTS: 'biometric_failed_attempts',
  LAST_FAILED_ATTEMPT: 'last_failed_attempt',
} as const;

// Configuration constants
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

export class BiometricService {
  private static instance: BiometricService;

  private constructor() {}

  public static getInstance(): BiometricService {
    if (!BiometricService.instance) {
      BiometricService.instance = new BiometricService();
    }
    return BiometricService.instance;
  }

  // Check if biometric authentication is available
  async checkBiometricAvailability(): Promise<BiometricAvailability> {
    try {
      // Check if device has biometric hardware
      const hasHardware = await LocalAuthentication.hasHardwareAsync();

      if (!hasHardware) {
        return {
          isAvailable: false,
          biometricTypes: [],
          hasHardware: false,
          isEnrolled: false,
          error: 'Device does not support biometric authentication',
        };
      }

      // Check if biometric records are enrolled
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!isEnrolled) {
        return {
          isAvailable: false,
          biometricTypes: [],
          hasHardware: true,
          isEnrolled: false,
          error: 'No biometric records are enrolled on this device',
        };
      }

      // Get supported authentication types
      const supportedTypes =
        await LocalAuthentication.supportedAuthenticationTypesAsync();
      const biometricTypes = this.mapAuthenticationTypes(supportedTypes);

      return {
        isAvailable: true,
        biometricTypes,
        hasHardware: true,
        isEnrolled: true,
      };
    } catch (error) {
      console.error('[BiometricService] Error checking availability:', error);
      return {
        isAvailable: false,
        biometricTypes: [],
        hasHardware: false,
        isEnrolled: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Map Expo authentication types to our enum
  private mapAuthenticationTypes(
    types: LocalAuthentication.AuthenticationType[]
  ): BiometricType[] {
    const biometricTypes: BiometricType[] = [];

    types.forEach(type => {
      switch (type) {
        case LocalAuthentication.AuthenticationType.FINGERPRINT:
          if (Platform.OS === 'ios') {
            biometricTypes.push(BiometricType.TOUCH_ID);
          } else {
            biometricTypes.push(BiometricType.FINGERPRINT);
          }
          break;
        case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
          if (Platform.OS === 'ios') {
            biometricTypes.push(BiometricType.FACE_ID);
          } else {
            biometricTypes.push(BiometricType.FACE_UNLOCK);
          }
          break;
        case LocalAuthentication.AuthenticationType.IRIS:
          biometricTypes.push(BiometricType.IRIS);
          break;
      }
    });

    return biometricTypes;
  }

  // Check SecureStore availability
  private async checkSecureStoreAvailability(): Promise<boolean> {
    try {
      // Test SecureStore by trying to set and get a test value
      const testKey = 'secure_store_test';
      const testValue = 'test';

      await SecureStore.setItemAsync(testKey, testValue);
      const retrievedValue = await SecureStore.getItemAsync(testKey);
      await SecureStore.deleteItemAsync(testKey);

      return retrievedValue === testValue;
    } catch (error) {
      console.warn('[BiometricService] SecureStore not available:', error);
      return false;
    }
  }

  // Enable biometric authentication
  async enableBiometricAuth(userCredentials?: {
    email: string;
    token: string;
  }): Promise<BiometricAuthResult> {
    try {
      const availability = await this.checkBiometricAvailability();

      if (!availability.isAvailable) {
        return {
          success: false,
          error: availability.error || 'Biometric authentication not available',
        };
      }

      // Check SecureStore availability
      const secureStoreAvailable = await this.checkSecureStoreAvailability();
      if (!secureStoreAvailable) {
        return {
          success: false,
          error:
            'Secure storage is not available on this device. Biometric authentication requires secure storage.',
        };
      }

      // Store biometric settings
      await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, 'true');
      await AsyncStorage.setItem(
        STORAGE_KEYS.BIOMETRIC_TYPE,
        availability.biometricTypes[0]
      );

      // Securely store user credentials if provided
      if (userCredentials) {
        await SecureStore.setItemAsync(
          STORAGE_KEYS.USER_CREDENTIALS,
          JSON.stringify(userCredentials)
        );
      }

      return {
        success: true,
        biometricType: availability.biometricTypes[0],
      };
    } catch (error) {
      console.error('[BiometricService] Error enabling biometric auth:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to enable biometric authentication',
      };
    }
  }

  // Disable biometric authentication
  async disableBiometricAuth(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
      await AsyncStorage.removeItem(STORAGE_KEYS.BIOMETRIC_TYPE);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_CREDENTIALS);
      await AsyncStorage.removeItem(STORAGE_KEYS.FAILED_ATTEMPTS);
      await AsyncStorage.removeItem(STORAGE_KEYS.LAST_FAILED_ATTEMPT);
    } catch (error) {
      console.error(
        '[BiometricService] Error disabling biometric auth:',
        error
      );
    }
  }

  // Check if biometric authentication is enabled
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(
        STORAGE_KEYS.BIOMETRIC_ENABLED
      );
      return enabled === 'true';
    } catch (error) {
      console.error(
        '[BiometricService] Error checking if biometric is enabled:',
        error
      );
      return false;
    }
  }

  // Check if device is locked out due to failed attempts
  async isLockedOut(): Promise<boolean> {
    try {
      // Check both AsyncStorage and SecureStore for lockout state
      const [failedAttempts, lastFailedAttempt, secureLockoutState] =
        await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.FAILED_ATTEMPTS),
          AsyncStorage.getItem(STORAGE_KEYS.LAST_FAILED_ATTEMPT),
          SecureStore.getItemAsync('biometric_lockout_state'),
        ]);

      // Parse secure lockout state if available
      let secureState = null;
      if (secureLockoutState) {
        try {
          secureState = JSON.parse(secureLockoutState);
        } catch (error) {
          console.warn(
            '[BiometricService] Failed to parse secure lockout state:',
            error
          );
        }
      }

      // Use secure state if available, otherwise fall back to AsyncStorage
      const attempts =
        secureState?.attempts ||
        (failedAttempts ? parseInt(failedAttempts, 10) : 0);
      const lastAttemptTime =
        secureState?.lastAttemptTime ||
        (lastFailedAttempt ? parseInt(lastFailedAttempt, 10) : 0);

      if (attempts >= MAX_FAILED_ATTEMPTS && lastAttemptTime > 0) {
        const timeSinceLastAttempt = Date.now() - lastAttemptTime;
        return timeSinceLastAttempt < LOCKOUT_DURATION;
      }

      return false;
    } catch (error) {
      console.error('[BiometricService] Error checking lockout status:', error);
      return false;
    }
  }

  // Get remaining lockout time in minutes
  async getRemainingLockoutTime(): Promise<number> {
    try {
      const lastFailedAttempt = await AsyncStorage.getItem(
        STORAGE_KEYS.LAST_FAILED_ATTEMPT
      );

      if (!lastFailedAttempt) {
        return 0;
      }

      const lastAttemptTime = parseInt(lastFailedAttempt, 10);
      const timeSinceLastAttempt = Date.now() - lastAttemptTime;
      const remainingTime = LOCKOUT_DURATION - timeSinceLastAttempt;

      return Math.max(0, Math.ceil(remainingTime / (60 * 1000))); // Convert to minutes
    } catch (error) {
      console.error(
        '[BiometricService] Error getting remaining lockout time:',
        error
      );
      return 0;
    }
  }

  // Authenticate with biometrics
  async authenticateWithBiometrics(
    promptMessage?: string
  ): Promise<BiometricAuthResult> {
    try {
      // Check if biometric auth is enabled
      const isEnabled = await this.isBiometricEnabled();
      if (!isEnabled) {
        return {
          success: false,
          error: 'Biometric authentication is not enabled',
        };
      }

      // Check if device is locked out
      const isLockedOut = await this.isLockedOut();
      if (isLockedOut) {
        const remainingTime = await this.getRemainingLockoutTime();
        return {
          success: false,
          error: `Too many failed attempts. Try again in ${remainingTime} minutes.`,
        };
      }

      // Get biometric type for prompt
      const biometricType = await AsyncStorage.getItem(
        STORAGE_KEYS.BIOMETRIC_TYPE
      );
      const defaultPrompt = this.getDefaultPromptMessage(
        biometricType as BiometricType
      );

      // Perform biometric authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptMessage || defaultPrompt,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Password',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Reset failed attempts on successful authentication
        await this.resetFailedAttempts();

        return {
          success: true,
          biometricType: biometricType as BiometricType,
        };
      } else {
        // Handle authentication failure
        await this.recordFailedAttempt();

        return {
          success: false,
          error: result.error || 'Biometric authentication failed',
          fallbackToCredentials: result.error === 'UserFallback',
        };
      }
    } catch (error) {
      console.error('[BiometricService] Authentication error:', error);
      await this.recordFailedAttempt();

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  }

  // Get stored user credentials
  async getStoredCredentials(): Promise<{
    email: string;
    token: string;
  } | null> {
    try {
      const credentials = await SecureStore.getItemAsync(
        STORAGE_KEYS.USER_CREDENTIALS
      );
      return credentials ? JSON.parse(credentials) : null;
    } catch (error) {
      console.error(
        '[BiometricService] Error getting stored credentials:',
        error
      );
      return null;
    }
  }

  // Record failed authentication attempt
  private async recordFailedAttempt(): Promise<void> {
    try {
      const currentAttempts = await AsyncStorage.getItem(
        STORAGE_KEYS.FAILED_ATTEMPTS
      );
      const attempts = currentAttempts ? parseInt(currentAttempts, 10) + 1 : 1;
      const lastAttemptTime = Date.now();

      // Store in both AsyncStorage and SecureStore for persistence
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.FAILED_ATTEMPTS, attempts.toString()),
        AsyncStorage.setItem(
          STORAGE_KEYS.LAST_FAILED_ATTEMPT,
          lastAttemptTime.toString()
        ),
        SecureStore.setItemAsync(
          'biometric_lockout_state',
          JSON.stringify({
            attempts,
            lastAttemptTime,
            lockedUntil:
              attempts >= MAX_FAILED_ATTEMPTS
                ? lastAttemptTime + LOCKOUT_DURATION
                : null,
          })
        ),
      ]);
    } catch (error) {
      console.error(
        '[BiometricService] Error recording failed attempt:',
        error
      );
    }
  }

  // Reset failed attempts counter
  private async resetFailedAttempts(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.FAILED_ATTEMPTS);
      await AsyncStorage.removeItem(STORAGE_KEYS.LAST_FAILED_ATTEMPT);
    } catch (error) {
      console.error(
        '[BiometricService] Error resetting failed attempts:',
        error
      );
    }
  }

  // Get default prompt message based on biometric type
  private getDefaultPromptMessage(biometricType: BiometricType): string {
    switch (biometricType) {
      case BiometricType.FACE_ID:
        return 'Use Face ID to authenticate';
      case BiometricType.TOUCH_ID:
        return 'Use Touch ID to authenticate';
      case BiometricType.FINGERPRINT:
        return 'Use your fingerprint to authenticate';
      case BiometricType.FACE_UNLOCK:
        return 'Use face unlock to authenticate';
      case BiometricType.IRIS:
        return 'Use iris scan to authenticate';
      default:
        return 'Use biometric authentication';
    }
  }

  // Get user-friendly biometric type name
  getBiometricTypeName(biometricType: BiometricType): string {
    switch (biometricType) {
      case BiometricType.FACE_ID:
        return 'Face ID';
      case BiometricType.TOUCH_ID:
        return 'Touch ID';
      case BiometricType.FINGERPRINT:
        return 'Fingerprint';
      case BiometricType.FACE_UNLOCK:
        return 'Face Unlock';
      case BiometricType.IRIS:
        return 'Iris Scan';
      default:
        return 'Biometric';
    }
  }
}

// Export singleton instance
export const biometricService = BiometricService.getInstance();
