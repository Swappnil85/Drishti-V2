// React import not required with react-jsx runtime
import { View, Text, Pressable, Alert, ScrollView, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '../theme/ThemeProvider';
import {
  clearOnboardingState,
  clearAllPreferences,
  getPrivacyModeEnabled,
  setPrivacyModeEnabled,
} from '../utils/storage';
import { logEvent } from '../telemetry';
import { useEffect, useState } from 'react';
import { securityService } from '../services/SecurityService';
import { biometricService } from '../services/BiometricService';
import { useHaptics } from '../utils/haptics';

type BtnProps = {
  label: string;
  onPress: () => void;
  active?: boolean;
  destructive?: boolean;
};

const Btn = ({ label, onPress, active, destructive }: BtnProps) => {
  const { tokens } = useThemeContext();

  return (
    <Pressable
      accessibilityRole='button'
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginVertical: 6,
        minWidth: 200,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: active
          ? tokens.primary
          : destructive
            ? tokens.critical
            : tokens.border,
        backgroundColor: active ? tokens.surface : tokens.bg,
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          fontSize: 16,
          color: active
            ? tokens.primary
            : destructive
              ? tokens.critical
              : tokens.text,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
};

export default function SettingsScreen() {
  const {
    mode,
    reducedMotion,
    reducedMotionOverride,
    setMode,
    setReducedMotionOverride,
    tokens,
  } = useThemeContext();
  const insets = useSafeAreaInsets();
  const { light: safeImpactLight } = useHaptics();

  // Privacy and Security state
  const [privacyModeEnabled, setPrivacyModeEnabledState] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [appLockEnabled, setAppLockEnabled] = useState(false);
  const [autoLockTimeout, setAutoLockTimeoutState] = useState(5);
  const [loading, setLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);

      // Load privacy mode
      const privacyMode = await getPrivacyModeEnabled();
      setPrivacyModeEnabledState(privacyMode);

      // Load security settings
      const securitySettings = await securityService.getSecuritySettings();
      setAppLockEnabled(securitySettings.appLockEnabled);
      setBiometricEnabled(securitySettings.biometricEnabled);
      setPinEnabled(securitySettings.pinEnabled);
      setAutoLockTimeoutState(securitySettings.autoLockTimeout);

      // Check biometric availability
      const biometricAvailability =
        await biometricService.checkBiometricAvailability();
      setBiometricAvailable(biometricAvailability.isAvailable);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Privacy Mode handlers
  const handlePrivacyModeToggle = async (enabled: boolean) => {
    try {
      safeImpactLight();

      if (enabled) {
        // Show confirmation dialog when enabling privacy mode
        Alert.alert(
          'Enable Privacy Mode',
          'Privacy Mode stores all your data locally on this device only. Cloud sync will be disabled. For enhanced security, we recommend enabling app lock with PIN or biometric authentication.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Enable',
              onPress: async () => {
                await setPrivacyModeEnabled(enabled);
                setPrivacyModeEnabledState(enabled);
                logEvent('privacy_local_only_enabled', { enabled });
              },
            },
          ]
        );
      } else {
        await setPrivacyModeEnabled(enabled);
        setPrivacyModeEnabledState(enabled);
        logEvent('privacy_local_only_enabled', { enabled });
      }
    } catch (error) {
      console.error('Error toggling privacy mode:', error);
      Alert.alert('Error', 'Failed to update privacy mode setting');
    }
  };

  const handlePrivacyStatementPress = () => {
    safeImpactLight();
    // In a real app, this would open the privacy statement
    // For now, we'll show a placeholder
    Alert.alert(
      'Privacy Statement',
      'Your privacy is important to us. When Privacy Mode is enabled, all your financial data is stored locally on your device and never sent to our servers. This ensures maximum privacy and security for your sensitive information.',
      [{ text: 'OK' }]
    );
  };

  // Security handlers
  const handleBiometricToggle = async (enabled: boolean) => {
    try {
      safeImpactLight();

      if (enabled) {
        const result = await biometricService.enableBiometric();
        if (result.success) {
          setBiometricEnabled(true);
          Alert.alert('Success', 'Biometric authentication has been enabled');
        } else {
          Alert.alert(
            'Error',
            result.error || 'Failed to enable biometric authentication'
          );
        }
      } else {
        await biometricService.disableBiometric();
        setBiometricEnabled(false);
        Alert.alert('Success', 'Biometric authentication has been disabled');
      }
    } catch (error) {
      console.error('Error toggling biometric:', error);
      Alert.alert('Error', 'Failed to update biometric setting');
    }
  };

  const handleSetupPin = () => {
    safeImpactLight();
    Alert.alert(
      'Setup PIN',
      'PIN setup functionality will be implemented in a future update. For now, this is a placeholder.',
      [{ text: 'OK' }]
    );
  };

  const handleAppLockToggle = async (enabled: boolean) => {
    try {
      safeImpactLight();

      if (enabled) {
        // Check if at least one auth method is available
        if (!biometricEnabled && !pinEnabled) {
          Alert.alert(
            'Authentication Required',
            'Please enable biometric authentication or set up a PIN before enabling app lock.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      await securityService.setAppLockEnabled(enabled);
      setAppLockEnabled(enabled);

      Alert.alert(
        'Success',
        enabled ? 'App lock has been enabled' : 'App lock has been disabled'
      );
    } catch (error) {
      console.error('Error toggling app lock:', error);
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Failed to update app lock setting'
      );
    }
  };

  const handleAutoLockTimeoutChange = () => {
    safeImpactLight();
    Alert.alert(
      'Auto-lock Timeout',
      'Choose when the app should automatically lock after inactivity:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '1 minute', onPress: () => updateAutoLockTimeout(1) },
        { text: '5 minutes', onPress: () => updateAutoLockTimeout(5) },
        { text: '10 minutes', onPress: () => updateAutoLockTimeout(10) },
      ]
    );
  };

  const updateAutoLockTimeout = async (minutes: number) => {
    try {
      await securityService.setAutoLockTimeout(minutes);
      setAutoLockTimeoutState(minutes);
      Alert.alert(
        'Success',
        `Auto-lock timeout set to ${minutes} minute${minutes > 1 ? 's' : ''}`
      );
    } catch (error) {
      console.error('Error updating auto-lock timeout:', error);
      Alert.alert('Error', 'Failed to update auto-lock timeout');
    }
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      'Reset Onboarding',
      'This will clear your onboarding progress. The onboarding will show on next app launch.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await clearOnboardingState();
            logEvent('qa_reset_onboarding');
            Alert.alert('Success', 'Onboarding will show on next launch');
          },
        },
      ]
    );
  };

  const handleResetAllPreferences = () => {
    Alert.alert(
      'Reset ALL Preferences',
      'This will clear all your preferences including theme, onboarding, and other settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset All',
          style: 'destructive',
          onPress: async () => {
            await clearAllPreferences();
            logEvent('qa_reset_all_preferences');
            Alert.alert('Success', 'All preferences have been reset');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: tokens.bg,
        }}
      >
        <Text style={{ color: tokens.text }}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: tokens.bg,
      }}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 16,
        paddingLeft: insets.left + 16,
        paddingRight: insets.right + 16,
        alignItems: 'center',
      }}
    >
      <Text
        accessibilityRole='header'
        style={{
          fontSize: 24,
          marginBottom: 24,
          color: tokens.text,
          fontWeight: '600',
        }}
      >
        Settings
      </Text>

      {/* Privacy & Security Section */}
      <View style={{ width: '100%', maxWidth: 400, marginBottom: 32 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            marginBottom: 16,
            color: tokens.text,
            textAlign: 'center',
          }}
        >
          Privacy & Security
        </Text>

        {/* Privacy Mode Toggle */}
        <View
          style={{
            backgroundColor: tokens.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: tokens.border,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: tokens.text,
                flex: 1,
              }}
            >
              Privacy Mode
            </Text>
            <Switch
              value={privacyModeEnabled}
              onValueChange={handlePrivacyModeToggle}
              accessibilityLabel='Privacy Mode toggle'
              accessibilityHint='Stores data locally on device only when enabled'
            />
          </View>
          <Text
            style={{
              fontSize: 14,
              color: tokens.textSecondary,
              marginBottom: 12,
              lineHeight: 20,
            }}
          >
            When enabled, all your data is stored locally on this device only.
            Cloud sync is disabled for maximum privacy.
          </Text>
          <Pressable
            onPress={handlePrivacyStatementPress}
            accessibilityRole='button'
            accessibilityLabel='View Privacy Statement'
            style={{
              alignSelf: 'flex-start',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: tokens.primary,
                textDecorationLine: 'underline',
              }}
            >
              View Privacy Statement
            </Text>
          </Pressable>
        </View>

        {/* Security Settings */}
        <View
          style={{
            backgroundColor: tokens.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: tokens.border,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: tokens.text,
              marginBottom: 16,
            }}
          >
            Security Settings
          </Text>

          {/* App Lock Toggle */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                color: tokens.text,
                flex: 1,
              }}
            >
              App Lock
            </Text>
            <Switch
              value={appLockEnabled}
              onValueChange={handleAppLockToggle}
              accessibilityLabel='App Lock toggle'
              accessibilityHint='Requires authentication to unlock the app'
            />
          </View>

          {/* Biometric Authentication */}
          {biometricAvailable && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  color: tokens.text,
                  flex: 1,
                }}
              >
                Biometric Authentication
              </Text>
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                accessibilityLabel='Biometric authentication toggle'
                accessibilityHint='Use fingerprint or face recognition to unlock'
              />
            </View>
          )}

          {/* PIN Setup */}
          <Pressable
            onPress={handleSetupPin}
            accessibilityRole='button'
            accessibilityLabel='Setup PIN'
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 8,
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                color: tokens.text,
                flex: 1,
              }}
            >
              PIN Setup
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: tokens.textSecondary,
              }}
            >
              {pinEnabled ? 'Enabled' : 'Not Set'} →
            </Text>
          </Pressable>

          {/* Auto-lock Timeout */}
          {appLockEnabled && (
            <Pressable
              onPress={handleAutoLockTimeoutChange}
              accessibilityRole='button'
              accessibilityLabel='Auto-lock timeout setting'
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  color: tokens.text,
                  flex: 1,
                }}
              >
                Auto-lock Timeout
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: tokens.textSecondary,
                }}
              >
                {autoLockTimeout} min →
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Theme Section */}
      <View style={{ width: '100%', maxWidth: 400, marginBottom: 32 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            marginBottom: 8,
            color: tokens.text,
            textAlign: 'center',
          }}
        >
          Theme
        </Text>
        <Text
          accessibilityLabel='theme-mode-label'
          style={{
            color: tokens.textSecondary,
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          Current: {mode}
        </Text>

        <Btn
          label='Use System'
          onPress={() => setMode('system')}
          active={mode === 'system'}
        />
        <Btn
          label='Light Mode'
          onPress={() => setMode('light')}
          active={mode === 'light'}
        />
        <Btn
          label='Dark Mode'
          onPress={() => setMode('dark')}
          active={mode === 'dark'}
        />
      </View>

      {/* Motion Section */}
      <View style={{ width: '100%', maxWidth: 400, marginBottom: 32 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            marginBottom: 8,
            color: tokens.text,
            textAlign: 'center',
          }}
        >
          Motion
        </Text>
        <Text
          accessibilityLabel='reduced-motion-label'
          style={{
            color: tokens.textSecondary,
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          Current: {reducedMotionOverride} ({reducedMotion ? 'on' : 'off'})
        </Text>
        <Btn
          label='System Default'
          onPress={() => setReducedMotionOverride('system')}
          active={reducedMotionOverride === 'system'}
        />
        <Btn
          label='Reduced Motion On'
          onPress={() => setReducedMotionOverride('on')}
          active={reducedMotionOverride === 'on'}
        />
        <Btn
          label='Reduced Motion Off'
          onPress={() => setReducedMotionOverride('off')}
          active={reducedMotionOverride === 'off'}
        />
      </View>

      {/* QA Tools Section */}
      <View style={{ width: '100%', maxWidth: 400, marginBottom: 32 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            marginBottom: 16,
            color: tokens.text,
            textAlign: 'center',
          }}
        >
          QA Tools
        </Text>
        <Btn
          label='Reset Onboarding (QA)'
          onPress={handleResetOnboarding}
          destructive
        />
        <Btn
          label='Reset ALL Preferences (QA)'
          onPress={handleResetAllPreferences}
          destructive
        />
      </View>
    </ScrollView>
  );
}
