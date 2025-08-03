/**
 * First Steps Step
 * Initial guidance for beginners
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../../../components/ui';
import OnboardingStepTemplate from '../components/OnboardingStepTemplate';

const FirstStepsStep: React.FC = () => {
  return (
    <OnboardingStepTemplate
      primaryButtonText="Get Started"
    >
      <View style={styles.content}>
        <Text variant="body1" color="text.secondary" align="center">
          First steps guidance coming soon...
        </Text>
      </View>
    </OnboardingStepTemplate>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FirstStepsStep;
