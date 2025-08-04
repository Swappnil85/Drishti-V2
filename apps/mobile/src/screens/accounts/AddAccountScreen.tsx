/**
 * AddAccountScreen Component
 * Enhanced account creation wizard with guided input
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { AccountsStackScreenProps } from '../../types/navigation';
import { useTheme } from '../../contexts/ThemeContext';
import {
  ScreenTemplate,
  FormTemplate,
  Input,
  Button,
  Card,
  Flex,
  Icon,
} from '../../components/ui';
import AccountTypePicker from '../../components/financial/AccountTypePicker';
import InstitutionPicker from '../../components/financial/InstitutionPicker';
import TaxTreatmentPicker from '../../components/financial/TaxTreatmentPicker';
import TagManager from '../../components/financial/TagManager';
import ColorPicker from '../../components/financial/ColorPicker';
import AccountLinkingManager from '../../components/financial/AccountLinkingManager';
import FinancialInstitution from '../../database/models/FinancialInstitution';
import { institutionService } from '../../services/financial/InstitutionService';
import { database } from '../../database';
import { useAuth } from '../../contexts/AuthContext';
import { useFormHaptic } from '../../hooks/useHaptic';
import { accountValidationService } from '../../services/financial/AccountValidationService';
import type {
  AccountType,
  Currency,
  TaxTreatment,
  CURRENCIES,
} from '@drishti/shared/types/financial';

type Props = AccountsStackScreenProps<'AddAccount'>;

interface FormData {
  name: string;
  accountType?: AccountType;
  institution?: FinancialInstitution;
  balance: string;
  currency: Currency;
  interestRate: string;
  taxTreatment?: TaxTreatment;
  routingNumber: string;
  accountNumber: string;
  tags: string[];
  color?: string;
  notes: string;
}

interface FormErrors {
  name?: string;
  accountType?: string;
  institution?: string;
  balance?: string;
  currency?: string;
  interestRate?: string;
  routingNumber?: string;
  accountNumber?: string;
}

interface FormWarnings {
  balance?: string;
  interestRate?: string;
  institution?: string;
  taxTreatment?: string;
}

const CURRENCY_OPTIONS: { value: Currency; label: string; symbol: string }[] = [
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'GBP', label: 'British Pound', symbol: '£' },
  { value: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
  { value: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
  { value: 'JPY', label: 'Japanese Yen', symbol: '¥' },
];

const AddAccountScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const formHaptic = useFormHaptic();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    balance: '',
    currency: 'USD',
    interestRate: '',
    routingNumber: '',
    accountNumber: '',
    tags: [],
    notes: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [warnings, setWarnings] = useState<FormWarnings>({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Auto-populate interest rate when institution is selected
  useEffect(() => {
    if (formData.institution && formData.accountType) {
      const defaultRate = formData.institution.getDefaultInterestRate(
        formData.accountType
      );
      setFormData(prev => ({
        ...prev,
        interestRate: (defaultRate * 100).toFixed(2), // Convert to percentage
      }));
    }
  }, [formData.institution, formData.accountType]);

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error and warning when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (warnings[field as keyof FormWarnings]) {
      setWarnings(prev => ({ ...prev, [field]: undefined }));
    }

    // Real-time validation for certain fields
    if (
      [
        'name',
        'balance',
        'interestRate',
        'routingNumber',
        'accountNumber',
      ].includes(field)
    ) {
      validateFieldRealTime(field, value);
    }
  };

  const validateFieldRealTime = (field: keyof FormData, value: any) => {
    if (!value || (typeof value === 'string' && !value.trim())) return;

    const validation = accountValidationService.validateField(
      field as any,
      value,
      formData.accountType
    );

    if (validation.errors.length > 0) {
      setErrors(prev => ({
        ...prev,
        [field]: validation.errors[0].message,
      }));
    }

    if (validation.warnings.length > 0) {
      setWarnings(prev => ({
        ...prev,
        [field]: validation.warnings[0].message,
      }));
    }
  };

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: FormErrors = {};
    const newWarnings: FormWarnings = {};

    if (stepNumber === 1) {
      // Step 1: Basic Information
      if (!formData.name.trim()) {
        newErrors.name = 'Account name is required';
      } else {
        const nameValidation = accountValidationService.validateField(
          'name',
          formData.name
        );
        if (nameValidation.errors.length > 0) {
          newErrors.name = nameValidation.errors[0].message;
        }
      }

      if (!formData.accountType) {
        newErrors.accountType = 'Please select an account type';
      }
    } else if (stepNumber === 2) {
      // Step 2: Institution and Financial Details
      if (!formData.balance.trim()) {
        newErrors.balance = 'Balance is required';
      } else {
        const balanceNum = parseFloat(formData.balance);
        if (isNaN(balanceNum)) {
          newErrors.balance = 'Please enter a valid number';
        } else if (formData.accountType) {
          const balanceValidation = accountValidationService.validateField(
            'balance',
            balanceNum,
            formData.accountType
          );
          if (balanceValidation.errors.length > 0) {
            newErrors.balance = balanceValidation.errors[0].message;
          }
          if (balanceValidation.warnings.length > 0) {
            newWarnings.balance = balanceValidation.warnings[0].message;
          }
        }
      }

      if (formData.interestRate) {
        const rateNum = parseFloat(formData.interestRate);
        if (isNaN(rateNum)) {
          newErrors.interestRate = 'Please enter a valid interest rate';
        } else if (formData.accountType) {
          const rateValidation = accountValidationService.validateField(
            'interestRate',
            rateNum / 100,
            formData.accountType
          );
          if (rateValidation.errors.length > 0) {
            newErrors.interestRate = rateValidation.errors[0].message;
          }
          if (rateValidation.warnings.length > 0) {
            newWarnings.interestRate = rateValidation.warnings[0].message;
          }
        }
      }
    } else if (stepNumber === 3) {
      // Step 3: Additional Information
      if (formData.routingNumber) {
        const routingValidation = accountValidationService.validateField(
          'routingNumber',
          formData.routingNumber
        );
        if (routingValidation.errors.length > 0) {
          newErrors.routingNumber = routingValidation.errors[0].message;
        }
      }

      if (formData.accountNumber) {
        const accountValidation = accountValidationService.validateField(
          'accountNumber',
          formData.accountNumber
        );
        if (accountValidation.errors.length > 0) {
          newErrors.accountNumber = accountValidation.errors[0].message;
        }
      }
    }

    setErrors(newErrors);
    setWarnings(newWarnings);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (validateStep(step)) {
      await formHaptic.success();
      setStep(prev => Math.min(prev + 1, totalSteps));
    } else {
      await formHaptic.error();
    }
  };

  const handleBack = async () => {
    await formHaptic.light();
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) {
      await formHaptic.error();
      return;
    }

    setLoading(true);

    try {
      await database.write(async () => {
        const accountsCollection = database.get('financial_accounts');

        await accountsCollection.create((account: any) => {
          account.userId = user?.id;
          account.name = formData.name.trim();
          account.accountType = formData.accountType;
          account.institutionId = formData.institution?.id;
          account.institution = formData.institution?.name;
          account.balance = parseFloat(formData.balance);
          account.currency = formData.currency;
          account.interestRate = formData.interestRate
            ? parseFloat(formData.interestRate) / 100
            : null;
          account.taxTreatment = formData.taxTreatment;
          account.routingNumber = formData.routingNumber || null;
          account.tags = formData.tags;
          account.color = formData.color;
          account.linkedAccountIds = [];
          account.isActive = true;
          account.metadata = {
            notes: formData.notes,
            createdVia: 'mobile_app',
          };
        });
      });

      await formHaptic.success();

      Alert.alert(
        'Account Created',
        `${formData.name} has been added successfully!`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating account:', error);
      await formHaptic.error();

      Alert.alert('Error', 'Failed to create account. Please try again.', [
        { text: 'OK' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Account Creation',
      'Are you sure you want to cancel? Your progress will be lost.',
      [
        { text: 'Continue Editing', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const renderProgressIndicator = () => (
    <Card variant='outlined' padding='base' style={styles.progressCard}>
      <Flex direction='row' align='center' justify='space-between'>
        <Text
          style={[styles.progressText, { color: theme.colors.text.secondary }]}
        >
          Step {step} of {totalSteps}
        </Text>
        <View style={styles.progressBar}>
          {Array.from({ length: totalSteps }, (_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                {
                  backgroundColor:
                    index < step
                      ? theme.colors.primary[500]
                      : theme.colors.border.primary,
                },
              ]}
            />
          ))}
        </View>
      </Flex>
    </Card>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.colors.text.primary }]}>
        Basic Information
      </Text>
      <Text
        style={[styles.stepSubtitle, { color: theme.colors.text.secondary }]}
      >
        Let's start with the basics about your account
      </Text>

      <Input
        label='Account Name'
        placeholder='e.g., Chase Checking, Emergency Savings'
        value={formData.name}
        onChangeText={value => updateField('name', value)}
        error={!!errors.name}
        errorMessage={errors.name}
        required
        leftIcon={
          <Icon name='wallet-outline' size='sm' color='text.tertiary' />
        }
        testID='account-name-input'
      />

      {warnings.name && (
        <Text
          style={[styles.warningText, { color: theme.colors.warning[500] }]}
        >
          ⚠️ {warnings.name}
        </Text>
      )}

      <AccountTypePicker
        selectedType={formData.accountType}
        onTypeSelect={type => updateField('accountType', type)}
        error={!!errors.accountType}
        errorMessage={errors.accountType}
        testID='account-type-picker'
      />
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.colors.text.primary }]}>
        Institution & Details
      </Text>
      <Text
        style={[styles.stepSubtitle, { color: theme.colors.text.secondary }]}
      >
        Add your financial institution and account details
      </Text>

      <InstitutionPicker
        selectedInstitution={formData.institution}
        onInstitutionSelect={institution =>
          updateField('institution', institution)
        }
        accountType={formData.accountType}
        error={!!errors.institution}
        errorMessage={errors.institution}
        testID='institution-picker'
      />

      <Flex direction='row' gap='base'>
        <View style={{ flex: 2 }}>
          <Input
            label='Current Balance'
            placeholder='0.00'
            value={formData.balance}
            onChangeText={value => updateField('balance', value)}
            keyboardType='decimal-pad'
            error={!!errors.balance}
            errorMessage={errors.balance}
            required
            leftIcon={<Text style={styles.currencySymbol}>$</Text>}
            testID='balance-input'
          />

          {warnings.balance && (
            <Text
              style={[styles.warningText, { color: theme.colors.warning[500] }]}
            >
              ⚠️ {warnings.balance}
            </Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Input
            label='Currency'
            value={formData.currency}
            editable={false}
            rightIcon={
              <Icon
                name='chevron-down-outline'
                size='sm'
                color='text.tertiary'
              />
            }
            testID='currency-input'
          />
        </View>
      </Flex>

      <Input
        label='Interest Rate (Optional)'
        placeholder='0.00'
        value={formData.interestRate}
        onChangeText={value => updateField('interestRate', value)}
        keyboardType='decimal-pad'
        error={!!errors.interestRate}
        errorMessage={errors.interestRate}
        rightIcon={<Text style={styles.percentSymbol}>%</Text>}
        helperText='Annual percentage rate (APR)'
        testID='interest-rate-input'
      />

      {warnings.interestRate && (
        <Text
          style={[styles.warningText, { color: theme.colors.warning[500] }]}
        >
          ⚠️ {warnings.interestRate}
        </Text>
      )}

      {formData.accountType &&
        ['retirement', 'investment', 'savings'].includes(
          formData.accountType
        ) && (
          <TaxTreatmentPicker
            selectedTreatment={formData.taxTreatment}
            onTreatmentSelect={treatment =>
              updateField('taxTreatment', treatment)
            }
            accountType={formData.accountType}
            testID='tax-treatment-picker'
          />
        )}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.colors.text.primary }]}>
        Additional Information
      </Text>
      <Text
        style={[styles.stepSubtitle, { color: theme.colors.text.secondary }]}
      >
        Optional details to help organize your account
      </Text>

      {formData.institution?.routingNumber && (
        <Input
          label='Routing Number (Optional)'
          placeholder='9-digit routing number'
          value={formData.routingNumber}
          onChangeText={value => updateField('routingNumber', value)}
          keyboardType='number-pad'
          maxLength={9}
          error={!!errors.routingNumber}
          errorMessage={errors.routingNumber}
          leftIcon={
            <Icon name='card-outline' size='sm' color='text.tertiary' />
          }
          helperText={`Institution routing: ${formData.institution.routingNumber}`}
          testID='routing-number-input'
        />
      )}

      <Input
        label='Account Number (Optional)'
        placeholder='Last 4 digits for reference'
        value={formData.accountNumber}
        onChangeText={value => updateField('accountNumber', value)}
        keyboardType='number-pad'
        maxLength={4}
        secureTextEntry
        error={!!errors.accountNumber}
        errorMessage={errors.accountNumber}
        leftIcon={
          <Icon name='shield-outline' size='sm' color='text.tertiary' />
        }
        helperText='Only last 4 digits for security'
        testID='account-number-input'
      />

      <TagManager
        tags={formData.tags}
        onTagsChange={tags => updateField('tags', tags)}
        testID='tag-manager'
      />

      <ColorPicker
        selectedColor={formData.color}
        onColorSelect={color => updateField('color', color)}
        testID='color-picker'
      />

      <AccountLinkingManager
        linkedAccountIds={[]} // Will be empty for new accounts
        onLinkedAccountsChange={() => {}} // Not applicable for new accounts
        label='Related Accounts (Available after creation)'
        testID='account-linking'
      />

      <Input
        label='Notes (Optional)'
        placeholder='Any additional notes about this account...'
        value={formData.notes}
        onChangeText={value => updateField('notes', value)}
        multiline
        numberOfLines={3}
        leftIcon={
          <Icon name='document-text-outline' size='sm' color='text.tertiary' />
        }
        testID='notes-input'
      />
    </View>
  );

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return renderStep1();
    }
  };

  const renderActions = () => (
    <Flex direction='row' gap='base' style={styles.actions}>
      {step > 1 && (
        <Button
          variant='outline'
          onPress={handleBack}
          leftIcon={<Icon name='chevron-back-outline' size='sm' />}
          style={{ flex: 1 }}
          testID='back-button'
        >
          Back
        </Button>
      )}

      {step < totalSteps ? (
        <Button
          variant='primary'
          onPress={handleNext}
          rightIcon={<Icon name='chevron-forward-outline' size='sm' />}
          style={{ flex: step > 1 ? 1 : undefined }}
          testID='next-button'
        >
          Next
        </Button>
      ) : (
        <Button
          variant='primary'
          onPress={handleSubmit}
          loading={loading}
          rightIcon={<Icon name='checkmark-outline' size='sm' />}
          style={{ flex: 1 }}
          testID='create-button'
        >
          Create Account
        </Button>
      )}
    </Flex>
  );

  return (
    <ScreenTemplate
      title='Add Account'
      showBackButton
      onBackPress={handleCancel}
      scrollable={false}
      padding='none'
      testID='add-account-screen'
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <View style={styles.content}>
          {renderProgressIndicator()}
          {renderStepContent()}
        </View>
        {renderActions()}
      </KeyboardAvoidingView>
    </ScreenTemplate>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  progressCard: {
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepContainer: {
    flex: 1,
    gap: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  stepSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  percentSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  actions: {
    padding: 16,
    paddingTop: 8,
  },
  warningText: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
});

export default AddAccountScreen;
