import { Database } from '@nozbe/watermelondb';
// import { synchronize } from '@nozbe/watermelondb/sync';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { database } from '../../database';
import { authService } from '../auth/AuthService';

// Sync operation types
export interface SyncOperation {
  id: string;
  table: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  client_timestamp: number;
  server_timestamp?: number;
}

export interface SyncRequest {
  last_sync_timestamp?: number;
  operations: SyncOperation[];
  device_id: string;
}

export interface SyncResponse {
  success: boolean;
  server_timestamp: number;
  conflicts: SyncConflict[];
  server_changes: SyncOperation[];
  applied_operations: string[];
  failed_operations: { id: string; error: string }[];
}

export interface SyncConflict {
  operation_id: string;
  table: string;
  record_id: string;
  client_data: any;
  server_data: any;
  conflict_type: 'update_conflict' | 'delete_conflict' | 'create_conflict';
  client_timestamp: number;
  server_timestamp: number;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: number | null;
  syncInProgress: boolean;
  pendingOperations: number;
  lastError: string | null;
  conflictsCount: number;
}

/**
 * SyncManager handles data synchronization between local WatermelonDB and remote API
 * Implements offline-first strategy with conflict resolution
 */
export class SyncManager {
  private static instance: SyncManager;
  private database: Database;
  private syncInProgress = false;
  private syncQueue: SyncOperation[] = [];
  private deviceId: string = '';
  private apiBaseUrl: string;
  private syncListeners: ((status: SyncStatus) => void)[] = [];

  private constructor() {
    this.database = database;
    this.apiBaseUrl =
      process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
    this.initializeDeviceId();
    this.setupNetworkListener();
  }

  public static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  /**
   * Initialize device ID for sync tracking
   */
  private async initializeDeviceId(): Promise<void> {
    try {
      let deviceId = await AsyncStorage.getItem('device_id');
      if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('device_id', deviceId);
      }
      this.deviceId = deviceId;
    } catch (error) {
      console.error('Failed to initialize device ID:', error);
      this.deviceId = `temp_${Date.now()}`;
    }
  }

  /**
   * Setup network connectivity listener
   */
  private setupNetworkListener(): void {
    NetInfo.addEventListener(state => {
      if (state.isConnected && !this.syncInProgress) {
        // Auto-sync when coming back online
        this.performSync().catch(error => {
          console.error('Auto-sync failed:', error);
        });
      }
      this.notifyListeners();
    });
  }

  /**
   * Add sync status listener
   */
  public addSyncListener(listener: (status: SyncStatus) => void): () => void {
    this.syncListeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.syncListeners.indexOf(listener);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all sync listeners
   */
  private async notifyListeners(): Promise<void> {
    const status = await this.getSyncStatus();
    this.syncListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Sync listener error:', error);
      }
    });
  }

  /**
   * Get current sync status
   */
  public async getSyncStatus(): Promise<SyncStatus> {
    const netInfo = await NetInfo.fetch();
    const lastSync = await this.getLastSyncTimestamp();
    const pendingOperations = this.syncQueue.length;
    const lastError = await AsyncStorage.getItem('last_sync_error');
    const conflictsCount = await this.getConflictsCount();

    return {
      isOnline: netInfo.isConnected || false,
      lastSync,
      syncInProgress: this.syncInProgress,
      pendingOperations,
      lastError,
      conflictsCount,
    };
  }

  /**
   * Perform full synchronization
   */
  public async performSync(force: boolean = false): Promise<void> {
    if (this.syncInProgress && !force) {
      console.log('Sync already in progress');
      return;
    }

    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      console.log('No network connection, skipping sync');
      return;
    }

    this.syncInProgress = true;
    await this.notifyListeners();

    try {
      console.log('Starting sync process...');

      // Get authentication token
      const token = await authService.getAccessToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Prepare sync request
      const lastSyncTimestamp = await this.getLastSyncTimestamp();
      const syncRequest: SyncRequest = {
        last_sync_timestamp: lastSyncTimestamp || 0,
        operations: [...this.syncQueue],
        device_id: this.deviceId,
      };

      // Send sync request to server
      const response = await fetch(`${this.apiBaseUrl}/sync/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(syncRequest),
      });

      if (!response.ok) {
        throw new Error(
          `Sync request failed: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Sync failed');
      }

      const syncResponse: SyncResponse = result.data;

      // Process sync response
      await this.processSyncResponse(syncResponse);

      // Clear successfully applied operations from queue
      this.syncQueue = this.syncQueue.filter(
        op => !syncResponse.applied_operations.includes(op.id)
      );

      // Update last sync timestamp
      await this.setLastSyncTimestamp(syncResponse.server_timestamp);

      // Clear last error
      await AsyncStorage.removeItem('last_sync_error');

      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);

      // Store last error
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown sync error';
      await AsyncStorage.setItem('last_sync_error', errorMessage);

      throw error;
    } finally {
      this.syncInProgress = false;
      await this.notifyListeners();
    }
  }

  /**
   * Process sync response from server
   */
  private async processSyncResponse(syncResponse: SyncResponse): Promise<void> {
    // Handle conflicts
    if (syncResponse.conflicts.length > 0) {
      await this.handleConflicts(syncResponse.conflicts);
    }

    // Apply server changes
    if (syncResponse.server_changes.length > 0) {
      await this.applyServerChanges(syncResponse.server_changes);
    }

    // Log failed operations
    if (syncResponse.failed_operations.length > 0) {
      console.warn('Some operations failed:', syncResponse.failed_operations);
    }
  }

  /**
   * Handle sync conflicts
   */
  private async handleConflicts(conflicts: SyncConflict[]): Promise<void> {
    // Store conflicts for user resolution
    const existingConflicts = await this.getStoredConflicts();
    const allConflicts = [...existingConflicts, ...conflicts];

    await AsyncStorage.setItem('sync_conflicts', JSON.stringify(allConflicts));

    console.log(`${conflicts.length} sync conflicts detected`);

    // For now, we'll use a simple "server wins" strategy
    // In a real app, you'd present these to the user for resolution
    for (const conflict of conflicts) {
      await this.resolveConflictServerWins(conflict);
    }
  }

  /**
   * Apply server changes to local database
   */
  private async applyServerChanges(
    serverChanges: SyncOperation[]
  ): Promise<void> {
    for (const change of serverChanges) {
      try {
        await this.applyServerChange(change);
      } catch (error) {
        console.error(
          `Failed to apply server change for ${change.table}:${change.data.id}`,
          error
        );
      }
    }
  }

  /**
   * Apply a single server change
   */
  private async applyServerChange(change: SyncOperation): Promise<void> {
    const { table, operation, data } = change;

    await this.database.write(async () => {
      const collection = this.database.collections.get(table);

      switch (operation) {
        case 'create':
          await collection.create(record => {
            Object.assign(record._raw, data);
          });
          break;

        case 'update':
          try {
            const record = await collection.find(data.id);
            await record.update(record => {
              Object.assign(record._raw, data);
            });
          } catch (error) {
            // Record not found, create it
            await collection.create(record => {
              Object.assign(record._raw, data);
            });
          }
          break;

        case 'delete':
          try {
            const record = await collection.find(data.id);
            await record.markAsDeleted();
          } catch (error) {
            // Record already deleted or doesn't exist
            console.log(`Record ${data.id} already deleted or doesn't exist`);
          }
          break;
      }
    });
  }

  /**
   * Queue local change for sync
   */
  public async queueChange(
    table: string,
    operation: 'create' | 'update' | 'delete',
    data: any
  ): Promise<void> {
    const syncOperation: SyncOperation = {
      id: `${table}_${operation}_${data.id}_${Date.now()}`,
      table,
      operation,
      data,
      client_timestamp: Date.now(),
    };

    this.syncQueue.push(syncOperation);

    // Persist queue to storage
    await this.persistSyncQueue();

    // Trigger sync if online
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected && !this.syncInProgress) {
      this.performSync().catch(error => {
        console.error('Auto-sync after queue change failed:', error);
      });
    }
  }

  /**
   * Get last sync timestamp
   */
  private async getLastSyncTimestamp(): Promise<number | null> {
    try {
      const timestamp = await AsyncStorage.getItem('last_sync_timestamp');
      return timestamp ? parseInt(timestamp, 10) : null;
    } catch (error) {
      console.error('Failed to get last sync timestamp:', error);
      return null;
    }
  }

  /**
   * Set last sync timestamp
   */
  private async setLastSyncTimestamp(timestamp: number): Promise<void> {
    try {
      await AsyncStorage.setItem('last_sync_timestamp', timestamp.toString());
    } catch (error) {
      console.error('Failed to set last sync timestamp:', error);
    }
  }

  /**
   * Persist sync queue to storage
   */
  private async persistSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to persist sync queue:', error);
    }
  }

  /**
   * Load sync queue from storage
   */
  public async loadSyncQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem('sync_queue');
      if (queueData) {
        this.syncQueue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
      this.syncQueue = [];
    }
  }

  /**
   * Get stored conflicts
   */
  private async getStoredConflicts(): Promise<SyncConflict[]> {
    try {
      const conflictsData = await AsyncStorage.getItem('sync_conflicts');
      return conflictsData ? JSON.parse(conflictsData) : [];
    } catch (error) {
      console.error('Failed to get stored conflicts:', error);
      return [];
    }
  }

  /**
   * Get conflicts count
   */
  private async getConflictsCount(): Promise<number> {
    const conflicts = await this.getStoredConflicts();
    return conflicts.length;
  }

  /**
   * Resolve conflict with server wins strategy
   */
  private async resolveConflictServerWins(
    conflict: SyncConflict
  ): Promise<void> {
    // Apply server data to local database
    await this.applyServerChange({
      id: `conflict_resolution_${conflict.operation_id}`,
      table: conflict.table,
      operation: 'update',
      data: conflict.server_data,
      client_timestamp: Date.now(),
      server_timestamp: conflict.server_timestamp,
    });
  }

  /**
   * Resolve conflict with user's choice
   */
  async resolveConflict(
    conflictId: string,
    resolution: 'client' | 'server' | 'merge',
    mergedData?: any
  ): Promise<void> {
    try {
      // Get stored conflicts
      const conflicts = await this.getStoredConflicts();
      const conflict = conflicts.find(c => c.operation_id === conflictId);

      if (!conflict) {
        throw new Error('Conflict not found');
      }

      // Apply resolution
      switch (resolution) {
        case 'client':
          await this.resolveConflictClientWins(conflict);
          break;
        case 'server':
          await this.resolveConflictServerWins(conflict);
          break;
        case 'merge':
          if (!mergedData) {
            throw new Error('Merged data required for merge resolution');
          }
          await this.resolveConflictMerge(conflict, mergedData);
          break;
      }

      // Remove resolved conflict from storage
      const remainingConflicts = conflicts.filter(
        c => c.operation_id !== conflictId
      );
      await AsyncStorage.setItem(
        'sync_conflicts',
        JSON.stringify(remainingConflicts)
      );

      // Send resolution to server
      await this.sendConflictResolution(conflictId, resolution, mergedData);

      console.log(
        `Conflict ${conflictId} resolved with ${resolution} strategy`
      );
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      throw error;
    }
  }

  /**
   * Resolve conflict with client wins strategy
   */
  private async resolveConflictClientWins(
    conflict: SyncConflict
  ): Promise<void> {
    // Queue the client data to be sent to server
    await this.queueChange(conflict.table, 'update', conflict.client_data);
  }

  /**
   * Resolve conflict with merge strategy
   */
  private async resolveConflictMerge(
    conflict: SyncConflict,
    mergedData: any
  ): Promise<void> {
    // Apply merged data locally
    await this.applyServerChange({
      id: `conflict_merge_${conflict.operation_id}`,
      table: conflict.table,
      operation: 'update',
      data: mergedData,
      client_timestamp: Date.now(),
      server_timestamp: Date.now(),
    });

    // Queue merged data to be sent to server
    await this.queueChange(conflict.table, 'update', mergedData);
  }

  /**
   * Send conflict resolution to server
   */
  private async sendConflictResolution(
    conflictId: string,
    resolution: 'client' | 'server' | 'merge',
    mergedData?: any
  ): Promise<void> {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        console.warn('No auth token available for conflict resolution');
        return;
      }

      const response = await fetch(`${this.apiBaseUrl}/sync/resolve-conflict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conflict_id: conflictId,
          resolution,
          merged_data: mergedData,
        }),
      });

      if (!response.ok) {
        console.warn(
          'Failed to send conflict resolution to server:',
          response.statusText
        );
      }
    } catch (error) {
      console.warn('Failed to send conflict resolution to server:', error);
    }
  }

  /**
   * Get all stored conflicts
   */
  async getConflicts(): Promise<SyncConflict[]> {
    return await this.getStoredConflicts();
  }

  /**
   * Clear all conflicts
   */
  async clearConflicts(): Promise<void> {
    await AsyncStorage.removeItem('sync_conflicts');
  }

  /**
   * Clear all sync data (for logout or reset)
   */
  public async clearSyncData(): Promise<void> {
    this.syncQueue = [];
    await AsyncStorage.multiRemove([
      'sync_queue',
      'last_sync_timestamp',
      'sync_conflicts',
      'last_sync_error',
    ]);
  }

  /**
   * Force full sync (clear last sync timestamp)
   */
  public async forceFullSync(): Promise<void> {
    await AsyncStorage.removeItem('last_sync_timestamp');
    await this.performSync(true);
  }
}

export const syncManager = SyncManager.getInstance();
