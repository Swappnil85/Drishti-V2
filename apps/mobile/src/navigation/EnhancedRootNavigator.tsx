/**
 * Enhanced Root Navigator
 * Navigation container with advanced features: deep linking, persistence, analytics, gestures
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View } from 'react-native';

import { RootStackParamList } from '../types/navigation';
import {
  NAVIGATION_THEME,
  DARK_NAVIGATION_THEME,
} from '../constants/navigation';
import { useNavigation as useNavigationContext } from '../contexts/NavigationContext';
import { useAuth } from '../contexts/AuthContext';
import { useEnhancedNavigation } from '../contexts/EnhancedNavigationContext';

// Navigation Stacks
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import ModalNavigator from './ModalNavigator';

// Loading Component
import LoadingScreen from '../screens/common/LoadingScreen';
import { LoadingState } from '../components/ui';

const Stack = createNativeStackNavigator<RootStackParamList>();

const EnhancedRootNavigator: React.FC = () => {
  const colorScheme = useColorScheme();
  const { state: navState, trackScreenView } = useNavigationContext();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    navigationRef,
    isReady,
    isRestoring,
    deepLinkingEnabled,
    analyticsEnabled,
    persistenceEnabled,
    restoreNavigationState,
    handleDeepLink,
  } = useEnhancedNavigation();

  const [initialState, setInitialState] = useState();

  // Select theme based on color scheme
  const theme = colorScheme === 'dark' ? DARK_NAVIGATION_THEME : NAVIGATION_THEME;

  // Restore navigation state on mount
  useEffect(() => {
    const restoreState = async () => {
      if (persistenceEnabled) {
        try {
          const state = await restoreNavigationState();
          if (state) {
            setInitialState(state);
          }
        } catch (error) {
          console.error('Failed to restore navigation state:', error);
        }
      }
    };

    restoreState();
  }, [persistenceEnabled, restoreNavigationState]);

  // Handle navigation ready
  const handleNavigationReady = () => {
    console.log('Navigation container ready');
    // The enhanced navigation context will handle service initialization
  };

  // Handle navigation state change
  const handleNavigationStateChange = (state: any) => {
    if (!state) return;

    // Track screen views for analytics
    if (analyticsEnabled) {
      const currentRoute = getCurrentRouteName(state);
      if (currentRoute) {
        trackScreenView(currentRoute);
      }
    }
  };

  // Get current route name from navigation state
  const getCurrentRouteName = (state: any): string | null => {
    if (!state.routes || state.routes.length === 0) return null;
    
    const route = state.routes[state.index];
    if (route.state) {
      return getCurrentRouteName(route.state);
    }
    
    return route.name;
  };

  // Enhanced linking configuration
  const linking = {
    prefixes: ['drishti://', 'https://drishti.app'],
    config: {
      screens: {
        Auth: {
          screens: {
            Login: 'auth/login',
            Register: 'auth/register',
            ForgotPassword: 'auth/forgot-password',
            ResetPassword: 'auth/reset-password/:token',
            BiometricSetup: 'auth/biometric-setup',
          },
        },
        Main: {
          screens: {
            Dashboard: {
              screens: {
                DashboardHome: 'dashboard',
                NetWorth: 'dashboard/net-worth',
                ProgressOverview: 'dashboard/progress',
                QuickActions: 'dashboard/quick-actions',
              },
            },
            Accounts: {
              screens: {
                AccountsList: 'accounts',
                AccountDetails: 'accounts/:accountId',
                AddAccount: 'accounts/add',
                EditAccount: 'accounts/:accountId/edit',
                AccountHistory: 'accounts/:accountId/history',
                ImportAccounts: 'accounts/import',
              },
            },
            Goals: {
              screens: {
                GoalsList: 'goals',
                GoalDetails: 'goals/:goalId',
                CreateGoal: 'goals/create',
                EditGoal: 'goals/:goalId/edit',
                GoalProgress: 'goals/:goalId/progress',
                GoalCalculator: 'goals/calculator',
                GoalTemplates: 'goals/templates',
              },
            },
            Scenarios: {
              screens: {
                ScenariosList: 'scenarios',
                ScenarioDetails: 'scenarios/:scenarioId',
                CreateScenario: 'scenarios/create',
                EditScenario: 'scenarios/:scenarioId/edit',
                ScenarioComparison: 'scenarios/compare',
                StressTest: 'scenarios/stress-test',
                ScenarioTemplates: 'scenarios/templates',
              },
            },
            Settings: {
              screens: {
                SettingsHome: 'settings',
                Profile: 'settings/profile',
                Security: 'settings/security',
                Notifications: 'settings/notifications',
                Privacy: 'settings/privacy',
                DataExport: 'settings/data-export',
                About: 'settings/about',
                Help: 'settings/help',
                Feedback: 'settings/feedback',
              },
            },
          },
        },
        Modal: {
          screens: {
            QuickAdd: 'quick-add',
            Calculator: 'calculator',
            ShareGoal: 'share/goal/:goalId',
            ShareScenario: 'share/scenario/:scenarioId',
            Onboarding: 'onboarding',
            Tutorial: 'tutorial',
          },
        },
      },
    },
    // Custom URL handler for advanced deep linking
    getInitialURL: async () => {
      // Handle custom URL schemes and universal links
      return null; // Let the default handler work
    },
    subscribe: (listener: (url: string) => void) => {
      // Custom URL subscription for advanced handling
      return () => {}; // Cleanup function
    },
  };

  // Show loading screen while restoring state
  if (isRestoring) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <LoadingState
          message="Restoring navigation..."
          size="lg"
          overlay={false}
        />
      </View>
    );
  }

  // Show loading screen while authenticating
  if (authLoading || navState.isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={theme}
      linking={deepLinkingEnabled ? linking : undefined}
      initialState={initialState}
      onReady={handleNavigationReady}
      onStateChange={handleNavigationStateChange}
    >
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      >
        {isAuthenticated ? (
          // Authenticated Stack
          <>
            <Stack.Screen
              name='Main'
              component={MainTabNavigator}
              options={{
                gestureEnabled: false, // Disable gesture for main tab navigator
              }}
            />
            <Stack.Screen
              name='Modal'
              component={ModalNavigator}
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
          </>
        ) : (
          // Unauthenticated Stack
          <Stack.Screen
            name='Auth'
            component={AuthNavigator}
            options={{
              gestureEnabled: false, // Disable gesture for auth flow
            }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default EnhancedRootNavigator;
