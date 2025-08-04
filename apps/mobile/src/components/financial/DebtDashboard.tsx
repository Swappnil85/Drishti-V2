/**
 * DebtDashboard Component
 * Comprehensive debt tracking and management dashboard
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Button, Icon, Flex, Badge } from '../ui';
import { debtService, DebtSummary, DebtAccount } from '../../services/financial/DebtService';
import { useFormHaptic } from '../../hooks/useHaptic';

interface DebtDashboardProps {
  onAccountPress?: (accountId: string) => void;
  onPayoffCalculatorPress?: () => void;
  onDebtToIncomePress?: () => void;
  compact?: boolean;
}

const DebtDashboard: React.FC<DebtDashboardProps> = ({
  onAccountPress,
  onPayoffCalculatorPress,
  onDebtToIncomePress,
  compact = false,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const haptic = useFormHaptic();

  const [debtSummary, setDebtSummary] = useState<DebtSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadDebtData();
    }
  }, [user?.id]);

  const loadDebtData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const summary = await debtService.calculateDebtSummary(user.id);
      setDebtSummary(summary);
    } catch (error) {
      console.error('Error loading debt data:', error);
    } finally {
      setLoading(false);
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

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getDebtSeverityColor = (totalDebt: number) => {
    if (totalDebt === 0) return theme.colors.success;
    if (totalDebt < 10000) return theme.colors.warning;
    if (totalDebt < 50000) return theme.colors.error;
    return '#8B0000'; // Dark red for high debt
  };

  const getInterestRateColor = (rate: number) => {
    if (rate < 5) return theme.colors.success;
    if (rate < 15) return theme.colors.warning;
    return theme.colors.error;
  };

  const handleAccountPress = (account: DebtAccount) => {
    haptic.light();
    onAccountPress?.(account.id);
  };

  const handlePayoffCalculator = () => {
    haptic.light();
    onPayoffCalculatorPress?.();
  };

  const handleDebtToIncome = () => {
    haptic.light();
    onDebtToIncomePress?.();
  };

  const renderDebtSummaryHeader = () => {
    if (!debtSummary) return null;

    return (
      <Card variant="filled" padding="lg" style={styles.summaryCard}>
        <Flex direction="column" align="center" gap="sm">
          <Text style={[styles.summaryTitle, { color: theme.colors.onPrimary }]}>
            Total Debt
          </Text>
          <Text style={[styles.summaryAmount, { color: getDebtSeverityColor(debtSummary.totalDebt) }]}>
            {formatCurrency(debtSummary.totalDebt)}
          </Text>
          
          {debtSummary.totalDebt > 0 && (
            <Flex direction="row" justify="space-around" style={styles.summaryStats}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.onPrimary }]}>
                  {formatCurrency(debtSummary.totalMinimumPayments)}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.onPrimary }]}>
                  Min Payments
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.onPrimary }]}>
                  {formatPercentage(debtSummary.averageInterestRate)}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.onPrimary }]}>
                  Avg Interest
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.onPrimary }]}>
                  {formatCurrency(debtSummary.monthlyInterestCost)}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.onPrimary }]}>
                  Monthly Interest
                </Text>
              </View>
            </Flex>
          )}

          {debtSummary.nextPaymentDue && (
            <Flex direction="row" align="center" gap="xs">
              <Icon name="calendar-outline" size="sm" color="onPrimary" />
              <Text style={[styles.nextPaymentText, { color: theme.colors.onPrimary }]}>
                Next payment due: {formatDate(debtSummary.nextPaymentDue)}
              </Text>
            </Flex>
          )}
        </Flex>
      </Card>
    );
  };

  const renderDebtAccounts = () => {
    if (!debtSummary || debtSummary.debtAccounts.length === 0 || compact) return null;

    const accountsToShow = compact ? debtSummary.debtAccounts.slice(0, 3) : debtSummary.debtAccounts;

    return (
      <Card variant="outlined" padding="lg" style={styles.accountsCard}>
        <Flex direction="row" justify="space-between" align="center" style={styles.accountsHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Debt Accounts
          </Text>
          <Badge variant="filled" color="error" size="sm">
            {debtSummary.debtAccounts.length}
          </Badge>
        </Flex>

        {accountsToShow.map((account, index) => (
          <TouchableOpacity
            key={account.id}
            style={styles.accountItem}
            onPress={() => handleAccountPress(account)}
          >
            <Flex direction="row" align="center" gap="sm">
              <View style={styles.accountIcon}>
                <Icon
                  name={account.accountType === 'credit' ? 'card' : 'remove-circle'}
                  size="md"
                  color="error"
                />
              </View>

              <View style={styles.accountInfo}>
                <Text style={[styles.accountName, { color: theme.colors.text }]}>
                  {account.name}
                </Text>
                <Text style={[styles.accountDetails, { color: theme.colors.textSecondary }]}>
                  {formatPercentage(account.interestRate)} APR • Min: {formatCurrency(account.minimumPayment)}
                </Text>
                {account.paymentDueDate && (
                  <Text style={[styles.paymentDue, { color: theme.colors.warning }]}>
                    Due: {formatDate(account.paymentDueDate)}
                  </Text>
                )}
              </View>

              <View style={styles.accountBalance}>
                <Text style={[styles.balanceAmount, { color: theme.colors.error }]}>
                  {formatCurrency(Math.abs(account.balance))}
                </Text>
                <Icon name="chevron-forward" size="sm" color="textSecondary" />
              </View>
            </Flex>
          </TouchableOpacity>
        ))}

        {compact && debtSummary.debtAccounts.length > 3 && (
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>
              View all {debtSummary.debtAccounts.length} accounts
            </Text>
          </TouchableOpacity>
        )}
      </Card>
    );
  };

  const renderDebtInsights = () => {
    if (!debtSummary || debtSummary.totalDebt === 0 || compact) return null;

    return (
      <Card variant="outlined" padding="lg" style={styles.insightsCard}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Debt Insights
        </Text>

        <View style={styles.insightItem}>
          <Flex direction="row" align="center" gap="sm">
            <Icon name="trending-up" size="sm" color="error" />
            <Text style={[styles.insightText, { color: theme.colors.text }]}>
              Highest interest rate: {formatPercentage(debtSummary.highestInterestRate)}
            </Text>
          </Flex>
        </View>

        <View style={styles.insightItem}>
          <Flex direction="row" align="center" gap="sm">
            <Icon name="wallet" size="sm" color="warning" />
            <Text style={[styles.insightText, { color: theme.colors.text }]}>
              Largest balance: {formatCurrency(debtSummary.highestBalance)}
            </Text>
          </Flex>
        </View>

        <View style={styles.insightItem}>
          <Flex direction="row" align="center" gap="sm">
            <Icon name="time" size="sm" color="info" />
            <Text style={[styles.insightText, { color: theme.colors.text }]}>
              Monthly interest cost: {formatCurrency(debtSummary.monthlyInterestCost)}
            </Text>
          </Flex>
        </View>
      </Card>
    );
  };

  const renderActionButtons = () => {
    if (!debtSummary || debtSummary.totalDebt === 0 || compact) return null;

    return (
      <Card variant="outlined" padding="lg" style={styles.actionsCard}>
        <Flex direction="row" gap="sm">
          <Button
            variant="outline"
            onPress={handlePayoffCalculator}
            leftIcon={<Icon name="calculator" size="sm" />}
            style={styles.actionButton}
          >
            Payoff Calculator
          </Button>
          
          <Button
            variant="outline"
            onPress={handleDebtToIncome}
            leftIcon={<Icon name="analytics" size="sm" />}
            style={styles.actionButton}
          >
            Debt Ratio
          </Button>
        </Flex>
      </Card>
    );
  };

  const renderEmptyState = () => {
    return (
      <Card variant="outlined" padding="lg" style={styles.emptyCard}>
        <Flex direction="column" align="center" gap="base">
          <Icon name="checkmark-circle" size="xl" color="success" />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            Debt Free!
          </Text>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            You don't have any debt accounts. Keep up the great work!
          </Text>
        </Flex>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card variant="outlined" padding="lg">
        <Flex direction="column" align="center" gap="base">
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading debt information...
          </Text>
        </Flex>
      </Card>
    );
  }

  if (!debtSummary || debtSummary.totalDebt === 0) {
    return renderEmptyState();
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderDebtSummaryHeader()}
      {renderDebtAccounts()}
      {renderDebtInsights()}
      {renderActionButtons()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  summaryStats: {
    width: '100%',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  nextPaymentText: {
    fontSize: 12,
    fontWeight: '500',
  },
  accountsCard: {
    marginBottom: 16,
  },
  accountsHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  accountItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 12,
    marginBottom: 2,
  },
  paymentDue: {
    fontSize: 11,
    fontWeight: '500',
  },
  accountBalance: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  viewAllButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  insightsCard: {
    marginBottom: 16,
  },
  insightItem: {
    paddingVertical: 8,
  },
  insightText: {
    fontSize: 14,
  },
  actionsCard: {
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
  },
  emptyCard: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default DebtDashboard;
