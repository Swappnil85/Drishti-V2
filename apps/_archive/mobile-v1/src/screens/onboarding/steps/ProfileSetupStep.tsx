/**
 * Profile Setup Step
 * Collect basic user profile information
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Input, Button, Flex, Card } from '../../../components/ui';
import OnboardingStepTemplate from '../components/OnboardingStepTemplate';
import { useOnboarding } from '../../../contexts/OnboardingContext';
import { useHaptic } from '../../../hooks/useHaptic';

interface ProfileData {
  age: string;
  annualIncome: string;
  currentSavings: string;
  monthlyExpenses: string;
  desiredRetirementAge: string;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive' | '';
}

const ProfileSetupStep: React.FC = () => {
  const { completeStep, currentStep } = useOnboarding();
  const { formValidationError, formValidationSuccess, buttonTap } = useHaptic();

  const [profileData, setProfileData] = useState<ProfileData>({
    age: '',
    annualIncome: '',
    currentSavings: '',
    monthlyExpenses: '',
    desiredRetirementAge: '',
    riskTolerance: '',
  });

  const [errors, setErrors] = useState<Partial<ProfileData>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<ProfileData> = {};

    // Age validation
    const age = parseInt(profileData.age);
    if (!profileData.age || isNaN(age) || age < 18 || age > 80) {
      newErrors.age = 'Please enter a valid age between 18 and 80';
    }

    // Annual income validation
    const income = parseFloat(profileData.annualIncome);
    if (!profileData.annualIncome || isNaN(income) || income < 0) {
      newErrors.annualIncome = 'Please enter a valid annual income';
    }

    // Current savings validation
    const savings = parseFloat(profileData.currentSavings);
    if (!profileData.currentSavings || isNaN(savings) || savings < 0) {
      newErrors.currentSavings = 'Please enter your current savings amount';
    }

    // Monthly expenses validation
    const expenses = parseFloat(profileData.monthlyExpenses);
    if (!profileData.monthlyExpenses || isNaN(expenses) || expenses < 0) {
      newErrors.monthlyExpenses = 'Please enter your monthly expenses';
    }

    // Desired retirement age validation
    const retirementAge = parseInt(profileData.desiredRetirementAge);
    if (!profileData.desiredRetirementAge || isNaN(retirementAge) || retirementAge <= age || retirementAge > 100) {
      newErrors.desiredRetirementAge = 'Please enter a valid retirement age';
    }

    // Risk tolerance validation
    if (!profileData.riskTolerance) {
      newErrors.riskTolerance = 'Please select your risk tolerance';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleRiskToleranceSelect = async (tolerance: ProfileData['riskTolerance']) => {
    await buttonTap();
    handleInputChange('riskTolerance', tolerance);
  };

  const handleContinue = async () => {
    if (!validateForm()) {
      await formValidationError();
      return;
    }

    setLoading(true);
    
    try {
      await formValidationSuccess();
      
      // Convert string values to numbers for storage
      const profileForStorage = {
        age: parseInt(profileData.age),
        annualIncome: parseFloat(profileData.annualIncome),
        currentSavings: parseFloat(profileData.currentSavings),
        monthlyExpenses: parseFloat(profileData.monthlyExpenses),
        desiredRetirementAge: parseInt(profileData.desiredRetirementAge),
        riskTolerance: profileData.riskTolerance,
        // Calculate some derived values
        annualExpenses: parseFloat(profileData.monthlyExpenses) * 12,
        savingsRate: (parseFloat(profileData.annualIncome) - (parseFloat(profileData.monthlyExpenses) * 12)) / parseFloat(profileData.annualIncome),
      };

      if (currentStep) {
        await completeStep(currentStep.id, profileForStorage);
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      await formValidationError();
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return profileData.age && 
           profileData.annualIncome && 
           profileData.currentSavings && 
           profileData.monthlyExpenses && 
           profileData.desiredRetirementAge && 
           profileData.riskTolerance;
  };

  return (
    <OnboardingStepTemplate
      primaryButtonText="Continue"
      primaryButtonDisabled={!isFormValid()}
      loading={loading}
      onPrimaryPress={handleContinue}
    >
      <View style={styles.content}>
        {/* Basic Information */}
        <Card variant="outlined" padding="lg" style={styles.section}>
          <Text variant="h6" weight="semiBold" style={styles.sectionTitle}>
            Basic Information
          </Text>
          
          <Flex direction="column" gap="md">
            <Input
              label="Age"
              placeholder="e.g., 28"
              value={profileData.age}
              onChangeText={(value) => handleInputChange('age', value)}
              keyboardType="numeric"
              error={!!errors.age}
              errorMessage={errors.age}
            />
            
            <Input
              label="Annual Income"
              placeholder="e.g., 75000"
              value={profileData.annualIncome}
              onChangeText={(value) => handleInputChange('annualIncome', value)}
              keyboardType="numeric"
              error={!!errors.annualIncome}
              errorMessage={errors.annualIncome}
              leftIcon="$"
            />
          </Flex>
        </Card>

        {/* Financial Information */}
        <Card variant="outlined" padding="lg" style={styles.section}>
          <Text variant="h6" weight="semiBold" style={styles.sectionTitle}>
            Financial Details
          </Text>
          
          <Flex direction="column" gap="md">
            <Input
              label="Current Savings"
              placeholder="e.g., 25000"
              value={profileData.currentSavings}
              onChangeText={(value) => handleInputChange('currentSavings', value)}
              keyboardType="numeric"
              error={!!errors.currentSavings}
              errorMessage={errors.currentSavings}
              leftIcon="$"
            />
            
            <Input
              label="Monthly Expenses"
              placeholder="e.g., 3500"
              value={profileData.monthlyExpenses}
              onChangeText={(value) => handleInputChange('monthlyExpenses', value)}
              keyboardType="numeric"
              error={!!errors.monthlyExpenses}
              errorMessage={errors.monthlyExpenses}
              leftIcon="$"
            />
            
            <Input
              label="Desired Retirement Age"
              placeholder="e.g., 55"
              value={profileData.desiredRetirementAge}
              onChangeText={(value) => handleInputChange('desiredRetirementAge', value)}
              keyboardType="numeric"
              error={!!errors.desiredRetirementAge}
              errorMessage={errors.desiredRetirementAge}
            />
          </Flex>
        </Card>

        {/* Risk Tolerance */}
        <Card variant="outlined" padding="lg" style={styles.section}>
          <Text variant="h6" weight="semiBold" style={styles.sectionTitle}>
            Investment Risk Tolerance
          </Text>
          
          <Text variant="body2" color="text.secondary" style={styles.sectionDescription}>
            How comfortable are you with investment volatility?
          </Text>
          
          <Flex direction="column" gap="sm" style={styles.riskOptions}>
            <Button
              variant={profileData.riskTolerance === 'conservative' ? 'primary' : 'outline'}
              size="md"
              onPress={() => handleRiskToleranceSelect('conservative')}
              style={styles.riskButton}
            >
              <Flex direction="column" align="center">
                <Text variant="body1" weight="medium">Conservative</Text>
                <Text variant="caption" color="text.secondary">Lower risk, steady growth</Text>
              </Flex>
            </Button>
            
            <Button
              variant={profileData.riskTolerance === 'moderate' ? 'primary' : 'outline'}
              size="md"
              onPress={() => handleRiskToleranceSelect('moderate')}
              style={styles.riskButton}
            >
              <Flex direction="column" align="center">
                <Text variant="body1" weight="medium">Moderate</Text>
                <Text variant="caption" color="text.secondary">Balanced risk and growth</Text>
              </Flex>
            </Button>
            
            <Button
              variant={profileData.riskTolerance === 'aggressive' ? 'primary' : 'outline'}
              size="md"
              onPress={() => handleRiskToleranceSelect('aggressive')}
              style={styles.riskButton}
            >
              <Flex direction="column" align="center">
                <Text variant="body1" weight="medium">Aggressive</Text>
                <Text variant="caption" color="text.secondary">Higher risk, higher potential</Text>
              </Flex>
            </Button>
          </Flex>
          
          {errors.riskTolerance && (
            <Text variant="caption" color="error.500" style={styles.errorText}>
              {errors.riskTolerance}
            </Text>
          )}
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
    marginBottom: 8,
  },
  sectionDescription: {
    marginBottom: 16,
    lineHeight: 20,
  },
  riskOptions: {
    marginTop: 8,
  },
  riskButton: {
    paddingVertical: 16,
  },
  errorText: {
    marginTop: 8,
  },
});

export default ProfileSetupStep;
