/**
 * Welcome Step
 * First onboarding step introducing the app
 */

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Icon, Flex } from '../../../components/ui';
import OnboardingStepTemplate from '../components/OnboardingStepTemplate';
import { useHaptic } from '../../../hooks/useHaptic';

const { width } = Dimensions.get('window');

const WelcomeStep: React.FC = () => {
  const { successFeedback } = useHaptic();

  const handleContinue = async () => {
    await successFeedback();
  };

  const WelcomeIllustration = () => (
    <View style={styles.illustrationContainer}>
      {/* App Logo */}
      <View style={styles.logoContainer}>
        <Icon name="trending-up" size="4xl" color="primary.500" />
        <Text variant="h2" weight="bold" color="primary.500" style={styles.logoText}>
          Drishti
        </Text>
      </View>

      {/* Feature Icons */}
      <Flex direction="row" justify="space-around" style={styles.featureIcons}>
        <View style={styles.featureIcon}>
          <Icon name="calculator" size="lg" color="success.500" />
          <Text variant="caption" color="text.secondary" style={styles.featureLabel}>
            Calculate
          </Text>
        </View>
        
        <View style={styles.featureIcon}>
          <Icon name="analytics" size="lg" color="info.500" />
          <Text variant="caption" color="text.secondary" style={styles.featureLabel}>
            Track
          </Text>
        </View>
        
        <View style={styles.featureIcon}>
          <Icon name="flag" size="lg" color="warning.500" />
          <Text variant="caption" color="text.secondary" style={styles.featureLabel}>
            Achieve
          </Text>
        </View>
      </Flex>
    </View>
  );

  return (
    <OnboardingStepTemplate
      illustration={<WelcomeIllustration />}
      primaryButtonText="Get Started"
      onPrimaryPress={handleContinue}
      scrollable={false}
    >
      <View style={styles.content}>
        {/* Key Benefits */}
        <View style={styles.benefitsContainer}>
          <Flex direction="column" gap="lg">
            <View style={styles.benefit}>
              <Icon name="shield-checkmark" size="md" color="success.500" style={styles.benefitIcon} />
              <View style={styles.benefitContent}>
                <Text variant="body1" weight="medium">Secure & Private</Text>
                <Text variant="body2" color="text.secondary">
                  Your financial data is encrypted and stored locally
                </Text>
              </View>
            </View>

            <View style={styles.benefit}>
              <Icon name="flash" size="md" color="warning.500" style={styles.benefitIcon} />
              <View style={styles.benefitContent}>
                <Text variant="body1" weight="medium">Quick Setup</Text>
                <Text variant="body2" color="text.secondary">
                  Get started in under 3 minutes with guided setup
                </Text>
              </View>
            </View>

            <View style={styles.benefit}>
              <Icon name="trending-up" size="md" color="primary.500" style={styles.benefitIcon} />
              <View style={styles.benefitContent}>
                <Text variant="body1" weight="medium">Smart Insights</Text>
                <Text variant="body2" color="text.secondary">
                  Personalized recommendations based on your goals
                </Text>
              </View>
            </View>
          </Flex>
        </View>

        {/* FIRE Teaser */}
        <View style={styles.fireTeaser}>
          <Text variant="body2" color="text.secondary" align="center" style={styles.teaserText}>
            Join thousands who are achieving{' '}
            <Text variant="body2" weight="bold" color="primary.500">
              Financial Independence
            </Text>
            {' '}through the FIRE methodology
          </Text>
        </View>
      </View>
    </OnboardingStepTemplate>
  );
};

const styles = StyleSheet.create({
  illustrationContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoText: {
    marginTop: 8,
    letterSpacing: 2,
  },
  featureIcons: {
    width: '100%',
    paddingHorizontal: 40,
  },
  featureIcon: {
    alignItems: 'center',
  },
  featureLabel: {
    marginTop: 4,
    fontSize: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  benefitsContainer: {
    flex: 1,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
  },
  benefitIcon: {
    marginRight: 16,
    marginTop: 2,
  },
  benefitContent: {
    flex: 1,
  },
  fireTeaser: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  teaserText: {
    lineHeight: 20,
  },
});

export default WelcomeStep;
