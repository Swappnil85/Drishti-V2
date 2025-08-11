/**
 * Biometric Setup Screen Component
 * Biometric authentication setup screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { AuthStackScreenProps } from '../../types/navigation';

type Props = AuthStackScreenProps<'BiometricSetup'>;

const BiometricSetupScreen: React.FC<Props> = ({ navigation }) => {
  const [biometricType, setBiometricType] = useState<string>('');
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      setIsAvailable(compatible && enrolled);

      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('Face ID');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('Fingerprint');
      } else {
        setBiometricType('Biometric');
      }
    } catch (error) {
      console.error('Error checking biometric availability:', error);
    }
  };

  const handleSetupBiometric = async () => {
    if (!isAvailable) {
      Alert.alert(
        'Biometric Not Available',
        'Biometric authentication is not available on this device'
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Set up ${biometricType} for Drishti`,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Password',
      });

      if (result.success) {
        Alert.alert(
          'Setup Complete',
          `${biometricType} has been set up successfully`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Setup Failed', 'Biometric setup was cancelled or failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to set up biometric authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    navigation.goBack();
  };

  const getBiometricIcon = () => {
    if (biometricType === 'Face ID') {
      return 'scan';
    } else if (biometricType === 'Fingerprint') {
      return 'finger-print';
    }
    return 'shield-checkmark';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={getBiometricIcon()}
            size={80}
            color="#007AFF"
          />
        </View>

        <Text style={styles.title}>Set Up {biometricType}</Text>
        <Text style={styles.subtitle}>
          Use {biometricType} to quickly and securely access your account
        </Text>

        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
            <Text style={styles.benefitText}>Quick and secure access</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
            <Text style={styles.benefitText}>No need to remember passwords</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
            <Text style={styles.benefitText}>Enhanced security</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.setupButton, (!isAvailable || isLoading) && styles.disabledButton]}
            onPress={handleSetupBiometric}
            disabled={!isAvailable || isLoading}
          >
            <Text style={styles.setupButtonText}>
              {isLoading ? 'Setting Up...' : `Set Up ${biometricType}`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip for Now</Text>
          </TouchableOpacity>
        </View>

        {!isAvailable && (
          <Text style={styles.unavailableText}>
            {biometricType} is not available on this device
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  benefitsList: {
    gap: 16,
    marginVertical: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 16,
    color: '#000000',
  },
  buttonContainer: {
    gap: 16,
    marginTop: 24,
  },
  setupButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  setupButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '500',
  },
  unavailableText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default BiometricSetupScreen;
