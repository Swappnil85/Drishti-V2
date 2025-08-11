/**
 * Accounts List Screen (Template Example)
 * Demonstrates the use of screen templates and components
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { AccountsStackScreenProps } from '../../types/navigation';
import {
  ScreenTemplate,
  ListTemplate,
  EmptyState,
  Text,
  Card,
  Flex,
  Icon,
  Button,
  Avatar,
  Badge,
} from '../../components/ui';

type Props = AccountsStackScreenProps<'AccountsList'>;

// Mock account data
interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'investment' | 'credit';
  balance: number;
  currency: string;
  lastUpdated: string;
}

const mockAccounts: Account[] = [
  {
    id: '1',
    name: 'Main Checking',
    type: 'checking',
    balance: 5420.50,
    currency: 'USD',
    lastUpdated: '2024-01-15',
  },
  {
    id: '2',
    name: 'Emergency Savings',
    type: 'savings',
    balance: 15000.00,
    currency: 'USD',
    lastUpdated: '2024-01-14',
  },
  {
    id: '3',
    name: 'Investment Portfolio',
    type: 'investment',
    balance: 45230.75,
    currency: 'USD',
    lastUpdated: '2024-01-15',
  },
  {
    id: '4',
    name: 'Credit Card',
    type: 'credit',
    balance: -1250.30,
    currency: 'USD',
    lastUpdated: '2024-01-13',
  },
];

const AccountsListScreen: React.FC<Props> = ({ navigation }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulate data loading
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setError(null);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAccounts(mockAccounts);
    } catch (err) {
      setError('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAccounts();
    setRefreshing(false);
  };

  const handleRetry = () => {
    setLoading(true);
    loadAccounts();
  };

  const handleAddAccount = () => {
    navigation.navigate('AddAccount');
  };

  const handleAccountPress = (account: Account) => {
    navigation.navigate('AccountDetails', { accountId: account.id });
  };

  // Get account type icon
  const getAccountIcon = (type: Account['type']) => {
    switch (type) {
      case 'checking':
        return 'card-outline';
      case 'savings':
        return 'wallet-outline';
      case 'investment':
        return 'trending-up-outline';
      case 'credit':
        return 'card';
      default:
        return 'wallet-outline';
    }
  };

  // Get account type color
  const getAccountColor = (type: Account['type']) => {
    switch (type) {
      case 'checking':
        return 'primary';
      case 'savings':
        return 'success';
      case 'investment':
        return 'warning';
      case 'credit':
        return 'error';
      default:
        return 'neutral';
    }
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(Math.abs(amount));
  };

  // Render account item
  const renderAccount = (account: Account, index: number) => (
    <Card
      variant="elevated"
      padding="lg"
      onPress={() => handleAccountPress(account)}
      style={styles.accountCard}
      testID={`account-${account.id}`}
    >
      <Flex direction="row" align="center" gap="base">
        {/* Account Icon */}
        <Avatar
          size="md"
          variant="rounded"
          fallbackIcon={getAccountIcon(account.type)}
        />

        {/* Account Info */}
        <Flex direction="column" style={styles.accountInfo}>
          <Flex direction="row" justify="space-between" align="center">
            <Text variant="h6" weight="semiBold" numberOfLines={1}>
              {account.name}
            </Text>
            <Badge
              variant="filled"
              color={getAccountColor(account.type)}
              size="sm"
            >
              {account.type.toUpperCase()}
            </Badge>
          </Flex>
          
          <Flex direction="row" justify="space-between" align="center">
            <Text
              variant="h5"
              weight="bold"
              color={account.balance >= 0 ? 'success.500' : 'error.500'}
            >
              {account.balance < 0 ? '-' : ''}
              {formatCurrency(account.balance, account.currency)}
            </Text>
            <Text variant="caption" color="text.tertiary">
              Updated {account.lastUpdated}
            </Text>
          </Flex>
        </Flex>

        {/* Chevron */}
        <Icon
          name="chevron-forward"
          size="sm"
          color="text.tertiary"
        />
      </Flex>
    </Card>
  );

  // Custom empty state
  const renderEmptyState = () => (
    <EmptyState
      title="No accounts found"
      message="Add your first account to start tracking your finances."
      icon={
        <Icon
          name="wallet-outline"
          size="3xl"
          color="text.tertiary"
        />
      }
      actionText="Add Account"
      onAction={handleAddAccount}
      testID="accounts-empty"
    />
  );

  return (
    <ScreenTemplate
      title="Accounts"
      showBackButton={false}
      headerActions={
        <Button
          variant="ghost"
          size="sm"
          onPress={handleAddAccount}
          leftIcon={
            <Icon
              name="add"
              size="sm"
              color="primary.500"
            />
          }
          testID="add-account-header"
        >
          Add
        </Button>
      }
      loading={loading}
      error={error}
      onRetry={handleRetry}
      scrollable={false}
      padding="none"
      testID="accounts-list-screen"
    >
      <ListTemplate
        data={accounts}
        renderItem={renderAccount}
        keyExtractor={(account) => account.id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        emptyState={renderEmptyState()}
        testID="accounts-list"
      />
    </ScreenTemplate>
  );
};

const styles = StyleSheet.create({
  accountCard: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  accountInfo: {
    flex: 1,
  },
});

export default AccountsListScreen;
