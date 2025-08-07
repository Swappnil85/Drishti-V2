import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { database } from '../../database';
import { syncManager } from './SyncManager';
import { ErrorHandlingService } from '../ErrorHandlingService';
import { backgroundSyncPreparationService } from './BackgroundSyncPreparationService';
import { offlineHelpService } from '../help/OfflineHelpService';
import { syncNotificationService } from './SyncNotificationService';
import { developerConflictResolutionService } from './DeveloperConflictResolutionService';

// Offline operation types
export interface OfflineOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  recordId: string;
  data: any;
  timestamp: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
}

// Offline status interface
export interface OfflineStatus {
  isOnline: boolean;
  hasOfflineCapability: boolean;
  pendingOperations: number;
  lastOfflineSync: number | null;
  offlineDataSize: number;
  offlineFeatures: {
    accountManagement: boolean;
    goalTracking: boolean;
    calculations: boolean;
    dataVisualization: boolean;
  };
}

// Offline analytics interface
export interface OfflineAnalytics {
  totalOfflineTime: number;
  operationsPerformed: number;
  dataCreated: number;
  dataModified: number;
  calculationsRun: number;
  lastAnalyticsReset: number;
}

/**
 * OfflineService provides comprehensive offline functionality
 * Manages offline operations, queue management, and offline analytics
 */
export class OfflineService {
  private static instance: OfflineService;
  private offlineQueue: OfflineOperation[] = [];
  private isOnline: boolean = true;
  private offlineStartTime: number | null = null;
  private offlineAnalytics: OfflineAnalytics = {
    totalOfflineTime: 0,
    operationsPerformed: 0,
    dataCreated: 0,
    dataModified: 0,
    calculationsRun: 0,
    lastAnalyticsReset: Date.now(),
  };
  private errorHandler: ErrorHandlingService;
  private offlineListeners: ((status: OfflineStatus) => void)[] = [];

  private constructor() {
    this.errorHandler = ErrorHandlingService.getInstance();
    this.initializeOfflineService();
  }

  public static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  /**
   * Initialize offline service
   */
  private async initializeOfflineService(): Promise<void> {
    try {
      // Load offline queue from storage
      await this.loadOfflineQueue();

      // Load offline analytics
      await this.loadOfflineAnalytics();

      // Setup network listener
      this.setupNetworkListener();

      // Start offline queue processor
      this.startQueueProcessor();

      // Initialize background sync preparation service
      await backgroundSyncPreparationService.initialize();

      // Initialize offline help service
      await offlineHelpService.initialize();

      // Initialize sync notification service
      await syncNotificationService.initialize();

      // Initialize developer conflict resolution service
      await developerConflictResolutionService.initialize();

      console.log(
        'OfflineService initialized successfully with background preparation, help, notifications, and developer conflict resolution'
      );
    } catch (error) {
      console.error('Failed to initialize OfflineService:', error);
      this.errorHandler.handleError(error as Error, {
        context: 'OfflineService.initializeOfflineService',
        severity: 'high',
      });
    }
  }

  /**
   * Setup network connectivity listener
   */
  private setupNetworkListener(): void {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected || false;

      if (wasOnline && !this.isOnline) {
        // Going offline
        this.handleGoingOffline();
      } else if (!wasOnline && this.isOnline) {
        // Coming back online
        this.handleComingOnline();
      }

      this.notifyOfflineListeners();
    });
  }

  /**
   * Handle going offline
   */
  private handleGoingOffline(): void {
    this.offlineStartTime = Date.now();
    console.log('Device went offline, enabling offline mode');

    // Update error handler
    this.errorHandler.setOnlineStatus(false);

    // Notify listeners
    this.notifyOfflineListeners();
  }

  /**
   * Handle coming back online
   */
  private async handleComingOnline(): Promise<void> {
    console.log('Device came back online, processing offline queue');

    // Update offline analytics
    if (this.offlineStartTime) {
      const offlineTime = Date.now() - this.offlineStartTime;
      this.offlineAnalytics.totalOfflineTime += offlineTime;
      this.offlineStartTime = null;
      await this.saveOfflineAnalytics();
    }

    // Update error handler
    this.errorHandler.setOnlineStatus(true);

    // Process offline queue
    await this.processOfflineQueue();

    // Trigger sync
    try {
      await syncManager.performSync();
    } catch (error) {
      console.error('Failed to sync after coming online:', error);
    }

    // Notify listeners
    this.notifyOfflineListeners();
  }

  /**
   * Add offline listener
   */
  public addOfflineListener(
    listener: (status: OfflineStatus) => void
  ): () => void {
    this.offlineListeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.offlineListeners.indexOf(listener);
      if (index > -1) {
        this.offlineListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify offline listeners
   */
  private async notifyOfflineListeners(): Promise<void> {
    const status = await this.getOfflineStatus();
    this.offlineListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Offline listener error:', error);
      }
    });
  }

  /**
   * Get current offline status
   */
  public async getOfflineStatus(): Promise<OfflineStatus> {
    const netInfo = await NetInfo.fetch();
    const offlineDataSize = await this.calculateOfflineDataSize();

    return {
      isOnline: netInfo.isConnected || false,
      hasOfflineCapability: true,
      pendingOperations: this.offlineQueue.filter(op => op.status === 'pending')
        .length,
      lastOfflineSync: await this.getLastOfflineSync(),
      offlineDataSize,
      offlineFeatures: {
        accountManagement: true,
        goalTracking: true,
        calculations: true,
        dataVisualization: true,
      },
    };
  }

  /**
   * Queue offline operation
   */
  public async queueOfflineOperation(
    type: 'create' | 'update' | 'delete',
    table: string,
    recordId: string,
    data: any,
    priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'
  ): Promise<string> {
    const operation: OfflineOperation = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      table,
      recordId,
      data,
      timestamp: Date.now(),
      priority,
      retryCount: 0,
      maxRetries: 3,
      status: 'pending',
    };

    this.offlineQueue.push(operation);

    // Sort queue by priority
    this.sortOfflineQueue();

    // Save queue to storage
    await this.saveOfflineQueue();

    // Update analytics
    this.offlineAnalytics.operationsPerformed++;
    if (type === 'create') {
      this.offlineAnalytics.dataCreated++;
    } else if (type === 'update') {
      this.offlineAnalytics.dataModified++;
    }

    // Notify listeners
    this.notifyOfflineListeners();

    return operation.id;
  }

  /**
   * Record offline calculation
   */
  public async recordOfflineCalculation(
    calculationType: string,
    params: any
  ): Promise<void> {
    this.offlineAnalytics.calculationsRun++;
    await this.saveOfflineAnalytics();

    // Queue for sync when online
    if (!this.isOnline) {
      await this.queueOfflineOperation(
        'create',
        'offline_calculations',
        `calc_${Date.now()}`,
        {
          type: calculationType,
          params,
          timestamp: Date.now(),
        },
        'low'
      );
    }
  }

  /**
   * Get offline analytics
   */
  public getOfflineAnalytics(): OfflineAnalytics {
    return { ...this.offlineAnalytics };
  }

  /**
   * Reset offline analytics
   */
  public async resetOfflineAnalytics(): Promise<void> {
    this.offlineAnalytics = {
      totalOfflineTime: 0,
      operationsPerformed: 0,
      dataCreated: 0,
      dataModified: 0,
      calculationsRun: 0,
      lastAnalyticsReset: Date.now(),
    };

    await this.saveOfflineAnalytics();
  }

  /**
   * Load offline queue from storage
   */
  private async loadOfflineQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('offline_queue');
      if (stored) {
        this.offlineQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.offlineQueue = [];
    }
  }

  /**
   * Save offline queue to storage
   */
  private async saveOfflineQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        'offline_queue',
        JSON.stringify(this.offlineQueue)
      );
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Load offline analytics from storage
   */
  private async loadOfflineAnalytics(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('offline_analytics');
      if (stored) {
        this.offlineAnalytics = {
          ...this.offlineAnalytics,
          ...JSON.parse(stored),
        };
      }
    } catch (error) {
      console.error('Failed to load offline analytics:', error);
    }
  }

  /**
   * Save offline analytics to storage
   */
  private async saveOfflineAnalytics(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        'offline_analytics',
        JSON.stringify(this.offlineAnalytics)
      );
    } catch (error) {
      console.error('Failed to save offline analytics:', error);
    }
  }

  /**
   * Sort offline queue by priority and timestamp
   */
  private sortOfflineQueue(): void {
    const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
    this.offlineQueue.sort((a, b) => {
      const priorityDiff =
        priorityOrder[a.priority] - priorityOrder[b.priority];
      return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
    });
  }

  /**
   * Start offline queue processor
   */
  private startQueueProcessor(): void {
    // Process queue every 30 seconds when online
    setInterval(async () => {
      if (this.isOnline && this.offlineQueue.length > 0) {
        await this.processOfflineQueue();
      }
    }, 30000);
  }

  /**
   * Process offline queue
   */
  private async processOfflineQueue(): Promise<void> {
    if (!this.isOnline || this.offlineQueue.length === 0) {
      return;
    }

    const pendingOperations = this.offlineQueue.filter(
      op => op.status === 'pending'
    );

    for (const operation of pendingOperations) {
      try {
        operation.status = 'processing';
        await this.processOfflineOperation(operation);
        operation.status = 'completed';
      } catch (error) {
        operation.status = 'failed';
        operation.retryCount++;
        operation.errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        if (operation.retryCount >= operation.maxRetries) {
          console.error(
            `Failed to process offline operation ${operation.id} after ${operation.maxRetries} retries:`,
            error
          );
        }
      }
    }

    // Remove completed operations
    this.offlineQueue = this.offlineQueue.filter(
      op => op.status !== 'completed'
    );

    // Save updated queue
    await this.saveOfflineQueue();

    // Notify listeners
    this.notifyOfflineListeners();
  }

  /**
   * Process individual offline operation
   */
  private async processOfflineOperation(
    operation: OfflineOperation
  ): Promise<void> {
    // Queue operation for sync
    await syncManager.queueChange(
      operation.table,
      operation.type,
      operation.data
    );
  }

  /**
   * Calculate offline data size
   */
  private async calculateOfflineDataSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const offlineKeys = keys.filter(
        key =>
          key.startsWith('offline_') ||
          key.startsWith('sync_') ||
          key.startsWith('calculation_cache_')
      );

      let totalSize = 0;
      for (const key of offlineKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }

      return totalSize;
    } catch (error) {
      console.error('Failed to calculate offline data size:', error);
      return 0;
    }
  }

  /**
   * Get last offline sync timestamp
   */
  private async getLastOfflineSync(): Promise<number | null> {
    try {
      const timestamp = await AsyncStorage.getItem('last_offline_sync');
      return timestamp ? parseInt(timestamp, 10) : null;
    } catch (error) {
      console.error('Failed to get last offline sync:', error);
      return null;
    }
  }

  /**
   * Set last offline sync timestamp
   */
  public async setLastOfflineSync(timestamp: number): Promise<void> {
    try {
      await AsyncStorage.setItem('last_offline_sync', timestamp.toString());
    } catch (error) {
      console.error('Failed to set last offline sync:', error);
    }
  }

  /**
   * Clear offline data
   */
  public async clearOfflineData(): Promise<void> {
    try {
      this.offlineQueue = [];
      await AsyncStorage.multiRemove([
        'offline_queue',
        'offline_analytics',
        'last_offline_sync',
      ]);

      // Reset analytics
      await this.resetOfflineAnalytics();

      // Notify listeners
      this.notifyOfflineListeners();
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  }

  /**
   * Get offline queue status
   */
  public getOfflineQueueStatus(): {
    total: number;
    pending: number;
    processing: number;
    failed: number;
    completed: number;
  } {
    return {
      total: this.offlineQueue.length,
      pending: this.offlineQueue.filter(op => op.status === 'pending').length,
      processing: this.offlineQueue.filter(op => op.status === 'processing')
        .length,
      failed: this.offlineQueue.filter(op => op.status === 'failed').length,
      completed: this.offlineQueue.filter(op => op.status === 'completed')
        .length,
    };
  }

  /**
   * Retry failed operations
   */
  public async retryFailedOperations(): Promise<void> {
    const failedOperations = this.offlineQueue.filter(
      op => op.status === 'failed'
    );

    for (const operation of failedOperations) {
      if (operation.retryCount < operation.maxRetries) {
        operation.status = 'pending';
        operation.retryCount = 0;
        operation.errorMessage = undefined;
      }
    }

    await this.saveOfflineQueue();
    this.notifyOfflineListeners();
  }
}

// Export singleton instance
export const offlineService = OfflineService.getInstance();
