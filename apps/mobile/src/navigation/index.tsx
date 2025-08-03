/**
 * Main Navigation Component
 * Root navigation container with authentication flow
 */

import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { RootStackParamList } from '../types/navigation';
import {
  NAVIGATION_THEME,
  DARK_NAVIGATION_THEME,
  DEEP_LINK_CONFIG,
} from '../constants/navigation';
import { useNavigation as useNavigationContext } from '../contexts/NavigationContext';
import { useAuth } from '../contexts/AuthContext';

// Navigation Stacks
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import ModalNavigator from './ModalNavigator';

// Loading Component
import LoadingScreen from '../screens/common/LoadingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Linking Configuration
const linking = {
  prefixes: ['drishti://', 'https://drishti.app'],
  config: {
    screens: {
      Auth: 'auth',
      Main: 'main',
    },
  },
};

const RootNavigator: React.FC = () => {
  const colorScheme = useColorScheme();
  const { state: navState, trackScreenView } = useNavigationContext();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Select theme based on color scheme
  const theme =
    colorScheme === 'dark' ? DARK_NAVIGATION_THEME : NAVIGATION_THEME;

  // Navigation state change handler
  const onStateChange = (state: any) => {
    if (state) {
      const currentRoute = getCurrentRouteName(state);
      if (currentRoute) {
        trackScreenView(currentRoute);
      }
    }
  };

  // Get current route name from navigation state
  const getCurrentRouteName = (state: any): string | undefined => {
    if (!state || !state.routes || state.routes.length === 0) {
      return undefined;
    }

    const route = state.routes[state.index];

    if (route.state) {
      return getCurrentRouteName(route.state);
    }

    return route.name;
  };

  // Show loading screen while initializing
  if (navState.isLoading || authLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer
        theme={theme}
        linking={linking}
        onStateChange={onStateChange}
        fallback={<LoadingScreen />}
      >
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            animation: 'slide_from_right',
          }}
        >
          {isAuthenticated ? (
            // Authenticated Stack
            <>
              <Stack.Screen
                name='Main'
                component={MainTabNavigator}
                options={{ gestureEnabled: false }}
              />
              <Stack.Group
                screenOptions={{
                  presentation: 'modal',
                  gestureEnabled: true,
                }}
              >
                <Stack.Screen name='Modal' component={ModalNavigator} />
              </Stack.Group>
            </>
          ) : (
            // Unauthenticated Stack
            <Stack.Screen
              name='Auth'
              component={AuthNavigator}
              options={{ gestureEnabled: false }}
            />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

export default RootNavigator;
