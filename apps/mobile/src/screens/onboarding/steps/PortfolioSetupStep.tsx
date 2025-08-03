/**
 * Portfolio Setup Step
 * Investment portfolio configuration
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../../../components/ui';
import OnboardingStepTemplate from '../components/OnboardingStepTemplate';

const PortfolioSetupStep: React.FC = () => {
  return (
    <OnboardingStepTemplate
      primaryButtonText="Continue"
      showSkipButton={true}
    >
      <View style={styles.content}>
        <Text variant="body1" color="text.secondary" align="center">
          Portfolio setup coming soon...
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

export default PortfolioSetupStep;
