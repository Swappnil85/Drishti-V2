import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncManager, SyncConflict } from './SyncManager';
import { ErrorHandlingService } from '../ErrorHandlingService';

// Enhanced conflict interfaces
export interface ConflictDiff {
  field: string;
  clientValue: any;
  serverValue: any;
  diffType: 'added' | 'removed' | 'modified' | 'unchanged';
  conflictSeverity: 'low' | 'medium' | 'high' | 'critical';
  suggestedResolution?: 'client' | 'server' | 'merge';
  mergeStrategy?: string;
}

export interface EnhancedSyncConflict extends SyncConflict {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'data' | 'schema' | 'permission' | 'business_rule';
  diffs: ConflictDiff[];
  autoResolvable: boolean;
  suggestedResolution: 'client' | 'server' | 'merge';
  smartMergeSuggestion?: any;
  resolutionHistory: ConflictResolutionHistory[];
  userPattern?: UserResolutionPattern;
  createdAt: number;
  lastModified: number;
  attempts: number;
}

export interface ConflictResolutionHistory {
  timestamp: number;
  resolution: 'client' | 'server' | 'merge' | 'skip';
  resolvedBy: 'user' | 'auto' | 'system';
  mergedData?: any;
  confidence: number; // 0-100
  notes?: string;
}

export interface UserResolutionPattern {
  userId: string;
  conflictType: string;
  preferredResolution: 'client' | 'server' | 'merge';
  confidence: number;
  frequency: number;
  lastUsed: number;
}

export interface BulkResolutionOptions {
  strategy: 'client_wins' | 'server_wins' | 'smart_merge' | 'user_pattern';
  applyToSimilar: boolean;
  conflictTypes?: string[];
  maxConflicts?: number;
  requireConfirmation: boolean;
}

export interface ConflictResolutionStats {
  totalConflicts: number;
  resolvedConflicts: number;
  pendingConflicts: number;
  autoResolvedConflicts: number;
  userResolvedConflicts: number;
  averageResolutionTime: number;
  resolutionSuccessRate: number;
  commonConflictTypes: Array<{ type: string; count: number }>;
  userPatterns: UserResolutionPattern[];
}

/**
 * AdvancedConflictResolutionService provides comprehensive conflict resolution
 * with diff visualization, smart merge suggestions, and bulk resolution
 */
export class AdvancedConflictResolutionService {
  private static instance: AdvancedConflictResolutionService;
  private errorHandler: ErrorHandlingService;
  private conflictListeners: ((conflicts: EnhancedSyncConflict[]) => void)[] = [];
  private resolutionListeners: ((conflict: EnhancedSyncConflict, resolution: string) => void)[] = [];
  private userPatterns: Map<string, UserResolutionPattern> = new Map();
  private isInitialized = false;

  private constructor() {
    this.errorHandler = ErrorHandlingService.getInstance();
  }

  public static getInstance(): AdvancedConflictResolutionService {
    if (!AdvancedConflictResolutionService.instance) {
      AdvancedConflictResolutionService.instance = new AdvancedConflictResolutionService();
    }
    return AdvancedConflictResolutionService.instance;
  }

  /**
   * Initialize the conflict resolution service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load user patterns
      await this.loadUserPatterns();
      
      // Setup sync manager integration
      this.setupSyncManagerIntegration();
      
      this.isInitialized = true;
      console.log('AdvancedConflictResolutionService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AdvancedConflictResolutionService:', error);
      this.errorHandler.handleError(error as Error, {
        context: 'AdvancedConflictResolutionService.initialize',
        severity: 'high',
      });
    }
  }

  /**
   * Setup integration with sync manager
   */
  private setupSyncManagerIntegration(): void {
    // This would integrate with the existing sync manager to intercept conflicts
    // For now, we'll provide methods to enhance existing conflicts
  }

  /**
   * Enhance basic sync conflicts with advanced analysis
   */
  public async enhanceConflicts(basicConflicts: SyncConflict[]): Promise<EnhancedSyncConflict[]> {
    const enhancedConflicts: EnhancedSyncConflict[] = [];

    for (const conflict of basicConflicts) {
      try {
        const enhanced = await this.enhanceConflict(conflict);
        enhancedConflicts.push(enhanced);
      } catch (error) {
        console.error('Failed to enhance conflict:', error);
        // Create a basic enhanced conflict as fallback
        enhancedConflicts.push(this.createBasicEnhancedConflict(conflict));
      }
    }

    return enhancedConflicts;
  }

  /**
   * Enhance a single conflict with advanced analysis
   */
  private async enhanceConflict(conflict: SyncConflict): Promise<EnhancedSyncConflict> {
    // Generate detailed diff analysis
    const diffs = this.generateDiffs(conflict.client_data, conflict.server_data);
    
    // Determine conflict severity and category
    const severity = this.assessConflictSeverity(diffs, conflict);
    const category = this.categorizeConflict(conflict);
    
    // Generate smart merge suggestion
    const smartMergeSuggestion = this.generateSmartMergeSuggestion(conflict, diffs);
    
    // Check if auto-resolvable
    const autoResolvable = this.isAutoResolvable(diffs, severity);
    
    // Get suggested resolution based on patterns and analysis
    const suggestedResolution = await this.getSuggestedResolution(conflict, diffs);
    
    // Get user pattern if available
    const userPattern = await this.getUserPattern(conflict);

    const enhanced: EnhancedSyncConflict = {
      ...conflict,
      id: `enhanced_${conflict.operation_id}`,
      title: this.generateConflictTitle(conflict),
      description: this.generateConflictDescription(conflict, diffs),
      severity,
      category,
      diffs,
      autoResolvable,
      suggestedResolution,
      smartMergeSuggestion,
      resolutionHistory: [],
      userPattern,
      createdAt: Date.now(),
      lastModified: Date.now(),
      attempts: 0,
    };

    return enhanced;
  }

  /**
   * Generate detailed diffs between client and server data
   */
  private generateDiffs(clientData: any, serverData: any): ConflictDiff[] {
    const diffs: ConflictDiff[] = [];
    const allFields = new Set([...Object.keys(clientData || {}), ...Object.keys(serverData || {})]);

    for (const field of allFields) {
      const clientValue = clientData?.[field];
      const serverValue = serverData?.[field];
      
      let diffType: ConflictDiff['diffType'];
      let conflictSeverity: ConflictDiff['conflictSeverity'];
      
      if (clientValue === undefined && serverValue !== undefined) {
        diffType = 'added';
        conflictSeverity = 'low';
      } else if (clientValue !== undefined && serverValue === undefined) {
        diffType = 'removed';
        conflictSeverity = 'medium';
      } else if (clientValue !== serverValue) {
        diffType = 'modified';
        conflictSeverity = this.assessFieldSeverity(field, clientValue, serverValue);
      } else {
        diffType = 'unchanged';
        conflictSeverity = 'low';
        continue; // Skip unchanged fields
      }

      const suggestedResolution = this.suggestFieldResolution(field, clientValue, serverValue, diffType);

      diffs.push({
        field,
        clientValue,
        serverValue,
        diffType,
        conflictSeverity,
        suggestedResolution,
        mergeStrategy: this.getMergeStrategy(field, clientValue, serverValue),
      });
    }

    return diffs;
  }

  /**
   * Assess the severity of a field conflict
   */
  private assessFieldSeverity(field: string, clientValue: any, serverValue: any): ConflictDiff['conflictSeverity'] {
    // Critical fields that should never be auto-resolved
    const criticalFields = ['id', 'user_id', 'account_number', 'balance'];
    if (criticalFields.includes(field)) {
      return 'critical';
    }

    // High severity for important business fields
    const highSeverityFields = ['name', 'amount', 'target_amount', 'due_date'];
    if (highSeverityFields.includes(field)) {
      return 'high';
    }

    // Medium severity for data integrity fields
    const mediumSeverityFields = ['status', 'type', 'category'];
    if (mediumSeverityFields.includes(field)) {
      return 'medium';
    }

    // Check value differences
    if (typeof clientValue === 'number' && typeof serverValue === 'number') {
      const difference = Math.abs(clientValue - serverValue);
      const percentage = difference / Math.max(Math.abs(clientValue), Math.abs(serverValue));
      
      if (percentage > 0.5) return 'high';
      if (percentage > 0.1) return 'medium';
    }

    return 'low';
  }

  /**
   * Suggest resolution for a specific field
   */
  private suggestFieldResolution(
    field: string,
    clientValue: any,
    serverValue: any,
    diffType: ConflictDiff['diffType']
  ): 'client' | 'server' | 'merge' {
    // Timestamp fields - prefer newer
    if (field.includes('updated_at') || field.includes('modified_at')) {
      const clientTime = new Date(clientValue).getTime();
      const serverTime = new Date(serverValue).getTime();
      return clientTime > serverTime ? 'client' : 'server';
    }

    // Balance fields - prefer server (more authoritative)
    if (field === 'balance' || field === 'current_balance') {
      return 'server';
    }

    // User-entered fields - prefer client
    if (field === 'name' || field === 'notes' || field === 'description') {
      return 'client';
    }

    // For additions, prefer client
    if (diffType === 'added') {
      return 'client';
    }

    // Default to merge for complex conflicts
    return 'merge';
  }

  /**
   * Get user resolution pattern for conflict type
   */
  private async getUserPattern(conflict: SyncConflict): Promise<UserResolutionPattern | undefined> {
    const patternKey = `${conflict.table}_${conflict.conflict_type}`;
    return this.userPatterns.get(patternKey);
  }

  /**
   * Generate conflict title
   */
  private generateConflictTitle(conflict: SyncConflict): string {
    const tableDisplayName = conflict.table.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

    switch (conflict.conflict_type) {
      case 'update_conflict':
        return `${tableDisplayName} Update Conflict`;
      case 'delete_conflict':
        return `${tableDisplayName} Deletion Conflict`;
      case 'create_conflict':
        return `${tableDisplayName} Creation Conflict`;
      default:
        return `${tableDisplayName} Sync Conflict`;
    }
  }

  /**
   * Generate conflict description
   */
  private generateConflictDescription(conflict: SyncConflict, diffs: ConflictDiff[]): string {
    const diffCount = diffs.length;
    const criticalDiffs = diffs.filter(d => d.conflictSeverity === 'critical').length;

    let description = `This ${conflict.table} record has ${diffCount} conflicting field${diffCount > 1 ? 's' : ''}.`;

    if (criticalDiffs > 0) {
      description += ` ${criticalDiffs} critical field${criticalDiffs > 1 ? 's' : ''} require${criticalDiffs === 1 ? 's' : ''} your attention.`;
    }

    return description;
  }

  /**
   * Create basic enhanced conflict as fallback
   */
  private createBasicEnhancedConflict(conflict: SyncConflict): EnhancedSyncConflict {
    return {
      ...conflict,
      id: `basic_${conflict.operation_id}`,
      title: this.generateConflictTitle(conflict),
      description: 'A sync conflict occurred that requires resolution.',
      severity: 'medium',
      category: 'data',
      diffs: [],
      autoResolvable: false,
      suggestedResolution: 'server',
      resolutionHistory: [],
      createdAt: Date.now(),
      lastModified: Date.now(),
      attempts: 0,
    };
  }

  /**
   * Resolve enhanced conflict
   */
  public async resolveConflict(
    conflict: EnhancedSyncConflict,
    resolution: 'client' | 'server' | 'merge',
    mergedData?: any,
    resolvedBy: 'user' | 'auto' = 'user'
  ): Promise<void> {
    try {
      // Record resolution in history
      const resolutionRecord: ConflictResolutionHistory = {
        timestamp: Date.now(),
        resolution,
        resolvedBy,
        mergedData,
        confidence: resolvedBy === 'auto' ? 0.8 : 1.0,
        notes: resolvedBy === 'auto' ? 'Automatically resolved based on patterns' : undefined,
      };

      conflict.resolutionHistory.push(resolutionRecord);
      conflict.attempts++;

      // Update user patterns
      await this.updateUserPattern(conflict, resolution);

      // Resolve using existing sync manager
      await syncManager.resolveConflict(conflict.operation_id, resolution, mergedData);

      // Notify listeners
      this.notifyResolutionListeners(conflict, resolution);

      console.log(`Enhanced conflict ${conflict.id} resolved with ${resolution} strategy`);
    } catch (error) {
      console.error('Failed to resolve enhanced conflict:', error);
      throw error;
    }
  }

  /**
   * Bulk resolve conflicts
   */
  public async bulkResolveConflicts(
    conflicts: EnhancedSyncConflict[],
    options: BulkResolutionOptions
  ): Promise<{
    resolved: number;
    failed: number;
    skipped: number;
    errors: string[];
  }> {
    const results = {
      resolved: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    };

    const conflictsToResolve = options.maxConflicts
      ? conflicts.slice(0, options.maxConflicts)
      : conflicts;

    for (const conflict of conflictsToResolve) {
      try {
        // Skip if conflict type not included
        if (options.conflictTypes && !options.conflictTypes.includes(conflict.conflict_type)) {
          results.skipped++;
          continue;
        }

        // Determine resolution strategy
        let resolution: 'client' | 'server' | 'merge';
        let mergedData: any = undefined;

        switch (options.strategy) {
          case 'client_wins':
            resolution = 'client';
            break;
          case 'server_wins':
            resolution = 'server';
            break;
          case 'smart_merge':
            resolution = 'merge';
            mergedData = conflict.smartMergeSuggestion;
            break;
          case 'user_pattern':
            resolution = conflict.userPattern?.preferredResolution || conflict.suggestedResolution;
            if (resolution === 'merge') {
              mergedData = conflict.smartMergeSuggestion;
            }
            break;
        }

        await this.resolveConflict(conflict, resolution, mergedData, 'auto');
        results.resolved++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to resolve conflict ${conflict.id}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Auto-resolve conflicts based on patterns and rules
   */
  public async autoResolveConflicts(conflicts: EnhancedSyncConflict[]): Promise<{
    resolved: EnhancedSyncConflict[];
    remaining: EnhancedSyncConflict[];
  }> {
    const resolved: EnhancedSyncConflict[] = [];
    const remaining: EnhancedSyncConflict[] = [];

    for (const conflict of conflicts) {
      if (conflict.autoResolvable && conflict.severity !== 'critical') {
        try {
          const resolution = conflict.suggestedResolution;
          const mergedData = resolution === 'merge' ? conflict.smartMergeSuggestion : undefined;

          await this.resolveConflict(conflict, resolution, mergedData, 'auto');
          resolved.push(conflict);
        } catch (error) {
          console.error(`Failed to auto-resolve conflict ${conflict.id}:`, error);
          remaining.push(conflict);
        }
      } else {
        remaining.push(conflict);
      }
    }

    return { resolved, remaining };
  }

  /**
   * Update user resolution pattern
   */
  private async updateUserPattern(
    conflict: EnhancedSyncConflict,
    resolution: 'client' | 'server' | 'merge'
  ): Promise<void> {
    const patternKey = `${conflict.table}_${conflict.conflict_type}`;
    const existing = this.userPatterns.get(patternKey);

    if (existing) {
      // Update existing pattern
      existing.frequency++;
      existing.lastUsed = Date.now();

      // Adjust confidence based on consistency
      if (existing.preferredResolution === resolution) {
        existing.confidence = Math.min(1.0, existing.confidence + 0.1);
      } else {
        existing.confidence = Math.max(0.1, existing.confidence - 0.2);
        if (existing.confidence < 0.5) {
          existing.preferredResolution = resolution;
        }
      }
    } else {
      // Create new pattern
      const newPattern: UserResolutionPattern = {
        userId: 'current_user', // Would get from auth context
        conflictType: patternKey,
        preferredResolution: resolution,
        confidence: 0.6,
        frequency: 1,
        lastUsed: Date.now(),
      };

      this.userPatterns.set(patternKey, newPattern);
    }

    // Save patterns
    await this.saveUserPatterns();
  }

  /**
   * Get conflict resolution statistics
   */
  public async getConflictStats(): Promise<ConflictResolutionStats> {
    try {
      const allConflicts = await this.getAllStoredConflicts();
      const resolvedConflicts = allConflicts.filter(c => c.resolutionHistory.length > 0);
      const pendingConflicts = allConflicts.filter(c => c.resolutionHistory.length === 0);
      const autoResolvedConflicts = resolvedConflicts.filter(c =>
        c.resolutionHistory.some(h => h.resolvedBy === 'auto')
      );

      // Calculate average resolution time
      const resolutionTimes = resolvedConflicts
        .map(c => c.resolutionHistory[0]?.timestamp - c.createdAt)
        .filter(time => time > 0);
      const averageResolutionTime = resolutionTimes.length > 0
        ? resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length
        : 0;

      // Count conflict types
      const conflictTypeCounts = new Map<string, number>();
      allConflicts.forEach(c => {
        const count = conflictTypeCounts.get(c.conflict_type) || 0;
        conflictTypeCounts.set(c.conflict_type, count + 1);
      });

      const commonConflictTypes = Array.from(conflictTypeCounts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      return {
        totalConflicts: allConflicts.length,
        resolvedConflicts: resolvedConflicts.length,
        pendingConflicts: pendingConflicts.length,
        autoResolvedConflicts: autoResolvedConflicts.length,
        userResolvedConflicts: resolvedConflicts.length - autoResolvedConflicts.length,
        averageResolutionTime,
        resolutionSuccessRate: allConflicts.length > 0 ? resolvedConflicts.length / allConflicts.length : 0,
        commonConflictTypes,
        userPatterns: Array.from(this.userPatterns.values()),
      };
    } catch (error) {
      console.error('Failed to get conflict stats:', error);
      throw error;
    }
  }

  /**
   * Get all stored conflicts
   */
  private async getAllStoredConflicts(): Promise<EnhancedSyncConflict[]> {
    try {
      const stored = await AsyncStorage.getItem('enhanced_conflicts');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get stored conflicts:', error);
      return [];
    }
  }

  /**
   * Store enhanced conflicts
   */
  public async storeConflicts(conflicts: EnhancedSyncConflict[]): Promise<void> {
    try {
      await AsyncStorage.setItem('enhanced_conflicts', JSON.stringify(conflicts));
    } catch (error) {
      console.error('Failed to store enhanced conflicts:', error);
    }
  }

  /**
   * Load user patterns from storage
   */
  private async loadUserPatterns(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('user_resolution_patterns');
      if (stored) {
        const patterns: UserResolutionPattern[] = JSON.parse(stored);
        this.userPatterns.clear();
        patterns.forEach(pattern => {
          this.userPatterns.set(pattern.conflictType, pattern);
        });
      }
    } catch (error) {
      console.error('Failed to load user patterns:', error);
    }
  }

  /**
   * Save user patterns to storage
   */
  private async saveUserPatterns(): Promise<void> {
    try {
      const patterns = Array.from(this.userPatterns.values());
      await AsyncStorage.setItem('user_resolution_patterns', JSON.stringify(patterns));
    } catch (error) {
      console.error('Failed to save user patterns:', error);
    }
  }

  /**
   * Add conflict listener
   */
  public addConflictListener(listener: (conflicts: EnhancedSyncConflict[]) => void): () => void {
    this.conflictListeners.push(listener);

    return () => {
      const index = this.conflictListeners.indexOf(listener);
      if (index > -1) {
        this.conflictListeners.splice(index, 1);
      }
    };
  }

  /**
   * Add resolution listener
   */
  public addResolutionListener(
    listener: (conflict: EnhancedSyncConflict, resolution: string) => void
  ): () => void {
    this.resolutionListeners.push(listener);

    return () => {
      const index = this.resolutionListeners.indexOf(listener);
      if (index > -1) {
        this.resolutionListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify conflict listeners
   */
  private notifyConflictListeners(conflicts: EnhancedSyncConflict[]): void {
    this.conflictListeners.forEach(listener => {
      try {
        listener(conflicts);
      } catch (error) {
        console.error('Conflict listener error:', error);
      }
    });
  }

  /**
   * Notify resolution listeners
   */
  private notifyResolutionListeners(conflict: EnhancedSyncConflict, resolution: string): void {
    this.resolutionListeners.forEach(listener => {
      try {
        listener(conflict, resolution);
      } catch (error) {
        console.error('Resolution listener error:', error);
      }
    });
  }

  /**
   * Clear resolved conflicts older than specified days
   */
  public async clearOldConflicts(daysOld: number = 30): Promise<number> {
    try {
      const allConflicts = await this.getAllStoredConflicts();
      const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

      const activeConflicts = allConflicts.filter(conflict => {
        // Keep unresolved conflicts
        if (conflict.resolutionHistory.length === 0) return true;

        // Keep recently resolved conflicts
        const lastResolution = Math.max(...conflict.resolutionHistory.map(h => h.timestamp));
        return lastResolution > cutoffTime;
      });

      const clearedCount = allConflicts.length - activeConflicts.length;

      if (clearedCount > 0) {
        await this.storeConflicts(activeConflicts);
      }

      return clearedCount;
    } catch (error) {
      console.error('Failed to clear old conflicts:', error);
      return 0;
    }
  }

  /**
   * Export conflict data for analysis
   */
  public async exportConflictData(): Promise<{
    conflicts: EnhancedSyncConflict[];
    patterns: UserResolutionPattern[];
    stats: ConflictResolutionStats;
  }> {
    const conflicts = await this.getAllStoredConflicts();
    const patterns = Array.from(this.userPatterns.values());
    const stats = await this.getConflictStats();

    return { conflicts, patterns, stats };
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.conflictListeners = [];
    this.resolutionListeners = [];
    this.userPatterns.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const advancedConflictResolutionService = AdvancedConflictResolutionService.getInstance();

  /**
   * Get merge strategy for a field
   */
  private getMergeStrategy(field: string, clientValue: any, serverValue: any): string {
    if (typeof clientValue === 'string' && typeof serverValue === 'string') {
      return 'string_merge';
    }
    
    if (typeof clientValue === 'number' && typeof serverValue === 'number') {
      return 'numeric_average';
    }
    
    if (Array.isArray(clientValue) && Array.isArray(serverValue)) {
      return 'array_union';
    }
    
    if (typeof clientValue === 'object' && typeof serverValue === 'object') {
      return 'object_merge';
    }
    
    return 'manual_selection';
  }

  /**
   * Assess overall conflict severity
   */
  private assessConflictSeverity(diffs: ConflictDiff[], conflict: SyncConflict): EnhancedSyncConflict['severity'] {
    const criticalDiffs = diffs.filter(d => d.conflictSeverity === 'critical');
    const highDiffs = diffs.filter(d => d.conflictSeverity === 'high');
    
    if (criticalDiffs.length > 0) return 'critical';
    if (highDiffs.length > 2) return 'high';
    if (highDiffs.length > 0) return 'medium';
    return 'low';
  }

  /**
   * Categorize conflict type
   */
  private categorizeConflict(conflict: SyncConflict): EnhancedSyncConflict['category'] {
    // Analyze the conflict to determine category
    if (conflict.conflict_type === 'delete_conflict') {
      return 'business_rule';
    }
    
    // Check for schema-related conflicts
    if (conflict.table.includes('_schema') || conflict.table.includes('_meta')) {
      return 'schema';
    }
    
    // Check for permission-related conflicts
    if (conflict.client_data?.user_id !== conflict.server_data?.user_id) {
      return 'permission';
    }
    
    return 'data';
  }

  /**
   * Generate smart merge suggestion
   */
  private generateSmartMergeSuggestion(conflict: SyncConflict, diffs: ConflictDiff[]): any {
    const merged = { ...conflict.server_data };
    
    for (const diff of diffs) {
      switch (diff.suggestedResolution) {
        case 'client':
          merged[diff.field] = diff.clientValue;
          break;
        case 'server':
          merged[diff.field] = diff.serverValue;
          break;
        case 'merge':
          merged[diff.field] = this.performFieldMerge(diff);
          break;
      }
    }
    
    return merged;
  }

  /**
   * Perform field-level merge
   */
  private performFieldMerge(diff: ConflictDiff): any {
    switch (diff.mergeStrategy) {
      case 'string_merge':
        return `${diff.clientValue} | ${diff.serverValue}`;
      case 'numeric_average':
        return (diff.clientValue + diff.serverValue) / 2;
      case 'array_union':
        return [...new Set([...diff.clientValue, ...diff.serverValue])];
      case 'object_merge':
        return { ...diff.serverValue, ...diff.clientValue };
      default:
        return diff.clientValue; // Default to client value
    }
  }

  /**
   * Check if conflict is auto-resolvable
   */
  private isAutoResolvable(diffs: ConflictDiff[], severity: EnhancedSyncConflict['severity']): boolean {
    // Never auto-resolve critical conflicts
    if (severity === 'critical') return false;
    
    // Don't auto-resolve if there are too many high-severity diffs
    const highSeverityDiffs = diffs.filter(d => d.conflictSeverity === 'high');
    if (highSeverityDiffs.length > 1) return false;
    
    // Auto-resolve if all diffs have clear suggestions
    return diffs.every(d => d.suggestedResolution !== undefined);
  }

  /**
   * Get suggested resolution based on patterns and analysis
   */
  private async getSuggestedResolution(
    conflict: SyncConflict,
    diffs: ConflictDiff[]
  ): Promise<'client' | 'server' | 'merge'> {
    // Check user patterns first
    const userPattern = await this.getUserPattern(conflict);
    if (userPattern && userPattern.confidence > 0.7) {
      return userPattern.preferredResolution;
    }
    
    // Analyze diffs for suggestion
    const clientSuggestions = diffs.filter(d => d.suggestedResolution === 'client').length;
    const serverSuggestions = diffs.filter(d => d.suggestedResolution === 'server').length;
    const mergeSuggestions = diffs.filter(d => d.suggestedResolution === 'merge').length;
    
    if (clientSuggestions > serverSuggestions && clientSuggestions > mergeSuggestions) {
      return 'client';
    }
    
    if (serverSuggestions > mergeSuggestions) {
      return 'server';
    }
    
    return 'merge';
  }
