/**
 * Deep Linking Service
 * Advanced deep linking with URL parsing, validation, and navigation
 */

import { Linking } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';

export interface DeepLinkRoute {
  screen: string;
  params?: Record<string, any>;
  nested?: {
    screen: string;
    params?: Record<string, any>;
  };
}

export interface DeepLinkConfig {
  pattern: string;
  screen: string;
  params?: (url: string, matches: RegExpMatchArray) => Record<string, any>;
  validate?: (params: Record<string, any>) => boolean;
  requireAuth?: boolean;
}

class DeepLinkingService {
  private navigationRef: NavigationContainerRef<RootStackParamList> | null = null;
  private isReady = false;
  private pendingUrl: string | null = null;
  private linkConfigs: DeepLinkConfig[] = [];

  constructor() {
    this.initializeDeepLinkConfigs();
  }

  /**
   * Initialize navigation reference
   */
  setNavigationRef(ref: NavigationContainerRef<RootStackParamList>) {
    this.navigationRef = ref;
  }

  /**
   * Set navigation ready state
   */
  setReady(ready: boolean) {
    this.isReady = ready;
    
    // Process pending URL if navigation is ready
    if (ready && this.pendingUrl) {
      this.handleDeepLink(this.pendingUrl);
      this.pendingUrl = null;
    }
  }

  /**
   * Initialize deep link configurations
   */
  private initializeDeepLinkConfigs() {
    this.linkConfigs = [
      // Dashboard routes
      {
        pattern: '/dashboard',
        screen: 'Main',
        nested: { screen: 'Dashboard', params: { screen: 'DashboardHome' } },
      },
      {
        pattern: '/dashboard/net-worth',
        screen: 'Main',
        nested: { screen: 'Dashboard', params: { screen: 'NetWorth' } },
      },

      // Account routes
      {
        pattern: '/accounts',
        screen: 'Main',
        nested: { screen: 'Accounts', params: { screen: 'AccountsList' } },
      },
      {
        pattern: '/accounts/add',
        screen: 'Main',
        nested: { screen: 'Accounts', params: { screen: 'AddAccount' } },
        requireAuth: true,
      },
      {
        pattern: '/accounts/([a-zA-Z0-9-]+)',
        screen: 'Main',
        nested: { screen: 'Accounts', params: { screen: 'AccountDetails' } },
        params: (url, matches) => ({ accountId: matches[1] }),
        validate: (params) => !!params.accountId,
      },

      // Goal routes
      {
        pattern: '/goals',
        screen: 'Main',
        nested: { screen: 'Goals', params: { screen: 'GoalsList' } },
      },
      {
        pattern: '/goals/create',
        screen: 'Main',
        nested: { screen: 'Goals', params: { screen: 'CreateGoal' } },
        requireAuth: true,
      },
      {
        pattern: '/goals/([a-zA-Z0-9-]+)',
        screen: 'Main',
        nested: { screen: 'Goals', params: { screen: 'GoalDetails' } },
        params: (url, matches) => ({ goalId: matches[1] }),
        validate: (params) => !!params.goalId,
      },

      // Scenario routes
      {
        pattern: '/scenarios',
        screen: 'Main',
        nested: { screen: 'Scenarios', params: { screen: 'ScenariosList' } },
      },
      {
        pattern: '/scenarios/create',
        screen: 'Main',
        nested: { screen: 'Scenarios', params: { screen: 'CreateScenario' } },
        requireAuth: true,
      },
      {
        pattern: '/scenarios/([a-zA-Z0-9-]+)',
        screen: 'Main',
        nested: { screen: 'Scenarios', params: { screen: 'ScenarioDetails' } },
        params: (url, matches) => ({ scenarioId: matches[1] }),
        validate: (params) => !!params.scenarioId,
      },

      // Settings routes
      {
        pattern: '/settings',
        screen: 'Main',
        nested: { screen: 'Settings', params: { screen: 'SettingsHome' } },
      },
      {
        pattern: '/settings/profile',
        screen: 'Main',
        nested: { screen: 'Settings', params: { screen: 'Profile' } },
        requireAuth: true,
      },
      {
        pattern: '/settings/security',
        screen: 'Main',
        nested: { screen: 'Settings', params: { screen: 'Security' } },
        requireAuth: true,
      },

      // Auth routes
      {
        pattern: '/auth/login',
        screen: 'Auth',
        nested: { screen: 'Login' },
      },
      {
        pattern: '/auth/register',
        screen: 'Auth',
        nested: { screen: 'Register' },
      },
      {
        pattern: '/auth/forgot-password',
        screen: 'Auth',
        nested: { screen: 'ForgotPassword' },
      },
      {
        pattern: '/auth/reset-password/([a-zA-Z0-9-]+)',
        screen: 'Auth',
        nested: { screen: 'ResetPassword' },
        params: (url, matches) => ({ token: matches[1] }),
        validate: (params) => !!params.token,
      },

      // Modal routes
      {
        pattern: '/quick-add',
        screen: 'Modal',
        nested: { screen: 'QuickAdd' },
        requireAuth: true,
      },
      {
        pattern: '/calculator',
        screen: 'Modal',
        nested: { screen: 'Calculator' },
      },

      // Share routes
      {
        pattern: '/share/goal/([a-zA-Z0-9-]+)',
        screen: 'Modal',
        nested: { screen: 'ShareGoal' },
        params: (url, matches) => ({ goalId: matches[1] }),
        validate: (params) => !!params.goalId,
      },
      {
        pattern: '/share/scenario/([a-zA-Z0-9-]+)',
        screen: 'Modal',
        nested: { screen: 'ShareScenario' },
        params: (url, matches) => ({ scenarioId: matches[1] }),
        validate: (params) => !!params.scenarioId,
      },
    ];
  }

  /**
   * Parse URL and extract route information
   */
  parseUrl(url: string): DeepLinkRoute | null {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Find matching configuration
      for (const config of this.linkConfigs) {
        const regex = new RegExp(`^${config.pattern}$`);
        const matches = pathname.match(regex);

        if (matches) {
          // Extract parameters
          let params = {};
          if (config.params && matches) {
            params = config.params(url, matches);
          }

          // Add query parameters
          const queryParams = Object.fromEntries(urlObj.searchParams.entries());
          params = { ...params, ...queryParams };

          // Validate parameters
          if (config.validate && !config.validate(params)) {
            console.warn('Deep link validation failed:', url, params);
            return null;
          }

          // Build route
          const route: DeepLinkRoute = {
            screen: config.screen,
            params,
          };

          if (config.nested) {
            route.nested = {
              screen: config.nested.screen,
              params: { ...config.nested.params, ...params },
            };
          }

          return route;
        }
      }

      console.warn('No deep link configuration found for:', pathname);
      return null;
    } catch (error) {
      console.error('Failed to parse deep link URL:', url, error);
      return null;
    }
  }

  /**
   * Handle deep link navigation
   */
  async handleDeepLink(url: string): Promise<boolean> {
    try {
      console.log('Handling deep link:', url);

      // Parse the URL
      const route = this.parseUrl(url);
      if (!route) {
        return false;
      }

      // Check if navigation is ready
      if (!this.isReady || !this.navigationRef) {
        console.log('Navigation not ready, storing pending URL:', url);
        this.pendingUrl = url;
        return false;
      }

      // Check authentication requirement
      const config = this.findConfigForRoute(route);
      if (config?.requireAuth) {
        const isAuthenticated = await this.checkAuthentication();
        if (!isAuthenticated) {
          // Redirect to login with return URL
          this.navigationRef.navigate('Auth', {
            screen: 'Login',
            params: { returnUrl: url },
          });
          return true;
        }
      }

      // Navigate to the route
      if (route.nested) {
        this.navigationRef.navigate(route.screen as any, {
          screen: route.nested.screen,
          params: route.nested.params,
        });
      } else {
        this.navigationRef.navigate(route.screen as any, route.params);
      }

      return true;
    } catch (error) {
      console.error('Failed to handle deep link:', url, error);
      return false;
    }
  }

  /**
   * Find configuration for a route
   */
  private findConfigForRoute(route: DeepLinkRoute): DeepLinkConfig | null {
    return this.linkConfigs.find(config => 
      config.screen === route.screen &&
      (!config.nested || config.nested.screen === route.nested?.screen)
    ) || null;
  }

  /**
   * Check if user is authenticated
   */
  private async checkAuthentication(): Promise<boolean> {
    // TODO: Implement authentication check
    // This should check if user has valid session/token
    return false;
  }

  /**
   * Generate deep link URL for a route
   */
  generateUrl(route: DeepLinkRoute): string {
    const baseUrl = 'https://drishti.app';
    
    // Find matching configuration
    const config = this.linkConfigs.find(c => 
      c.screen === route.screen &&
      (!c.nested || c.nested.screen === route.nested?.screen)
    );

    if (!config) {
      console.warn('No configuration found for route:', route);
      return baseUrl;
    }

    // Build URL path
    let path = config.pattern;
    
    // Replace parameter placeholders
    if (route.params) {
      Object.entries(route.params).forEach(([key, value]) => {
        path = path.replace(`([a-zA-Z0-9-]+)`, String(value));
      });
    }

    // Add query parameters
    const queryParams = new URLSearchParams();
    if (route.params) {
      Object.entries(route.params).forEach(([key, value]) => {
        if (!path.includes(String(value))) {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString();
    return `${baseUrl}${path}${queryString ? `?${queryString}` : ''}`;
  }

  /**
   * Initialize deep linking listeners
   */
  initialize() {
    // Handle initial URL (app opened via deep link)
    Linking.getInitialURL().then(url => {
      if (url) {
        this.handleDeepLink(url);
      }
    });

    // Handle URL changes (app already open)
    const subscription = Linking.addEventListener('url', ({ url }) => {
      this.handleDeepLink(url);
    });

    return () => {
      subscription?.remove();
    };
  }

  /**
   * Check if URL can be handled
   */
  canHandleUrl(url: string): boolean {
    return this.parseUrl(url) !== null;
  }
}

export default new DeepLinkingService();
