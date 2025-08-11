/**
 * Add Account Screen (Template Example)
 * Demonstrates the use of form templates and validation
 */

import React, { useState } from 'react';
import { Alert } from 'react-native';
import { AccountsStackScreenProps } from '../../types/navigation';
import {
  ScreenTemplate,
  FormTemplate,
  Input,
  Text,
  Card,
  Flex,
  Icon,
} from '../../components/ui';

type Props = AccountsStackScreenProps<'AddAccount'>;

interface FormData {
  name: string;
  type: string;
  initialBalance: string;
  currency: string;
  description: string;
}

interface FormErrors {
  name?: string;
  type?: string;
  initialBalance?: string;
  currency?: string;
}

const AddAccountScreen: React.FC<Props> = ({ navigation }) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: 'checking',
    initialBalance: '',
    currency: 'USD',
    description: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Account name is required';
    }

    if (!formData.type) {
      newErrors.type = 'Account type is required';
    }

    if (!formData.initialBalance.trim()) {
      newErrors.initialBalance = 'Initial balance is required';
    } else if (isNaN(Number(formData.initialBalance))) {
      newErrors.initialBalance = 'Please enter a valid number';
    }

    if (!formData.currency.trim()) {
      newErrors.currency = 'Currency is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Success',
        'Account created successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to create account. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigation.goBack();
  };

  // Update form field
  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <ScreenTemplate
      title="Add Account"
      showBackButton={true}
      scrollable={false}
      padding="none"
      testID="add-account-screen"
    >
      <FormTemplate
        title="Create New Account"
        subtitle="Add a new financial account to track your money"
        onSubmit={handleSubmit}
        submitText="Create Account"
        submitDisabled={loading}
        submitLoading={loading}
        showCancelButton={true}
        onCancel={handleCancel}
        cancelText="Cancel"
        scrollable={true}
        testID="add-account-form"
      >
        {/* Account Name */}
        <Input
          label="Account Name"
          placeholder="Enter account name"
          value={formData.name}
          onChangeText={(value) => updateField('name', value)}
          error={!!errors.name}
          errorMessage={errors.name}
          required
          leftIcon={
            <Icon
              name="wallet-outline"
              size="sm"
              color="text.tertiary"
            />
          }
          testID="account-name-input"
        />

        {/* Account Type */}
        <Card variant="outlined" padding="base" style={{ marginVertical: 8 }}>
          <Text variant="body2" weight="medium" style={{ marginBottom: 12 }}>
            Account Type *
          </Text>
          
          <Flex direction="column" gap="sm">
            {[
              { value: 'checking', label: 'Checking Account', icon: 'card-outline' },
              { value: 'savings', label: 'Savings Account', icon: 'wallet-outline' },
              { value: 'investment', label: 'Investment Account', icon: 'trending-up-outline' },
              { value: 'credit', label: 'Credit Card', icon: 'card' },
            ].map((type) => (
              <Card
                key={type.value}
                variant={formData.type === type.value ? 'filled' : 'outlined'}
                padding="base"
                onPress={() => updateField('type', type.value)}
                style={{
                  borderColor: formData.type === type.value ? '#2196F3' : undefined,
                }}
              >
                <Flex direction="row" align="center" gap="base">
                  <Icon
                    name={type.icon as any}
                    size="md"
                    color={formData.type === type.value ? 'primary.500' : 'text.tertiary'}
                  />
                  <Text
                    variant="body1"
                    color={formData.type === type.value ? 'primary.500' : 'text.primary'}
                  >
                    {type.label}
                  </Text>
                </Flex>
              </Card>
            ))}
          </Flex>
          
          {errors.type && (
            <Text variant="caption" color="error.500" style={{ marginTop: 8 }}>
              {errors.type}
            </Text>
          )}
        </Card>

        {/* Initial Balance */}
        <Input
          label="Initial Balance"
          placeholder="0.00"
          value={formData.initialBalance}
          onChangeText={(value) => updateField('initialBalance', value)}
          keyboardType="numeric"
          error={!!errors.initialBalance}
          errorMessage={errors.initialBalance}
          required
          leftIcon={
            <Icon
              name="cash-outline"
              size="sm"
              color="text.tertiary"
            />
          }
          testID="initial-balance-input"
        />

        {/* Currency */}
        <Input
          label="Currency"
          placeholder="USD"
          value={formData.currency}
          onChangeText={(value) => updateField('currency', value.toUpperCase())}
          error={!!errors.currency}
          errorMessage={errors.currency}
          required
          leftIcon={
            <Icon
              name="globe-outline"
              size="sm"
              color="text.tertiary"
            />
          }
          testID="currency-input"
        />

        {/* Description */}
        <Input
          label="Description (Optional)"
          placeholder="Add a description for this account"
          value={formData.description}
          onChangeText={(value) => updateField('description', value)}
          multiline
          numberOfLines={3}
          leftIcon={
            <Icon
              name="document-text-outline"
              size="sm"
              color="text.tertiary"
            />
          }
          testID="description-input"
        />
      </FormTemplate>
    </ScreenTemplate>
  );
};

export default AddAccountScreen;
