import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSecurityState } from '../state/security';
import { useThemeContext } from '../theme/ThemeProvider';
import {
  authenticateWithBiometrics,
  verifyPin,
  getLockoutRemainingTime,
} from '../utils/secureLock';

export default function LockScreen() {
  const { tokens } = useThemeContext();
  const insets = useSafeAreaInsets();
  const { settings, unlock, recordFailedPinAttempt, lockoutUntil } =
    useSecurityState();
  const [pin, setPin] = useState('');
  const [lockoutTime, setLockoutTime] = useState(0);

  useEffect(() => {
    if (lockoutUntil) {
      const interval = setInterval(() => {
        const remaining = getLockoutRemainingTime(lockoutUntil);
        if (remaining > 0) {
          setLockoutTime(remaining);
        } else {
          setLockoutTime(0);
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutUntil]);

  const handlePinUnlock = async () => {
    if (lockoutTime > 0) {
      Alert.alert(
        'Locked Out',
        `Too many failed attempts. Please try again in ${lockoutTime} seconds.`
      );
      return;
    }
    const isPinCorrect = await verifyPin(pin, settings.pin);
    if (isPinCorrect) {
      unlock('pin');
    } else {
      recordFailedPinAttempt();
      setPin('');
      Alert.alert('Invalid PIN', 'The PIN you entered is incorrect.');
    }
  };

  const handleBiometricUnlock = async () => {
    const result = await authenticateWithBiometrics();
    if (result.success) {
      unlock('biometric');
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: tokens.bg,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <Text style={[styles.title, { color: tokens.text }]}>Enter PIN</Text>
      <TextInput
        style={[
          styles.pinInput,
          { color: tokens.text, borderColor: tokens.border },
        ]}
        value={pin}
        onChangeText={setPin}
        keyboardType='numeric'
        secureTextEntry
        maxLength={6}
        placeholder='----'
        placeholderTextColor={tokens.textSecondary}
      />
      <Pressable
        style={[styles.button, { backgroundColor: tokens.primary }]}
        onPress={handlePinUnlock}
        disabled={lockoutTime > 0}
      >
        <Text style={[styles.buttonText, { color: tokens.bg }]}>
          {lockoutTime > 0 ? `Try again in ${lockoutTime}s` : 'Unlock'}
        </Text>
      </Pressable>
      {settings.biometricEnabled && (
        <Pressable
          style={styles.biometricButton}
          onPress={handleBiometricUnlock}
        >
          <Text
            style={{ color: tokens.primary, textDecorationLine: 'underline' }}
          >
            Use Biometrics
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  biometricButton: {
    marginTop: 20,
  },
  button: {
    borderRadius: 10,
    marginBottom: 20,
    paddingHorizontal: 40,
    paddingVertical: 15,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  pinInput: {
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 20,
    height: 50,
    marginBottom: 20,
    textAlign: 'center',
    width: '60%',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
  },
});
