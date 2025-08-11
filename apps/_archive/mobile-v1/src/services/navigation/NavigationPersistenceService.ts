/**
 * Navigation Persistence Service
 * Saves and restores navigation state across app launches
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationState, PartialState } from '@react-navigation/native';

export interface NavigationPersistenceConfig {
  key: string;
  version: number;
  timeout: number;
  whitelist?: string[];
  blacklist?: string[];
  transforms?: {
    in?: (state: any) => any;
    out?: (state: any) => any;
  };
}

export interface PersistedNavigationState {
  state: NavigationState;
  timestamp: number;
  version: number;
  appVersion: string;
}

class NavigationPersistenceService {
  private config: NavigationPersistenceConfig;
  private isRestoring = false;

  constructor(config: Partial<NavigationPersistenceConfig> = {}) {
    this.config = {
      key: 'NAVIGATION_STATE',
      version: 1,
      timeout: 5000, // 5 seconds
      ...config,
    };
  }

  /**
   * Save navigation state to storage
   */
  async saveState(state: NavigationState): Promise<void> {
    try {
      // Filter state based on whitelist/blacklist
      const filteredState = this.filterState(state);

      // Apply output transform
      const transformedState = this.config.transforms?.out 
        ? this.config.transforms.out(filteredState)
        : filteredState;

      // Create persisted state object
      const persistedState: PersistedNavigationState = {
        state: transformedState,
        timestamp: Date.now(),
        version: this.config.version,
        appVersion: '1.0.0', // TODO: Get from app config
      };

      // Save to AsyncStorage
      await AsyncStorage.setItem(
        this.config.key,
        JSON.stringify(persistedState)
      );

      console.log('Navigation state saved successfully');
    } catch (error) {
      console.error('Failed to save navigation state:', error);
    }
  }

  /**
   * Restore navigation state from storage
   */
  async restoreState(): Promise<NavigationState | undefined> {
    try {
      this.isRestoring = true;

      // Get stored state with timeout
      const storedState = await Promise.race([
        AsyncStorage.getItem(this.config.key),
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), this.config.timeout)
        ),
      ]);

      if (!storedState) {
        console.log('No stored navigation state found');
        return undefined;
      }

      // Parse stored state
      const persistedState: PersistedNavigationState = JSON.parse(storedState);

      // Validate version compatibility
      if (!this.isVersionCompatible(persistedState)) {
        console.log('Navigation state version incompatible, clearing state');
        await this.clearState();
        return undefined;
      }

      // Check if state is too old
      if (this.isStateExpired(persistedState)) {
        console.log('Navigation state expired, clearing state');
        await this.clearState();
        return undefined;
      }

      // Apply input transform
      const transformedState = this.config.transforms?.in
        ? this.config.transforms.in(persistedState.state)
        : persistedState.state;

      // Validate state structure
      if (!this.isValidNavigationState(transformedState)) {
        console.log('Invalid navigation state structure, clearing state');
        await this.clearState();
        return undefined;
      }

      console.log('Navigation state restored successfully');
      return transformedState;
    } catch (error) {
      console.error('Failed to restore navigation state:', error);
      // Clear corrupted state
      await this.clearState();
      return undefined;
    } finally {
      this.isRestoring = false;
    }
  }

  /**
   * Clear stored navigation state
   */
  async clearState(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.config.key);
      console.log('Navigation state cleared');
    } catch (error) {
      console.error('Failed to clear navigation state:', error);
    }
  }

  /**
   * Check if currently restoring state
   */
  isRestoringState(): boolean {
    return this.isRestoring;
  }

  /**
   * Filter navigation state based on whitelist/blacklist
   */
  private filterState(state: NavigationState): NavigationState {
    if (!this.config.whitelist && !this.config.blacklist) {
      return state;
    }

    // Deep clone state to avoid mutations
    const filteredState = JSON.parse(JSON.stringify(state));

    // Apply filtering logic
    this.filterRoutes(filteredState);

    return filteredState;
  }

  /**
   * Recursively filter routes in navigation state
   */
  private filterRoutes(state: any): void {
    if (!state.routes) return;

    state.routes = state.routes.filter((route: any) => {
      // Check whitelist
      if (this.config.whitelist) {
        if (!this.config.whitelist.includes(route.name)) {
          return false;
        }
      }

      // Check blacklist
      if (this.config.blacklist) {
        if (this.config.blacklist.includes(route.name)) {
          return false;
        }
      }

      // Recursively filter nested routes
      if (route.state) {
        this.filterRoutes(route.state);
      }

      return true;
    });

    // Update index if it's out of bounds
    if (state.index >= state.routes.length) {
      state.index = Math.max(0, state.routes.length - 1);
    }
  }

  /**
   * Check if persisted state version is compatible
   */
  private isVersionCompatible(persistedState: PersistedNavigationState): boolean {
    return persistedState.version === this.config.version;
  }

  /**
   * Check if persisted state is expired
   */
  private isStateExpired(persistedState: PersistedNavigationState): boolean {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const age = Date.now() - persistedState.timestamp;
    return age > maxAge;
  }

  /**
   * Validate navigation state structure
   */
  private isValidNavigationState(state: any): boolean {
    if (!state || typeof state !== 'object') {
      return false;
    }

    // Check required properties
    if (!Array.isArray(state.routes) || typeof state.index !== 'number') {
      return false;
    }

    // Check index bounds
    if (state.index < 0 || state.index >= state.routes.length) {
      return false;
    }

    // Validate routes
    for (const route of state.routes) {
      if (!route.name || typeof route.name !== 'string') {
        return false;
      }

      // Recursively validate nested states
      if (route.state && !this.isValidNavigationState(route.state)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Create a safe partial state for initial navigation
   */
  createSafePartialState(state: NavigationState): PartialState<NavigationState> {
    return {
      routes: state.routes.map(route => ({
        name: route.name,
        params: route.params,
        state: route.state ? this.createSafePartialState(route.state) : undefined,
      })),
      index: state.index,
    };
  }

  /**
   * Sanitize navigation state for persistence
   */
  sanitizeState(state: NavigationState): NavigationState {
    const sanitized = JSON.parse(JSON.stringify(state));

    // Remove sensitive data from params
    this.sanitizeRoutes(sanitized);

    return sanitized;
  }

  /**
   * Recursively sanitize routes
   */
  private sanitizeRoutes(state: any): void {
    if (!state.routes) return;

    state.routes.forEach((route: any) => {
      // Remove sensitive parameters
      if (route.params) {
        const sensitiveKeys = ['password', 'token', 'secret', 'key'];
        sensitiveKeys.forEach(key => {
          if (route.params[key]) {
            delete route.params[key];
          }
        });
      }

      // Recursively sanitize nested routes
      if (route.state) {
        this.sanitizeRoutes(route.state);
      }
    });
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    size: number;
    lastSaved: number | null;
    version: number | null;
  }> {
    try {
      const storedState = await AsyncStorage.getItem(this.config.key);
      
      if (!storedState) {
        return { size: 0, lastSaved: null, version: null };
      }

      const persistedState: PersistedNavigationState = JSON.parse(storedState);
      
      return {
        size: new Blob([storedState]).size,
        lastSaved: persistedState.timestamp,
        version: persistedState.version,
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return { size: 0, lastSaved: null, version: null };
    }
  }
}

export default NavigationPersistenceService;
