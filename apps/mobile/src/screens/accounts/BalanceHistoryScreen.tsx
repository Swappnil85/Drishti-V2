/**
 * BalanceHistoryScreen Component
 * Screen for viewing account balance history and trends
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AccountsStackScreenProps } from '../../types/navigation';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  ScreenTemplate,
  Card,
  Button,
  Icon,
  Flex,
  Badge,
} from '../../components/ui';
import BalanceHistoryList from '../../components/financial/BalanceHistoryList';
import { balanceUpdateService } from '../../services/financial/BalanceUpdateService';
import { database } from '../../database';
import type FinancialAccount from '../../database/models/FinancialAccount';

type Props = AccountsStackScreenProps<'AccountHistory'>;

const BalanceHistoryScreen: React.FC<Props> = ({ navigation, route }) => {
  const { accountId } = route.params;
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [account, setAccount] = useState<FinancialAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [netWorthData, setNetWorthData] = useState({
    currentNetWorth: 0,
    previousNetWorth: 0,
    change: 0,
    changePercentage: 0,
  });

  useEffect(() => {
    loadAccountData();
    loadNetWorthData();
  }, [accountId]);

  const loadAccountData = async () => {
    try {
      const accountRecord = await database.get('financial_accounts').find(accountId);
      setAccount(accountRecord as FinancialAccount);
    } catch (error) {
      console.error('Error loading account:', error);
      Alert.alert('Error', 'Failed to load account data');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const loadNetWorthData = async () => {
    if (!user?.id) return;

    try {
      const data = await balanceUpdateService.calculateNetWorthChange(user.id, 30);
      setNetWorthData(data);
    } catch (error) {
      console.error('Error loading net worth data:', error);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(2)}%`;
  };

  const renderAccountSummary = () => {
    if (!account) return null;

    return (
      <Card variant="outlined" padding="base" style={styles.summaryCard}>
        <Flex direction="column" gap="base">
          <Flex direction="row" align="center" justify="space-between">
            <View>
              <Text style={[styles.accountName, { color: theme.colors.text }]}>
                {account.name}
              </Text>
              <Text style={[styles.accountType, { color: theme.colors.textSecondary }]}>
                {account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)} Account
              </Text>
            </View>
            <View style={styles.balanceContainer}>
              <Text style={[styles.currentBalance, { color: theme.colors.text }]}>
                {formatCurrency(account.balance, account.currency)}
              </Text>
              <Badge
                variant="filled"
                color={account.balance >= 0 ? 'success' : 'error'}
                size="sm"
              >
                Current Balance
              </Badge>
            </View>
          </Flex>

          {account.institution && (
            <Flex direction="row" align="center" gap="sm">
              <Icon name="business-outline" size="sm" color="textSecondary" />
              <Text style={[styles.institution, { color: theme.colors.textSecondary }]}>
                {account.institution}
              </Text>
            </Flex>
          )}

          {account.tags.length > 0 && (
            <Flex direction="row" wrap gap="xs">
              {account.tags.map((tag, index) => (
                <Badge key={index} variant="outline" color="primary" size="xs">
                  {tag}
                </Badge>
              ))}
            </Flex>
          )}
        </Flex>
      </Card>
    );
  };

  const renderNetWorthSummary = () => {
    const isPositiveChange = netWorthData.change >= 0;

    return (
      <Card variant="outlined" padding="base" style={styles.netWorthCard}>
        <Flex direction="column" gap="sm">
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Net Worth Impact (30 days)
          </Text>
          
          <Flex direction="row" align="center" justify="space-between">
            <View>
              <Text style={[styles.netWorthAmount, { color: theme.colors.text }]}>
                {formatCurrency(netWorthData.currentNetWorth)}
              </Text>
              <Text style={[styles.netWorthLabel, { color: theme.colors.textSecondary }]}>
                Current Net Worth
              </Text>
            </View>
            
            <View style={styles.changeContainer}>
              <Flex direction="row" align="center" gap="xs">
                <Ionicons
                  name={isPositiveChange ? 'trending-up' : 'trending-down'}
                  size={16}
                  color={isPositiveChange ? theme.colors.success : theme.colors.error}
                />
                <Text
                  style={[
                    styles.changeAmount,
                    { color: isPositiveChange ? theme.colors.success : theme.colors.error },
                  ]}
                >
                  {formatCurrency(Math.abs(netWorthData.change))}
                </Text>
              </Flex>
              <Text
                style={[
                  styles.changePercentage,
                  { color: isPositiveChange ? theme.colors.success : theme.colors.error },
                ]}
              >
                {formatPercentage(netWorthData.changePercentage)}
              </Text>
            </View>
          </Flex>
        </Flex>
      </Card>
    );
  };

  const renderActionButtons = () => (
    <Card variant="outlined" padding="base" style={styles.actionsCard}>
      <Flex direction="row" gap="sm">
        <Button
          variant="outline"
          size="sm"
          onPress={() => navigation.navigate('EditAccount', { accountId })}
          style={styles.actionButton}
        >
          <Icon name="create-outline" size="sm" color="primary" />
          <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>
            Edit Account
          </Text>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onPress={() => navigation.navigate('AccountDetails', { accountId })}
          style={styles.actionButton}
        >
          <Icon name="analytics-outline" size="sm" color="primary" />
          <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>
            View Details
          </Text>
        </Button>
      </Flex>
    </Card>
  );

  if (loading) {
    return (
      <ScreenTemplate
        title="Balance History"
        showBackButton
        scrollable={false}
        padding="none"
      >
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading balance history...
          </Text>
        </View>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate
      title="Balance History"
      showBackButton
      scrollable={false}
      padding="none"
    >
      <View style={styles.container}>
        <ScrollView
          style={styles.headerContent}
          showsVerticalScrollIndicator={false}
        >
          {renderAccountSummary()}
          {renderNetWorthSummary()}
          {renderActionButtons()}
        </ScrollView>

        <View style={styles.historyContainer}>
          <Text style={[styles.historyTitle, { color: theme.colors.text }]}>
            Balance Changes
          </Text>
          <BalanceHistoryList
            accountId={accountId}
            limit={100}
            showAccountNames={false}
          />
        </View>
      </View>
    </ScreenTemplate>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContent: {
    maxHeight: 400,
    padding: 16,
  },
  summaryCard: {
    marginBottom: 12,
  },
  accountName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  accountType: {
    fontSize: 14,
    fontWeight: '500',
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  currentBalance: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  institution: {
    fontSize: 14,
  },
  netWorthCard: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  netWorthAmount: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  netWorthLabel: {
    fontSize: 12,
  },
  changeContainer: {
    alignItems: 'flex-end',
  },
  changeAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  changePercentage: {
    fontSize: 12,
    marginTop: 2,
  },
  actionsCard: {
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  historyContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
});

export default BalanceHistoryScreen;
