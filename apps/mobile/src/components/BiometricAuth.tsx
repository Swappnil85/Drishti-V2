import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useBiometric } from '../hooks/useBiometric';

const BiometricAuth: React.FC = () => {
  const {
    isAvailable,
    isEnabled,
    biometricTypes,
    isLoading,
    error,
    isLockedOut,
    remainingLockoutTime,
    checkAvailability,
    enableBiometric,
    disableBiometric,
    authenticate,
    getStoredCredentials,
    refreshLockoutStatus,
    getBiometricTypeName,
  } = useBiometric();

  const testCredentials = {
    email: 'test@example.com',
    token: 'test-jwt-token-12345',
  };

  const handleEnableBiometric = async () => {
    try {
      const result = await enableBiometric(testCredentials);

      if (result.success) {
        Alert.alert(
          'Success',
          `${getBiometricTypeName(result.biometricType!)} authentication enabled successfully!`
        );
      } else {
        Alert.alert(
          'Error',
          result.error || 'Failed to enable biometric authentication'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleDisableBiometric = async () => {
    Alert.alert(
      'Disable Biometric Authentication',
      'Are you sure you want to disable biometric authentication?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            try {
              await disableBiometric();
              Alert.alert('Success', 'Biometric authentication disabled');
            } catch (error) {
              Alert.alert(
                'Error',
                'Failed to disable biometric authentication'
              );
            }
          },
        },
      ]
    );
  };

  const handleAuthenticate = async () => {
    try {
      const result = await authenticate('Authenticate to access your account');

      if (result.success) {
        Alert.alert(
          'Authentication Successful',
          `Welcome back! Authenticated with ${getBiometricTypeName(result.biometricType!)}`
        );
      } else if (result.fallbackToCredentials) {
        Alert.alert(
          'Fallback Authentication',
          'User chose to use password instead of biometrics'
        );
      } else {
        Alert.alert(
          'Authentication Failed',
          result.error || 'Authentication failed'
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'An unexpected error occurred during authentication'
      );
    }
  };

  const handleGetStoredCredentials = async () => {
    try {
      const credentials = await getStoredCredentials();

      if (credentials) {
        Alert.alert(
          'Stored Credentials',
          `Email: ${credentials.email}\nToken: ${credentials.token.substring(0, 20)}...`
        );
      } else {
        Alert.alert('No Credentials', 'No credentials are stored');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to retrieve stored credentials');
    }
  };

  const renderBiometricTypes = () => {
    if (biometricTypes.length === 0) {
      return <Text style={styles.infoText}>No biometric types available</Text>;
    }

    return (
      <View style={styles.biometricTypesContainer}>
        <Text style={styles.sectionTitle}>Available Biometric Types:</Text>
        {biometricTypes.map((type, index) => (
          <Text key={index} style={styles.biometricType}>
            • {getBiometricTypeName(type)}
          </Text>
        ))}
      </View>
    );
  };

  const renderLockoutStatus = () => {
    if (!isLockedOut) return null;

    return (
      <View style={styles.lockoutContainer}>
        <Text style={styles.lockoutTitle}>🔒 Account Locked</Text>
        <Text style={styles.lockoutText}>
          Too many failed attempts. Try again in {remainingLockoutTime} minutes.
        </Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={refreshLockoutStatus}
        >
          <Text style={styles.refreshButtonText}>Refresh Status</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#007bff' />
        <Text style={styles.loadingText}>
          Checking biometric availability...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Biometric Authentication</Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {renderLockoutStatus()}

      <View style={styles.statusContainer}>
        <Text style={styles.sectionTitle}>Status</Text>
        <Text style={styles.statusText}>
          Available: {isAvailable ? '✅ Yes' : '❌ No'}
        </Text>
        <Text style={styles.statusText}>
          Enabled: {isEnabled ? '✅ Yes' : '❌ No'}
        </Text>
        <Text style={styles.statusText}>
          Locked Out: {isLockedOut ? '🔒 Yes' : '✅ No'}
        </Text>
      </View>

      {renderBiometricTypes()}

      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Actions</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={checkAvailability}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Check Availability</Text>
        </TouchableOpacity>

        {isAvailable && !isEnabled && (
          <TouchableOpacity
            style={[styles.button, styles.enableButton]}
            onPress={handleEnableBiometric}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Enable Biometric Auth</Text>
          </TouchableOpacity>
        )}

        {isEnabled && (
          <>
            <TouchableOpacity
              style={[styles.button, styles.authenticateButton]}
              onPress={handleAuthenticate}
              disabled={isLoading || isLockedOut}
            >
              <Text style={styles.buttonText}>
                {isLockedOut ? 'Locked Out' : 'Authenticate'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.credentialsButton]}
              onPress={handleGetStoredCredentials}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Get Stored Credentials</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.disableButton]}
              onPress={handleDisableBiometric}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Disable Biometric Auth</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.sectionTitle}>Information</Text>
        <Text style={styles.infoText}>
          • Biometric authentication provides secure and convenient access to
          your account
        </Text>
        <Text style={styles.infoText}>
          • Your credentials are stored securely using device encryption
        </Text>
        <Text style={styles.infoText}>
          • After 5 failed attempts, the app will be locked for 30 minutes
        </Text>
        <Text style={styles.infoText}>
          • You can always fall back to password authentication
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  lockoutContainer: {
    backgroundColor: '#fff3e0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  lockoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e65100',
    marginBottom: 8,
  },
  lockoutText: {
    fontSize: 14,
    color: '#e65100',
    marginBottom: 12,
  },
  refreshButton: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  biometricTypesContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  actionsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoContainer: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  statusText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
  biometricType: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#1976d2',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  enableButton: {
    backgroundColor: '#28a745',
  },
  authenticateButton: {
    backgroundColor: '#17a2b8',
  },
  credentialsButton: {
    backgroundColor: '#6c757d',
  },
  disableButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BiometricAuth;
