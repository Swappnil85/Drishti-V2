/**
 * Welcome Step for E5-S1 Onboarding
 * First step introducing the user to Drishti
 */

import { View, Text } from 'react-native';
import { OnboardingStepTemplate } from '../OnboardingStepTemplate';
import { useOnboarding } from '../../../contexts/OnboardingContext';
import { useThemeContext } from '../../../theme/ThemeProvider';

export function WelcomeStep() {
  const { nextStep, currentStepData } = useOnboarding();
  const { tokens } = useThemeContext();

  if (!currentStepData) {
    return null;
  }

  return (
    <OnboardingStepTemplate
      title={currentStepData.title}
      subtitle={currentStepData.subtitle}
      description={currentStepData.description}
      primaryButtonText='Get Started'
      onPrimaryPress={nextStep}
    >
      <View
        style={{
          alignItems: 'center',
          marginVertical: 32,
        }}
      >
        {/* Placeholder for illustration/icon */}
        <View
          style={{
            width: 120,
            height: 120,
            backgroundColor: tokens.primary,
            borderRadius: 60,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
          accessibilityLabel='Drishti app icon'
        >
          <Text
            style={{
              fontSize: 48,
              color: '#FFFFFF',
              fontWeight: 'bold',
            }}
          >
            D
          </Text>
        </View>

        <View
          style={{
            backgroundColor: tokens.surface,
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderRadius: 12,
            marginTop: 16,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              color: tokens.textMuted,
              textAlign: 'center',
              lineHeight: 20,
            }}
          >
            Track your progress, plan your future, and achieve financial
            independence with confidence.
          </Text>
        </View>
      </View>
    </OnboardingStepTemplate>
  );
}
