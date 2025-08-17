// React import not required with react-jsx runtime
import { View, Text, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '../theme/ThemeProvider';
import { clearOnboardingState, clearAllPreferences } from '../utils/storage';
import { logEvent } from '../telemetry';

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
            : tokens.text 
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
    <View
      accessibilityRole='summary'
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
        backgroundColor: tokens.bg,
      }}
    >
      <Text
        accessibilityRole='header'
        style={{ 
          fontSize: 20, 
          marginBottom: 12,
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

      <View style={{ height: 12 }} />

      <Text style={{ 
        fontSize: 18, 
        fontWeight: '600', 
        marginBottom: 8,
        color: tokens.text,
      }}>
        Theme
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

      <View style={{ height: 24 }} />

      <Text style={{ 
        fontSize: 18, 
        fontWeight: '600', 
        marginBottom: 8,
        color: tokens.text,
      }}>
        Motion
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

      <View style={{ height: 24 }} />

      <Text style={{ 
        fontSize: 18, 
        fontWeight: '600', 
        marginBottom: 8,
        color: tokens.text,
      }}>
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
  );
}
