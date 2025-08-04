/**
 * Bulk Account Creator Component
 * Creates multiple accounts from a template with customization options
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  Card, 
  Icon, 
  Button, 
  Flex, 
  Input, 
  Switch,
  ProgressBar 
} from '../ui';
import InstitutionPicker from './InstitutionPicker';
import { database } from '../../database';
import FinancialInstitution from '../../database/models/FinancialInstitution';
import { useAuth } from '../../contexts/AuthContext';
import { useFormHaptic } from '../../hooks/useHaptic';
import type { 
  AccountTemplate, 
  AccountTemplateItem 
} from '../../services/financial/AccountTemplateService';

interface BulkAccountCreatorProps {
  template: AccountTemplate;
  onComplete: (createdAccounts: string[]) => void;
  onCancel: () => void;
  testID?: string;
}

interface AccountCreationItem extends AccountTemplateItem {
  id: string;
  enabled: boolean;
  customName?: string;
  customBalance?: number;
  selectedInstitution?: FinancialInstitution;
  validationErrors: string[];
}

const BulkAccountCreator: React.FC<BulkAccountCreatorProps> = ({
  template,
  onComplete,
  onCancel,
  testID,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const formHaptic = useFormHaptic();
  
  const [accounts, setAccounts] = useState<AccountCreationItem[]>([]);
  const [creating, setCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    initializeAccounts();
  }, [template]);

  const initializeAccounts = () => {
    const initialAccounts: AccountCreationItem[] = template.accounts.map((account, index) => ({
      ...account,
      id: `${template.id}-${index}`,
      enabled: account.isRequired,
      validationErrors: [],
    }));
    setAccounts(initialAccounts);
  };

  const updateAccount = (accountId: string, updates: Partial<AccountCreationItem>) => {
    setAccounts(prev => prev.map(account => 
      account.id === accountId 
        ? { ...account, ...updates, validationErrors: [] }
        : account
    ));
  };

  const validateAccount = (account: AccountCreationItem): string[] => {
    const errors: string[] = [];
    
    if (!account.customName?.trim() && !account.name) {
      errors.push('Account name is required');
    }
    
    if (account.customBalance !== undefined && account.customBalance < 0) {
      errors.push('Balance cannot be negative');
    }
    
    return errors;
  };

  const validateAllAccounts = (): boolean => {
    let isValid = true;
    const updatedAccounts = accounts.map(account => {
      if (!account.enabled) return account;
      
      const errors = validateAccount(account);
      if (errors.length > 0) {
        isValid = false;
      }
      
      return { ...account, validationErrors: errors };
    });
    
    setAccounts(updatedAccounts);
    return isValid;
  };

  const createAccounts = async () => {
    if (!validateAllAccounts()) {
      await formHaptic.error();
      Alert.alert('Validation Error', 'Please fix the errors before creating accounts.');
      return;
    }

    const enabledAccounts = accounts.filter(account => account.enabled);
    if (enabledAccounts.length === 0) {
      Alert.alert('No Accounts Selected', 'Please select at least one account to create.');
      return;
    }

    setCreating(true);
    setProgress(0);
    const createdAccountIds: string[] = [];

    try {
      await database.write(async () => {
        const accountsCollection = database.get('financial_accounts');
        
        for (let i = 0; i < enabledAccounts.length; i++) {
          const account = enabledAccounts[i];
          setCurrentStep(i + 1);
          setProgress((i + 1) / enabledAccounts.length);

          const createdAccount = await accountsCollection.create((newAccount: any) => {
            newAccount.userId = user?.id;
            newAccount.name = account.customName || account.name;
            newAccount.accountType = account.accountType;
            newAccount.institutionId = account.selectedInstitution?.id;
            newAccount.institution = account.selectedInstitution?.name;
            newAccount.balance = account.customBalance ?? account.defaultBalance ?? 0;
            newAccount.currency = account.currency;
            newAccount.interestRate = account.interestRate;
            newAccount.taxTreatment = account.taxTreatment;
            newAccount.tags = [...account.tags, ...template.tags];
            newAccount.color = account.color;
            newAccount.linkedAccountIds = [];
            newAccount.isActive = true;
            newAccount.metadata = {
              description: account.description,
              priority: account.priority,
              createdFromTemplate: template.id,
              createdVia: 'bulk_template',
            };
          });

          createdAccountIds.push(createdAccount.id);
          
          // Small delay for better UX
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      });

      await formHaptic.success();
      onComplete(createdAccountIds);
    } catch (error) {
      console.error('Error creating accounts:', error);
      await formHaptic.error();
      
      Alert.alert(
        'Creation Failed',
        'Failed to create some accounts. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setCreating(false);
      setProgress(0);
      setCurrentStep(0);
    }
  };

  const getAccountIcon = (accountType: string): string => {
    const iconMap: Record<string, string> = {
      checking: 'card-outline',
      savings: 'wallet-outline',
      investment: 'trending-up-outline',
      retirement: 'time-outline',
      credit: 'card',
      loan: 'home-outline',
      other: 'ellipsis-horizontal-outline',
    };
    return iconMap[accountType] || 'wallet-outline';
  };

  const renderAccountItem = ({ item }: { item: AccountCreationItem }) => (
    <Card
      variant="outlined"
      padding="base"
      style={[
        styles.accountCard,
        {
          opacity: item.enabled ? 1 : 0.6,
          borderColor: item.validationErrors.length > 0 
            ? theme.colors.error[500] 
            : theme.colors.border.primary,
        },
      ]}
    >
      <Flex direction="column" gap="base">
        {/* Header */}
        <Flex direction="row" align="center" justify="space-between">
          <Flex direction="row" align="center" gap="sm">
            <View
              style={[
                styles.accountIcon,
                { 
                  backgroundColor: item.color 
                    ? `${item.color}20` 
                    : theme.colors.primary[100] 
                },
              ]}
            >
              <Icon
                name={getAccountIcon(item.accountType) as any}
                size="sm"
                color={item.color || 'primary.500'}
              />
            </View>
            <Flex direction="column">
              <Text style={[styles.accountName, { color: theme.colors.text.primary }]}>
                {item.name}
              </Text>
              <Text style={[styles.accountType, { color: theme.colors.text.secondary }]}>
                {item.accountType} • Priority {item.priority}
              </Text>
            </Flex>
          </Flex>
          
          <Switch
            value={item.enabled}
            onValueChange={(enabled) => updateAccount(item.id, { enabled })}
            disabled={item.isRequired}
            testID={`account-toggle-${item.id}`}
          />
        </Flex>

        {/* Description */}
        <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
          {item.description}
        </Text>

        {item.enabled && (
          <>
            {/* Custom Name */}
            <Input
              label="Account Name"
              value={item.customName || item.name}
              onChangeText={(value) => updateAccount(item.id, { customName: value })}
              error={item.validationErrors.some(error => error.includes('name'))}
              testID={`account-name-${item.id}`}
            />

            {/* Institution Picker */}
            <InstitutionPicker
              selectedInstitution={item.selectedInstitution}
              onInstitutionSelect={(institution) => 
                updateAccount(item.id, { selectedInstitution: institution })
              }
              accountType={item.accountType}
              placeholder="Select institution (optional)"
              testID={`institution-${item.id}`}
            />

            {/* Custom Balance */}
            <Input
              label="Starting Balance"
              value={item.customBalance?.toString() || item.defaultBalance?.toString() || '0'}
              onChangeText={(value) => 
                updateAccount(item.id, { customBalance: parseFloat(value) || 0 })
              }
              keyboardType="decimal-pad"
              leftIcon={<Text style={styles.currencySymbol}>$</Text>}
              error={item.validationErrors.some(error => error.includes('balance'))}
              testID={`balance-${item.id}`}
            />
          </>
        )}

        {/* Validation Errors */}
        {item.validationErrors.length > 0 && (
          <View style={styles.errorsContainer}>
            {item.validationErrors.map((error, index) => (
              <Text key={index} style={[styles.errorText, { color: theme.colors.error[500] }]}>
                • {error}
              </Text>
            ))}
          </View>
        )}
      </Flex>
    </Card>
  );

  const enabledCount = accounts.filter(account => account.enabled).length;

  return (
    <View style={styles.container} testID={testID}>
      {/* Header */}
      <Card variant="filled" padding="base" style={styles.header}>
        <Flex direction="row" align="center" gap="base">
          <View style={[styles.templateIcon, { backgroundColor: template.color }]}>
            <Icon name={template.icon as any} size="md" color="white" />
          </View>
          <Flex direction="column" flex={1}>
            <Text style={[styles.templateName, { color: theme.colors.text.primary }]}>
              {template.name}
            </Text>
            <Text style={[styles.templateDescription, { color: theme.colors.text.secondary }]}>
              {enabledCount} of {template.accounts.length} accounts selected
            </Text>
          </Flex>
        </Flex>
      </Card>

      {/* Progress Bar (when creating) */}
      {creating && (
        <Card variant="outlined" padding="base">
          <Flex direction="column" gap="sm">
            <Text style={[styles.progressText, { color: theme.colors.text.primary }]}>
              Creating accounts... ({currentStep} of {enabledCount})
            </Text>
            <ProgressBar progress={progress} color="primary" />
          </Flex>
        </Card>
      )}

      {/* Accounts List */}
      <FlatList
        data={accounts}
        renderItem={renderAccountItem}
        keyExtractor={(item) => item.id}
        style={styles.accountsList}
        contentContainerStyle={styles.accountsContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Actions */}
      <Flex direction="row" gap="base" style={styles.actions}>
        <Button
          variant="outline"
          onPress={onCancel}
          disabled={creating}
          style={{ flex: 1 }}
          testID="cancel-button"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onPress={createAccounts}
          loading={creating}
          disabled={enabledCount === 0}
          style={{ flex: 1 }}
          testID="create-accounts-button"
        >
          Create {enabledCount} Account{enabledCount !== 1 ? 's' : ''}
        </Button>
      </Flex>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
  },
  header: {
    // Card handles styling
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
  },
  templateDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  accountsList: {
    flex: 1,
  },
  accountsContent: {
    paddingBottom: 20,
  },
  accountCard: {
    // Card handles styling
  },
  accountIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountName: {
    fontSize: 16,
    fontWeight: '500',
  },
  accountType: {
    fontSize: 12,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  errorsContainer: {
    gap: 4,
  },
  errorText: {
    fontSize: 12,
  },
  separator: {
    height: 12,
  },
  actions: {
    paddingTop: 8,
  },
});

export default BulkAccountCreator;
