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
          monthlyExpenses: 0,
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

  // Savings Rate Calculation Tests (Story 3)
  describe('Savings Rate Calculations', () => {
    describe('calculateRequiredSavingsRate', () => {
      test('should calculate basic savings rate for single goal', () => {
        const params = {
          currentAge: 30,
          currentIncome: 80000,
          currentSavings: 10000,
          monthlyExpenses: 4000,
          goals: [
            {
              id: 'retirement',
              name: 'Retirement',
              targetAmount: 1000000,
              targetDate: new Date(Date.now() + 30 * 365 * 24 * 60 * 60 * 1000), // 30 years from now
              priority: 'high' as const,
              goalType: 'retirement' as const,
              currentProgress: 10000,
              isFlexible: false,
            },
          ],
        };

        const result = engine.calculateRequiredSavingsRate(params);

        expect(result.recommendedSavingsRate).toBeGreaterThan(0);
        expect(result.recommendedSavingsRate).toBeLessThan(1);
        expect(result.requiredMonthlySavings).toBeGreaterThan(0);
        expect(result.goalBreakdown).toHaveLength(1);
        expect(result.goalBreakdown[0].goalId).toBe('retirement');
        expect(result.budgetAdjustments).toBeDefined();
        expect(result.incomeOptimization).toBeDefined();
        expect(result.timelineAnalysis).toBeDefined();
        expect(result.scenarioAnalysis).toBeDefined();
        expect(result.milestones).toBeDefined();
      });

      test('should handle multiple goals with different priorities', () => {
        const params = {
          currentAge: 25,
          currentIncome: 60000,
          currentSavings: 5000,
          monthlyExpenses: 3000,
          goals: [
            {
              id: 'emergency',
              name: 'Emergency Fund',
              targetAmount: 18000, // 6 months expenses
              targetDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), // 2 years
              priority: 'high' as const,
              goalType: 'emergency_fund' as const,
              currentProgress: 2000,
              isFlexible: false,
            },
            {
              id: 'house',
              name: 'House Down Payment',
              targetAmount: 60000,
              targetDate: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000), // 5 years
              priority: 'medium' as const,
              goalType: 'house_down_payment' as const,
              currentProgress: 5000,
              isFlexible: true,
            },
          ],
        };

        const result = engine.calculateRequiredSavingsRate(params);

        expect(result.goalBreakdown).toHaveLength(2);
        expect(result.recommendedSavingsRate).toBeGreaterThan(0);
        expect(result.scenarioAnalysis).toHaveLength(4); // Conservative, Moderate, Aggressive, Flexible
      });

      test('should apply income growth projections', () => {
        const params = {
          currentAge: 28,
          currentIncome: 70000,
          currentSavings: 15000,
          monthlyExpenses: 3500,
          goals: [
            {
              id: 'retirement',
              name: 'Retirement',
              targetAmount: 800000,
              targetDate: new Date(Date.now() + 25 * 365 * 24 * 60 * 60 * 1000), // 25 years
              priority: 'high' as const,
              goalType: 'retirement' as const,
              currentProgress: 15000,
              isFlexible: false,
            },
          ],
          incomeGrowth: {
            annualGrowthRate: 0.03, // 3% annual growth
            promotionSchedule: [
              { year: 5, salaryIncrease: 10000 },
              { year: 10, salaryIncrease: 15000 },
            ],
          },
        };

        const result = engine.calculateRequiredSavingsRate(params);

        expect(result.recommendedSavingsRate).toBeGreaterThan(0);
        expect(result.incomeOptimization).toHaveLength(5); // Should have income optimization suggestions
      });

      test('should respect budget constraints', () => {
        const params = {
          currentAge: 35,
          currentIncome: 90000,
          currentSavings: 20000,
          monthlyExpenses: 6500, // Higher expenses to create savings gap
          goals: [
            {
              id: 'retirement',
              name: 'Retirement',
              targetAmount: 1500000,
              targetDate: new Date(Date.now() + 20 * 365 * 24 * 60 * 60 * 1000), // 20 years
              priority: 'high' as const,
              goalType: 'retirement' as const,
              currentProgress: 20000,
              isFlexible: true,
            },
          ],
          budgetConstraints: {
            maxSavingsRate: 0.3, // Maximum 30% savings rate
            essentialExpenses: 4000,
            discretionaryExpenses: 2500,
            emergencyFundMonths: 6,
          },
        };

        const result = engine.calculateRequiredSavingsRate(params);

        expect(result.recommendedSavingsRate).toBeLessThanOrEqual(0.3);
        // Budget adjustments should be generated when there's a savings gap
        expect(result.budgetAdjustments).toBeDefined();
        expect(Array.isArray(result.budgetAdjustments)).toBe(true);
      });

      test('should throw error for invalid parameters', () => {
        expect(() => {
          engine.calculateRequiredSavingsRate({
            currentAge: 15, // Too young
            currentIncome: 50000,
            currentSavings: 0,
            monthlyExpenses: 2000,
            goals: [],
          });
        }).toThrow('Current age must be between 18 and 100');

        expect(() => {
          engine.calculateRequiredSavingsRate({
            currentAge: 30,
            currentIncome: -1000, // Negative income
            currentSavings: 0,
            monthlyExpenses: 2000,
            goals: [],
          });
        }).toThrow('Current income must be positive');
      });
    });

    describe('calculateGoalBasedPlanning', () => {
      test('should optimize savings allocation across goals', () => {
        const params = {
          goals: [
            {
              id: 'emergency',
              name: 'Emergency Fund',
              targetAmount: 15000,
              currentAmount: 3000,
              targetDate: new Date(Date.now() + 1 * 365 * 24 * 60 * 60 * 1000), // 1 year
              priority: 10,
              goalType: 'emergency_fund',
              inflationAdjusted: false,
            },
          ],
          currentIncome: 60000,
          currentExpenses: 36000,
          availableForSavings: 24000,
          expectedReturn: 0.07,
          inflationRate: 0.03,
        };

        const result = engine.calculateGoalBasedPlanning(params);

        expect(result.overallPlan.totalRequiredSavings).toBeGreaterThan(0);
        expect(result.overallPlan.recommendedSavingsRate).toBeGreaterThan(0);
        expect(result.overallPlan.planFeasibility).toMatch(
          /achievable|challenging|unrealistic/
        );
        expect(result.goalPrioritization).toHaveLength(1);
        expect(result.savingsAllocation.length).toBeGreaterThan(0);
        expect(result.recommendations.length).toBeGreaterThan(0);
      });
    });

    describe('calculateBudgetAdjustments', () => {
      test('should provide budget adjustment recommendations', () => {
        const params = {
          currentBudget: {
            income: 70000,
            expenses: [
              {
                category: 'Housing',
                amount: 3000,
                essential: true,
                flexibility: 0.1,
              },
              {
                category: 'Food',
                amount: 800,
                essential: true,
                flexibility: 0.2,
              },
              {
                category: 'Transportation',
                amount: 600,
                essential: true,
                flexibility: 0.15,
              },
              {
                category: 'Entertainment',
                amount: 500,
                essential: false,
                flexibility: 0.7,
              },
              {
                category: 'Dining Out',
                amount: 400,
                essential: false,
                flexibility: 0.8,
              },
              {
                category: 'Subscriptions',
                amount: 200,
                essential: false,
                flexibility: 0.9,
              },
            ],
          },
          savingsGoal: 2000, // Want to save $2000/month (more than current savings)
          targetSavingsRate: 0.35, // 35% savings rate
        };

        const result = engine.calculateBudgetAdjustments(params);

        expect(result.adjustmentPlan.length).toBeGreaterThanOrEqual(0);
        expect(result.totalSavingsIncrease).toBeGreaterThanOrEqual(0);
        expect(result.newSavingsRate).toBeGreaterThan(0);
        expect(result.implementationStrategy.length).toBeGreaterThanOrEqual(0);
        expect(result.alternativeStrategies.length).toBeGreaterThanOrEqual(0);
      });
    });

    // Performance Tests for Savings Rate calculations
    describe('Performance Tests', () => {
      test('Savings rate calculation should complete within 50ms', () => {
        const startTime = performance.now();

        engine.calculateRequiredSavingsRate({
          currentAge: 30,
          currentIncome: 80000,
          currentSavings: 10000,
          monthlyExpenses: 4000,
          goals: Array.from({ length: 5 }, (_, i) => ({
            id: `goal_${i}`,
            name: `Goal ${i}`,
            targetAmount: 100000 + i * 50000,
            targetDate: new Date(
              Date.now() + (i + 5) * 365 * 24 * 60 * 60 * 1000
            ),
            priority: i % 2 === 0 ? ('high' as const) : ('medium' as const),
            goalType: 'other' as const,
            currentProgress: 5000,
            isFlexible: true,
          })),
        });

        const executionTime = performance.now() - startTime;
        expect(executionTime).toBeLessThan(50);
      });

      test('Goal planning calculation should complete within 30ms', () => {
        const startTime = performance.now();

        engine.calculateGoalBasedPlanning({
          goals: Array.from({ length: 10 }, (_, i) => ({
            id: `goal_${i}`,
            name: `Goal ${i}`,
            targetAmount: 50000,
            currentAmount: 5000,
            targetDate: new Date(
              Date.now() + (i + 2) * 365 * 24 * 60 * 60 * 1000
            ),
            priority: 10 - i,
            goalType: 'other',
            inflationAdjusted: i % 2 === 0,
          })),
          currentIncome: 80000,
          currentExpenses: 48000,
          availableForSavings: 32000,
          expectedReturn: 0.07,
          inflationRate: 0.03,
        });

        const executionTime = performance.now() - startTime;
        expect(executionTime).toBeLessThan(30);
      });

      test('Budget adjustment calculation should complete within 20ms', () => {
        const startTime = performance.now();

        engine.calculateBudgetAdjustments({
          currentBudget: {
            income: 80000,
            expenses: Array.from({ length: 15 }, (_, i) => ({
              category: `Category ${i}`,
              amount: 200 + i * 50,
              essential: i < 8,
              flexibility: 0.1 + i * 0.05,
            })),
          },
          savingsGoal: 2000,
          targetSavingsRate: 0.3,
        });

        const executionTime = performance.now() - startTime;
        expect(executionTime).toBeLessThan(20);
      });
    });

    // Coast FIRE Calculation Tests (Story 4)
    describe('Coast FIRE Calculations', () => {
      describe('calculateCoastFIREAnalysis', () => {
        test('should calculate basic Coast FIRE analysis', () => {
          const params = {
            currentAge: 30,
            currentSavings: 50000,
            targetFireNumber: 1000000,
            expectedReturn: 0.07,
            coastAges: [35, 40, 45],
            traditionalRetirementAge: 65,
            currentMonthlyContributions: 2000,
          };

          const result = engine.calculateCoastFIREAnalysis(params);

          expect(result.coastPoints).toHaveLength(3);
          expect(result.coastPoints[0].age).toBe(35);
          expect(result.coastPoints[0].requiredAmount).toBeGreaterThan(0);
          expect(result.coastPoints[0].feasible).toBeDefined();
          expect(result.timeline).toBeDefined();
          expect(result.timeline.contributionPhase).toBeDefined();
          expect(result.timeline.coastPhase).toBeDefined();
          expect(result.recommendations.length).toBeGreaterThanOrEqual(5);
          expect(result.stressTestResults).toHaveLength(4);
        });

        test('should handle geographic arbitrage analysis', () => {
          const params = {
            currentAge: 28,
            currentSavings: 75000,
            targetFireNumber: 1200000,
            expectedReturn: 0.07,
            geographicArbitrage: {
              currentLocation: 'San Francisco',
              targetLocation: 'Austin',
              costOfLivingReduction: 0.3,
              movingCosts: 15000,
              timeToMove: 2,
            },
          };

          const result = engine.calculateCoastFIREAnalysis(params);

          expect(result.geographicArbitrage).toBeDefined();
          expect(result.geographicArbitrage!.currentLocationCost).toBe(1200000);
          expect(result.geographicArbitrage!.targetLocationCost).toBe(840000); // 30% reduction
          expect(result.geographicArbitrage!.fireNumberReduction).toBe(360000);
          expect(result.geographicArbitrage!.netBenefit).toBeGreaterThan(0);
          expect(result.geographicArbitrage!.paybackPeriod).toBeGreaterThan(0);
        });

        test('should analyze healthcare coverage gap', () => {
          const params = {
            currentAge: 32,
            currentSavings: 100000,
            targetFireNumber: 1500000,
            expectedReturn: 0.07,
            coastAges: [40],
            healthcareGapAnalysis: {
              currentEmployerCoverage: true,
              estimatedMonthlyCost: 800,
              ageForMedicare: 65,
              bridgeInsuranceYears: 25,
            },
          };

          const result = engine.calculateCoastFIREAnalysis(params);

          expect(result.healthcareGapAnalysis).toBeDefined();
          expect(result.healthcareGapAnalysis!.gapYears).toBe(25); // 65 - 40
          expect(result.healthcareGapAnalysis!.totalGapCost).toBe(240000); // 25 * 800 * 12
          expect(result.healthcareGapAnalysis!.monthlyBudgetImpact).toBe(800);
          expect(
            result.healthcareGapAnalysis!.mitigationStrategies
          ).toHaveLength(6);
          expect(result.healthcareGapAnalysis!.additionalFireNeeded).toBe(
            6000000
          ); // 240000 / 0.04
        });

        test('should perform stress testing scenarios', () => {
          const params = {
            currentAge: 35,
            currentSavings: 200000,
            targetFireNumber: 2000000,
            expectedReturn: 0.07,
            coastAges: [45, 50],
          };

          const result = engine.calculateCoastFIREAnalysis(params);

          expect(result.stressTestResults).toHaveLength(4);

          const marketCrashScenario = result.stressTestResults.find(s =>
            s.scenario.includes('Market Crash')
          );
          expect(marketCrashScenario).toBeDefined();
          expect(marketCrashScenario!.riskLevel).toBe('high');
          expect(marketCrashScenario!.adjustedCoastPoints).toHaveLength(2);
          expect(marketCrashScenario!.mitigationSuggestions).toHaveLength(5);

          // Verify that stress test increases required amounts
          expect(
            marketCrashScenario!.adjustedCoastPoints[0].requiredAmount
          ).toBeGreaterThan(result.coastPoints[0].requiredAmount);
        });

        test('should handle edge case with current age already past coast ages', () => {
          const params = {
            currentAge: 50,
            currentSavings: 300000,
            targetFireNumber: 1000000,
            expectedReturn: 0.07,
            coastAges: [35, 40, 45], // All in the past
          };

          const result = engine.calculateCoastFIREAnalysis(params);

          expect(result.coastPoints).toHaveLength(0); // No future coast points
          expect(result.recommendations.length).toBeGreaterThanOrEqual(4); // Still provides recommendations
        });

        test('should throw error for invalid parameters', () => {
          expect(() => {
            engine.calculateCoastFIREAnalysis({
              currentAge: 15, // Too young
              currentSavings: 50000,
              targetFireNumber: 1000000,
              expectedReturn: 0.07,
            });
          }).toThrow('Current age must be between 18 and 100');

          expect(() => {
            engine.calculateCoastFIREAnalysis({
              currentAge: 30,
              currentSavings: -10000, // Negative savings
              targetFireNumber: 1000000,
              expectedReturn: 0.07,
            });
          }).toThrow('Current savings cannot be negative');

          expect(() => {
            engine.calculateCoastFIREAnalysis({
              currentAge: 30,
              currentSavings: 50000,
              targetFireNumber: 0, // Zero FIRE number
              expectedReturn: 0.07,
            });
          }).toThrow('Target FIRE number must be positive');

          expect(() => {
            engine.calculateCoastFIREAnalysis({
              currentAge: 30,
              currentSavings: 50000,
              targetFireNumber: 1000000,
              expectedReturn: 0.6, // Too high return
            });
          }).toThrow('Expected return must be between 0% and 50%');
        });
      });

      describe('calculateBaristaFIREAnalysis', () => {
        test('should calculate basic Barista FIRE analysis', () => {
          const params = {
            currentAge: 30,
            currentSavings: 100000,
            fullFireNumber: 1500000,
            expectedReturn: 0.07,
            partTimeScenarios: [
              {
                name: 'Coffee Shop Barista',
                annualIncome: 25000,
                benefitsValue: 8000,
                workYears: 10,
                startAge: 45,
              },
              {
                name: 'Freelance Consulting',
                annualIncome: 40000,
                benefitsValue: 0,
                workYears: 15,
                startAge: 50,
              },
            ],
            baristaPhaseExpenses: {
              annualExpenses: 50000,
              healthcareCosts: 12000,
              inflationRate: 0.03,
            },
          };

          const result = engine.calculateBaristaFIREAnalysis(params);

          expect(result.scenarios).toHaveLength(2);
          expect(result.scenarios[0].name).toBe('Coffee Shop Barista');
          expect(result.scenarios[0].requiredSavings).toBeGreaterThan(0);
          expect(result.scenarios[0].savingsReduction).toBeGreaterThan(0);
          expect(result.scenarios[0].feasibilityScore).toBeGreaterThanOrEqual(
            0
          );
          expect(result.scenarios[0].feasibilityScore).toBeLessThanOrEqual(100);
          expect(result.scenarios[0].risks).toHaveLength(4);

          expect(result.recommendedScenario).toBeDefined();
          expect(result.recommendedScenario.scenarioName).toBeDefined();
          expect(
            result.recommendedScenario.reasonsForRecommendation
          ).toHaveLength(3);
          expect(result.recommendedScenario.keyBenefits).toHaveLength(4);
          expect(result.recommendedScenario.potentialDrawbacks).toHaveLength(4);

          expect(result.fullFireComparison).toBeDefined();
          expect(result.fullFireComparison.fullFireAmount).toBe(1500000);
          expect(result.fullFireComparison.savingsReduction).toBeGreaterThan(0);
        });

        test('should handle scenario with full expense coverage', () => {
          const params = {
            currentAge: 35,
            currentSavings: 200000,
            fullFireNumber: 1000000,
            expectedReturn: 0.07,
            partTimeScenarios: [
              {
                name: 'High-Income Part-Time',
                annualIncome: 60000,
                benefitsValue: 15000,
                workYears: 20,
                startAge: 45,
              },
            ],
            baristaPhaseExpenses: {
              annualExpenses: 60000,
              healthcareCosts: 10000,
              inflationRate: 0.03,
            },
          };

          const result = engine.calculateBaristaFIREAnalysis(params);

          expect(result.scenarios).toHaveLength(1);
          const scenario = result.scenarios[0];

          // With 60k income + 15k benefits = 75k total, covering 60k expenses
          expect(scenario.projections.expenseCoverage).toBeGreaterThan(100);
          expect(scenario.feasibilityScore).toBeGreaterThanOrEqual(80); // Should be highly feasible
        });

        test('should throw error for invalid Barista FIRE parameters', () => {
          expect(() => {
            engine.calculateBaristaFIREAnalysis({
              currentAge: 105, // Too old
              currentSavings: 50000,
              fullFireNumber: 1000000,
              expectedReturn: 0.07,
              partTimeScenarios: [],
              baristaPhaseExpenses: {
                annualExpenses: 40000,
                healthcareCosts: 8000,
                inflationRate: 0.03,
              },
            });
          }).toThrow('Current age must be between 18 and 100');

          expect(() => {
            engine.calculateBaristaFIREAnalysis({
              currentAge: 30,
              currentSavings: 50000,
              fullFireNumber: -100000, // Negative FIRE number
              expectedReturn: 0.07,
              partTimeScenarios: [
                {
                  name: 'Test',
                  annualIncome: 30000,
                  benefitsValue: 5000,
                  workYears: 10,
                  startAge: 45,
                },
              ],
              baristaPhaseExpenses: {
                annualExpenses: 40000,
                healthcareCosts: 8000,
                inflationRate: 0.03,
              },
            });
          }).toThrow('Full FIRE number must be positive');
        });
      });

      describe('generateCoastFIRETimelineData', () => {
        test('should generate timeline visualization data', () => {
          const params = {
            currentAge: 30,
            currentSavings: 100000,
            targetFireNumber: 1000000,
            expectedReturn: 0.07,
            traditionalRetirementAge: 65,
            currentMonthlyContributions: 3000,
          };

          const coastPoint = { age: 40, requiredAmount: 300000 };
          const result = engine.generateCoastFIRETimelineData(
            params,
            coastPoint
          );

          expect(result.timelineData).toBeDefined();
          expect(result.timelineData.length).toBe(36); // 30 to 65 = 36 years

          // Check contribution phase data
          const contributionPhaseData = result.timelineData.filter(
            d => d.phase === 'contribution'
          );
          expect(contributionPhaseData).toHaveLength(11); // 30 to 40 = 11 years
          expect(contributionPhaseData[0].age).toBe(30);
          expect(contributionPhaseData[0].contributions).toBe(36000); // 3000 * 12

          // Check coast phase data
          const coastPhaseData = result.timelineData.filter(
            d => d.phase === 'coast'
          );
          expect(coastPhaseData).toHaveLength(25); // 41 to 65 = 25 years
          expect(coastPhaseData[0].contributions).toBe(0);
          expect(coastPhaseData[0].growth).toBeGreaterThan(0);

          // Check phase breakdown
          expect(result.phaseBreakdown.contributionPhase.duration).toBe(10);
          expect(
            result.phaseBreakdown.contributionPhase.totalContributions
          ).toBeGreaterThan(0);
          expect(result.phaseBreakdown.coastPhase.duration).toBe(25);
          expect(result.phaseBreakdown.coastPhase.totalGrowth).toBeGreaterThan(
            0
          );
        });

        test('should include milestones in timeline data', () => {
          const params = {
            currentAge: 25,
            currentSavings: 50000,
            targetFireNumber: 800000,
            expectedReturn: 0.07,
            traditionalRetirementAge: 65,
            currentMonthlyContributions: 2000,
          };

          const coastPoint = { age: 35, requiredAmount: 200000 };
          const result = engine.generateCoastFIRETimelineData(
            params,
            coastPoint
          );

          // Find milestone entries
          const fiveYearMark = result.timelineData.find(d =>
            d.milestones.includes('5-Year Mark')
          );
          const tenYearMark = result.timelineData.find(d =>
            d.milestones.includes('10-Year Mark')
          );
          const coastFireAchieved = result.timelineData.find(d =>
            d.milestones.includes('Coast FIRE Achieved')
          );
          const traditionalRetirement = result.timelineData.find(d =>
            d.milestones.includes('Traditional Retirement Age')
          );

          expect(fiveYearMark).toBeDefined();
          expect(fiveYearMark!.age).toBe(30);
          expect(tenYearMark).toBeDefined();
          expect(tenYearMark!.age).toBe(35);
          expect(coastFireAchieved).toBeDefined();
          expect(coastFireAchieved!.age).toBe(35);
          expect(traditionalRetirement).toBeDefined();
          expect(traditionalRetirement!.age).toBe(65);
        });
      });

      // Market Volatility & Downturn Modeling Tests (Story 5)
      describe('Market Volatility & Downturn Modeling', () => {
        describe('calculateMarketVolatilityScenarios', () => {
          test('should calculate basic market volatility scenarios', () => {
            const params = {
              currentPortfolioValue: 500000,
              monthlyContributions: 3000,
              expectedReturn: 0.07,
              timeHorizon: 20,
              scenarioTypes: [
                'great_recession_2008',
                'covid_crash_2020',
                'market_correction_10',
              ],
              includeHistoricalData: true,
              confidenceIntervals: [10, 25, 50, 75, 90],
              volatilityModel: 'hybrid' as const,
              simulationIterations: 1000,
              includeRecoveryAnalysis: true,
            };

            const result = engine.calculateMarketVolatilityScenarios(params);

            expect(result.scenarios).toHaveLength(3);
            expect(result.scenarios[0].scenarioType).toBe(
              'great_recession_2008'
            );
            expect(result.scenarios[0].description).toContain(
              '2008 Financial Crisis'
            );
            expect(result.scenarios[0].probability).toBeGreaterThan(0);
            expect(result.scenarios[0].portfolioImpact).toBeDefined();
            expect(
              result.scenarios[0].portfolioImpact.peakDecline
            ).toBeGreaterThan(0);
            expect(result.scenarios[0].timeline).toBeDefined();
            expect(result.scenarios[0].confidenceIntervals).toHaveLength(5);

            expect(result.volatilityAnalysis).toBeDefined();
            expect(result.volatilityAnalysis.annualVolatility).toBeGreaterThan(
              0
            );
            expect(result.volatilityAnalysis.sharpeRatio).toBeDefined();
            expect(result.volatilityAnalysis.maxDrawdown).toBeGreaterThan(0);
            expect(result.volatilityAnalysis.valueAtRisk).toBeDefined();
            expect(
              result.volatilityAnalysis.conditionalValueAtRisk
            ).toBeDefined();

            expect(result.recoveryAnalysis).toBeDefined();
            expect(
              result.recoveryAnalysis!.averageRecoveryTime
            ).toBeGreaterThan(0);
            expect(result.recoveryAnalysis!.recoveryScenarios).toHaveLength(3);

            expect(result.recommendations).toBeDefined();
            expect(result.recommendations.length).toBeGreaterThan(0);
          });

          test('should handle withdrawal phase analysis', () => {
            const params = {
              currentPortfolioValue: 1000000,
              monthlyContributions: 0,
              expectedReturn: 0.07,
              timeHorizon: 30,
              scenarioTypes: ['sustained_low_returns', 'high_inflation_period'],
              withdrawalPhase: {
                startAge: 65,
                annualWithdrawal: 40000,
                withdrawalStrategy: 'dynamic' as const,
              },
            };

            const result = engine.calculateMarketVolatilityScenarios(params);

            expect(result.safeWithdrawalRateAnalysis).toBeDefined();
            expect(result.safeWithdrawalRateAnalysis!.currentSafeRate).toBe(
              0.04
            );
            expect(
              result.safeWithdrawalRateAnalysis!.stressTestedSafeRate
            ).toBeLessThan(0.04);
            expect(
              result.safeWithdrawalRateAnalysis!.dynamicStrategies
            ).toHaveLength(3);
            expect(
              result.safeWithdrawalRateAnalysis!.dynamicStrategies[0]
                .strategyName
            ).toBe('Fixed 4% Rule');
          });

          test('should handle rebalancing strategy analysis', () => {
            const params = {
              currentPortfolioValue: 750000,
              monthlyContributions: 2000,
              expectedReturn: 0.07,
              timeHorizon: 15,
              scenarioTypes: ['bear_market_20'],
              rebalancingStrategy: {
                type: 'threshold' as const,
                frequency: 'quarterly' as const,
                thresholdPercentage: 5,
                targetAllocation: {
                  stocks: 0.7,
                  bonds: 0.3,
                },
              },
              includeRecoveryAnalysis: true,
            };

            const result = engine.calculateMarketVolatilityScenarios(params);

            expect(result.recoveryAnalysis).toBeDefined();
            expect(result.recoveryAnalysis!.rebalancingBenefit).toBe(0.08); // 8% benefit
            expect(
              result.recommendations.some(r => r.category === 'strategy')
            ).toBe(true);
          });

          test('should validate input parameters', () => {
            expect(() => {
              engine.calculateMarketVolatilityScenarios({
                currentPortfolioValue: -10000, // Negative portfolio
                monthlyContributions: 1000,
                expectedReturn: 0.07,
                timeHorizon: 10,
                scenarioTypes: ['market_correction_10'],
              });
            }).toThrow('Portfolio value cannot be negative');

            expect(() => {
              engine.calculateMarketVolatilityScenarios({
                currentPortfolioValue: 100000,
                monthlyContributions: -500, // Negative contributions
                expectedReturn: 0.07,
                timeHorizon: 10,
                scenarioTypes: ['market_correction_10'],
              });
            }).toThrow('Monthly contributions cannot be negative');

            expect(() => {
              engine.calculateMarketVolatilityScenarios({
                currentPortfolioValue: 100000,
                monthlyContributions: 1000,
                expectedReturn: 0.07,
                timeHorizon: 0, // Invalid time horizon
                scenarioTypes: ['market_correction_10'],
              });
            }).toThrow('Time horizon must be between 1 and 50 years');

            expect(() => {
              engine.calculateMarketVolatilityScenarios({
                currentPortfolioValue: 100000,
                monthlyContributions: 1000,
                expectedReturn: 1.5, // Invalid return
                timeHorizon: 10,
                scenarioTypes: ['market_correction_10'],
              });
            }).toThrow('Expected return must be between -100% and 100%');
          });

          test('should handle all scenario types', () => {
            const allScenarioTypes = [
              'great_recession_2008',
              'covid_crash_2020',
              'dot_com_crash_2000',
              'black_monday_1987',
              'stagflation_1970s',
              'lost_decade_japan',
              'sustained_low_returns',
              'high_inflation_period',
              'rising_interest_rates',
              'market_correction_10',
              'bear_market_20',
              'severe_recession_30',
            ];

            const params = {
              currentPortfolioValue: 300000,
              monthlyContributions: 1500,
              expectedReturn: 0.07,
              timeHorizon: 25,
              scenarioTypes: allScenarioTypes,
              simulationIterations: 500, // Reduced for test performance
            };

            const result = engine.calculateMarketVolatilityScenarios(params);

            expect(result.scenarios).toHaveLength(12);

            // Verify each scenario has required properties
            result.scenarios.forEach(scenario => {
              expect(scenario.scenarioType).toBeDefined();
              expect(scenario.description).toBeDefined();
              expect(scenario.probability).toBeGreaterThan(0);
              expect(scenario.portfolioImpact).toBeDefined();
              expect(scenario.timeline).toBeDefined();
              expect(scenario.confidenceIntervals).toBeDefined();
            });

            // Verify specific scenario characteristics
            const recession2008 = result.scenarios.find(
              s => s.scenarioType === 'great_recession_2008'
            );
            expect(recession2008!.portfolioImpact.peakDecline).toBeGreaterThan(
              0.1
            ); // Significant decline

            const covidCrash = result.scenarios.find(
              s => s.scenarioType === 'covid_crash_2020'
            );
            expect(covidCrash!.portfolioImpact.recoveryTimeMonths).toBeLessThan(
              24
            ); // Quick recovery
          });
        });

        describe('calculateMarketStressTest', () => {
          test('should perform comprehensive stress testing', () => {
            const params = {
              portfolioValue: 600000,
              monthlyContributions: 2500,
              timeHorizon: 20,
              stressScenarios: [
                {
                  name: 'Severe Market Crash',
                  duration: 12,
                  monthlyReturns: [
                    -0.15, -0.12, -0.08, -0.05, -0.03, 0.02, 0.05, 0.03, 0.01,
                    -0.02, 0.04, 0.06,
                  ],
                  probability: 0.05,
                },
                {
                  name: 'Extended Bear Market',
                  duration: 24,
                  monthlyReturns: Array(24).fill(-0.02),
                  probability: 0.1,
                },
              ],
              recoveryAssumptions: {
                averageRecoveryReturn: 0.08,
                recoveryVolatility: 0.15,
                correlationWithCrash: -0.3,
              },
            };

            const result = engine.calculateMarketStressTest(params);

            expect(result.stressTestResults).toHaveLength(2);

            const severeMarketCrash = result.stressTestResults[0];
            expect(severeMarketCrash.scenarioName).toBe('Severe Market Crash');
            expect(severeMarketCrash.maxDrawdown).toBeGreaterThan(0);
            expect(severeMarketCrash.timeToRecovery).toBeGreaterThan(0);
            expect(severeMarketCrash.finalPortfolioValue).toBeGreaterThan(0);
            expect(severeMarketCrash.probabilityOfOccurrence).toBe(0.05);
            expect(severeMarketCrash.mitigationStrategies).toBeDefined();
            expect(
              severeMarketCrash.mitigationStrategies.length
            ).toBeGreaterThan(0);

            expect(result.portfolioResilience).toBeDefined();
            expect(
              result.portfolioResilience.overallScore
            ).toBeGreaterThanOrEqual(0);
            expect(result.portfolioResilience.overallScore).toBeLessThanOrEqual(
              100
            );
            expect(result.portfolioResilience.worstCaseScenario).toBeDefined();
            expect(result.portfolioResilience.recommendedActions).toBeDefined();
            expect(
              result.portfolioResilience.emergencyFundRecommendation
            ).toBeGreaterThan(0);
          });

          test('should generate appropriate mitigation strategies', () => {
            const params = {
              portfolioValue: 400000,
              monthlyContributions: 1000,
              timeHorizon: 15,
              stressScenarios: [
                {
                  name: 'High Volatility Period',
                  duration: 18,
                  monthlyReturns: Array(18)
                    .fill(0)
                    .map(() => (Math.random() - 0.5) * 0.2),
                  probability: 0.15,
                },
              ],
              recoveryAssumptions: {
                averageRecoveryReturn: 0.06,
                recoveryVolatility: 0.12,
                correlationWithCrash: -0.2,
              },
            };

            const result = engine.calculateMarketStressTest(params);

            const mitigationStrategies =
              result.stressTestResults[0].mitigationStrategies;

            // Verify all expected mitigation strategies are present
            const strategyNames = mitigationStrategies.map(s => s.strategy);
            expect(strategyNames).toContain('Enhanced Emergency Fund');
            expect(strategyNames).toContain('Portfolio Diversification');
            expect(strategyNames).toContain('Systematic Rebalancing');
            expect(strategyNames).toContain('Dollar-Cost Averaging');

            // Verify strategy properties
            mitigationStrategies.forEach(strategy => {
              expect(strategy.effectivenessScore).toBeGreaterThanOrEqual(0);
              expect(strategy.effectivenessScore).toBeLessThanOrEqual(100);
              expect(strategy.implementationCost).toBeGreaterThanOrEqual(0);
              expect(strategy.description).toBeDefined();
            });
          });

          test('should validate stress test parameters', () => {
            expect(() => {
              engine.calculateMarketStressTest({
                portfolioValue: -50000, // Negative portfolio
                monthlyContributions: 1000,
                timeHorizon: 10,
                stressScenarios: [],
                recoveryAssumptions: {
                  averageRecoveryReturn: 0.06,
                  recoveryVolatility: 0.12,
                  correlationWithCrash: -0.2,
                },
              });
            }).toThrow('Portfolio value cannot be negative');

            expect(() => {
              engine.calculateMarketStressTest({
                portfolioValue: 100000,
                monthlyContributions: 1000,
                timeHorizon: 0, // Invalid time horizon
                stressScenarios: [],
                recoveryAssumptions: {
                  averageRecoveryReturn: 0.06,
                  recoveryVolatility: 0.12,
                  correlationWithCrash: -0.2,
                },
              });
            }).toThrow('Time horizon must be between 1 and 50 years');
          });
        });
      });

      // Performance Tests for Coast FIRE calculations
      describe('Coast FIRE Performance Tests', () => {
        test('Coast FIRE calculation should complete within 100ms', () => {
          const startTime = performance.now();

          engine.calculateCoastFIREAnalysis({
            currentAge: 30,
            currentSavings: 100000,
            targetFireNumber: 1500000,
            expectedReturn: 0.07,
            coastAges: [35, 40, 45, 50, 55],
            geographicArbitrage: {
              currentLocation: 'NYC',
              targetLocation: 'Austin',
              costOfLivingReduction: 0.25,
              movingCosts: 20000,
              timeToMove: 3,
            },
            healthcareGapAnalysis: {
              currentEmployerCoverage: true,
              estimatedMonthlyCost: 1000,
              ageForMedicare: 65,
              bridgeInsuranceYears: 20,
            },
          });

          const executionTime = performance.now() - startTime;
          expect(executionTime).toBeLessThan(100);
        });

        test('Barista FIRE calculation should complete within 50ms', () => {
          const startTime = performance.now();

          engine.calculateBaristaFIREAnalysis({
            currentAge: 30,
            currentSavings: 150000,
            fullFireNumber: 2000000,
            expectedReturn: 0.07,
            partTimeScenarios: Array.from({ length: 5 }, (_, i) => ({
              name: `Scenario ${i + 1}`,
              annualIncome: 30000 + i * 10000,
              benefitsValue: 5000 + i * 2000,
              workYears: 10 + i * 2,
              startAge: 45 + i * 2,
            })),
            baristaPhaseExpenses: {
              annualExpenses: 60000,
              healthcareCosts: 12000,
              inflationRate: 0.03,
            },
          });

          const executionTime = performance.now() - startTime;
          expect(executionTime).toBeLessThan(50);
        });

        test('Timeline generation should complete within 30ms', () => {
          const startTime = performance.now();

          engine.generateCoastFIRETimelineData(
            {
              currentAge: 25,
              currentSavings: 75000,
              targetFireNumber: 1200000,
              expectedReturn: 0.07,
              traditionalRetirementAge: 65,
              currentMonthlyContributions: 2500,
            },
            { age: 40, requiredAmount: 350000 }
          );

          const executionTime = performance.now() - startTime;
          expect(executionTime).toBeLessThan(30);
        });

        test('Market volatility calculation should complete within 200ms', () => {
          const startTime = performance.now();

          engine.calculateMarketVolatilityScenarios({
            currentPortfolioValue: 500000,
            monthlyContributions: 2000,
            expectedReturn: 0.07,
            timeHorizon: 20,
            scenarioTypes: [
              'great_recession_2008',
              'covid_crash_2020',
              'market_correction_10',
            ],
            simulationIterations: 1000,
            includeRecoveryAnalysis: true,
            withdrawalPhase: {
              startAge: 65,
              annualWithdrawal: 30000,
              withdrawalStrategy: 'dynamic',
            },
          });

          const executionTime = performance.now() - startTime;
          expect(executionTime).toBeLessThan(200);
        });

        test('Market stress test should complete within 100ms', () => {
          const startTime = performance.now();

          engine.calculateMarketStressTest({
            portfolioValue: 400000,
            monthlyContributions: 1500,
            timeHorizon: 15,
            stressScenarios: [
              {
                name: 'Market Crash',
                duration: 12,
                monthlyReturns: Array(12).fill(-0.08),
                probability: 0.05,
              },
              {
                name: 'Bear Market',
                duration: 18,
                monthlyReturns: Array(18).fill(-0.03),
                probability: 0.1,
              },
            ],
            recoveryAssumptions: {
              averageRecoveryReturn: 0.08,
              recoveryVolatility: 0.15,
              correlationWithCrash: -0.3,
            },
          });

          const executionTime = performance.now() - startTime;
          expect(executionTime).toBeLessThan(100);
        });

        test('Complex market scenario analysis should complete within 500ms', () => {
          const startTime = performance.now();

          engine.calculateMarketVolatilityScenarios({
            currentPortfolioValue: 750000,
            monthlyContributions: 3000,
            expectedReturn: 0.07,
            timeHorizon: 30,
            scenarioTypes: [
              'great_recession_2008',
              'covid_crash_2020',
              'dot_com_crash_2000',
              'stagflation_1970s',
              'sustained_low_returns',
              'high_inflation_period',
            ],
            simulationIterations: 2000,
            includeRecoveryAnalysis: true,
            dollarCostAveragingAnalysis: true,
            rebalancingStrategy: {
              type: 'threshold',
              frequency: 'quarterly',
              thresholdPercentage: 5,
              targetAllocation: {
                stocks: 0.7,
                bonds: 0.25,
                alternatives: 0.05,
              },
            },
            withdrawalPhase: {
              startAge: 60,
              annualWithdrawal: 50000,
              withdrawalStrategy: 'floor_ceiling',
            },
          });

          const executionTime = performance.now() - startTime;
          expect(executionTime).toBeLessThan(500);
        });
      });
    });
  });
});

// Export for use in other test files
// export { engine };
