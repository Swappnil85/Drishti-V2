/**
 * Advanced Profile Step
 * Detailed profile setup for advanced users
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../../../components/ui';
import OnboardingStepTemplate from '../components/OnboardingStepTemplate';

const AdvancedProfileStep: React.FC = () => {
  return (
    <OnboardingStepTemplate
      primaryButtonText="Continue"
    >
      <View style={styles.content}>
        <Text variant="body1" color="text.secondary" align="center">
          Advanced profile setup coming soon...
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

export default AdvancedProfileStep;
