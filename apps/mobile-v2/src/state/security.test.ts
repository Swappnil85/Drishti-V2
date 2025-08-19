import { renderHook, act } from '@testing-library/react-native';
import { SecurityProvider, useSecurityState } from './security';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
}));

jest.mock('../telemetry', () => ({
  logEvent: jest.fn(),
}));

describe('security state', () => {
  beforeEach(() => {
    // Reset AsyncStorage mock before each test
    (AsyncStorage.setItem as jest.Mock).mockClear();
    (AsyncStorage.getItem as jest.Mock).mockClear();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null); // Default to no stored settings

    // Clear all mocks for logEvent
    require('../telemetry').logEvent.mockClear();
  });

  it('should set and clear PIN', async () => {
    const { result } = renderHook(() => useSecurityState(), {
      wrapper: SecurityProvider,
    });

    await act(async () => {
      await result.current.setPin('1234');
    });
    expect(result.current.settings.pin).toBe('1234');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      expect.any(String),
      JSON.stringify({ ...result.current.settings, pin: '1234' })
    );
    expect(require('../telemetry').logEvent).toHaveBeenCalledWith(
      'security_pin_set'
    );

    await act(async () => {
      await result.current.setPin(null);
    });
    expect(result.current.settings.pin).toBe(null);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      expect.any(String),
      JSON.stringify({ ...result.current.settings, pin: null })
    );
    expect(require('../telemetry').logEvent).toHaveBeenCalledWith(
      'security_pin_cleared'
    );
  });

  it('should toggle biometric setting', async () => {
    const { result } = renderHook(() => useSecurityState(), {
      wrapper: SecurityProvider,
    });

    await act(async () => {
      await result.current.setBiometricEnabled(true);
    });
    expect(result.current.settings.biometricEnabled).toBe(true);
    expect(require('../telemetry').logEvent).toHaveBeenCalledWith(
      'security_bio_enabled'
    );

    await act(async () => {
      await result.current.setBiometricEnabled(false);
    });
    expect(result.current.settings.biometricEnabled).toBe(false);
    expect(require('../telemetry').logEvent).toHaveBeenCalledWith(
      'security_bio_disabled'
    );
  });

  it('should lock the app if app lock is enabled', async () => {
    const { result } = renderHook(() => useSecurityState(), {
      wrapper: SecurityProvider,
    });
    await act(async () => {
      await result.current.setAppLockEnabled(true);
    });
    act(() => {
      result.current.lock();
    });
    expect(result.current.isLocked).toBe(true);
    expect(require('../telemetry').logEvent).toHaveBeenCalledWith(
      'security_locked'
    );
  });

  it('should not lock the app if app lock is disabled', () => {
    const { result } = renderHook(() => useSecurityState(), {
      wrapper: SecurityProvider,
    });
    act(() => {
      result.current.setAppLockEnabled(false);
      result.current.lock();
    });
    expect(result.current.isLocked).toBe(false);
  });

  it('should unlock the app and reset failed attempts', () => {
    const { result } = renderHook(() => useSecurityState(), {
      wrapper: SecurityProvider,
    });
    act(() => {
      result.current.recordFailedPinAttempt();
      result.current.unlock();
    });
    expect(result.current.isLocked).toBe(false);
    expect(result.current.failedPinAttempts).toBe(0);
    expect(result.current.lockoutUntil).toBe(null);
    expect(require('../telemetry').logEvent).toHaveBeenCalledWith(
      'security_unlocked',
      { method: 'pin' }
    );
  });

  it('should record failed PIN attempts', () => {
    const { result } = renderHook(() => useSecurityState(), {
      wrapper: SecurityProvider,
    });
    act(() => {
      result.current.recordFailedPinAttempt();
    });
    expect(result.current.failedPinAttempts).toBe(1);
  });

  it('should lock out after 5 failed attempts', () => {
    const { result } = renderHook(() => useSecurityState(), {
      wrapper: SecurityProvider,
    });
    act(() => {
      // Record 5 failed attempts one by one
      result.current.recordFailedPinAttempt();
      result.current.recordFailedPinAttempt();
      result.current.recordFailedPinAttempt();
      result.current.recordFailedPinAttempt();
      result.current.recordFailedPinAttempt();
    });
    expect(result.current.failedPinAttempts).toBe(5);
    expect(result.current.lockoutUntil).toBeGreaterThan(Date.now());
  });

  it('should clear PIN', async () => {
    const { result } = renderHook(() => useSecurityState(), {
      wrapper: SecurityProvider,
    });

    // First set a PIN
    await act(async () => {
      await result.current.setPin('1234');
    });
    expect(result.current.settings.pin).toBe('1234');

    // Then clear it
    await act(async () => {
      await result.current.clearPin();
    });
    expect(result.current.settings.pin).toBe(null);
    expect(require('../telemetry').logEvent).toHaveBeenCalledWith(
      'security_pin_cleared'
    );
  });

  it('should unlock with dynamic method logging', () => {
    const { result } = renderHook(() => useSecurityState(), {
      wrapper: SecurityProvider,
    });

    // Test PIN unlock
    act(() => {
      result.current.unlock('pin');
    });
    expect(require('../telemetry').logEvent).toHaveBeenCalledWith(
      'security_unlocked',
      { method: 'pin' }
    );

    // Test biometric unlock
    act(() => {
      result.current.unlock('biometric');
    });
    expect(require('../telemetry').logEvent).toHaveBeenCalledWith(
      'security_unlocked',
      { method: 'biometric' }
    );
  });

  it('should set auto-lock timeout and log event', async () => {
    const { result } = renderHook(() => useSecurityState(), {
      wrapper: SecurityProvider,
    });

    await act(async () => {
      await result.current.setAutoLockTimeout(10);
    });
    expect(result.current.settings.autoLockTimeout).toBe(10);
    expect(require('../telemetry').logEvent).toHaveBeenCalledWith(
      'security_autolock_changed',
      { minutes: 10 }
    );
  });
});
