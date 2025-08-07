import { useState, useEffect, useCallback } from 'react';
import { enhancedSyncManager, NetworkQuality, DeltaSyncResult, SyncSchedule, BandwidthAwareSettings } from '../services/sync/EnhancedSyncManager';
import { plaidIntegrationService, PlaidConnection, AutoBalanceUpdateSettings } from '../services/financial/PlaidIntegrationService';

/**
 * React hook for enhanced sync functionality
 * Provides network quality monitoring, adaptive sync, and Plaid integration
 */
export function useEnhancedSync() {
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality | null>(null);
  const [lastSyncResult, setLastSyncResult] = useState<DeltaSyncResult | null>(null);
  const [syncSchedules, setSyncSchedules] = useState<SyncSchedule[]>([]);
  const [bandwidthSettings, setBandwidthSettings] = useState<BandwidthAwareSettings | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeSync = async () => {
      try {
        // Get initial network quality
        const quality = enhancedSyncManager.getNetworkQuality();
        if (mounted) {
          setNetworkQuality(quality);
        }

        // Get sync schedules
        const schedules = enhancedSyncManager.getSyncSchedules();
        if (mounted) {
          setSyncSchedules(schedules);
        }

        // Get bandwidth settings
        const settings = enhancedSyncManager.getBandwidthSettings();
        if (mounted) {
          setBandwidthSettings(settings);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Failed to initialize enhanced sync hook:', error);
        if (mounted) {
          setIsInitialized(true);
        }
      }
    };

    initializeSync();

    // Subscribe to network quality updates
    const unsubscribeNetwork = enhancedSyncManager.addNetworkListener((quality) => {
      if (mounted) {
        setNetworkQuality(quality);
      }
    });

    // Subscribe to sync result updates
    const unsubscribeSync = enhancedSyncManager.addSyncListener((result) => {
      if (mounted) {
        setLastSyncResult(result);
        setIsSyncing(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribeNetwork();
      unsubscribeSync();
    };
  }, []);

  // Perform adaptive sync
  const performAdaptiveSync = useCallback(async () => {
    try {
      setIsSyncing(true);
      const result = await enhancedSyncManager.performAdaptiveSync();
      setLastSyncResult(result);
      return result;
    } catch (error) {
      console.error('Adaptive sync failed:', error);
      setIsSyncing(false);
      throw error;
    }
  }, []);

  // Force immediate sync
  const forceSync = useCallback(async () => {
    try {
      setIsSyncing(true);
      const result = await enhancedSyncManager.forceSync();
      setLastSyncResult(result);
      return result;
    } catch (error) {
      console.error('Force sync failed:', error);
      setIsSyncing(false);
      throw error;
    }
  }, []);

  // Update bandwidth settings
  const updateBandwidthSettings = useCallback(async (settings: Partial<BandwidthAwareSettings>) => {
    try {
      await enhancedSyncManager.updateBandwidthSettings(settings);
      const updatedSettings = enhancedSyncManager.getBandwidthSettings();
      setBandwidthSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to update bandwidth settings:', error);
      throw error;
    }
  }, []);

  // Add sync schedule
  const addSyncSchedule = useCallback(async (schedule: Omit<SyncSchedule, 'id'>) => {
    try {
      const id = await enhancedSyncManager.addSyncSchedule(schedule);
      const updatedSchedules = enhancedSyncManager.getSyncSchedules();
      setSyncSchedules(updatedSchedules);
      return id;
    } catch (error) {
      console.error('Failed to add sync schedule:', error);
      throw error;
    }
  }, []);

  // Update sync schedule
  const updateSyncSchedule = useCallback(async (id: string, updates: Partial<SyncSchedule>) => {
    try {
      const success = await enhancedSyncManager.updateSyncSchedule(id, updates);
      if (success) {
        const updatedSchedules = enhancedSyncManager.getSyncSchedules();
        setSyncSchedules(updatedSchedules);
      }
      return success;
    } catch (error) {
      console.error('Failed to update sync schedule:', error);
      throw error;
    }
  }, []);

  // Remove sync schedule
  const removeSyncSchedule = useCallback(async (id: string) => {
    try {
      const success = await enhancedSyncManager.removeSyncSchedule(id);
      if (success) {
        const updatedSchedules = enhancedSyncManager.getSyncSchedules();
        setSyncSchedules(updatedSchedules);
      }
      return success;
    } catch (error) {
      console.error('Failed to remove sync schedule:', error);
      throw error;
    }
  }, []);

  // Get sync statistics
  const getSyncStatistics = useCallback(async () => {
    try {
      return await enhancedSyncManager.getSyncStatistics();
    } catch (error) {
      console.error('Failed to get sync statistics:', error);
      throw error;
    }
  }, []);

  // Get network quality description
  const getNetworkQualityDescription = useCallback(() => {
    if (!networkQuality) return 'Unknown';
    
    const descriptions = {
      poor: 'Poor connection - Limited sync',
      fair: 'Fair connection - Reduced sync frequency',
      good: 'Good connection - Normal sync',
      excellent: 'Excellent connection - Full sync',
    };
    
    return descriptions[networkQuality.quality];
  }, [networkQuality]);

  // Get adaptive recommendations
  const getAdaptiveRecommendations = useCallback(() => {
    return lastSyncResult?.adaptiveRecommendations || null;
  }, [lastSyncResult]);

  // Check if sync should be performed
  const shouldSync = useCallback(() => {
    if (!networkQuality) return false;
    return networkQuality.quality !== 'poor';
  }, [networkQuality]);

  return {
    // State
    networkQuality,
    lastSyncResult,
    syncSchedules,
    bandwidthSettings,
    isInitialized,
    isSyncing,

    // Actions
    performAdaptiveSync,
    forceSync,
    updateBandwidthSettings,
    addSyncSchedule,
    updateSyncSchedule,
    removeSyncSchedule,
    getSyncStatistics,

    // Computed values
    networkQualityDescription: getNetworkQualityDescription(),
    adaptiveRecommendations: getAdaptiveRecommendations(),
    shouldSync: shouldSync(),
    isOnline: networkQuality?.quality !== undefined,
    syncSuccess: lastSyncResult?.success || false,
    pendingChanges: lastSyncResult?.changesApplied || 0,
    conflictsDetected: lastSyncResult?.conflictsDetected || 0,
    bytesTransferred: lastSyncResult?.bytesTransferred || 0,
    syncDuration: lastSyncResult?.syncDuration || 0,
  };
}

/**
 * React hook for Plaid integration and automatic balance updates
 */
export function usePlaidIntegration() {
  const [connections, setConnections] = useState<PlaidConnection[]>([]);
  const [autoUpdateSettings, setAutoUpdateSettings] = useState<AutoBalanceUpdateSettings | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializePlaid = async () => {
      try {
        // Initialize Plaid service
        await plaidIntegrationService.initialize();

        if (mounted) {
          // Get connections
          const plaidConnections = plaidIntegrationService.getConnections();
          setConnections(plaidConnections);

          // Get auto-update settings
          const settings = plaidIntegrationService.getAutoUpdateSettings();
          setAutoUpdateSettings(settings);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Failed to initialize Plaid integration:', error);
        if (mounted) {
          setIsInitialized(true);
        }
      }
    };

    initializePlaid();

    return () => {
      mounted = false;
    };
  }, []);

  // Link new account
  const linkAccount = useCallback(async (linkResult: any) => {
    try {
      const connectionId = await plaidIntegrationService.linkAccount(linkResult);
      const updatedConnections = plaidIntegrationService.getConnections();
      setConnections(updatedConnections);
      return connectionId;
    } catch (error) {
      console.error('Failed to link Plaid account:', error);
      throw error;
    }
  }, []);

  // Sync all balances
  const syncAllBalances = useCallback(async () => {
    try {
      setIsSyncing(true);
      const result = await plaidIntegrationService.syncAllBalances();
      setIsSyncing(false);
      return result;
    } catch (error) {
      console.error('Failed to sync balances:', error);
      setIsSyncing(false);
      throw error;
    }
  }, []);

  // Update auto-update settings
  const updateAutoUpdateSettings = useCallback(async (settings: Partial<AutoBalanceUpdateSettings>) => {
    try {
      await plaidIntegrationService.updateAutoUpdateSettings(settings);
      const updatedSettings = plaidIntegrationService.getAutoUpdateSettings();
      setAutoUpdateSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to update auto-update settings:', error);
      throw error;
    }
  }, []);

  // Remove connection
  const removeConnection = useCallback(async (connectionId: string) => {
    try {
      const success = await plaidIntegrationService.removeConnection(connectionId);
      if (success) {
        const updatedConnections = plaidIntegrationService.getConnections();
        setConnections(updatedConnections);
      }
      return success;
    } catch (error) {
      console.error('Failed to remove connection:', error);
      throw error;
    }
  }, []);

  // Get sync statistics
  const getSyncStatistics = useCallback(() => {
    return plaidIntegrationService.getSyncStatistics();
  }, []);

  return {
    // State
    connections,
    autoUpdateSettings,
    isInitialized,
    isSyncing,

    // Actions
    linkAccount,
    syncAllBalances,
    updateAutoUpdateSettings,
    removeConnection,
    getSyncStatistics,

    // Computed values
    totalConnections: connections.length,
    activeConnections: connections.filter(c => c.isActive).length,
    totalAccounts: connections.reduce((sum, c) => sum + c.accounts.length, 0),
    hasErrors: connections.some(c => c.errorCount > 0),
    autoSyncEnabled: autoUpdateSettings?.enabled || false,
  };
}
