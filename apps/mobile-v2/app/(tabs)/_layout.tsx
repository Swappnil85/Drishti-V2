import React, { useCallback } from 'react';
import { Tabs, usePathname } from 'expo-router';
import { Platform } from 'react-native';
import { useThemeContext } from '../../src/theme/ThemeProvider';
import { logEvent } from '../../src/telemetry';

export default function TabsLayout() {
  const { tokens } = useThemeContext();
  const pathname = usePathname();

  const handleTabPress = useCallback((name: string) => {
    // Telemetry stub per scope
    logEvent('nav_tab_click', { tab: name.toLowerCase() });
  }, []);

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.primary,
        tabBarInactiveTintColor: tokens.textSecondary,
        tabBarStyle: {
          height: Platform.select({ ios: 56, android: 60, default: 56 }),
          paddingBottom: Platform.select({ ios: 8, android: 8, default: 8 }),
          paddingTop: 6,
          backgroundColor: tokens.bg,
          borderTopColor: tokens.border,
        },
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          href: '/(tabs)/home',
        }}
        listeners={{ tabPress: () => handleTabPress('home') }}
      />
      <Tabs.Screen
        name="accounts"
        options={{ title: 'Accounts', href: '/(tabs)/accounts' }}
        listeners={{ tabPress: () => handleTabPress('accounts') }}
      />
      <Tabs.Screen
        name="plan"
        options={{ title: 'Plan', href: '/(tabs)/plan' }}
        listeners={{ tabPress: () => handleTabPress('plan') }}
      />
      <Tabs.Screen
        name="scenarios"
        options={{ title: 'Scenarios', href: '/(tabs)/scenarios' }}
        listeners={{ tabPress: () => handleTabPress('scenarios') }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', href: '/(tabs)/settings' }}
        listeners={{ tabPress: () => handleTabPress('settings') }}
      />
    </Tabs>
  );
}

