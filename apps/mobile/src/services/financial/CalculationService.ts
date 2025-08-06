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
  DebtPayoffParams,
  DebtPayoffResult,
  GoalProjectionParams,
  GoalProjectionResult,
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
}

// Export singleton instance
export const calculationService = new CalculationService();
