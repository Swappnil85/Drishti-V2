import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '../../theme/ThemeProvider';
import { logEvent } from '../../telemetry';
import { setOnboardingCompleted } from '../../utils/storage';
import {
  touchTargetStyle,
  headerA11yProps,
  buttonA11yProps,
} from '../../utils/accessibility';

export default function Step2Screen() {
  const insets = useSafeAreaInsets();
  const { tokens } = useThemeContext();

  const handleComplete = async () => {
    logEvent('onboarding_complete');
    await setOnboardingCompleted(true);
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
              fontSize: 28,
              fontWeight: 'bold',
              color: tokens.text,
              textAlign: 'center',
            }}
          >
            Track Your Progress
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: tokens.textMuted,
              textAlign: 'center',
              lineHeight: 24,
              maxWidth: 300,
            }}
          >
            Monitor your accounts, plan scenarios, and make informed financial decisions
          </Text>
        </View>

        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: tokens.success,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          pointerEvents="none"
        >
          <Text
            style={{
              fontSize: 40,
              color: '#FFFFFF',
            }}
          >
            📊
          </Text>
        </View>

        <Pressable
          onPress={handleComplete}
          {...buttonA11yProps}
          accessibilityLabel="Complete onboarding"
          accessibilityHint="Finishes the onboarding process and enters the main app"
          style={{
            backgroundColor: tokens.success,
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
            Continue
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
