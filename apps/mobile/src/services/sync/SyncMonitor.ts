import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncManager, SyncStatus } from './SyncManager';

// Sync event types for monitoring
export interface SyncEvent {
  id: string;
  type:
    | 'sync_start'
    | 'sync_complete'
    | 'sync_error'
    | 'conflict_detected'
    | 'conflict_resolved'
    | 'network_change';
  timestamp: number;
  data: any;
  duration?: number;
}

export interface SyncMetrics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  averageSyncDuration: number;
  lastSyncDuration: number;
  totalConflicts: number;
  resolvedConflicts: number;
  pendingConflicts: number;
  dataTransferred: number; // in bytes
  networkErrors: number;
  authErrors: number;
}

export interface SyncHealthReport {
  status: 'healthy' | 'warning' | 'critical';
  score: number; // 0-100
  issues: string[];
  recommendations: string[];
  metrics: SyncMetrics;
  lastEvents: SyncEvent[];
}

/**
 * SyncMonitor provides comprehensive monitoring and debugging for sync operations
 * Tracks performance, errors, and provides health reports
 */
export class SyncMonitor {
  private static instance: SyncMonitor;
  private events: SyncEvent[] = [];
  private maxEvents = 1000; // Keep last 1000 events
  private listeners: ((event: SyncEvent) => void)[] = [];

  private constructor() {
    this.loadEvents();
    this.setupSyncListener();
  }

  public static getInstance(): SyncMonitor {
    if (!SyncMonitor.instance) {
      SyncMonitor.instance = new SyncMonitor();
    }
    return SyncMonitor.instance;
  }

  /**
   * Setup sync manager listener
   */
  private setupSyncListener(): void {
    syncManager.addSyncListener((status: SyncStatus) => {
      this.recordEvent({
        type: status.syncInProgress ? 'sync_start' : 'sync_complete',
        data: { status },
      });
    });
  }

  /**
   * Record a sync event
   */
  public recordEvent(event: Omit<SyncEvent, 'id' | 'timestamp'>): void {
    const syncEvent: SyncEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...event,
    };

    this.events.push(syncEvent);

    // Keep only the last maxEvents
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Persist events
    this.persistEvents();

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(syncEvent);
      } catch (error) {
        console.error('Sync monitor listener error:', error);
      }
    });
  }

  /**
   * Add event listener
   */
  public addListener(listener: (event: SyncEvent) => void): () => void {
    this.listeners.push(listener);

    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get sync metrics
   */
  public async getMetrics(): Promise<SyncMetrics> {
    const now = Date.now();
    const last24Hours = now - 24 * 60 * 60 * 1000;
    const recentEvents = this.events.filter(e => e.timestamp > last24Hours);

    // const syncStartEvents = recentEvents.filter(e => e.type === 'sync_start');
    const syncCompleteEvents = recentEvents.filter(
      e => e.type === 'sync_complete'
    );
    const syncErrorEvents = recentEvents.filter(e => e.type === 'sync_error');
    const conflictEvents = recentEvents.filter(
      e => e.type === 'conflict_detected'
    );
    const resolvedConflictEvents = recentEvents.filter(
      e => e.type === 'conflict_resolved'
    );

    // Calculate sync durations
    const durations: number[] = [];
    syncCompleteEvents.forEach(completeEvent => {
      if (completeEvent.duration) {
        durations.push(completeEvent.duration);
      }
    });

    const averageDuration =
      durations.length > 0
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length
        : 0;

    const lastDuration =
      durations.length > 0 ? durations[durations.length - 1] : 0;

    // Get current sync status
    const syncStatus = await syncManager.getSyncStatus();

    return {
      totalSyncs: syncCompleteEvents.length + syncErrorEvents.length,
      successfulSyncs: syncCompleteEvents.length,
      failedSyncs: syncErrorEvents.length,
      averageSyncDuration: averageDuration,
      lastSyncDuration: lastDuration,
      totalConflicts: conflictEvents.length,
      resolvedConflicts: resolvedConflictEvents.length,
      pendingConflicts: syncStatus.conflictsCount,
      dataTransferred: this.calculateDataTransferred(recentEvents),
      networkErrors: this.countErrorsByType(syncErrorEvents, 'network'),
      authErrors: this.countErrorsByType(syncErrorEvents, 'auth'),
    };
  }

  /**
   * Generate health report
   */
  public async generateHealthReport(): Promise<SyncHealthReport> {
    const metrics = await this.getMetrics();
    const syncStatus = await syncManager.getSyncStatus();
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check sync success rate
    const successRate =
      metrics.totalSyncs > 0
        ? (metrics.successfulSyncs / metrics.totalSyncs) * 100
        : 100;

    if (successRate < 90) {
      issues.push(`Low sync success rate: ${successRate.toFixed(1)}%`);
      recommendations.push('Check network connectivity and server status');
      score -= 20;
    } else if (successRate < 95) {
      issues.push(`Moderate sync success rate: ${successRate.toFixed(1)}%`);
      score -= 10;
    }

    // Check pending operations
    if (syncStatus.pendingOperations > 50) {
      issues.push(
        `High number of pending operations: ${syncStatus.pendingOperations}`
      );
      recommendations.push('Perform manual sync or check for sync issues');
      score -= 15;
    } else if (syncStatus.pendingOperations > 20) {
      issues.push(
        `Moderate pending operations: ${syncStatus.pendingOperations}`
      );
      score -= 5;
    }

    // Check conflicts
    if (metrics.pendingConflicts > 10) {
      issues.push(
        `High number of unresolved conflicts: ${metrics.pendingConflicts}`
      );
      recommendations.push(
        'Resolve conflicts manually to improve sync performance'
      );
      score -= 15;
    } else if (metrics.pendingConflicts > 5) {
      issues.push(`Some unresolved conflicts: ${metrics.pendingConflicts}`);
      score -= 5;
    }

    // Check last sync time
    if (syncStatus.lastSync) {
      const hoursSinceLastSync =
        (Date.now() - syncStatus.lastSync) / (1000 * 60 * 60);
      if (hoursSinceLastSync > 24) {
        issues.push(`Last sync was ${hoursSinceLastSync.toFixed(1)} hours ago`);
        recommendations.push(
          'Perform manual sync to ensure data is up to date'
        );
        score -= 10;
      } else if (hoursSinceLastSync > 12) {
        issues.push(`Last sync was ${hoursSinceLastSync.toFixed(1)} hours ago`);
        score -= 5;
      }
    } else {
      issues.push('No sync has been performed yet');
      recommendations.push(
        'Perform initial sync to enable data synchronization'
      );
      score -= 20;
    }

    // Check network connectivity
    if (!syncStatus.isOnline) {
      issues.push('Device is offline');
      recommendations.push('Check internet connection');
      score -= 25;
    }

    // Check for frequent errors
    if (metrics.networkErrors > 5) {
      issues.push(`Frequent network errors: ${metrics.networkErrors}`);
      recommendations.push('Check network stability and server connectivity');
      score -= 10;
    }

    if (metrics.authErrors > 2) {
      issues.push(`Authentication errors detected: ${metrics.authErrors}`);
      recommendations.push('Re-authenticate or check login credentials');
      score -= 15;
    }

    // Determine overall status
    let status: 'healthy' | 'warning' | 'critical';
    if (score >= 80) {
      status = 'healthy';
    } else if (score >= 60) {
      status = 'warning';
    } else {
      status = 'critical';
    }

    return {
      status,
      score: Math.max(0, score),
      issues,
      recommendations,
      metrics,
      lastEvents: this.events.slice(-10), // Last 10 events
    };
  }

  /**
   * Get events by type
   */
  public getEventsByType(
    type: SyncEvent['type'],
    limit: number = 50
  ): SyncEvent[] {
    return this.events
      .filter(e => e.type === type)
      .slice(-limit)
      .reverse();
  }

  /**
   * Get events in time range
   */
  public getEventsInRange(startTime: number, endTime: number): SyncEvent[] {
    return this.events.filter(
      e => e.timestamp >= startTime && e.timestamp <= endTime
    );
  }

  /**
   * Clear all events
   */
  public async clearEvents(): Promise<void> {
    this.events = [];
    await AsyncStorage.removeItem('sync_events');
  }

  /**
   * Export events for debugging
   */
  public exportEvents(): string {
    return JSON.stringify(
      {
        exportTime: new Date().toISOString(),
        eventCount: this.events.length,
        events: this.events,
      },
      null,
      2
    );
  }

  /**
   * Load events from storage
   */
  private async loadEvents(): Promise<void> {
    try {
      const eventsData = await AsyncStorage.getItem('sync_events');
      if (eventsData) {
        this.events = JSON.parse(eventsData);
      }
    } catch (error) {
      console.error('Failed to load sync events:', error);
      this.events = [];
    }
  }

  /**
   * Persist events to storage
   */
  private async persistEvents(): Promise<void> {
    try {
      await AsyncStorage.setItem('sync_events', JSON.stringify(this.events));
    } catch (error) {
      console.error('Failed to persist sync events:', error);
    }
  }

  /**
   * Calculate data transferred from events
   */
  private calculateDataTransferred(events: SyncEvent[]): number {
    return events.reduce((total, event) => {
      if (event.data?.dataSize) {
        return total + event.data.dataSize;
      }
      return total;
    }, 0);
  }

  /**
   * Count errors by type
   */
  private countErrorsByType(
    errorEvents: SyncEvent[],
    errorType: string
  ): number {
    return errorEvents.filter(
      event =>
        event.data?.errorType === errorType ||
        event.data?.error?.includes(errorType)
    ).length;
  }

  /**
   * Start performance monitoring for a sync operation
   */
  public startSyncTimer(): () => void {
    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      this.recordEvent({
        type: 'sync_complete',
        data: { duration },
        duration,
      });
    };
  }

  /**
   * Record sync error
   */
  public recordSyncError(error: Error, context?: any): void {
    this.recordEvent({
      type: 'sync_error',
      data: {
        error: error.message,
        errorType: this.categorizeError(error),
        context,
      },
    });
  }

  /**
   * Record conflict detection
   */
  public recordConflict(
    conflictId: string,
    conflictType: string,
    table: string
  ): void {
    this.recordEvent({
      type: 'conflict_detected',
      data: {
        conflictId,
        conflictType,
        table,
      },
    });
  }

  /**
   * Record conflict resolution
   */
  public recordConflictResolution(
    conflictId: string,
    resolution: string
  ): void {
    this.recordEvent({
      type: 'conflict_resolved',
      data: {
        conflictId,
        resolution,
      },
    });
  }

  /**
   * Categorize error for better tracking
   */
  private categorizeError(error: Error): string {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    } else if (message.includes('auth') || message.includes('token')) {
      return 'auth';
    } else if (message.includes('database') || message.includes('sql')) {
      return 'database';
    } else if (message.includes('validation')) {
      return 'validation';
    } else {
      return 'unknown';
    }
  }
}

export const syncMonitor = SyncMonitor.getInstance();
