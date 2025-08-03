/**
 * Enhanced Navigation Context
 * Advanced navigation features with deep linking, persistence, analytics, and gestures
 */

import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import DeepLinkingService from '../services/navigation/DeepLinkingService';
import NavigationPersistenceService from '../services/navigation/NavigationPersistenceService';
import NavigationAnalyticsService from '../services/navigation/NavigationAnalyticsService';
import GestureNavigationService from '../services/navigation/GestureNavigationService';

interface EnhancedNavigationContextType {
  // State
  isReady: boolean;
  isRestoring: boolean;
  currentScreen: string | null;
  
  // Feature toggles
  deepLinkingEnabled: boolean;
  gesturesEnabled: boolean;
  analyticsEnabled: boolean;
  persistenceEnabled: boolean;
  
  // Deep linking
  handleDeepLink: (url: string) => Promise<boolean>;
  generateDeepLink: (route: any) => string;
  canHandleUrl: (url: string) => boolean;
  
  // Analytics
  getNavigationMetrics: () => Promise<any>;
  clearAnalytics: () => Promise<void>;
  getCurrentSession: () => any;
  
  // Gestures
  getGestureStats: () => any;
  updateGestureConfig: (config: any) => void;
  clearGestureStats: () => void;
  
  // Persistence
  saveNavigationState: () => Promise<void>;
  restoreNavigationState: () => Promise<any>;
  clearPersistedState: () => Promise<void>;
  getStorageStats: () => Promise<any>;
  
  // Configuration
  setDeepLinkingEnabled: (enabled: boolean) => void;
  setGesturesEnabled: (enabled: boolean) => void;
  setAnalyticsEnabled: (enabled: boolean) => void;
  setPersistenceEnabled: (enabled: boolean) => void;
  
  // Navigation ref
  navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList>>;
}

interface EnhancedNavigationProviderProps {
  children: ReactNode;
}

const EnhancedNavigationContext = createContext<EnhancedNavigationContextType | undefined>(undefined);

export const EnhancedNavigationProvider: React.FC<EnhancedNavigationProviderProps> = ({ children }) => {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const persistenceService = useRef(new NavigationPersistenceService()).current;
  
  // State
  const [isReady, setIsReady] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<string | null>(null);
  
  // Feature toggles
  const [deepLinkingEnabled, setDeepLinkingEnabled] = useState(true);
  const [gesturesEnabled, setGesturesEnabled] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [persistenceEnabled, setPersistenceEnabled] = useState(true);

  // Initialize services
  useEffect(() => {
    initializeServices();
    return () => {
      cleanupServices();
    };
  }, []);

  // Handle navigation ready
  useEffect(() => {
    if (isReady && navigationRef.current) {
      DeepLinkingService.setNavigationRef(navigationRef.current);
      GestureNavigationService.setNavigationRef(navigationRef.current);
      DeepLinkingService.setReady(true);
      
      if (analyticsEnabled) {
        NavigationAnalyticsService.startSession();
      }
    }
  }, [isReady, analyticsEnabled]);

  const initializeServices = async () => {
    try {
      // Initialize deep linking
      if (deepLinkingEnabled) {
        DeepLinkingService.initialize();
      }

      // Enable services based on settings
      NavigationAnalyticsService.setEnabled(analyticsEnabled);
      GestureNavigationService.setEnabled(gesturesEnabled);

      console.log('Enhanced navigation services initialized');
    } catch (error) {
      console.error('Failed to initialize enhanced navigation services:', error);
    }
  };

  const cleanupServices = () => {
    if (analyticsEnabled) {
      NavigationAnalyticsService.endSession();
    }
  };

  // Handle navigation state changes
  const handleNavigationStateChange = (state: any) => {
    if (!state) return;

    // Save state for persistence
    if (persistenceEnabled) {
      persistenceService.saveState(state);
    }

    // Extract current screen
    const screen = getCurrentScreenName(state);
    if (screen && screen !== currentScreen) {
      setCurrentScreen(screen);
      
      // Update services
      GestureNavigationService.setCurrentScreen(screen);
      
      if (analyticsEnabled) {
        NavigationAnalyticsService.trackScreenView(screen);
      }
    }
  };

  // Get current screen name from navigation state
  const getCurrentScreenName = (state: any): string | null => {
    if (!state.routes || state.routes.length === 0) return null;
    
    const route = state.routes[state.index];
    if (route.state) {
      return getCurrentScreenName(route.state);
    }
    
    return route.name;
  };

  // Deep linking methods
  const handleDeepLink = async (url: string): Promise<boolean> => {
    if (!deepLinkingEnabled) return false;
    return DeepLinkingService.handleDeepLink(url);
  };

  const generateDeepLink = (route: any): string => {
    return DeepLinkingService.generateUrl(route);
  };

  const canHandleUrl = (url: string): boolean => {
    return DeepLinkingService.canHandleUrl(url);
  };

  // Analytics methods
  const getNavigationMetrics = async () => {
    if (!analyticsEnabled) return null;
    return NavigationAnalyticsService.getMetrics();
  };

  const clearAnalytics = async () => {
    await NavigationAnalyticsService.clearData();
  };

  const getCurrentSession = () => {
    return NavigationAnalyticsService.getCurrentSession();
  };

  // Gesture methods
  const getGestureStats = () => {
    if (!gesturesEnabled) return null;
    return GestureNavigationService.getGestureStats();
  };

  const updateGestureConfig = (config: any) => {
    GestureNavigationService.updateConfig(config);
  };

  const clearGestureStats = () => {
    GestureNavigationService.clearStats();
  };

  // Persistence methods
  const saveNavigationState = async () => {
    if (!persistenceEnabled || !navigationRef.current) return;
    
    const state = navigationRef.current.getRootState();
    if (state) {
      await persistenceService.saveState(state);
    }
  };

  const restoreNavigationState = async () => {
    if (!persistenceEnabled) return undefined;
    
    setIsRestoring(true);
    try {
      const state = await persistenceService.restoreState();
      return state;
    } finally {
      setIsRestoring(false);
    }
  };

  const clearPersistedState = async () => {
    await persistenceService.clearState();
  };

  const getStorageStats = async () => {
    return persistenceService.getStorageStats();
  };

  // Feature toggle methods
  const toggleDeepLinking = (enabled: boolean) => {
    setDeepLinkingEnabled(enabled);
    if (enabled && isReady) {
      DeepLinkingService.initialize();
    }
  };

  const toggleGestures = (enabled: boolean) => {
    setGesturesEnabled(enabled);
    GestureNavigationService.setEnabled(enabled);
  };

  const toggleAnalytics = (enabled: boolean) => {
    setAnalyticsEnabled(enabled);
    NavigationAnalyticsService.setEnabled(enabled);
    
    if (enabled && isReady) {
      NavigationAnalyticsService.startSession();
    } else {
      NavigationAnalyticsService.endSession();
    }
  };

  const togglePersistence = (enabled: boolean) => {
    setPersistenceEnabled(enabled);
    if (!enabled) {
      persistenceService.clearState();
    }
  };

  const value: EnhancedNavigationContextType = {
    // State
    isReady,
    isRestoring,
    currentScreen,
    
    // Feature toggles
    deepLinkingEnabled,
    gesturesEnabled,
    analyticsEnabled,
    persistenceEnabled,
    
    // Deep linking
    handleDeepLink,
    generateDeepLink,
    canHandleUrl,
    
    // Analytics
    getNavigationMetrics,
    clearAnalytics,
    getCurrentSession,
    
    // Gestures
    getGestureStats,
    updateGestureConfig,
    clearGestureStats,
    
    // Persistence
    saveNavigationState,
    restoreNavigationState,
    clearPersistedState,
    getStorageStats,
    
    // Configuration
    setDeepLinkingEnabled: toggleDeepLinking,
    setGesturesEnabled: toggleGestures,
    setAnalyticsEnabled: toggleAnalytics,
    setPersistenceEnabled: togglePersistence,
    
    // Navigation ref
    navigationRef,
  };

  return (
    <EnhancedNavigationContext.Provider value={value}>
      {children}
    </EnhancedNavigationContext.Provider>
  );
};

export const useEnhancedNavigation = (): EnhancedNavigationContextType => {
  const context = useContext(EnhancedNavigationContext);
  if (context === undefined) {
    throw new Error('useEnhancedNavigation must be used within an EnhancedNavigationProvider');
  }
  return context;
};
