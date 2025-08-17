import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logEvent } from '../telemetry';

// PIN validation result
export interface PinValidationResult {
  success: boolean;
  error?: string;
  attemptsRemaining?: number;
}

// PIN setup result
export interface PinSetupResult {
  success: boolean;
  error?: string;
}

// Secure storage keys
const STORAGE_KEYS = {
  PIN_HASH: 'pin_hash',
  PIN_ENABLED: 'pin_enabled',
  PIN_FAILED_ATTEMPTS: 'pin_failed_attempts',
  PIN_LAST_FAILED_ATTEMPT: 'pin_last_failed_attempt',
} as const;

// Configuration constants
const MAX_PIN_ATTEMPTS = 5;
const PIN_LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const MIN_PIN_LENGTH = 4;
const MAX_PIN_LENGTH = 6;

export class PinService {
  private static instance: PinService;

  public static getInstance(): PinService {
    if (!PinService.instance) {
      PinService.instance = new PinService();
    }
    return PinService.instance;
  }

  // Check if PIN is enabled
  async isPinEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(STORAGE_KEYS.PIN_ENABLED);
      return enabled === 'true';
    } catch {
      return false;
    }
  }

  // Check if PIN is set
  async isPinSet(): Promise<boolean> {
    try {
      const pinHash = await SecureStore.getItemAsync(STORAGE_KEYS.PIN_HASH);
      return pinHash !== null;
    } catch {
      return false;
    }
  }

  // Set up a new PIN
  async setupPin(pin: string): Promise<PinSetupResult> {
    try {
      // Validate PIN format
      const validation = this.validatePinFormat(pin);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Hash the PIN
      const pinHash = await this.hashPin(pin);

      // Store the hashed PIN securely
      await SecureStore.setItemAsync(STORAGE_KEYS.PIN_HASH, pinHash, {
        keychainService: 'drishti-keychain',
        requireAuthentication: false, // PIN should be accessible without biometric auth
      });

      // Enable PIN authentication
      await AsyncStorage.setItem(STORAGE_KEYS.PIN_ENABLED, 'true');

      // Reset any failed attempts
      await this.resetFailedAttempts();

      logEvent('pin_set');

      return {
        success: true,
      };
    } catch (error) {
      console.error('[PinService] Error setting up PIN:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set up PIN',
      };
    }
  }

  // Validate PIN
  async validatePin(pin: string): Promise<PinValidationResult> {
    try {
      // Check if PIN is enabled
      const isEnabled = await this.isPinEnabled();
      if (!isEnabled) {
        return {
          success: false,
          error: 'PIN authentication is not enabled',
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

      // Get stored PIN hash
      const storedHash = await SecureStore.getItemAsync(STORAGE_KEYS.PIN_HASH);
      if (!storedHash) {
        return {
          success: false,
          error: 'PIN not found. Please set up your PIN again.',
        };
      }

      // Validate PIN format
      const formatValidation = this.validatePinFormat(pin);
      if (!formatValidation.isValid) {
        await this.recordFailedAttempt();
        return {
          success: false,
          error: formatValidation.error,
          attemptsRemaining: await this.getRemainingAttempts(),
        };
      }

      // Hash the provided PIN and compare
      const pinHash = await this.hashPin(pin);
      const isValid = pinHash === storedHash;

      if (isValid) {
        // Reset failed attempts on successful validation
        await this.resetFailedAttempts();
        logEvent('pin_auth_success');

        return {
          success: true,
        };
      } else {
        // Record failed attempt
        await this.recordFailedAttempt();
        logEvent('pin_auth_failure');

        return {
          success: false,
          error: 'Incorrect PIN',
          attemptsRemaining: await this.getRemainingAttempts(),
        };
      }
    } catch (error) {
      console.error('[PinService] Error validating PIN:', error);
      await this.recordFailedAttempt();

      return {
        success: false,
        error: error instanceof Error ? error.message : 'PIN validation failed',
        attemptsRemaining: await this.getRemainingAttempts(),
      };
    }
  }

  // Change PIN
  async changePin(currentPin: string, newPin: string): Promise<PinSetupResult> {
    try {
      // Validate current PIN first
      const currentPinValidation = await this.validatePin(currentPin);
      if (!currentPinValidation.success) {
        return {
          success: false,
          error: 'Current PIN is incorrect',
        };
      }

      // Set up new PIN
      return await this.setupPin(newPin);
    } catch (error) {
      console.error('[PinService] Error changing PIN:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to change PIN',
      };
    }
  }

  // Disable PIN authentication
  async disablePin(): Promise<void> {
    try {
      // Remove PIN hash from secure storage
      await SecureStore.deleteItemAsync(STORAGE_KEYS.PIN_HASH);

      // Remove PIN settings from AsyncStorage
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.PIN_ENABLED,
        STORAGE_KEYS.PIN_FAILED_ATTEMPTS,
        STORAGE_KEYS.PIN_LAST_FAILED_ATTEMPT,
      ]);

      logEvent('pin_disabled');
    } catch (error) {
      console.error('[PinService] Error disabling PIN:', error);
    }
  }

  // Validate PIN format
  private validatePinFormat(pin: string): { isValid: boolean; error?: string } {
    if (!pin || typeof pin !== 'string') {
      return {
        isValid: false,
        error: 'PIN is required',
      };
    }

    if (pin.length < MIN_PIN_LENGTH || pin.length > MAX_PIN_LENGTH) {
      return {
        isValid: false,
        error: `PIN must be ${MIN_PIN_LENGTH}-${MAX_PIN_LENGTH} digits`,
      };
    }

    if (!/^\d+$/.test(pin)) {
      return {
        isValid: false,
        error: 'PIN must contain only numbers',
      };
    }

    // Check for weak PINs (all same digits, sequential)
    if (this.isWeakPin(pin)) {
      return {
        isValid: false,
        error: 'PIN is too weak. Please choose a different PIN.',
      };
    }

    return {
      isValid: true,
    };
  }

  // Check if PIN is weak (simple patterns)
  private isWeakPin(pin: string): boolean {
    // All same digits (e.g., 1111, 0000)
    if (new Set(pin).size === 1) {
      return true;
    }

    // Sequential ascending (e.g., 1234, 5678)
    let isAscending = true;
    for (let i = 1; i < pin.length; i++) {
      if (parseInt(pin[i], 10) !== parseInt(pin[i - 1], 10) + 1) {
        isAscending = false;
        break;
      }
    }
    if (isAscending) {
      return true;
    }

    // Sequential descending (e.g., 4321, 8765)
    let isDescending = true;
    for (let i = 1; i < pin.length; i++) {
      if (parseInt(pin[i], 10) !== parseInt(pin[i - 1], 10) - 1) {
        isDescending = false;
        break;
      }
    }
    if (isDescending) {
      return true;
    }

    return false;
  }

  // Simple hash function for PIN (in production, use proper crypto)
  private async hashPin(pin: string): Promise<string> {
    // Simple hash implementation - in production use proper crypto library
    let hash = 0;
    const salt = 'drishti-pin-salt-2024'; // In production, use random salt per user
    const input = pin + salt;

    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36);
  }

  // Check if device is locked out due to failed PIN attempts
  private async isLockedOut(): Promise<boolean> {
    try {
      const failedAttempts = await this.getFailedAttempts();
      const lastFailedAttempt = await AsyncStorage.getItem(
        STORAGE_KEYS.PIN_LAST_FAILED_ATTEMPT
      );

      if (failedAttempts >= MAX_PIN_ATTEMPTS && lastFailedAttempt) {
        const timeSinceLastAttempt =
          Date.now() - parseInt(lastFailedAttempt, 10);
        return timeSinceLastAttempt < PIN_LOCKOUT_DURATION;
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
        STORAGE_KEYS.PIN_LAST_FAILED_ATTEMPT
      );
      if (!lastFailedAttempt) {
        return 0;
      }

      const timeSinceLastAttempt = Date.now() - parseInt(lastFailedAttempt, 10);
      const remainingTime = PIN_LOCKOUT_DURATION - timeSinceLastAttempt;

      return Math.ceil(remainingTime / (60 * 1000)); // Convert to minutes
    } catch {
      return 0;
    }
  }

  // Record a failed PIN attempt
  private async recordFailedAttempt(): Promise<void> {
    try {
      const currentAttempts = await this.getFailedAttempts();
      await AsyncStorage.setItem(
        STORAGE_KEYS.PIN_FAILED_ATTEMPTS,
        (currentAttempts + 1).toString()
      );
      await AsyncStorage.setItem(
        STORAGE_KEYS.PIN_LAST_FAILED_ATTEMPT,
        Date.now().toString()
      );
    } catch (error) {
      console.error('[PinService] Error recording failed attempt:', error);
    }
  }

  // Get number of failed attempts
  private async getFailedAttempts(): Promise<number> {
    try {
      const attempts = await AsyncStorage.getItem(
        STORAGE_KEYS.PIN_FAILED_ATTEMPTS
      );
      return attempts ? parseInt(attempts, 10) : 0;
    } catch {
      return 0;
    }
  }

  // Get remaining attempts before lockout
  private async getRemainingAttempts(): Promise<number> {
    const failedAttempts = await this.getFailedAttempts();
    return Math.max(0, MAX_PIN_ATTEMPTS - failedAttempts);
  }

  // Reset failed attempts counter
  private async resetFailedAttempts(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.PIN_FAILED_ATTEMPTS,
        STORAGE_KEYS.PIN_LAST_FAILED_ATTEMPT,
      ]);
    } catch (error) {
      console.error('[PinService] Error resetting failed attempts:', error);
    }
  }
}

export const pinService = PinService.getInstance();
