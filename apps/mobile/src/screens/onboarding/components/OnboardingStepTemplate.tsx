/**
 * Onboarding Step Template
 * Base template for all onboarding steps
 */

import React, { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, Button, Flex, Container } from '../../../components/ui';
import { useOnboarding } from '../../../contexts/OnboardingContext';
import { useHaptic } from '../../../hooks/useHaptic';

interface OnboardingStepTemplateProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  description?: string;
  illustration?: ReactNode;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  showSkipButton?: boolean;
  onPrimaryPress?: () => void | Promise<void>;
  onSecondaryPress?: () => void | Promise<void>;
  primaryButtonDisabled?: boolean;
  loading?: boolean;
  scrollable?: boolean;
}

const OnboardingStepTemplate: React.FC<OnboardingStepTemplateProps> = ({
  children,
  title,
  subtitle,
  description,
  illustration,
  primaryButtonText = 'Continue',
  secondaryButtonText = 'Back',
  showSkipButton = false,
  onPrimaryPress,
  onSecondaryPress,
  primaryButtonDisabled = false,
  loading = false,
  scrollable = true,
}) => {
  const {
    currentStep,
    canGoBack,
    canSkipCurrent,
    goToPreviousStep,
    skipStep,
    completeStep,
  } = useOnboarding();
  
  const { buttonTap, navigation: navigationHaptic } = useHaptic();

  const handlePrimaryPress = async () => {
    await buttonTap();
    
    if (onPrimaryPress) {
      await onPrimaryPress();
    } else if (currentStep) {
      await completeStep(currentStep.id);
    }
  };

  const handleSecondaryPress = async () => {
    await buttonTap();
    
    if (onSecondaryPress) {
      await onSecondaryPress();
    } else if (canGoBack) {
      await goToPreviousStep();
      await navigationHaptic();
    }
  };

  const handleSkipPress = async () => {
    await buttonTap();
    
    if (currentStep) {
      await skipStep(currentStep.id);
    }
  };

  const stepTitle = title || currentStep?.title;
  const stepSubtitle = subtitle || currentStep?.subtitle;
  const stepDescription = description || currentStep?.description;

  const ContentWrapper = scrollable ? ScrollView : View;
  const contentProps = scrollable
    ? {
        contentContainerStyle: styles.scrollContent,
        showsVerticalScrollIndicator: false,
      }
    : { style: styles.content };

  return (
    <View style={styles.container}>
      <ContentWrapper {...contentProps}>
        <Container style={styles.innerContainer}>
          {/* Illustration */}
          {illustration && (
            <View style={styles.illustrationContainer}>
              {illustration}
            </View>
          )}

          {/* Header */}
          <View style={styles.header}>
            {stepTitle && (
              <Text variant="h3" weight="bold" align="center" style={styles.title}>
                {stepTitle}
              </Text>
            )}
            
            {stepSubtitle && (
              <Text variant="h6" color="primary.500" align="center" style={styles.subtitle}>
                {stepSubtitle}
              </Text>
            )}
            
            {stepDescription && (
              <Text variant="body1" color="text.secondary" align="center" style={styles.description}>
                {stepDescription}
              </Text>
            )}
          </View>

          {/* Step Content */}
          <View style={styles.stepContent}>
            {children}
          </View>
        </Container>
      </ContentWrapper>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Container>
          {/* Skip Button */}
          {showSkipButton && canSkipCurrent && (
            <Flex justify="center" style={styles.skipContainer}>
              <Button
                variant="ghost"
                size="sm"
                onPress={handleSkipPress}
                disabled={loading}
              >
                Skip for now
              </Button>
            </Flex>
          )}

          {/* Primary and Secondary Buttons */}
          <Flex direction="row" gap="md" style={styles.buttonContainer}>
            {/* Secondary Button (Back) */}
            {canGoBack && (
              <Button
                variant="outline"
                size="lg"
                onPress={handleSecondaryPress}
                disabled={loading}
                style={styles.secondaryButton}
              >
                {secondaryButtonText}
              </Button>
            )}

            {/* Primary Button (Continue) */}
            <Button
              variant="primary"
              size="lg"
              onPress={handlePrimaryPress}
              disabled={primaryButtonDisabled || loading}
              loading={loading}
              style={styles.primaryButton}
            >
              {primaryButtonText}
            </Button>
          </Flex>
        </Container>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  innerContainer: {
    flex: 1,
    paddingTop: 20,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 32,
    minHeight: 120,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    marginBottom: 8,
    lineHeight: 36,
  },
  subtitle: {
    marginBottom: 16,
    lineHeight: 24,
  },
  description: {
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  stepContent: {
    flex: 1,
    minHeight: 200,
  },
  actions: {
    paddingVertical: 20,
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  skipContainer: {
    marginBottom: 16,
  },
  buttonContainer: {
    // Flex direction and gap handled by Flex component
  },
  secondaryButton: {
    flex: 1,
  },
  primaryButton: {
    flex: 2,
  },
});

export default OnboardingStepTemplate;
