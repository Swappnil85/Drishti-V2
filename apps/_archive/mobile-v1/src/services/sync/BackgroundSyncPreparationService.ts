import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../../database';
import { Q } from '@nozbe/watermelondb';
import { syncManager } from './SyncManager';
import { ErrorHandlingService } from '../ErrorHandlingService';

// Background sync preparation interfaces
export interface OfflinePreparationData {
  id: string;
  dataType: 'accounts' | 'goals' | 'transactions' | 'calculations' | 'settings';
  data: any;
  metadata: {
    preparedAt: number;
    expiresAt: number;
    priority: 'low' | 'normal' | 'high' | 'critical';
    estimatedSize: number;
    dependencies: string[];
  };
  status: 'preparing' | 'ready' | 'expired' | 'error';
  lastAccessed?: number;
  accessCount: number;
}

export interface PreparationStrategy {
  enabled: boolean;
  dataTypes: string[];
  maxCacheSize: number; // MB
  maxCacheAge: number; // hours
  preparationTriggers: {
    onNetworkChange: boolean;
    onAppForeground: boolean;
    onUserActivity: boolean;
    scheduled: boolean;
    scheduleInterval: number; // minutes
  };
  priorityRules: {
    recentlyAccessed: number; // weight
    frequentlyUsed: number; // weight
    userPreferences: number; // weight
    dataImportance: number; // weight
  };
}

export interface PreparationStats {
  totalPreparedData: number;
  cacheHitRate: number;
  averagePreparationTime: number;
  offlineAccessImprovement: number; // percentage
  storageUsed: number; // MB
  lastPreparationTime: number;
  preparationHistory: Array<{
    timestamp: number;
    dataType: string;
    success: boolean;
    duration: number;
    size: number;
  }>;
}

/**
 * BackgroundSyncPreparationService prepares data for offline use while online
 * Intelligently caches frequently accessed data and user preferences
 */
export class BackgroundSyncPreparationService {
  private static instance: BackgroundSyncPreparationService;
  private errorHandler: ErrorHandlingService;
  private preparationData: Map<string, OfflinePreparationData> = new Map();
  private preparationStrategy: PreparationStrategy;
  private isInitialized = false;
  private preparationTimer: NodeJS.Timeout | null = null;
  private preparationListeners: ((data: OfflinePreparationData[]) => void)[] =
    [];

  private constructor() {
    this.errorHandler = ErrorHandlingService.getInstance();
    this.initializePreparationStrategy();
  }

  public static getInstance(): BackgroundSyncPreparationService {
    if (!BackgroundSyncPreparationService.instance) {
      BackgroundSyncPreparationService.instance =
        new BackgroundSyncPreparationService();
    }
    return BackgroundSyncPreparationService.instance;
  }

  /**
   * Initialize the background sync preparation service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load existing preparation data
      await this.loadPreparationData();

      // Load preparation strategy
      await this.loadPreparationStrategy();

      // Setup preparation triggers
      this.setupPreparationTriggers();

      // Start scheduled preparation
      if (this.preparationStrategy.preparationTriggers.scheduled) {
        this.startScheduledPreparation();
      }

      this.isInitialized = true;
      console.log('BackgroundSyncPreparationService initialized successfully');
    } catch (error) {
      console.error(
        'Failed to initialize BackgroundSyncPreparationService:',
        error
      );
      this.errorHandler.handleError(error as Error, {
        context: 'BackgroundSyncPreparationService.initialize',
        severity: 'high',
      });
    }
  }

  /**
   * Initialize default preparation strategy
   */
  private initializePreparationStrategy(): void {
    this.preparationStrategy = {
      enabled: true,
      dataTypes: [
        'accounts',
        'goals',
        'transactions',
        'calculations',
        'settings',
      ],
      maxCacheSize: 50, // 50 MB
      maxCacheAge: 24, // 24 hours
      preparationTriggers: {
        onNetworkChange: true,
        onAppForeground: true,
        onUserActivity: false,
        scheduled: true,
        scheduleInterval: 60, // 1 hour
      },
      priorityRules: {
        recentlyAccessed: 0.4,
        frequentlyUsed: 0.3,
        userPreferences: 0.2,
        dataImportance: 0.1,
      },
    };
  }

  /**
   * Setup preparation triggers
   */
  private setupPreparationTriggers(): void {
    // Network change trigger
    if (this.preparationStrategy.preparationTriggers.onNetworkChange) {
      // TODO: Setup network listener without circular dependency
      // This will be handled by the EnhancedSyncManager when it initializes
      console.log(
        'Network change trigger setup deferred to avoid circular dependency'
      );
    }

    // App foreground trigger would be handled by app state changes
    // User activity trigger would be handled by user interaction events
  }

  /**
   * Start scheduled preparation
   */
  private startScheduledPreparation(): void {
    if (this.preparationTimer) {
      clearInterval(this.preparationTimer);
    }

    const interval =
      this.preparationStrategy.preparationTriggers.scheduleInterval * 60 * 1000;
    this.preparationTimer = setInterval(async () => {
      await this.performBackgroundPreparation();
    }, interval);
  }

  /**
   * Perform background preparation of offline data
   */
  public async performBackgroundPreparation(): Promise<void> {
    if (!this.preparationStrategy.enabled) return;

    try {
      console.log('Starting background sync preparation...');
      const startTime = Date.now();

      // Clean up expired data first
      await this.cleanupExpiredData();

      // Determine what data to prepare based on priority
      const preparationPlan = await this.createPreparationPlan();

      // Prepare data according to plan
      for (const item of preparationPlan) {
        try {
          await this.prepareDataItem(item);
        } catch (error) {
          console.error(`Failed to prepare ${item.dataType}:`, error);
        }
      }

      // Save updated preparation data
      await this.savePreparationData();

      // Notify listeners
      this.notifyPreparationListeners();

      const duration = Date.now() - startTime;
      console.log(`Background preparation completed in ${duration}ms`);
    } catch (error) {
      console.error('Background preparation failed:', error);
      this.errorHandler.handleError(error as Error, {
        context:
          'BackgroundSyncPreparationService.performBackgroundPreparation',
        severity: 'medium',
      });
    }
  }

  /**
   * Create preparation plan based on priority rules
   */
  private async createPreparationPlan(): Promise<
    Array<{ dataType: string; priority: number }>
  > {
    const plan: Array<{ dataType: string; priority: number }> = [];

    for (const dataType of this.preparationStrategy.dataTypes) {
      const priority = await this.calculateDataPriority(dataType);
      plan.push({ dataType, priority });
    }

    // Sort by priority (highest first)
    plan.sort((a, b) => b.priority - a.priority);

    // Limit by cache size constraints
    return this.filterByStorageConstraints(plan);
  }

  /**
   * Calculate priority for a data type
   */
  private async calculateDataPriority(dataType: string): Promise<number> {
    const rules = this.preparationStrategy.priorityRules;
    let priority = 0;

    // Recently accessed weight
    const recentAccess = await this.getRecentAccessScore(dataType);
    priority += recentAccess * rules.recentlyAccessed;

    // Frequently used weight
    const frequencyScore = await this.getFrequencyScore(dataType);
    priority += frequencyScore * rules.frequentlyUsed;

    // User preferences weight
    const preferenceScore = await this.getUserPreferenceScore(dataType);
    priority += preferenceScore * rules.userPreferences;

    // Data importance weight
    const importanceScore = this.getDataImportanceScore(dataType);
    priority += importanceScore * rules.dataImportance;

    return Math.min(1.0, Math.max(0.0, priority));
  }

  /**
   * Get recent access score for data type
   */
  private async getRecentAccessScore(dataType: string): Promise<number> {
    try {
      const accessHistory = await AsyncStorage.getItem(
        `access_history_${dataType}`
      );
      if (!accessHistory) return 0.1;

      const history = JSON.parse(accessHistory);
      const recentAccesses = history.filter(
        (timestamp: number) => Date.now() - timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
      );

      return Math.min(1.0, recentAccesses.length / 10); // Normalize to 0-1
    } catch (error) {
      return 0.1;
    }
  }

  /**
   * Get frequency score for data type
   */
  private async getFrequencyScore(dataType: string): Promise<number> {
    try {
      const usageStats = await AsyncStorage.getItem(`usage_stats_${dataType}`);
      if (!usageStats) return 0.1;

      const stats = JSON.parse(usageStats);
      const averageDaily =
        stats.totalAccesses / Math.max(1, stats.daysSinceFirstUse);

      return Math.min(1.0, averageDaily / 20); // Normalize to 0-1
    } catch (error) {
      return 0.1;
    }
  }

  /**
   * Get user preference score for data type
   */
  private async getUserPreferenceScore(dataType: string): Promise<number> {
    try {
      const preferences = await AsyncStorage.getItem('user_data_preferences');
      if (!preferences) return 0.5;

      const prefs = JSON.parse(preferences);
      return prefs[dataType] || 0.5;
    } catch (error) {
      return 0.5;
    }
  }

  /**
   * Get data importance score
   */
  private getDataImportanceScore(dataType: string): number {
    const importanceMap: Record<string, number> = {
      accounts: 0.9,
      goals: 0.8,
      transactions: 0.7,
      calculations: 0.6,
      settings: 0.5,
    };

    return importanceMap[dataType] || 0.5;
  }

  /**
   * Filter plan by storage constraints
   */
  private filterByStorageConstraints(
    plan: Array<{ dataType: string; priority: number }>
  ): Array<{ dataType: string; priority: number }> {
    const maxSize = this.preparationStrategy.maxCacheSize * 1024 * 1024; // Convert to bytes
    let currentSize = 0;
    const filteredPlan: Array<{ dataType: string; priority: number }> = [];

    for (const item of plan) {
      const estimatedSize = this.estimateDataSize(item.dataType);
      if (currentSize + estimatedSize <= maxSize) {
        filteredPlan.push(item);
        currentSize += estimatedSize;
      }
    }

    return filteredPlan;
  }

  /**
   * Estimate data size for a data type
   */
  private estimateDataSize(dataType: string): number {
    const sizeEstimates: Record<string, number> = {
      accounts: 1024 * 100, // 100KB
      goals: 1024 * 50, // 50KB
      transactions: 1024 * 200, // 200KB
      calculations: 1024 * 30, // 30KB
      settings: 1024 * 10, // 10KB
    };

    return sizeEstimates[dataType] || 1024 * 50;
  }

  /**
   * Prepare specific data item
   */
  private async prepareDataItem(item: {
    dataType: string;
    priority: number;
  }): Promise<void> {
    const startTime = Date.now();

    try {
      let data: any;

      switch (item.dataType) {
        case 'accounts':
          data = await this.prepareAccountsData();
          break;
        case 'goals':
          data = await this.prepareGoalsData();
          break;
        case 'transactions':
          data = await this.prepareTransactionsData();
          break;
        case 'calculations':
          data = await this.prepareCalculationsData();
          break;
        case 'settings':
          data = await this.prepareSettingsData();
          break;
        default:
          throw new Error(`Unknown data type: ${item.dataType}`);
      }

      const preparationData: OfflinePreparationData = {
        id: `prep_${item.dataType}_${Date.now()}`,
        dataType: item.dataType as any,
        data,
        metadata: {
          preparedAt: Date.now(),
          expiresAt:
            Date.now() + this.preparationStrategy.maxCacheAge * 60 * 60 * 1000,
          priority:
            item.priority > 0.8
              ? 'critical'
              : item.priority > 0.6
                ? 'high'
                : item.priority > 0.4
                  ? 'normal'
                  : 'low',
          estimatedSize: JSON.stringify(data).length,
          dependencies: this.getDataDependencies(item.dataType),
        },
        status: 'ready',
        accessCount: 0,
      };

      this.preparationData.set(preparationData.id, preparationData);

      const duration = Date.now() - startTime;
      console.log(`Prepared ${item.dataType} data in ${duration}ms`);
    } catch (error) {
      console.error(`Failed to prepare ${item.dataType}:`, error);
      throw error;
    }
  }

  /**
   * Prepare accounts data
   */
  private async prepareAccountsData(): Promise<any> {
    const accountsCollection = database.get('financial_accounts');
    const accounts = await accountsCollection
      .query(Q.where('is_active', true))
      .fetch();

    return accounts.map(account => ({
      id: account.id,
      name: account.name,
      accountType: account.accountType,
      balance: account.balance,
      institution: account.institution,
      currency: account.currency,
      isActive: account.isActive,
      updatedAt: account.updatedAt,
    }));
  }

  /**
   * Prepare goals data
   */
  private async prepareGoalsData(): Promise<any> {
    const goalsCollection = database.get('financial_goals');
    const goals = await goalsCollection
      .query(Q.where('is_active', true))
      .fetch();

    return goals.map(goal => ({
      id: goal.id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      targetDate: goal.targetDate,
      category: goal.category,
      priority: goal.priority,
      isActive: goal.isActive,
      updatedAt: goal.updatedAt,
    }));
  }

  /**
   * Prepare transactions data (recent transactions)
   */
  private async prepareTransactionsData(): Promise<any> {
    // Prepare recent transactions (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // This would query transactions if we had a transactions table
    // For now, return mock recent transaction data
    return {
      recentTransactions: [],
      summary: {
        totalIncome: 0,
        totalExpenses: 0,
        netFlow: 0,
        transactionCount: 0,
      },
      categories: {},
    };
  }

  /**
   * Prepare calculations data (common calculations)
   */
  private async prepareCalculationsData(): Promise<any> {
    return {
      compoundInterestTemplates: [
        { principal: 1000, rate: 0.05, time: 10, compound: 12 },
        { principal: 5000, rate: 0.07, time: 20, compound: 12 },
        { principal: 10000, rate: 0.06, time: 15, compound: 12 },
      ],
      savingsGoalTemplates: [
        { targetAmount: 10000, monthlyContribution: 500, interestRate: 0.04 },
        { targetAmount: 50000, monthlyContribution: 1000, interestRate: 0.05 },
      ],
      retirementCalculationDefaults: {
        currentAge: 30,
        retirementAge: 65,
        currentSavings: 10000,
        monthlyContribution: 500,
        expectedReturn: 0.07,
      },
    };
  }

  /**
   * Prepare settings data
   */
  private async prepareSettingsData(): Promise<any> {
    try {
      const settings = await AsyncStorage.getItem('user_settings');
      return settings ? JSON.parse(settings) : {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Get data dependencies
   */
  private getDataDependencies(dataType: string): string[] {
    const dependencyMap: Record<string, string[]> = {
      accounts: [],
      goals: ['accounts'],
      transactions: ['accounts'],
      calculations: ['accounts', 'goals'],
      settings: [],
    };

    return dependencyMap[dataType] || [];
  }

  /**
   * Clean up expired data
   */
  private async cleanupExpiredData(): Promise<void> {
    const now = Date.now();
    const expiredIds: string[] = [];

    for (const [id, data] of this.preparationData.entries()) {
      if (data.metadata.expiresAt < now) {
        expiredIds.push(id);
      }
    }

    for (const id of expiredIds) {
      this.preparationData.delete(id);
    }

    if (expiredIds.length > 0) {
      console.log(`Cleaned up ${expiredIds.length} expired preparation items`);
    }
  }

  /**
   * Get prepared data for offline use
   */
  public async getPreparedData(dataType: string): Promise<any | null> {
    // Find the most recent prepared data for this type
    let latestData: OfflinePreparationData | null = null;

    for (const data of this.preparationData.values()) {
      if (data.dataType === dataType && data.status === 'ready') {
        if (
          !latestData ||
          data.metadata.preparedAt > latestData.metadata.preparedAt
        ) {
          latestData = data;
        }
      }
    }

    if (latestData) {
      // Update access statistics
      latestData.lastAccessed = Date.now();
      latestData.accessCount++;

      // Record access for future priority calculations
      await this.recordDataAccess(dataType);

      return latestData.data;
    }

    return null;
  }

  /**
   * Record data access for priority calculations
   */
  private async recordDataAccess(dataType: string): Promise<void> {
    try {
      const key = `access_history_${dataType}`;
      const existing = await AsyncStorage.getItem(key);
      const history = existing ? JSON.parse(existing) : [];

      history.push(Date.now());

      // Keep only last 100 accesses
      if (history.length > 100) {
        history.splice(0, history.length - 100);
      }

      await AsyncStorage.setItem(key, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to record data access:', error);
    }
  }

  /**
   * Get preparation statistics
   */
  public async getPreparationStats(): Promise<PreparationStats> {
    const totalPreparedData = this.preparationData.size;
    const storageUsed =
      Array.from(this.preparationData.values()).reduce(
        (sum, data) => sum + data.metadata.estimatedSize,
        0
      ) /
      (1024 * 1024); // Convert to MB

    // Calculate cache hit rate (simplified)
    const cacheHitRate = 0.75; // Would be calculated from actual usage statistics

    return {
      totalPreparedData,
      cacheHitRate,
      averagePreparationTime: 500, // Would be calculated from preparation history
      offlineAccessImprovement: 60, // Would be calculated from performance metrics
      storageUsed,
      lastPreparationTime: Math.max(
        ...Array.from(this.preparationData.values()).map(
          d => d.metadata.preparedAt
        ),
        0
      ),
      preparationHistory: [], // Would be loaded from storage
    };
  }

  /**
   * Update preparation strategy
   */
  public async updatePreparationStrategy(
    updates: Partial<PreparationStrategy>
  ): Promise<void> {
    this.preparationStrategy = { ...this.preparationStrategy, ...updates };
    await this.savePreparationStrategy();

    // Restart scheduled preparation if interval changed
    if (
      updates.preparationTriggers?.scheduled !== undefined ||
      updates.preparationTriggers?.scheduleInterval
    ) {
      if (this.preparationStrategy.preparationTriggers.scheduled) {
        this.startScheduledPreparation();
      } else if (this.preparationTimer) {
        clearInterval(this.preparationTimer);
        this.preparationTimer = null;
      }
    }
  }

  /**
   * Load preparation data from storage
   */
  private async loadPreparationData(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('background_preparation_data');
      if (stored) {
        const data: OfflinePreparationData[] = JSON.parse(stored);
        this.preparationData.clear();
        data.forEach(item => this.preparationData.set(item.id, item));
      }
    } catch (error) {
      console.error('Failed to load preparation data:', error);
    }
  }

  /**
   * Save preparation data to storage
   */
  private async savePreparationData(): Promise<void> {
    try {
      const data = Array.from(this.preparationData.values());
      await AsyncStorage.setItem(
        'background_preparation_data',
        JSON.stringify(data)
      );
    } catch (error) {
      console.error('Failed to save preparation data:', error);
    }
  }

  /**
   * Load preparation strategy from storage
   */
  private async loadPreparationStrategy(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(
        'background_preparation_strategy'
      );
      if (stored) {
        const strategy = JSON.parse(stored);
        this.preparationStrategy = { ...this.preparationStrategy, ...strategy };
      }
    } catch (error) {
      console.error('Failed to load preparation strategy:', error);
    }
  }

  /**
   * Save preparation strategy to storage
   */
  private async savePreparationStrategy(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        'background_preparation_strategy',
        JSON.stringify(this.preparationStrategy)
      );
    } catch (error) {
      console.error('Failed to save preparation strategy:', error);
    }
  }

  /**
   * Add preparation listener
   */
  public addPreparationListener(
    listener: (data: OfflinePreparationData[]) => void
  ): () => void {
    this.preparationListeners.push(listener);

    return () => {
      const index = this.preparationListeners.indexOf(listener);
      if (index > -1) {
        this.preparationListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify preparation listeners
   */
  private notifyPreparationListeners(): void {
    const data = Array.from(this.preparationData.values());
    this.preparationListeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Preparation listener error:', error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    if (this.preparationTimer) {
      clearInterval(this.preparationTimer);
      this.preparationTimer = null;
    }

    this.preparationListeners = [];
    this.preparationData.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const backgroundSyncPreparationService =
  BackgroundSyncPreparationService.getInstance();
