import { useState, useEffect, useCallback } from 'react';
import { 
  advancedConflictResolutionService, 
  EnhancedSyncConflict, 
  BulkResolutionOptions,
  ConflictResolutionStats,
  UserResolutionPattern 
} from '../services/sync/AdvancedConflictResolutionService';
import { syncManager, SyncConflict } from '../services/sync/SyncManager';

/**
 * React hook for advanced conflict resolution functionality
 * Provides enhanced conflict management with diff visualization and smart resolution
 */
export function useAdvancedConflictResolution() {
  const [conflicts, setConflicts] = useState<EnhancedSyncConflict[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionStats, setResolutionStats] = useState<ConflictResolutionStats | null>(null);
  const [userPatterns, setUserPatterns] = useState<UserResolutionPattern[]>([]);

  useEffect(() => {
    let mounted = true;

    const initializeService = async () => {
      try {
        // Initialize the advanced conflict resolution service
        await advancedConflictResolutionService.initialize();

        if (mounted) {
          // Load existing conflicts
          await loadConflicts();
          
          // Load resolution stats
          await loadResolutionStats();
          
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Failed to initialize advanced conflict resolution:', error);
        if (mounted) {
          setIsInitialized(true);
        }
      }
    };

    initializeService();

    // Subscribe to conflict updates
    const unsubscribeConflicts = advancedConflictResolutionService.addConflictListener((newConflicts) => {
      if (mounted) {
        setConflicts(newConflicts);
      }
    });

    // Subscribe to resolution updates
    const unsubscribeResolutions = advancedConflictResolutionService.addResolutionListener(async (conflict, resolution) => {
      if (mounted) {
        // Refresh conflicts and stats after resolution
        await loadConflicts();
        await loadResolutionStats();
      }
    });

    return () => {
      mounted = false;
      unsubscribeConflicts();
      unsubscribeResolutions();
    };
  }, []);

  // Load conflicts from storage
  const loadConflicts = useCallback(async () => {
    try {
      // Get basic conflicts from sync manager
      const basicConflicts = await syncManager.getStoredConflicts();
      
      // Enhance conflicts with advanced analysis
      const enhancedConflicts = await advancedConflictResolutionService.enhanceConflicts(basicConflicts);
      
      setConflicts(enhancedConflicts);
    } catch (error) {
      console.error('Failed to load conflicts:', error);
    }
  }, []);

  // Load resolution statistics
  const loadResolutionStats = useCallback(async () => {
    try {
      const stats = await advancedConflictResolutionService.getConflictStats();
      setResolutionStats(stats);
      setUserPatterns(stats.userPatterns);
    } catch (error) {
      console.error('Failed to load resolution stats:', error);
    }
  }, []);

  // Resolve individual conflict
  const resolveConflict = useCallback(async (
    conflict: EnhancedSyncConflict,
    resolution: 'client' | 'server' | 'merge',
    mergedData?: any
  ) => {
    try {
      setIsResolving(true);
      await advancedConflictResolutionService.resolveConflict(conflict, resolution, mergedData, 'user');
      
      // Remove resolved conflict from local state
      setConflicts(prev => prev.filter(c => c.id !== conflict.id));
      
      // Refresh stats
      await loadResolutionStats();
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      throw error;
    } finally {
      setIsResolving(false);
    }
  }, [loadResolutionStats]);

  // Bulk resolve conflicts
  const bulkResolveConflicts = useCallback(async (
    conflictsToResolve: EnhancedSyncConflict[],
    options: BulkResolutionOptions
  ) => {
    try {
      setIsResolving(true);
      const result = await advancedConflictResolutionService.bulkResolveConflicts(conflictsToResolve, options);
      
      // Remove resolved conflicts from local state
      const resolvedIds = new Set(conflictsToResolve.slice(0, result.resolved).map(c => c.id));
      setConflicts(prev => prev.filter(c => !resolvedIds.has(c.id)));
      
      // Refresh stats
      await loadResolutionStats();
      
      return result;
    } catch (error) {
      console.error('Failed to bulk resolve conflicts:', error);
      throw error;
    } finally {
      setIsResolving(false);
    }
  }, [loadResolutionStats]);

  // Auto-resolve conflicts
  const autoResolveConflicts = useCallback(async (conflictsToResolve: EnhancedSyncConflict[]) => {
    try {
      setIsResolving(true);
      const result = await advancedConflictResolutionService.autoResolveConflicts(conflictsToResolve);
      
      // Remove resolved conflicts from local state
      const resolvedIds = new Set(result.resolved.map(c => c.id));
      setConflicts(prev => prev.filter(c => !resolvedIds.has(c.id)));
      
      // Refresh stats
      await loadResolutionStats();
      
      return result;
    } catch (error) {
      console.error('Failed to auto-resolve conflicts:', error);
      throw error;
    } finally {
      setIsResolving(false);
    }
  }, [loadResolutionStats]);

  // Refresh conflicts from sync manager
  const refreshConflicts = useCallback(async () => {
    await loadConflicts();
  }, [loadConflicts]);

  // Clear old resolved conflicts
  const clearOldConflicts = useCallback(async (daysOld: number = 30) => {
    try {
      const clearedCount = await advancedConflictResolutionService.clearOldConflicts(daysOld);
      
      if (clearedCount > 0) {
        await loadConflicts();
        await loadResolutionStats();
      }
      
      return clearedCount;
    } catch (error) {
      console.error('Failed to clear old conflicts:', error);
      throw error;
    }
  }, [loadConflicts, loadResolutionStats]);

  // Export conflict data
  const exportConflictData = useCallback(async () => {
    try {
      return await advancedConflictResolutionService.exportConflictData();
    } catch (error) {
      console.error('Failed to export conflict data:', error);
      throw error;
    }
  }, []);

  // Get conflicts by category
  const getConflictsByCategory = useCallback(() => {
    const categories = {
      data: conflicts.filter(c => c.category === 'data'),
      schema: conflicts.filter(c => c.category === 'schema'),
      permission: conflicts.filter(c => c.category === 'permission'),
      business_rule: conflicts.filter(c => c.category === 'business_rule'),
    };
    
    return categories;
  }, [conflicts]);

  // Get conflicts by severity
  const getConflictsBySeverity = useCallback(() => {
    const severities = {
      critical: conflicts.filter(c => c.severity === 'critical'),
      high: conflicts.filter(c => c.severity === 'high'),
      medium: conflicts.filter(c => c.severity === 'medium'),
      low: conflicts.filter(c => c.severity === 'low'),
    };
    
    return severities;
  }, [conflicts]);

  // Get auto-resolvable conflicts
  const getAutoResolvableConflicts = useCallback(() => {
    return conflicts.filter(c => c.autoResolvable);
  }, [conflicts]);

  // Get conflict resolution recommendations
  const getResolutionRecommendations = useCallback(() => {
    const recommendations: string[] = [];
    
    const criticalConflicts = conflicts.filter(c => c.severity === 'critical').length;
    const autoResolvable = conflicts.filter(c => c.autoResolvable).length;
    const totalConflicts = conflicts.length;
    
    if (criticalConflicts > 0) {
      recommendations.push(`${criticalConflicts} critical conflicts require immediate attention`);
    }
    
    if (autoResolvable > 0) {
      recommendations.push(`${autoResolvable} conflicts can be automatically resolved`);
    }
    
    if (totalConflicts > 10) {
      recommendations.push('Consider using bulk resolution for efficiency');
    }
    
    // Pattern-based recommendations
    const patternRecommendations = userPatterns
      .filter(p => p.confidence > 0.8)
      .map(p => `You typically choose "${p.preferredResolution}" for ${p.conflictType} conflicts`);
    
    recommendations.push(...patternRecommendations);
    
    return recommendations;
  }, [conflicts, userPatterns]);

  return {
    // State
    conflicts,
    isInitialized,
    isResolving,
    resolutionStats,
    userPatterns,

    // Actions
    resolveConflict,
    bulkResolveConflicts,
    autoResolveConflicts,
    refreshConflicts,
    clearOldConflicts,
    exportConflictData,

    // Computed values
    conflictsByCategory: getConflictsByCategory(),
    conflictsBySeverity: getConflictsBySeverity(),
    autoResolvableConflicts: getAutoResolvableConflicts(),
    resolutionRecommendations: getResolutionRecommendations(),
    
    // Statistics
    totalConflicts: conflicts.length,
    criticalConflicts: conflicts.filter(c => c.severity === 'critical').length,
    autoResolvableCount: conflicts.filter(c => c.autoResolvable).length,
    hasConflicts: conflicts.length > 0,
    hasCriticalConflicts: conflicts.some(c => c.severity === 'critical'),
    averageResolutionTime: resolutionStats?.averageResolutionTime || 0,
    resolutionSuccessRate: resolutionStats?.resolutionSuccessRate || 0,
  };
}

/**
 * React hook for conflict resolution statistics and analytics
 */
export function useConflictResolutionStats() {
  const [stats, setStats] = useState<ConflictResolutionStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const conflictStats = await advancedConflictResolutionService.getConflictStats();
      setStats(conflictStats);
    } catch (error) {
      console.error('Failed to load conflict resolution stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const refreshStats = useCallback(async () => {
    await loadStats();
  }, [loadStats]);

  return {
    stats,
    isLoading,
    refreshStats,
    
    // Computed values
    totalConflicts: stats?.totalConflicts || 0,
    resolvedConflicts: stats?.resolvedConflicts || 0,
    pendingConflicts: stats?.pendingConflicts || 0,
    autoResolvedConflicts: stats?.autoResolvedConflicts || 0,
    userResolvedConflicts: stats?.userResolvedConflicts || 0,
    averageResolutionTime: stats?.averageResolutionTime || 0,
    resolutionSuccessRate: stats?.resolutionSuccessRate || 0,
    commonConflictTypes: stats?.commonConflictTypes || [],
    userPatterns: stats?.userPatterns || [],
  };
}
