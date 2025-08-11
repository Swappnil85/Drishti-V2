/**
 * Onboarding Progress Component
 * Visual progress indicator for onboarding flow
 */

import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, Flex, Icon } from '../../../components/ui';
import { useOnboarding } from '../../../contexts/OnboardingContext';
import { useTheme } from '../../../contexts/ThemeContext';

const OnboardingProgress: React.FC = () => {
  const { progress, analytics, currentStep, canGoBack, goToPreviousStep } = useOnboarding();
  const theme = useTheme();

  if (!progress || !currentStep) {
    return null;
  }

  const progressPercentage = analytics.progressPercentage;
  const progressWidth = new Animated.Value(progressPercentage);

  // Animate progress bar
  React.useEffect(() => {
    Animated.timing(progressWidth, {
      toValue: progressPercentage,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progressPercentage]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header with back button and time estimate */}
      <Flex direction="row" justify="space-between" align="center" style={styles.header}>
        <View style={styles.backButton}>
          {canGoBack && (
            <Icon
              name="chevron-back"
              size="md"
              color="text.primary"
              onPress={goToPreviousStep}
              style={styles.backIcon}
            />
          )}
        </View>
        
        <Text variant="caption" color="text.secondary">
          {formatTime(analytics.estimatedTimeRemaining)} remaining
        </Text>
      </Flex>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressTrack, { backgroundColor: theme.colors.neutral[200] }]}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: theme.colors.primary[500],
                width: progressWidth.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                  extrapolate: 'clamp',
                }),
              },
            ]}
          />
        </View>
        
        {/* Step indicators */}
        <View style={styles.stepIndicators}>
          {Array.from({ length: analytics.totalSteps }, (_, index) => {
            const isCompleted = index < progress.currentStep;
            const isCurrent = index === progress.currentStep;
            
            return (
              <View
                key={index}
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: isCompleted
                      ? theme.colors.primary[500]
                      : isCurrent
                      ? theme.colors.primary[300]
                      : theme.colors.neutral[300],
                  },
                ]}
              >
                {isCompleted && (
                  <Icon
                    name="checkmark"
                    size="xs"
                    color="white"
                  />
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Step info */}
      <Flex direction="row" justify="space-between" align="center" style={styles.stepInfo}>
        <Text variant="caption" color="text.secondary">
          Step {progress.currentStep + 1} of {analytics.totalSteps}
        </Text>
        
        <Text variant="caption" color="primary.500" weight="medium">
          {Math.round(progressPercentage)}% complete
        </Text>
      </Flex>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  header: {
    marginBottom: 12,
    height: 24,
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backIcon: {
    padding: 4,
  },
  progressContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  stepIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    top: -6,
    left: 0,
    right: 0,
  },
  stepDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  stepInfo: {
    marginTop: 4,
  },
});

export default OnboardingProgress;
