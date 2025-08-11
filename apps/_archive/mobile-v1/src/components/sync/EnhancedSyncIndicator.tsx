import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import {
  useEnhancedSync,
  usePlaidIntegration,
} from '../../hooks/useEnhancedSync';

// Simple Badge component for web compatibility
const Badge = ({ children, colorScheme, variant, size, style }: any) => (
  <View
    style={[
      {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor:
          colorScheme === 'blue'
            ? '#3b82f6'
            : colorScheme === 'green'
              ? '#10b981'
              : colorScheme === 'yellow'
                ? '#f59e0b'
                : colorScheme === 'red'
                  ? '#ef4444'
                  : colorScheme === 'orange'
                    ? '#f97316'
                    : '#6b7280',
      },
      style,
    ]}
  >
    <Text style={{ color: 'white', fontSize: 12, fontWeight: '500' }}>
      {children}
    </Text>
  </View>
);

// Simple Button component for web compatibility
const Button = ({
  children,
  onPress,
  disabled,
  variant,
  size,
  leftIcon,
  style,
}: any) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={[
      {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        backgroundColor: variant === 'outline' ? 'transparent' : '#3b82f6',
        borderWidth: variant === 'outline' ? 1 : 0,
        borderColor: '#3b82f6',
        opacity: disabled ? 0.5 : 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
      },
      style,
    ]}
  >
    {leftIcon}
    <Text
      style={{
        color: variant === 'outline' ? '#3b82f6' : 'white',
        fontSize: 14,
        fontWeight: '500',
      }}
    >
      {children}
    </Text>
  </TouchableOpacity>
);

// Simple Icon component for web compatibility
const Icon = ({ name, size, color, style }: any) => {
  const iconMap: { [key: string]: string } = {
    sync: '🔄',
    'cloud-offline': '☁️',
    warning: '⚠️',
    'cloud-done': '✅',
    cloud: '☁️',
    'cloud-queue': '⏳',
    'cloud-off': '❌',
    close: '✕',
    'cloud-sync': '🔄',
    'account-balance': '🏦',
  };

  return (
    <Text style={[{ color, fontSize: size === 'sm' ? 16 : 20 }, style]}>
      {iconMap[name] || '•'}
    </Text>
  );
};

interface EnhancedSyncIndicatorProps {
  showText?: boolean;
  showNetworkQuality?: boolean;
  showPlaidStatus?: boolean;
  onPress?: () => void;
  style?: any;
  testID?: string;
}

/**
 * EnhancedSyncIndicator displays comprehensive sync status including
 * network quality, adaptive sync status, and Plaid integration status
 */
export default function EnhancedSyncIndicator({
  showText = true,
  showNetworkQuality = true,
  showPlaidStatus = false,
  onPress,
  style,
  testID,
}: EnhancedSyncIndicatorProps) {
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const {
    networkQuality,
    lastSyncResult,
    isSyncing,
    isOnline,
    networkQualityDescription,
    adaptiveRecommendations,
    performAdaptiveSync,
    forceSync,
    syncSuccess,
    pendingChanges,
    conflictsDetected,
    bytesTransferred,
    syncDuration,
  } = useEnhancedSync();

  const {
    connections,
    isSyncing: isPlaidSyncing,
    totalConnections,
    activeConnections,
    hasErrors: hasPlaidErrors,
    autoSyncEnabled,
    syncAllBalances,
  } = usePlaidIntegration();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      setModalVisible(true);
    }
  };

  const handleManualSync = async () => {
    try {
      await performAdaptiveSync();
      Alert.alert('Sync Complete', 'Data has been synchronized successfully.');
    } catch (error) {
      Alert.alert(
        'Sync Failed',
        'Failed to synchronize data. Please try again.'
      );
    }
  };

  const handleForceSync = async () => {
    try {
      await forceSync();
      Alert.alert('Force Sync Complete', 'Full synchronization completed.');
    } catch (error) {
      Alert.alert('Force Sync Failed', 'Failed to force synchronization.');
    }
  };

  const handlePlaidSync = async () => {
    try {
      const result = await syncAllBalances();
      Alert.alert(
        'Plaid Sync Complete',
        `Updated ${result.updatedAccounts} accounts${result.errors.length > 0 ? ` with ${result.errors.length} errors` : ''}.`
      );
    } catch (error) {
      Alert.alert('Plaid Sync Failed', 'Failed to sync bank account balances.');
    }
  };

  const getStatusColor = () => {
    if (isSyncing || isPlaidSyncing) return theme.colors.primary;
    if (!isOnline) return theme.colors.text.secondary;
    if (conflictsDetected > 0 || hasPlaidErrors) return '#f59e0b'; // amber
    if (syncSuccess) return '#10b981'; // green
    return theme.colors.text.secondary;
  };

  const getStatusIcon = () => {
    if (isSyncing || isPlaidSyncing) return 'sync';
    if (!isOnline) return 'cloud-offline';
    if (conflictsDetected > 0 || hasPlaidErrors) return 'warning';
    if (networkQuality?.quality === 'excellent') return 'cloud-done';
    if (networkQuality?.quality === 'good') return 'cloud';
    if (networkQuality?.quality === 'fair') return 'cloud-queue';
    if (networkQuality?.quality === 'poor') return 'cloud-off';
    return 'cloud';
  };

  const getNetworkQualityColor = () => {
    if (!networkQuality) return theme.colors.text.secondary;

    const colors = {
      poor: '#ef4444', // red
      fair: '#f59e0b', // amber
      good: '#10b981', // green
      excellent: '#3b82f6', // blue
    };

    return colors[networkQuality.quality];
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.container, style]}
        onPress={handlePress}
        testID={testID}
      >
        <View style={styles.row}>
          {isSyncing || isPlaidSyncing ? (
            <ActivityIndicator size='small' color={getStatusColor()} />
          ) : (
            <Icon name={getStatusIcon()} size='sm' color={getStatusColor()} />
          )}

          {showText && (
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {isSyncing || isPlaidSyncing
                ? 'Syncing...'
                : !isOnline
                  ? 'Offline'
                  : conflictsDetected > 0
                    ? 'Conflicts'
                    : hasPlaidErrors
                      ? 'Sync Issues'
                      : 'Online'}
            </Text>
          )}

          {showNetworkQuality && networkQuality && (
            <Badge
              colorScheme={
                networkQuality.quality === 'excellent'
                  ? 'blue'
                  : networkQuality.quality === 'good'
                    ? 'green'
                    : networkQuality.quality === 'fair'
                      ? 'yellow'
                      : 'red'
              }
              variant='subtle'
              size='sm'
            >
              {networkQuality.quality.toUpperCase()}
            </Badge>
          )}

          {showPlaidStatus && totalConnections > 0 && (
            <Badge
              colorScheme={
                hasPlaidErrors
                  ? 'red'
                  : activeConnections > 0
                    ? 'green'
                    : 'gray'
              }
              variant='subtle'
              size='sm'
            >
              {activeConnections}/{totalConnections}
            </Badge>
          )}

          {(pendingChanges > 0 || conflictsDetected > 0) && (
            <Badge colorScheme='orange' variant='solid' size='sm'>
              {pendingChanges + conflictsDetected}
            </Badge>
          )}
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text
              style={[styles.modalTitle, { color: theme.colors.text.primary }]}
            >
              Enhanced Sync Status
            </Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Icon name='close' size='md' color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {/* Network Quality Section */}
            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.text.primary },
                ]}
              >
                Network Quality
              </Text>
              <View style={styles.rowBetween}>
                <Text
                  style={[
                    styles.sectionText,
                    { color: theme.colors.text.secondary },
                  ]}
                >
                  {networkQualityDescription}
                </Text>
                <Badge
                  colorScheme={
                    networkQuality?.quality === 'excellent'
                      ? 'blue'
                      : networkQuality?.quality === 'good'
                        ? 'green'
                        : networkQuality?.quality === 'fair'
                          ? 'yellow'
                          : 'red'
                  }
                >
                  {networkQuality?.quality?.toUpperCase() || 'UNKNOWN'}
                </Badge>
              </View>

              {networkQuality && (
                <View style={styles.networkDetails}>
                  <Text
                    style={[
                      styles.detailText,
                      { color: theme.colors.text.secondary },
                    ]}
                  >
                    Connection: {networkQuality.connectionType}
                  </Text>
                  <Text
                    style={[
                      styles.detailText,
                      { color: theme.colors.text.secondary },
                    ]}
                  >
                    Speed: ~{networkQuality.downlink} Mbps
                  </Text>
                  <Text
                    style={[
                      styles.detailText,
                      { color: theme.colors.text.secondary },
                    ]}
                  >
                    Latency: ~{networkQuality.rtt}ms
                  </Text>
                </View>
              )}
            </View>

            {/* Last Sync Section */}
            {lastSyncResult && (
              <View style={styles.section}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: theme.colors.text.primary },
                  ]}
                >
                  Last Sync
                </Text>
                <View style={styles.syncDetails}>
                  <Text
                    style={[
                      styles.detailText,
                      { color: theme.colors.text.secondary },
                    ]}
                  >
                    Status: {lastSyncResult.success ? 'Success' : 'Failed'}
                  </Text>
                  <Text
                    style={[
                      styles.detailText,
                      { color: theme.colors.text.secondary },
                    ]}
                  >
                    Changes: {lastSyncResult.changesApplied}
                  </Text>
                  <Text
                    style={[
                      styles.detailText,
                      { color: theme.colors.text.secondary },
                    ]}
                  >
                    Conflicts: {lastSyncResult.conflictsDetected}
                  </Text>
                  <Text
                    style={[
                      styles.detailText,
                      { color: theme.colors.text.secondary },
                    ]}
                  >
                    Data: {formatBytes(lastSyncResult.bytesTransferred)}
                  </Text>
                  <Text
                    style={[
                      styles.detailText,
                      { color: theme.colors.text.secondary },
                    ]}
                  >
                    Duration: {formatDuration(lastSyncResult.syncDuration)}
                  </Text>
                </View>
              </View>
            )}

            {/* Plaid Integration Section */}
            {showPlaidStatus && (
              <View style={styles.section}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: theme.colors.text.primary },
                  ]}
                >
                  Bank Account Sync
                </Text>
                <View style={styles.plaidDetails}>
                  <Text
                    style={[
                      styles.detailText,
                      { color: theme.colors.text.secondary },
                    ]}
                  >
                    Connected Banks: {totalConnections}
                  </Text>
                  <Text
                    style={[
                      styles.detailText,
                      { color: theme.colors.text.secondary },
                    ]}
                  >
                    Active Connections: {activeConnections}
                  </Text>
                  <Text
                    style={[
                      styles.detailText,
                      { color: theme.colors.text.secondary },
                    ]}
                  >
                    Auto-Sync: {autoSyncEnabled ? 'Enabled' : 'Disabled'}
                  </Text>
                  <Text
                    style={[
                      styles.detailText,
                      { color: theme.colors.text.secondary },
                    ]}
                  >
                    Status: {hasPlaidErrors ? 'Has Errors' : 'Healthy'}
                  </Text>
                </View>
              </View>
            )}

            {/* Adaptive Recommendations */}
            {adaptiveRecommendations &&
              adaptiveRecommendations.qualityOptimizations.length > 0 && (
                <View style={styles.section}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: theme.colors.text.primary },
                    ]}
                  >
                    Recommendations
                  </Text>
                  {adaptiveRecommendations.qualityOptimizations.map(
                    (rec, index) => (
                      <Text
                        key={index}
                        style={[
                          styles.detailText,
                          { color: theme.colors.text.secondary },
                        ]}
                      >
                        • {rec}
                      </Text>
                    )
                  )}
                </View>
              )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <Button
                onPress={handleManualSync}
                disabled={isSyncing}
                variant='outline'
                size='sm'
                leftIcon={<Icon name='sync' size='sm' color='#3b82f6' />}
                style={styles.actionButton}
              >
                Adaptive Sync
              </Button>

              <Button
                onPress={handleForceSync}
                disabled={isSyncing}
                variant='outline'
                size='sm'
                leftIcon={<Icon name='cloud-sync' size='sm' color='#3b82f6' />}
                style={styles.actionButton}
              >
                Force Sync
              </Button>

              {showPlaidStatus && totalConnections > 0 && (
                <Button
                  onPress={handlePlaidSync}
                  disabled={isPlaidSyncing}
                  variant='outline'
                  size='sm'
                  leftIcon={
                    <Icon name='account-balance' size='sm' color='#3b82f6' />
                  }
                  style={styles.actionButton}
                >
                  Sync Banks
                </Button>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
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
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
  },
  networkDetails: {
    marginTop: 8,
    paddingLeft: 12,
  },
  syncDetails: {
    paddingLeft: 12,
  },
  plaidDetails: {
    paddingLeft: 12,
  },
  detailText: {
    fontSize: 13,
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  actionButton: {
    marginRight: 8,
    marginBottom: 8,
  },
});
