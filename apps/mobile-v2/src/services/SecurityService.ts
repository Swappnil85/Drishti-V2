import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { biometricService } from './BiometricService';
import { pinService } from './PinService';
import { logEvent } from '../telemetry';

// App lock state
export enum AppLockState {
  UNLOCKED = 'unlocked',
  LOCKED = 'locked',
  AUTHENTICATING = 'authenticating',
}

// Authentication method
export enum AuthMethod {
  BIOMETRIC = 'biometric',
  PIN = 'pin',
  NONE = 'none',
}

// Security settings
export interface SecuritySettings {
  privacyModeEnabled: boolean;
  appLockEnabled: boolean;
  biometricEnabled: boolean;
  pinEnabled: boolean;
  autoLockTimeout: number; // in minutes
}

// Authentication result
export interface AuthResult {
  success: boolean;
  method?: AuthMethod;
  error?: string;
  fallbackAvailable?: boolean;
}

// Storage keys
const STORAGE_KEYS = {
  PRIVACY_MODE: 'privacy_mode_enabled',
  APP_LOCK_ENABLED: 'app_lock_enabled',
  AUTO_LOCK_TIMEOUT: 'auto_lock_timeout',
  LAST_ACTIVE_TIME: 'last_active_time',
  APP_LOCK_STATE: 'app_lock_state',
} as const;

// Default settings
const DEFAULT_AUTO_LOCK_TIMEOUT = 5; // 5 minutes
const MIN_AUTO_LOCK_TIMEOUT = 1; // 1 minute
const MAX_AUTO_LOCK_TIMEOUT = 10; // 10 minutes

export class SecurityService {
  private static instance: SecurityService;
  private appStateSubscription: any;
  private lockTimer: NodeJS.Timeout | null = null;
  private lockStateListeners: ((state: AppLockState) => void)[] = [];

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  constructor() {
    // Don't initialize AppState listener in test environment
    const isTestEnv =
      typeof jest !== 'undefined' || process.env.NODE_ENV === 'test';
    if (!isTestEnv) {
      this.initializeAppStateListener();
    }
  }

  // Initialize app state listener for auto-lock functionality
  private initializeAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange.bind(this)
    );
  }

  // Handle app state changes
  private async handleAppStateChange(
    nextAppState: AppStateStatus
  ): Promise<void> {
    const isAppLockEnabled = await this.isAppLockEnabled();

    if (!isAppLockEnabled) {
      return;
    }

    if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App is going to background, record the time
      await this.recordLastActiveTime();
      this.startLockTimer();
    } else if (nextAppState === 'active') {
      // App is coming to foreground, check if we need to lock
      this.clearLockTimer();
      const shouldLock = await this.shouldLockApp();

      if (shouldLock) {
        await this.lockApp();
      }
    }
  }

  // Start auto-lock timer
  private startLockTimer(): void {
    this.clearLockTimer();

    this.getAutoLockTimeout().then(timeout => {
      this.lockTimer = setTimeout(
        async () => {
          await this.lockApp();
        },
        timeout * 60 * 1000
      ); // Convert minutes to milliseconds
    });
  }

  // Clear auto-lock timer
  private clearLockTimer(): void {
    if (this.lockTimer) {
      clearTimeout(this.lockTimer);
      this.lockTimer = null;
    }
  }

  // Check if app should be locked based on inactivity
  private async shouldLockApp(): Promise<boolean> {
    try {
      const lastActiveTime = await AsyncStorage.getItem(
        STORAGE_KEYS.LAST_ACTIVE_TIME
      );
      if (!lastActiveTime) {
        return false;
      }

      const timeout = await this.getAutoLockTimeout();
      const timeSinceLastActive = Date.now() - parseInt(lastActiveTime, 10);
      const timeoutMs = timeout * 60 * 1000; // Convert to milliseconds

      return timeSinceLastActive >= timeoutMs;
    } catch {
      return false;
    }
  }

  // Record last active time
  private async recordLastActiveTime(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.LAST_ACTIVE_TIME,
        Date.now().toString()
      );
    } catch (error) {
      console.error(
        '[SecurityService] Error recording last active time:',
        error
      );
    }
  }

  // Get current security settings
  async getSecuritySettings(): Promise<SecuritySettings> {
    try {
      const [
        privacyModeEnabled,
        appLockEnabled,
        biometricEnabled,
        pinEnabled,
        autoLockTimeout,
      ] = await Promise.all([
        this.isPrivacyModeEnabled(),
        this.isAppLockEnabled(),
        biometricService.isBiometricEnabled(),
        pinService.isPinEnabled(),
        this.getAutoLockTimeout(),
      ]);

      return {
        privacyModeEnabled,
        appLockEnabled,
        biometricEnabled,
        pinEnabled,
        autoLockTimeout,
      };
    } catch (error) {
      console.error(
        '[SecurityService] Error getting security settings:',
        error
      );
      return {
        privacyModeEnabled: false,
        appLockEnabled: false,
        biometricEnabled: false,
        pinEnabled: false,
        autoLockTimeout: DEFAULT_AUTO_LOCK_TIMEOUT,
      };
    }
  }

  // Privacy Mode methods
  async isPrivacyModeEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(STORAGE_KEYS.PRIVACY_MODE);
      return enabled === 'true';
    } catch {
      return false;
    }
  }

  async setPrivacyMode(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.PRIVACY_MODE,
        enabled ? 'true' : 'false'
      );
      logEvent('privacy_local_only_enabled', { enabled });
    } catch (error) {
      console.error('[SecurityService] Error setting privacy mode:', error);
    }
  }

  // App Lock methods
  async isAppLockEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(STORAGE_KEYS.APP_LOCK_ENABLED);
      return enabled === 'true';
    } catch {
      return false;
    }
  }

  async setAppLockEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.APP_LOCK_ENABLED,
        enabled ? 'true' : 'false'
      );

      if (enabled) {
        // When enabling app lock, ensure we have at least one auth method
        const hasAuthMethod = await this.hasAuthenticationMethod();
        if (!hasAuthMethod) {
          throw new Error(
            'At least one authentication method (PIN or biometric) must be enabled'
          );
        }
      }

      logEvent('app_lock_enabled', { enabled });
    } catch (error) {
      console.error('[SecurityService] Error setting app lock:', error);
      throw error;
    }
  }

  // Auto-lock timeout methods
  async getAutoLockTimeout(): Promise<number> {
    try {
      const timeout = await AsyncStorage.getItem(
        STORAGE_KEYS.AUTO_LOCK_TIMEOUT
      );
      const parsedTimeout = timeout
        ? parseInt(timeout, 10)
        : DEFAULT_AUTO_LOCK_TIMEOUT;

      // Ensure timeout is within valid range
      return Math.max(
        MIN_AUTO_LOCK_TIMEOUT,
        Math.min(MAX_AUTO_LOCK_TIMEOUT, parsedTimeout)
      );
    } catch {
      return DEFAULT_AUTO_LOCK_TIMEOUT;
    }
  }

  async setAutoLockTimeout(minutes: number): Promise<void> {
    try {
      // Validate timeout range
      const validTimeout = Math.max(
        MIN_AUTO_LOCK_TIMEOUT,
        Math.min(MAX_AUTO_LOCK_TIMEOUT, minutes)
      );
      await AsyncStorage.setItem(
        STORAGE_KEYS.AUTO_LOCK_TIMEOUT,
        validTimeout.toString()
      );
      logEvent('auto_lock_timeout_changed', { timeout: validTimeout });
    } catch (error) {
      console.error(
        '[SecurityService] Error setting auto-lock timeout:',
        error
      );
    }
  }

  // App lock state management
  async getCurrentLockState(): Promise<AppLockState> {
    try {
      const state = await AsyncStorage.getItem(STORAGE_KEYS.APP_LOCK_STATE);
      return (state as AppLockState) || AppLockState.UNLOCKED;
    } catch {
      return AppLockState.UNLOCKED;
    }
  }

  async lockApp(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.APP_LOCK_STATE,
        AppLockState.LOCKED
      );
      this.notifyLockStateListeners(AppLockState.LOCKED);
      logEvent('app_locked');
    } catch (error) {
      console.error('[SecurityService] Error locking app:', error);
    }
  }

  async unlockApp(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.APP_LOCK_STATE,
        AppLockState.UNLOCKED
      );
      await this.recordLastActiveTime();
      this.notifyLockStateListeners(AppLockState.UNLOCKED);
      logEvent('app_unlocked');
    } catch (error) {
      console.error('[SecurityService] Error unlocking app:', error);
    }
  }

  // Authentication methods
  async authenticate(): Promise<AuthResult> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.APP_LOCK_STATE,
        AppLockState.AUTHENTICATING
      );
      this.notifyLockStateListeners(AppLockState.AUTHENTICATING);

      // Try biometric authentication first if enabled
      const biometricEnabled = await biometricService.isBiometricEnabled();
      if (biometricEnabled) {
        const biometricResult =
          await biometricService.authenticateWithBiometrics();

        if (biometricResult.success) {
          await this.unlockApp();
          return {
            success: true,
            method: AuthMethod.BIOMETRIC,
          };
        }

        // If biometric failed but user wants to fallback to PIN
        if (biometricResult.fallbackToCredentials) {
          const pinEnabled = await pinService.isPinEnabled();
          if (pinEnabled) {
            return {
              success: false,
              error: biometricResult.error,
              fallbackAvailable: true,
            };
          }
        }

        // If biometric failed and no fallback, return error
        await AsyncStorage.setItem(
          STORAGE_KEYS.APP_LOCK_STATE,
          AppLockState.LOCKED
        );
        this.notifyLockStateListeners(AppLockState.LOCKED);

        return {
          success: false,
          error: biometricResult.error,
          fallbackAvailable: await pinService.isPinEnabled(),
        };
      }

      // If biometric not enabled, check PIN
      const pinEnabled = await pinService.isPinEnabled();
      if (pinEnabled) {
        return {
          success: false,
          error: 'PIN authentication required',
          fallbackAvailable: true,
        };
      }

      // No authentication method available
      await this.unlockApp(); // Unlock if no auth method is set
      return {
        success: true,
        method: AuthMethod.NONE,
      };
    } catch (error) {
      console.error('[SecurityService] Authentication error:', error);
      await AsyncStorage.setItem(
        STORAGE_KEYS.APP_LOCK_STATE,
        AppLockState.LOCKED
      );
      this.notifyLockStateListeners(AppLockState.LOCKED);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  }

  async authenticateWithPin(pin: string): Promise<AuthResult> {
    try {
      const result = await pinService.validatePin(pin);

      if (result.success) {
        await this.unlockApp();
        return {
          success: true,
          method: AuthMethod.PIN,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error) {
      console.error('[SecurityService] PIN authentication error:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'PIN authentication failed',
      };
    }
  }

  // Check if any authentication method is available
  private async hasAuthenticationMethod(): Promise<boolean> {
    const [biometricEnabled, pinEnabled] = await Promise.all([
      biometricService.isBiometricEnabled(),
      pinService.isPinEnabled(),
    ]);

    return biometricEnabled || pinEnabled;
  }

  // Lock state listeners
  addLockStateListener(listener: (state: AppLockState) => void): void {
    this.lockStateListeners.push(listener);
  }

  removeLockStateListener(listener: (state: AppLockState) => void): void {
    const index = this.lockStateListeners.indexOf(listener);
    if (index > -1) {
      this.lockStateListeners.splice(index, 1);
    }
  }

  private notifyLockStateListeners(state: AppLockState): void {
    this.lockStateListeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('[SecurityService] Error in lock state listener:', error);
      }
    });
  }

  // Cleanup
  destroy(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    this.clearLockTimer();
    this.lockStateListeners = [];
  }
}

export const securityService = SecurityService.getInstance();
