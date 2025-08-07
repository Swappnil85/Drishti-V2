import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { ErrorHandlingService } from '../ErrorHandlingService';
import { enhancedSyncManager } from './EnhancedSyncManager';

// Sync notification interfaces
export interface SyncNotification {
  id: string;
  type: 'success' | 'failure' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  syncOperation: {
    operationType:
      | 'full_sync'
      | 'partial_sync'
      | 'conflict_resolution'
      | 'background_sync';
    dataTypes: string[];
    recordCount: number;
    duration: number;
  };
  metadata: {
    networkQuality: string;
    deviceInfo: string;
    syncVersion: string;
    retryCount?: number;
    errorCode?: string;
  };
  actions?: NotificationAction[];
  dismissed: boolean;
  persistent: boolean;
}

export interface NotificationAction {
  id: string;
  label: string;
  type: 'retry' | 'view_details' | 'settings' | 'dismiss' | 'help';
  handler: () => void | Promise<void>;
}

export interface SyncHealthMetrics {
  successRate: number; // percentage
  averageSyncDuration: number; // milliseconds
  failureReasons: Record<string, number>;
  networkQualityImpact: Record<
    string,
    { attempts: number; successRate: number }
  >;
  syncFrequency: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  dataUsage: {
    totalBytes: number;
    averagePerSync: number;
    compressionRatio: number;
  };
  lastSuccessfulSync: number;
  consecutiveFailures: number;
  predictedNextFailure?: {
    probability: number;
    reasons: string[];
    recommendedActions: string[];
  };
}

export interface NotificationPreferences {
  enabled: boolean;
  successNotifications: {
    enabled: boolean;
    threshold: 'always' | 'important_only' | 'never';
    showSummary: boolean;
  };
  failureNotifications: {
    enabled: boolean;
    persistent: boolean;
    showRetryOptions: boolean;
    showTroubleshooting: boolean;
  };
  warningNotifications: {
    enabled: boolean;
    predictiveWarnings: boolean;
    networkQualityWarnings: boolean;
    storageWarnings: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
  };
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  badgeCount: boolean;
}

/**
 * SyncNotificationService manages sync-related notifications and health monitoring
 * Provides comprehensive notification system with customizable preferences
 */
export class SyncNotificationService {
  private static instance: SyncNotificationService;
  private errorHandler: ErrorHandlingService;
  private notifications: Map<string, SyncNotification> = new Map();
  private healthMetrics: SyncHealthMetrics;
  private preferences: NotificationPreferences;
  private notificationListeners: ((
    notifications: SyncNotification[]
  ) => void)[] = [];
  private healthListeners: ((metrics: SyncHealthMetrics) => void)[] = [];
  private isInitialized = false;

  private constructor() {
    this.errorHandler = ErrorHandlingService.getInstance();
    this.initializeDefaultPreferences();
    this.initializeDefaultHealthMetrics();
  }

  public static getInstance(): SyncNotificationService {
    if (!SyncNotificationService.instance) {
      SyncNotificationService.instance = new SyncNotificationService();
    }
    return SyncNotificationService.instance;
  }

  /**
   * Initialize the sync notification service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load stored notifications
      await this.loadNotifications();

      // Load preferences
      await this.loadPreferences();

      // Load health metrics
      await this.loadHealthMetrics();

      // Setup sync listeners
      this.setupSyncListeners();

      this.isInitialized = true;
      console.log('SyncNotificationService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SyncNotificationService:', error);
      this.errorHandler.handleError(error as Error, {
        context: 'SyncNotificationService.initialize',
        severity: 'medium',
      });
    }
  }

  /**
   * Initialize default notification preferences
   */
  private initializeDefaultPreferences(): void {
    this.preferences = {
      enabled: true,
      successNotifications: {
        enabled: true,
        threshold: 'important_only',
        showSummary: true,
      },
      failureNotifications: {
        enabled: true,
        persistent: true,
        showRetryOptions: true,
        showTroubleshooting: true,
      },
      warningNotifications: {
        enabled: true,
        predictiveWarnings: true,
        networkQualityWarnings: true,
        storageWarnings: true,
      },
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
      },
      soundEnabled: true,
      vibrationEnabled: true,
      badgeCount: true,
    };
  }

  /**
   * Initialize default health metrics
   */
  private initializeDefaultHealthMetrics(): void {
    this.healthMetrics = {
      successRate: 95,
      averageSyncDuration: 2000,
      failureReasons: {},
      networkQualityImpact: {},
      syncFrequency: {
        daily: 0,
        weekly: 0,
        monthly: 0,
      },
      dataUsage: {
        totalBytes: 0,
        averagePerSync: 0,
        compressionRatio: 0.7,
      },
      lastSuccessfulSync: 0,
      consecutiveFailures: 0,
    };
  }

  /**
   * Setup sync event listeners
   */
  private setupSyncListeners(): void {
    // Listen to enhanced sync manager events
    enhancedSyncManager.addSyncListener(async event => {
      await this.handleSyncEvent(event);
    });

    // Listen to network quality changes for predictive warnings
    enhancedSyncManager.addNetworkListener(async quality => {
      await this.handleNetworkQualityChange(quality);
    });
  }

  /**
   * Handle sync events and create appropriate notifications
   */
  private async handleSyncEvent(event: any): Promise<void> {
    try {
      const startTime = Date.now();

      switch (event.type) {
        case 'sync_started':
          await this.handleSyncStarted(event);
          break;
        case 'sync_completed':
          await this.handleSyncCompleted(event, startTime);
          break;
        case 'sync_failed':
          await this.handleSyncFailed(event, startTime);
          break;
        case 'conflict_detected':
          await this.handleConflictDetected(event);
          break;
        case 'background_sync_completed':
          await this.handleBackgroundSyncCompleted(event);
          break;
      }

      // Update health metrics
      await this.updateHealthMetrics(event);

      // Check for predictive warnings
      await this.checkPredictiveWarnings();
    } catch (error) {
      console.error('Failed to handle sync event:', error);
    }
  }

  /**
   * Handle sync started event
   */
  private async handleSyncStarted(event: any): Promise<void> {
    // Only show notification for manual syncs or important operations
    if (event.manual || event.operationType === 'full_sync') {
      const notification: SyncNotification = {
        id: `sync_started_${Date.now()}`,
        type: 'info',
        title: 'Sync Started',
        message: `Synchronizing ${event.dataTypes?.length || 0} data types...`,
        timestamp: Date.now(),
        syncOperation: {
          operationType: event.operationType || 'partial_sync',
          dataTypes: event.dataTypes || [],
          recordCount: event.recordCount || 0,
          duration: 0,
        },
        metadata: {
          networkQuality: event.networkQuality || 'unknown',
          deviceInfo: event.deviceInfo || 'unknown',
          syncVersion: '1.0',
        },
        dismissed: false,
        persistent: false,
      };

      await this.addNotification(notification);
    }
  }

  /**
   * Handle sync completed event
   */
  private async handleSyncCompleted(
    event: any,
    startTime: number
  ): Promise<void> {
    const duration = Date.now() - startTime;

    // Check if we should show success notification based on preferences
    if (!this.shouldShowSuccessNotification(event)) {
      return;
    }

    const notification: SyncNotification = {
      id: `sync_success_${Date.now()}`,
      type: 'success',
      title: 'Sync Completed',
      message: this.generateSuccessMessage(event),
      timestamp: Date.now(),
      syncOperation: {
        operationType: event.operationType || 'partial_sync',
        dataTypes: event.dataTypes || [],
        recordCount: event.recordCount || 0,
        duration,
      },
      metadata: {
        networkQuality: event.networkQuality || 'unknown',
        deviceInfo: event.deviceInfo || 'unknown',
        syncVersion: '1.0',
      },
      dismissed: false,
      persistent: false,
    };

    await this.addNotification(notification);
  }

  /**
   * Handle sync failed event
   */
  private async handleSyncFailed(event: any, startTime: number): Promise<void> {
    const duration = Date.now() - startTime;

    const notification: SyncNotification = {
      id: `sync_failure_${Date.now()}`,
      type: 'failure',
      title: 'Sync Failed',
      message: this.generateFailureMessage(event),
      timestamp: Date.now(),
      syncOperation: {
        operationType: event.operationType || 'partial_sync',
        dataTypes: event.dataTypes || [],
        recordCount: event.recordCount || 0,
        duration,
      },
      metadata: {
        networkQuality: event.networkQuality || 'unknown',
        deviceInfo: event.deviceInfo || 'unknown',
        syncVersion: '1.0',
        retryCount: event.retryCount || 0,
        errorCode: event.errorCode,
      },
      actions: this.generateFailureActions(event),
      dismissed: false,
      persistent: this.preferences.failureNotifications.persistent,
    };

    await this.addNotification(notification);

    // Show system alert for critical failures
    if (event.critical || this.healthMetrics.consecutiveFailures > 3) {
      this.showCriticalFailureAlert(notification);
    }
  }

  /**
   * Handle conflict detected event
   */
  private async handleConflictDetected(event: any): Promise<void> {
    const notification: SyncNotification = {
      id: `conflict_${Date.now()}`,
      type: 'warning',
      title: 'Sync Conflicts Detected',
      message: `${event.conflictCount} conflicts need your attention`,
      timestamp: Date.now(),
      syncOperation: {
        operationType: 'conflict_resolution',
        dataTypes: event.dataTypes || [],
        recordCount: event.conflictCount || 0,
        duration: 0,
      },
      metadata: {
        networkQuality: event.networkQuality || 'unknown',
        deviceInfo: event.deviceInfo || 'unknown',
        syncVersion: '1.0',
      },
      actions: [
        {
          id: 'resolve_conflicts',
          label: 'Resolve Conflicts',
          type: 'view_details',
          handler: () => {
            // Navigate to conflict resolution screen
            console.log('Navigate to conflict resolution');
          },
        },
      ],
      dismissed: false,
      persistent: true,
    };

    await this.addNotification(notification);
  }

  /**
   * Handle background sync completed event
   */
  private async handleBackgroundSyncCompleted(event: any): Promise<void> {
    // Only show notification if there were significant changes
    if (event.recordCount > 10 || event.hasImportantUpdates) {
      const notification: SyncNotification = {
        id: `bg_sync_${Date.now()}`,
        type: 'info',
        title: 'Background Sync Complete',
        message: `Updated ${event.recordCount} records in the background`,
        timestamp: Date.now(),
        syncOperation: {
          operationType: 'background_sync',
          dataTypes: event.dataTypes || [],
          recordCount: event.recordCount || 0,
          duration: event.duration || 0,
        },
        metadata: {
          networkQuality: event.networkQuality || 'unknown',
          deviceInfo: event.deviceInfo || 'unknown',
          syncVersion: '1.0',
        },
        dismissed: false,
        persistent: false,
      };

      await this.addNotification(notification);
    }
  }

  /**
   * Handle network quality changes for predictive warnings
   */
  private async handleNetworkQualityChange(quality: any): Promise<void> {
    if (!this.preferences.warningNotifications.networkQualityWarnings) return;

    // Warn about poor network quality that might affect sync
    if (quality.quality === 'poor' && this.isInQuietHours() === false) {
      const notification: SyncNotification = {
        id: `network_warning_${Date.now()}`,
        type: 'warning',
        title: 'Poor Network Quality',
        message:
          'Sync operations may be slower or fail. Consider connecting to WiFi.',
        timestamp: Date.now(),
        syncOperation: {
          operationType: 'partial_sync',
          dataTypes: [],
          recordCount: 0,
          duration: 0,
        },
        metadata: {
          networkQuality: quality.quality,
          deviceInfo: quality.connectionType || 'unknown',
          syncVersion: '1.0',
        },
        actions: [
          {
            id: 'check_settings',
            label: 'Network Settings',
            type: 'settings',
            handler: () => {
              console.log('Open network settings');
            },
          },
        ],
        dismissed: false,
        persistent: false,
      };

      await this.addNotification(notification);
    }
  }

  /**
   * Check for predictive warnings based on patterns
   */
  private async checkPredictiveWarnings(): Promise<void> {
    if (!this.preferences.warningNotifications.predictiveWarnings) return;

    // Predict potential sync failures based on patterns
    const prediction = this.calculateFailurePrediction();

    if (prediction.probability > 0.7) {
      const notification: SyncNotification = {
        id: `predictive_warning_${Date.now()}`,
        type: 'warning',
        title: 'Potential Sync Issues Detected',
        message: `High probability of sync failure. ${prediction.reasons.join(', ')}`,
        timestamp: Date.now(),
        syncOperation: {
          operationType: 'partial_sync',
          dataTypes: [],
          recordCount: 0,
          duration: 0,
        },
        metadata: {
          networkQuality: 'unknown',
          deviceInfo: 'unknown',
          syncVersion: '1.0',
        },
        actions: prediction.recommendedActions.map((action, index) => ({
          id: `action_${index}`,
          label: action,
          type: 'help',
          handler: () => {
            console.log(`Execute action: ${action}`);
          },
        })),
        dismissed: false,
        persistent: false,
      };

      await this.addNotification(notification);
    }
  }

  /**
   * Calculate failure prediction based on historical data
   */
  private calculateFailurePrediction(): {
    probability: number;
    reasons: string[];
    recommendedActions: string[];
  } {
    const reasons: string[] = [];
    const recommendedActions: string[] = [];
    let probability = 0;

    // Check consecutive failures
    if (this.healthMetrics.consecutiveFailures > 2) {
      probability += 0.3;
      reasons.push('Multiple recent failures');
      recommendedActions.push('Check network connection');
    }

    // Check success rate trend
    if (this.healthMetrics.successRate < 80) {
      probability += 0.2;
      reasons.push('Low success rate');
      recommendedActions.push('Review sync settings');
    }

    // Check time since last successful sync
    const timeSinceLastSync =
      Date.now() - this.healthMetrics.lastSuccessfulSync;
    if (timeSinceLastSync > 24 * 60 * 60 * 1000) {
      // 24 hours
      probability += 0.3;
      reasons.push('Long time since last successful sync');
      recommendedActions.push('Perform manual sync');
    }

    // Check common failure reasons
    const commonFailures = Object.entries(this.healthMetrics.failureReasons)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2);

    if (commonFailures.length > 0) {
      probability += 0.2;
      reasons.push(
        `Common issues: ${commonFailures.map(([reason]) => reason).join(', ')}`
      );
      recommendedActions.push('Address common failure causes');
    }

    return {
      probability: Math.min(1.0, probability),
      reasons,
      recommendedActions,
    };
  }

  /**
   * Check if we should show success notification
   */
  private shouldShowSuccessNotification(event: any): boolean {
    if (!this.preferences.successNotifications.enabled) return false;
    if (this.isInQuietHours()) return false;

    const threshold = this.preferences.successNotifications.threshold;

    switch (threshold) {
      case 'never':
        return false;
      case 'always':
        return true;
      case 'important_only':
        return (
          event.manual ||
          event.operationType === 'full_sync' ||
          (event.recordCount && event.recordCount > 50) ||
          event.hasImportantUpdates
        );
      default:
        return true;
    }
  }

  /**
   * Generate success message
   */
  private generateSuccessMessage(event: any): string {
    const recordCount = event.recordCount || 0;
    const dataTypes = event.dataTypes || [];

    if (this.preferences.successNotifications.showSummary) {
      return `Successfully synced ${recordCount} records across ${dataTypes.length} data types`;
    } else {
      return 'Sync completed successfully';
    }
  }

  /**
   * Generate failure message
   */
  private generateFailureMessage(event: any): string {
    const errorMessage = event.error?.message || 'Unknown error occurred';
    const retryCount = event.retryCount || 0;

    let message = `Sync failed: ${errorMessage}`;
    if (retryCount > 0) {
      message += ` (Retry ${retryCount})`;
    }

    return message;
  }

  /**
   * Generate failure action buttons
   */
  private generateFailureActions(event: any): NotificationAction[] {
    const actions: NotificationAction[] = [];

    if (this.preferences.failureNotifications.showRetryOptions) {
      actions.push({
        id: 'retry_sync',
        label: 'Retry Now',
        type: 'retry',
        handler: async () => {
          try {
            await enhancedSyncManager.performSync();
          } catch (error) {
            console.error('Retry sync failed:', error);
          }
        },
      });
    }

    if (this.preferences.failureNotifications.showTroubleshooting) {
      actions.push({
        id: 'troubleshoot',
        label: 'Troubleshoot',
        type: 'help',
        handler: () => {
          console.log('Open troubleshooting guide');
        },
      });
    }

    actions.push({
      id: 'view_details',
      label: 'View Details',
      type: 'view_details',
      handler: () => {
        console.log('Show sync error details');
      },
    });

    return actions;
  }

  /**
   * Show critical failure alert
   */
  private showCriticalFailureAlert(notification: SyncNotification): void {
    Alert.alert(
      'Critical Sync Failure',
      'Multiple sync attempts have failed. Your data may not be up to date.',
      [
        {
          text: 'Troubleshoot',
          onPress: () => {
            console.log('Open troubleshooting');
          },
        },
        {
          text: 'Retry',
          onPress: async () => {
            try {
              await enhancedSyncManager.performSync();
            } catch (error) {
              console.error('Critical retry failed:', error);
            }
          },
        },
        {
          text: 'Later',
          style: 'cancel',
        },
      ]
    );
  }

  /**
   * Check if currently in quiet hours
   */
  private isInQuietHours(): boolean {
    if (!this.preferences.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = this.preferences.quietHours.startTime
      .split(':')
      .map(Number);
    const [endHour, endMin] = this.preferences.quietHours.endTime
      .split(':')
      .map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  /**
   * Add notification to the system
   */
  private async addNotification(notification: SyncNotification): Promise<void> {
    this.notifications.set(notification.id, notification);

    // Limit stored notifications to last 100
    if (this.notifications.size > 100) {
      const oldestId = Array.from(this.notifications.keys())[0];
      this.notifications.delete(oldestId);
    }

    // Save to storage
    await this.saveNotifications();

    // Notify listeners
    this.notifyNotificationListeners();

    console.log(
      `Sync notification: ${notification.title} - ${notification.message}`
    );
  }

  /**
   * Update health metrics based on sync event
   */
  private async updateHealthMetrics(event: any): Promise<void> {
    const metrics = this.healthMetrics;

    // Update success rate
    if (event.type === 'sync_completed') {
      metrics.consecutiveFailures = 0;
      metrics.lastSuccessfulSync = Date.now();

      // Update average duration
      if (event.duration) {
        metrics.averageSyncDuration =
          (metrics.averageSyncDuration + event.duration) / 2;
      }

      // Update data usage
      if (event.bytesTransferred) {
        metrics.dataUsage.totalBytes += event.bytesTransferred;
        metrics.dataUsage.averagePerSync =
          metrics.dataUsage.totalBytes / (metrics.syncFrequency.daily + 1);
      }
    } else if (event.type === 'sync_failed') {
      metrics.consecutiveFailures++;

      // Track failure reasons
      const reason = event.error?.code || 'unknown_error';
      metrics.failureReasons[reason] =
        (metrics.failureReasons[reason] || 0) + 1;
    }

    // Update network quality impact
    if (event.networkQuality) {
      const quality = event.networkQuality;
      if (!metrics.networkQualityImpact[quality]) {
        metrics.networkQualityImpact[quality] = { attempts: 0, successRate: 0 };
      }

      metrics.networkQualityImpact[quality].attempts++;
      if (event.type === 'sync_completed') {
        metrics.networkQualityImpact[quality].successRate =
          (metrics.networkQualityImpact[quality].successRate + 1) / 2;
      }
    }

    // Calculate overall success rate
    const totalAttempts = Object.values(metrics.networkQualityImpact).reduce(
      (sum, data) => sum + data.attempts,
      0
    );
    const totalSuccesses = Object.values(metrics.networkQualityImpact).reduce(
      (sum, data) => sum + data.attempts * data.successRate,
      0
    );

    if (totalAttempts > 0) {
      metrics.successRate = (totalSuccesses / totalAttempts) * 100;
    }

    await this.saveHealthMetrics();
    this.notifyHealthListeners();
  }

  /**
   * Get all notifications
   */
  public getNotifications(): SyncNotification[] {
    return Array.from(this.notifications.values()).sort(
      (a, b) => b.timestamp - a.timestamp
    );
  }

  /**
   * Get unread notifications
   */
  public getUnreadNotifications(): SyncNotification[] {
    return this.getNotifications().filter(n => !n.dismissed);
  }

  /**
   * Dismiss notification
   */
  public async dismissNotification(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.dismissed = true;
      await this.saveNotifications();
      this.notifyNotificationListeners();
    }
  }

  /**
   * Clear all notifications
   */
  public async clearAllNotifications(): Promise<void> {
    this.notifications.clear();
    await this.saveNotifications();
    this.notifyNotificationListeners();
  }

  /**
   * Get sync health metrics
   */
  public getSyncHealthMetrics(): SyncHealthMetrics {
    return { ...this.healthMetrics };
  }

  /**
   * Update notification preferences
   */
  public async updatePreferences(
    updates: Partial<NotificationPreferences>
  ): Promise<void> {
    this.preferences = { ...this.preferences, ...updates };
    await this.savePreferences();
  }

  /**
   * Get notification preferences
   */
  public getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  /**
   * Add notification listener
   */
  public addNotificationListener(
    listener: (notifications: SyncNotification[]) => void
  ): () => void {
    this.notificationListeners.push(listener);

    return () => {
      const index = this.notificationListeners.indexOf(listener);
      if (index > -1) {
        this.notificationListeners.splice(index, 1);
      }
    };
  }

  /**
   * Add health metrics listener
   */
  public addHealthListener(
    listener: (metrics: SyncHealthMetrics) => void
  ): () => void {
    this.healthListeners.push(listener);

    return () => {
      const index = this.healthListeners.indexOf(listener);
      if (index > -1) {
        this.healthListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify notification listeners
   */
  private notifyNotificationListeners(): void {
    const notifications = this.getNotifications();
    this.notificationListeners.forEach(listener => {
      try {
        listener(notifications);
      } catch (error) {
        console.error('Notification listener error:', error);
      }
    });
  }

  /**
   * Notify health listeners
   */
  private notifyHealthListeners(): void {
    this.healthListeners.forEach(listener => {
      try {
        listener(this.healthMetrics);
      } catch (error) {
        console.error('Health listener error:', error);
      }
    });
  }

  /**
   * Load notifications from storage
   */
  private async loadNotifications(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('sync_notifications');
      if (stored) {
        const notifications: SyncNotification[] = JSON.parse(stored);
        this.notifications.clear();
        notifications.forEach(notification => {
          this.notifications.set(notification.id, notification);
        });
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }

  /**
   * Save notifications to storage
   */
  private async saveNotifications(): Promise<void> {
    try {
      const notifications = Array.from(this.notifications.values());
      await AsyncStorage.setItem(
        'sync_notifications',
        JSON.stringify(notifications)
      );
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }

  /**
   * Load preferences from storage
   */
  private async loadPreferences(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(
        'sync_notification_preferences'
      );
      if (stored) {
        const preferences = JSON.parse(stored);
        this.preferences = { ...this.preferences, ...preferences };
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  }

  /**
   * Save preferences to storage
   */
  private async savePreferences(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        'sync_notification_preferences',
        JSON.stringify(this.preferences)
      );
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }

  /**
   * Load health metrics from storage
   */
  private async loadHealthMetrics(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('sync_health_metrics');
      if (stored) {
        const metrics = JSON.parse(stored);
        this.healthMetrics = { ...this.healthMetrics, ...metrics };
      }
    } catch (error) {
      console.error('Failed to load health metrics:', error);
    }
  }

  /**
   * Save health metrics to storage
   */
  private async saveHealthMetrics(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        'sync_health_metrics',
        JSON.stringify(this.healthMetrics)
      );
    } catch (error) {
      console.error('Failed to save health metrics:', error);
    }
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.notifications.clear();
    this.notificationListeners = [];
    this.healthListeners = [];
    this.isInitialized = false;
  }
}

// Export singleton instance
export const syncNotificationService = SyncNotificationService.getInstance();
