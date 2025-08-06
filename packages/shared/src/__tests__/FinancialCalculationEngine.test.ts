/**
 * Financial Calculation Engine Tests
 * Comprehensive test suite for all financial calculation functions
 */

import { FinancialCalculationEngine } from '../services/FinancialCalculationEngine';
import {
  CompoundInterestParams,
  AccountProjectionParams,
  MonteCarloParams,
  FIRECalculationParams,
  FIRENumberCalculationParams,
  FIRENumberCalculationResult,
  DebtPayoffParams,
} from '../types/financial';

describe('FinancialCalculationEngine', () => {
  let engine: FinancialCalculationEngine;

  beforeEach(() => {
    engine = new FinancialCalculationEngine();
  });

  afterEach(() => {
    // Clear cache after each test
    engine.clearCache();
  });

  describe('Compound Interest Calculations', () => {
    it('should calculate simple compound interest correctly', () => {
      const params: CompoundInterestParams = {
        principal: 10000,
        annualRate: 0.07,
        compoundingFrequency: 1, // Annual
        timeInYears: 10,
      };

      const result = engine.calculateCompoundInterestDetailed(params);

      expect(result.futureValue).toBeCloseTo(19671.51, 2);
      expect(result.totalContributions).toBe(0);
      expect(result.totalInterestEarned).toBeCloseTo(9671.51, 2);
      expect(result.effectiveAnnualRate).toBeCloseTo(0.07, 4);
    });

    it('should calculate compound interest with monthly contributions', () => {
      const params: CompoundInterestParams = {
        principal: 10000,
        annualRate: 0.07,
        compoundingFrequency: 12, // Monthly
        timeInYears: 10,
        additionalContributions: 500,
        contributionFrequency: 12, // Monthly
        contributionTiming: 'end',
      };

      const result = engine.calculateCompoundInterestDetailed(params);

      expect(result.futureValue).toBeGreaterThan(80000);
      expect(result.totalContributions).toBe(60000); // 500 * 12 * 10
      expect(result.totalInterestEarned).toBeGreaterThan(10000);
    });

    it('should handle zero interest rate', () => {
      const params: CompoundInterestParams = {
        principal: 10000,
        annualRate: 0,
        compoundingFrequency: 12,
        timeInYears: 5,
        additionalContributions: 100,
        contributionFrequency: 12,
      };

      const result = engine.calculateCompoundInterestDetailed(params);

      expect(result.futureValue).toBe(16000); // 10000 + (100 * 12 * 5)
      expect(result.totalInterestEarned).toBe(0);
    });

    it('should validate input parameters', () => {
      const invalidParams: CompoundInterestParams = {
        principal: -1000, // Invalid negative principal
        annualRate: 0.07,
        compoundingFrequency: 12,
        timeInYears: 10,
      };

      expect(() => {
        engine.calculateCompoundInterestDetailed(invalidParams);
      }).toThrow('Invalid parameters for compound interest calculation');
    });

    it('should use cache for repeated calculations', () => {
      const params: CompoundInterestParams = {
        principal: 10000,
        annualRate: 0.07,
        compoundingFrequency: 12,
        timeInYears: 10,
      };

      // First calculation
      const start1 = performance.now();
      const result1 = engine.calculateCompoundInterestDetailed(params);
      const time1 = performance.now() - start1;

      // Second calculation (should be cached)
      const start2 = performance.now();
      const result2 = engine.calculateCompoundInterestDetailed(params);
      const time2 = performance.now() - start2;

      expect(result1.futureValue).toBe(result2.futureValue);
      expect(time2).toBeLessThan(time1); // Cache should be faster
    });
  });

  describe('Monte Carlo Simulations', () => {
    it('should run basic Monte Carlo simulation', () => {
      const params: MonteCarloParams = {
        initialValue: 10000,
        monthlyContribution: 500,
        yearsToProject: 10,
        expectedReturn: 0.07,
        volatility: 0.15,
        iterations: 100, // Small number for testing
      };

      const result = engine.runMonteCarloSimulation(params);

      expect(result.iterations).toBe(100);
      expect(result.projections).toHaveLength(7); // 5th, 10th, 25th, 50th, 75th, 90th, 95th percentiles
      expect(result.statistics.mean).toBeGreaterThan(0);
      expect(result.statistics.standardDeviation).toBeGreaterThan(0);
      expect(result.yearlyProjections).toHaveLength(10);
    });

    it('should handle high volatility scenarios', () => {
      const params: MonteCarloParams = {
        initialValue: 10000,
        monthlyContribution: 500,
        yearsToProject: 5,
        expectedReturn: 0.07,
        volatility: 0.5, // High volatility
        iterations: 100,
      };

      const result = engine.runMonteCarloSimulation(params);

      expect(result.statistics.standardDeviation).toBeGreaterThan(10000);
      expect(result.confidenceIntervals.p90.max).toBeGreaterThan(
        result.confidenceIntervals.p90.min
      );
    });

    it('should calculate percentiles correctly', () => {
      const params: MonteCarloParams = {
        initialValue: 10000,
        monthlyContribution: 0,
        yearsToProject: 1,
        expectedReturn: 0,
        volatility: 0, // No volatility for predictable results
        iterations: 100,
      };

      const result = engine.runMonteCarloSimulation(params);

      // With no return and no volatility, all results should be the same
      const p50 = result.projections.find(p => p.percentile === 50);
      const p95 = result.projections.find(p => p.percentile === 95);

      expect(p50?.finalValue).toBeCloseTo(10000, 0);
      expect(p95?.finalValue).toBeCloseTo(10000, 0);
    });

    it('should handle edge cases', () => {
      const params: MonteCarloParams = {
        initialValue: 0,
        monthlyContribution: 100,
        yearsToProject: 1,
        expectedReturn: 0.1,
        volatility: 0.2,
        iterations: 50,
      };

      const result = engine.runMonteCarloSimulation(params);

      expect(result.iterations).toBe(50);
      expect(result.statistics.mean).toBeGreaterThan(1000); // Should be around 1200
    });
  });

  describe('Debt Payoff Calculations', () => {
    it('should calculate snowball strategy correctly', () => {
      const params: DebtPayoffParams = {
        debts: [
          {
            id: '1',
            name: 'Credit Card 1',
            balance: 5000,
            interestRate: 0.18,
            minimumPayment: 150,
          },
          {
            id: '2',
            name: 'Credit Card 2',
            balance: 3000,
            interestRate: 0.22,
            minimumPayment: 100,
          },
          {
            id: '3',
            name: 'Car Loan',
            balance: 15000,
            interestRate: 0.06,
            minimumPayment: 300,
          },
        ],
        extraPayment: 200,
        strategy: 'snowball',
      };

      const result = engine.calculateDebtPayoff(params);

      expect(result.strategy).toBe('snowball');
      expect(result.totalTime).toBeGreaterThan(0);
      expect(result.totalInterest).toBeGreaterThan(0);
      expect(result.debtOrder).toHaveLength(3);

      // Snowball should pay off smallest balance first
      expect(result.debtOrder[0].debtId).toBe('2'); // $3000 balance
      expect(result.debtOrder[1].debtId).toBe('1'); // $5000 balance
      expect(result.debtOrder[2].debtId).toBe('3'); // $15000 balance
    });

    it('should calculate avalanche strategy correctly', () => {
      const params: DebtPayoffParams = {
        debts: [
          {
            id: '1',
            name: 'Credit Card 1',
            balance: 5000,
            interestRate: 0.18,
            minimumPayment: 150,
          },
          {
            id: '2',
            name: 'Credit Card 2',
            balance: 3000,
            interestRate: 0.22,
            minimumPayment: 100,
          },
          {
            id: '3',
            name: 'Car Loan',
            balance: 15000,
            interestRate: 0.06,
            minimumPayment: 300,
          },
        ],
        extraPayment: 200,
        strategy: 'avalanche',
      };

      const result = engine.calculateDebtPayoff(params);

      expect(result.strategy).toBe('avalanche');

      // Avalanche should pay off highest interest rate first
      expect(result.debtOrder[0].debtId).toBe('2'); // 22% interest
      expect(result.debtOrder[1].debtId).toBe('1'); // 18% interest
      expect(result.debtOrder[2].debtId).toBe('3'); // 6% interest
    });

    it('should handle custom strategy', () => {
      const params: DebtPayoffParams = {
        debts: [
          {
            id: '1',
            name: 'Credit Card 1',
            balance: 5000,
            interestRate: 0.18,
            minimumPayment: 150,
          },
          {
            id: '2',
            name: 'Credit Card 2',
            balance: 3000,
            interestRate: 0.22,
            minimumPayment: 100,
          },
        ],
        extraPayment: 100,
        strategy: 'custom',
        customOrder: ['1', '2'],
      };

      const result = engine.calculateDebtPayoff(params);

      expect(result.strategy).toBe('custom');
      expect(result.debtOrder[0].debtId).toBe('1');
      expect(result.debtOrder[1].debtId).toBe('2');
    });

    it('should generate detailed payoff schedule', () => {
      const params: DebtPayoffParams = {
        debts: [
          {
            id: '1',
            name: 'Small Debt',
            balance: 1000,
            interestRate: 0.12,
            minimumPayment: 50,
          },
        ],
        extraPayment: 50,
        strategy: 'snowball',
      };

      const result = engine.calculateDebtPayoff(params);

      expect(result.payoffSchedule.length).toBeGreaterThan(0);
      expect(result.payoffSchedule[0].month).toBe(1);
      expect(result.payoffSchedule[0].debtId).toBe('1');
      expect(result.payoffSchedule[0].payment).toBe(100); // 50 minimum + 50 extra

      // Last payment should mark debt as paid off
      const lastPayment =
        result.payoffSchedule[result.payoffSchedule.length - 1];
      expect(lastPayment.isPaidOff).toBe(true);
      expect(lastPayment.remainingBalance).toBe(0);
    });
  });

  describe('Performance Tests', () => {
    it('should complete compound interest calculation within 200ms', () => {
      const params: CompoundInterestParams = {
        principal: 10000,
        annualRate: 0.07,
        compoundingFrequency: 12,
        timeInYears: 30,
        additionalContributions: 500,
        contributionFrequency: 12,
      };

      const start = performance.now();
      const result = engine.calculateCompoundInterestDetailed(params);
      const executionTime = performance.now() - start;

      expect(executionTime).toBeLessThan(200);
      expect(result.futureValue).toBeGreaterThan(0);
    });

    it('should complete Monte Carlo simulation within reasonable time', () => {
      const params: MonteCarloParams = {
        initialValue: 10000,
        monthlyContribution: 500,
        yearsToProject: 10,
        expectedReturn: 0.07,
        volatility: 0.15,
        iterations: 1000,
      };

      const start = performance.now();
      const result = engine.runMonteCarloSimulation(params);
      const executionTime = performance.now() - start;

      expect(executionTime).toBeLessThan(5000); // 5 seconds max
      expect(result.iterations).toBe(1000);
    });

    it('should handle large debt portfolios efficiently', () => {
      const debts = Array.from({ length: 20 }, (_, i) => ({
        id: `debt_${i}`,
        name: `Debt ${i}`,
        balance: Math.random() * 10000 + 1000,
        interestRate: Math.random() * 0.2 + 0.05,
        minimumPayment: Math.random() * 200 + 50,
      }));

      const params: DebtPayoffParams = {
        debts,
        extraPayment: 500,
        strategy: 'avalanche',
      };

      const start = performance.now();
      const result = engine.calculateDebtPayoff(params);
      const executionTime = performance.now() - start;

      expect(executionTime).toBeLessThan(1000); // 1 second max
      expect(result.debtOrder).toHaveLength(20);
    });
  });

  describe('Cache Management', () => {
    it('should cache calculation results', () => {
      const params: CompoundInterestParams = {
        principal: 10000,
        annualRate: 0.07,
        compoundingFrequency: 12,
        timeInYears: 10,
      };

      // First calculation
      engine.calculateCompoundInterestDetailed(params);

      // Check cache stats
      const stats = engine.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should clear cache correctly', () => {
      const params: CompoundInterestParams = {
        principal: 10000,
        annualRate: 0.07,
        compoundingFrequency: 12,
        timeInYears: 10,
      };

      // Add to cache
      engine.calculateCompoundInterestDetailed(params);
      expect(engine.getCacheStats().size).toBeGreaterThan(0);

      // Clear cache
      engine.clearCache();
      expect(engine.getCacheStats().size).toBe(0);
    });

    it('should track performance metrics', () => {
      const params: CompoundInterestParams = {
        principal: 10000,
        annualRate: 0.07,
        compoundingFrequency: 12,
        timeInYears: 10,
      };

      engine.calculateCompoundInterestDetailed(params);

      const metrics = engine.getPerformanceMetrics();
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0].functionName).toBe('calculateCompoundInterestDetailed');
      expect(metrics[0].executionTime).toBeGreaterThan(0);
    });

    it('should calculate cache hit rate correctly', () => {
      const params: CompoundInterestParams = {
        principal: 10000,
        annualRate: 0.07,
        compoundingFrequency: 12,
        timeInYears: 10,
      };

      // First calculation (cache miss)
      engine.calculateCompoundInterestDetailed(params);

      // Second calculation (cache hit)
      engine.calculateCompoundInterestDetailed(params);

      const stats = engine.getCacheStats();
      expect(stats.hitRate).toBeGreaterThan(0);
      expect(stats.hitRate).toBeLessThanOrEqual(1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle extremely large numbers', () => {
      const params: CompoundInterestParams = {
        principal: 1000000000, // 1 billion
        annualRate: 0.01, // Low rate to prevent overflow
        compoundingFrequency: 1,
        timeInYears: 10,
      };

      const result = engine.calculateCompoundInterestDetailed(params);
      expect(result.futureValue).toBeGreaterThan(1000000000);
      expect(isFinite(result.futureValue)).toBe(true);
    });

    it('should handle very small numbers', () => {
      const params: CompoundInterestParams = {
        principal: 0.01,
        annualRate: 0.001,
        compoundingFrequency: 12,
        timeInYears: 1,
      };

      const result = engine.calculateCompoundInterestDetailed(params);
      expect(result.futureValue).toBeGreaterThan(0.01);
      expect(result.totalInterestEarned).toBeGreaterThan(0);
    });

    it('should handle zero principal with contributions', () => {
      const params: CompoundInterestParams = {
        principal: 0,
        annualRate: 0.07,
        compoundingFrequency: 12,
        timeInYears: 5,
        additionalContributions: 100,
        contributionFrequency: 12,
      };

      const result = engine.calculateCompoundInterestDetailed(params);
      expect(result.futureValue).toBeGreaterThan(6000); // More than just contributions due to interest
      expect(result.totalContributions).toBe(6000);
    });

    it('should validate Monte Carlo parameters', () => {
      const invalidParams: MonteCarloParams = {
        initialValue: -1000, // Invalid negative value
        monthlyContribution: 500,
        yearsToProject: 10,
        expectedReturn: 0.07,
        volatility: 0.15,
        iterations: 100,
      };

      expect(() => {
        engine.runMonteCarloSimulation(invalidParams);
      }).toThrow();
    });

    it('should handle empty debt list', () => {
      const params: DebtPayoffParams = {
        debts: [],
        extraPayment: 100,
        strategy: 'snowball',
      };

      expect(() => {
        engine.calculateDebtPayoff(params);
      }).toThrow();
    });
  });

  // FIRE Number Calculation Tests (Story 2)
  describe('FIRE Number Calculations', () => {
    describe('calculateFIRENumber', () => {
      test('should calculate basic FIRE number with 4% rule', () => {
        const params = {
          monthlyExpenses: 5000,
        };

        const result = engine.calculateFIRENumber(params);

        expect(result.fireNumber).toBe(1500000); // 60,000 / 0.04
        expect(result.annualExpenses).toBe(60000);
        expect(result.withdrawalRate).toBe(0.04);
        expect(result.leanFireNumber).toBe(1050000); // 70% of expenses
        expect(result.fatFireNumber).toBe(3000000); // 200% of expenses
      });

      test('should handle annual expenses input', () => {
        const params = {
          annualExpenses: 48000,
        };

        const result = engine.calculateFIRENumber(params);

        expect(result.fireNumber).toBe(1200000); // 48,000 / 0.04
        expect(result.annualExpenses).toBe(48000);
      });

      test('should apply custom withdrawal rate', () => {
        const params = {
          monthlyExpenses: 4000,
          withdrawalRate: 0.035, // 3.5% rule
        };

        const result = engine.calculateFIRENumber(params);

        expect(result.fireNumber).toBeCloseTo(1371428.57, 2); // 48,000 / 0.035
        expect(result.withdrawalRate).toBe(0.035);
      });

      test('should apply safety margin', () => {
        const params = {
          monthlyExpenses: 5000,
          safetyMargin: 0.2, // 20% safety margin
        };

        const result = engine.calculateFIRENumber(params);

        expect(result.fireNumber).toBe(1800000); // 1,500,000 * 1.2
        expect(result.safetyMargin).toBe(0.2);
      });

      test('should apply geographic cost of living adjustment', () => {
        const params = {
          monthlyExpenses: 4000,
          costOfLivingMultiplier: 1.5, // 50% higher cost area
        };

        const result = engine.calculateFIRENumber(params);

        expect(result.fireNumber).toBe(1800000); // 1,200,000 * 1.5
        expect(result.costOfLivingAdjustment).toBe(1.5);
      });

      test('should include healthcare cost projections', () => {
        const params = {
          monthlyExpenses: 4000,
          healthcareExpenses: {
            monthlyPremium: 800,
            annualDeductible: 5000,
            outOfPocketMax: 8000,
            inflationRate: 0.06,
          },
        };

        const result = engine.calculateFIRENumber(params);

        expect(result.healthcareCosts).toBeDefined();
        expect(result.healthcareCosts!.annualCost).toBe(14600); // 800*12 + 5000
        expect(result.healthcareCosts!.coverageGapYears).toBe(10);
      });

      test('should include Social Security impact', () => {
        const params = {
          monthlyExpenses: 5000,
          socialSecurity: {
            estimatedBenefit: 2500,
            startAge: 67,
            inflationAdjusted: true,
          },
        };

        const result = engine.calculateFIRENumber(params);

        expect(result.socialSecurityImpact).toBeDefined();
        expect(result.socialSecurityImpact!.annualBenefit).toBe(30000); // 2500 * 12
        expect(
          result.socialSecurityImpact!.fireNumberReduction
        ).toBeGreaterThan(0);
      });

      test('should generate stress test results', () => {
        const params = {
          monthlyExpenses: 4000,
          stressTestScenarios: [
            {
              name: 'Market Crash',
              marketReturnAdjustment: -0.02,
              inflationAdjustment: 0.01,
              expenseAdjustment: 0.1,
            },
          ],
        };

        const result = engine.calculateFIRENumber(params);

        expect(result.stressTestResults).toHaveLength(1);
        expect(result.stressTestResults[0].scenario).toBe('Market Crash');
        expect(result.stressTestResults[0].adjustedFireNumber).toBeGreaterThan(
          result.fireNumber
        );
        expect(result.stressTestResults[0].riskLevel).toBeDefined();
      });

      test('should provide optimization recommendations', () => {
        const params = {
          monthlyExpenses: 6000,
          withdrawalRate: 0.05, // High withdrawal rate
        };

        const result = engine.calculateFIRENumber(params);

        expect(result.recommendations).toContainEqual(
          expect.objectContaining({
            category: 'Withdrawal Rate',
            priority: 'high',
          })
        );
      });

      test('should throw error for invalid input', () => {
        expect(() => {
          engine.calculateFIRENumber({
            monthlyExpenses: 0,
          });
        }).toThrow(
          'Monthly or annual expenses must be provided and greater than 0'
        );
      });
    });

    describe('calculateExpenseBasedFIRE', () => {
      test('should calculate FIRE with expense categories', () => {
        const params = {
          expenseCategories: [
            {
              category: 'Housing',
              monthlyAmount: 2000,
              inflationRate: 0.03,
              essential: true,
              geographicSensitive: true,
            },
            {
              category: 'Food',
              monthlyAmount: 600,
              inflationRate: 0.025,
              essential: true,
              geographicSensitive: false,
            },
          ],
          costOfLivingIndex: 1.2,
          projectionYears: 10,
        };

        const result = engine.calculateExpenseBasedFIRE(params);

        expect(result.totalFireNumber).toBeGreaterThan(0);
        expect(result.categoryBreakdown).toHaveLength(2);
        expect(result.geographicAdjustments.costOfLivingIndex).toBe(1.2);
        expect(result.inflationImpact.inflationIncrease).toBeGreaterThan(0);
      });

      test('should apply geographic adjustments correctly', () => {
        const params = {
          expenseCategories: [
            {
              category: 'Housing',
              monthlyAmount: 2000,
              inflationRate: 0.03,
              essential: true,
              geographicSensitive: true,
            },
          ],
          costOfLivingIndex: 1.5,
          geographicLocation: 'San Francisco',
        };

        const result = engine.calculateExpenseBasedFIRE(params);

        expect(result.categoryBreakdown[0].geographicAdjustment).toBeCloseTo(
          1.8,
          1
        ); // 1.5 * 1.2 for housing
        expect(result.geographicAdjustments.location).toBe('San Francisco');
      });

      test('should generate optimization suggestions', () => {
        const params = {
          expenseCategories: [
            {
              category: 'Entertainment',
              monthlyAmount: 1000,
              inflationRate: 0.02,
              essential: false,
              geographicSensitive: false,
            },
          ],
        };

        const result = engine.calculateExpenseBasedFIRE(params);

        expect(result.optimizationSuggestions).toContainEqual(
          expect.objectContaining({
            category: 'Entertainment',
            difficulty: 'easy',
          })
        );
      });
    });

    // Performance Tests for FIRE calculations
    describe('Performance Tests', () => {
      test('FIRE number calculation should complete within 50ms', () => {
        const startTime = performance.now();

        engine.calculateFIRENumber({
          monthlyExpenses: 5000,
          expenseCategories: Array.from({ length: 10 }, (_, i) => ({
            category: `Category ${i}`,
            monthlyAmount: 500,
            inflationRate: 0.03,
            essential: i < 5,
          })),
        });

        const executionTime = performance.now() - startTime;
        expect(executionTime).toBeLessThan(50);
      });

      test('Expense-based FIRE calculation should complete within 30ms', () => {
        const startTime = performance.now();

        engine.calculateExpenseBasedFIRE({
          expenseCategories: Array.from({ length: 20 }, (_, i) => ({
            category: `Category ${i}`,
            monthlyAmount: 300,
            inflationRate: 0.025,
            essential: i < 10,
            geographicSensitive: i % 2 === 0,
          })),
          projectionYears: 15,
        });

        const executionTime = performance.now() - startTime;
        expect(executionTime).toBeLessThan(30);
      });

      test('Healthcare projections should complete within 40ms', () => {
        const startTime = performance.now();

        engine.calculateHealthcareCostProjections({
          currentAge: 35,
          retirementAge: 50,
          currentHealthcareCost: 8000,
          chronicConditions: Array.from({ length: 5 }, (_, i) => ({
            condition: `Condition ${i}`,
            annualCost: 2000,
            inflationRate: 0.05,
          })),
          medicareAge: 65,
        });

        const executionTime = performance.now() - startTime;
        expect(executionTime).toBeLessThan(40);
      });

      test('Social Security and stress testing should complete within 60ms', () => {
        const startTime = performance.now();

        engine.calculateSocialSecurityAndStressTesting({
          currentAge: 40,
          currentIncome: 80000,
          retirementAge: 55,
          baseFireNumber: 1500000,
          stressTestScenarios: Array.from({ length: 10 }, (_, i) => ({
            name: `Scenario ${i}`,
            marketReturnAdjustment: -0.01 * i,
            inflationAdjustment: 0.005 * i,
            socialSecurityAdjustment: -0.05 * i,
            healthcareInflationAdjustment: 0.01 * i,
          })),
        });

        const executionTime = performance.now() - startTime;
        expect(executionTime).toBeLessThan(60);
      });
    });
  });
});

// Export for use in other test files
export { engine };
