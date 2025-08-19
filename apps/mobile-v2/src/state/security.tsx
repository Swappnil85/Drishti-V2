import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { logEvent } from '../telemetry';

const STORAGE_KEY = 'drishti.security.settings';

export type SecuritySettings = {
  pin: string | null;
  biometricEnabled: boolean; // Whether biometrics are enabled for unlock
  appLockEnabled: boolean; // Whether app lock is globally enabled
  autoLockTimeout: 1 | 3 | 5 | 10; // in minutes
};

type SecurityContextType = {
  settings: SecuritySettings;
  isLocked: boolean;
  failedPinAttempts: number;
  lockoutUntil: number | null;
  setPin: (pin: string | null) => Promise<void>;
  clearPin: () => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  setAppLockEnabled: (enabled: boolean) => Promise<void>;
  setAutoLockTimeout: (
    timeout: SecuritySettings['autoLockTimeout']
  ) => Promise<void>;
  lock: () => void;
  unlock: (method?: 'pin' | 'biometric') => void;
  recordFailedPinAttempt: () => void;
  resetFailedPinAttempts: () => void;
};

const SecurityContext = createContext<SecurityContextType | undefined>(
  undefined
);

export const SecurityProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<SecuritySettings>({
    pin: null,
    biometricEnabled: false,
    appLockEnabled: false,
    autoLockTimeout: 5,
  });
  const [isLocked, setIsLocked] = useState(false);
  const [failedPinAttempts, setFailedPinAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedSettings = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedSettings) {
          setSettings(JSON.parse(storedSettings));
        }
      } catch (e) {
        console.error('Failed to load security settings from AsyncStorage', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch(
        e =>
          console.error('Failed to save security settings to AsyncStorage', e)
      );
    }
  }, [settings, isLoaded]);

  const setPin = async (newPin: string | null) => {
    setSettings(prev => ({ ...prev, pin: newPin }));
    logEvent(newPin ? 'security_pin_set' : 'security_pin_cleared');
  };

  const clearPin = async () => {
    setSettings(prev => ({ ...prev, pin: null }));
    logEvent('security_pin_cleared');
  };

  const setBiometricEnabled = async (enabled: boolean) => {
    setSettings(prev => ({ ...prev, biometricEnabled: enabled }));
    logEvent(enabled ? 'security_bio_enabled' : 'security_bio_disabled');
  };

  const setAppLockEnabled = async (enabled: boolean) => {
    setSettings(prev => ({ ...prev, appLockEnabled: enabled }));
  };

  const setAutoLockTimeout = async (
    timeout: SecuritySettings['autoLockTimeout']
  ) => {
    setSettings(prev => ({ ...prev, autoLockTimeout: timeout }));
    logEvent('security_autolock_changed', { minutes: timeout });
  };

  const lock = () => {
    if (settings.appLockEnabled) {
      setIsLocked(true);
      logEvent('security_locked');
    }
  };

  const unlock = (method: 'pin' | 'biometric' = 'pin') => {
    setIsLocked(false);
    setFailedPinAttempts(0);
    setLockoutUntil(null);
    logEvent('security_unlocked', { method });
  };

  const recordFailedPinAttempt = () => {
    const attempts = failedPinAttempts + 1;
    setFailedPinAttempts(attempts);
    if (attempts >= 5) {
      setLockoutUntil(Date.now() + 30000); // 30 seconds lockout
    }
  };

  const resetFailedPinAttempts = () => {
    setFailedPinAttempts(0);
    setLockoutUntil(null);
  };

  const value = {
    settings,
    isLocked,
    failedPinAttempts,
    lockoutUntil,
    setPin,
    clearPin,
    setBiometricEnabled,
    setAppLockEnabled,
    setAutoLockTimeout,
    lock,
    unlock,
    recordFailedPinAttempt,
    resetFailedPinAttempts,
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurityState = () => {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurityState must be used within a SecurityProvider');
  }
  return context;
};
