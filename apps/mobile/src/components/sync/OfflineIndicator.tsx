import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import {
  offlineService,
  OfflineStatus,
  OfflineAnalytics,
} from '../../services/sync/OfflineService';
import { Icon, Card, Flex, Button } from '../ui';

interface OfflineIndicatorProps {
  showText?: boolean;
  showAnalytics?: boolean;
  compact?: boolean;
  onPress?: () => void;
  style?: any;
}

/**
 * OfflineIndicator component displays comprehensive offline status
 * Shows offline/online state, pending operations, and offline analytics
 */
export default function OfflineIndicator({
  showText = true,
  showAnalytics = false,
  compact = false,
  onPress,
  style,
}: OfflineIndicatorProps) {
  // Phase A: prefer compact chip by default when used in Dashboard
  // (Callers can still pass compact={false} to expand.)

  const theme = useTheme();
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus>({
    isOnline: true,
    hasOfflineCapability: true,
    pendingOperations: 0,
    lastOfflineSync: null,
    offlineDataSize: 0,
    offlineFeatures: {
      accountManagement: true,
      goalTracking: true,
      calculations: true,
      dataVisualization: true,
    },
  });
  const [offlineAnalytics, setOfflineAnalytics] = useState<OfflineAnalytics>({
    totalOfflineTime: 0,
    operationsPerformed: 0,
    dataCreated: 0,
    dataModified: 0,
    calculationsRun: 0,
    lastAnalyticsReset: Date.now(),
  });
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    // Load initial status
    loadOfflineStatus();
    loadOfflineAnalytics();

    // Subscribe to offline status updates
    const unsubscribe = offlineService.addOfflineListener(status => {
      setOfflineStatus(status);
    });

    // Update analytics periodically
    const analyticsInterval = setInterval(() => {
      loadOfflineAnalytics();
    }, 30000);

    return () => {
      unsubscribe();
      clearInterval(analyticsInterval);
    };
  }, []);

  const loadOfflineStatus = async () => {
    try {
      const status = await offlineService.getOfflineStatus();
      setOfflineStatus(status);
    } catch (error) {
      console.error('Failed to load offline status:', error);
    }
  };

  const loadOfflineAnalytics = () => {
    try {
      const analytics = offlineService.getOfflineAnalytics();
      setOfflineAnalytics(analytics);
    } catch (error) {
      console.error('Failed to load offline analytics:', error);
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      setShowDetailsModal(true);
    }
  };

  const handleRetryFailedOperations = async () => {
    try {
      await offlineService.retryFailedOperations();
      Alert.alert('Success', 'Failed operations have been queued for retry.');
    } catch (error) {
      Alert.alert('Error', 'Failed to retry operations. Please try again.');
    }
  };

  const handleClearOfflineData = () => {
    Alert.alert(
      'Clear Offline Data',
      'This will clear all offline data and analytics. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await offlineService.clearOfflineData();
              Alert.alert('Success', 'Offline data cleared successfully.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear offline data.');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = () => {
    if (!offlineStatus.isOnline) {
      return theme.colors.warning[500]; // Orange for offline
    } else if (offlineStatus.pendingOperations > 0) {
      return theme.colors.primary[500]; // Blue for pending operations
    } else {
      return theme.colors.success[500]; // Green for online and synced
    }
  };

  const getStatusText = () => {
    if (!offlineStatus.isOnline) {
      return 'Offline Mode';
    } else if (offlineStatus.pendingOperations > 0) {
      return `${offlineStatus.pendingOperations} Pending`;
    } else {
      return 'Online';
    }
  };

  const getStatusIcon = () => {
    if (!offlineStatus.isOnline) {
      return 'wifi-off';
    } else if (offlineStatus.pendingOperations > 0) {
      return 'sync';
    } else {
      return 'wifi';
    }
  };

  const formatDataSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const renderStatusIndicator = () => {
    const statusColor = getStatusColor();

    return (
      <TouchableOpacity
        style={[
          styles.container,
          compact && styles.compact,
          { backgroundColor: theme.colors.neutral[100] },
          style,
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Flex direction='row' align='center' gap='sm'>
          <Icon name={getStatusIcon()} size='sm' color={statusColor} />

          {showText && !compact && (
            <View style={styles.textContainer}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getStatusText()}
              </Text>

              {showAnalytics && (
                <Text
                  style={[
                    styles.analyticsText,
                    { color: theme.colors.neutral[600] },
                  ]}
                >
                  {offlineAnalytics.operationsPerformed} ops •{' '}
                  {formatDataSize(offlineStatus.offlineDataSize)}
                </Text>
              )}
            </View>
          )}

          {offlineStatus.pendingOperations > 0 && (
            <View
              style={[
                styles.badge,
                { backgroundColor: theme.colors.info[500] },
              ]}
            >
              <Text style={styles.badgeText}>
                {offlineStatus.pendingOperations}
              </Text>
            </View>
          )}
        </Flex>
      </TouchableOpacity>
    );
  };

  const renderDetailsModal = () => {
    const queueStatus = offlineService.getOfflineQueueStatus();

    return (
      <Modal
        visible={showDetailsModal}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.colors.background.primary },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text
              style={[styles.modalTitle, { color: theme.colors.text.primary }]}
            >
              Offline Status
            </Text>
            <TouchableOpacity
              onPress={() => setShowDetailsModal(false)}
              style={styles.closeButton}
            >
              <Icon name='close' size='md' color={theme.colors.neutral[600]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Connection Status */}
            <Card variant='outlined' padding='base' style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.text.primary },
                ]}
              >
                Connection Status
              </Text>
              <Flex
                direction='row'
                align='center'
                gap='sm'
                style={styles.statusRow}
              >
                <Icon
                  name={getStatusIcon()}
                  size='md'
                  color={getStatusColor()}
                />
                <Text
                  style={[
                    styles.statusValue,
                    { color: theme.colors.text.primary },
                  ]}
                >
                  {getStatusText()}
                </Text>
              </Flex>
            </Card>

            {/* Offline Features */}
            <Card variant='outlined' padding='base' style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.text.primary },
                ]}
              >
                Offline Features
              </Text>
              {Object.entries(offlineStatus.offlineFeatures).map(
                ([feature, enabled]) => (
                  <Flex
                    key={feature}
                    direction='row'
                    justify='between'
                    align='center'
                    style={styles.featureRow}
                  >
                    <Text
                      style={[
                        styles.featureText,
                        { color: theme.colors.text.primary },
                      ]}
                    >
                      {feature
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, str => str.toUpperCase())}
                    </Text>
                    <Icon
                      name={enabled ? 'checkmark-circle' : 'close-circle'}
                      size='sm'
                      color={
                        enabled
                          ? theme.colors.success[500]
                          : theme.colors.error[500]
                      }
                    />
                  </Flex>
                )
              )}
            </Card>

            {/* Queue Status */}
            <Card variant='outlined' padding='base' style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.text.primary },
                ]}
              >
                Operation Queue
              </Text>
              <Flex direction='row' justify='between' style={styles.queueRow}>
                <Text
                  style={[
                    styles.queueLabel,
                    { color: theme.colors.neutral[600] },
                  ]}
                >
                  Total
                </Text>
                <Text
                  style={[
                    styles.queueValue,
                    { color: theme.colors.text.primary },
                  ]}
                >
                  {queueStatus.total}
                </Text>
              </Flex>
              <Flex direction='row' justify='between' style={styles.queueRow}>
                <Text
                  style={[
                    styles.queueLabel,
                    { color: theme.colors.neutral[600] },
                  ]}
                >
                  Pending
                </Text>
                <Text
                  style={[
                    styles.queueValue,
                    { color: theme.colors.primary[500] },
                  ]}
                >
                  {queueStatus.pending}
                </Text>
              </Flex>
              <Flex direction='row' justify='between' style={styles.queueRow}>
                <Text
                  style={[
                    styles.queueLabel,
                    { color: theme.colors.neutral[600] },
                  ]}
                >
                  Failed
                </Text>
                <Text
                  style={[
                    styles.queueValue,
                    { color: theme.colors.error[500] },
                  ]}
                >
                  {queueStatus.failed}
                </Text>
              </Flex>
            </Card>

            {/* Analytics */}
            <Card variant='outlined' padding='base' style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.text.primary },
                ]}
              >
                Offline Analytics
              </Text>
              <Flex
                direction='row'
                justify='between'
                style={styles.analyticsRow}
              >
                <Text
                  style={[
                    styles.analyticsLabel,
                    { color: theme.colors.neutral[600] },
                  ]}
                >
                  Total Offline Time
                </Text>
                <Text
                  style={[
                    styles.analyticsValue,
                    { color: theme.colors.text.primary },
                  ]}
                >
                  {formatTime(offlineAnalytics.totalOfflineTime)}
                </Text>
              </Flex>
              <Flex
                direction='row'
                justify='between'
                style={styles.analyticsRow}
              >
                <Text
                  style={[
                    styles.analyticsLabel,
                    { color: theme.colors.neutral[600] },
                  ]}
                >
                  Operations Performed
                </Text>
                <Text
                  style={[
                    styles.analyticsValue,
                    { color: theme.colors.text.primary },
                  ]}
                >
                  {offlineAnalytics.operationsPerformed}
                </Text>
              </Flex>
              <Flex
                direction='row'
                justify='between'
                style={styles.analyticsRow}
              >
                <Text
                  style={[
                    styles.analyticsLabel,
                    { color: theme.colors.neutral[600] },
                  ]}
                >
                  Data Created
                </Text>
                <Text
                  style={[
                    styles.analyticsValue,
                    { color: theme.colors.text.primary },
                  ]}
                >
                  {offlineAnalytics.dataCreated}
                </Text>
              </Flex>
              <Flex
                direction='row'
                justify='between'
                style={styles.analyticsRow}
              >
                <Text
                  style={[
                    styles.analyticsLabel,
                    { color: theme.colors.neutral[600] },
                  ]}
                >
                  Calculations Run
                </Text>
                <Text
                  style={[
                    styles.analyticsValue,
                    { color: theme.colors.text.primary },
                  ]}
                >
                  {offlineAnalytics.calculationsRun}
                </Text>
              </Flex>
              <Flex
                direction='row'
                justify='between'
                style={styles.analyticsRow}
              >
                <Text
                  style={[
                    styles.analyticsLabel,
                    { color: theme.colors.neutral[600] },
                  ]}
                >
                  Offline Data Size
                </Text>
                <Text
                  style={[
                    styles.analyticsValue,
                    { color: theme.colors.text.primary },
                  ]}
                >
                  {formatDataSize(offlineStatus.offlineDataSize)}
                </Text>
              </Flex>
            </Card>

            {/* Actions */}
            <View style={styles.actions}>
              {queueStatus.failed > 0 && (
                <Button
                  variant='outline'
                  onPress={handleRetryFailedOperations}
                  style={styles.actionButton}
                >
                  Retry Failed Operations
                </Button>
              )}

              <Button
                variant='outline'
                onPress={handleClearOfflineData}
                style={styles.actionButton}
              >
                Clear Offline Data
              </Button>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <>
      {renderStatusIndicator()}
      {renderDetailsModal()}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minHeight: 40,
  },
  compact: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 32,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  analyticsText: {
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  statusRow: {
    paddingVertical: 4,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  featureRow: {
    paddingVertical: 6,
  },
  featureText: {
    fontSize: 14,
  },
  queueRow: {
    paddingVertical: 4,
  },
  queueLabel: {
    fontSize: 14,
  },
  queueValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  analyticsRow: {
    paddingVertical: 4,
  },
  analyticsLabel: {
    fontSize: 14,
  },
  analyticsValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    paddingVertical: 20,
    gap: 12,
  },
  actionButton: {
    marginVertical: 4,
  },
});
