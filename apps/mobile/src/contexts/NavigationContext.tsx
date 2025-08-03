/**
 * Navigation Context and Provider
 * Manages navigation state and provides navigation utilities
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationState, NavigationAnalytics } from '../types/navigation';
import { NAVIGATION_PERSISTENCE_KEY, NAVIGATION_EVENTS } from '../constants/navigation';

// Navigation Context State
interface NavigationContextState extends NavigationState {
  isLoading: boolean;
  error: string | null;
  analytics: NavigationAnalytics[];
}

// Navigation Actions
type NavigationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_ONBOARDING_COMPLETE'; payload: boolean }
  | { type: 'SET_CURRENT_TAB'; payload: keyof import('../types/navigation').MainTabParamList }
  | { type: 'ADD_TO_HISTORY'; payload: string }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'ADD_ANALYTICS'; payload: NavigationAnalytics }
  | { type: 'RESTORE_STATE'; payload: Partial<NavigationContextState> };

// Initial State
const initialState: NavigationContextState = {
  isAuthenticated: false,
  hasCompletedOnboarding: false,
  currentTab: 'Dashboard',
  navigationHistory: [],
  isLoading: true,
  error: null,
  analytics: [],
};

// Navigation Reducer
function navigationReducer(
  state: NavigationContextState,
  action: NavigationAction
): NavigationContextState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };

    case 'SET_ONBOARDING_COMPLETE':
      return { ...state, hasCompletedOnboarding: action.payload };

    case 'SET_CURRENT_TAB':
      return { ...state, currentTab: action.payload };

    case 'ADD_TO_HISTORY':
      return {
        ...state,
        navigationHistory: [...state.navigationHistory.slice(-9), action.payload],
      };

    case 'CLEAR_HISTORY':
      return { ...state, navigationHistory: [] };

    case 'ADD_ANALYTICS':
      return {
        ...state,
        analytics: [...state.analytics.slice(-99), action.payload],
      };

    case 'RESTORE_STATE':
      return { ...state, ...action.payload, isLoading: false };

    default:
      return state;
  }
}

// Navigation Context
interface NavigationContextValue {
  state: NavigationContextState;
  setAuthenticated: (authenticated: boolean) => void;
  setOnboardingComplete: (complete: boolean) => void;
  setCurrentTab: (tab: keyof import('../types/navigation').MainTabParamList) => void;
  addToHistory: (screen: string) => void;
  clearHistory: () => void;
  trackScreenView: (screenName: string, params?: Record<string, any>) => void;
  getNavigationHistory: () => string[];
  getAnalytics: () => NavigationAnalytics[];
  persistState: () => Promise<void>;
  restoreState: () => Promise<void>;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

// Navigation Provider Props
interface NavigationProviderProps {
  children: ReactNode;
}

// Navigation Provider Component
export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(navigationReducer, initialState);

  // Restore navigation state on app start
  useEffect(() => {
    restoreState();
  }, []);

  // Persist state when it changes
  useEffect(() => {
    if (!state.isLoading) {
      persistState();
    }
  }, [state.isAuthenticated, state.hasCompletedOnboarding, state.currentTab]);

  const setAuthenticated = (authenticated: boolean) => {
    dispatch({ type: 'SET_AUTHENTICATED', payload: authenticated });
    if (!authenticated) {
      // Clear sensitive data when logging out
      dispatch({ type: 'CLEAR_HISTORY' });
    }
  };

  const setOnboardingComplete = (complete: boolean) => {
    dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: complete });
  };

  const setCurrentTab = (tab: keyof import('../types/navigation').MainTabParamList) => {
    dispatch({ type: 'SET_CURRENT_TAB', payload: tab });
    addToHistory(`Tab:${tab}`);
  };

  const addToHistory = (screen: string) => {
    dispatch({ type: 'ADD_TO_HISTORY', payload: screen });
  };

  const clearHistory = () => {
    dispatch({ type: 'CLEAR_HISTORY' });
  };

  const trackScreenView = (screenName: string, params?: Record<string, any>) => {
    const analytics: NavigationAnalytics = {
      screenName,
      timestamp: Date.now(),
      params,
    };

    // Add previous screen if available
    if (state.navigationHistory.length > 0) {
      analytics.previousScreen = state.navigationHistory[state.navigationHistory.length - 1];
    }

    dispatch({ type: 'ADD_ANALYTICS', payload: analytics });
    addToHistory(screenName);
  };

  const getNavigationHistory = () => {
    return state.navigationHistory;
  };

  const getAnalytics = () => {
    return state.analytics;
  };

  const persistState = async () => {
    try {
      const stateToSave = {
        isAuthenticated: state.isAuthenticated,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        currentTab: state.currentTab,
        navigationHistory: state.navigationHistory.slice(-10), // Keep last 10 entries
      };

      await AsyncStorage.setItem(
        NAVIGATION_PERSISTENCE_KEY,
        JSON.stringify(stateToSave)
      );
    } catch (error) {
      console.error('Failed to persist navigation state:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save navigation state' });
    }
  };

  const restoreState = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const savedState = await AsyncStorage.getItem(NAVIGATION_PERSISTENCE_KEY);
      
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        dispatch({ type: 'RESTORE_STATE', payload: parsedState });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Failed to restore navigation state:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to restore navigation state' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const value: NavigationContextValue = {
    state,
    setAuthenticated,
    setOnboardingComplete,
    setCurrentTab,
    addToHistory,
    clearHistory,
    trackScreenView,
    getNavigationHistory,
    getAnalytics,
    persistState,
    restoreState,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

// Navigation Hook
export const useNavigation = (): NavigationContextValue => {
  const context = useContext(NavigationContext);
  
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  
  return context;
};

// Navigation Analytics Hook
export const useNavigationAnalytics = () => {
  const { trackScreenView, getAnalytics } = useNavigation();

  const trackEvent = (eventType: string, screenName: string, params?: Record<string, any>) => {
    trackScreenView(screenName, { eventType, ...params });
  };

  const getScreenViewCount = (screenName: string): number => {
    return getAnalytics().filter(event => event.screenName === screenName).length;
  };

  const getMostVisitedScreens = (limit: number = 5): Array<{ screen: string; count: number }> => {
    const analytics = getAnalytics();
    const screenCounts: Record<string, number> = {};

    analytics.forEach(event => {
      screenCounts[event.screenName] = (screenCounts[event.screenName] || 0) + 1;
    });

    return Object.entries(screenCounts)
      .map(([screen, count]) => ({ screen, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  };

  return {
    trackEvent,
    getScreenViewCount,
    getMostVisitedScreens,
    getAnalytics,
  };
};
