/**
 * Done Step for E5-S1 Onboarding
 * Final step confirming completion and starting the main app
 */

import { View, Text } from 'react-native';
import { OnboardingStepTemplate } from '../OnboardingStepTemplate';
import { useOnboarding } from '../../../contexts/OnboardingContext';
import { useThemeContext } from '../../../theme/ThemeProvider';

export function DoneStep() {
  const { completeOnboarding, currentStepData, profile } = useOnboarding();
  const { tokens } = useThemeContext();

  if (!currentStepData) {
    return null;
  }

  const handleComplete = () => {
    completeOnboarding();
  };

  return (
    <OnboardingStepTemplate
      title={currentStepData.title}
      subtitle={currentStepData.subtitle}
      description={currentStepData.description}
      primaryButtonText='Start Using Drishti'
      onPrimaryPress={handleComplete}
      showProgress={false}
    >
      <View
        style={{
          alignItems: 'center',
          marginVertical: 32,
        }}
      >
        {/* Success icon */}
        <View
          style={{
            width: 120,
            height: 120,
            backgroundColor: tokens.success,
            borderRadius: 60,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
          accessibilityLabel='Setup complete'
        >
          <Text
            style={{
              fontSize: 48,
              color: '#FFFFFF',
              fontWeight: 'bold',
            }}
          >
            ✓
          </Text>
        </View>

        {/* Summary of choices */}
        <View
          style={{
            backgroundColor: tokens.surface,
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderRadius: 12,
            width: '100%',
            marginTop: 16,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: tokens.text,
              marginBottom: 12,
              textAlign: 'center',
            }}
          >
            Your Setup Summary
          </Text>

          <View style={{ gap: 8 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: tokens.textMuted,
                }}
              >
                Currency:
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: tokens.text,
                }}
              >
                {profile.currency}
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: tokens.textMuted,
                }}
              >
                Privacy Mode:
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: tokens.text,
                }}
              >
                {profile.privacyLocalOnly ? 'Local Only' : 'Cloud Sync'}
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: tokens.textMuted,
                }}
              >
                Sample Data:
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: tokens.text,
                }}
              >
                {profile.hasSampleData ? 'Loaded' : 'Not Loaded'}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={{
            backgroundColor: `${tokens.primary}10`,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 8,
            marginTop: 16,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: tokens.primary,
              textAlign: 'center',
              lineHeight: 16,
              fontWeight: '500',
            }}
          >
            💡 You can change any of these settings later in the Settings tab
          </Text>
        </View>
      </View>
    </OnboardingStepTemplate>
  );
}
