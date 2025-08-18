// React import not required with react-jsx runtime
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck - React Navigation type compatibility issues with React 18/19

import { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { Appearance, View, Text } from 'react-native';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import AccountsScreen from '../screens/AccountsScreen';
import PlanScreen from '../screens/PlanScreen';
import ScenariosScreen from '../screens/ScenariosScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PaywallScreen from '../screens/PaywallScreen';
import OnboardingNavigator from '../screens/onboarding/OnboardingNavigator';
import { logEvent } from '../telemetry';
import { initializeDeepLinking } from '../utils/deepLinking';
import { getOnboardingCompleted } from '../utils/storage';
import { useThemeContext } from '../theme/ThemeProvider';

export type TabKey = 'home' | 'accounts' | 'plan' | 'scenarios' | 'settings';
type AppState = 'loading' | 'onboarding' | 'app';

const Tab = createBottomTabNavigator();

function TabNavigator() {
  useEffect(() => {
    const cleanup = initializeDeepLinking((_screen: string, _params?: any) => {
      // Handle deep link navigation
    });

    return cleanup;
  }, []);

  // @ts-expect-error - React Navigation type compatibility
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      screenListeners={{
        tabPress: (e: { target?: unknown }) => {
          const name = (typeof e.target === 'string' ? e.target : '')
            .toString()
            .toLowerCase();
          // Fire telemetry per AC: nav_tab_click { tab }
          logEvent('nav_tab_click', { tab: name });
        },
      }}
    >
      <Tab.Screen name='Home' component={HomeScreen} />
      <Tab.Screen name='Accounts' component={AccountsScreen} />
      <Tab.Screen name='Plan' component={PlanScreen} />
      <Tab.Screen name='Scenarios' component={ScenariosScreen} />
      <Tab.Screen name='Settings' component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function LoadingScreen() {
  const { tokens } = useThemeContext();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: tokens.bg,
      }}
    >
      <Text style={{ color: tokens.text, fontSize: 18 }}>Loading...</Text>
    </View>
  );
}

export default function RootNavigator() {
  const [showPaywall, setShowPaywall] = useState(false);
  const [appState, setAppState] = useState<AppState>('loading');
  const mountedRef = useRef(true);
  const isDark = Appearance.getColorScheme() === 'dark';
  const navTheme = isDark ? DarkTheme : DefaultTheme;

  useLayoutEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const isCompleted = await getOnboardingCompleted();
        if (mountedRef.current) {
          if (isCompleted) {
            setAppState('app');
          } else {
            logEvent('onboarding_start');
            setAppState('onboarding');
          }
        }
      } catch {
        if (mountedRef.current) {
          logEvent('onboarding_start');
          setAppState('onboarding');
        }
      }
    };

    checkOnboardingStatus();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const isTestEnv =
      typeof jest !== 'undefined' || process.env.NODE_ENV === 'test';
    if (!isTestEnv) {
      const checkOnboardingStatus = async () => {
        try {
          const isCompleted = await getOnboardingCompleted();
          if (mountedRef.current) {
            if (isCompleted) {
              setAppState('app');
            } else {
              setAppState('onboarding');
            }
          }
        } catch {
          if (mountedRef.current) {
            setAppState('onboarding');
          }
        }
      };

      const interval = setInterval(checkOnboardingStatus, 1000);
      return () => clearInterval(interval);
    }

    return undefined;
  }, []);

  useEffect(() => {
    const cleanup = initializeDeepLinking((screen: string, _params?: any) => {
      // Handle deep link navigation
      if (screen === 'Paywall') {
        setShowPaywall(true);
      }
    });

    return cleanup;
  }, []);

  // Show paywall as overlay when requested
  if (showPaywall) {
    // @ts-expect-error - React Navigation type compatibility
    return (
      <NavigationContainer theme={navTheme}>
        <PaywallScreen />
      </NavigationContainer>
    );
  }

  // @ts-expect-error - React Navigation type compatibility
  return (
    <NavigationContainer theme={navTheme}>
      {appState === 'loading' && <LoadingScreen />}
      {appState === 'onboarding' && <OnboardingNavigator />}
      {appState === 'app' && <TabNavigator />}
    </NavigationContainer>
  );
}
