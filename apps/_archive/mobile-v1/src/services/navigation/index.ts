/**
 * Navigation Services Index
 * Centralized export for all navigation services
 */

// Services
export { default as DeepLinkingService } from './DeepLinkingService';
export { default as NavigationPersistenceService } from './NavigationPersistenceService';
export { default as NavigationAnalyticsService } from './NavigationAnalyticsService';
export { default as GestureNavigationService } from './GestureNavigationService';

// Types
export type {
  DeepLinkRoute,
  DeepLinkConfig,
} from './DeepLinkingService';

export type {
  NavigationPersistenceConfig,
  PersistedNavigationState,
} from './NavigationPersistenceService';

export type {
  NavigationEvent,
  NavigationSession,
  NavigationMetrics,
} from './NavigationAnalyticsService';

export type {
  GestureConfig,
  CustomGesture,
  GesturePattern,
  GestureAction,
  GestureEvent,
} from './GestureNavigationService';
