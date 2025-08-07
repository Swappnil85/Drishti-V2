import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Flex, Icon, ProgressBar } from '@drishti/design-system';
import { useTheme } from '@drishti/design-system';
import { useSyncHealthDashboard } from '../../hooks/useSyncNotifications';

interface SyncHealthDashboardProps {
  onViewDetails?: () => void;
  onTroubleshoot?: () => void;
  style?: any;
  testID?: string;
}

/**
 * SyncHealthDashboard displays comprehensive sync health metrics and analytics
 * Shows success rates, failure reasons, network quality impact, and data usage
 */
const SyncHealthDashboard: React.FC<SyncHealthDashboardProps> = ({
  onViewDetails,
  onTroubleshoot,
  style,
  testID = 'sync-health-dashboard',
}) => {
  const theme = useTheme();
  const {
    healthScore,
    healthStatus,
    topFailureReasons,
    networkQualityInsights,
    dataUsage,
    successRate,
    averageSyncDuration,
    consecutiveFailures,
    lastSuccessfulSync,
    dailySyncs,
    weeklySyncs,
    monthlySyncs,
    isLoading,
  } = useSyncHealthDashboard();

  if (isLoading) {
    return (
      <Card variant="outlined" padding="lg" style={[styles.container, style]} testID={testID}>
        <Flex align="center" justify="center" style={styles.loadingContainer}>
          <Icon name="sync" size="lg" color="text.tertiary" />
          <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
            Loading sync health data...
          </Text>
        </Flex>
      </Card>
    );
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatLastSync = (timestamp: number) => {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (60 * 1000));
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <ScrollView style={[styles.container, style]} testID={testID}>
      {/* Health Score Overview */}
      <Card variant="outlined" padding="lg" style={styles.card}>
        <Flex direction="row" align="center" justify="space-between" style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            Sync Health Score
          </Text>
          <TouchableOpacity onPress={onViewDetails} style={styles.detailsButton}>
            <Icon name="info-circle" size="sm" color="text.tertiary" />
          </TouchableOpacity>
        </Flex>
        
        <Flex align="center" style={styles.scoreContainer}>
          <Text style={[styles.scoreValue, { color: healthStatus.color }]}>
            {healthScore}
          </Text>
          <Text style={[styles.scoreLabel, { color: theme.colors.text.secondary }]}>
            out of 100
          </Text>
          <Text style={[styles.statusMessage, { color: healthStatus.color }]}>
            {healthStatus.message}
          </Text>
        </Flex>
        
        <ProgressBar
          progress={healthScore / 100}
          color={healthStatus.color}
          style={styles.progressBar}
        />
      </Card>

      {/* Quick Stats */}
      <Card variant="outlined" padding="lg" style={styles.card}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Quick Stats
        </Text>
        
        <Flex direction="row" style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
              {successRate.toFixed(1)}%
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
              Success Rate
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
              {formatDuration(averageSyncDuration)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
              Avg Duration
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: consecutiveFailures > 0 ? '#ef4444' : theme.colors.text.primary }]}>
              {consecutiveFailures}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
              Consecutive Failures
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
              {formatLastSync(lastSuccessfulSync)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
              Last Success
            </Text>
          </View>
        </Flex>
      </Card>

      {/* Sync Frequency */}
      <Card variant="outlined" padding="lg" style={styles.card}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Sync Frequency
        </Text>
        
        <Flex direction="row" style={styles.frequencyGrid}>
          <View style={styles.frequencyItem}>
            <Text style={[styles.frequencyValue, { color: theme.colors.text.primary }]}>
              {dailySyncs}
            </Text>
            <Text style={[styles.frequencyLabel, { color: theme.colors.text.secondary }]}>
              Daily
            </Text>
          </View>
          
          <View style={styles.frequencyItem}>
            <Text style={[styles.frequencyValue, { color: theme.colors.text.primary }]}>
              {weeklySyncs}
            </Text>
            <Text style={[styles.frequencyLabel, { color: theme.colors.text.secondary }]}>
              Weekly
            </Text>
          </View>
          
          <View style={styles.frequencyItem}>
            <Text style={[styles.frequencyValue, { color: theme.colors.text.primary }]}>
              {monthlySyncs}
            </Text>
            <Text style={[styles.frequencyLabel, { color: theme.colors.text.secondary }]}>
              Monthly
            </Text>
          </View>
        </Flex>
      </Card>

      {/* Data Usage */}
      <Card variant="outlined" padding="lg" style={styles.card}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Data Usage
        </Text>
        
        <Flex direction="row" justify="space-between" style={styles.dataUsageRow}>
          <View>
            <Text style={[styles.dataUsageLabel, { color: theme.colors.text.secondary }]}>
              Total Transferred
            </Text>
            <Text style={[styles.dataUsageValue, { color: theme.colors.text.primary }]}>
              {dataUsage.total}
            </Text>
          </View>
          
          <View>
            <Text style={[styles.dataUsageLabel, { color: theme.colors.text.secondary }]}>
              Average per Sync
            </Text>
            <Text style={[styles.dataUsageValue, { color: theme.colors.text.primary }]}>
              {dataUsage.average}
            </Text>
          </View>
        </Flex>
      </Card>

      {/* Top Failure Reasons */}
      {topFailureReasons.length > 0 && (
        <Card variant="outlined" padding="lg" style={styles.card}>
          <Flex direction="row" align="center" justify="space-between" style={styles.header}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Top Failure Reasons
            </Text>
            {onTroubleshoot && (
              <TouchableOpacity onPress={onTroubleshoot} style={styles.troubleshootButton}>
                <Text style={[styles.troubleshootText, { color: theme.colors.primary }]}>
                  Troubleshoot
                </Text>
              </TouchableOpacity>
            )}
          </Flex>
          
          {topFailureReasons.map((failure, index) => (
            <Flex key={failure.reason} direction="row" justify="space-between" align="center" style={styles.failureItem}>
              <Text style={[styles.failureReason, { color: theme.colors.text.primary }]}>
                {failure.reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
              <Text style={[styles.failureCount, { color: theme.colors.text.secondary }]}>
                {failure.count}
              </Text>
            </Flex>
          ))}
        </Card>
      )}

      {/* Network Quality Impact */}
      {networkQualityInsights.length > 0 && (
        <Card variant="outlined" padding="lg" style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Network Quality Impact
          </Text>
          
          {networkQualityInsights.map((insight) => (
            <Flex key={insight.quality} direction="row" justify="space-between" align="center" style={styles.networkItem}>
              <Flex direction="row" align="center" gap="sm">
                <Icon 
                  name={insight.quality === 'excellent' ? 'wifi' : insight.quality === 'good' ? 'wifi' : 'wifi-off'} 
                  size="sm" 
                  color={insight.quality === 'excellent' ? 'success' : insight.quality === 'good' ? 'primary' : 'warning'} 
                />
                <Text style={[styles.networkQuality, { color: theme.colors.text.primary }]}>
                  {insight.quality.charAt(0).toUpperCase() + insight.quality.slice(1)}
                </Text>
              </Flex>
              
              <Flex direction="row" align="center" gap="md">
                <Text style={[styles.networkAttempts, { color: theme.colors.text.secondary }]}>
                  {insight.attempts} attempts
                </Text>
                <Text style={[styles.networkSuccess, { color: insight.successRate > 80 ? '#10b981' : insight.successRate > 60 ? '#f59e0b' : '#ef4444' }]}>
                  {insight.successRate}%
                </Text>
              </Flex>
            </Flex>
          ))}
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  card: {
    marginBottom: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  detailsButton: {
    padding: 4,
  },
  scoreContainer: {
    marginBottom: 16,
    gap: 4,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusMessage: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  statsGrid: {
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  frequencyGrid: {
    justifyContent: 'space-around',
  },
  frequencyItem: {
    alignItems: 'center',
    padding: 12,
  },
  frequencyValue: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 4,
  },
  frequencyLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  dataUsageRow: {
    paddingHorizontal: 16,
  },
  dataUsageLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  dataUsageValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  troubleshootButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  troubleshootText: {
    fontSize: 14,
    fontWeight: '500',
  },
  failureItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  failureReason: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  failureCount: {
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 32,
    textAlign: 'center',
  },
  networkItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  networkQuality: {
    fontSize: 14,
    fontWeight: '500',
  },
  networkAttempts: {
    fontSize: 12,
    fontWeight: '500',
  },
  networkSuccess: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
});

export default SyncHealthDashboard;
