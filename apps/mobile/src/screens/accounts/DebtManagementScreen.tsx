/**
 * DebtManagementScreen
 * Comprehensive debt tracking and management interface
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
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
import DebtDashboard from '../../components/financial/DebtDashboard';
import DebtPayoffCalculator from '../../components/financial/DebtPayoffCalculator';
import DebtToIncomeRatio from '../../components/financial/DebtToIncomeRatio';
import { debtService, DebtSummary } from '../../services/financial/DebtService';
import { useFormHaptic } from '../../hooks/useHaptic';

type Props = AccountsStackScreenProps<'DebtManagement'>;

type ViewMode = 'dashboard' | 'payoff' | 'ratio' | 'insights';

const DebtManagementScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const haptic = useFormHaptic();

  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [debtSummary, setDebtSummary] = useState<DebtSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDebtData();
    setRefreshing(false);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    haptic.light();
    setViewMode(mode);
  };

  const handleAccountPress = (accountId: string) => {
    navigation.navigate('AccountDetails', { accountId });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderViewModeSelector = () => {
    const modes: Array<{ key: ViewMode; label: string; icon: string }> = [
      { key: 'dashboard', label: 'Overview', icon: 'speedometer-outline' },
      { key: 'payoff', label: 'Payoff Plan', icon: 'calculator-outline' },
      { key: 'ratio', label: 'DTI Ratio', icon: 'analytics-outline' },
      { key: 'insights', label: 'Insights', icon: 'bulb-outline' },
    ];

    return (
      <Card variant="outlined" padding="sm" style={styles.viewModeSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Flex direction="row" gap="xs">
            {modes.map(mode => (
              <TouchableOpacity
                key={mode.key}
                style={[
                  styles.viewModeButton,
                  viewMode === mode.key && {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
                onPress={() => handleViewModeChange(mode.key)}
              >
                <Icon
                  name={mode.icon}
                  size="sm"
                  color={viewMode === mode.key ? 'onPrimary' : 'textSecondary'}
                />
                <Text
                  style={[
                    styles.viewModeText,
                    {
                      color: viewMode === mode.key
                        ? theme.colors.onPrimary
                        : theme.colors.textSecondary,
                    },
                  ]}
                >
                  {mode.label}
                </Text>
              </TouchableOpacity>
            ))}
          </Flex>
        </ScrollView>
      </Card>
    );
  };

  const renderQuickStats = () => {
    if (!debtSummary) return null;

    return (
      <Card variant="filled" padding="lg" style={styles.quickStatsCard}>
        <Flex direction="row" justify="space-around">
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.onPrimary }]}>
              Total Debt
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.onPrimary }]}>
              {formatCurrency(debtSummary.totalDebt)}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.onPrimary }]}>
              Min Payments
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.onPrimary }]}>
              {formatCurrency(debtSummary.totalMinimumPayments)}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.onPrimary }]}>
              Avg Interest
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.onPrimary }]}>
              {debtSummary.averageInterestRate.toFixed(1)}%
            </Text>
          </View>
        </Flex>
      </Card>
    );
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'dashboard':
        return (
          <DebtDashboard
            onAccountPress={handleAccountPress}
            onPayoffCalculatorPress={() => setViewMode('payoff')}
            onDebtToIncomePress={() => setViewMode('ratio')}
          />
        );

      case 'payoff':
        return (
          <DebtPayoffCalculator
            onStrategySelect={(strategy) => {
              console.log('Strategy selected:', strategy);
            }}
          />
        );

      case 'ratio':
        return (
          <DebtToIncomeRatio
            onImprovementTipsPress={() => {
              console.log('Navigate to improvement tips');
            }}
          />
        );

      case 'insights':
        return renderInsights();

      default:
        return null;
    }
  };

  const renderInsights = () => {
    if (!debtSummary) return null;

    const insights = [
      {
        icon: 'trending-up',
        color: 'error',
        title: 'Highest Interest Rate',
        value: `${debtSummary.highestInterestRate.toFixed(1)}%`,
        description: 'Focus on paying this debt first to save on interest',
      },
      {
        icon: 'wallet',
        color: 'warning',
        title: 'Largest Balance',
        value: formatCurrency(debtSummary.highestBalance),
        description: 'Consider debt consolidation for large balances',
      },
      {
        icon: 'time',
        color: 'info',
        title: 'Monthly Interest Cost',
        value: formatCurrency(debtSummary.monthlyInterestCost),
        description: 'Amount going to interest instead of principal',
      },
    ];

    return (
      <ScrollView style={styles.insightsContainer} showsVerticalScrollIndicator={false}>
        {insights.map((insight, index) => (
          <Card key={index} variant="outlined" padding="lg" style={styles.insightCard}>
            <Flex direction="row" align="center" gap="sm">
              <View style={[styles.insightIcon, { backgroundColor: `rgba(${insight.color === 'error' ? '244, 67, 54' : insight.color === 'warning' ? '255, 152, 0' : '33, 150, 243'}, 0.1)` }]}>
                <Icon name={insight.icon} size="md" color={insight.color} />
              </View>
              
              <View style={styles.insightContent}>
                <Text style={[styles.insightTitle, { color: theme.colors.text }]}>
                  {insight.title}
                </Text>
                <Text style={[styles.insightValue, { color: theme.colors.text }]}>
                  {insight.value}
                </Text>
                <Text style={[styles.insightDescription, { color: theme.colors.textSecondary }]}>
                  {insight.description}
                </Text>
              </View>
            </Flex>
          </Card>
        ))}

        <Card variant="outlined" padding="lg" style={styles.tipsCard}>
          <Text style={[styles.tipsTitle, { color: theme.colors.text }]}>
            Debt Management Tips
          </Text>
          
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Icon name="checkmark-circle" size="sm" color="success" />
              <Text style={[styles.tipText, { color: theme.colors.text }]}>
                Pay more than the minimum when possible
              </Text>
            </View>
            
            <View style={styles.tipItem}>
              <Icon name="checkmark-circle" size="sm" color="success" />
              <Text style={[styles.tipText, { color: theme.colors.text }]}>
                Focus extra payments on highest interest debt
              </Text>
            </View>
            
            <View style={styles.tipItem}>
              <Icon name="checkmark-circle" size="sm" color="success" />
              <Text style={[styles.tipText, { color: theme.colors.text }]}>
                Avoid taking on new debt while paying off existing debt
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    );
  };

  const renderActionButtons = () => {
    return (
      <Card variant="outlined" padding="lg" style={styles.actionsCard}>
        <Flex direction="row" gap="sm">
          <Button
            variant="outline"
            onPress={() => navigation.navigate('AccountsList')}
            leftIcon={<Icon name="list-outline" size="sm" />}
            style={styles.actionButton}
          >
            Manage Accounts
          </Button>
          
          <Button
            variant="outline"
            onPress={() => navigation.navigate('AddAccount')}
            leftIcon={<Icon name="add-outline" size="sm" />}
            style={styles.actionButton}
          >
            Add Debt Account
          </Button>
        </Flex>
      </Card>
    );
  };

  if (loading) {
    return (
      <ScreenTemplate
        title="Debt Management"
        showBackButton
        scrollable={false}
        padding="none"
      >
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading debt information...
          </Text>
        </View>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate
      title="Debt Management"
      showBackButton
      scrollable={false}
      padding="none"
      rightAction={
        <TouchableOpacity onPress={handleRefresh}>
          <Icon name="refresh-outline" size="md" color="text" />
        </TouchableOpacity>
      }
    >
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {renderQuickStats()}
        {renderViewModeSelector()}
        {renderContent()}
        {renderActionButtons()}
      </ScrollView>
    </ScreenTemplate>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  quickStatsCard: {
    marginBottom: 16,
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
  viewModeSelector: {
    marginBottom: 16,
  },
  viewModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
    minWidth: 90,
  },
  viewModeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  insightsContainer: {
    flex: 1,
  },
  insightCard: {
    marginBottom: 12,
  },
  insightIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  tipsCard: {
    marginTop: 8,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  tipsList: {
    // Tips list styles
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    flex: 1,
  },
  actionsCard: {
    marginTop: 16,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
  },
});

export default DebtManagementScreen;
