import { useState, useEffect, useCallback } from 'react';
import { 
  syncNotificationService, 
  SyncNotification, 
  SyncHealthMetrics, 
  NotificationPreferences 
} from '../services/sync/SyncNotificationService';

/**
 * React hook for sync notifications
 * Provides access to sync notifications, health metrics, and preferences
 */
export function useSyncNotifications() {
  const [notifications, setNotifications] = useState<SyncNotification[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<SyncHealthMetrics | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;
    let notificationUnsubscribe: (() => void) | null = null;
    let healthUnsubscribe: (() => void) | null = null;

    const initializeNotifications = async () => {
      try {
        await syncNotificationService.initialize();
        
        if (mounted) {
          // Get initial data
          const initialNotifications = syncNotificationService.getNotifications();
          setNotifications(initialNotifications);
          
          const initialHealthMetrics = syncNotificationService.getSyncHealthMetrics();
          setHealthMetrics(initialHealthMetrics);
          
          const initialPreferences = syncNotificationService.getPreferences();
          setPreferences(initialPreferences);
          
          // Setup listeners
          notificationUnsubscribe = syncNotificationService.addNotificationListener((newNotifications) => {
            if (mounted) {
              setNotifications(newNotifications);
            }
          });
          
          healthUnsubscribe = syncNotificationService.addHealthListener((newMetrics) => {
            if (mounted) {
              setHealthMetrics(newMetrics);
            }
          });
          
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Failed to initialize sync notifications:', error);
        if (mounted) {
          setIsInitialized(true);
        }
      }
    };

    initializeNotifications();

    return () => {
      mounted = false;
      if (notificationUnsubscribe) notificationUnsubscribe();
      if (healthUnsubscribe) healthUnsubscribe();
    };
  }, []);

  // Dismiss notification
  const dismissNotification = useCallback(async (notificationId: string) => {
    if (!isInitialized) return;
    await syncNotificationService.dismissNotification(notificationId);
  }, [isInitialized]);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    if (!isInitialized) return;
    await syncNotificationService.clearAllNotifications();
  }, [isInitialized]);

  // Update preferences
  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    if (!isInitialized) return;
    await syncNotificationService.updatePreferences(updates);
    const updatedPreferences = syncNotificationService.getPreferences();
    setPreferences(updatedPreferences);
  }, [isInitialized]);

  // Get unread notifications
  const unreadNotifications = notifications.filter(n => !n.dismissed);

  // Get notifications by type
  const getNotificationsByType = useCallback((type: 'success' | 'failure' | 'warning' | 'info') => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  // Get recent notifications (last 24 hours)
  const getRecentNotifications = useCallback(() => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return notifications.filter(n => n.timestamp > oneDayAgo);
  }, [notifications]);

  return {
    // State
    notifications,
    healthMetrics,
    preferences,
    isInitialized,

    // Actions
    dismissNotification,
    clearAllNotifications,
    updatePreferences,
    getNotificationsByType,
    getRecentNotifications,

    // Computed values
    unreadCount: unreadNotifications.length,
    unreadNotifications,
    hasUnread: unreadNotifications.length > 0,
    successRate: healthMetrics?.successRate || 0,
    consecutiveFailures: healthMetrics?.consecutiveFailures || 0,
    lastSuccessfulSync: healthMetrics?.lastSuccessfulSync || 0,
    
    // Notification counts by type
    successCount: getNotificationsByType('success').length,
    failureCount: getNotificationsByType('failure').length,
    warningCount: getNotificationsByType('warning').length,
    infoCount: getNotificationsByType('info').length,
  };
}

/**
 * React hook for sync health dashboard
 * Provides detailed health metrics and analytics
 */
export function useSyncHealthDashboard() {
  const [healthMetrics, setHealthMetrics] = useState<SyncHealthMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    let healthUnsubscribe: (() => void) | null = null;

    const initializeHealth = async () => {
      try {
        setIsLoading(true);
        
        await syncNotificationService.initialize();
        
        if (mounted) {
          const metrics = syncNotificationService.getSyncHealthMetrics();
          setHealthMetrics(metrics);
          
          // Setup listener for real-time updates
          healthUnsubscribe = syncNotificationService.addHealthListener((newMetrics) => {
            if (mounted) {
              setHealthMetrics(newMetrics);
            }
          });
        }
      } catch (error) {
        console.error('Failed to initialize sync health dashboard:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeHealth();

    return () => {
      mounted = false;
      if (healthUnsubscribe) healthUnsubscribe();
    };
  }, []);

  // Calculate health score (0-100)
  const calculateHealthScore = useCallback(() => {
    if (!healthMetrics) return 0;
    
    let score = 0;
    
    // Success rate (40% weight)
    score += (healthMetrics.successRate / 100) * 40;
    
    // Recent sync activity (20% weight)
    const timeSinceLastSync = Date.now() - healthMetrics.lastSuccessfulSync;
    const daysSinceLastSync = timeSinceLastSync / (24 * 60 * 60 * 1000);
    const recentSyncScore = Math.max(0, 1 - (daysSinceLastSync / 7)); // Decay over 7 days
    score += recentSyncScore * 20;
    
    // Consecutive failures penalty (20% weight)
    const failurePenalty = Math.min(1, healthMetrics.consecutiveFailures / 5);
    score += (1 - failurePenalty) * 20;
    
    // Sync frequency (20% weight)
    const avgDailySync = healthMetrics.syncFrequency.daily;
    const frequencyScore = Math.min(1, avgDailySync / 3); // Optimal: 3+ syncs per day
    score += frequencyScore * 20;
    
    return Math.round(score);
  }, [healthMetrics]);

  // Get health status
  const getHealthStatus = useCallback(() => {
    const score = calculateHealthScore();
    
    if (score >= 90) return { status: 'excellent', color: '#10b981', message: 'Sync is working perfectly' };
    if (score >= 75) return { status: 'good', color: '#3b82f6', message: 'Sync is working well' };
    if (score >= 60) return { status: 'fair', color: '#f59e0b', message: 'Sync has some issues' };
    if (score >= 40) return { status: 'poor', color: '#ef4444', message: 'Sync needs attention' };
    return { status: 'critical', color: '#dc2626', message: 'Sync is failing frequently' };
  }, [calculateHealthScore]);

  // Get top failure reasons
  const getTopFailureReasons = useCallback(() => {
    if (!healthMetrics) return [];
    
    return Object.entries(healthMetrics.failureReasons)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([reason, count]) => ({ reason, count }));
  }, [healthMetrics]);

  // Get network quality insights
  const getNetworkQualityInsights = useCallback(() => {
    if (!healthMetrics) return [];
    
    return Object.entries(healthMetrics.networkQualityImpact)
      .map(([quality, data]) => ({
        quality,
        attempts: data.attempts,
        successRate: Math.round(data.successRate * 100),
      }))
      .sort((a, b) => b.attempts - a.attempts);
  }, [healthMetrics]);

  // Format data usage
  const formatDataUsage = useCallback(() => {
    if (!healthMetrics) return { total: '0 B', average: '0 B' };
    
    const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    return {
      total: formatBytes(healthMetrics.dataUsage.totalBytes),
      average: formatBytes(healthMetrics.dataUsage.averagePerSync),
    };
  }, [healthMetrics]);

  return {
    // State
    healthMetrics,
    isLoading,

    // Computed values
    healthScore: calculateHealthScore(),
    healthStatus: getHealthStatus(),
    topFailureReasons: getTopFailureReasons(),
    networkQualityInsights: getNetworkQualityInsights(),
    dataUsage: formatDataUsage(),
    
    // Quick stats
    successRate: healthMetrics?.successRate || 0,
    averageSyncDuration: healthMetrics?.averageSyncDuration || 0,
    consecutiveFailures: healthMetrics?.consecutiveFailures || 0,
    lastSuccessfulSync: healthMetrics?.lastSuccessfulSync || 0,
    
    // Sync frequency
    dailySyncs: healthMetrics?.syncFrequency.daily || 0,
    weeklySyncs: healthMetrics?.syncFrequency.weekly || 0,
    monthlySyncs: healthMetrics?.syncFrequency.monthly || 0,
  };
}

/**
 * React hook for notification preferences management
 */
export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadPreferences = async () => {
      try {
        setIsLoading(true);
        
        await syncNotificationService.initialize();
        
        if (mounted) {
          const prefs = syncNotificationService.getPreferences();
          setPreferences(prefs);
        }
      } catch (error) {
        console.error('Failed to load notification preferences:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadPreferences();

    return () => {
      mounted = false;
    };
  }, []);

  // Update preferences
  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    if (!preferences) return;
    
    try {
      setIsSaving(true);
      
      await syncNotificationService.updatePreferences(updates);
      const updatedPreferences = syncNotificationService.getPreferences();
      setPreferences(updatedPreferences);
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [preferences]);

  // Reset to defaults
  const resetToDefaults = useCallback(async () => {
    const defaultPreferences: NotificationPreferences = {
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

    await updatePreferences(defaultPreferences);
  }, [updatePreferences]);

  return {
    // State
    preferences,
    isLoading,
    isSaving,

    // Actions
    updatePreferences,
    resetToDefaults,

    // Computed values
    isEnabled: preferences?.enabled || false,
    hasQuietHours: preferences?.quietHours.enabled || false,
    soundEnabled: preferences?.soundEnabled || false,
    vibrationEnabled: preferences?.vibrationEnabled || false,
  };
}
