/**
 * Edit Profile Screen
 * Comprehensive profile editing with validation and real-time updates
 */

import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, Input, Card, Flex, Icon, LoadingState } from '../../components/ui';
import { useProfile } from '../../contexts/ProfileContext';
import { useHaptic } from '../../hooks/useHaptic';
import { useNavigation } from '@react-navigation/native';
import { UpdateProfileRequest } from '../../types/profile';

interface FormData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Financial Information
  age: string;
  annualIncome: string;
  currentSavings: string;
  monthlyExpenses: string;
  desiredRetirementAge: string;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
}

interface FormErrors {
  [key: string]: string;
}

const EditProfileScreen: React.FC = () => {
  const { profile, updateMultipleFields, loading } = useProfile();
  const { formValidationError, formValidationSuccess, buttonTap } = useHaptic();
  const navigation = useNavigation();

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    age: '',
    annualIncome: '',
    currentSavings: '',
    monthlyExpenses: '',
    desiredRetirementAge: '',
    riskTolerance: 'moderate',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data from profile
  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.personalInfo.firstName || '',
        lastName: profile.personalInfo.lastName || '',
        email: profile.personalInfo.email || '',
        phone: profile.personalInfo.phone || '',
        age: profile.financialInfo.age.toString(),
        annualIncome: profile.financialInfo.totalAnnualIncome.toString(),
        currentSavings: profile.financialInfo.currentSavings.toString(),
        monthlyExpenses: profile.financialInfo.monthlyExpenses.toString(),
        desiredRetirementAge: profile.financialInfo.desiredRetirementAge.toString(),
        riskTolerance: profile.financialInfo.riskTolerance,
      });
    }
  }, [profile]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleRiskToleranceChange = async (tolerance: FormData['riskTolerance']) => {
    await buttonTap();
    handleInputChange('riskTolerance', tolerance);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Personal Information Validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Financial Information Validation
    const age = parseInt(formData.age);
    if (!formData.age || isNaN(age) || age < 18 || age > 100) {
      newErrors.age = 'Please enter a valid age between 18 and 100';
    }

    const income = parseFloat(formData.annualIncome);
    if (!formData.annualIncome || isNaN(income) || income < 0) {
      newErrors.annualIncome = 'Please enter a valid annual income';
    }

    const savings = parseFloat(formData.currentSavings);
    if (!formData.currentSavings || isNaN(savings) || savings < 0) {
      newErrors.currentSavings = 'Please enter your current savings amount';
    }

    const expenses = parseFloat(formData.monthlyExpenses);
    if (!formData.monthlyExpenses || isNaN(expenses) || expenses < 0) {
      newErrors.monthlyExpenses = 'Please enter your monthly expenses';
    }

    const retirementAge = parseInt(formData.desiredRetirementAge);
    if (!formData.desiredRetirementAge || isNaN(retirementAge) || retirementAge <= age || retirementAge > 100) {
      newErrors.desiredRetirementAge = 'Please enter a valid retirement age';
    }

    // Cross-validation
    if (expenses > 0 && income > 0) {
      const annualExpenses = expenses * 12;
      if (annualExpenses >= income) {
        newErrors.monthlyExpenses = 'Monthly expenses should be less than annual income';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      await formValidationError();
      return;
    }

    setSaving(true);
    
    try {
      const updates: UpdateProfileRequest[] = [
        // Personal Information
        { field: 'personalInfo.firstName', value: formData.firstName.trim() },
        { field: 'personalInfo.lastName', value: formData.lastName.trim() },
        { field: 'personalInfo.email', value: formData.email.trim() },
        { field: 'personalInfo.phone', value: formData.phone.trim() },
        
        // Financial Information
        { field: 'financialInfo.age', value: parseInt(formData.age) },
        { field: 'financialInfo.totalAnnualIncome', value: parseFloat(formData.annualIncome) },
        { field: 'financialInfo.primaryIncome.amount', value: parseFloat(formData.annualIncome) },
        { field: 'financialInfo.currentSavings', value: parseFloat(formData.currentSavings) },
        { field: 'financialInfo.monthlyExpenses', value: parseFloat(formData.monthlyExpenses) },
        { field: 'financialInfo.desiredRetirementAge', value: parseInt(formData.desiredRetirementAge) },
        { field: 'financialInfo.riskTolerance', value: formData.riskTolerance },
      ];

      await updateMultipleFields(updates);
      await formValidationSuccess();
      
      setHasChanges(false);
      
      Alert.alert(
        'Success',
        'Profile updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      await formValidationError();
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to update profile'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    await buttonTap();
    
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to cancel?',
        [
          {
            text: 'Keep Editing',
            style: 'cancel',
          },
          {
            text: 'Discard Changes',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState message="Loading profile..." size="lg" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Button variant="ghost" size="sm" onPress={handleCancel}>
          <Icon name="close" size="md" color="text.primary" />
        </Button>
        <Text variant="h6" weight="semiBold">Edit Profile</Text>
        <Button 
          variant="ghost" 
          size="sm" 
          onPress={handleSave}
          disabled={!hasChanges || saving}
        >
          <Text variant="body2" weight="medium" color={hasChanges ? "primary.500" : "text.secondary"}>
            Save
          </Text>
        </Button>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Personal Information */}
        <Card variant="outlined" padding="lg" style={styles.section}>
          <Text variant="h6" weight="semiBold" style={styles.sectionTitle}>
            Personal Information
          </Text>
          
          <Flex direction="column" gap="md">
            <Flex direction="row" gap="md">
              <Input
                label="First Name"
                placeholder="Enter first name"
                value={formData.firstName}
                onChangeText={(value) => handleInputChange('firstName', value)}
                error={!!errors.firstName}
                errorMessage={errors.firstName}
                style={styles.halfInput}
              />
              
              <Input
                label="Last Name"
                placeholder="Enter last name"
                value={formData.lastName}
                onChangeText={(value) => handleInputChange('lastName', value)}
                error={!!errors.lastName}
                errorMessage={errors.lastName}
                style={styles.halfInput}
              />
            </Flex>
            
            <Input
              label="Email"
              placeholder="Enter email address"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              error={!!errors.email}
              errorMessage={errors.email}
            />
            
            <Input
              label="Phone (Optional)"
              placeholder="Enter phone number"
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              keyboardType="phone-pad"
              error={!!errors.phone}
              errorMessage={errors.phone}
            />
          </Flex>
        </Card>

        {/* Financial Information */}
        <Card variant="outlined" padding="lg" style={styles.section}>
          <Text variant="h6" weight="semiBold" style={styles.sectionTitle}>
            Financial Information
          </Text>
          
          <Flex direction="column" gap="md">
            <Flex direction="row" gap="md">
              <Input
                label="Age"
                placeholder="e.g., 28"
                value={formData.age}
                onChangeText={(value) => handleInputChange('age', value)}
                keyboardType="numeric"
                error={!!errors.age}
                errorMessage={errors.age}
                style={styles.halfInput}
              />
              
              <Input
                label="Retirement Age"
                placeholder="e.g., 55"
                value={formData.desiredRetirementAge}
                onChangeText={(value) => handleInputChange('desiredRetirementAge', value)}
                keyboardType="numeric"
                error={!!errors.desiredRetirementAge}
                errorMessage={errors.desiredRetirementAge}
                style={styles.halfInput}
              />
            </Flex>
            
            <Input
              label="Annual Income"
              placeholder="e.g., 75000"
              value={formData.annualIncome}
              onChangeText={(value) => handleInputChange('annualIncome', value)}
              keyboardType="numeric"
              leftIcon="$"
              error={!!errors.annualIncome}
              errorMessage={errors.annualIncome}
            />
            
            <Input
              label="Current Savings"
              placeholder="e.g., 25000"
              value={formData.currentSavings}
              onChangeText={(value) => handleInputChange('currentSavings', value)}
              keyboardType="numeric"
              leftIcon="$"
              error={!!errors.currentSavings}
              errorMessage={errors.currentSavings}
            />
            
            <Input
              label="Monthly Expenses"
              placeholder="e.g., 3500"
              value={formData.monthlyExpenses}
              onChangeText={(value) => handleInputChange('monthlyExpenses', value)}
              keyboardType="numeric"
              leftIcon="$"
              error={!!errors.monthlyExpenses}
              errorMessage={errors.monthlyExpenses}
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
              variant={formData.riskTolerance === 'conservative' ? 'primary' : 'outline'}
              size="md"
              onPress={() => handleRiskToleranceChange('conservative')}
              style={styles.riskButton}
            >
              <Flex direction="column" align="center">
                <Text variant="body1" weight="medium">Conservative</Text>
                <Text variant="caption" color="text.secondary">Lower risk, steady growth</Text>
              </Flex>
            </Button>
            
            <Button
              variant={formData.riskTolerance === 'moderate' ? 'primary' : 'outline'}
              size="md"
              onPress={() => handleRiskToleranceChange('moderate')}
              style={styles.riskButton}
            >
              <Flex direction="column" align="center">
                <Text variant="body1" weight="medium">Moderate</Text>
                <Text variant="caption" color="text.secondary">Balanced risk and growth</Text>
              </Flex>
            </Button>
            
            <Button
              variant={formData.riskTolerance === 'aggressive' ? 'primary' : 'outline'}
              size="md"
              onPress={() => handleRiskToleranceChange('aggressive')}
              style={styles.riskButton}
            >
              <Flex direction="column" align="center">
                <Text variant="body1" weight="medium">Aggressive</Text>
                <Text variant="caption" color="text.secondary">Higher risk, higher potential</Text>
              </Flex>
            </Button>
          </Flex>
        </Card>

        {/* Save Button */}
        <View style={styles.saveButtonContainer}>
          <Button
            variant="primary"
            size="lg"
            onPress={handleSave}
            disabled={!hasChanges}
            loading={saving}
            style={styles.saveButton}
          >
            Save Changes
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  sectionDescription: {
    marginBottom: 16,
    lineHeight: 20,
  },
  halfInput: {
    flex: 1,
  },
  riskOptions: {
    marginTop: 8,
  },
  riskButton: {
    paddingVertical: 16,
  },
  saveButtonContainer: {
    paddingVertical: 20,
  },
  saveButton: {
    width: '100%',
  },
});

export default EditProfileScreen;
