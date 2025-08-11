/**
 * NetWorthScreen
 * Comprehensive net worth tracking with trends, breakdowns, and milestones
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
import NetWorthDashboard from '../../components/financial/NetWorthDashboard';
import NetWorthTrendsChart from '../../components/financial/NetWorthTrendsChart';
import NetWorthBreakdown from '../../components/financial/NetWorthBreakdown';
import NetWorthMilestones from '../../components/financial/NetWorthMilestones';
import { netWorthService, NetWorthData, NetWorthComparison } from '../../services/financial/NetWorthService';
import { useFormHaptic } from '../../hooks/useHaptic';

type Props = AccountsStackScreenProps<'NetWorth'>;

type ViewMode = 'dashboard' | 'trends' | 'breakdown' | 'milestones';

const NetWorthScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const haptic = useFormHaptic();

  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [netWorthData, setNetWorthData] = useState<NetWorthData | null>(null);
  const [comparisons, setComparisons] = useState<NetWorthComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadNetWorthData();
    }
  }, [user?.id]);

  const loadNetWorthData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      const [netWorth, netWorthComparisons] = await Promise.all([
        netWorthService.calculateNetWorth(user.id),
        netWorthService.getNetWorthComparisons(user.id),
      ]);

      setNetWorthData(netWorth);
      setComparisons(netWorthComparisons);
    } catch (error) {
      console.error('Error loading net worth data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNetWorthData();
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
      { key: 'trends', label: 'Trends', icon: 'trending-up-outline' },
      { key: 'breakdown', label: 'Breakdown', icon: 'pie-chart-outline' },
      { key: 'milestones', label: 'Goals', icon: 'flag-outline' },
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
    if (!netWorthData) return null;

    const monthlyComparison = comparisons.find(comp => comp.period === 'month');

    return (
      <Card variant="filled" padding="lg" style={styles.quickStatsCard}>
        <Flex direction="row" justify="space-around">
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.onPrimary }]}>
              Net Worth
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.onPrimary }]}>
              {formatCurrency(netWorthData.totalNetWorth)}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.onPrimary }]}>
              Assets
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.onPrimary }]}>
              {formatCurrency(netWorthData.totalAssets)}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.onPrimary }]}>
              Monthly Change
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.onPrimary }]}>
              {monthlyComparison ? 
                `${monthlyComparison.change >= 0 ? '+' : ''}${formatCurrency(monthlyComparison.change)}` :
                'N/A'
              }
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
          <NetWorthDashboard
            onViewDetails={() => setViewMode('breakdown')}
            onViewTrends={() => setViewMode('trends')}
          />
        );

      case 'trends':
        return (
          <NetWorthTrendsChart
            onDataPointPress={(trend) => {
              console.log('Data point pressed:', trend);
            }}
          />
        );

      case 'breakdown':
        return (
          <NetWorthBreakdown
            onAccountPress={handleAccountPress}
            showAccounts={true}
          />
        );

      case 'milestones':
        return (
          <NetWorthMilestones
            onMilestonePress={(milestone) => {
              console.log('Milestone pressed:', milestone);
            }}
            showCelebration={true}
          />
        );

      default:
        return null;
    }
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
            onPress={() => {
              // Navigate to goal setting or financial planning
              console.log('Navigate to financial planning');
            }}
            leftIcon={<Icon name="calculator-outline" size="sm" />}
            style={styles.actionButton}
          >
            Financial Plan
          </Button>
        </Flex>
      </Card>
    );
  };

  if (loading) {
    return (
      <ScreenTemplate
        title="Net Worth"
        showBackButton
        scrollable={false}
        padding="none"
      >
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Calculating your net worth...
          </Text>
        </View>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate
      title="Net Worth"
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
    minWidth: 80,
  },
  viewModeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionsCard: {
    marginTop: 16,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
  },
});

export default NetWorthScreen;
