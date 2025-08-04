/**
 * QuickBalanceUpdate Component
 * Quick balance update interface with large, mobile-optimized input fields
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useFormHaptic } from '../../hooks/useHaptic';
import { balanceUpdateService } from '../../services/financial/BalanceUpdateService';
import type FinancialAccount from '../../database/models/FinancialAccount';

const { width } = Dimensions.get('window');

interface QuickBalanceUpdateProps {
  account: FinancialAccount;
  onBalanceUpdated: (account: FinancialAccount) => void;
  onCancel?: () => void;
  visible: boolean;
}

const QuickBalanceUpdate: React.FC<QuickBalanceUpdateProps> = ({
  account,
  onBalanceUpdated,
  onCancel,
  visible,
}) => {
  const { theme } = useTheme();
  const haptic = useFormHaptic();
  
  const [newBalance, setNewBalance] = useState(account.balance.toString());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      setNewBalance(account.balance.toString());
      setNotes('');
      setWarnings([]);
    }
  }, [visible, account.balance]);

  const validateBalance = (value: string) => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      setWarnings(['Please enter a valid number']);
      return;
    }

    const validation = balanceUpdateService.validateBalanceUpdate(account, numericValue);
    setWarnings(validation.warnings);
  };

  const handleBalanceChange = (value: string) => {
    // Allow negative sign and decimal point
    const cleanValue = value.replace(/[^-0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      return;
    }
    
    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) {
      return;
    }

    setNewBalance(cleanValue);
    
    // Validate in real-time
    if (cleanValue && cleanValue !== '-' && cleanValue !== '.') {
      validateBalance(cleanValue);
    } else {
      setWarnings([]);
    }
  };

  const handleUpdateBalance = async () => {
    const numericBalance = parseFloat(newBalance);
    
    if (isNaN(numericBalance)) {
      haptic.error();
      Alert.alert('Invalid Balance', 'Please enter a valid number');
      return;
    }

    // Check for significant changes and confirm
    const changeAmount = numericBalance - account.balance;
    const changePercentage = account.balance !== 0 ? Math.abs(changeAmount / account.balance) * 100 : 0;
    
    if (changePercentage > 20 || Math.abs(changeAmount) > 10000) {
      const changeDescription = changeAmount > 0 ? 'increase' : 'decrease';
      const formattedChange = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: account.currency,
        signDisplay: 'always',
      }).format(changeAmount);

      Alert.alert(
        'Confirm Large Change',
        `This will ${changeDescription} the balance by ${formattedChange} (${changePercentage.toFixed(1)}%). Are you sure?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm', onPress: () => performUpdate() },
        ]
      );
    } else {
      performUpdate();
    }
  };

  const performUpdate = async () => {
    setLoading(true);
    haptic.light();

    try {
      const result = await balanceUpdateService.updateAccountBalance({
        accountId: account.id,
        newBalance: parseFloat(newBalance),
        notes: notes.trim() || undefined,
        updateMethod: 'manual',
        metadata: {
          previousBalance: account.balance,
          updateSource: 'quick_update',
        },
      });

      if (result.success && result.account) {
        haptic.success();
        onBalanceUpdated(result.account);
        
        // Show success message with change amount
        const changeAmount = result.account.balance - account.balance;
        const formattedChange = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: account.currency,
          signDisplay: 'always',
        }).format(changeAmount);
        
        Alert.alert(
          'Balance Updated',
          `${account.name} balance updated by ${formattedChange}`,
          [{ text: 'OK' }]
        );
      } else {
        haptic.error();
        Alert.alert('Update Failed', result.error || 'Failed to update balance');
      }
    } catch (error) {
      haptic.error();
      console.error('Error updating balance:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    haptic.light();
    setNewBalance(account.balance.toString());
    setNotes('');
    setWarnings([]);
    onCancel?.();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: account.currency,
    }).format(amount);
  };

  const changeAmount = parseFloat(newBalance) - account.balance;
  const isValidBalance = !isNaN(parseFloat(newBalance));

  if (!visible) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.modal, { backgroundColor: theme.colors.surface }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Update Balance
          </Text>
          <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Account Info */}
        <View style={styles.accountInfo}>
          <Text style={[styles.accountName, { color: theme.colors.text }]}>
            {account.name}
          </Text>
          <Text style={[styles.currentBalance, { color: theme.colors.textSecondary }]}>
            Current: {formatCurrency(account.balance)}
          </Text>
        </View>

        {/* Balance Input */}
        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
            New Balance
          </Text>
          <TextInput
            style={[
              styles.balanceInput,
              {
                backgroundColor: theme.colors.inputBackground,
                borderColor: warnings.length > 0 ? theme.colors.warning : theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            value={newBalance}
            onChangeText={handleBalanceChange}
            placeholder="0.00"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="numeric"
            selectTextOnFocus
            autoFocus
            testID="balance-input"
          />
          
          {/* Change Indicator */}
          {isValidBalance && changeAmount !== 0 && (
            <View style={styles.changeIndicator}>
              <Ionicons
                name={changeAmount > 0 ? 'trending-up' : 'trending-down'}
                size={16}
                color={changeAmount > 0 ? theme.colors.success : theme.colors.error}
              />
              <Text
                style={[
                  styles.changeText,
                  { color: changeAmount > 0 ? theme.colors.success : theme.colors.error },
                ]}
              >
                {changeAmount > 0 ? '+' : ''}{formatCurrency(changeAmount)}
              </Text>
            </View>
          )}
        </View>

        {/* Warnings */}
        {warnings.length > 0 && (
          <View style={styles.warningsSection}>
            {warnings.map((warning, index) => (
              <View key={index} style={styles.warningItem}>
                <Ionicons name="warning" size={16} color={theme.colors.warning} />
                <Text style={[styles.warningText, { color: theme.colors.warning }]}>
                  {warning}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Notes Input */}
        <View style={styles.notesSection}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
            Notes (Optional)
          </Text>
          <TextInput
            style={[
              styles.notesInput,
              {
                backgroundColor: theme.colors.inputBackground,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add a note about this update..."
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            numberOfLines={2}
            testID="notes-input"
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonSection}>
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
                opacity: loading || !isValidBalance ? 0.6 : 1,
              },
            ]}
            onPress={handleUpdateBalance}
            disabled={loading || !isValidBalance}
            testID="update-button"
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.onPrimary} size="small" />
            ) : (
              <Text style={[styles.updateButtonText, { color: theme.colors.onPrimary }]}>
                Update Balance
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  accountInfo: {
    marginBottom: 24,
    alignItems: 'center',
  },
  accountName: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 4,
  },
  currentBalance: {
    fontSize: 16,
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  balanceInput: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderRadius: 12,
    minHeight: 60,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  changeText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
  warningsSection: {
    marginBottom: 16,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  notesSection: {
    marginBottom: 24,
  },
  notesInput: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  buttonSection: {
    flexDirection: 'row',
    gap: 12,
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

export default QuickBalanceUpdate;
