// React import not required with react-jsx runtime

import { useEffect, useState } from 'react';
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
  const isDark = Appearance.getColorScheme() === 'dark';
  const navTheme = isDark ? DarkTheme : DefaultTheme;

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const isCompleted = await getOnboardingCompleted();
        if (isCompleted) {
          setAppState('app');
        } else {
          logEvent('onboarding_start');
          setAppState('onboarding');
        }
      } catch {
        logEvent('onboarding_start');
        setAppState('onboarding');
      }
    };

    checkOnboardingStatus();

    const interval = setInterval(checkOnboardingStatus, 1000);
    return () => clearInterval(interval);
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
      {appState === 'app' && <TabNavigator />}
    </NavigationContainer>
  );
}
