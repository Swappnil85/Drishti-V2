import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export default function Welcome() {
  const [step, setStep] = useState(1);

  async function next() {
    if (step < 5) {
      setStep(step + 1);
      return;
    }
    await AsyncStorage.setItem('onboarding.completed', '1');
    router.replace('/(tabs)');
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: '600', marginBottom: 8 }}>Welcome</Text>
      <Text style={{ fontSize: 16, marginBottom: 24 }}>Step {step} of 5</Text>
      <Pressable onPress={next}
        style={{ padding: 14, borderRadius: 12, backgroundColor: '#1565C0' }}>
        <Text style={{ color: '#FFFFFF' }}>{step < 5 ? 'Get Started' : 'Finish'}</Text>
      </Pressable>
    </View>
  );
}

