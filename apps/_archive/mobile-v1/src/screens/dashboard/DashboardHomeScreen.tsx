import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useHapticContext } from '../../contexts/HapticContext';
import { Text, Card, Button, Container, Icon } from '../../components/ui';
import OfflineIndicator from '../../components/sync/OfflineIndicator';
import NetWorthDashboard from '../../components/financial/NetWorthDashboard';
import HomeStreaksWins from '../../components/dashboard/HomeStreaksWins';
import { useNetWorthTrends } from '../../hooks/useNetWorthTrends';
import { useEnhancedSync } from '../../hooks/useEnhancedSync';

export default function DashboardHomeScreen() {
  const { colors } = useTheme();
  const { trigger: triggerHaptic } = useHapticContext();
  const trendsHook = useNetWorthTrends(undefined, 12);
  const { networkQualityDescription, pendingChanges, isSyncing } =
    useEnhancedSync();

  const monthlyChanges = React.useMemo(() => {
    const arr = trendsHook.data;
    if (!arr || arr.length === 0)
      return [] as Array<{
        month: string;
        year: number;
        change: number;
        startNetWorth: number;
        endNetWorth: number;
        changePercentage: number;
        trend: 'increasing' | 'decreasing' | 'stable';
      }>;
    const now = new Date();
    const points = arr.map((pt, idx) => {
      const d = new Date(
        now.getFullYear(),
        now.getMonth() - (arr.length - 1 - idx),
        1
      );
      return { date: d, value: pt.value };
    });
    const result: Array<{
      month: string;
      year: number;
      change: number;
      startNetWorth: number;
      endNetWorth: number;
      changePercentage: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    }> = [];
    for (let i = 0; i < points.length; i++) {
      const prev = i > 0 ? points[i - 1].value : points[i].value;
      const curr = points[i].value;
      const change = curr - prev;
      const changePercentage = prev !== 0 ? (change / Math.abs(prev)) * 100 : 0;
      const trend =
        change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable';
      result.push({
        month: points[i].date.toLocaleDateString('en-US', { month: 'long' }),
        year: points[i].date.getFullYear(),
        startNetWorth: prev,
        endNetWorth: curr,
        change,
        changePercentage,
        trend,
      });
    }
    return result;
  }, [trendsHook.data]);

  const handleQuickAction = (action: string) => {
    triggerHaptic('light');
    console.log(`Quick action: ${action}`);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <Container style={styles.content}>
          {/* Status Row */}
          <View style={styles.statusRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <OfflineIndicator showText showAnalytics={false} compact />
            </View>
            <View
              style={styles.syncMeta}
              accessibilityLabel='Sync status'
              accessibilityRole='text'
            >
              <Icon
                name={isSyncing ? 'refresh' : 'checkmark-circle-outline'}
                size='md'
                color={isSyncing ? 'warning.500' : 'success.500'}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.syncText, { color: colors.text.secondary }]}>
                {isSyncing
                  ? 'Syncing…'
                  : pendingChanges > 0
                    ? `${pendingChanges} pending`
                    : networkQualityDescription}
              </Text>
            </View>
          </View>

          {/* Net Worth Summary & Trends (compact) */}
          <View style={styles.netWorthSection}>
            <NetWorthDashboard
              compact
              onViewTrends={() => {}}
              onViewDetails={() => {}}
            />
          </View>

          {/* Streaks & Wins */}
          <View style={styles.streaksSection}>
            <HomeStreaksWins monthlyChanges={monthlyChanges} />
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsSection}>
            <Text
              variant='h3'
              style={[styles.sectionTitle, { color: colors.text.primary }]}
            >
              Quick Actions
            </Text>

            <View style={styles.actionsGrid}>
              <Button
                variant='primary'
                size='sm'
                onPress={() => handleQuickAction('add-account')}
                style={styles.actionButton}
              >
                Add Account
              </Button>

              <Button
                variant='outline'
                size='sm'
                onPress={() => handleQuickAction('new-scenario')}
                style={styles.actionButton}
              >
                New Scenario
              </Button>

              <Button
                variant='outline'
                size='sm'
                onPress={() => handleQuickAction('adjust-plan')}
                style={styles.actionButton}
              >
                Adjust Plan
              </Button>
            </View>
          </View>
        </Container>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  syncMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  syncText: {
    fontSize: 12,
  },
  netWorthSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  actionsSection: {
    marginBottom: 32,
  },
  actionsGrid: {
    gap: 8,
  },
  actionButton: {
    marginBottom: 6,
  },
});
