/**
 * Onboarding Screen for E5-S1
 * Main container for the onboarding flow with step navigation
 */

import { useEffect } from 'react';
import { View, BackHandler } from 'react-native';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useThemeContext } from '../theme/ThemeProvider';
import { triggerHaptic } from '../utils/haptics';

// Step components
import { WelcomeStep } from '../components/onboarding/steps/WelcomeStep';
import { CurrencyStep } from '../components/onboarding/steps/CurrencyStep';
import { PrivacyStep } from '../components/onboarding/steps/PrivacyStep';
import { SampleDataStep } from '../components/onboarding/steps/SampleDataStep';
import { DoneStep } from '../components/onboarding/steps/DoneStep';

// Loading state
import { View as LoadingView, Text } from 'react-native';

export default function OnboardingScreen() {
  const { currentStep, isLoading, canGoBack, previousStep } = useOnboarding();
  const { tokens, reducedMotion } = useThemeContext();

  // Handle hardware back button on Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (canGoBack) {
          if (!reducedMotion) {
            triggerHaptic('light');
          }
          previousStep();
          return true; // Prevent default behavior
        }
        return false; // Allow default behavior (exit app)
      }
    );

    return () => backHandler.remove();
  }, [canGoBack, previousStep, reducedMotion]);

  if (isLoading) {
    return (
      <LoadingView
        style={{
          flex: 1,
          backgroundColor: tokens.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 16,
            color: tokens.textMuted,
          }}
        >
          Loading...
        </Text>
      </LoadingView>
    );
  }

  // Render the appropriate step based on current step index
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep />;
      case 1:
        return <CurrencyStep />;
      case 2:
        return <PrivacyStep />;
      case 3:
        return <SampleDataStep />;
      case 4:
        return <DoneStep />;
      default:
        return <WelcomeStep />;
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: tokens.bg,
      }}
    >
      {renderStep()}
    </View>
  );
}
