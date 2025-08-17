import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { logEvent } from '../telemetry';

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
  FAILED_ATTEMPTS: 'biometric_failed_attempts',
  LAST_FAILED_ATTEMPT: 'last_failed_attempt',
} as const;

// Configuration constants
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

export class BiometricService {
  private static instance: BiometricService;

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

  // Map LocalAuthentication types to our BiometricType enum
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

    return biometricTypes.length > 0 ? biometricTypes : [BiometricType.NONE];
  }

  // Check if biometric authentication is enabled
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(
        STORAGE_KEYS.BIOMETRIC_ENABLED
      );
      return enabled === 'true';
    } catch {
      return false;
    }
  }

  // Enable biometric authentication
  async enableBiometric(): Promise<BiometricAuthResult> {
    try {
      const availability = await this.checkBiometricAvailability();

      if (!availability.isAvailable) {
        return {
          success: false,
          error: availability.error || 'Biometric authentication not available',
        };
      }

      // Test biometric authentication
      const authResult = await this.authenticateWithBiometrics(
        'Enable biometric authentication'
      );

      if (!authResult.success) {
        return authResult;
      }

      // Store biometric settings
      await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, 'true');
      await AsyncStorage.setItem(
        STORAGE_KEYS.BIOMETRIC_TYPE,
        availability.biometricTypes[0]
      );

      logEvent('biometric_enabled', {
        biometricType: availability.biometricTypes[0],
      });

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
  async disableBiometric(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.BIOMETRIC_ENABLED,
        STORAGE_KEYS.BIOMETRIC_TYPE,
        STORAGE_KEYS.FAILED_ATTEMPTS,
        STORAGE_KEYS.LAST_FAILED_ATTEMPT,
      ]);
      logEvent('biometric_disabled');
    } catch (error) {
      console.error(
        '[BiometricService] Error disabling biometric auth:',
        error
      );
    }
  }

  // Authenticate with biometrics
  async authenticateWithBiometrics(
    promptMessage?: string
  ): Promise<BiometricAuthResult> {
    try {
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
        fallbackLabel: 'Use PIN',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Reset failed attempts on successful authentication
        await this.resetFailedAttempts();
        logEvent('biometric_auth_success', { biometricType });

        return {
          success: true,
          biometricType: biometricType as BiometricType,
        };
      } else {
        // Handle authentication failure
        await this.recordFailedAttempt();
        logEvent('biometric_auth_failure', { error: result.error });

        return {
          success: false,
          error: result.error || 'Biometric authentication failed',
          fallbackToCredentials:
            String(result.error).includes('Fallback') ||
            String(result.error).includes('fallback'),
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

  // Get default prompt message based on biometric type
  private getDefaultPromptMessage(biometricType: BiometricType): string {
    switch (biometricType) {
      case BiometricType.TOUCH_ID:
        return 'Use Touch ID to unlock Drishti';
      case BiometricType.FACE_ID:
        return 'Use Face ID to unlock Drishti';
      case BiometricType.FINGERPRINT:
        return 'Use fingerprint to unlock Drishti';
      case BiometricType.FACE_UNLOCK:
        return 'Use face unlock to unlock Drishti';
      case BiometricType.IRIS:
        return 'Use iris scan to unlock Drishti';
      default:
        return 'Use biometric authentication to unlock Drishti';
    }
  }

  // Check if device is locked out due to failed attempts
  private async isLockedOut(): Promise<boolean> {
    try {
      const failedAttempts = await this.getFailedAttempts();
      const lastFailedAttempt = await AsyncStorage.getItem(
        STORAGE_KEYS.LAST_FAILED_ATTEMPT
      );

      if (failedAttempts >= MAX_FAILED_ATTEMPTS && lastFailedAttempt) {
        const timeSinceLastAttempt =
          Date.now() - parseInt(lastFailedAttempt, 10);
        return timeSinceLastAttempt < LOCKOUT_DURATION;
      }

      return false;
    } catch {
      return false;
    }
  }

  // Get remaining lockout time in minutes
  private async getRemainingLockoutTime(): Promise<number> {
    try {
      const lastFailedAttempt = await AsyncStorage.getItem(
        STORAGE_KEYS.LAST_FAILED_ATTEMPT
      );
      if (!lastFailedAttempt) {
        return 0;
      }

      const timeSinceLastAttempt = Date.now() - parseInt(lastFailedAttempt, 10);
      const remainingTime = LOCKOUT_DURATION - timeSinceLastAttempt;

      return Math.ceil(remainingTime / (60 * 1000)); // Convert to minutes
    } catch {
      return 0;
    }
  }

  // Record a failed authentication attempt
  private async recordFailedAttempt(): Promise<void> {
    try {
      const currentAttempts = await this.getFailedAttempts();
      await AsyncStorage.setItem(
        STORAGE_KEYS.FAILED_ATTEMPTS,
        (currentAttempts + 1).toString()
      );
      await AsyncStorage.setItem(
        STORAGE_KEYS.LAST_FAILED_ATTEMPT,
        Date.now().toString()
      );
    } catch (error) {
      console.error(
        '[BiometricService] Error recording failed attempt:',
        error
      );
    }
  }

  // Get number of failed attempts
  private async getFailedAttempts(): Promise<number> {
    try {
      const attempts = await AsyncStorage.getItem(STORAGE_KEYS.FAILED_ATTEMPTS);
      return attempts ? parseInt(attempts, 10) : 0;
    } catch {
      return 0;
    }
  }

  // Reset failed attempts counter
  private async resetFailedAttempts(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.FAILED_ATTEMPTS,
        STORAGE_KEYS.LAST_FAILED_ATTEMPT,
      ]);
    } catch (error) {
      console.error(
        '[BiometricService] Error resetting failed attempts:',
        error
      );
    }
  }
}

export const biometricService = BiometricService.getInstance();
