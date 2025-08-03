/**
 * FIRE Education Step
 * Educational content about FIRE methodology
 */

import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Icon, Flex, Card, Button } from '../../../components/ui';
import OnboardingStepTemplate from '../components/OnboardingStepTemplate';
import { useHaptic } from '../../../hooks/useHaptic';

const { width } = Dimensions.get('window');

const FIREEducationStep: React.FC = () => {
  const [currentExample, setCurrentExample] = useState(0);
  const { buttonTap, achievement } = useHaptic();

  const examples = [
    {
      title: 'The 25x Rule',
      description: 'Save 25 times your annual expenses to achieve financial independence',
      calculation: 'Annual Expenses: $40,000\nFIRE Number: $1,000,000',
      icon: 'calculator',
      color: 'primary.500',
    },
    {
      title: '4% Safe Withdrawal',
      description: 'Withdraw 4% annually from your investments to maintain your lifestyle',
      calculation: 'Portfolio: $1,000,000\nAnnual Income: $40,000',
      icon: 'trending-down',
      color: 'success.500',
    },
    {
      title: 'High Savings Rate',
      description: 'Save 50%+ of your income to accelerate your FIRE timeline',
      calculation: 'Income: $80,000\nSavings: $40,000 (50%)',
      icon: 'wallet',
      color: 'warning.500',
    },
  ];

  const handleExampleChange = async (index: number) => {
    await buttonTap();
    setCurrentExample(index);
  };

  const handleContinue = async () => {
    await achievement();
  };

  const FIREIllustration = () => (
    <View style={styles.illustrationContainer}>
      {/* FIRE Acronym */}
      <View style={styles.fireAcronym}>
        <Text variant="h1" weight="bold" color="primary.500" style={styles.fireText}>
          FIRE
        </Text>
        <Text variant="body2" color="text.secondary" align="center" style={styles.acronymText}>
          Financial Independence, Retire Early
        </Text>
      </View>

      {/* Interactive Example */}
      <Card variant="elevated" padding="lg" style={styles.exampleCard}>
        <Flex direction="row" align="center" style={styles.exampleHeader}>
          <Icon 
            name={examples[currentExample].icon as any} 
            size="lg" 
            color={examples[currentExample].color} 
          />
          <Text variant="h6" weight="semiBold" style={styles.exampleTitle}>
            {examples[currentExample].title}
          </Text>
        </Flex>
        
        <Text variant="body2" color="text.secondary" style={styles.exampleDescription}>
          {examples[currentExample].description}
        </Text>
        
        <View style={styles.calculationBox}>
          <Text variant="body2" weight="medium" color="text.primary" style={styles.calculationText}>
            {examples[currentExample].calculation}
          </Text>
        </View>
      </Card>

      {/* Example Navigation */}
      <Flex direction="row" justify="center" gap="sm" style={styles.exampleDots}>
        {examples.map((_, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            onPress={() => handleExampleChange(index)}
            style={[
              styles.exampleDot,
              {
                backgroundColor: index === currentExample ? '#1976d2' : '#E0E0E0',
              },
            ]}
          />
        ))}
      </Flex>
    </View>
  );

  return (
    <OnboardingStepTemplate
      illustration={<FIREIllustration />}
      primaryButtonText="I understand FIRE"
      showSkipButton={true}
      onPrimaryPress={handleContinue}
    >
      <View style={styles.content}>
        {/* Key Principles */}
        <View style={styles.principlesContainer}>
          <Text variant="h6" weight="semiBold" style={styles.sectionTitle}>
            Key FIRE Principles
          </Text>
          
          <Flex direction="column" gap="md">
            <View style={styles.principle}>
              <View style={styles.principleNumber}>
                <Text variant="body2" weight="bold" color="white">1</Text>
              </View>
              <View style={styles.principleContent}>
                <Text variant="body1" weight="medium">Maximize Income</Text>
                <Text variant="body2" color="text.secondary">
                  Increase earnings through career growth, side hustles, or investments
                </Text>
              </View>
            </View>

            <View style={styles.principle}>
              <View style={styles.principleNumber}>
                <Text variant="body2" weight="bold" color="white">2</Text>
              </View>
              <View style={styles.principleContent}>
                <Text variant="body1" weight="medium">Minimize Expenses</Text>
                <Text variant="body2" color="text.secondary">
                  Live below your means and optimize spending on what matters
                </Text>
              </View>
            </View>

            <View style={styles.principle}>
              <View style={styles.principleNumber}>
                <Text variant="body2" weight="bold" color="white">3</Text>
              </View>
              <View style={styles.principleContent}>
                <Text variant="body1" weight="medium">Invest Wisely</Text>
                <Text variant="body2" color="text.secondary">
                  Build a diversified portfolio with low-cost index funds
                </Text>
              </View>
            </View>
          </Flex>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsContainer}>
          <Text variant="h6" weight="semiBold" style={styles.sectionTitle}>
            Why Choose FIRE?
          </Text>
          
          <Flex direction="row" justify="space-around" style={styles.benefits}>
            <View style={styles.benefit}>
              <Icon name="time" size="lg" color="primary.500" />
              <Text variant="caption" color="text.secondary" align="center" style={styles.benefitText}>
                Retire 20-30 years early
              </Text>
            </View>
            
            <View style={styles.benefit}>
              <Icon name="heart" size="lg" color="error.500" />
              <Text variant="caption" color="text.secondary" align="center" style={styles.benefitText}>
                Pursue your passions
              </Text>
            </View>
            
            <View style={styles.benefit}>
              <Icon name="shield" size="lg" color="success.500" />
              <Text variant="caption" color="text.secondary" align="center" style={styles.benefitText}>
                Financial security
              </Text>
            </View>
          </Flex>
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
  fireAcronym: {
    alignItems: 'center',
    marginBottom: 24,
  },
  fireText: {
    fontSize: 48,
    letterSpacing: 4,
  },
  acronymText: {
    marginTop: 4,
    fontSize: 14,
  },
  exampleCard: {
    width: width - 80,
    marginBottom: 16,
  },
  exampleHeader: {
    marginBottom: 8,
  },
  exampleTitle: {
    marginLeft: 12,
  },
  exampleDescription: {
    marginBottom: 12,
    lineHeight: 20,
  },
  calculationBox: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
  },
  calculationText: {
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 20,
  },
  exampleDots: {
    marginTop: 8,
  },
  exampleDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    padding: 0,
    minWidth: 12,
  },
  content: {
    flex: 1,
    paddingVertical: 20,
  },
  principlesContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  principle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
  },
  principleNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  principleContent: {
    flex: 1,
  },
  benefitsContainer: {
    paddingHorizontal: 16,
  },
  benefits: {
    paddingHorizontal: 20,
  },
  benefit: {
    alignItems: 'center',
    flex: 1,
  },
  benefitText: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 16,
  },
});

export default FIREEducationStep;
