// React import not required with react-jsx runtime
import {
  View,
  Text,
  Pressable,
  Alert,
  ScrollView,
  Switch,
  Modal,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '../theme/ThemeProvider';
import { clearOnboardingState, clearAllPreferences } from '../utils/storage';
import { logEvent } from '../telemetry';
import { useEffect, useState } from 'react'; // Keep React import for useState/useEffect
import { useHaptics } from '../utils/haptics';
import { useSecurityState } from '../state/security'; // Use the new context hook
import {
  isBiometricAvailable,
  authenticateWithBiometrics,
} from '../utils/secureLock';

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
  // Always call the hook - it should handle its own error states
  const securityState = useSecurityState();

  const {
    settings,
    setPin,
    clearPin,
    setBiometricEnabled,
    setAppLockEnabled,
    setAutoLockTimeout,
  } = securityState;

  const [biometricAvailable, setBiometricAvailable] = useState<boolean | null>(
    null
  );
  const [isPinModalVisible, setPinModalVisible] = useState(false);
  const [pinInput, setPinInput] = useState(''); // Renamed to avoid conflict with setPin from context
  const [confirmPinInput, setConfirmPinInput] = useState(''); // Renamed to avoid conflict

  useEffect(() => {
    const checkBiometrics = async () => {
      try {
        const available = await isBiometricAvailable();
        setBiometricAvailable(available);
      } catch {
        setBiometricAvailable(false);
      }
    };
    void checkBiometrics();
  }, []);

  const handleBiometricToggle = async (enabled: boolean) => {
    safeImpactLight();
    if (enabled) {
      // Check if biometrics are available
      if (biometricAvailable !== true) {
        Alert.alert(
          'Error',
          'Biometric authentication is not available on this device'
        );
        return;
      }

      // Require PIN to be set first
      if (!settings.pin) {
        Alert.alert(
          'PIN Required',
          'Please set up a PIN first before enabling biometric authentication. This provides a fallback authentication method.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await authenticateWithBiometrics();
      if (result.success) {
        await setBiometricEnabled(true);
        Alert.alert('Success', 'Biometric authentication has been enabled');
      } else {
        Alert.alert('Error', 'Failed to enable biometric authentication');
      }
    } else {
      await setBiometricEnabled(false);
      Alert.alert('Success', 'Biometric authentication has been disabled');
    }
  };

  const handleAppLockToggle = async (enabled: boolean) => {
    safeImpactLight();
    if (enabled) {
      if (!settings.biometricEnabled && !settings.pin) {
        Alert.alert(
          'Authentication Required',
          'Please enable biometric authentication or set up a PIN before enabling app lock.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    await setAppLockEnabled(enabled);
    Alert.alert(
      'Success',
      enabled ? 'App lock has been enabled' : 'App lock has been disabled'
    );
  };

  const handleAutoLockTimeoutChange = () => {
    safeImpactLight();
    Alert.alert(
      'Auto-lock Timeout',
      'Choose when the app should automatically lock after inactivity:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '1 minute', onPress: () => setAutoLockTimeout(1) },
        { text: '3 minutes', onPress: () => setAutoLockTimeout(3) },
        { text: '5 minutes', onPress: () => setAutoLockTimeout(5) },
        { text: '10 minutes', onPress: () => setAutoLockTimeout(10) },
      ]
    );
  };

  const handleSetPin = async () => {
    if (pinInput.length < 4 || pinInput.length > 6) {
      Alert.alert('Invalid PIN', 'PIN must be between 4 and 6 digits.');
      return;
    }
    if (pinInput !== confirmPinInput) {
      Alert.alert('PINs do not match', 'Please re-enter your PIN.');
      setConfirmPinInput('');
      return;
    }
    await setPin(pinInput);
    setPinModalVisible(false);
    setPinInput('');
    setConfirmPinInput('');
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
      <Text
        accessibilityLabel='theme-mode-label'
        style={{ color: tokens.text }}
      >
        Theme mode: {mode}
      </Text>
      <Text
        accessibilityLabel='reduced-motion-label'
        style={{ color: tokens.text }}
      >
        Reduced motion: {reducedMotionOverride} ({reducedMotion ? 'on' : 'off'})
      </Text>

      {/* Theme Controls */}
      <Text
        style={{
          fontSize: 18,
          fontWeight: '600',
          marginBottom: 8,
          color: tokens.text,
        }}
      >
        Theme
      </Text>
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

      {/* Reduced Motion Controls */}
      <Text
        style={{
          fontSize: 18,
          fontWeight: '600',
          marginBottom: 8,
          color: tokens.text,
        }}
      >
        Reduced Motion
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
              value={settings.appLockEnabled} // Use settings from context
              onValueChange={handleAppLockToggle}
              accessibilityLabel='App Lock toggle'
              accessibilityHint='Requires authentication to unlock the app'
            />
          </View>

          {/* Biometric Authentication */}
          {biometricAvailable === true && settings.pin && (
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
                value={settings.biometricEnabled} // Use settings from context
                onValueChange={handleBiometricToggle}
                accessibilityLabel='Biometric authentication toggle'
                accessibilityHint='Use fingerprint or face recognition to unlock'
              />
            </View>
          )}

          {/* Biometric Helper Text */}
          {biometricAvailable === true && !settings.pin && (
            <Text
              style={{
                fontSize: 13,
                color: tokens.textSecondary,
                marginBottom: 12,
                fontStyle: 'italic',
              }}
            >
              Set up a PIN first to enable biometric authentication
            </Text>
          )}

          {/* PIN Setup */}
          <Pressable
            onPress={() => setPinModalVisible(true)} // Open modal
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
              {settings.pin ? 'Change PIN' : 'Set PIN'} →{' '}
              {/* Display current PIN status */}
            </Text>
          </Pressable>

          {/* Auto-lock Timeout */}
          {settings.appLockEnabled && (
            <Pressable // Only show if app lock is enabled
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
                {settings.autoLockTimeout} min →{' '}
                {/* Display current auto-lock timeout */}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
      <Modal
        visible={isPinModalVisible}
        transparent
        animationType='slide'
        onRequestClose={() => setPinModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
        >
          <View
            style={{
              backgroundColor: tokens.bg,
              padding: 20,
              borderRadius: 10,
              width: '80%',
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: tokens.text,
                marginBottom: 20,
              }}
            >
              {settings.pin ? 'Change PIN' : 'Set PIN'}
            </Text>
            <TextInput
              style={{
                height: 40,
                borderColor: tokens.border,
                borderWidth: 1,
                borderRadius: 5,
                paddingHorizontal: 10,
                marginBottom: 10,
                color: tokens.text,
              }}
              placeholder='Enter PIN (4-6 digits)'
              placeholderTextColor={tokens.textSecondary}
              keyboardType='numeric'
              secureTextEntry
              value={pinInput}
              onChangeText={setPinInput}
            />
            <TextInput
              style={{
                height: 40,
                borderColor: tokens.border,
                borderWidth: 1,
                borderRadius: 5,
                paddingHorizontal: 10,
                marginBottom: 20,
                color: tokens.text,
              }}
              placeholder='Confirm PIN'
              placeholderTextColor={tokens.textSecondary}
              keyboardType='numeric'
              secureTextEntry
              value={confirmPinInput}
              onChangeText={setConfirmPinInput}
            />
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-around' }}
            >
              <Btn label='Cancel' onPress={() => setPinModalVisible(false)} />
              <Btn label='Save' onPress={handleSetPin} active />
            </View>
            {settings.pin && (
              <View style={{ marginTop: 20 }}>
                <Btn
                  label='Clear PIN'
                  onPress={async () => {
                    await clearPin();
                    setPinModalVisible(false);
                  }}
                  destructive
                />
              </View>
            )}
          </View>
        </View>
      </Modal>

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
