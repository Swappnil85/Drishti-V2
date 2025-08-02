import { useState, useEffect, useCallback } from 'react';
import { syncManager, SyncStatus } from '../services/sync/SyncManager';

/**
 * React hook for managing sync state and operations
 * Provides real-time sync status and sync control functions
 */
export function useSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: false,
    lastSync: null,
    syncInProgress: false,
    pendingOperations: 0,
    lastError: null,
    conflictsCount: 0,
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize sync status
  useEffect(() => {
    const initializeSync = async () => {
      try {
        // Load any pending sync operations
        await syncManager.loadSyncQueue();
        
        // Get initial sync status
        const status = await syncManager.getSyncStatus();
        setSyncStatus(status);
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize sync:', error);
        setIsInitialized(true);
      }
    };

    initializeSync();
  }, []);

  // Subscribe to sync status updates
  useEffect(() => {
    if (!isInitialized) return;

    const unsubscribe = syncManager.addSyncListener((status: SyncStatus) => {
      setSyncStatus(status);
    });

    return unsubscribe;
  }, [isInitialized]);

  // Perform manual sync
  const performSync = useCallback(async (force: boolean = false) => {
    try {
      await syncManager.performSync(force);
    } catch (error) {
      console.error('Manual sync failed:', error);
      throw error;
    }
  }, []);

  // Force full sync
  const forceFullSync = useCallback(async () => {
    try {
      await syncManager.forceFullSync();
    } catch (error) {
      console.error('Force full sync failed:', error);
      throw error;
    }
  }, []);

  // Queue a change for sync
  const queueChange = useCallback(async (
    table: string,
    operation: 'create' | 'update' | 'delete',
    data: any
  ) => {
    try {
      await syncManager.queueChange(table, operation, data);
    } catch (error) {
      console.error('Failed to queue change:', error);
      throw error;
    }
  }, []);

  // Clear sync data (for logout)
  const clearSyncData = useCallback(async () => {
    try {
      await syncManager.clearSyncData();
      
      // Reset local state
      setSyncStatus({
        isOnline: false,
        lastSync: null,
        syncInProgress: false,
        pendingOperations: 0,
        lastError: null,
        conflictsCount: 0,
      });
    } catch (error) {
      console.error('Failed to clear sync data:', error);
      throw error;
    }
  }, []);

  // Get formatted last sync time
  const getLastSyncFormatted = useCallback(() => {
    if (!syncStatus.lastSync) {
      return 'Never';
    }

    const lastSyncDate = new Date(syncStatus.lastSync);
    const now = new Date();
    const diffMs = now.getTime() - lastSyncDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else {
      return lastSyncDate.toLocaleDateString();
    }
  }, [syncStatus.lastSync]);

  // Get sync status color for UI
  const getSyncStatusColor = useCallback(() => {
    if (!syncStatus.isOnline) {
      return '#ff9500'; // Orange for offline
    } else if (syncStatus.syncInProgress) {
      return '#007bff'; // Blue for syncing
    } else if (syncStatus.lastError) {
      return '#dc3545'; // Red for error
    } else if (syncStatus.conflictsCount > 0) {
      return '#ffc107'; // Yellow for conflicts
    } else if (syncStatus.pendingOperations > 0) {
      return '#17a2b8'; // Teal for pending
    } else {
      return '#28a745'; // Green for synced
    }
  }, [syncStatus]);

  // Get sync status text for UI
  const getSyncStatusText = useCallback(() => {
    if (!syncStatus.isOnline) {
      return 'Offline';
    } else if (syncStatus.syncInProgress) {
      return 'Syncing...';
    } else if (syncStatus.lastError) {
      return 'Sync Error';
    } else if (syncStatus.conflictsCount > 0) {
      return `${syncStatus.conflictsCount} Conflict${syncStatus.conflictsCount === 1 ? '' : 's'}`;
    } else if (syncStatus.pendingOperations > 0) {
      return `${syncStatus.pendingOperations} Pending`;
    } else {
      return 'Synced';
    }
  }, [syncStatus]);

  // Check if sync is needed
  const isSyncNeeded = useCallback(() => {
    return syncStatus.pendingOperations > 0 || 
           syncStatus.conflictsCount > 0 || 
           syncStatus.lastError !== null;
  }, [syncStatus]);

  // Check if sync is available
  const isSyncAvailable = useCallback(() => {
    return syncStatus.isOnline && !syncStatus.syncInProgress;
  }, [syncStatus]);

  return {
    // Status
    syncStatus,
    isInitialized,
    
    // Actions
    performSync,
    forceFullSync,
    queueChange,
    clearSyncData,
    
    // Computed values
    lastSyncFormatted: getLastSyncFormatted(),
    syncStatusColor: getSyncStatusColor(),
    syncStatusText: getSyncStatusText(),
    isSyncNeeded: isSyncNeeded(),
    isSyncAvailable: isSyncAvailable(),
  };
}

/**
 * Hook for auto-syncing when app becomes active
 */
export function useAutoSync() {
  const { performSync, syncStatus } = useSync();

  useEffect(() => {
    // Auto-sync when app becomes active and online
    if (syncStatus.isOnline && !syncStatus.syncInProgress) {
      performSync().catch(error => {
        console.error('Auto-sync failed:', error);
      });
    }
  }, [syncStatus.isOnline, performSync]);

  return { performSync, syncStatus };
}

/**
 * Hook for syncing specific model changes
 */
export function useModelSync() {
  const { queueChange } = useSync();

  const syncCreate = useCallback(async (table: string, data: any) => {
    await queueChange(table, 'create', data);
  }, [queueChange]);

  const syncUpdate = useCallback(async (table: string, data: any) => {
    await queueChange(table, 'update', data);
  }, [queueChange]);

  const syncDelete = useCallback(async (table: string, data: any) => {
    await queueChange(table, 'delete', data);
  }, [queueChange]);

  return {
    syncCreate,
    syncUpdate,
    syncDelete,
  };
}
