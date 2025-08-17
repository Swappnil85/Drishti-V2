// React import not required with react-jsx runtime

import { useEffect, useState, useRef } from 'react';
import { Appearance } from 'react-native';
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
import OnboardingScreen from '../screens/OnboardingScreen';
import { logEvent } from '../telemetry';
import { initializeDeepLinking } from '../utils/deepLinking';
import { useOnboarding } from '../contexts/OnboardingContext';

export type TabKey = 'home' | 'accounts' | 'plan' | 'scenarios' | 'settings';

const Tab = createBottomTabNavigator();

export default function RootNavigator() {
  const [showPaywall, setShowPaywall] = useState(false);
  const navigationRef = useRef<any>(null);
  const isDark = Appearance.getColorScheme() === 'dark';
  const navTheme = isDark ? DarkTheme : DefaultTheme;
  const { hasCompletedOnboarding, isLoading } = useOnboarding();

  useEffect(() => {
    const cleanup = initializeDeepLinking((screen: string, params?: any) => {
      // Handle deep link navigation
      if (screen === 'Paywall') {
        setShowPaywall(true);
      } else if (screen === 'Accounts') {
        setShowPaywall(false);
        // Navigate to Accounts tab
        if (navigationRef.current) {
          navigationRef.current.navigate('Accounts', params);
        }
      }
    });

    return cleanup;
  }, []);

  // Show onboarding if not completed
  if (!isLoading && !hasCompletedOnboarding) {
    return (
      <NavigationContainer theme={navTheme}>
        <OnboardingScreen />
      </NavigationContainer>
    );
  }

  // Show paywall as overlay when requested
  if (showPaywall) {
    return (
      <NavigationContainer theme={navTheme}>
        <PaywallScreen />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer theme={navTheme} ref={navigationRef}>
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
    </NavigationContainer>
  );
}
