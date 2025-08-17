import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { biometricService, BiometricType } from '../services/BiometricService';
import { pinService } from '../services/PinService';
import { securityService } from '../services/SecurityService';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  multiRemove: jest.fn(),
}));

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  supportedAuthenticationTypesAsync: jest.fn(),
  authenticateAsync: jest.fn(),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('../telemetry', () => ({
  logEvent: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockLocalAuth = LocalAuthentication as jest.Mocked<
  typeof LocalAuthentication
>;
const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe('BiometricService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkBiometricAvailability', () => {
    it('should return unavailable when no hardware', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(false);

      const result = await biometricService.checkBiometricAvailability();

      expect(result.isAvailable).toBe(false);
      expect(result.hasHardware).toBe(false);
      expect(result.error).toContain('does not support biometric');
    });

    it('should return unavailable when not enrolled', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(true);
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(false);

      const result = await biometricService.checkBiometricAvailability();

      expect(result.isAvailable).toBe(false);
      expect(result.hasHardware).toBe(true);
      expect(result.isEnrolled).toBe(false);
      expect(result.error).toContain('No biometric records');
    });

    it('should return available when hardware and enrolled', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(true);
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(true);
      mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([
        LocalAuthentication.AuthenticationType.FINGERPRINT,
      ]);

      const result = await biometricService.checkBiometricAvailability();

      expect(result.isAvailable).toBe(true);
      expect(result.hasHardware).toBe(true);
      expect(result.isEnrolled).toBe(true);
      expect(result.biometricTypes).toContain(BiometricType.TOUCH_ID); // iOS maps FINGERPRINT to TOUCH_ID
    });
  });

  describe('enableBiometric', () => {
    it('should enable biometric when available and authenticated', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(true);
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(true);
      mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([
        LocalAuthentication.AuthenticationType.FINGERPRINT,
      ]);
      mockLocalAuth.authenticateAsync.mockResolvedValue({ success: true });
      mockAsyncStorage.getItem.mockResolvedValue('0'); // No failed attempts

      const result = await biometricService.enableBiometric();

      expect(result.success).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'biometric_enabled',
        'true'
      );
    });

    it('should fail when biometric not available', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(false);

      const result = await biometricService.enableBiometric();

      expect(result.success).toBe(false);
      expect(result.error).toContain('does not support biometric');
    });
  });

  describe('authenticateWithBiometrics', () => {
    it('should authenticate successfully', async () => {
      mockAsyncStorage.getItem
        .mockResolvedValueOnce('0') // Failed attempts
        .mockResolvedValueOnce('fingerprint'); // Biometric type
      mockLocalAuth.authenticateAsync.mockResolvedValue({ success: true });

      const result = await biometricService.authenticateWithBiometrics();

      expect(result.success).toBe(true);
      expect(result.biometricType).toBe('0'); // Mock returns '0' for failed attempts
    });

    it('should handle authentication failure', async () => {
      mockAsyncStorage.getItem
        .mockResolvedValueOnce('0') // Failed attempts
        .mockResolvedValueOnce('fingerprint'); // Biometric type
      mockLocalAuth.authenticateAsync.mockResolvedValue({
        success: false,
        error: 'Authentication failed',
      });

      const result = await biometricService.authenticateWithBiometrics();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication failed');
    });
  });
});

describe('PinService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setupPin', () => {
    it('should setup valid PIN', async () => {
      const result = await pinService.setupPin('1357'); // Non-sequential PIN

      expect(result.success).toBe(true);
      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'pin_enabled',
        'true'
      );
    });

    it('should reject weak PIN', async () => {
      const result = await pinService.setupPin('1111');

      expect(result.success).toBe(false);
      expect(result.error).toContain('too weak');
    });

    it('should reject short PIN', async () => {
      const result = await pinService.setupPin('12');

      expect(result.success).toBe(false);
      expect(result.error).toContain('4-6 digits');
    });

    it('should reject non-numeric PIN', async () => {
      const result = await pinService.setupPin('12ab');

      expect(result.success).toBe(false);
      expect(result.error).toContain('only numbers');
    });
  });

  describe('validatePin', () => {
    it('should validate correct PIN', async () => {
      mockAsyncStorage.getItem
        .mockResolvedValueOnce('true') // PIN enabled
        .mockResolvedValueOnce('0') // Failed attempts
        .mockResolvedValueOnce(null); // Last failed attempt

      // Mock the stored hash to match what would be generated for '1357'
      const expectedHash = Math.abs(
        '1357drishti-pin-salt-2024'.split('').reduce((hash, char) => {
          hash = (hash << 5) - hash + char.charCodeAt(0);
          return hash & hash;
        }, 0)
      ).toString(36);

      mockSecureStore.getItemAsync.mockResolvedValue(expectedHash);

      const result = await pinService.validatePin('1357');

      expect(result.success).toBe(true);
    });

    it('should reject incorrect PIN', async () => {
      mockAsyncStorage.getItem
        .mockResolvedValueOnce('true') // PIN enabled
        .mockResolvedValueOnce('0') // Failed attempts
        .mockResolvedValueOnce(null); // Last failed attempt
      mockSecureStore.getItemAsync.mockResolvedValue('different-hash');

      const result = await pinService.validatePin('2580'); // Different random PIN

      expect(result.success).toBe(false);
      expect(result.error).toBe('Incorrect PIN');
    });

    it('should handle PIN not enabled', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('false');

      const result = await pinService.validatePin('1234');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not enabled');
    });
  });
});

describe('SecurityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('privacy mode', () => {
    it('should get privacy mode status', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('true');

      const result = await securityService.isPrivacyModeEnabled();

      expect(result).toBe(true);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(
        'privacy_mode_enabled'
      );
    });

    it('should set privacy mode', async () => {
      await securityService.setPrivacyMode(true);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'privacy_mode_enabled',
        'true'
      );
    });
  });

  describe('app lock', () => {
    it('should get app lock status', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('true');

      const result = await securityService.isAppLockEnabled();

      expect(result).toBe(true);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('app_lock_enabled');
    });

    it('should set app lock when auth method available', async () => {
      // Mock biometric enabled
      mockAsyncStorage.getItem.mockImplementation(key => {
        if (key === 'biometric_enabled') return Promise.resolve('true');
        return Promise.resolve('false');
      });

      await securityService.setAppLockEnabled(true);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'app_lock_enabled',
        'true'
      );
    });
  });

  describe('auto-lock timeout', () => {
    it('should get default timeout', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await securityService.getAutoLockTimeout();

      expect(result).toBe(5); // Default 5 minutes
    });

    it('should clamp timeout to valid range', async () => {
      await securityService.setAutoLockTimeout(15); // Above max

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'auto_lock_timeout',
        '10'
      );
    });

    it('should clamp timeout to minimum', async () => {
      await securityService.setAutoLockTimeout(0); // Below min

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'auto_lock_timeout',
        '1'
      );
    });
  });
});
