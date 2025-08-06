/**
 * Financial Calculation Service
 * Mobile-side calculation service with offline capabilities and real-time updates
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  financialCalculationEngine,
  CompoundInterestParams,
  FutureValueResult,
  AccountProjectionParams,
  AccountProjectionResult,
  MonteCarloParams,
  MonteCarloResult,
  FIRECalculationParams,
  FIRECalculationResult,
  FIRENumberCalculationParams,
  FIRENumberCalculationResult,
  SavingsRateCalculationParams,
  SavingsRateCalculationResult,
  GoalBasedPlanningParams,
  GoalBasedPlanningResult,
  BudgetAdjustmentParams,
  BudgetAdjustmentResult,
  DebtPayoffParams,
  DebtPayoffResult,
  GoalProjectionParams,
  GoalProjectionResult,
  CoastFIRECalculationParams,
  CoastFIRECalculationResult,
  BaristaFIRECalculationParams,
  BaristaFIRECalculationResult,
  MarketScenarioParams,
  MarketScenarioResult,
  MarketStressTestParams,
  MarketStressTestResult,
  CalculationResponse,
  BatchCalculationRequest,
  BatchCalculationResponse,
} from '@drishti/shared';
import { database } from '../../database';
import { Q } from '@nozbe/watermelondb';

// Cache configuration
const CACHE_PREFIX = 'calculation_cache_';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_ENTRIES = 100;

// Calculation request queue for offline support
interface QueuedCalculation {
  id: string;
  type: string;
  params: any;
  timestamp: number;
  priority: 'low' | 'normal' | 'high' | 'realtime';
  retryCount: number;
  maxRetries: number;
}

export class CalculationService {
  private calculationQueue: QueuedCalculation[] = [];
  private isProcessingQueue = false;
  private subscribers: Map<string, (result: any) => void> = new Map();

  constructor() {
    this.loadQueueFromStorage();
    this.startQueueProcessor();
  }

  /**
   * Calculate compound interest with caching
   */
  async calculateCompoundInterest(
    params: CompoundInterestParams,
    useCache: boolean = true
  ): Promise<CalculationResponse<FutureValueResult>> {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey('compound_interest', params);

    try {
      // Check cache first if enabled
      if (useCache) {
        const cached = await this.getFromCache(cacheKey);
        if (cached) {
          return {
            success: true,
            data: cached,
            executionTime: performance.now() - startTime,
            cacheHit: true,
            metadata: {
              calculationType: 'compound_interest',
              timestamp: new Date().toISOString(),
              version: '1.0.0',
              confidence: 1.0,
            },
          };
        }
      }

      // Perform calculation
      const result =
        financialCalculationEngine.calculateCompoundInterestDetailed(params);

      // Cache the result
      if (useCache) {
        await this.setCache(cacheKey, result);
      }

      const executionTime = performance.now() - startTime;

      return {
        success: true,
        data: result,
        executionTime,
        cacheHit: false,
        metadata: {
          calculationType: 'compound_interest',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          confidence: 1.0,
        },
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;

      return {
        success: false,
        error: error.message,
        executionTime,
        cacheHit: false,
        metadata: {
          calculationType: 'compound_interest',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          confidence: 0,
        },
      };
    }
  }

  /**
   * Run Monte Carlo simulation with progress updates
   */
  async runMonteCarloSimulation(
    params: MonteCarloParams,
    useCache: boolean = true,
    progressCallback?: (progress: number) => void
  ): Promise<CalculationResponse<MonteCarloResult>> {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey('monte_carlo', params);

    try {
      // Check cache first if enabled
      if (useCache) {
        const cached = await this.getFromCache(cacheKey);
        if (cached) {
          progressCallback?.(100);
          return {
            success: true,
            data: cached,
            executionTime: performance.now() - startTime,
            cacheHit: true,
            metadata: {
              calculationType: 'monte_carlo',
              timestamp: new Date().toISOString(),
              version: '1.0.0',
              confidence: 0.95,
            },
          };
        }
      }

      // Simulate progress for long-running calculations
      if (progressCallback) {
        const progressInterval = setInterval(() => {
          const elapsed = performance.now() - startTime;
          const estimatedTotal = params.iterations * 0.1; // Rough estimate
          const progress = Math.min(95, (elapsed / estimatedTotal) * 100);
          progressCallback(progress);
        }, 100);

        // Clear interval after calculation
        setTimeout(() => clearInterval(progressInterval), 30000);
      }

      // Perform calculation
      const result = financialCalculationEngine.runMonteCarloSimulation(params);

      // Cache the result
      if (useCache) {
        await this.setCache(cacheKey, result);
      }

      progressCallback?.(100);
      const executionTime = performance.now() - startTime;

      return {
        success: true,
        data: result,
        executionTime,
        cacheHit: false,
        metadata: {
          calculationType: 'monte_carlo',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          confidence: 0.95,
        },
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;

      return {
        success: false,
        error: error.message,
        executionTime,
        cacheHit: false,
        metadata: {
          calculationType: 'monte_carlo',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          confidence: 0,
        },
      };
    }
  }

  /**
   * Calculate FIRE projections with user data integration
   */
  async calculateFIREProjections(
    userId: string,
    customParams?: Partial<FIRECalculationParams>,
    useCache: boolean = true
  ): Promise<CalculationResponse<FIRECalculationResult>> {
    const startTime = performance.now();

    try {
      // Get user profile data
      const userProfile = await database
        .get('user_profiles')
        .query(Q.where('user_id', userId))
        .fetch();

      if (userProfile.length === 0) {
        throw new Error('User profile not found');
      }

      const profile = userProfile[0];

      // Build FIRE calculation parameters from user data
      const params: FIRECalculationParams = {
        currentAge: profile.age || 30,
        currentSavings: profile.currentSavings || 0,
        monthlyIncome: profile.monthlyIncome || 0,
        monthlyExpenses: profile.monthlyExpenses || 0,
        expectedReturn: profile.expectedReturn || 0.07,
        inflationRate: profile.inflationRate || 0.03,
        withdrawalRate: profile.withdrawalRate || 0.04,
        ...customParams, // Override with custom parameters
      };

      const cacheKey = this.generateCacheKey('fire_calculation', {
        userId,
        ...params,
      });

      // Check cache first if enabled
      if (useCache) {
        const cached = await this.getFromCache(cacheKey);
        if (cached) {
          return {
            success: true,
            data: cached,
            executionTime: performance.now() - startTime,
            cacheHit: true,
            metadata: {
              calculationType: 'fire_calculation',
              timestamp: new Date().toISOString(),
              version: '1.0.0',
              confidence: 1.0,
            },
          };
        }
      }

      // Perform calculation
      const result =
        financialCalculationEngine.calculateFIREProjections(params);

      // Cache the result
      if (useCache) {
        await this.setCache(cacheKey, result);
      }

      const executionTime = performance.now() - startTime;

      return {
        success: true,
        data: result,
        executionTime,
        cacheHit: false,
        metadata: {
          calculationType: 'fire_calculation',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          confidence: 1.0,
        },
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;

      return {
        success: false,
        error: error.message,
        executionTime,
        cacheHit: false,
        metadata: {
          calculationType: 'fire_calculation',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          confidence: 0,
        },
      };
    }
  }

  /**
   * Subscribe to real-time calculation updates
   */
  subscribe(subscriptionId: string, callback: (result: any) => void): void {
    this.subscribers.set(subscriptionId, callback);
  }

  /**
   * Unsubscribe from calculation updates
   */
  unsubscribe(subscriptionId: string): void {
    this.subscribers.delete(subscriptionId);
  }

  /**
   * Queue calculation for offline processing
   */
  async queueCalculation(
    type: string,
    params: any,
    priority: 'low' | 'normal' | 'high' | 'realtime' = 'normal'
  ): Promise<string> {
    const calculationId = `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const queuedCalculation: QueuedCalculation = {
      id: calculationId,
      type,
      params,
      timestamp: Date.now(),
      priority,
      retryCount: 0,
      maxRetries: 3,
    };

    this.calculationQueue.push(queuedCalculation);

    // Sort queue by priority and timestamp
    this.calculationQueue.sort((a, b) => {
      const priorityOrder = { realtime: 0, high: 1, normal: 2, low: 3 };
      const priorityDiff =
        priorityOrder[a.priority] - priorityOrder[b.priority];
      return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
    });

    await this.saveQueueToStorage();

    if (!this.isProcessingQueue) {
      this.processQueue();
    }

    return calculationId;
  }

  /**
   * Cache management methods
   */
  private generateCacheKey(type: string, params: any): string {
    return `${CACHE_PREFIX}${type}_${JSON.stringify(params)}`;
  }

  private async getFromCache(key: string): Promise<any | null> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);

      // Check if cache has expired
      if (Date.now() - timestamp > CACHE_EXPIRY) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  }

  private async setCache(key: string, data: any): Promise<void> {
    try {
      const cacheEntry = {
        data,
        timestamp: Date.now(),
      };

      await AsyncStorage.setItem(key, JSON.stringify(cacheEntry));

      // Clean up old cache entries if we exceed the limit
      await this.cleanupCache();
    } catch (error) {
      console.error('Error writing to cache:', error);
    }
  }

  private async cleanupCache(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith(CACHE_PREFIX));

      if (cacheKeys.length > MAX_CACHE_ENTRIES) {
        // Get cache entries with timestamps
        const cacheEntries = await Promise.all(
          cacheKeys.map(async key => {
            const cached = await AsyncStorage.getItem(key);
            const { timestamp } = cached
              ? JSON.parse(cached)
              : { timestamp: 0 };
            return { key, timestamp };
          })
        );

        // Sort by timestamp and remove oldest entries
        cacheEntries.sort((a, b) => a.timestamp - b.timestamp);
        const keysToRemove = cacheEntries
          .slice(0, cacheEntries.length - MAX_CACHE_ENTRIES)
          .map(entry => entry.key);

        await AsyncStorage.multiRemove(keysToRemove);
      }
    } catch (error) {
      console.error('Error cleaning up cache:', error);
    }
  }

  /**
   * Clear all calculation cache
   */
  async clearCache(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Queue processing methods
   */
  private async loadQueueFromStorage(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem('calculation_queue');
      if (queueData) {
        this.calculationQueue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error('Error loading queue from storage:', error);
    }
  }

  private async saveQueueToStorage(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        'calculation_queue',
        JSON.stringify(this.calculationQueue)
      );
    } catch (error) {
      console.error('Error saving queue to storage:', error);
    }
  }

  private startQueueProcessor(): void {
    // Process queue every 30 seconds
    setInterval(() => {
      if (!this.isProcessingQueue && this.calculationQueue.length > 0) {
        this.processQueue();
      }
    }, 30000);
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.calculationQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (this.calculationQueue.length > 0) {
        const calculation = this.calculationQueue.shift()!;

        try {
          let result: any;

          switch (calculation.type) {
            case 'compound_interest':
              result = await this.calculateCompoundInterest(
                calculation.params,
                false
              );
              break;
            case 'monte_carlo':
              result = await this.runMonteCarloSimulation(
                calculation.params,
                false
              );
              break;
            case 'fire_number':
              result = financialCalculationEngine.calculateFIRENumber(
                calculation.params
              );
              break;
            case 'expense_fire':
              result = financialCalculationEngine.calculateExpenseBasedFIRE(
                calculation.params
              );
              break;
            case 'healthcare_projections':
              result =
                financialCalculationEngine.calculateHealthcareCostProjections(
                  calculation.params
                );
              break;
            case 'savings_rate':
              result = financialCalculationEngine.calculateRequiredSavingsRate(
                calculation.params
              );
              break;
            case 'goal_planning':
              result = financialCalculationEngine.calculateGoalBasedPlanning(
                calculation.params
              );
              break;
            case 'budget_adjustment':
              result = financialCalculationEngine.calculateBudgetAdjustments(
                calculation.params
              );
              break;
            case 'coast_fire':
              result = financialCalculationEngine.calculateCoastFIREAnalysis(
                calculation.params
              );
              break;
            case 'barista_fire':
              result = financialCalculationEngine.calculateBaristaFIREAnalysis(
                calculation.params
              );
              break;
            case 'market_volatility':
              result =
                financialCalculationEngine.calculateMarketVolatilityScenarios(
                  calculation.params
                );
              break;
            case 'market_stress_test':
              result = financialCalculationEngine.calculateMarketStressTest(
                calculation.params
              );
              break;
            default:
              throw new Error(
                `Unsupported calculation type: ${calculation.type}`
              );
          }

          // Notify subscribers if any
          this.subscribers.forEach(callback => callback(result));
        } catch (error) {
          calculation.retryCount++;

          if (calculation.retryCount < calculation.maxRetries) {
            // Re-queue for retry
            this.calculationQueue.push(calculation);
          } else {
            console.error(
              `Failed to process calculation ${calculation.id} after ${calculation.maxRetries} retries:`,
              error
            );
          }
        }
      }
    } finally {
      this.isProcessingQueue = false;
      await this.saveQueueToStorage();
    }
  }

  /**
   * Calculate FIRE number based on expenses (Story 2)
   */
  async calculateFIRENumber(
    params: FIRENumberCalculationParams,
    options: {
      priority?: 'low' | 'normal' | 'high';
      useCache?: boolean;
      timeout?: number;
    } = {}
  ): Promise<FIRENumberCalculationResult> {
    const { priority = 'normal', useCache = true, timeout = 10000 } = options;

    try {
      // Check cache first
      if (useCache) {
        const cacheKey = `fire_number_${JSON.stringify(params)}`;
        const cached = await this.getCachedResult(cacheKey);
        if (cached) {
          this.notifySubscribers('fire_number', cached);
          return cached;
        }
      }

      // Add to queue for processing
      const calculationPromise = new Promise<FIRENumberCalculationResult>(
        (resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('FIRE calculation timeout'));
          }, timeout);

          this.calculationQueue.push({
            id: Date.now().toString(),
            type: 'fire_number',
            params,
            priority,
            resolve: result => {
              clearTimeout(timeoutId);
              resolve(result);
            },
            reject: error => {
              clearTimeout(timeoutId);
              reject(error);
            },
          });

          this.processQueue();
        }
      );

      const result = await calculationPromise;

      // Cache the result
      if (useCache) {
        const cacheKey = `fire_number_${JSON.stringify(params)}`;
        await this.setCachedResult(cacheKey, result);
      }

      // Notify subscribers
      this.notifySubscribers('fire_number', result);

      return result;
    } catch (error) {
      console.error('FIRE number calculation failed:', error);
      throw error;
    }
  }

  /**
   * Calculate expense-based FIRE with category analysis
   */
  async calculateExpenseBasedFIRE(
    params: {
      expenseCategories: Array<{
        category: string;
        monthlyAmount: number;
        inflationRate: number;
        essential: boolean;
        geographicSensitive: boolean;
      }>;
      geographicLocation?: string;
      costOfLivingIndex?: number;
      withdrawalRate?: number;
      projectionYears?: number;
    },
    options: {
      priority?: 'low' | 'normal' | 'high';
      useCache?: boolean;
      timeout?: number;
    } = {}
  ): Promise<any> {
    const { priority = 'normal', useCache = true, timeout = 8000 } = options;

    try {
      // Check cache first
      if (useCache) {
        const cacheKey = `expense_fire_${JSON.stringify(params)}`;
        const cached = await this.getCachedResult(cacheKey);
        if (cached) {
          this.notifySubscribers('expense_fire', cached);
          return cached;
        }
      }

      // Add to queue for processing
      const calculationPromise = new Promise<any>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Expense FIRE calculation timeout'));
        }, timeout);

        this.calculationQueue.push({
          id: Date.now().toString(),
          type: 'expense_fire',
          params,
          priority,
          resolve: result => {
            clearTimeout(timeoutId);
            resolve(result);
          },
          reject: error => {
            clearTimeout(timeoutId);
            reject(error);
          },
        });

        this.processQueue();
      });

      const result = await calculationPromise;

      // Cache the result
      if (useCache) {
        const cacheKey = `expense_fire_${JSON.stringify(params)}`;
        await this.setCachedResult(cacheKey, result);
      }

      // Notify subscribers
      this.notifySubscribers('expense_fire', result);

      return result;
    } catch (error) {
      console.error('Expense-based FIRE calculation failed:', error);
      throw error;
    }
  }

  /**
   * Calculate healthcare cost projections for early retirement
   */
  async calculateHealthcareCostProjections(
    params: {
      currentAge: number;
      retirementAge: number;
      currentHealthcareCost: number;
      healthcareInflationRate?: number;
      employerCoverage?: any;
      marketplacePlans?: any[];
      medicareAge?: number;
      chronicConditions?: any[];
      emergencyFund?: number;
    },
    options: {
      priority?: 'low' | 'normal' | 'high';
      useCache?: boolean;
      timeout?: number;
    } = {}
  ): Promise<any> {
    const { priority = 'normal', useCache = true, timeout = 5000 } = options;

    try {
      // Check cache first
      if (useCache) {
        const cacheKey = `healthcare_${JSON.stringify(params)}`;
        const cached = await this.getCachedResult(cacheKey);
        if (cached) {
          this.notifySubscribers('healthcare_projections', cached);
          return cached;
        }
      }

      // Add to queue for processing
      const calculationPromise = new Promise<any>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Healthcare calculation timeout'));
        }, timeout);

        this.calculationQueue.push({
          id: Date.now().toString(),
          type: 'healthcare_projections',
          params,
          priority,
          resolve: result => {
            clearTimeout(timeoutId);
            resolve(result);
          },
          reject: error => {
            clearTimeout(timeoutId);
            reject(error);
          },
        });

        this.processQueue();
      });

      const result = await calculationPromise;

      // Cache the result
      if (useCache) {
        const cacheKey = `healthcare_${JSON.stringify(params)}`;
        await this.setCachedResult(cacheKey, result);
      }

      // Notify subscribers
      this.notifySubscribers('healthcare_projections', result);

      return result;
    } catch (error) {
      console.error('Healthcare cost projection failed:', error);
      throw error;
    }
  }

  /**
   * Calculate required savings rate to reach financial goals (Story 3)
   */
  async calculateRequiredSavingsRate(
    params: SavingsRateCalculationParams,
    options: {
      priority?: 'low' | 'normal' | 'high';
      useCache?: boolean;
      timeout?: number;
    } = {}
  ): Promise<SavingsRateCalculationResult> {
    const { priority = 'normal', useCache = true, timeout = 30000 } = options;

    try {
      // Check cache first
      if (useCache) {
        const cacheKey = `savings_rate_${JSON.stringify(params)}`;
        const cachedResult = await this.getCachedResult(cacheKey);
        if (cachedResult) {
          this.notifySubscribers('savings_rate', cachedResult);
          return cachedResult;
        }
      }

      // Add to queue for processing
      const calculationPromise = new Promise<SavingsRateCalculationResult>(
        (resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Savings rate calculation timeout'));
          }, timeout);

          this.calculationQueue.push({
            id: Date.now().toString(),
            type: 'savings_rate',
            params,
            priority,
            resolve: result => {
              clearTimeout(timeoutId);
              resolve(result);
            },
            reject: error => {
              clearTimeout(timeoutId);
              reject(error);
            },
          });

          this.processQueue();
        }
      );

      const result = await calculationPromise;

      // Cache the result
      if (useCache) {
        const cacheKey = `savings_rate_${JSON.stringify(params)}`;
        await this.setCachedResult(cacheKey, result);
      }

      // Notify subscribers
      this.notifySubscribers('savings_rate', result);

      return result;
    } catch (error) {
      console.error('Savings rate calculation failed:', error);
      throw error;
    }
  }

  /**
   * Calculate goal-based financial planning
   */
  async calculateGoalBasedPlanning(
    params: GoalBasedPlanningParams,
    options: {
      priority?: 'low' | 'normal' | 'high';
      useCache?: boolean;
      timeout?: number;
    } = {}
  ): Promise<GoalBasedPlanningResult> {
    const { priority = 'normal', useCache = true, timeout = 20000 } = options;

    try {
      // Check cache first
      if (useCache) {
        const cacheKey = `goal_planning_${JSON.stringify(params)}`;
        const cachedResult = await this.getCachedResult(cacheKey);
        if (cachedResult) {
          this.notifySubscribers('goal_planning', cachedResult);
          return cachedResult;
        }
      }

      // Add to queue for processing
      const calculationPromise = new Promise<GoalBasedPlanningResult>(
        (resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Goal planning calculation timeout'));
          }, timeout);

          this.calculationQueue.push({
            id: Date.now().toString(),
            type: 'goal_planning',
            params,
            priority,
            resolve: result => {
              clearTimeout(timeoutId);
              resolve(result);
            },
            reject: error => {
              clearTimeout(timeoutId);
              reject(error);
            },
          });

          this.processQueue();
        }
      );

      const result = await calculationPromise;

      // Cache the result
      if (useCache) {
        const cacheKey = `goal_planning_${JSON.stringify(params)}`;
        await this.setCachedResult(cacheKey, result);
      }

      // Notify subscribers
      this.notifySubscribers('goal_planning', result);

      return result;
    } catch (error) {
      console.error('Goal planning calculation failed:', error);
      throw error;
    }
  }

  /**
   * Calculate budget adjustments and recommendations
   */
  async calculateBudgetAdjustments(
    params: BudgetAdjustmentParams,
    options: {
      priority?: 'low' | 'normal' | 'high';
      useCache?: boolean;
      timeout?: number;
    } = {}
  ): Promise<BudgetAdjustmentResult> {
    const { priority = 'normal', useCache = true, timeout = 15000 } = options;

    try {
      // Check cache first
      if (useCache) {
        const cacheKey = `budget_adjustment_${JSON.stringify(params)}`;
        const cachedResult = await this.getCachedResult(cacheKey);
        if (cachedResult) {
          this.notifySubscribers('budget_adjustment', cachedResult);
          return cachedResult;
        }
      }

      // Add to queue for processing
      const calculationPromise = new Promise<BudgetAdjustmentResult>(
        (resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Budget adjustment calculation timeout'));
          }, timeout);

          this.calculationQueue.push({
            id: Date.now().toString(),
            type: 'budget_adjustment',
            params,
            priority,
            resolve: result => {
              clearTimeout(timeoutId);
              resolve(result);
            },
            reject: error => {
              clearTimeout(timeoutId);
              reject(error);
            },
          });

          this.processQueue();
        }
      );

      const result = await calculationPromise;

      // Cache the result
      if (useCache) {
        const cacheKey = `budget_adjustment_${JSON.stringify(params)}`;
        await this.setCachedResult(cacheKey, result);
      }

      // Notify subscribers
      this.notifySubscribers('budget_adjustment', result);

      return result;
    } catch (error) {
      console.error('Budget adjustment calculation failed:', error);
      throw error;
    }
  }

  /**
   * Get calculation statistics
   */
  async getCalculationStats(): Promise<{
    cacheSize: number;
    queueSize: number;
    subscriberCount: number;
  }> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith(CACHE_PREFIX));

      return {
        cacheSize: cacheKeys.length,
        queueSize: this.calculationQueue.length,
        subscriberCount: this.subscribers.size,
      };
    } catch (error) {
      console.error('Error getting calculation stats:', error);
      return {
        cacheSize: 0,
        queueSize: this.calculationQueue.length,
        subscriberCount: this.subscribers.size,
      };
    }
  }

  /**
   * Calculate Coast FIRE analysis with offline support
   * Epic 7, Story 4: Coast FIRE Calculations
   */
  async calculateCoastFIRE(
    params: CoastFIRECalculationParams,
    options: {
      priority?: 'low' | 'normal' | 'high';
      useCache?: boolean;
      timeout?: number;
    } = {}
  ): Promise<CoastFIRECalculationResult> {
    const { priority = 'normal', useCache = true, timeout = 30000 } = options;

    try {
      // Check cache first
      if (useCache) {
        const cacheKey = `coast_fire_${JSON.stringify(params)}`;
        const cachedResult = await this.getCachedResult(cacheKey);
        if (cachedResult) {
          return cachedResult;
        }
      }

      // Add to queue for processing
      const calculationPromise = new Promise<CoastFIRECalculationResult>(
        (resolve, reject) => {
          const queueItem = {
            id: `coast_fire_${Date.now()}_${Math.random()}`,
            type: 'coast_fire',
            params,
            priority,
            resolve,
            reject,
          };

          // Insert based on priority
          if (priority === 'high') {
            this.calculationQueue.unshift(queueItem);
          } else {
            this.calculationQueue.push(queueItem);
          }

          // Process queue
          this.processQueue();
        }
      );

      // Apply timeout
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Coast FIRE calculation timeout')),
          timeout
        )
      );

      const result = await Promise.race([calculationPromise, timeoutPromise]);

      // Cache the result
      if (useCache) {
        const cacheKey = `coast_fire_${JSON.stringify(params)}`;
        await this.setCachedResult(cacheKey, result);
      }

      // Notify subscribers
      this.notifySubscribers('coast_fire', result);

      return result;
    } catch (error) {
      console.error('Coast FIRE calculation failed:', error);
      throw error;
    }
  }

  /**
   * Calculate Barista FIRE analysis with offline support
   * Epic 7, Story 4: Barista FIRE Calculations
   */
  async calculateBaristaFIRE(
    params: BaristaFIRECalculationParams,
    options: {
      priority?: 'low' | 'normal' | 'high';
      useCache?: boolean;
      timeout?: number;
    } = {}
  ): Promise<BaristaFIRECalculationResult> {
    const { priority = 'normal', useCache = true, timeout = 30000 } = options;

    try {
      // Check cache first
      if (useCache) {
        const cacheKey = `barista_fire_${JSON.stringify(params)}`;
        const cachedResult = await this.getCachedResult(cacheKey);
        if (cachedResult) {
          return cachedResult;
        }
      }

      // Add to queue for processing
      const calculationPromise = new Promise<BaristaFIRECalculationResult>(
        (resolve, reject) => {
          const queueItem = {
            id: `barista_fire_${Date.now()}_${Math.random()}`,
            type: 'barista_fire',
            params,
            priority,
            resolve,
            reject,
          };

          // Insert based on priority
          if (priority === 'high') {
            this.calculationQueue.unshift(queueItem);
          } else {
            this.calculationQueue.push(queueItem);
          }

          // Process queue
          this.processQueue();
        }
      );

      // Apply timeout
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Barista FIRE calculation timeout')),
          timeout
        )
      );

      const result = await Promise.race([calculationPromise, timeoutPromise]);

      // Cache the result
      if (useCache) {
        const cacheKey = `barista_fire_${JSON.stringify(params)}`;
        await this.setCachedResult(cacheKey, result);
      }

      // Notify subscribers
      this.notifySubscribers('barista_fire', result);

      return result;
    } catch (error) {
      console.error('Barista FIRE calculation failed:', error);
      throw error;
    }
  }

  /**
   * Calculate market volatility scenarios with offline support
   * Epic 7, Story 5: Market Volatility & Downturn Modeling
   */
  async calculateMarketVolatility(
    params: MarketScenarioParams,
    options: {
      priority?: 'low' | 'normal' | 'high';
      useCache?: boolean;
      timeout?: number;
    } = {}
  ): Promise<MarketScenarioResult> {
    const { priority = 'normal', useCache = true, timeout = 45000 } = options;

    try {
      // Check cache first
      if (useCache) {
        const cacheKey = `market_volatility_${JSON.stringify(params)}`;
        const cachedResult = await this.getCachedResult(cacheKey);
        if (cachedResult) {
          return cachedResult;
        }
      }

      // Add to queue for processing
      const calculationPromise = new Promise<MarketScenarioResult>(
        (resolve, reject) => {
          const queueItem = {
            id: `market_volatility_${Date.now()}_${Math.random()}`,
            type: 'market_volatility',
            params,
            priority,
            resolve,
            reject,
          };

          // Insert based on priority
          if (priority === 'high') {
            this.calculationQueue.unshift(queueItem);
          } else {
            this.calculationQueue.push(queueItem);
          }

          // Process queue
          this.processQueue();
        }
      );

      // Apply timeout
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Market volatility calculation timeout')),
          timeout
        )
      );

      const result = await Promise.race([calculationPromise, timeoutPromise]);

      // Cache the result
      if (useCache) {
        const cacheKey = `market_volatility_${JSON.stringify(params)}`;
        await this.setCachedResult(cacheKey, result);
      }

      // Notify subscribers
      this.notifySubscribers('market_volatility', result);

      return result;
    } catch (error) {
      console.error('Market volatility calculation failed:', error);
      throw error;
    }
  }

  /**
   * Calculate market stress test with offline support
   * Epic 7, Story 5: Market Stress Testing
   */
  async calculateMarketStressTest(
    params: MarketStressTestParams,
    options: {
      priority?: 'low' | 'normal' | 'high';
      useCache?: boolean;
      timeout?: number;
    } = {}
  ): Promise<MarketStressTestResult> {
    const { priority = 'normal', useCache = true, timeout = 30000 } = options;

    try {
      // Check cache first
      if (useCache) {
        const cacheKey = `market_stress_test_${JSON.stringify(params)}`;
        const cachedResult = await this.getCachedResult(cacheKey);
        if (cachedResult) {
          return cachedResult;
        }
      }

      // Add to queue for processing
      const calculationPromise = new Promise<MarketStressTestResult>(
        (resolve, reject) => {
          const queueItem = {
            id: `market_stress_test_${Date.now()}_${Math.random()}`,
            type: 'market_stress_test',
            params,
            priority,
            resolve,
            reject,
          };

          // Insert based on priority
          if (priority === 'high') {
            this.calculationQueue.unshift(queueItem);
          } else {
            this.calculationQueue.push(queueItem);
          }

          // Process queue
          this.processQueue();
        }
      );

      // Apply timeout
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Market stress test calculation timeout')),
          timeout
        )
      );

      const result = await Promise.race([calculationPromise, timeoutPromise]);

      // Cache the result
      if (useCache) {
        const cacheKey = `market_stress_test_${JSON.stringify(params)}`;
        await this.setCachedResult(cacheKey, result);
      }

      // Notify subscribers
      this.notifySubscribers('market_stress_test', result);

      return result;
    } catch (error) {
      console.error('Market stress test calculation failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const calculationService = new CalculationService();
