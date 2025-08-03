/**
 * Financial Basics Step
 * Educational content for beginners
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Icon, Flex, Card } from '../../../components/ui';
import OnboardingStepTemplate from '../components/OnboardingStepTemplate';

const FinancialBasicsStep: React.FC = () => {
  const basics = [
    {
      title: 'Budgeting',
      description: 'Track income and expenses to understand your money flow',
      icon: 'pie-chart',
      color: 'primary.500',
    },
    {
      title: 'Emergency Fund',
      description: 'Save 3-6 months of expenses for unexpected situations',
      icon: 'shield',
      color: 'success.500',
    },
    {
      title: 'Debt Management',
      description: 'Pay off high-interest debt before investing',
      icon: 'trending-down',
      color: 'warning.500',
    },
    {
      title: 'Investing',
      description: 'Grow your wealth through diversified investments',
      icon: 'trending-up',
      color: 'info.500',
    },
  ];

  return (
    <OnboardingStepTemplate
      primaryButtonText="I understand the basics"
      showSkipButton={true}
    >
      <View style={styles.content}>
        <Text variant="body1" color="text.secondary" align="center" style={styles.description}>
          Let's cover the essential financial concepts that will help you succeed.
        </Text>

        <Flex direction="column" gap="md">
          {basics.map((basic, index) => (
            <Card key={index} variant="outlined" padding="lg">
              <Flex direction="row" align="center">
                <Icon name={basic.icon as any} size="lg" color={basic.color} style={styles.basicIcon} />
                <View style={styles.basicContent}>
                  <Text variant="body1" weight="medium">{basic.title}</Text>
                  <Text variant="body2" color="text.secondary" style={styles.basicDescription}>
                    {basic.description}
                  </Text>
                </View>
              </Flex>
            </Card>
          ))}
        </Flex>
      </View>
    </OnboardingStepTemplate>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingVertical: 20,
  },
  description: {
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  basicIcon: {
    marginRight: 16,
  },
  basicContent: {
    flex: 1,
  },
  basicDescription: {
    marginTop: 4,
    lineHeight: 18,
  },
});

export default FinancialBasicsStep;
