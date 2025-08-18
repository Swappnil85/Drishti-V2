import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Switch,
  useColorScheme,
  Alert,
  AccessibilityInfo,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

type ReducedMotionMode = 'system' | 'on' | 'off';

async function read(key: string) {
  return (await AsyncStorage.getItem(key)) ?? '';
}
async function write(key: string, val: string) {
  await AsyncStorage.setItem(key, val);
}

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  // WCAG AA compliant colors (contrast ratio ≥4.5:1)
  const fg = dark ? '#F9FAFB' : '#0B1221'; // 16.8:1 contrast
  const fgMuted = dark ? '#D1D5DB' : '#6C757D'; // 11.2:1 / 5.7:1 contrast
  const bg = dark ? '#0B1221' : '#FFFFFF';

  const [mode, setMode] = useState<ReducedMotionMode>('system');
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    (async () => {
      const m = (await read('prefs.reducedMotionMode')) as ReducedMotionMode;
      const eff = await derive(m);
      setMode(m || 'system');
      setReduced(eff);
    })();
  }, []);

  async function derive(m: ReducedMotionMode): Promise<boolean> {
    if (m === 'on') return true;
    if (m === 'off') return false;
    // system: Check OS reduced motion preference
    try {
      return await AccessibilityInfo.isReduceMotionEnabled();
    } catch {
      return false; // fallback for web or unsupported platforms
    }
  }

  async function setModeAndPersist(m: ReducedMotionMode) {
    setMode(m);
    const eff = await derive(m);
    setReduced(eff);
    await write('prefs.reducedMotionMode', m);
  }

  async function resetOnboarding() {
    try {
      await AsyncStorage.multiRemove([
        'onboarding.completed',
        'onboarding.step',
        'onboarding.progress',
      ]);
      setTimeout(() => router.replace('/onboarding/welcome'), 100);
    } catch (error) {
      Alert.alert('Error', 'Failed to reset onboarding. Please try again.');
    }
  }

  function confirmResetAll() {
    Alert.alert(
      'Reset ALL Preferences',
      'This will clear all app data including onboarding, settings, and preferences. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset ALL', style: 'destructive', onPress: resetAll },
      ]
    );
  }

  async function resetAll() {
    try {
      await AsyncStorage.multiRemove([
        'onboarding.completed',
        'onboarding.step',
        'onboarding.progress',
        'prefs.reducedMotionMode',
        'prefs.currency',
        'prefs.themeMode',
        'prefs.sampleData',
        'prefs.privacyLocalOnly',
      ]);
      Alert.alert('Success', 'All preferences have been reset.');
    } catch (error) {
      Alert.alert('Error', 'Failed to reset preferences. Please try again.');
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: bg, padding: 24 }}>
      <Text
        style={{ color: fg, fontSize: 24, fontWeight: '600', marginBottom: 16 }}
      >
        Settings
      </Text>

      <Text
        style={{
          color: fg,
          fontSize: 18,
          fontWeight: '600',
          marginTop: 24,
          marginBottom: 12,
        }}
      >
        Reduced Motion
      </Text>
      <Text style={{ color: fgMuted, marginBottom: 6 }}>
        Current mode: {mode} • Effective: {reduced ? 'ON' : 'OFF'}
      </Text>

      <Pressable
        onPress={() => setModeAndPersist('system')}
        accessibilityRole='button'
        accessibilityLabel='Use system reduced motion setting'
        style={{
          padding: 16,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: mode === 'system' ? '#2563EB' : fgMuted,
          backgroundColor:
            mode === 'system' ? (dark ? '#1E3A8A' : '#EBF4FF') : 'transparent',
          marginBottom: 12,
          minHeight: 44, // WCAG AA touch target
        }}
      >
        <Text
          style={{
            color: mode === 'system' ? '#2563EB' : fg,
            fontWeight: mode === 'system' ? '600' : '400',
          }}
        >
          System {mode === 'system' ? '✓' : ''}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => setModeAndPersist('off')}
        accessibilityRole='button'
        accessibilityLabel='Disable reduced motion'
        style={{
          padding: 16,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: mode === 'off' ? '#2563EB' : fgMuted,
          backgroundColor:
            mode === 'off' ? (dark ? '#1E3A8A' : '#EBF4FF') : 'transparent',
          marginBottom: 12,
          minHeight: 44,
        }}
      >
        <Text
          style={{
            color: mode === 'off' ? '#2563EB' : fg,
            fontWeight: mode === 'off' ? '600' : '400',
          }}
        >
          Off {mode === 'off' ? '✓' : ''}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => setModeAndPersist('on')}
        accessibilityRole='button'
        accessibilityLabel='Enable reduced motion'
        style={{
          padding: 16,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: mode === 'on' ? '#2563EB' : fgMuted,
          backgroundColor:
            mode === 'on' ? (dark ? '#1E3A8A' : '#EBF4FF') : 'transparent',
          marginBottom: 12,
          minHeight: 44,
        }}
      >
        <Text
          style={{
            color: mode === 'on' ? '#2563EB' : fg,
            fontWeight: mode === 'on' ? '600' : '400',
          }}
        >
          On {mode === 'on' ? '✓' : ''}
        </Text>
      </Pressable>

      <View style={{ height: 24 }} />

      <Text
        style={{
          color: fg,
          fontSize: 18,
          fontWeight: '600',
          marginTop: 24,
          marginBottom: 12,
        }}
      >
        QA Tools
      </Text>
      <Text style={{ color: fgMuted, marginBottom: 16 }}>
        Development and testing utilities
      </Text>
      <Pressable
        onPress={resetOnboarding}
        accessibilityRole='button'
        accessibilityLabel='Reset onboarding progress for testing'
        style={{
          padding: 16,
          borderRadius: 12,
          backgroundColor: '#2E7D32',
          marginBottom: 12,
          minHeight: 44,
        }}
      >
        <Text
          style={{ color: '#FFFFFF', textAlign: 'center', fontWeight: '600' }}
        >
          Reset Onboarding (QA)
        </Text>
      </Pressable>
      <Pressable
        onPress={confirmResetAll}
        accessibilityRole='button'
        accessibilityLabel='Reset all app preferences and data'
        style={{
          padding: 16,
          borderRadius: 12,
          backgroundColor: '#B71C1C',
          minHeight: 44,
        }}
      >
        <Text
          style={{ color: '#FFFFFF', textAlign: 'center', fontWeight: '600' }}
        >
          Reset ALL Preferences (QA)
        </Text>
      </Pressable>
    </View>
  );
}
