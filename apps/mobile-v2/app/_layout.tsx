import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Slot, Redirect } from 'expo-router';

type Boot = 'loading' | 'onboarding' | 'app';

export default function RootLayout() {
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
    return () => { mounted = false; };
  }, []);

  if (boot === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (boot === 'onboarding') {
    return <Redirect href="/onboarding/welcome" />;
  }

  // boot === 'app'
  return <Slot />;
}

