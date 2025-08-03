/**
 * FIRE Strategies Step
 * Advanced FIRE methodology education
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Flex, Card, Icon } from '../../../components/ui';
import OnboardingStepTemplate from '../components/OnboardingStepTemplate';
import { useHaptic } from '../../../hooks/useHaptic';

const FIREStrategiesStep: React.FC = () => {
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const { buttonTap } = useHaptic();

  const strategies = [
    {
      id: 'lean_fire',
      name: 'Lean FIRE',
      target: '$500K - $750K',
      description: 'Minimal expenses, frugal lifestyle',
      icon: 'leaf',
      color: 'success.500',
    },
    {
      id: 'regular_fire',
      name: 'Regular FIRE',
      target: '$1M - $2M',
      description: 'Comfortable middle-class lifestyle',
      icon: 'home',
      color: 'primary.500',
    },
    {
      id: 'fat_fire',
      name: 'Fat FIRE',
      target: '$2.5M+',
      description: 'Luxury lifestyle with high expenses',
      icon: 'diamond',
      color: 'warning.500',
    },
    {
      id: 'barista_fire',
      name: 'Barista FIRE',
      target: '$500K - $1M',
      description: 'Part-time work for benefits',
      icon: 'cafe',
      color: 'info.500',
    },
  ];

  const handleStrategySelect = async (strategyId: string) => {
    await buttonTap();
    setSelectedStrategy(strategyId);
  };

  return (
    <OnboardingStepTemplate
      primaryButtonText="Continue with this strategy"
      primaryButtonDisabled={!selectedStrategy}
      showSkipButton={true}
    >
      <View style={styles.content}>
        <Text variant="body1" color="text.secondary" align="center" style={styles.description}>
          Choose the FIRE strategy that aligns with your lifestyle goals.
        </Text>

        <Flex direction="column" gap="md">
          {strategies.map((strategy) => (
            <Card
              key={strategy.id}
              variant={selectedStrategy === strategy.id ? 'elevated' : 'outlined'}
              padding="lg"
              style={[
                styles.strategyCard,
                selectedStrategy === strategy.id && styles.selectedCard,
              ]}
              onPress={() => handleStrategySelect(strategy.id)}
            >
              <Flex direction="row" align="center">
                <Icon name={strategy.icon as any} size="lg" color={strategy.color} style={styles.strategyIcon} />
                <View style={styles.strategyContent}>
                  <Text variant="body1" weight="medium">{strategy.name}</Text>
                  <Text variant="body2" color="primary.500" weight="medium">{strategy.target}</Text>
                  <Text variant="caption" color="text.secondary">{strategy.description}</Text>
                </View>
                {selectedStrategy === strategy.id && (
                  <Icon name="checkmark-circle" size="md" color="primary.500" />
                )}
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
  strategyCard: {
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#1976d2',
    backgroundColor: '#F3F8FF',
  },
  strategyIcon: {
    marginRight: 16,
  },
  strategyContent: {
    flex: 1,
  },
});

export default FIREStrategiesStep;
