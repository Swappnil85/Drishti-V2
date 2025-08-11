import { useState, useEffect, useCallback } from 'react';
import { offlineService, OfflineStatus, OfflineAnalytics } from '../services/sync/OfflineService';

/**
 * React hook for managing offline functionality
 * Provides offline status, analytics, and operation management
 */
export function useOffline() {
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
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeOffline = async () => {
      try {
        // Load initial status and analytics
        const [status, analytics] = await Promise.all([
          offlineService.getOfflineStatus(),
          Promise.resolve(offlineService.getOfflineAnalytics()),
        ]);

        if (mounted) {
          setOfflineStatus(status);
          setOfflineAnalytics(analytics);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Failed to initialize offline hook:', error);
        if (mounted) {
          setIsInitialized(true);
        }
      }
    };

    initializeOffline();

    // Subscribe to offline status updates
    const unsubscribe = offlineService.addOfflineListener((status) => {
      if (mounted) {
        setOfflineStatus(status);
      }
    });

    // Update analytics periodically
    const analyticsInterval = setInterval(() => {
      if (mounted) {
        const analytics = offlineService.getOfflineAnalytics();
        setOfflineAnalytics(analytics);
      }
    }, 30000);

    return () => {
      mounted = false;
      unsubscribe();
      clearInterval(analyticsInterval);
    };
  }, []);

  // Queue offline operation
  const queueOfflineOperation = useCallback(
    async (
      type: 'create' | 'update' | 'delete',
      table: string,
      recordId: string,
      data: any,
      priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'
    ) => {
      try {
        return await offlineService.queueOfflineOperation(type, table, recordId, data, priority);
      } catch (error) {
        console.error('Failed to queue offline operation:', error);
        throw error;
      }
    },
    []
  );

  // Record offline calculation
  const recordOfflineCalculation = useCallback(async (calculationType: string, params: any) => {
    try {
      await offlineService.recordOfflineCalculation(calculationType, params);
    } catch (error) {
      console.error('Failed to record offline calculation:', error);
    }
  }, []);

  // Retry failed operations
  const retryFailedOperations = useCallback(async () => {
    try {
      await offlineService.retryFailedOperations();
    } catch (error) {
      console.error('Failed to retry failed operations:', error);
      throw error;
    }
  }, []);

  // Clear offline data
  const clearOfflineData = useCallback(async () => {
    try {
      await offlineService.clearOfflineData();
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      throw error;
    }
  }, []);

  // Reset offline analytics
  const resetOfflineAnalytics = useCallback(async () => {
    try {
      await offlineService.resetOfflineAnalytics();
      const analytics = offlineService.getOfflineAnalytics();
      setOfflineAnalytics(analytics);
    } catch (error) {
      console.error('Failed to reset offline analytics:', error);
      throw error;
    }
  }, []);

  // Get offline queue status
  const getOfflineQueueStatus = useCallback(() => {
    return offlineService.getOfflineQueueStatus();
  }, []);

  // Check if feature is available offline
  const isFeatureAvailableOffline = useCallback(
    (feature: keyof OfflineStatus['offlineFeatures']) => {
      return offlineStatus.offlineFeatures[feature];
    },
    [offlineStatus.offlineFeatures]
  );

  // Check if app is in offline mode
  const isOfflineMode = useCallback(() => {
    return !offlineStatus.isOnline;
  }, [offlineStatus.isOnline]);

  // Check if there are pending operations
  const hasPendingOperations = useCallback(() => {
    return offlineStatus.pendingOperations > 0;
  }, [offlineStatus.pendingOperations]);

  // Get offline status color for UI
  const getOfflineStatusColor = useCallback(() => {
    if (!offlineStatus.isOnline) {
      return '#ff9500'; // Orange for offline
    } else if (offlineStatus.pendingOperations > 0) {
      return '#007bff'; // Blue for pending operations
    } else {
      return '#28a745'; // Green for online and synced
    }
  }, [offlineStatus]);

  // Get offline status text for UI
  const getOfflineStatusText = useCallback(() => {
    if (!offlineStatus.isOnline) {
      return 'Offline Mode';
    } else if (offlineStatus.pendingOperations > 0) {
      return `${offlineStatus.pendingOperations} Pending`;
    } else {
      return 'Online';
    }
  }, [offlineStatus]);

  // Format data size for display
  const formatDataSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Format time duration for display
  const formatOfflineTime = useCallback((milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }, []);

  // Get last offline sync formatted
  const getLastOfflineSyncFormatted = useCallback(() => {
    if (!offlineStatus.lastOfflineSync) {
      return 'Never';
    }

    const now = Date.now();
    const diff = now - offlineStatus.lastOfflineSync;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days === 1 ? '' : 's'} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    } else {
      return 'Just now';
    }
  }, [offlineStatus.lastOfflineSync]);

  return {
    // Status
    offlineStatus,
    offlineAnalytics,
    isInitialized,

    // Actions
    queueOfflineOperation,
    recordOfflineCalculation,
    retryFailedOperations,
    clearOfflineData,
    resetOfflineAnalytics,

    // Computed values
    getOfflineQueueStatus,
    isFeatureAvailableOffline,
    isOfflineMode: isOfflineMode(),
    hasPendingOperations: hasPendingOperations(),
    offlineStatusColor: getOfflineStatusColor(),
    offlineStatusText: getOfflineStatusText(),
    formattedDataSize: formatDataSize(offlineStatus.offlineDataSize),
    formattedOfflineTime: formatOfflineTime(offlineAnalytics.totalOfflineTime),
    lastOfflineSyncFormatted: getLastOfflineSyncFormatted(),

    // Utility functions
    formatDataSize,
    formatOfflineTime,
  };
}

/**
 * Hook for auto-managing offline operations for a specific feature
 */
export function useOfflineFeature(featureName: keyof OfflineStatus['offlineFeatures']) {
  const { offlineStatus, queueOfflineOperation, isFeatureAvailableOffline } = useOffline();

  const isAvailable = isFeatureAvailableOffline(featureName);
  const isOffline = !offlineStatus.isOnline;

  // Queue operation if offline
  const performOperation = useCallback(
    async (
      type: 'create' | 'update' | 'delete',
      table: string,
      recordId: string,
      data: any,
      priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'
    ) => {
      if (isOffline && isAvailable) {
        return await queueOfflineOperation(type, table, recordId, data, priority);
      }
      // If online, operation should be handled by sync manager
      return null;
    },
    [isOffline, isAvailable, queueOfflineOperation]
  );

  return {
    isAvailable,
    isOffline,
    performOperation,
  };
}

/**
 * Hook for offline calculations
 */
export function useOfflineCalculations() {
  const { recordOfflineCalculation, offlineAnalytics, isOfflineMode } = useOffline();

  const performCalculation = useCallback(
    async (calculationType: string, params: any, calculationFn: () => Promise<any>) => {
      try {
        // Perform the calculation
        const result = await calculationFn();

        // Record offline calculation if offline
        if (isOfflineMode) {
          await recordOfflineCalculation(calculationType, params);
        }

        return result;
      } catch (error) {
        console.error(`Failed to perform ${calculationType} calculation:`, error);
        throw error;
      }
    },
    [isOfflineMode, recordOfflineCalculation]
  );

  return {
    performCalculation,
    calculationsRun: offlineAnalytics.calculationsRun,
    isOfflineMode,
  };
}
