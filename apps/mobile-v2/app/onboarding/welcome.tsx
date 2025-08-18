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
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: '600',
          marginBottom: 8,
          color: '#0B1221',
        }}
      >
        Welcome
      </Text>
      <Text style={{ fontSize: 16, marginBottom: 24, color: '#6C757D' }}>
        Step {step} of 5
      </Text>
      <Pressable
        onPress={next}
        accessibilityRole='button'
        accessibilityLabel={
          step < 5 ? 'Continue to next step' : 'Complete onboarding'
        }
        style={{
          padding: 16,
          borderRadius: 12,
          backgroundColor: '#1565C0',
          minHeight: 44, // WCAG AA touch target
          minWidth: 120,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
          {step < 5 ? 'Get Started' : 'Finish'}
        </Text>
      </Pressable>
    </View>
  );
}
