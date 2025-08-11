import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
  RefreshControl,
} from 'react-native';
import { useSync } from '../../hooks/useSync';
import {
  syncMonitor,
  SyncHealthReport,
  SyncEvent,
} from '../../services/sync/SyncMonitor';
import { DetailedSyncStatus } from '../../components/sync/SyncStatusIndicator';

/**
 * SyncDebugScreen provides comprehensive sync debugging and monitoring
 * Intended for developers and power users to diagnose sync issues
 */
export default function SyncDebugScreen() {
  const { forceFullSync } = useSync();
  const [healthReport, setHealthReport] = useState<SyncHealthReport | null>(
    null
  );
  const [recentEvents, setRecentEvents] = useState<SyncEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<
    'overview' | 'events' | 'health'
  >('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [report, events] = await Promise.all([
        syncMonitor.generateHealthReport(),
        Promise.resolve(syncMonitor.getEventsByType('sync_error', 20)),
      ]);

      setHealthReport(report);
      setRecentEvents(events);
    } catch (error) {
      console.error('Failed to load sync debug data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleExportLogs = async () => {
    try {
      const logs = syncMonitor.exportEvents();
      await Share.share({
        message: logs,
        title: 'Sync Debug Logs',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export logs');
    }
  };

  const handleClearLogs = () => {
    Alert.alert(
      'Clear Logs',
      'This will clear all sync event logs. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await syncMonitor.clearEvents();
            await loadData();
          },
        },
      ]
    );
  };

  const handleForceSync = async () => {
    try {
      await forceFullSync();
      await loadData();
    } catch (error) {
      Alert.alert(
        'Sync Failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return '#28a745';
      case 'warning':
        return '#ffc107';
      case 'critical':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const renderOverview = () => (
    <View style={styles.tabContent}>
      <DetailedSyncStatus />

      {healthReport && (
        <View style={styles.healthCard}>
          <View style={styles.healthHeader}>
            <Text style={styles.healthTitle}>Sync Health</Text>
            <View
              style={[
                styles.healthBadge,
                { backgroundColor: getStatusColor(healthReport.status) },
              ]}
            >
              <Text style={styles.healthBadgeText}>
                {healthReport.status.toUpperCase()} ({healthReport.score}/100)
              </Text>
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {healthReport.metrics.totalSyncs}
              </Text>
              <Text style={styles.metricLabel}>Total Syncs</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {healthReport.metrics.totalSyncs > 0
                  ? (
                      (healthReport.metrics.successfulSyncs /
                        healthReport.metrics.totalSyncs) *
                      100
                    ).toFixed(1)
                  : '100'}
                %
              </Text>
              <Text style={styles.metricLabel}>Success Rate</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {healthReport.metrics.pendingConflicts}
              </Text>
              <Text style={styles.metricLabel}>Conflicts</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {formatDuration(healthReport.metrics.averageSyncDuration)}
              </Text>
              <Text style={styles.metricLabel}>Avg Duration</Text>
            </View>
          </View>

          {healthReport.issues.length > 0 && (
            <View style={styles.issuesSection}>
              <Text style={styles.issuesTitle}>Issues:</Text>
              {healthReport.issues.map((issue, index) => (
                <Text key={index} style={styles.issueText}>
                  • {issue}
                </Text>
              ))}
            </View>
          )}

          {healthReport.recommendations.length > 0 && (
            <View style={styles.recommendationsSection}>
              <Text style={styles.recommendationsTitle}>Recommendations:</Text>
              {healthReport.recommendations.map((rec, index) => (
                <Text key={index} style={styles.recommendationText}>
                  • {rec}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderEvents = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Recent Events</Text>
      {recentEvents.length === 0 ? (
        <Text style={styles.emptyText}>No recent events</Text>
      ) : (
        recentEvents.map(event => (
          <View key={event.id} style={styles.eventItem}>
            <View style={styles.eventHeader}>
              <Text style={styles.eventType}>
                {event.type.replace('_', ' ').toUpperCase()}
              </Text>
              <Text style={styles.eventTime}>
                {formatTimestamp(event.timestamp)}
              </Text>
            </View>
            {event.duration && (
              <Text style={styles.eventDetail}>
                Duration: {formatDuration(event.duration)}
              </Text>
            )}
            {event.data && (
              <Text style={styles.eventData} numberOfLines={3}>
                {JSON.stringify(event.data, null, 2)}
              </Text>
            )}
          </View>
        ))
      )}
    </View>
  );

  const renderHealth = () => (
    <View style={styles.tabContent}>
      {healthReport && (
        <>
          <Text style={styles.sectionTitle}>Detailed Metrics</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Syncs:</Text>
              <Text style={styles.detailValue}>
                {healthReport.metrics.totalSyncs}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Successful:</Text>
              <Text style={styles.detailValue}>
                {healthReport.metrics.successfulSyncs}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Failed:</Text>
              <Text style={styles.detailValue}>
                {healthReport.metrics.failedSyncs}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Network Errors:</Text>
              <Text style={styles.detailValue}>
                {healthReport.metrics.networkErrors}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Auth Errors:</Text>
              <Text style={styles.detailValue}>
                {healthReport.metrics.authErrors}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Conflicts:</Text>
              <Text style={styles.detailValue}>
                {healthReport.metrics.totalConflicts}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Resolved Conflicts:</Text>
              <Text style={styles.detailValue}>
                {healthReport.metrics.resolvedConflicts}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Data Transferred:</Text>
              <Text style={styles.detailValue}>
                {(healthReport.metrics.dataTransferred / 1024).toFixed(1)} KB
              </Text>
            </View>
          </View>
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sync Debug</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleExportLogs}
          >
            <Text style={styles.actionButtonText}>Export</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleClearLogs}
          >
            <Text style={styles.actionButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabs}>
        {['overview', 'events', 'health'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.activeTab]}
            onPress={() => setSelectedTab(tab as any)}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === tab && styles.activeTabText,
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'events' && renderEvents()}
        {selectedTab === 'health' && renderHealth()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.syncButton} onPress={handleForceSync}>
          <Text style={styles.syncButtonText}>Force Full Sync</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
    backgroundColor: '#007bff',
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007bff',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007bff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  healthCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  healthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  healthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  healthBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  metricItem: {
    width: '50%',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  issuesSection: {
    marginBottom: 12,
  },
  issuesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc3545',
    marginBottom: 8,
  },
  issueText: {
    fontSize: 12,
    color: '#dc3545',
    marginBottom: 4,
  },
  recommendationsSection: {
    marginBottom: 12,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#28a745',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 12,
    color: '#28a745',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 40,
  },
  eventItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007bff',
  },
  eventTime: {
    fontSize: 10,
    color: '#999',
  },
  eventDetail: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  eventData: {
    fontSize: 10,
    color: '#333',
    fontFamily: 'monospace',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 4,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  syncButton: {
    backgroundColor: '#dc3545',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
