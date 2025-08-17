import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '../../theme/ThemeProvider';
import { logEvent } from '../../telemetry';
import {
  touchTargetStyle,
  headerA11yProps,
  buttonA11yProps,
} from '../../utils/accessibility';

interface WelcomeScreenProps {
  onNext: () => void;
}

export default function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  const insets = useSafeAreaInsets();
  const { tokens } = useThemeContext();

  const handleGetStarted = () => {
    logEvent('onboarding_step', { step: 'welcome_cta' });
    onNext();
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: tokens.bg,
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 24,
        paddingLeft: insets.left + 24,
        paddingRight: insets.right + 24,
      }}
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          gap: 32,
        }}
      >
        <View
          style={{
            alignItems: 'center',
            gap: 16,
          }}
          pointerEvents="none"
        >
          <Text
            {...headerA11yProps}
            style={{
              fontSize: 32,
              fontWeight: 'bold',
              color: tokens.text,
              textAlign: 'center',
            }}
          >
            Welcome to Drishti
          </Text>
          <Text
            style={{
              fontSize: 18,
              color: tokens.textMuted,
              textAlign: 'center',
              lineHeight: 26,
              maxWidth: 300,
            }}
          >
            Your personal finance companion for smarter money decisions
          </Text>
        </View>

        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: tokens.primary,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          pointerEvents="none"
        >
          <Text
            style={{
              fontSize: 48,
              color: '#FFFFFF',
            }}
          >
            💰
          </Text>
        </View>

        <Pressable
          testID="onboarding-get-started"
          onPress={handleGetStarted}
          {...buttonA11yProps}
          accessibilityLabel="Get Started with Drishti"
          accessibilityHint="Begins the onboarding process"
          style={{
            backgroundColor: tokens.primary,
            paddingVertical: 16,
            paddingHorizontal: 32,
            borderRadius: 12,
            minWidth: 200,
            alignItems: 'center',
            ...touchTargetStyle,
            zIndex: 10,
            position: 'relative',
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 18,
              fontWeight: '600',
            }}
          >
            Get Started
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
