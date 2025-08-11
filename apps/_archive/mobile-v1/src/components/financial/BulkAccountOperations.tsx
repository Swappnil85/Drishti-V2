/**
 * BulkAccountOperations Component
 * Handles bulk operations on multiple accounts (delete, archive, tag management)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, Button, Icon, Flex, Badge, Checkbox } from '../ui';
import { database } from '../../database';
import FinancialAccount from '../../database/models/FinancialAccount';
import { useFormHaptic } from '../../hooks/useHaptic';

interface BulkAccountOperationsProps {
  accounts: FinancialAccount[];
  onOperationComplete?: () => void;
  onCancel?: () => void;
}

type BulkOperation = 'delete' | 'archive' | 'activate' | 'tag' | 'untag';

interface OperationSummary {
  operation: BulkOperation;
  accountCount: number;
  description: string;
}

const BulkAccountOperations: React.FC<BulkAccountOperationsProps> = ({
  accounts,
  onOperationComplete,
  onCancel,
}) => {
  const { theme } = useTheme();
  const haptic = useFormHaptic();

  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
  const [selectedOperation, setSelectedOperation] = useState<BulkOperation | null>(null);
  const [processing, setProcessing] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const operations: Array<{
    id: BulkOperation;
    title: string;
    description: string;
    icon: string;
    color: string;
    destructive?: boolean;
  }> = [
    {
      id: 'delete',
      title: 'Delete Accounts',
      description: 'Move selected accounts to trash (recoverable for 30 days)',
      icon: 'trash-outline',
      color: 'error',
      destructive: true,
    },
    {
      id: 'archive',
      title: 'Archive Accounts',
      description: 'Hide accounts from main list while preserving data',
      icon: 'archive-outline',
      color: 'warning',
    },
    {
      id: 'activate',
      title: 'Activate Accounts',
      description: 'Restore archived or deleted accounts to active status',
      icon: 'refresh-outline',
      color: 'success',
    },
    {
      id: 'tag',
      title: 'Add Tags',
      description: 'Add tags to selected accounts for organization',
      icon: 'pricetag-outline',
      color: 'info',
    },
    {
      id: 'untag',
      title: 'Remove Tags',
      description: 'Remove specific tags from selected accounts',
      icon: 'pricetags-outline',
      color: 'info',
    },
  ];

  const toggleAccountSelection = (accountId: string) => {
    const newSelection = new Set(selectedAccounts);
    if (newSelection.has(accountId)) {
      newSelection.delete(accountId);
    } else {
      newSelection.add(accountId);
    }
    setSelectedAccounts(newSelection);
  };

  const selectAllAccounts = () => {
    if (selectedAccounts.size === accounts.length) {
      setSelectedAccounts(new Set());
    } else {
      setSelectedAccounts(new Set(accounts.map(account => account.id)));
    }
  };

  const getSelectedAccountsArray = (): FinancialAccount[] => {
    return accounts.filter(account => selectedAccounts.has(account.id));
  };

  const handleOperationSelect = (operation: BulkOperation) => {
    if (selectedAccounts.size === 0) {
      Alert.alert('No Accounts Selected', 'Please select at least one account to perform this operation.');
      return;
    }

    setSelectedOperation(operation);
  };

  const executeOperation = async () => {
    if (!selectedOperation || selectedAccounts.size === 0) return;

    const selectedAccountsArray = getSelectedAccountsArray();
    const operationInfo = operations.find(op => op.id === selectedOperation);

    if (!operationInfo) return;

    // Show confirmation dialog
    Alert.alert(
      `${operationInfo.title}`,
      `Are you sure you want to ${operationInfo.description.toLowerCase()} for ${selectedAccountsArray.length} account(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: operationInfo.destructive ? 'destructive' : 'default',
          onPress: () => performOperation(selectedOperation, selectedAccountsArray),
        },
      ]
    );
  };

  const performOperation = async (operation: BulkOperation, accountsToUpdate: FinancialAccount[]) => {
    try {
      setProcessing(true);
      await haptic.light();

      await database.write(async () => {
        for (const account of accountsToUpdate) {
          await account.update((acc: FinancialAccount) => {
            switch (operation) {
              case 'delete':
                acc.isActive = false;
                break;

              case 'archive':
                const metadata = acc.metadata;
                metadata.archived = true;
                metadata.archivedAt = new Date().toISOString();
                acc.metadataRaw = JSON.stringify(metadata);
                break;

              case 'activate':
                acc.isActive = true;
                const activateMetadata = acc.metadata;
                delete activateMetadata.archived;
                delete activateMetadata.archivedAt;
                acc.metadataRaw = JSON.stringify(activateMetadata);
                break;

              case 'tag':
                if (tagInput.trim()) {
                  const currentTags = acc.tags;
                  const newTags = tagInput.split(',').map(tag => tag.trim()).filter(tag => tag);
                  const updatedTags = [...new Set([...currentTags, ...newTags])];
                  acc.tagsRaw = JSON.stringify(updatedTags);
                }
                break;

              case 'untag':
                if (tagInput.trim()) {
                  const currentTags = acc.tags;
                  const tagsToRemove = tagInput.split(',').map(tag => tag.trim()).filter(tag => tag);
                  const updatedTags = currentTags.filter(tag => !tagsToRemove.includes(tag));
                  acc.tagsRaw = JSON.stringify(updatedTags);
                }
                break;
            }

            acc.updatedAt = new Date();
          });
        }
      });

      await haptic.success();

      const operationInfo = operations.find(op => op.id === operation);
      Alert.alert(
        'Operation Complete',
        `Successfully ${operationInfo?.description.toLowerCase()} for ${accountsToUpdate.length} account(s).`,
        [
          {
            text: 'OK',
            onPress: () => {
              setSelectedAccounts(new Set());
              setSelectedOperation(null);
              setTagInput('');
              onOperationComplete?.();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error performing bulk operation:', error);
      await haptic.error();
      Alert.alert(
        'Error',
        'Failed to perform the operation. Please try again.'
      );
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getOperationSummary = (): OperationSummary | null => {
    if (!selectedOperation || selectedAccounts.size === 0) return null;

    const operationInfo = operations.find(op => op.id === selectedOperation);
    if (!operationInfo) return null;

    return {
      operation: selectedOperation,
      accountCount: selectedAccounts.size,
      description: operationInfo.description,
    };
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Card variant="outlined" padding="lg" style={styles.headerCard}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Bulk Account Operations
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Select accounts and choose an operation to perform on multiple accounts at once.
        </Text>
      </Card>

      {/* Account Selection */}
      <Card variant="outlined" padding="lg" style={styles.section}>
        <Flex direction="row" justify="space-between" align="center" style={styles.selectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Select Accounts ({selectedAccounts.size}/{accounts.length})
          </Text>
          <Button
            variant="ghost"
            size="sm"
            onPress={selectAllAccounts}
          >
            {selectedAccounts.size === accounts.length ? 'Deselect All' : 'Select All'}
          </Button>
        </Flex>

        {accounts.map((account) => (
          <TouchableOpacity
            key={account.id}
            style={[
              styles.accountItem,
              selectedAccounts.has(account.id) && {
                backgroundColor: theme.colors.primary + '10',
                borderColor: theme.colors.primary,
              },
            ]}
            onPress={() => toggleAccountSelection(account.id)}
          >
            <Flex direction="row" align="center" gap="sm">
              <Checkbox
                checked={selectedAccounts.has(account.id)}
                onPress={() => toggleAccountSelection(account.id)}
              />
              
              <View style={styles.accountInfo}>
                <Text style={[styles.accountName, { color: theme.colors.text }]}>
                  {account.name}
                </Text>
                <Text style={[styles.accountDetails, { color: theme.colors.textSecondary }]}>
                  {account.accountType} • {formatCurrency(account.balance)}
                </Text>
                {account.institution && (
                  <Text style={[styles.accountInstitution, { color: theme.colors.textSecondary }]}>
                    {account.institution}
                  </Text>
                )}
              </View>

              {account.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {account.tags.slice(0, 2).map((tag, index) => (
                    <Badge key={index} variant="outline" size="xs">
                      {tag}
                    </Badge>
                  ))}
                  {account.tags.length > 2 && (
                    <Badge variant="outline" size="xs">
                      +{account.tags.length - 2}
                    </Badge>
                  )}
                </View>
              )}
            </Flex>
          </TouchableOpacity>
        ))}
      </Card>

      {/* Operations */}
      <Card variant="outlined" padding="lg" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Choose Operation
        </Text>

        {operations.map((operation) => (
          <TouchableOpacity
            key={operation.id}
            style={[
              styles.operationItem,
              selectedOperation === operation.id && {
                backgroundColor: theme.colors[operation.color as keyof typeof theme.colors] + '10',
                borderColor: theme.colors[operation.color as keyof typeof theme.colors],
              },
            ]}
            onPress={() => handleOperationSelect(operation.id)}
            disabled={selectedAccounts.size === 0}
          >
            <Flex direction="row" align="center" gap="sm">
              <Icon
                name={operation.icon}
                size="md"
                color={selectedAccounts.size === 0 ? 'textSecondary' : operation.color}
              />
              
              <View style={styles.operationInfo}>
                <Text
                  style={[
                    styles.operationTitle,
                    {
                      color: selectedAccounts.size === 0
                        ? theme.colors.textSecondary
                        : theme.colors.text,
                    },
                  ]}
                >
                  {operation.title}
                </Text>
                <Text style={[styles.operationDescription, { color: theme.colors.textSecondary }]}>
                  {operation.description}
                </Text>
              </View>
            </Flex>
          </TouchableOpacity>
        ))}

        {/* Tag Input for tag operations */}
        {(selectedOperation === 'tag' || selectedOperation === 'untag') && (
          <View style={styles.tagInputContainer}>
            <Text style={[styles.tagInputLabel, { color: theme.colors.text }]}>
              {selectedOperation === 'tag' ? 'Tags to Add:' : 'Tags to Remove:'}
            </Text>
            <Text style={[styles.tagInputHint, { color: theme.colors.textSecondary }]}>
              Enter tags separated by commas
            </Text>
            {/* Note: In a real implementation, you'd use the Input component here */}
            <View style={[styles.tagInputPlaceholder, { borderColor: theme.colors.border }]}>
              <Text style={[styles.tagInputPlaceholderText, { color: theme.colors.textSecondary }]}>
                e.g., savings, emergency, retirement
              </Text>
            </View>
          </View>
        )}
      </Card>

      {/* Operation Summary */}
      {getOperationSummary() && (
        <Card variant="outlined" padding="lg" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Operation Summary
          </Text>
          
          <View style={styles.summaryContainer}>
            <Text style={[styles.summaryText, { color: theme.colors.textSecondary }]}>
              {getOperationSummary()?.description} for {getOperationSummary()?.accountCount} account(s).
            </Text>
          </View>

          <Flex direction="row" gap="sm" style={styles.actionButtons}>
            <Button
              variant="outline"
              onPress={() => {
                setSelectedOperation(null);
                setTagInput('');
              }}
              style={styles.actionButton}
            >
              Cancel
            </Button>

            <Button
              variant="filled"
              onPress={executeOperation}
              disabled={processing}
              loading={processing}
              style={styles.actionButton}
            >
              Execute Operation
            </Button>
          </Flex>
        </Card>
      )}

      {/* Footer */}
      <Card variant="outlined" padding="lg" style={styles.section}>
        <Button variant="outline" onPress={onCancel}>
          Close
        </Button>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  selectionHeader: {
    marginBottom: 16,
  },
  accountItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 8,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  accountDetails: {
    fontSize: 14,
    marginBottom: 2,
  },
  accountInstitution: {
    fontSize: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  operationItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 8,
  },
  operationInfo: {
    flex: 1,
  },
  operationTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  operationDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  tagInputContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 8,
  },
  tagInputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  tagInputHint: {
    fontSize: 12,
    marginBottom: 8,
  },
  tagInputPlaceholder: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 6,
    backgroundColor: 'white',
  },
  tagInputPlaceholderText: {
    fontSize: 14,
  },
  summaryContainer: {
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },
});

export default BulkAccountOperations;
