/**
 * First Goal Step
 * Help user create their first FIRE goal
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Input, Button, Flex, Card, Icon } from '../../../components/ui';
import OnboardingStepTemplate from '../components/OnboardingStepTemplate';
import { useOnboarding } from '../../../contexts/OnboardingContext';
import { useHaptic } from '../../../hooks/useHaptic';

interface GoalData {
  targetAmount: string;
  targetAge: string;
  goalName: string;
}

const FirstGoalStep: React.FC = () => {
  const { completeStep, currentStep, progress } = useOnboarding();
  const { formValidationError, formValidationSuccess, milestone } = useHaptic();

  const [goalData, setGoalData] = useState<GoalData>({
    targetAmount: '',
    targetAge: '',
    goalName: 'FIRE Goal',
  });

  const [calculatedValues, setCalculatedValues] = useState({
    monthlyRequired: 0,
    yearsToGoal: 0,
    totalRequired: 0,
  });

  const [loading, setLoading] = useState(false);

  // Auto-calculate based on user profile
  useEffect(() => {
    if (progress?.profile) {
      const profile = progress.profile;
      
      // Calculate suggested FIRE number (25x annual expenses)
      if (profile.monthlyExpenses) {
        const annualExpenses = profile.monthlyExpenses * 12;
        const suggestedFIRENumber = annualExpenses * 25;
        
        if (!goalData.targetAmount) {
          setGoalData(prev => ({
            ...prev,
            targetAmount: suggestedFIRENumber.toString(),
          }));
        }
      }
      
      // Set target age if not already set
      if (profile.desiredRetirementAge && !goalData.targetAge) {
        setGoalData(prev => ({
          ...prev,
          targetAge: profile.desiredRetirementAge.toString(),
        }));
      }
    }
  }, [progress?.profile]);

  // Calculate required monthly savings
  useEffect(() => {
    if (goalData.targetAmount && goalData.targetAge && progress?.profile) {
      const targetAmount = parseFloat(goalData.targetAmount);
      const targetAge = parseInt(goalData.targetAge);
      const currentAge = progress.profile.age || 25;
      const currentSavings = progress.profile.currentSavings || 0;
      
      const yearsToGoal = targetAge - currentAge;
      const monthsToGoal = yearsToGoal * 12;
      const remainingAmount = targetAmount - currentSavings;
      
      // Simple calculation (not accounting for investment growth)
      const monthlyRequired = remainingAmount / monthsToGoal;
      
      setCalculatedValues({
        monthlyRequired: Math.max(0, monthlyRequired),
        yearsToGoal,
        totalRequired: remainingAmount,
      });
    }
  }, [goalData.targetAmount, goalData.targetAge, progress?.profile]);

  const handleInputChange = (field: keyof GoalData, value: string) => {
    setGoalData(prev => ({ ...prev, [field]: value }));
  };

  const handleContinue = async () => {
    if (!goalData.targetAmount || !goalData.targetAge || !goalData.goalName) {
      await formValidationError();
      return;
    }

    setLoading(true);
    
    try {
      await milestone();
      
      const goalForStorage = {
        firstGoal: {
          name: goalData.goalName,
          targetAmount: parseFloat(goalData.targetAmount),
          targetAge: parseInt(goalData.targetAge),
          monthlyRequired: calculatedValues.monthlyRequired,
          yearsToGoal: calculatedValues.yearsToGoal,
          createdAt: Date.now(),
        },
      };

      if (currentStep) {
        await completeStep(currentStep.id, goalForStorage);
      }
    } catch (error) {
      console.error('Failed to save goal:', error);
      await formValidationError();
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isFormValid = () => {
    return goalData.targetAmount && goalData.targetAge && goalData.goalName;
  };

  return (
    <OnboardingStepTemplate
      primaryButtonText="Create Goal"
      primaryButtonDisabled={!isFormValid()}
      loading={loading}
      onPrimaryPress={handleContinue}
    >
      <View style={styles.content}>
        {/* Goal Setup */}
        <Card variant="outlined" padding="lg" style={styles.section}>
          <Text variant="h6" weight="semiBold" style={styles.sectionTitle}>
            Your FIRE Goal
          </Text>
          
          <Flex direction="column" gap="md">
            <Input
              label="Goal Name"
              placeholder="e.g., FIRE Goal, Early Retirement"
              value={goalData.goalName}
              onChangeText={(value) => handleInputChange('goalName', value)}
            />
            
            <Input
              label="Target Amount"
              placeholder="e.g., 1000000"
              value={goalData.targetAmount}
              onChangeText={(value) => handleInputChange('targetAmount', value)}
              keyboardType="numeric"
              leftIcon="$"
              helperText="Based on 25x your annual expenses"
            />
            
            <Input
              label="Target Age"
              placeholder="e.g., 55"
              value={goalData.targetAge}
              onChangeText={(value) => handleInputChange('targetAge', value)}
              keyboardType="numeric"
              helperText="When do you want to achieve FIRE?"
            />
          </Flex>
        </Card>

        {/* Calculations */}
        {calculatedValues.yearsToGoal > 0 && (
          <Card variant="elevated" padding="lg" style={styles.calculationCard}>
            <Flex direction="row" align="center" style={styles.calculationHeader}>
              <Icon name="calculator" size="md" color="primary.500" />
              <Text variant="h6" weight="semiBold" style={styles.calculationTitle}>
                Your FIRE Plan
              </Text>
            </Flex>
            
            <Flex direction="column" gap="md">
              <Flex direction="row" justify="space-between" align="center">
                <Text variant="body2" color="text.secondary">Years to goal:</Text>
                <Text variant="body1" weight="medium">
                  {calculatedValues.yearsToGoal} years
                </Text>
              </Flex>
              
              <Flex direction="row" justify="space-between" align="center">
                <Text variant="body2" color="text.secondary">Monthly savings needed:</Text>
                <Text variant="body1" weight="medium" color="primary.500">
                  {formatCurrency(calculatedValues.monthlyRequired)}
                </Text>
              </Flex>
              
              <Flex direction="row" justify="space-between" align="center">
                <Text variant="body2" color="text.secondary">Total to save:</Text>
                <Text variant="body1" weight="medium">
                  {formatCurrency(calculatedValues.totalRequired)}
                </Text>
              </Flex>
            </Flex>
            
            <View style={styles.disclaimer}>
              <Text variant="caption" color="text.tertiary" align="center">
                * Simplified calculation. Actual results may vary based on investment returns and inflation.
              </Text>
            </View>
          </Card>
        )}

        {/* Motivation */}
        <Card variant="filled" padding="lg" style={styles.motivationCard}>
          <Flex direction="row" align="center" style={styles.motivationHeader}>
            <Icon name="flag" size="md" color="warning.500" />
            <Text variant="body1" weight="medium" style={styles.motivationTitle}>
              You're on your way to FIRE!
            </Text>
          </Flex>
          
          <Text variant="body2" color="text.secondary" style={styles.motivationText}>
            Every journey begins with a single step. By setting this goal, you're taking control 
            of your financial future and working towards true financial independence.
          </Text>
        </Card>
      </View>
    </OnboardingStepTemplate>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  calculationCard: {
    marginBottom: 20,
    backgroundColor: '#F8F9FF',
  },
  calculationHeader: {
    marginBottom: 16,
  },
  calculationTitle: {
    marginLeft: 12,
  },
  disclaimer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  motivationCard: {
    backgroundColor: '#FFF8E1',
  },
  motivationHeader: {
    marginBottom: 12,
  },
  motivationTitle: {
    marginLeft: 12,
  },
  motivationText: {
    lineHeight: 20,
  },
});

export default FirstGoalStep;
