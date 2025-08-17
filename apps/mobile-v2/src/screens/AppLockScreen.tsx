import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '../theme/ThemeProvider';
import { securityService, AppLockState } from '../services/SecurityService';
import { biometricService } from '../services/BiometricService';
import { pinService } from '../services/PinService';
import { logEvent } from '../telemetry';
import { useHaptics } from '../utils/haptics';
import {
  touchTargetStyle,
  buttonA11yProps,
  textInputA11yProps,
} from '../utils/accessibility';

interface AppLockScreenProps {
  onUnlock: () => void;
}

export default function AppLockScreen({ onUnlock }: AppLockScreenProps) {
  const { tokens } = useThemeContext();
  const insets = useSafeAreaInsets();
  const { light: safeImpactLight } = useHaptics();

  const [lockState, setLockState] = useState<AppLockState>(AppLockState.LOCKED);
  const [showPinInput, setShowPinInput] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    try {
      setLoading(true);

      // Check what authentication methods are available
      const [biometricEnabled, pinEnabledCheck] = await Promise.all([
        biometricService.isBiometricEnabled(),
        pinService.isPinEnabled(),
      ]);

      setBiometricAvailable(biometricEnabled);
      setPinEnabled(pinEnabledCheck);

      // If biometric is available, try to authenticate immediately
      if (biometricEnabled) {
        handleBiometricAuth();
      } else if (pinEnabledCheck) {
        // Show PIN input if only PIN is available
        setShowPinInput(true);
      } else {
        // No authentication method available, unlock immediately
        handleUnlock();
      }
    } catch (error) {
      console.error('Error initializing app lock screen:', error);
      setError('Failed to initialize authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      setLockState(AppLockState.AUTHENTICATING);
      setError('');

      const result = await securityService.authenticate();

      if (result.success) {
        handleUnlock();
      } else {
        setLockState(AppLockState.LOCKED);

        if (result.fallbackAvailable) {
          // Show PIN input as fallback
          setShowPinInput(true);
          setError('');
        } else {
          setError(result.error || 'Authentication failed');
        }
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      setLockState(AppLockState.LOCKED);
      setError('Authentication failed');
    }
  };

  const handlePinSubmit = async () => {
    if (!pin || pin.length < 4) {
      setError('Please enter your PIN');
      return;
    }

    try {
      safeImpactLight();
      setError('');

      const result = await securityService.authenticateWithPin(pin);

      if (result.success) {
        handleUnlock();
      } else {
        setError(result.error || 'Incorrect PIN');
        setPin(''); // Clear PIN input on failure
      }
    } catch (error) {
      console.error('PIN authentication error:', error);
      setError('Authentication failed');
      setPin('');
    }
  };

  const handleUnlock = () => {
    safeImpactLight();
    logEvent('app_unlocked');
    onUnlock();
  };

  const handleRetryBiometric = () => {
    safeImpactLight();
    setShowPinInput(false);
    setError('');
    handleBiometricAuth();
  };

  const handleUsePinInstead = () => {
    safeImpactLight();
    setShowPinInput(true);
    setError('');
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: tokens.bg,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }}
      >
        <Text style={{ color: tokens.text, fontSize: 16 }}>
          Initializing security...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: tokens.bg,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left + 24,
        paddingRight: insets.right + 24,
      }}
    >
      {/* App Logo/Title */}
      <View style={{ alignItems: 'center', marginBottom: 48 }}>
        <Text
          style={{
            fontSize: 32,
            fontWeight: '700',
            color: tokens.primary,
            marginBottom: 8,
          }}
        >
          Drishti
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: tokens.textSecondary,
            textAlign: 'center',
          }}
        >
          Your financial data is protected
        </Text>
      </View>

      {/* Authentication Content */}
      <View style={{ width: '100%', maxWidth: 320, alignItems: 'center' }}>
        {showPinInput ? (
          // PIN Input Mode
          <>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: tokens.text,
                marginBottom: 24,
                textAlign: 'center',
              }}
            >
              Enter your PIN
            </Text>

            <TextInput
              {...textInputA11yProps}
              accessibilityLabel='PIN input'
              accessibilityHint='Enter your 4-6 digit PIN to unlock the app'
              value={pin}
              onChangeText={setPin}
              placeholder='Enter PIN'
              placeholderTextColor={tokens.textMuted}
              secureTextEntry
              keyboardType='numeric'
              maxLength={6}
              autoFocus
              onSubmitEditing={handlePinSubmit}
              style={{
                width: '100%',
                height: 56,
                borderWidth: 1,
                borderColor: error ? tokens.critical : tokens.border,
                borderRadius: 12,
                paddingHorizontal: 16,
                fontSize: 18,
                color: tokens.text,
                backgroundColor: tokens.surface,
                textAlign: 'center',
                letterSpacing: 4,
                marginBottom: 16,
              }}
            />

            <Pressable
              {...buttonA11yProps}
              accessibilityLabel='Unlock with PIN'
              onPress={handlePinSubmit}
              style={[
                touchTargetStyle,
                {
                  width: '100%',
                  backgroundColor: tokens.primary,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                },
              ]}
            >
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: '600',
                }}
              >
                Unlock
              </Text>
            </Pressable>

            {biometricAvailable && (
              <Pressable
                {...buttonA11yProps}
                accessibilityLabel='Use biometric authentication instead'
                onPress={handleRetryBiometric}
                style={[
                  touchTargetStyle,
                  {
                    width: '100%',
                    borderWidth: 1,
                    borderColor: tokens.border,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                ]}
              >
                <Text
                  style={{
                    color: tokens.primary,
                    fontSize: 16,
                    fontWeight: '600',
                  }}
                >
                  Use Biometric Instead
                </Text>
              </Pressable>
            )}
          </>
        ) : (
          // Biometric Mode
          <>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: tokens.text,
                marginBottom: 32,
                textAlign: 'center',
              }}
            >
              {lockState === AppLockState.AUTHENTICATING
                ? 'Authenticating...'
                : 'Unlock Drishti'}
            </Text>

            {lockState !== AppLockState.AUTHENTICATING && (
              <>
                <Pressable
                  {...buttonA11yProps}
                  accessibilityLabel='Unlock with biometric authentication'
                  onPress={handleBiometricAuth}
                  style={[
                    touchTargetStyle,
                    {
                      width: '100%',
                      backgroundColor: tokens.primary,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize: 16,
                      fontWeight: '600',
                    }}
                  >
                    Unlock with Biometric
                  </Text>
                </Pressable>

                {pinEnabled && (
                  <Pressable
                    {...buttonA11yProps}
                    accessibilityLabel='Use PIN instead'
                    onPress={handleUsePinInstead}
                    style={[
                      touchTargetStyle,
                      {
                        width: '100%',
                        borderWidth: 1,
                        borderColor: tokens.border,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: tokens.primary,
                        fontSize: 16,
                        fontWeight: '600',
                      }}
                    >
                      Use PIN Instead
                    </Text>
                  </Pressable>
                )}
              </>
            )}
          </>
        )}

        {/* Error Message */}
        {error && (
          <Text
            style={{
              color: tokens.critical,
              fontSize: 14,
              textAlign: 'center',
              marginTop: 16,
              lineHeight: 20,
            }}
            accessibilityRole='alert'
          >
            {error}
          </Text>
        )}
      </View>
    </View>
  );
}
