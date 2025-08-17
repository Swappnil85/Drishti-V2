// React import not required with react-jsx runtime

import { useEffect, useState, useRef } from 'react';
import { Appearance, View, Text } from 'react-native';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
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
const Stack = createStackNavigator();

function TabNavigator() {
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    const cleanup = initializeDeepLinking((screen: string, params?: any) => {
      // Handle deep link navigation
      if (screen === 'Accounts') {
        // Navigate to Accounts tab
        if (navigationRef.current) {
          navigationRef.current.navigate('Accounts', params);
        }
      }
    });

    return cleanup;
  }, []);

  return (
    <Tab.Navigator
      ref={navigationRef}
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
    const cleanup = initializeDeepLinking((screen: string, params?: any) => {
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
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {appState === 'loading' && (
          <Stack.Screen name="Loading" component={LoadingScreen} />
        )}
        {appState === 'onboarding' && (
          <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        )}
        {appState === 'app' && (
          <Stack.Screen name="Main" component={TabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
