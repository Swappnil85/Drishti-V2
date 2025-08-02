import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSync } from '../../hooks/useSync';

interface SyncStatusIndicatorProps {
  showText?: boolean;
  showLastSync?: boolean;
  onPress?: () => void;
  style?: any;
}

/**
 * SyncStatusIndicator component displays current sync status
 * Shows online/offline state, sync progress, and allows manual sync
 */
export default function SyncStatusIndicator({
  showText = true,
  showLastSync = false,
  onPress,
  style,
}: SyncStatusIndicatorProps) {
  const {
    syncStatus,
    performSync,
    forceFullSync,
    lastSyncFormatted,
    syncStatusColor,
    syncStatusText,
    isSyncNeeded,
    isSyncAvailable,
  } = useSync();

  const handlePress = async () => {
    if (onPress) {
      onPress();
      return;
    }

    if (!isSyncAvailable) {
      if (!syncStatus.isOnline) {
        Alert.alert(
          'Offline',
          'Cannot sync while offline. Please check your internet connection.'
        );
      } else if (syncStatus.syncInProgress) {
        Alert.alert(
          'Sync in Progress',
          'Sync is already in progress. Please wait.'
        );
      }
      return;
    }

    try {
      if (isSyncNeeded || syncStatus.lastError) {
        // Show options for different sync types
        Alert.alert('Sync Options', 'Choose sync type:', [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Quick Sync',
            onPress: () => performSync(),
          },
          {
            text: 'Full Sync',
            onPress: () => forceFullSync(),
          },
        ]);
      } else {
        // Just perform regular sync
        await performSync();
      }
    } catch (error) {
      Alert.alert(
        'Sync Failed',
        error instanceof Error ? error.message : 'An unknown error occurred',
        [{ text: 'OK' }]
      );
    }
  };

  const renderSyncIcon = () => {
    if (syncStatus.syncInProgress) {
      return (
        <ActivityIndicator
          size='small'
          color={syncStatusColor}
          style={styles.icon}
        />
      );
    }

    // Simple colored circle as sync indicator
    return (
      <View style={[styles.statusDot, { backgroundColor: syncStatusColor }]} />
    );
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      disabled={!isSyncAvailable && !onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {renderSyncIcon()}

        {showText && (
          <View style={styles.textContainer}>
            <Text style={[styles.statusText, { color: syncStatusColor }]}>
              {syncStatusText}
            </Text>

            {showLastSync && (
              <Text style={styles.lastSyncText}>
                Last sync: {lastSyncFormatted}
              </Text>
            )}

            {syncStatus.pendingOperations > 0 && (
              <Text style={styles.pendingText}>
                {syncStatus.pendingOperations} pending change
                {syncStatus.pendingOperations === 1 ? '' : 's'}
              </Text>
            )}

            {syncStatus.lastError && (
              <Text style={styles.errorText} numberOfLines={1}>
                Error: {syncStatus.lastError}
              </Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

/**
 * Compact sync status indicator for headers/toolbars
 */
export function CompactSyncIndicator({ onPress }: { onPress?: () => void }) {
  return (
    <SyncStatusIndicator
      showText={false}
      showLastSync={false}
      onPress={onPress || (() => {})}
      style={styles.compact}
    />
  );
}

/**
 * Detailed sync status card for settings/debug screens
 */
export function DetailedSyncStatus() {
  const {
    syncStatus,
    performSync,
    forceFullSync,
    clearSyncData,
    lastSyncFormatted,
  } = useSync();

  const handleClearSyncData = () => {
    Alert.alert(
      'Clear Sync Data',
      'This will clear all sync history and force a full sync on next connection. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearSyncData();
              Alert.alert('Success', 'Sync data cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear sync data');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.detailedContainer}>
      <Text style={styles.detailedTitle}>Sync Status</Text>

      <View style={styles.detailedRow}>
        <Text style={styles.detailedLabel}>Status:</Text>
        <SyncStatusIndicator showText={true} showLastSync={false} />
      </View>

      <View style={styles.detailedRow}>
        <Text style={styles.detailedLabel}>Last Sync:</Text>
        <Text style={styles.detailedValue}>{lastSyncFormatted}</Text>
      </View>

      <View style={styles.detailedRow}>
        <Text style={styles.detailedLabel}>Pending:</Text>
        <Text style={styles.detailedValue}>
          {syncStatus.pendingOperations} operations
        </Text>
      </View>

      <View style={styles.detailedRow}>
        <Text style={styles.detailedLabel}>Conflicts:</Text>
        <Text style={styles.detailedValue}>
          {syncStatus.conflictsCount} conflicts
        </Text>
      </View>

      {syncStatus.lastError && (
        <View style={styles.detailedRow}>
          <Text style={styles.detailedLabel}>Last Error:</Text>
          <Text style={[styles.detailedValue, styles.errorText]}>
            {syncStatus.lastError}
          </Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => performSync()}
          disabled={!syncStatus.isOnline || syncStatus.syncInProgress}
        >
          <Text style={styles.buttonText}>Sync Now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => forceFullSync()}
          disabled={!syncStatus.isOnline || syncStatus.syncInProgress}
        >
          <Text style={styles.buttonTextSecondary}>Full Sync</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={handleClearSyncData}
        >
          <Text style={styles.buttonText}>Clear Data</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  compact: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  lastSyncText: {
    fontSize: 10,
    color: '#666',
    marginTop: 1,
  },
  pendingText: {
    fontSize: 10,
    color: '#17a2b8',
    marginTop: 1,
  },
  errorText: {
    fontSize: 10,
    color: '#dc3545',
    marginTop: 1,
  },
  detailedContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  detailedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailedLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailedValue: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: '#007bff',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007bff',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#007bff',
    fontSize: 12,
    fontWeight: '600',
  },
});
