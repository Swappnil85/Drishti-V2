/**
 * NetWorthBreakdown Component
 * Detailed breakdown of net worth by account type with visual representations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Button, Icon, Flex, Badge } from '../ui';
import { netWorthService, NetWorthData, AccountTypeBreakdown } from '../../services/financial/NetWorthService';
import { useFormHaptic } from '../../hooks/useHaptic';

interface NetWorthBreakdownProps {
  onAccountPress?: (accountId: string) => void;
  showAccounts?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

const NetWorthBreakdown: React.FC<NetWorthBreakdownProps> = ({
  onAccountPress,
  showAccounts = true,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const haptic = useFormHaptic();

  const [netWorthData, setNetWorthData] = useState<NetWorthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'balance' | 'percentage' | 'count'>('balance');

  useEffect(() => {
    if (user?.id) {
      loadNetWorthData();
    }
  }, [user?.id]);

  const loadNetWorthData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await netWorthService.calculateNetWorth(user.id);
      setNetWorthData(data);
    } catch (error) {
      console.error('Error loading net worth breakdown:', error);
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

  const formatAccountTypeName = (accountType: string) => {
    return accountType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getAccountTypeColor = (accountType: string, index: number) => {
    const colors = [
      theme.colors.primary,
      theme.colors.success,
      theme.colors.warning,
      theme.colors.info,
      theme.colors.error,
      '#9C27B0', // Purple
      '#FF5722', // Deep Orange
      '#607D8B', // Blue Grey
    ];
    return colors[index % colors.length];
  };

  const getAccountTypeIcon = (accountType: string) => {
    const iconMap: Record<string, string> = {
      checking: 'card-outline',
      savings: 'wallet-outline',
      investment: 'trending-up-outline',
      retirement: 'shield-outline',
      credit: 'card',
      loan: 'remove-circle-outline',
      mortgage: 'home-outline',
      other: 'ellipsis-horizontal-outline',
    };
    return iconMap[accountType.toLowerCase()] || 'ellipsis-horizontal-outline';
  };

  const toggleAccountType = (accountType: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(accountType)) {
      newExpanded.delete(accountType);
    } else {
      newExpanded.add(accountType);
    }
    setExpandedTypes(newExpanded);
    haptic.light();
  };

  const getSortedBreakdown = () => {
    if (!netWorthData) return [];

    return [...netWorthData.accountBreakdown].sort((a, b) => {
      switch (sortBy) {
        case 'balance':
          return Math.abs(b.totalBalance) - Math.abs(a.totalBalance);
        case 'percentage':
          return Math.abs(b.percentage) - Math.abs(a.percentage);
        case 'count':
          return b.accountCount - a.accountCount;
        default:
          return 0;
      }
    });
  };

  const renderSortSelector = () => {
    const sortOptions: Array<{ key: 'balance' | 'percentage' | 'count'; label: string; icon: string }> = [
      { key: 'balance', label: 'Balance', icon: 'cash-outline' },
      { key: 'percentage', label: 'Percentage', icon: 'pie-chart-outline' },
      { key: 'count', label: 'Count', icon: 'list-outline' },
    ];

    return (
      <Card variant="outlined" padding="sm" style={styles.sortSelector}>
        <Flex direction="row" justify="space-between" align="center">
          <Text style={[styles.sortLabel, { color: theme.colors.text }]}>
            Sort by:
          </Text>
          <Flex direction="row" gap="xs">
            {sortOptions.map(option => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.sortButton,
                  sortBy === option.key && {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
                onPress={() => {
                  haptic.light();
                  setSortBy(option.key);
                }}
              >
                <Icon
                  name={option.icon}
                  size="sm"
                  color={sortBy === option.key ? 'onPrimary' : 'textSecondary'}
                />
                <Text
                  style={[
                    styles.sortButtonText,
                    {
                      color: sortBy === option.key
                        ? theme.colors.onPrimary
                        : theme.colors.textSecondary,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </Flex>
        </Flex>
      </Card>
    );
  };

  const renderPieChart = () => {
    if (!netWorthData) return null;

    const sortedBreakdown = getSortedBreakdown();
    const totalAbsoluteValue = sortedBreakdown.reduce((sum, item) => sum + Math.abs(item.totalBalance), 0);

    return (
      <Card variant="outlined" padding="lg" style={styles.pieChartCard}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Asset Allocation
        </Text>
        
        <View style={styles.pieChartContainer}>
          {/* Simple pie chart representation */}
          <View style={styles.pieChartLegend}>
            {sortedBreakdown.slice(0, 6).map((item, index) => {
              const percentage = totalAbsoluteValue > 0 ? (Math.abs(item.totalBalance) / totalAbsoluteValue) * 100 : 0;
              
              return (
                <View key={item.accountType} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendColor,
                      { backgroundColor: getAccountTypeColor(item.accountType, index) },
                    ]}
                  />
                  <View style={styles.legendText}>
                    <Text style={[styles.legendLabel, { color: theme.colors.text }]}>
                      {formatAccountTypeName(item.accountType)}
                    </Text>
                    <Text style={[styles.legendValue, { color: theme.colors.textSecondary }]}>
                      {percentage.toFixed(1)}% • {formatCurrency(Math.abs(item.totalBalance))}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </Card>
    );
  };

  const renderAccountTypeBreakdown = () => {
    if (!netWorthData) return null;

    const sortedBreakdown = getSortedBreakdown();

    return (
      <Card variant="outlined" padding="lg" style={styles.breakdownCard}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Account Type Breakdown
        </Text>

        {sortedBreakdown.map((accountType, index) => (
          <View key={accountType.accountType} style={styles.accountTypeItem}>
            <TouchableOpacity
              style={styles.accountTypeHeader}
              onPress={() => toggleAccountType(accountType.accountType)}
            >
              <Flex direction="row" align="center" gap="sm">
                <View
                  style={[
                    styles.typeIndicator,
                    { backgroundColor: getAccountTypeColor(accountType.accountType, index) },
                  ]}
                >
                  <Icon
                    name={getAccountTypeIcon(accountType.accountType)}
                    size="sm"
                    color="white"
                  />
                </View>

                <View style={styles.typeInfo}>
                  <Text style={[styles.typeName, { color: theme.colors.text }]}>
                    {formatAccountTypeName(accountType.accountType)}
                  </Text>
                  <Text style={[styles.typeDetails, { color: theme.colors.textSecondary }]}>
                    {accountType.accountCount} account{accountType.accountCount !== 1 ? 's' : ''} • {Math.abs(accountType.percentage).toFixed(1)}%
                  </Text>
                </View>

                <View style={styles.typeValues}>
                  <Text style={[styles.typeBalance, { color: theme.colors.text }]}>
                    {formatCurrency(accountType.totalBalance)}
                  </Text>
                  <Icon
                    name={expandedTypes.has(accountType.accountType) ? 'chevron-up' : 'chevron-down'}
                    size="sm"
                    color="textSecondary"
                  />
                </View>
              </Flex>
            </TouchableOpacity>

            {/* Progress bar */}
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: getAccountTypeColor(accountType.accountType, index),
                      width: `${Math.min(Math.abs(accountType.percentage), 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Expanded account list */}
            {expandedTypes.has(accountType.accountType) && showAccounts && (
              <View style={styles.accountsList}>
                {accountType.accounts.map(account => (
                  <TouchableOpacity
                    key={account.id}
                    style={styles.accountItem}
                    onPress={() => {
                      haptic.light();
                      onAccountPress?.(account.id);
                    }}
                  >
                    <Flex direction="row" justify="space-between" align="center">
                      <View style={styles.accountInfo}>
                        <Text style={[styles.accountName, { color: theme.colors.text }]}>
                          {account.name}
                        </Text>
                        {account.institution && (
                          <Text style={[styles.accountInstitution, { color: theme.colors.textSecondary }]}>
                            {account.institution}
                          </Text>
                        )}
                      </View>
                      <Text style={[styles.accountBalance, { color: theme.colors.text }]}>
                        {formatCurrency(account.balance)}
                      </Text>
                    </Flex>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}
      </Card>
    );
  };

  const renderSummaryStats = () => {
    if (!netWorthData) return null;

    const assetTypes = netWorthData.accountBreakdown.filter(type => type.totalBalance >= 0);
    const liabilityTypes = netWorthData.accountBreakdown.filter(type => type.totalBalance < 0);

    return (
      <Card variant="outlined" padding="lg" style={styles.summaryCard}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Summary Statistics
        </Text>

        <Flex direction="row" justify="space-around" style={styles.summaryStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Total Assets
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.success }]}>
              {formatCurrency(netWorthData.totalAssets)}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Total Liabilities
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.error }]}>
              {formatCurrency(netWorthData.totalLiabilities)}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Account Types
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {netWorthData.accountBreakdown.length}
            </Text>
          </View>
        </Flex>

        <Flex direction="row" justify="space-around" style={styles.summaryStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Asset Types
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {assetTypes.length}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Liability Types
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {liabilityTypes.length}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Last Updated
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {netWorthData.lastUpdated.toLocaleDateString()}
            </Text>
          </View>
        </Flex>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card variant="outlined" padding="lg">
        <Flex direction="column" align="center" gap="base">
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading breakdown data...
          </Text>
        </Flex>
      </Card>
    );
  }

  if (!netWorthData) {
    return (
      <Card variant="outlined" padding="lg">
        <Flex direction="column" align="center" gap="base">
          <Icon name="alert-circle-outline" size="lg" color="error" />
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            Unable to load breakdown data
          </Text>
          <Button variant="outline" onPress={loadNetWorthData}>
            Retry
          </Button>
        </Flex>
      </Card>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderSortSelector()}
      {renderSummaryStats()}
      {renderPieChart()}
      {renderAccountTypeBreakdown()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sortSelector: {
    marginBottom: 16,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  summaryCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryStats: {
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  pieChartCard: {
    marginBottom: 16,
  },
  pieChartContainer: {
    alignItems: 'center',
  },
  pieChartLegend: {
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  legendText: {
    flex: 1,
  },
  legendLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  legendValue: {
    fontSize: 12,
  },
  breakdownCard: {
    marginBottom: 16,
  },
  accountTypeItem: {
    marginBottom: 16,
  },
  accountTypeHeader: {
    marginBottom: 8,
  },
  typeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeInfo: {
    flex: 1,
  },
  typeName: {
    fontSize: 16,
    fontWeight: '500',
  },
  typeDetails: {
    fontSize: 12,
  },
  typeValues: {
    alignItems: 'flex-end',
  },
  typeBalance: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  accountsList: {
    paddingLeft: 44,
  },
  accountItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 6,
    marginBottom: 4,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '500',
  },
  accountInstitution: {
    fontSize: 12,
  },
  accountBalance: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default NetWorthBreakdown;
