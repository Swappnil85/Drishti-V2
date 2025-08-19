import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useSecurityState } from '../state/security';

export const useAppLock = () => {
  const { settings, lock, isLocked } = useSecurityState();
  const appState = useRef(AppState.currentState);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  const resetTimeout = useCallback(() => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
      timeoutId.current = null;
    }
    if (settings.appLockEnabled && !isLocked) {
      timeoutId.current = setTimeout(
        () => {
          lock();
        },
        settings.autoLockTimeout * 60 * 1000
      );
    }
  }, [settings.appLockEnabled, isLocked, lock, settings.autoLockTimeout]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          // App has come to the foreground
          resetTimeout();
        }
        // App has gone to the background
        else if (timeoutId.current) {
          clearTimeout(timeoutId.current);
        }
        appState.current = nextAppState;
      }
    );

    resetTimeout();

    return () => {
      subscription.remove();
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
    };
  }, [resetTimeout, settings.appLockEnabled]);

  return { isLocked, lock };
};
