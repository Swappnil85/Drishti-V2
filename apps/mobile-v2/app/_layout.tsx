// Node.js polyfills for Android compatibility (must be first)
import 'react-native-url-polyfill/auto';
import { Buffer } from 'buffer';
import process from 'process';

// Make polyfills globally available
if (typeof global !== 'undefined') {
  global.Buffer = Buffer;
  global.process = process;
}

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Slot, Redirect } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SecurityProvider, useSecurityState } from '../src/state/security';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import LockScreen from '../src/screens/LockScreen';

type Boot = 'loading' | 'onboarding' | 'app';

function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator />
    </View>
  );
}

function AppContent() {
  const { settings, isLocked, isLoaded } = useSecurityState();

  // Show loading while security settings are being loaded
  if (!isLoaded) {
    return <Loading />;
  }

  // Show LockScreen only when app lock is enabled AND the app is locked
  if (settings.appLockEnabled && isLocked) {
    return <LockScreen />;
  }

  // Always render Slot when onboarding is complete AND
  // (!appLockEnabled || (appLockEnabled && !isLocked))
  return <Slot />;
}

function BootLoader() {
  const [boot, setBoot] = useState<Boot>('loading');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const v = await AsyncStorage.getItem('onboarding.completed');
        if (!mounted) return;
        setBoot(v === '1' ? 'app' : 'onboarding');
      } catch {
        if (!mounted) return;
        setBoot('onboarding');
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (boot === 'loading') {
    return <Loading />;
  }

  if (boot === 'onboarding') {
    return <Redirect href='/onboarding/welcome' />;
  }

  // boot === 'app' - render app with security context
  return <AppContent />;
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <SecurityProvider>
          <BootLoader />
        </SecurityProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
