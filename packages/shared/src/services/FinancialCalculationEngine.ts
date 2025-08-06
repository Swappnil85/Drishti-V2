/**
 * Financial Calculation Engine
 * Comprehensive financial calculation service with caching and performance optimization
 */

import {
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
  CalculationCache,
  CalculationPerformanceMetrics,
} from '../types/financial';

import {
  calculateCompoundInterest,
  calculateFutureValue,
  calculateFIRENumber,
  calculateCoastFIRE,
  calculateYearsToFIRE,
  calculateDebtPayoffTime,
  generateNormalRandom,
  calculatePercentile,
  calculateRealReturn,
  calculateEffectiveAnnualRate,
} from '../utils';

export class FinancialCalculationEngine {
  private cache: Map<string, CalculationCache> = new Map();
  private performanceMetrics: CalculationPerformanceMetrics[] = [];
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000;

  /**
   * Calculate compound interest with detailed breakdown
   */
  public calculateCompoundInterestDetailed(
    params: CompoundInterestParams
  ): FutureValueResult {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey('compound_interest', params);

    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.recordPerformance(
        'calculateCompoundInterestDetailed',
        performance.now() - startTime,
        true,
        1
      );
      return cached;
    }

    try {
      const {
        principal,
        annualRate,
        compoundingFrequency,
        timeInYears,
        additionalContributions = 0,
        contributionFrequency = 12,
        contributionTiming = 'end',
      } = params;

      // Calculate future value components
      const periodsPerYear = compoundingFrequency;
      const totalPeriods = timeInYears * periodsPerYear;
      const ratePerPeriod = annualRate / periodsPerYear;

      // Future value of principal
      const principalGrowth =
        principal * Math.pow(1 + ratePerPeriod, totalPeriods);

      // Future value of contributions
      let contributionGrowth = 0;
      let totalContributions = 0;

      if (additionalContributions > 0) {
        const contributionPerPeriod =
          additionalContributions * (contributionFrequency / periodsPerYear);
        totalContributions =
          additionalContributions * contributionFrequency * timeInYears;
        const timingMultiplier =
          contributionTiming === 'beginning' ? 1 + ratePerPeriod : 1;

        if (ratePerPeriod === 0) {
          contributionGrowth =
            contributionPerPeriod * totalPeriods * timingMultiplier;
        } else {
          contributionGrowth =
            contributionPerPeriod *
            ((Math.pow(1 + ratePerPeriod, totalPeriods) - 1) / ratePerPeriod) *
            timingMultiplier;
        }
      }

      const futureValue = principalGrowth + contributionGrowth;
      const totalInterestEarned = futureValue - principal - totalContributions;
      const effectiveAnnualRate = calculateEffectiveAnnualRate(
        annualRate,
        compoundingFrequency
      );

      const result: FutureValueResult = {
        futureValue,
        totalContributions,
        totalInterestEarned,
        effectiveAnnualRate,
        breakdown: {
          principalGrowth: principalGrowth - principal,
          contributionGrowth: contributionGrowth - totalContributions,
          compoundInterest: totalInterestEarned,
        },
      };

      // Cache the result
      this.setCache(cacheKey, result, []);

      const executionTime = performance.now() - startTime;
      this.recordPerformance(
        'calculateCompoundInterestDetailed',
        executionTime,
        false,
        1
      );

      return result;
    } catch (error) {
      const executionTime = performance.now() - startTime;
      this.recordPerformance(
        'calculateCompoundInterestDetailed',
        executionTime,
        false,
        1
      );
      throw new Error(`Compound interest calculation failed: ${error.message}`);
    }
  }

  /**
   * Run Monte Carlo simulation for investment projections
   */
  public runMonteCarloSimulation(params: MonteCarloParams): MonteCarloResult {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey('monte_carlo', params);

    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.recordPerformance(
        'runMonteCarloSimulation',
        performance.now() - startTime,
        true,
        params.iterations
      );
      return cached;
    }

    try {
      const {
        initialValue,
        monthlyContribution,
        yearsToProject,
        expectedReturn,
        volatility,
        iterations,
        inflationRate = 0.03,
      } = params;

      const totalMonths = yearsToProject * 12;
      const monthlyReturn = expectedReturn / 12;
      const monthlyVolatility = volatility / Math.sqrt(12);
      const finalValues: number[] = [];
      const yearlyProjections: Array<{ year: number; values: number[] }> = [];

      // Initialize yearly tracking
      for (let year = 1; year <= yearsToProject; year++) {
        yearlyProjections.push({ year, values: [] });
      }

      // Run simulations
      for (let iteration = 0; iteration < iterations; iteration++) {
        let currentValue = initialValue;

        for (let month = 1; month <= totalMonths; month++) {
          // Add monthly contribution
          currentValue += monthlyContribution;

          // Generate random return for this month
          const randomReturn = generateNormalRandom(
            monthlyReturn,
            monthlyVolatility
          );
          currentValue *= 1 + randomReturn;

          // Ensure value doesn't go negative
          currentValue = Math.max(0, currentValue);

          // Track yearly values
          if (month % 12 === 0) {
            const year = month / 12;
            yearlyProjections[year - 1].values.push(currentValue);
          }
        }

        finalValues.push(currentValue);
      }

      // Sort final values for percentile calculations
      finalValues.sort((a, b) => a - b);

      // Calculate percentiles
      const percentiles = [5, 10, 25, 50, 75, 90, 95].map(p => ({
        percentile: p,
        finalValue: calculatePercentile(finalValues, p),
        realValue:
          calculatePercentile(finalValues, p) /
          Math.pow(1 + inflationRate, yearsToProject),
      }));

      // Calculate confidence intervals
      const confidenceIntervals = {
        p90: {
          min: calculatePercentile(finalValues, 5),
          max: calculatePercentile(finalValues, 95),
        },
        p80: {
          min: calculatePercentile(finalValues, 10),
          max: calculatePercentile(finalValues, 90),
        },
        p50: {
          min: calculatePercentile(finalValues, 25),
          max: calculatePercentile(finalValues, 75),
        },
      };

      // Calculate statistics
      const mean =
        finalValues.reduce((sum, val) => sum + val, 0) / finalValues.length;
      const median = calculatePercentile(finalValues, 50);
      const variance =
        finalValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        finalValues.length;
      const standardDeviation = Math.sqrt(variance);

      // Calculate skewness and kurtosis
      const skewness =
        finalValues.reduce(
          (sum, val) => sum + Math.pow((val - mean) / standardDeviation, 3),
          0
        ) / finalValues.length;
      const kurtosis =
        finalValues.reduce(
          (sum, val) => sum + Math.pow((val - mean) / standardDeviation, 4),
          0
        ) /
          finalValues.length -
        3;

      const probabilityOfLoss =
        finalValues.filter(
          val => val < initialValue + monthlyContribution * totalMonths
        ).length / iterations;

      // Calculate yearly percentiles
      const yearlyPercentileProjections = yearlyProjections.map(
        ({ year, values }) => {
          values.sort((a, b) => a - b);
          return {
            year,
            percentiles: {
              p5: calculatePercentile(values, 5),
              p10: calculatePercentile(values, 10),
              p25: calculatePercentile(values, 25),
              p50: calculatePercentile(values, 50),
              p75: calculatePercentile(values, 75),
              p90: calculatePercentile(values, 90),
              p95: calculatePercentile(values, 95),
            },
          };
        }
      );

      const result: MonteCarloResult = {
        iterations,
        projections: percentiles,
        confidenceIntervals,
        statistics: {
          mean,
          median,
          standardDeviation,
          skewness,
          kurtosis,
          probabilityOfLoss,
          probabilityOfTarget: 0, // Will be calculated if target is provided
        },
        yearlyProjections: yearlyPercentileProjections,
      };

      this.setCache(cacheKey, result, []);

      const executionTime = performance.now() - startTime;
      this.recordPerformance(
        'runMonteCarloSimulation',
        executionTime,
        false,
        iterations
      );

      return result;
    } catch (error) {
      const executionTime = performance.now() - startTime;
      this.recordPerformance(
        'runMonteCarloSimulation',
        executionTime,
        false,
        params.iterations
      );
      throw new Error(`Monte Carlo simulation failed: ${error.message}`);
    }
  }

  /**
   * Calculate debt payoff strategies
   */
  public calculateDebtPayoff(params: DebtPayoffParams): DebtPayoffResult {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey('debt_payoff', params);

    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.recordPerformance(
        'calculateDebtPayoff',
        performance.now() - startTime,
        true,
        params.debts.length
      );
      return cached;
    }

    try {
      const { debts, extraPayment, strategy, customOrder } = params;

      // Sort debts based on strategy
      let sortedDebts = [...debts];
      if (strategy === 'snowball') {
        sortedDebts.sort((a, b) => a.balance - b.balance);
      } else if (strategy === 'avalanche') {
        sortedDebts.sort((a, b) => b.interestRate - a.interestRate);
      } else if (strategy === 'custom' && customOrder) {
        sortedDebts = customOrder
          .map(id => debts.find(d => d.id === id)!)
          .filter(Boolean);
      }

      const payoffSchedule = [];
      const debtOrder = [];
      let totalInterest = 0;
      let currentMonth = 0;
      let remainingDebts = sortedDebts.map(debt => ({ ...debt }));
      let availableExtraPayment = extraPayment;

      while (remainingDebts.length > 0) {
        currentMonth++;
        let monthlyExtraUsed = 0;

        for (let i = 0; i < remainingDebts.length; i++) {
          const debt = remainingDebts[i];
          const monthlyRate = debt.interestRate / 12;
          const interestPayment = debt.balance * monthlyRate;
          let principalPayment = debt.minimumPayment - interestPayment;

          // Apply extra payment to first debt (focus debt)
          if (i === 0 && availableExtraPayment > 0) {
            const extraToApply = Math.min(
              availableExtraPayment,
              debt.balance - principalPayment
            );
            principalPayment += extraToApply;
            monthlyExtraUsed += extraToApply;
          }

          const totalPayment = interestPayment + principalPayment;
          debt.balance -= principalPayment;
          totalInterest += interestPayment;

          payoffSchedule.push({
            month: currentMonth,
            debtId: debt.id,
            debtName: debt.name,
            payment: totalPayment,
            principalPayment,
            interestPayment,
            remainingBalance: Math.max(0, debt.balance),
            isPaidOff: debt.balance <= 0,
          });

          if (debt.balance <= 0) {
            debtOrder.push({
              debtId: debt.id,
              debtName: debt.name,
              order: debtOrder.length + 1,
              payoffMonth: currentMonth,
              totalInterest: 0, // Will be calculated from schedule
            });

            // Add this debt's minimum payment to extra payment pool
            availableExtraPayment += debt.minimumPayment;
          }
        }

        // Remove paid off debts
        remainingDebts = remainingDebts.filter(debt => debt.balance > 0);
        availableExtraPayment =
          extraPayment + (extraPayment > 0 ? monthlyExtraUsed : 0);
      }

      // Calculate total interest for each debt
      debtOrder.forEach(debt => {
        debt.totalInterest = payoffSchedule
          .filter(p => p.debtId === debt.debtId)
          .reduce((sum, p) => sum + p.interestPayment, 0);
      });

      const result: DebtPayoffResult = {
        strategy,
        totalInterest,
        totalTime: currentMonth,
        monthlySavings: extraPayment,
        payoffSchedule,
        debtOrder,
      };

      this.setCache(
        cacheKey,
        result,
        debts.map(d => d.id)
      );

      const executionTime = performance.now() - startTime;
      this.recordPerformance(
        'calculateDebtPayoff',
        executionTime,
        false,
        debts.length
      );

      return result;
    } catch (error) {
      const executionTime = performance.now() - startTime;
      this.recordPerformance(
        'calculateDebtPayoff',
        executionTime,
        false,
        params.debts.length
      );
      throw new Error(`Debt payoff calculation failed: ${error.message}`);
    }
  }

  /**
   * Cache management methods
   */
  private generateCacheKey(type: string, params: any): string {
    return `${type}_${JSON.stringify(params)}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.result;
  }

  private setCache(key: string, result: any, dependencies: string[]): void {
    // Clean up old cache entries if we're at the limit
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      key,
      result,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.CACHE_TTL,
      dependencies,
      computationTime: 0, // Will be set by caller
    });
  }

  private recordPerformance(
    functionName: string,
    executionTime: number,
    cacheHit: boolean,
    inputSize: number
  ): void {
    const metric: CalculationPerformanceMetrics = {
      functionName,
      executionTime,
      cacheHit,
      inputSize,
      complexity: this.getComplexity(functionName, inputSize),
      memoryUsage: this.getMemoryUsage(),
      timestamp: Date.now(),
    };

    this.performanceMetrics.push(metric);

    // Keep only last 1000 metrics
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics.shift();
    }
  }

  private getComplexity(
    functionName: string,
    inputSize: number
  ): 'O(1)' | 'O(n)' | 'O(n²)' | 'O(log n)' {
    switch (functionName) {
      case 'calculateCompoundInterestDetailed':
        return 'O(1)';
      case 'runMonteCarloSimulation':
        return 'O(n²)'; // iterations * months
      case 'calculateDebtPayoff':
        return 'O(n)'; // number of debts
      default:
        return 'O(n)';
    }
  }

  private getMemoryUsage(): number {
    // Simplified memory usage estimation
    return this.cache.size * 1024; // Rough estimate in bytes
  }

  /**
   * Clear cache for specific dependencies
   */
  public clearCache(dependencies?: string[]): void {
    if (!dependencies) {
      this.cache.clear();
      return;
    }

    for (const [key, cached] of this.cache.entries()) {
      if (cached.dependencies.some(dep => dependencies.includes(dep))) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): CalculationPerformanceMetrics[] {
    return [...this.performanceMetrics];
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    size: number;
    hitRate: number;
    averageComputationTime: number;
  } {
    const totalRequests = this.performanceMetrics.length;
    const cacheHits = this.performanceMetrics.filter(m => m.cacheHit).length;
    const hitRate = totalRequests > 0 ? cacheHits / totalRequests : 0;

    const computationTimes = this.performanceMetrics
      .filter(m => !m.cacheHit)
      .map(m => m.executionTime);
    const averageComputationTime =
      computationTimes.length > 0
        ? computationTimes.reduce((sum, time) => sum + time, 0) /
          computationTimes.length
        : 0;

    return {
      size: this.cache.size,
      hitRate,
      averageComputationTime,
    };
  }
}

// Export singleton instance
export const financialCalculationEngine = new FinancialCalculationEngine();
