import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Switch, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

type ReducedMotionMode = 'system' | 'on' | 'off';

async function read(key: string) { return (await AsyncStorage.getItem(key)) ?? ''; }
async function write(key: string, val: string) { await AsyncStorage.setItem(key, val); }

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const fg = dark ? '#FFFFFF' : '#0A0A0A';
  const bg = dark ? '#0B0F13' : '#FFFFFF';

  const [mode, setMode] = useState<ReducedMotionMode>('system');
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    (async () => {
      const m = (await read('prefs.reducedMotionMode')) as ReducedMotionMode;
      const eff = derive(m);
      setMode(m || 'system');
      setReduced(eff);
    })();
  }, []);

  function derive(m: ReducedMotionMode) {
    if (m === 'on') return true;
    if (m === 'off') return false;
    // system: RN web/native will supply; default false for demo
    return false;
  }

  async function setModeAndPersist(m: ReducedMotionMode) {
    setMode(m);
    setReduced(derive(m));
    await write('prefs.reducedMotionMode', m);
  }

  async function resetOnboarding() {
    await AsyncStorage.multiRemove(['onboarding.completed','onboarding.step','onboarding.progress']);
    setTimeout(() => router.replace('/onboarding/welcome'), 100);
  }

  async function resetAll() {
    await AsyncStorage.multiRemove([
      'onboarding.completed','onboarding.step','onboarding.progress',
      'prefs.reducedMotionMode','prefs.currency','prefs.themeMode','prefs.sampleData','prefs.privacyLocalOnly'
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: bg, padding: 24 }}>
      <Text style={{ color: fg, fontSize: 24, fontWeight: '600', marginBottom: 16 }}>Settings</Text>

      <Text style={{ color: fg, marginTop: 12, marginBottom: 6 }}>Reduced motion: {mode}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ color: fg, marginRight: 8 }}>Effective:</Text>
        <Switch value={reduced} onValueChange={(v) => setModeAndPersist(v ? 'on' : 'off')} />
      </View>

      <Pressable onPress={() => setModeAndPersist('system')}
        style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: fg, marginBottom: 10 }}>
        <Text style={{ color: fg }}>Use System</Text>
      </Pressable>
      <Pressable onPress={() => setModeAndPersist('off')}
        style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: fg, marginBottom: 10 }}>
        <Text style={{ color: fg }}>Default Animations (OFF)</Text>
      </Pressable>
      <Pressable onPress={() => setModeAndPersist('on')}
        style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: fg, marginBottom: 10 }}>
        <Text style={{ color: fg }}>Force Reduced Motion (ON)</Text>
      </Pressable>

      <View style={{ height: 24 }} />

      <Text style={{ color: fg, fontSize: 16, fontWeight: '600', marginBottom: 8 }}>QA / Debug</Text>
      <Pressable onPress={resetOnboarding}
        style={{ padding: 14, borderRadius: 12, backgroundColor: '#2E7D32', marginBottom: 10 }}>
        <Text style={{ color: '#FFFFFF', textAlign: 'center' }}>Reset Onboarding (QA)</Text>
      </Pressable>
      <Pressable onPress={resetAll}
        style={{ padding: 14, borderRadius: 12, backgroundColor: '#B71C1C' }}>
        <Text style={{ color: '#FFFFFF', textAlign: 'center' }}>Reset ALL Preferences (QA)</Text>
      </Pressable>
    </View>
  );
}

