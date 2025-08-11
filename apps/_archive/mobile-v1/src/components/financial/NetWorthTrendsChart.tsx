/**
 * NetWorthTrendsChart Component
 * Interactive chart showing net worth trends over time
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Button, Icon, Flex, Badge } from '../ui';
import { useFormHaptic } from '../../hooks/useHaptic';
import { useNetWorthTrends } from '../../hooks/useNetWorthTrends';

export interface NetWorthTrendPoint {
  date: Date;
  netWorth: number;
  change: number;
  changePercentage: number;
}
export interface MonthlyNetWorthChange {
  month: string;
  year: number;
  startNetWorth: number;
  endNetWorth: number;
  change: number;
  changePercentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface NetWorthTrendsChartProps {
  onDataPointPress?: (trend: NetWorthTrendPoint) => void;
  height?: number;
}

const { width: screenWidth } = Dimensions.get('window');

const NetWorthTrendsChart: React.FC<NetWorthTrendsChartProps> = ({
  onDataPointPress,
  height = 200,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const haptic = useFormHaptic();

  const [trends, setTrends] = useState<NetWorthTrendPoint[]>([]);
  const [monthlyChanges, setMonthlyChanges] = useState<MonthlyNetWorthChange[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<
    '3M' | '6M' | '1Y' | '2Y'
  >('6M');
  const [viewMode, setViewMode] = useState<'chart' | 'monthly'>('chart');

  const {
    data: serverTrends,
    loading: trendsLoading,
    refresh: refreshTrends,
  } = useNetWorthTrends(user?.id, 12);

  useEffect(() => {
    if (!serverTrends?.length) return;

    const now = new Date();
    const points: NetWorthTrendPoint[] = serverTrends.map((pt, idx) => {
      const d = new Date(
        now.getFullYear(),
        now.getMonth() - (serverTrends.length - 1 - idx),
        1
      );
      return { date: d, netWorth: pt.value, change: 0, changePercentage: 0 };
    });

    for (let i = 0; i < points.length; i++) {
      const prev = i > 0 ? points[i - 1].netWorth : points[i].netWorth;
      const curr = points[i].netWorth;
      const ch = curr - prev;
      const chPct = prev !== 0 ? (ch / Math.abs(prev)) * 100 : 0;
      points[i].change = ch;
      points[i].changePercentage = chPct;
    }

    setTrends(points);

    const monthly: MonthlyNetWorthChange[] = [];
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const prev = i > 0 ? points[i - 1] : p;
      const trend: 'increasing' | 'decreasing' | 'stable' =
        p.change > 0 ? 'increasing' : p.change < 0 ? 'decreasing' : 'stable';
      monthly.push({
        month: p.date.toLocaleDateString('en-US', { month: 'long' }),
        year: p.date.getFullYear(),
        startNetWorth: prev.netWorth,
        endNetWorth: p.netWorth,
        change: p.change,
        changePercentage: p.changePercentage,
        trend,
      });
    }
    setMonthlyChanges(monthly);
    setLoading(false);
  }, [serverTrends]);

  useEffect(() => {
    setLoading(trendsLoading);
  }, [trendsLoading]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatShortCurrency = (amount: number) => {
    if (Math.abs(amount) >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(amount) >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return formatCurrency(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return theme.colors.success;
    if (change < 0) return theme.colors.error;
    return theme.colors.textSecondary;
  };

  const getTrendColor = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing':
        return theme.colors.success;
      case 'decreasing':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const renderPeriodSelector = () => {
    const periods: Array<{ key: '3M' | '6M' | '1Y' | '2Y'; label: string }> = [
      { key: '3M', label: '3M' },
      { key: '6M', label: '6M' },
      { key: '1Y', label: '1Y' },
      { key: '2Y', label: '2Y' },
    ];

    return (
      <Flex direction='row' gap='xs' style={styles.periodSelector}>
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
    );
  };

  const renderViewModeSelector = () => {
    return (
      <Flex direction='row' gap='xs' style={styles.viewModeSelector}>
        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === 'chart' && {
              backgroundColor: theme.colors.primary,
            },
          ]}
          onPress={() => {
            haptic.light();
            setViewMode('chart');
          }}
        >
          <Icon
            name='trending-up'
            size='sm'
            color={viewMode === 'chart' ? 'onPrimary' : 'textSecondary'}
          />
          <Text
            style={[
              styles.viewModeText,
              {
                color:
                  viewMode === 'chart'
                    ? theme.colors.onPrimary
                    : theme.colors.textSecondary,
              },
            ]}
          >
            Chart
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === 'monthly' && {
              backgroundColor: theme.colors.primary,
            },
          ]}
          onPress={() => {
            haptic.light();
            setViewMode('monthly');
          }}
        >
          <Icon
            name='calendar'
            size='sm'
            color={viewMode === 'monthly' ? 'onPrimary' : 'textSecondary'}
          />
          <Text
            style={[
              styles.viewModeText,
              {
                color:
                  viewMode === 'monthly'
                    ? theme.colors.onPrimary
                    : theme.colors.textSecondary,
              },
            ]}
          >
            Monthly
          </Text>
        </TouchableOpacity>
      </Flex>
    );
  };

  const renderSimpleChart = () => {
    if (!trends.length) return null;

    const maxValue = Math.max(...trends.map(t => t.netWorth));
    const minValue = Math.min(...trends.map(t => t.netWorth));
    const range = maxValue - minValue;
    const chartWidth = screenWidth - 64; // Account for padding
    const pointWidth = chartWidth / Math.max(trends.length - 1, 1);

    return (
      <View style={[styles.chartContainer, { height }]}>
        <View style={styles.chartArea}>
          {/* Y-axis labels */}
          <View style={styles.yAxisLabels}>
            <Text
              style={[styles.axisLabel, { color: theme.colors.textSecondary }]}
            >
              {formatShortCurrency(maxValue)}
            </Text>
            <Text
              style={[styles.axisLabel, { color: theme.colors.textSecondary }]}
            >
              {formatShortCurrency((maxValue + minValue) / 2)}
            </Text>
            <Text
              style={[styles.axisLabel, { color: theme.colors.textSecondary }]}
            >
              {formatShortCurrency(minValue)}
            </Text>
          </View>

          {/* Chart line */}
          <View style={styles.chartLine}>
            {trends.map((trend, index) => {
              const x = index * pointWidth;
              const y =
                range > 0
                  ? ((maxValue - trend.netWorth) / range) * (height - 40)
                  : height / 2;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dataPoint,
                    {
                      left: x - 4,
                      top: y - 4,
                      backgroundColor:
                        trend.change >= 0
                          ? theme.colors.success
                          : theme.colors.error,
                    },
                  ]}
                  onPress={() => {
                    haptic.light();
                    onDataPointPress?.(trend);
                  }}
                />
              );
            })}
          </View>
        </View>

        {/* X-axis labels */}
        <View style={styles.xAxisLabels}>
          {trends
            .filter((_, index) => index % Math.ceil(trends.length / 4) === 0)
            .map((trend, index) => (
              <Text
                key={index}
                style={[
                  styles.axisLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {formatDate(trend.date)}
              </Text>
            ))}
        </View>
      </View>
    );
  };

  const renderMonthlyView = () => {
    return (
      <ScrollView
        style={styles.monthlyContainer}
        showsVerticalScrollIndicator={false}
      >
        {monthlyChanges.map((change, index) => (
          <View key={index} style={styles.monthlyItem}>
            <Flex direction='row' justify='space-between' align='center'>
              <View>
                <Text style={[styles.monthLabel, { color: theme.colors.text }]}>
                  {change.month} {change.year}
                </Text>
                <Flex direction='row' align='center' gap='xs'>
                  <Icon
                    name={
                      change.trend === 'increasing'
                        ? 'trending-up'
                        : change.trend === 'decreasing'
                          ? 'trending-down'
                          : 'remove'
                    }
                    size='sm'
                    color={getTrendColor(change.trend)}
                  />
                  <Text
                    style={[
                      styles.trendLabel,
                      { color: getTrendColor(change.trend) },
                    ]}
                  >
                    {change.trend}
                  </Text>
                </Flex>
              </View>

              <View style={styles.monthlyValues}>
                <Text
                  style={[
                    styles.monthlyChange,
                    { color: getChangeColor(change.change) },
                  ]}
                >
                  {change.change >= 0 ? '+' : ''}
                  {formatCurrency(change.change)}
                </Text>
                <Text
                  style={[
                    styles.monthlyPercentage,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {change.changePercentage >= 0 ? '+' : ''}
                  {change.changePercentage.toFixed(1)}%
                </Text>
              </View>
            </Flex>
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderTrendsSummary = () => {
    if (!trends.length) return null;

    const latestTrend = trends[trends.length - 1];
    const oldestTrend = trends[0];
    const totalChange = latestTrend.netWorth - oldestTrend.netWorth;
    const totalChangePercentage =
      oldestTrend.netWorth !== 0
        ? (totalChange / Math.abs(oldestTrend.netWorth)) * 100
        : 0;

    return (
      <Card variant='outlined' padding='base' style={styles.summaryCard}>
        <Flex direction='row' justify='space-around'>
          <View style={styles.summaryItem}>
            <Text
              style={[
                styles.summaryLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Period Change
            </Text>
            <Text
              style={[
                styles.summaryValue,
                { color: getChangeColor(totalChange) },
              ]}
            >
              {totalChange >= 0 ? '+' : ''}
              {formatCurrency(totalChange)}
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <Text
              style={[
                styles.summaryLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Percentage
            </Text>
            <Text
              style={[
                styles.summaryValue,
                { color: getChangeColor(totalChange) },
              ]}
            >
              {totalChangePercentage >= 0 ? '+' : ''}
              {totalChangePercentage.toFixed(1)}%
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <Text
              style={[
                styles.summaryLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Data Points
            </Text>
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
              {trends.length}
            </Text>
          </View>
        </Flex>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card variant='outlined' padding='lg'>
        <Flex direction='column' align='center' gap='base'>
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}
          >
            Loading trends data...
          </Text>
        </Flex>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <Card variant='outlined' padding='lg'>
        <Flex
          direction='row'
          justify='space-between'
          align='center'
          style={styles.header}
        >
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Net Worth Trends
          </Text>
          {renderViewModeSelector()}
        </Flex>

        {renderPeriodSelector()}
        {renderTrendsSummary()}

        {viewMode === 'chart' ? renderSimpleChart() : renderMonthlyView()}
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  periodSelector: {
    marginBottom: 16,
  },
  periodButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  viewModeSelector: {
    // Styles for view mode selector
  },
  viewModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  viewModeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  chartContainer: {
    marginBottom: 16,
  },
  chartArea: {
    flexDirection: 'row',
    flex: 1,
  },
  yAxisLabels: {
    width: 60,
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  chartLine: {
    flex: 1,
    position: 'relative',
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingLeft: 60,
  },
  axisLabel: {
    fontSize: 10,
  },
  monthlyContainer: {
    maxHeight: 300,
  },
  monthlyItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  trendLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  monthlyValues: {
    alignItems: 'flex-end',
  },
  monthlyChange: {
    fontSize: 16,
    fontWeight: '600',
  },
  monthlyPercentage: {
    fontSize: 12,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default NetWorthTrendsChart;
