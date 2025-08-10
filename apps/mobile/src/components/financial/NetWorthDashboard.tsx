/**
 * NetWorthDashboard Component
 * Comprehensive net worth visualization with trends and breakdowns
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
import Sparkline from '../charts/Sparkline';
import { useNetWorthTrends } from '../../hooks/useNetWorthTrends';
import {
  netWorthService,
  NetWorthComparison,
  NetWorthMilestone,
} from '../../services/financial/NetWorthService';
import { useFormHaptic } from '../../hooks/useHaptic';
import { useNetWorthSummary } from '../../hooks/useNetWorthSummary';

interface NetWorthDashboardProps {
  onViewDetails?: () => void;
  onViewTrends?: () => void;
  compact?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

const NetWorthDashboard: React.FC<NetWorthDashboardProps> = ({
  onViewDetails,
  onViewTrends,
  compact = false,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const haptic = useFormHaptic();

  const {
    data: netWorthData,
    loading,
    error,
    refresh,
  } = useNetWorthSummary(user?.id);

  // Phase B: 12-month mini trend for header sparkline
  const {
    data: trendPoints,
    loading: trendsLoading,
    error: trendsError,
    refresh: refreshTrends,
  } = useNetWorthTrends(user?.id, 12);
  const [comparisons, setComparisons] = useState<NetWorthComparison[]>([]);
  const [milestones, setMilestones] = useState<NetWorthMilestone[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<
    'month' | 'quarter' | 'year'
  >('month');

  useEffect(() => {
    if (user?.id) {
      loadSideData();
    }
  }, [user?.id]);

  const loadSideData = async () => {
    if (!user?.id) return;

    try {
      const [netWorthComparisons, netWorthMilestones] = await Promise.all([
        netWorthService.getNetWorthComparisons(user.id),
        netWorthService.getNetWorthMilestones(user.id),
      ]);

      setComparisons(netWorthComparisons);
      setMilestones(netWorthMilestones);
    } catch (error) {
      console.error('Error loading comparison/milestone data:', error);
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
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(1)}%`;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return theme.colors.success[500];
    if (change < 0) return theme.colors.error[500];
    return theme.colors.text.secondary;
  };

  const getSelectedComparison = () => {
    return comparisons.find(comp => comp.period === selectedPeriod);
  };

  const getNextMilestone = () => {
    return milestones.find(milestone => !milestone.achieved);
  };

  const renderNetWorthHeader = () => {
    const selectedComparison = getSelectedComparison();
    const amount = netWorthData?.totalNetWorth ?? 0;

    return (
      <Card variant='outlined' padding='lg' style={styles.headerCard}>
        <Flex direction='column' align='center' gap='sm'>
          {/* Title */}
          <Text
            style={[
              styles.netWorthLabel,
              { color: theme.colors.text.secondary },
            ]}
          >
            Total Net Worth
          </Text>

          {/* Big number */}
          <Text
            style={[
              styles.netWorthAmount,
              { color: theme.colors.text.primary },
            ]}
          >
            {formatCurrency(amount)}
          </Text>

          {/* Delta vs last period (month by default) */}
          {selectedComparison && (
            <Flex direction='row' align='center' gap='xs'>
              <Icon
                name={
                  selectedComparison.change >= 0
                    ? 'trending-up'
                    : 'trending-down'
                }
                size='sm'
                color={
                  selectedComparison.change >= 0 ? 'success.500' : 'error.500'
                }
              />
              <Text
                style={[
                  styles.changeText,
                  { color: getChangeColor(selectedComparison.change) },
                ]}
              >
                {formatCurrency(Math.abs(selectedComparison.change))} (
                {formatPercentage(selectedComparison.changePercentage)})
              </Text>
              <Text
                style={[
                  styles.periodText,
                  { color: theme.colors.text.secondary },
                ]}
              >
                {selectedComparison.periodLabel}
              </Text>
            </Flex>
          )}

          {/* Mini sparkline (12 months) */}
          <View style={{ alignSelf: 'stretch', marginTop: 8 }}>
            <Sparkline
              data={(trendPoints || []).map(p => p.value)}
              height={40}
              barWidth={6}
              gap={2}
              color={theme.colors.primary[500]}
              backgroundColor='transparent'
            />
          </View>

          {/* Assets / Liabilities chips */}
          {netWorthData && (
            <Flex direction='row' gap='md' style={{ marginTop: 8 }}>
              <Flex direction='row' align='center' gap='xs'>
                <Icon name='wallet-outline' size='sm' color='success.500' />
                <Text style={{ color: theme.colors.text.secondary }}>
                  Assets
                </Text>
                <Text
                  style={{
                    color: theme.colors.text.primary,
                    fontWeight: '600',
                  }}
                >
                  {formatCurrency(netWorthData.totalAssets)}
                </Text>
              </Flex>
              <Flex direction='row' align='center' gap='xs'>
                <Icon name='card-outline' size='sm' color='error.500' />
                <Text style={{ color: theme.colors.text.secondary }}>
                  Liabilities
                </Text>
                <Text
                  style={{
                    color: theme.colors.text.primary,
                    fontWeight: '600',
                  }}
                >
                  {formatCurrency(netWorthData.totalLiabilities)}
                </Text>
              </Flex>
            </Flex>
          )}

          {/* Inline slim error banner */}
          {(error || trendsError) && (
            <View
              style={{
                marginTop: 8,
                alignSelf: 'stretch',
                paddingVertical: 8,
                paddingHorizontal: 12,
                backgroundColor: theme.colors.warning[50],
                borderRadius: 8,
                borderWidth: 1,
                borderColor: theme.colors.warning[200],
              }}
            >
              <Flex direction='row' align='center' justify='space-between'>
                <Text style={{ color: theme.colors.text.primary, flex: 1 }}>
                  {error || trendsError}
                </Text>
                <Button
                  variant='outline'
                  size='sm'
                  onPress={() => {
                    refresh();
                    refreshTrends();
                  }}
                >
                  Retry
                </Button>
              </Flex>
            </View>
          )}
        </Flex>
      </Card>
    );
  };

  const renderPeriodSelector = () => {
    const periods: Array<{ key: 'month' | 'quarter' | 'year'; label: string }> =
      [
        { key: 'month', label: 'Month' },
        { key: 'quarter', label: 'Quarter' },
        { key: 'year', label: 'Year' },
      ];

    return (
      <Card variant='outlined' padding='sm' style={styles.periodSelector}>
        <Flex direction='row' gap='xs'>
          {periods.map(period => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && {
                  backgroundColor: theme.colors.primary,
                },
              ]}
              onPress={() => {
                haptic.light();
                setSelectedPeriod(period.key);
              }}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  {
                    color:
                      selectedPeriod === period.key
                        ? theme.colors.onPrimary
                        : theme.colors.textSecondary,
                  },
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Flex>
      </Card>
    );
  };

  const renderAccountBreakdown = () => {
    if (!netWorthData || compact) return null;

    const topAccountTypes = netWorthData.accountBreakdown.slice(0, 4);

    return (
      <Card variant='outlined' padding='lg' style={styles.breakdownCard}>
        <Flex
          direction='row'
          justify='space-between'
          align='center'
          style={styles.breakdownHeader}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Account Breakdown
          </Text>
          <TouchableOpacity onPress={onViewDetails}>
            <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>
              View All
            </Text>
          </TouchableOpacity>
        </Flex>

        {topAccountTypes.map((accountType, index) => (
          <View key={accountType.accountType} style={styles.breakdownItem}>
            <Flex direction='row' justify='space-between' align='center'>
              <Flex direction='row' align='center' gap='sm'>
                <View
                  style={[
                    styles.breakdownIndicator,
                    {
                      backgroundColor: getAccountTypeColor(
                        accountType.accountType,
                        index
                      ),
                    },
                  ]}
                />
                <View>
                  <Text
                    style={[
                      styles.accountTypeName,
                      { color: theme.colors.text },
                    ]}
                  >
                    {formatAccountTypeName(accountType.accountType)}
                  </Text>
                  <Text
                    style={[
                      styles.accountCount,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {accountType.accountCount} account
                    {accountType.accountCount !== 1 ? 's' : ''}
                  </Text>
                </View>
              </Flex>

              <Flex direction='column' align='flex-end'>
                <Text
                  style={[styles.breakdownAmount, { color: theme.colors.text }]}
                >
                  {formatCurrency(accountType.totalBalance)}
                </Text>
                <Text
                  style={[
                    styles.breakdownPercentage,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {accountType.percentage.toFixed(1)}%
                </Text>
              </Flex>
            </Flex>
          </View>
        ))}
      </Card>
    );
  };

  const renderMilestones = () => {
    if (!milestones.length || compact) return null;

    const nextMilestone = getNextMilestone();
    const achievedCount = milestones.filter(m => m.achieved).length;

    return (
      <Card variant='outlined' padding='lg' style={styles.milestonesCard}>
        <Flex
          direction='row'
          justify='space-between'
          align='center'
          style={styles.milestonesHeader}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Net Worth Milestones
          </Text>
          <Badge variant='filled' color='primary' size='sm'>
            {achievedCount}/{milestones.length}
          </Badge>
        </Flex>

        {nextMilestone && (
          <View style={styles.nextMilestone}>
            <Flex direction='row' justify='space-between' align='center'>
              <View>
                <Text
                  style={[styles.milestoneLabel, { color: theme.colors.text }]}
                >
                  Next: {nextMilestone.label}
                </Text>
                <Text
                  style={[
                    styles.milestoneAmount,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {formatCurrency(nextMilestone.amount)}
                </Text>
              </View>
              <View style={styles.progressContainer}>
                <Text
                  style={[
                    styles.progressText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {Math.round(nextMilestone.progress * 100)}%
                </Text>
                <View
                  style={[
                    styles.progressBar,
                    { backgroundColor: theme.colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: theme.colors.primary,
                        width: `${nextMilestone.progress * 100}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            </Flex>
          </View>
        )}
      </Card>
    );
  };

  const renderActionButtons = () => {
    if (compact) return null;

    return (
      <Card variant='outlined' padding='lg' style={styles.actionsCard}>
        <Flex direction='row' gap='sm'>
          <Button
            variant='outline'
            onPress={onViewTrends}
            leftIcon={<Icon name='trending-up' size='sm' />}
            style={styles.actionButton}
          >
            View Trends
          </Button>
          <Button
            variant='outline'
            onPress={onViewDetails}
            leftIcon={<Icon name='pie-chart' size='sm' />}
            style={styles.actionButton}
          >
            Detailed View
          </Button>
        </Flex>
      </Card>
    );
  };

  const getAccountTypeColor = (accountType: string, index: number) => {
    const palette = [
      theme.colors.primary[500],
      theme.colors.success[500],
      theme.colors.warning[500],
      theme.colors.secondary[500],
      theme.colors.error[500],
    ];
    return palette[index % palette.length];
  };

  const formatAccountTypeName = (accountType: string) => {
    return accountType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <Card variant='outlined' padding='lg'>
        <Flex direction='column' align='center' gap='base'>
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}
          >
            Loading net worth data...
          </Text>
        </Flex>
      </Card>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderNetWorthHeader()}
      {!compact && renderPeriodSelector()}
      {renderAccountBreakdown()}
      {renderMilestones()}
      {renderActionButtons()}
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
  netWorthLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  netWorthAmount: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  periodText: {
    fontSize: 12,
  },
  periodSelector: {
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  breakdownCard: {
    marginBottom: 16,
  },
  breakdownHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  breakdownItem: {
    marginBottom: 12,
  },
  breakdownIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  accountTypeName: {
    fontSize: 14,
    fontWeight: '500',
  },
  accountCount: {
    fontSize: 12,
  },
  breakdownAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  breakdownPercentage: {
    fontSize: 12,
  },
  milestonesCard: {
    marginBottom: 16,
  },
  milestonesHeader: {
    marginBottom: 16,
  },
  nextMilestone: {
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 8,
  },
  milestoneLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  milestoneAmount: {
    fontSize: 12,
  },
  progressContainer: {
    alignItems: 'flex-end',
  },
  progressText: {
    fontSize: 12,
    marginBottom: 4,
  },
  progressBar: {
    width: 80,
    height: 4,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  actionsCard: {
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
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

export default NetWorthDashboard;
