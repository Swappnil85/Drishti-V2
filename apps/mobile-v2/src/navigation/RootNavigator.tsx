/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck - React Navigation type compatibility issues with React 18/19
// React import not required with react-jsx runtime

import { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { Appearance, View, Text, AppState } from 'react-native';
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
import AppLockScreen from '../screens/AppLockScreen';
import OnboardingNavigator from '../screens/onboarding/OnboardingNavigator';
import { logEvent } from '../telemetry';
import { initializeDeepLinking } from '../utils/deepLinking';
import { getOnboardingCompleted } from '../utils/storage';
import { useThemeContext } from '../theme/ThemeProvider';
import { securityService, AppLockState } from '../services/SecurityService';

export type TabKey = 'home' | 'accounts' | 'plan' | 'scenarios' | 'settings';
type AppNavigationState = 'loading' | 'onboarding' | 'app' | 'locked';

const Tab = createBottomTabNavigator();

function TabNavigator() {
  useEffect(() => {
    const cleanup = initializeDeepLinking((_screen: string, _params?: any) => {
      // Handle deep link navigation
    });

    return cleanup;
  }, []);

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
  const [appState, setAppState] = useState<AppNavigationState>('loading');
  const [_lockState, setLockState] = useState<AppLockState>(
    AppLockState.UNLOCKED
  );
  const mountedRef = useRef(true);
  const isDark = Appearance.getColorScheme() === 'dark';
  const navTheme = isDark ? DarkTheme : DefaultTheme;

  useLayoutEffect(() => {
    const initializeApp = async () => {
      try {
        // Check onboarding status first
        const isCompleted = await getOnboardingCompleted();

        if (!isCompleted) {
          if (mountedRef.current) {
            logEvent('onboarding_start');
            setAppState('onboarding');
          }
          return;
        }

        // Check if app should be locked
        const isAppLockEnabled = await securityService.isAppLockEnabled();
        const currentLockState = await securityService.getCurrentLockState();

        if (mountedRef.current) {
          if (isAppLockEnabled && currentLockState === AppLockState.LOCKED) {
            setAppState('locked');
            setLockState(AppLockState.LOCKED);
          } else {
            setAppState('app');
            setLockState(AppLockState.UNLOCKED);
          }
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        if (mountedRef.current) {
          logEvent('onboarding_start');
          setAppState('onboarding');
        }
      }
    };

    initializeApp();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Listen to security service lock state changes
  useEffect(() => {
    const handleLockStateChange = (newLockState: AppLockState) => {
      if (mountedRef.current) {
        setLockState(newLockState);

        if (newLockState === AppLockState.LOCKED) {
          setAppState('locked');
        } else if (
          newLockState === AppLockState.UNLOCKED &&
          appState === 'locked'
        ) {
          setAppState('app');
        }
      }
    };

    securityService.addLockStateListener(handleLockStateChange);

    return () => {
      securityService.removeLockStateListener(handleLockStateChange);
    };
  }, [appState]);

  // Handle app state changes for auto-lock
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === 'active' && appState === 'app') {
        // Check if we need to lock the app when coming back to foreground
        const isAppLockEnabled = await securityService.isAppLockEnabled();
        const currentLockState = await securityService.getCurrentLockState();

        if (isAppLockEnabled && currentLockState === AppLockState.LOCKED) {
          if (mountedRef.current) {
            setAppState('locked');
            setLockState(AppLockState.LOCKED);
          }
        }
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    return () => {
      subscription?.remove();
    };
  }, [appState]);

  useEffect(() => {
    const cleanup = initializeDeepLinking((screen: string, _params?: any) => {
      // Handle deep link navigation
      if (screen === 'Paywall') {
        setShowPaywall(true);
      }
    });

    return cleanup;
  }, []);

  // Handle app unlock
  const handleAppUnlock = async () => {
    try {
      await securityService.unlockApp();
      if (mountedRef.current) {
        setAppState('app');
        setLockState(AppLockState.UNLOCKED);
      }
    } catch (error) {
      console.error('Error unlocking app:', error);
    }
  };

  // Show paywall as overlay when requested
  if (showPaywall) {
    return (
      <NavigationContainer theme={navTheme}>
        <PaywallScreen />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {appState === 'loading' && <LoadingScreen />}
      {appState === 'onboarding' && <OnboardingNavigator />}
      {appState === 'locked' && <AppLockScreen onUnlock={handleAppUnlock} />}
      {appState === 'app' && <TabNavigator />}
    </NavigationContainer>
  );
}
