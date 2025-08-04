/**
 * Account Type Picker Component
 * Visual picker for account types with descriptions
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, Icon, Flex } from '../ui';
import type { AccountType } from '@drishti/shared/types/financial';
import { useFormHaptic } from '../../hooks/useHaptic';

interface AccountTypeOption {
  value: AccountType;
  label: string;
  description: string;
  icon: string;
  color: string;
}

interface AccountTypePickerProps {
  selectedType?: AccountType;
  onTypeSelect: (type: AccountType) => void;
  error?: boolean;
  errorMessage?: string;
  testID?: string;
}

const ACCOUNT_TYPE_OPTIONS: AccountTypeOption[] = [
  {
    value: 'checking',
    label: 'Checking Account',
    description: 'For daily transactions and bill payments',
    icon: 'card-outline',
    color: '#2196F3',
  },
  {
    value: 'savings',
    label: 'Savings Account',
    description: 'For saving money and earning interest',
    icon: 'wallet-outline',
    color: '#4CAF50',
  },
  {
    value: 'investment',
    label: 'Investment Account',
    description: 'Brokerage, stocks, bonds, and mutual funds',
    icon: 'trending-up-outline',
    color: '#FF9800',
  },
  {
    value: 'retirement',
    label: 'Retirement Account',
    description: '401(k), IRA, and other retirement savings',
    icon: 'time-outline',
    color: '#9C27B0',
  },
  {
    value: 'credit',
    label: 'Credit Card',
    description: 'Credit cards and lines of credit',
    icon: 'card',
    color: '#F44336',
  },
  {
    value: 'loan',
    label: 'Loan Account',
    description: 'Mortgages, auto loans, and personal loans',
    icon: 'home-outline',
    color: '#795548',
  },
  {
    value: 'other',
    label: 'Other Account',
    description: 'Any other type of financial account',
    icon: 'ellipsis-horizontal-outline',
    color: '#607D8B',
  },
];

const AccountTypePicker: React.FC<AccountTypePickerProps> = ({
  selectedType,
  onTypeSelect,
  error = false,
  errorMessage,
  testID,
}) => {
  const theme = useTheme();
  const formHaptic = useFormHaptic();

  const handleTypeSelect = async (type: AccountType) => {
    await formHaptic.selection();
    onTypeSelect(type);
  };

  const renderAccountTypeOption = (option: AccountTypeOption) => {
    const isSelected = selectedType === option.value;
    
    return (
      <TouchableOpacity
        key={option.value}
        onPress={() => handleTypeSelect(option.value)}
        testID={`account-type-${option.value}`}
      >
        <Card
          variant={isSelected ? 'filled' : 'outlined'}
          padding="base"
          style={[
            styles.typeCard,
            {
              borderColor: isSelected ? option.color : theme.colors.border.primary,
              backgroundColor: isSelected 
                ? `${option.color}15` 
                : theme.colors.background.primary,
            },
          ]}
        >
          <Flex direction="row" align="center" gap="base">
            {/* Icon */}
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: isSelected ? option.color : `${option.color}20`,
                },
              ]}
            >
              <Icon
                name={option.icon as any}
                size="md"
                color={isSelected ? '#FFFFFF' : option.color}
              />
            </View>

            {/* Content */}
            <Flex direction="column" flex={1} gap="xs">
              <Text
                style={[
                  styles.typeLabel,
                  {
                    color: isSelected 
                      ? option.color 
                      : theme.colors.text.primary,
                    fontWeight: isSelected ? '600' : '500',
                  },
                ]}
              >
                {option.label}
              </Text>
              <Text
                style={[
                  styles.typeDescription,
                  {
                    color: isSelected 
                      ? theme.colors.text.secondary 
                      : theme.colors.text.tertiary,
                  },
                ]}
              >
                {option.description}
              </Text>
            </Flex>

            {/* Selection Indicator */}
            {isSelected && (
              <Icon
                name="checkmark-circle"
                size="sm"
                color={option.color}
              />
            )}
          </Flex>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container} testID={testID}>
      <Text style={[styles.label, { color: theme.colors.text.primary }]}>
        Account Type *
      </Text>
      
      <View style={styles.optionsContainer}>
        {ACCOUNT_TYPE_OPTIONS.map(renderAccountTypeOption)}
      </View>

      {error && errorMessage && (
        <Text style={[styles.errorText, { color: theme.colors.error[500] }]}>
          {errorMessage}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionsContainer: {
    gap: 12,
  },
  typeCard: {
    borderWidth: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  typeDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
  },
});

export default AccountTypePicker;
