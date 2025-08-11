import { useState, useEffect, useCallback } from 'react';
import {
  biometricService,
  BiometricType,
  BiometricAuthResult,
} from '../services/auth/BiometricService';

// Hook state interface
interface BiometricState {
  isAvailable: boolean;
  isEnabled: boolean;
  biometricTypes: BiometricType[];
  isLoading: boolean;
  error: string | null;
  isLockedOut: boolean;
  remainingLockoutTime: number;
}

// Hook return interface
interface UseBiometricReturn extends BiometricState {
  checkAvailability: () => Promise<void>;
  enableBiometric: (credentials?: {
    email: string;
    token: string;
  }) => Promise<BiometricAuthResult>;
  disableBiometric: () => Promise<void>;
  authenticate: (promptMessage?: string) => Promise<BiometricAuthResult>;
  getStoredCredentials: () => Promise<{ email: string; token: string } | null>;
  refreshLockoutStatus: () => Promise<void>;
  getBiometricTypeName: (type: BiometricType) => string;
}

export const useBiometric = (): UseBiometricReturn => {
  const [state, setState] = useState<BiometricState>({
    isAvailable: false,
    isEnabled: false,
    biometricTypes: [],
    isLoading: true,
    error: null,
    isLockedOut: false,
    remainingLockoutTime: 0,
  });

  // Check biometric availability
  const checkAvailability = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const [availability, isEnabled, isLockedOut, remainingTime] =
        await Promise.all([
          biometricService.checkBiometricAvailability(),
          biometricService.isBiometricEnabled(),
          biometricService.isLockedOut(),
          biometricService.getRemainingLockoutTime(),
        ]);

      setState(prev => ({
        ...prev,
        isAvailable: availability.isAvailable,
        biometricTypes: availability.biometricTypes,
        isEnabled,
        isLockedOut,
        remainingLockoutTime: remainingTime,
        error: availability.error || null,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to check biometric availability',
        isLoading: false,
      }));
    }
  }, []);

  // Enable biometric authentication
  const enableBiometric = useCallback(
    async (credentials?: {
      email: string;
      token: string;
    }): Promise<BiometricAuthResult> => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const result = await biometricService.enableBiometricAuth(credentials);

        if (result.success) {
          setState(prev => ({
            ...prev,
            isEnabled: true,
            error: null,
            isLoading: false,
          }));
        } else {
          setState(prev => ({
            ...prev,
            error: result.error || 'Failed to enable biometric authentication',
            isLoading: false,
          }));
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to enable biometric authentication';
        setState(prev => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    []
  );

  // Disable biometric authentication
  const disableBiometric = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      await biometricService.disableBiometricAuth();

      setState(prev => ({
        ...prev,
        isEnabled: false,
        error: null,
        isLoading: false,
        isLockedOut: false,
        remainingLockoutTime: 0,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to disable biometric authentication',
        isLoading: false,
      }));
    }
  }, []);

  // Authenticate with biometrics
  const authenticate = useCallback(
    async (promptMessage?: string): Promise<BiometricAuthResult> => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const result =
          await biometricService.authenticateWithBiometrics(promptMessage);

        if (!result.success) {
          // Refresh lockout status after failed authentication
          const [isLockedOut, remainingTime] = await Promise.all([
            biometricService.isLockedOut(),
            biometricService.getRemainingLockoutTime(),
          ]);

          setState(prev => ({
            ...prev,
            error: result.error || 'Authentication failed',
            isLockedOut,
            remainingLockoutTime: remainingTime,
            isLoading: false,
          }));
        } else {
          setState(prev => ({
            ...prev,
            error: null,
            isLockedOut: false,
            remainingLockoutTime: 0,
            isLoading: false,
          }));
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Authentication failed';
        setState(prev => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    []
  );

  // Get stored credentials
  const getStoredCredentials = useCallback(async () => {
    try {
      return await biometricService.getStoredCredentials();
    } catch (error) {
      console.error('[useBiometric] Error getting stored credentials:', error);
      return null;
    }
  }, []);

  // Refresh lockout status
  const refreshLockoutStatus = useCallback(async () => {
    try {
      const [isLockedOut, remainingTime] = await Promise.all([
        biometricService.isLockedOut(),
        biometricService.getRemainingLockoutTime(),
      ]);

      setState(prev => ({
        ...prev,
        isLockedOut,
        remainingLockoutTime: remainingTime,
      }));
    } catch (error) {
      console.error('[useBiometric] Error refreshing lockout status:', error);
    }
  }, []);

  // Get biometric type name
  const getBiometricTypeName = useCallback((type: BiometricType): string => {
    return biometricService.getBiometricTypeName(type);
  }, []);

  // Initialize on mount
  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  // Set up lockout timer
  useEffect(() => {
    if (state.isLockedOut && state.remainingLockoutTime > 0) {
      const timer = setInterval(() => {
        setState(prev => {
          const newRemainingTime = prev.remainingLockoutTime - 1;

          if (newRemainingTime <= 0) {
            return {
              ...prev,
              isLockedOut: false,
              remainingLockoutTime: 0,
            };
          }

          return {
            ...prev,
            remainingLockoutTime: newRemainingTime,
          };
        });
      }, 60000); // Update every minute

      return () => clearInterval(timer);
    }

    return undefined;
  }, [state.isLockedOut, state.remainingLockoutTime]);

  return {
    ...state,
    checkAvailability,
    enableBiometric,
    disableBiometric,
    authenticate,
    getStoredCredentials,
    refreshLockoutStatus,
    getBiometricTypeName,
  };
};
