/**
 * Onboarding Step Template for E5-S1
 * Reusable template for onboarding steps with consistent layout and accessibility
 */

import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '../../theme/ThemeProvider';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { triggerHaptic } from '../../utils/haptics';

interface OnboardingStepTemplateProps {
  title: string;
  subtitle: string;
  description: string;
  children?: React.ReactNode;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimaryPress?: () => void;
  onSecondaryPress?: () => void;
  primaryButtonDisabled?: boolean;
  showProgress?: boolean;
}

export function OnboardingStepTemplate({
  title,
  subtitle,
  description,
  children,
  primaryButtonText = 'Continue',
  secondaryButtonText,
  onPrimaryPress,
  onSecondaryPress,
  primaryButtonDisabled = false,
  showProgress = true,
}: OnboardingStepTemplateProps) {
  const { tokens, reducedMotion } = useThemeContext();
  const { currentStep, canGoBack, canSkip, previousStep, skipStep } =
    useOnboarding();
  const insets = useSafeAreaInsets();

  const handlePrimaryPress = () => {
    if (!reducedMotion) {
      triggerHaptic('light');
    }
    onPrimaryPress?.();
  };

  const handleSecondaryPress = () => {
    if (!reducedMotion) {
      triggerHaptic('light');
    }
    onSecondaryPress?.();
  };

  const handleBackPress = () => {
    if (!reducedMotion) {
      triggerHaptic('light');
    }
    previousStep();
  };

  const handleSkipPress = () => {
    if (!reducedMotion) {
      triggerHaptic('light');
    }
    skipStep();
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: tokens.bg,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      {/* Progress indicator */}
      {showProgress && (
        <View
          style={{
            paddingHorizontal: 24,
            paddingVertical: 16,
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
                fontSize: 14,
                color: tokens.textMuted,
              }}
              accessibilityLabel={`Step ${currentStep + 1} of 5`}
            >
              Step {currentStep + 1} of 5
            </Text>
            {canSkip && (
              <Pressable
                onPress={handleSkipPress}
                accessibilityRole='button'
                accessibilityLabel='Skip this step'
                style={{
                  paddingVertical: 4,
                  paddingHorizontal: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: tokens.primary,
                  }}
                >
                  Skip
                </Text>
              </Pressable>
            )}
          </View>
          <View
            style={{
              height: 4,
              backgroundColor: tokens.border,
              borderRadius: 2,
            }}
          >
            <View
              style={{
                height: 4,
                backgroundColor: tokens.primary,
                borderRadius: 2,
                width: `${((currentStep + 1) / 5) * 100}%`,
              }}
            />
          </View>
        </View>
      )}

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flex: 1, justifyContent: 'center', minHeight: 400 }}>
          <Text
            accessibilityRole='header'
            style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: tokens.text,
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontSize: 18,
              color: tokens.textMuted,
              textAlign: 'center',
              marginBottom: 16,
            }}
          >
            {subtitle}
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: tokens.text,
              textAlign: 'center',
              lineHeight: 24,
              marginBottom: 32,
            }}
          >
            {description}
          </Text>

          {children}
        </View>
      </ScrollView>

      {/* Navigation buttons */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingVertical: 16,
          gap: 12,
        }}
      >
        <Pressable
          onPress={handlePrimaryPress}
          disabled={primaryButtonDisabled}
          accessibilityRole='button'
          accessibilityLabel={primaryButtonText}
          style={{
            backgroundColor: primaryButtonDisabled
              ? tokens.border
              : tokens.primary,
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 12,
            minHeight: 56,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: primaryButtonDisabled ? tokens.textMuted : '#FFFFFF',
            }}
          >
            {primaryButtonText}
          </Text>
        </Pressable>

        <View
          style={{
            flexDirection: 'row',
            gap: 12,
          }}
        >
          {canGoBack && (
            <Pressable
              onPress={handleBackPress}
              accessibilityRole='button'
              accessibilityLabel='Go back'
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: tokens.border,
                minHeight: 48,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: tokens.text,
                }}
              >
                Back
              </Text>
            </Pressable>
          )}

          {secondaryButtonText && (
            <Pressable
              onPress={handleSecondaryPress}
              accessibilityRole='button'
              accessibilityLabel={secondaryButtonText}
              style={{
                flex: canGoBack ? 1 : undefined,
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: tokens.border,
                minHeight: 48,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: tokens.text,
                }}
              >
                {secondaryButtonText}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
