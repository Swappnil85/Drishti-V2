import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { syncManager } from './SyncManager';
import { offlineService } from './OfflineService';
import { ErrorHandlingService } from '../ErrorHandlingService';

// Enhanced sync interfaces
export interface NetworkQuality {
  connectionType: string;
  effectiveType: string;
  downlink: number; // Mbps
  rtt: number; // ms
  saveData: boolean;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  adaptiveSettings: {
    batchSize: number;
    syncInterval: number;
    compressionLevel: number;
    priorityThreshold: 'low' | 'normal' | 'high' | 'critical';
  };
}

export interface DeltaSyncResult {
  success: boolean;
  changesApplied: number;
  conflictsDetected: number;
  bytesTransferred: number;
  syncDuration: number;
  nextSyncTimestamp: number;
  adaptiveRecommendations?: {
    suggestedInterval: number;
    suggestedBatchSize: number;
    qualityOptimizations: string[];
  };
}

export interface SyncSchedule {
  id: string;
  name: string;
  enabled: boolean;
  schedule: {
    type: 'interval' | 'time' | 'event';
    value: number | string; // minutes for interval, time string for time, event name for event
    timezone?: string;
  };
  conditions: {
    networkQuality?: 'poor' | 'fair' | 'good' | 'excellent';
    batteryLevel?: number; // minimum percentage
    chargingRequired?: boolean;
    wifiOnly?: boolean;
    avoidPeakHours?: boolean;
  };
  priority: 'low' | 'normal' | 'high' | 'critical';
  lastRun?: number;
  nextRun?: number;
}

export interface BandwidthAwareSettings {
  enabled: boolean;
  thresholds: {
    poor: {
      maxBatchSize: number;
      syncInterval: number;
      compressionLevel: number;
    };
    fair: {
      maxBatchSize: number;
      syncInterval: number;
      compressionLevel: number;
    };
    good: {
      maxBatchSize: number;
      syncInterval: number;
      compressionLevel: number;
    };
    excellent: {
      maxBatchSize: number;
      syncInterval: number;
      compressionLevel: number;
    };
  };
  adaptiveCompression: boolean;
  progressiveSync: boolean;
  backgroundSyncLimits: {
    maxDuration: number; // minutes
    maxDataTransfer: number; // MB
  };
}

/**
 * EnhancedSyncManager provides intelligent sync with connection detection,
 * delta sync, bandwidth awareness, and automatic scheduling
 */
export class EnhancedSyncManager {
  private static instance: EnhancedSyncManager;
  private networkQuality: NetworkQuality | null = null;
  private syncSchedules: SyncSchedule[] = [];
  private bandwidthSettings: BandwidthAwareSettings;
  private errorHandler: ErrorHandlingService;
  private syncListeners: ((result: DeltaSyncResult) => void)[] = [];
  private networkListeners: ((quality: NetworkQuality) => void)[] = [];
  private isMonitoring = false;
  private syncTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.errorHandler = ErrorHandlingService.getInstance();
    this.initializeBandwidthSettings();
    this.initializeEnhancedSync();
  }

  public static getInstance(): EnhancedSyncManager {
    if (!EnhancedSyncManager.instance) {
      EnhancedSyncManager.instance = new EnhancedSyncManager();
    }
    return EnhancedSyncManager.instance;
  }

  /**
   * Initialize enhanced sync functionality
   */
  private async initializeEnhancedSync(): Promise<void> {
    try {
      // Load sync schedules
      await this.loadSyncSchedules();

      // Setup network quality monitoring
      this.startNetworkQualityMonitoring();

      // Setup intelligent sync scheduling
      this.startIntelligentScheduling();

      console.log('EnhancedSyncManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize EnhancedSyncManager:', error);
      this.errorHandler.handleError(error as Error, {
        context: 'EnhancedSyncManager.initializeEnhancedSync',
        severity: 'high',
      });
    }
  }

  /**
   * Initialize bandwidth-aware settings
   */
  private initializeBandwidthSettings(): void {
    this.bandwidthSettings = {
      enabled: true,
      thresholds: {
        poor: { maxBatchSize: 10, syncInterval: 300000, compressionLevel: 9 }, // 5 min
        fair: { maxBatchSize: 25, syncInterval: 180000, compressionLevel: 6 }, // 3 min
        good: { maxBatchSize: 50, syncInterval: 60000, compressionLevel: 3 }, // 1 min
        excellent: {
          maxBatchSize: 100,
          syncInterval: 30000,
          compressionLevel: 1,
        }, // 30 sec
      },
      adaptiveCompression: true,
      progressiveSync: true,
      backgroundSyncLimits: {
        maxDuration: 10, // 10 minutes
        maxDataTransfer: 50, // 50 MB
      },
    };
  }

  /**
   * Start network quality monitoring
   */
  private startNetworkQualityMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    NetInfo.addEventListener(async (state: NetInfoState) => {
      const quality = await this.assessNetworkQuality(state);
      this.networkQuality = quality;

      // Notify network quality listeners
      this.notifyNetworkListeners(quality);

      // Trigger adaptive sync if needed
      if (state.isConnected && quality.quality !== 'poor') {
        await this.performAdaptiveSync();
      }
    });
  }

  /**
   * Assess network quality and determine adaptive settings
   */
  private async assessNetworkQuality(
    state: NetInfoState
  ): Promise<NetworkQuality> {
    const connectionType = state.type || 'unknown';
    const effectiveType = (state as any).effectiveType || 'unknown';

    // Estimate network metrics based on connection type
    let downlink = 1; // Default 1 Mbps
    let rtt = 100; // Default 100ms
    let quality: 'poor' | 'fair' | 'good' | 'excellent' = 'fair';

    // Estimate based on connection type
    switch (connectionType) {
      case 'wifi':
        downlink = 25;
        rtt = 20;
        quality = 'excellent';
        break;
      case 'cellular':
        switch (effectiveType) {
          case '4g':
            downlink = 10;
            rtt = 50;
            quality = 'good';
            break;
          case '3g':
            downlink = 2;
            rtt = 100;
            quality = 'fair';
            break;
          case '2g':
            downlink = 0.5;
            rtt = 300;
            quality = 'poor';
            break;
          default:
            downlink = 5;
            rtt = 75;
            quality = 'fair';
        }
        break;
      default:
        quality = 'poor';
    }

    // Get adaptive settings based on quality
    const adaptiveSettings = this.getAdaptiveSettings(quality);

    return {
      connectionType,
      effectiveType,
      downlink,
      rtt,
      saveData: false, // Could be detected from system settings
      quality,
      adaptiveSettings,
    };
  }

  /**
   * Get adaptive settings based on network quality
   */
  private getAdaptiveSettings(quality: 'poor' | 'fair' | 'good' | 'excellent') {
    const settings = this.bandwidthSettings.thresholds[quality];

    return {
      batchSize: settings.maxBatchSize,
      syncInterval: settings.syncInterval,
      compressionLevel: settings.compressionLevel,
      priorityThreshold:
        quality === 'poor'
          ? ('critical' as const)
          : quality === 'fair'
            ? ('high' as const)
            : quality === 'good'
              ? ('normal' as const)
              : ('low' as const),
    };
  }

  /**
   * Perform adaptive sync based on network conditions
   */
  public async performAdaptiveSync(): Promise<DeltaSyncResult> {
    const startTime = Date.now();

    try {
      if (!this.networkQuality) {
        throw new Error('Network quality not assessed');
      }

      // Check if sync should be performed based on conditions
      if (!(await this.shouldPerformSync())) {
        return {
          success: false,
          changesApplied: 0,
          conflictsDetected: 0,
          bytesTransferred: 0,
          syncDuration: 0,
          nextSyncTimestamp:
            Date.now() + this.networkQuality.adaptiveSettings.syncInterval,
        };
      }

      // Perform delta sync with adaptive settings
      const result = await this.performDeltaSync();

      // Update sync schedule based on results
      await this.updateAdaptiveSchedule(result);

      // Notify listeners
      this.notifySyncListeners(result);

      return result;
    } catch (error) {
      console.error('Adaptive sync failed:', error);

      const errorResult: DeltaSyncResult = {
        success: false,
        changesApplied: 0,
        conflictsDetected: 0,
        bytesTransferred: 0,
        syncDuration: Date.now() - startTime,
        nextSyncTimestamp: Date.now() + 300000, // Retry in 5 minutes
      };

      this.notifySyncListeners(errorResult);
      return errorResult;
    }
  }

  /**
   * Perform delta sync with bandwidth awareness
   */
  private async performDeltaSync(): Promise<DeltaSyncResult> {
    const startTime = Date.now();

    try {
      // Get last sync timestamp for delta sync
      const lastSyncTimestamp = await this.getLastDeltaSyncTimestamp();

      // Perform sync with adaptive batch size
      const batchSize = this.networkQuality?.adaptiveSettings.batchSize || 25;

      // Use existing sync manager with enhanced parameters
      await syncManager.performSync();

      // Calculate metrics (simplified for now)
      const syncDuration = Date.now() - startTime;
      const bytesTransferred = await this.estimateBytesTransferred();

      // Store delta sync timestamp
      await this.setLastDeltaSyncTimestamp(Date.now());

      return {
        success: true,
        changesApplied: batchSize, // Simplified
        conflictsDetected: 0, // Would be from sync manager
        bytesTransferred,
        syncDuration,
        nextSyncTimestamp:
          Date.now() +
          (this.networkQuality?.adaptiveSettings.syncInterval || 60000),
        adaptiveRecommendations: this.generateAdaptiveRecommendations(),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if sync should be performed based on current conditions
   */
  private async shouldPerformSync(): Promise<boolean> {
    if (!this.networkQuality) return false;

    // Check network quality threshold
    if (this.networkQuality.quality === 'poor') {
      // Only sync critical operations when network is poor
      const pendingCritical = await this.hasCriticalPendingOperations();
      return pendingCritical;
    }

    // Check if enough time has passed since last sync
    const lastSync = await this.getLastDeltaSyncTimestamp();
    const timeSinceLastSync = Date.now() - (lastSync || 0);
    const minInterval = this.networkQuality.adaptiveSettings.syncInterval;

    return timeSinceLastSync >= minInterval;
  }

  /**
   * Check if there are critical pending operations
   */
  private async hasCriticalPendingOperations(): Promise<boolean> {
    const queueStatus = offlineService.getOfflineQueueStatus();
    return queueStatus.pending > 0; // Simplified check
  }

  /**
   * Generate adaptive recommendations based on sync performance
   */
  private generateAdaptiveRecommendations() {
    if (!this.networkQuality) return undefined;

    const quality = this.networkQuality.quality;
    const recommendations: string[] = [];

    if (quality === 'poor') {
      recommendations.push(
        'Consider enabling WiFi for better sync performance'
      );
      recommendations.push('Sync will be limited to critical operations only');
    } else if (quality === 'fair') {
      recommendations.push('Sync frequency reduced to preserve bandwidth');
      recommendations.push(
        'Non-essential data will be synced during better connectivity'
      );
    }

    return {
      suggestedInterval: this.networkQuality.adaptiveSettings.syncInterval,
      suggestedBatchSize: this.networkQuality.adaptiveSettings.batchSize,
      qualityOptimizations: recommendations,
    };
  }

  /**
   * Start intelligent sync scheduling
   */
  private startIntelligentScheduling(): void {
    // Setup default sync schedules
    this.setupDefaultSchedules();

    // Start schedule processor
    this.syncTimer = setInterval(() => {
      this.processScheduledSyncs();
    }, 60000); // Check every minute
  }

  /**
   * Setup default sync schedules
   */
  private async setupDefaultSchedules(): Promise<void> {
    const defaultSchedules: SyncSchedule[] = [
      {
        id: 'immediate_sync',
        name: 'Immediate Sync',
        enabled: true,
        schedule: { type: 'event', value: 'network_connected' },
        conditions: { networkQuality: 'fair' },
        priority: 'high',
      },
      {
        id: 'regular_sync',
        name: 'Regular Sync',
        enabled: true,
        schedule: { type: 'interval', value: 15 }, // 15 minutes
        conditions: { networkQuality: 'good' },
        priority: 'normal',
      },
      {
        id: 'background_sync',
        name: 'Background Sync',
        enabled: true,
        schedule: { type: 'interval', value: 60 }, // 1 hour
        conditions: { networkQuality: 'fair', avoidPeakHours: true },
        priority: 'low',
      },
    ];

    // Load existing schedules or use defaults
    const existingSchedules = await this.loadSyncSchedules();
    if (existingSchedules.length === 0) {
      this.syncSchedules = defaultSchedules;
      await this.saveSyncSchedules();
    }
  }

  /**
   * Process scheduled syncs
   */
  private async processScheduledSyncs(): Promise<void> {
    const now = Date.now();

    for (const schedule of this.syncSchedules) {
      if (!schedule.enabled) continue;

      // Check if schedule should run
      if (await this.shouldRunSchedule(schedule, now)) {
        try {
          await this.performAdaptiveSync();
          schedule.lastRun = now;
          schedule.nextRun = this.calculateNextRun(schedule, now);
        } catch (error) {
          console.error(`Scheduled sync failed for ${schedule.name}:`, error);
        }
      }
    }

    // Save updated schedules
    await this.saveSyncSchedules();
  }

  /**
   * Check if a schedule should run
   */
  private async shouldRunSchedule(
    schedule: SyncSchedule,
    now: number
  ): Promise<boolean> {
    // Check if it's time to run
    if (schedule.nextRun && now < schedule.nextRun) {
      return false;
    }

    // Check conditions
    if (schedule.conditions.networkQuality && this.networkQuality) {
      const requiredQuality = schedule.conditions.networkQuality;
      const currentQuality = this.networkQuality.quality;

      const qualityLevels = { poor: 0, fair: 1, good: 2, excellent: 3 };
      if (qualityLevels[currentQuality] < qualityLevels[requiredQuality]) {
        return false;
      }
    }

    // Check if avoiding peak hours
    if (schedule.conditions.avoidPeakHours && this.isPeakHour()) {
      return false;
    }

    return true;
  }

  /**
   * Calculate next run time for a schedule
   */
  private calculateNextRun(schedule: SyncSchedule, now: number): number {
    if (schedule.schedule.type === 'interval') {
      const intervalMinutes = schedule.schedule.value as number;
      return now + intervalMinutes * 60 * 1000;
    }

    // For other schedule types, default to 1 hour
    return now + 60 * 60 * 1000;
  }

  /**
   * Check if current time is peak hour (simplified)
   */
  private isPeakHour(): boolean {
    const hour = new Date().getHours();
    // Consider 8-10 AM and 6-8 PM as peak hours
    return (hour >= 8 && hour <= 10) || (hour >= 18 && hour <= 20);
  }

  /**
   * Add sync listener
   */
  public addSyncListener(
    listener: (result: DeltaSyncResult) => void
  ): () => void {
    this.syncListeners.push(listener);

    return () => {
      const index = this.syncListeners.indexOf(listener);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  /**
   * Add network quality listener
   */
  public addNetworkListener(
    listener: (quality: NetworkQuality) => void
  ): () => void {
    this.networkListeners.push(listener);

    return () => {
      const index = this.networkListeners.indexOf(listener);
      if (index > -1) {
        this.networkListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify sync listeners
   */
  private notifySyncListeners(result: DeltaSyncResult): void {
    this.syncListeners.forEach(listener => {
      try {
        listener(result);
      } catch (error) {
        console.error('Sync listener error:', error);
      }
    });
  }

  /**
   * Notify network quality listeners
   */
  private notifyNetworkListeners(quality: NetworkQuality): void {
    this.networkListeners.forEach(listener => {
      try {
        listener(quality);
      } catch (error) {
        console.error('Network listener error:', error);
      }
    });
  }

  /**
   * Get current network quality
   */
  public getNetworkQuality(): NetworkQuality | null {
    return this.networkQuality;
  }

  /**
   * Get bandwidth-aware settings
   */
  public getBandwidthSettings(): BandwidthAwareSettings {
    return this.bandwidthSettings;
  }

  /**
   * Update bandwidth-aware settings
   */
  public async updateBandwidthSettings(
    settings: Partial<BandwidthAwareSettings>
  ): Promise<void> {
    this.bandwidthSettings = { ...this.bandwidthSettings, ...settings };
    await AsyncStorage.setItem(
      'bandwidth_settings',
      JSON.stringify(this.bandwidthSettings)
    );
  }

  /**
   * Load sync schedules from storage
   */
  private async loadSyncSchedules(): Promise<SyncSchedule[]> {
    try {
      const stored = await AsyncStorage.getItem('sync_schedules');
      if (stored) {
        this.syncSchedules = JSON.parse(stored);
        return this.syncSchedules;
      }
    } catch (error) {
      console.error('Failed to load sync schedules:', error);
    }
    return [];
  }

  /**
   * Save sync schedules to storage
   */
  private async saveSyncSchedules(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        'sync_schedules',
        JSON.stringify(this.syncSchedules)
      );
    } catch (error) {
      console.error('Failed to save sync schedules:', error);
    }
  }

  /**
   * Update adaptive schedule based on sync results
   */
  private async updateAdaptiveSchedule(result: DeltaSyncResult): Promise<void> {
    if (!result.adaptiveRecommendations) return;

    // Update sync intervals based on performance
    const schedule = this.syncSchedules.find(s => s.id === 'regular_sync');
    if (schedule && schedule.schedule.type === 'interval') {
      const suggestedInterval = Math.floor(
        result.adaptiveRecommendations.suggestedInterval / 60000
      );
      schedule.schedule.value = Math.max(5, Math.min(60, suggestedInterval)); // Between 5-60 minutes
    }

    await this.saveSyncSchedules();
  }

  /**
   * Get last delta sync timestamp
   */
  private async getLastDeltaSyncTimestamp(): Promise<number | null> {
    try {
      const timestamp = await AsyncStorage.getItem('last_delta_sync');
      return timestamp ? parseInt(timestamp, 10) : null;
    } catch (error) {
      console.error('Failed to get last delta sync timestamp:', error);
      return null;
    }
  }

  /**
   * Set last delta sync timestamp
   */
  private async setLastDeltaSyncTimestamp(timestamp: number): Promise<void> {
    try {
      await AsyncStorage.setItem('last_delta_sync', timestamp.toString());
    } catch (error) {
      console.error('Failed to set last delta sync timestamp:', error);
    }
  }

  /**
   * Estimate bytes transferred (simplified implementation)
   */
  private async estimateBytesTransferred(): Promise<number> {
    // This would be calculated based on actual sync operations
    // For now, return a reasonable estimate
    const queueStatus = offlineService.getOfflineQueueStatus();
    return queueStatus.pending * 1024; // Estimate 1KB per operation
  }

  /**
   * Get sync schedules
   */
  public getSyncSchedules(): SyncSchedule[] {
    return [...this.syncSchedules];
  }

  /**
   * Add custom sync schedule
   */
  public async addSyncSchedule(
    schedule: Omit<SyncSchedule, 'id'>
  ): Promise<string> {
    const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newSchedule: SyncSchedule = { ...schedule, id };

    this.syncSchedules.push(newSchedule);
    await this.saveSyncSchedules();

    return id;
  }

  /**
   * Update sync schedule
   */
  public async updateSyncSchedule(
    id: string,
    updates: Partial<SyncSchedule>
  ): Promise<boolean> {
    const index = this.syncSchedules.findIndex(s => s.id === id);
    if (index === -1) return false;

    this.syncSchedules[index] = { ...this.syncSchedules[index], ...updates };
    await this.saveSyncSchedules();

    return true;
  }

  /**
   * Remove sync schedule
   */
  public async removeSyncSchedule(id: string): Promise<boolean> {
    const index = this.syncSchedules.findIndex(s => s.id === id);
    if (index === -1) return false;

    this.syncSchedules.splice(index, 1);
    await this.saveSyncSchedules();

    return true;
  }

  /**
   * Force immediate sync regardless of conditions
   */
  public async forceSync(): Promise<DeltaSyncResult> {
    return await this.performDeltaSync();
  }

  /**
   * Get sync statistics
   */
  public async getSyncStatistics(): Promise<{
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    averageSyncDuration: number;
    totalBytesTransferred: number;
    networkQualityHistory: Array<{ timestamp: number; quality: string }>;
  }> {
    // This would be implemented with proper metrics storage
    // For now, return mock data
    return {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      averageSyncDuration: 0,
      totalBytesTransferred: 0,
      networkQualityHistory: [],
    };
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    this.syncListeners = [];
    this.networkListeners = [];
    this.isMonitoring = false;
  }
}

// Export singleton instance
export const enhancedSyncManager = EnhancedSyncManager.getInstance();
