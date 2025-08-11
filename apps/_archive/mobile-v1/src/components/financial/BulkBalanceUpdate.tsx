/**
 * BulkBalanceUpdate Component
 * Interface for updating multiple account balances simultaneously
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useFormHaptic } from '../../hooks/useHaptic';
import { balanceUpdateService } from '../../services/financial/BalanceUpdateService';
import type FinancialAccount from '../../database/models/FinancialAccount';

interface AccountBalanceUpdate {
  account: FinancialAccount;
  newBalance: string;
  hasChanges: boolean;
  isValid: boolean;
  warnings: string[];
}

interface BulkBalanceUpdateProps {
  accounts: FinancialAccount[];
  onBalancesUpdated: (accounts: FinancialAccount[]) => void;
  onCancel: () => void;
  visible: boolean;
}

const BulkBalanceUpdate: React.FC<BulkBalanceUpdateProps> = ({
  accounts,
  onBalancesUpdated,
  onCancel,
  visible,
}) => {
  const { theme } = useTheme();
  const haptic = useFormHaptic();
  
  const [accountUpdates, setAccountUpdates] = useState<AccountBalanceUpdate[]>([]);
  const [globalNotes, setGlobalNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && accounts.length > 0) {
      const initialUpdates = accounts.map(account => ({
        account,
        newBalance: account.balance.toString(),
        hasChanges: false,
        isValid: true,
        warnings: [],
      }));
      setAccountUpdates(initialUpdates);
      setGlobalNotes('');
    }
  }, [visible, accounts]);

  const validateBalance = (account: FinancialAccount, value: string): { isValid: boolean; warnings: string[] } => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      return { isValid: false, warnings: ['Invalid number'] };
    }

    const validation = balanceUpdateService.validateBalanceUpdate(account, numericValue);
    return {
      isValid: validation.isValid,
      warnings: validation.warnings,
    };
  };

  const handleBalanceChange = (index: number, value: string) => {
    // Clean the input
    const cleanValue = value.replace(/[^-0-9.]/g, '');
    const parts = cleanValue.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;

    const updatedAccounts = [...accountUpdates];
    const account = updatedAccounts[index];
    
    account.newBalance = cleanValue;
    account.hasChanges = parseFloat(cleanValue) !== account.account.balance;
    
    if (cleanValue && cleanValue !== '-' && cleanValue !== '.') {
      const validation = validateBalance(account.account, cleanValue);
      account.isValid = validation.isValid;
      account.warnings = validation.warnings;
    } else {
      account.isValid = false;
      account.warnings = [];
    }

    setAccountUpdates(updatedAccounts);
  };

  const handleUpdateAll = async () => {
    const changedAccounts = accountUpdates.filter(update => 
      update.hasChanges && update.isValid
    );

    if (changedAccounts.length === 0) {
      Alert.alert('No Changes', 'No valid balance changes to update.');
      return;
    }

    // Check for significant changes
    const significantChanges = changedAccounts.filter(update => {
      const changeAmount = parseFloat(update.newBalance) - update.account.balance;
      const changePercentage = update.account.balance !== 0 ? 
        Math.abs(changeAmount / update.account.balance) * 100 : 0;
      return changePercentage > 20 || Math.abs(changeAmount) > 10000;
    });

    if (significantChanges.length > 0) {
      Alert.alert(
        'Confirm Large Changes',
        `${significantChanges.length} account(s) have significant balance changes (>20% or >$10,000). Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => performBulkUpdate(changedAccounts) },
        ]
      );
    } else {
      performBulkUpdate(changedAccounts);
    }
  };

  const performBulkUpdate = async (changedAccounts: AccountBalanceUpdate[]) => {
    setLoading(true);
    haptic.light();

    try {
      const bulkUpdateData = {
        updates: changedAccounts.map(update => ({
          accountId: update.account.id,
          newBalance: parseFloat(update.newBalance),
          notes: globalNotes.trim() || undefined,
          updateMethod: 'bulk' as const,
          metadata: {
            previousBalance: update.account.balance,
            updateSource: 'bulk_update',
          },
        })),
        globalNotes: globalNotes.trim() || undefined,
      };

      const result = await balanceUpdateService.updateMultipleBalances(bulkUpdateData);

      if (result.success) {
        haptic.success();
        
        // Extract updated accounts from successful results
        const updatedAccounts = result.results
          .filter(r => r.success && r.account)
          .map(r => r.account!);

        onBalancesUpdated(updatedAccounts);
        
        Alert.alert(
          'Bulk Update Complete',
          `Successfully updated ${result.successfulUpdates} of ${result.totalUpdates} accounts.`,
          [{ text: 'OK' }]
        );
      } else {
        haptic.error();
        Alert.alert(
          'Bulk Update Failed',
          `${result.failedUpdates} updates failed:\n${result.errors.slice(0, 3).join('\n')}${
            result.errors.length > 3 ? '\n...' : ''
          }`
        );
      }
    } catch (error) {
      haptic.error();
      console.error('Error in bulk update:', error);
      Alert.alert('Error', 'An unexpected error occurred during bulk update');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    haptic.light();
    onCancel();
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const validChanges = accountUpdates.filter(update => update.hasChanges && update.isValid).length;
  const totalWarnings = accountUpdates.reduce((sum, update) => sum + update.warnings.length, 0);

  if (!visible) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Bulk Balance Update
        </Text>
        <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary */}
        <View style={[styles.summary, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.summaryText, { color: theme.colors.text }]}>
            {accounts.length} accounts • {validChanges} changes • {totalWarnings} warnings
          </Text>
        </View>

        {/* Global Notes */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Notes (Applied to all updates)
          </Text>
          <TextInput
            style={[
              styles.globalNotesInput,
              {
                backgroundColor: theme.colors.inputBackground,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            value={globalNotes}
            onChangeText={setGlobalNotes}
            placeholder="Add notes for all balance updates..."
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Account List */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Account Balances
          </Text>
          
          {accountUpdates.map((update, index) => {
            const changeAmount = parseFloat(update.newBalance) - update.account.balance;
            const hasChange = update.hasChanges;
            
            return (
              <View
                key={update.account.id}
                style={[
                  styles.accountItem,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: hasChange ? theme.colors.primaryLight : 'transparent',
                  },
                ]}
              >
                <View style={styles.accountHeader}>
                  <Text style={[styles.accountName, { color: theme.colors.text }]}>
                    {update.account.name}
                  </Text>
                  <Text style={[styles.currentBalance, { color: theme.colors.textSecondary }]}>
                    Current: {formatCurrency(update.account.balance, update.account.currency)}
                  </Text>
                </View>

                <View style={styles.balanceInputContainer}>
                  <TextInput
                    style={[
                      styles.balanceInput,
                      {
                        backgroundColor: theme.colors.inputBackground,
                        borderColor: update.warnings.length > 0 ? theme.colors.warning : theme.colors.border,
                        color: theme.colors.text,
                      },
                    ]}
                    value={update.newBalance}
                    onChangeText={(value) => handleBalanceChange(index, value)}
                    placeholder="0.00"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="numeric"
                    selectTextOnFocus
                  />
                  
                  {hasChange && update.isValid && (
                    <View style={styles.changeIndicator}>
                      <Ionicons
                        name={changeAmount > 0 ? 'trending-up' : 'trending-down'}
                        size={14}
                        color={changeAmount > 0 ? theme.colors.success : theme.colors.error}
                      />
                      <Text
                        style={[
                          styles.changeText,
                          { color: changeAmount > 0 ? theme.colors.success : theme.colors.error },
                        ]}
                      >
                        {changeAmount > 0 ? '+' : ''}{formatCurrency(changeAmount, update.account.currency)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Warnings */}
                {update.warnings.length > 0 && (
                  <View style={styles.warningsContainer}>
                    {update.warnings.map((warning, warningIndex) => (
                      <View key={warningIndex} style={styles.warningItem}>
                        <Ionicons name="warning" size={12} color={theme.colors.warning} />
                        <Text style={[styles.warningText, { color: theme.colors.warning }]}>
                          {warning}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.footer, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: theme.colors.border }]}
          onPress={handleCancel}
          disabled={loading}
        >
          <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>
            Cancel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.updateButton,
            {
              backgroundColor: theme.colors.primary,
              opacity: loading || validChanges === 0 ? 0.6 : 1,
            },
          ]}
          onPress={handleUpdateAll}
          disabled={loading || validChanges === 0}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.onPrimary} size="small" />
          ) : (
            <Text style={[styles.updateButtonText, { color: theme.colors.onPrimary }]}>
              Update {validChanges} Account{validChanges !== 1 ? 's' : ''}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summary: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  globalNotesInput: {
    fontSize: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  accountItem: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
  },
  accountHeader: {
    marginBottom: 12,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  currentBalance: {
    fontSize: 14,
  },
  balanceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  balanceInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  warningsContainer: {
    marginTop: 8,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  updateButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BulkBalanceUpdate;
