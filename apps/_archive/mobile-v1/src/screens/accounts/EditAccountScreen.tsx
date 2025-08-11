/**
 * EditAccountScreen Component
 * Comprehensive account editing with validation and audit trail
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { AccountsStackScreenProps } from '../../types/navigation';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  ScreenTemplate,
  Card,
  Button,
  Icon,
  Input,
  Flex,
} from '../../components/ui';
import AccountTypePicker from '../../components/financial/AccountTypePicker';
import TaxTreatmentPicker from '../../components/financial/TaxTreatmentPicker';
import InstitutionPicker from '../../components/financial/InstitutionPicker';
import ColorPicker from '../../components/financial/ColorPicker';
import TagManager from '../../components/financial/TagManager';
import { database } from '../../database';
import FinancialAccount from '../../database/models/FinancialAccount';
import { accountValidationService } from '../../services/financial/AccountValidationService';
import { useFormHaptic } from '../../hooks/useHaptic';
import type {
  AccountType,
  TaxTreatment,
} from '@drishti/shared/types/financial';

type Props = AccountsStackScreenProps<'EditAccount'>;

interface FormData {
  name: string;
  accountType: AccountType;
  institution: string;
  balance: string;
  interestRate: string;
  institutionId?: string;
  routingNumber?: string;
  accountNumberEncrypted?: string;
  taxTreatment?: TaxTreatment;
  tags: string[];
  color?: string;
  linkedAccountIds: string[];
}

interface FormErrors {
  name?: string;
  accountType?: string;
  institution?: string;
  balance?: string;
  interestRate?: string;
  routingNumber?: string;
  general?: string;
}

const EditAccountScreen: React.FC<Props> = ({ navigation, route }) => {
  const { accountId } = route.params;
  const { theme } = useTheme();
  const { user } = useAuth();
  const haptic = useFormHaptic();

  const [account, setAccount] = useState<FinancialAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    accountType: 'checking',
    institution: '',
    balance: '',
    interestRate: '',
    taxTreatment: 'taxable',
    tags: [],
    linkedAccountIds: [],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [originalData, setOriginalData] = useState<FormData | null>(null);

  useEffect(() => {
    loadAccount();
  }, [accountId]);

  useEffect(() => {
    if (originalData) {
      const changed = JSON.stringify(formData) !== JSON.stringify(originalData);
      setHasChanges(changed);
    }
  }, [formData, originalData]);

  const loadAccount = async () => {
    try {
      setLoading(true);
      const accountRecord = await database
        .get('financial_accounts')
        .find(accountId);

      if (!accountRecord) {
        Alert.alert('Error', 'Account not found');
        navigation.goBack();
        return;
      }

      const accountData = accountRecord as FinancialAccount;
      setAccount(accountData);

      const initialFormData: FormData = {
        name: accountData.name,
        accountType: accountData.accountType,
        institution: accountData.institution || '',
        balance: accountData.balance.toString(),
        interestRate: accountData.interestRate?.toString() || '',
        institutionId: accountData.institutionId,
        routingNumber: accountData.routingNumber,
        accountNumberEncrypted: accountData.accountNumberEncrypted,
        taxTreatment: (accountData.taxTreatment as TaxTreatment) || 'taxable',
        tags: accountData.tags,
        color: accountData.color,
        linkedAccountIds: accountData.linkedAccountIds,
      };

      setFormData(initialFormData);
      setOriginalData(initialFormData);
    } catch (error) {
      console.error('Error loading account:', error);
      Alert.alert('Error', 'Failed to load account details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate account name
    if (!formData.name.trim()) {
      newErrors.name = 'Account name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Account name must be at least 2 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Account name must be less than 50 characters';
    }

    // Validate balance
    const balance = parseFloat(formData.balance);
    if (isNaN(balance)) {
      newErrors.balance = 'Please enter a valid balance';
    }

    // Validate interest rate if provided
    if (formData.interestRate) {
      const rate = parseFloat(formData.interestRate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        newErrors.interestRate = 'Interest rate must be between 0 and 100';
      }
    }

    // Validate routing number if provided
    if (formData.routingNumber) {
      const validation = accountValidationService.validateRoutingNumber(
        formData.routingNumber
      );
      if (!validation.isValid) {
        newErrors.routingNumber = validation.error || 'Invalid routing number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !account) {
      await haptic.error();
      return;
    }

    try {
      setSaving(true);
      await haptic.light();

      await database.write(async () => {
        await account.update((acc: FinancialAccount) => {
          acc.name = formData.name.trim();
          acc.accountType = formData.accountType;
          acc.institution = formData.institution.trim();
          acc.balance = parseFloat(formData.balance);
          acc.interestRate = formData.interestRate
            ? parseFloat(formData.interestRate)
            : undefined;
          acc.institutionId = formData.institutionId;
          acc.routingNumber = formData.routingNumber;
          acc.accountNumberEncrypted = formData.accountNumberEncrypted;
          acc.taxTreatment = formData.taxTreatment;
          acc.tagsRaw = JSON.stringify(formData.tags);
          acc.color = formData.color;
          acc.linkedAccountIdsRaw = JSON.stringify(formData.linkedAccountIds);
          acc.updatedAt = new Date();
        });
      });

      await haptic.success();
      setHasChanges(false);

      Alert.alert('Success', 'Account updated successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error updating account:', error);
      await haptic.error();
      Alert.alert('Error', 'Failed to update account. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    await haptic.light();

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

  const handleDelete = async () => {
    if (!account) return;

    Alert.alert(
      'Delete Account',
      `Are you sure you want to delete "${account.name}"? This will move the account to trash where it can be recovered for 30 days.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await database.write(async () => {
                await account.update((acc: FinancialAccount) => {
                  acc.isActive = false;
                  acc.updatedAt = new Date();
                });
              });

              await haptic.success();
              Alert.alert(
                'Account Deleted',
                'Account has been moved to trash and can be recovered for 30 days.',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.navigate('AccountsList'),
                  },
                ]
              );
            } catch (error) {
              console.error('Error deleting account:', error);
              await haptic.error();
              Alert.alert(
                'Error',
                'Failed to delete account. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  const handleArchive = async () => {
    if (!account) return;

    Alert.alert(
      'Archive Account',
      `Archive "${account.name}"? Archived accounts are hidden from the main list but preserve all historical data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          onPress: async () => {
            try {
              await database.write(async () => {
                await account.update((acc: FinancialAccount) => {
                  // Add archived flag to metadata
                  const metadata = acc.metadata;
                  metadata.archived = true;
                  metadata.archivedAt = new Date().toISOString();
                  acc.metadataRaw = JSON.stringify(metadata);
                  acc.updatedAt = new Date();
                });
              });

              await haptic.success();
              Alert.alert(
                'Account Archived',
                'Account has been archived and hidden from the main list.',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.navigate('AccountsList'),
                  },
                ]
              );
            } catch (error) {
              console.error('Error archiving account:', error);
              await haptic.error();
              Alert.alert(
                'Error',
                'Failed to archive account. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <ScreenTemplate
        title='Edit Account'
        showBackButton
        scrollable={false}
        padding='none'
      >
        <View style={styles.loadingContainer}>
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}
          >
            Loading account details...
          </Text>
        </View>
      </ScreenTemplate>
    );
  }

  if (!account) {
    return (
      <ScreenTemplate
        title='Edit Account'
        showBackButton
        scrollable={false}
        padding='none'
      >
        <View style={styles.errorContainer}>
          <Icon name='alert-circle-outline' size='lg' color='error' />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            Account not found
          </Text>
        </View>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate
      title='Edit Account'
      showBackButton
      onBackPress={handleCancel}
      scrollable={false}
      padding='none'
      headerActions={
        <Button
          variant='ghost'
          size='sm'
          onPress={handleSave}
          disabled={!hasChanges || saving}
          loading={saving}
        >
          Save
        </Button>
      }
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <Card variant='outlined' padding='lg' style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Basic Information
          </Text>

          <Input
            label='Account Name'
            placeholder='Enter account name'
            value={formData.name}
            onChangeText={value => updateField('name', value)}
            error={!!errors.name}
            errorMessage={errors.name}
            required
            leftIcon={
              <Icon name='wallet-outline' size='sm' color='textSecondary' />
            }
            testID='account-name-input'
          />

          <AccountTypePicker
            selectedType={formData.accountType}
            onTypeSelect={type => updateField('accountType', type)}
            error={!!errors.accountType}
            errorMessage={errors.accountType}
            testID='account-type-picker'
          />

          <Input
            label='Current Balance'
            placeholder='0.00'
            value={formData.balance}
            onChangeText={value => updateField('balance', value)}
            error={!!errors.balance}
            errorMessage={errors.balance}
            keyboardType='numeric'
            leftIcon={
              <Icon name='cash-outline' size='sm' color='textSecondary' />
            }
            testID='balance-input'
          />

          <Input
            label='Interest Rate (%)'
            placeholder='0.00'
            value={formData.interestRate}
            onChangeText={value => updateField('interestRate', value)}
            error={!!errors.interestRate}
            errorMessage={errors.interestRate}
            keyboardType='numeric'
            leftIcon={
              <Icon
                name='trending-up-outline'
                size='sm'
                color='textSecondary'
              />
            }
            testID='interest-rate-input'
          />
        </Card>

        {/* Institution Information */}
        <Card variant='outlined' padding='lg' style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Institution Information
          </Text>

          <InstitutionPicker
            selectedInstitution={formData.institution}
            onInstitutionSelect={(institution, institutionId) => {
              updateField('institution', institution);
              updateField('institutionId', institutionId);
            }}
            testID='institution-picker'
          />

          <Input
            label='Routing Number'
            placeholder='Enter routing number'
            value={formData.routingNumber || ''}
            onChangeText={value => updateField('routingNumber', value)}
            error={!!errors.routingNumber}
            errorMessage={errors.routingNumber}
            keyboardType='numeric'
            leftIcon={
              <Icon name='card-outline' size='sm' color='textSecondary' />
            }
            testID='routing-number-input'
          />
        </Card>

        {/* Tax Treatment */}
        <Card variant='outlined' padding='lg' style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Tax Treatment
          </Text>

          <TaxTreatmentPicker
            selectedTreatment={formData.taxTreatment}
            onTreatmentSelect={treatment =>
              updateField('taxTreatment', treatment)
            }
            accountType={formData.accountType}
            testID='tax-treatment-picker'
          />
        </Card>

        {/* Customization */}
        <Card variant='outlined' padding='lg' style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Customization
          </Text>

          <ColorPicker
            selectedColor={formData.color}
            onColorSelect={color => updateField('color', color)}
            label='Account Color'
            testID='color-picker'
          />

          <TagManager
            tags={formData.tags}
            onTagsChange={tags => updateField('tags', tags)}
            label='Tags'
            placeholder='Add tags to organize your account'
            testID='tag-manager'
          />
        </Card>

        {/* Actions */}
        <Card variant='outlined' padding='lg' style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Account Actions
          </Text>

          <Flex direction='column' gap='sm'>
            <Button
              variant='outline'
              onPress={handleArchive}
              leftIcon={<Icon name='archive-outline' size='sm' />}
              testID='archive-button'
            >
              Archive Account
            </Button>

            <Button
              variant='outline'
              onPress={handleDelete}
              leftIcon={<Icon name='trash-outline' size='sm' />}
              style={[styles.deleteButton, { borderColor: theme.colors.error }]}
              testID='delete-button'
            >
              <Text
                style={[styles.deleteButtonText, { color: theme.colors.error }]}
              >
                Delete Account
              </Text>
            </Button>
          </Flex>
        </Card>

        {/* Save/Cancel Buttons */}
        <Card variant='outlined' padding='lg' style={styles.section}>
          <Flex direction='row' gap='sm'>
            <Button
              variant='outline'
              onPress={handleCancel}
              style={styles.actionButton}
              testID='cancel-button'
            >
              Cancel
            </Button>

            <Button
              variant='filled'
              onPress={handleSave}
              disabled={!hasChanges || saving}
              loading={saving}
              style={styles.actionButton}
              testID='save-button'
            >
              Save Changes
            </Button>
          </Flex>
        </Card>
      </ScrollView>
    </ScreenTemplate>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    margin: 16,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  deleteButton: {
    borderWidth: 1,
  },
  deleteButtonText: {
    fontWeight: '500',
  },
  actionButton: {
    flex: 1,
  },
});

export default EditAccountScreen;
