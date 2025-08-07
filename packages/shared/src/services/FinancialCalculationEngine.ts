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
  MarketScenarioType,
  MarketStressTestParams,
  MarketStressTestResult,
  HistoricalMarketData,
  RebalancingStrategy,
  DebtAccount,
  DebtType,
  DebtPayoffStrategy,
  DebtConsolidationOption,
  ConsolidationType,
  CreditScoreFactor,
  EmergencyFundScenario,
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

      // Validate input parameters
      if (
        principal < 0 ||
        annualRate < 0 ||
        compoundingFrequency <= 0 ||
        timeInYears <= 0
      ) {
        throw new Error('Invalid parameters for compound interest calculation');
      }

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
      throw new Error(
        `Compound interest calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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

      // Validate input parameters
      if (
        initialValue < 0 ||
        yearsToProject <= 0 ||
        iterations <= 0 ||
        volatility < 0
      ) {
        throw new Error('Invalid parameters for Monte Carlo simulation');
      }

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
      throw new Error(
        `Monte Carlo simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Calculate required savings rate to reach financial goals (Story 3)
   * Determines optimal savings rate and provides budget adjustment recommendations
   */
  calculateRequiredSavingsRate(
    params: SavingsRateCalculationParams
  ): SavingsRateCalculationResult {
    const startTime = performance.now();

    // Generate cache key
    const cacheKey = this.generateCacheKey('savings_rate', params);

    // Check cache first
    const cachedResult = this.getFromCache(cacheKey);
    if (cachedResult) {
      this.recordPerformance(
        'calculateRequiredSavingsRate',
        performance.now() - startTime,
        true,
        params.goals.length
      );
      return cachedResult;
    }

    // Validate input parameters
    this.validateSavingsRateParams(params);

    // Calculate required savings for each goal
    const goalCalculations = this.calculateGoalRequirements(params);

    // Optimize savings allocation across goals
    const optimizedAllocation = this.optimizeSavingsAllocation(
      params,
      goalCalculations
    );

    // Generate budget adjustment recommendations
    const budgetAdjustments = this.generateBudgetAdjustments(
      params,
      optimizedAllocation
    );

    // Generate income optimization suggestions
    const incomeOptimization = this.generateIncomeOptimization(params);

    // Perform timeline analysis
    const timelineAnalysis = this.analyzeTimelines(params, optimizedAllocation);

    // Generate scenario analysis
    const scenarioAnalysis = this.generateScenarioAnalysis(
      params,
      optimizedAllocation
    );

    // Create progress milestones
    const milestones = this.createProgressMilestones(
      params,
      optimizedAllocation
    );

    const result: SavingsRateCalculationResult = {
      recommendedSavingsRate: optimizedAllocation.totalSavingsRate,
      requiredMonthlySavings: optimizedAllocation.totalMonthlySavings,
      currentSavingsGap:
        optimizedAllocation.totalMonthlySavings -
        (params.currentIncome - params.monthlyExpenses),
      goalBreakdown: optimizedAllocation.goalBreakdown,
      budgetAdjustments,
      incomeOptimization,
      timelineAnalysis,
      scenarioAnalysis,
      milestones,
    };

    // Cache the result
    this.setCache(cacheKey, result, ['savings_rate', 'goals']);

    // Record performance
    const executionTime = performance.now() - startTime;
    this.recordPerformance(
      'calculateRequiredSavingsRate',
      executionTime,
      false,
      params.goals.length
    );

    return result;
  }

  /**
   * Perform goal-based financial planning
   * Optimizes savings allocation across multiple financial goals
   */
  calculateGoalBasedPlanning(
    params: GoalBasedPlanningParams
  ): GoalBasedPlanningResult {
    const startTime = performance.now();

    // Generate cache key
    const cacheKey = this.generateCacheKey('goal_planning', params);

    // Check cache first
    const cachedResult = this.getFromCache(cacheKey);
    if (cachedResult) {
      this.recordPerformance(
        'calculateGoalBasedPlanning',
        performance.now() - startTime,
        true,
        params.goals.length
      );
      return cachedResult;
    }

    // Validate parameters
    this.validateGoalPlanningParams(params);

    // Calculate required savings for each goal
    const goalRequirements = params.goals.map(goal => {
      const monthsToGoal = this.calculateMonthsToDate(goal.targetDate);
      const remainingAmount = goal.targetAmount - goal.currentAmount;
      const adjustedAmount = goal.inflationAdjusted
        ? remainingAmount *
          Math.pow(1 + params.inflationRate, monthsToGoal / 12)
        : remainingAmount;

      const requiredMonthlySavings = this.calculateRequiredMonthlySavings(
        adjustedAmount,
        monthsToGoal,
        params.expectedReturn
      );

      return {
        goalId: goal.id,
        requiredMonthlySavings,
        adjustedTargetAmount: adjustedAmount,
        monthsToGoal,
        priority: goal.priority,
      };
    });

    // Sort goals by priority
    const prioritizedGoals = goalRequirements.sort(
      (a, b) => b.priority - a.priority
    );

    // Calculate total required savings
    const totalRequiredSavings = goalRequirements.reduce(
      (sum, goal) => sum + goal.requiredMonthlySavings,
      0
    );
    const recommendedSavingsRate = totalRequiredSavings / params.currentIncome;

    // Determine plan feasibility
    const maxSavingsRate = params.constraints?.maxSavingsRate || 0.5;
    let planFeasibility: 'achievable' | 'challenging' | 'unrealistic';
    let confidenceScore: number;

    if (recommendedSavingsRate <= maxSavingsRate * 0.7) {
      planFeasibility = 'achievable';
      confidenceScore = 0.9;
    } else if (recommendedSavingsRate <= maxSavingsRate) {
      planFeasibility = 'challenging';
      confidenceScore = 0.6;
    } else {
      planFeasibility = 'unrealistic';
      confidenceScore = 0.3;
    }

    // Create goal prioritization
    const goalPrioritization = prioritizedGoals.map((goal, index) => ({
      goalId: goal.goalId,
      rank: index + 1,
      allocatedSavings: Math.min(
        goal.requiredMonthlySavings,
        params.availableForSavings * (goal.priority / 10)
      ),
      projectedCompletion: new Date(
        Date.now() + goal.monthsToGoal * 30 * 24 * 60 * 60 * 1000
      ),
      successProbability: confidenceScore * (goal.priority / 10),
    }));

    // Generate savings allocation timeline
    const savingsAllocation = this.generateSavingsAllocation(
      params,
      goalRequirements
    );

    // Generate recommendations
    const recommendations = this.generatePlanningRecommendations(
      params,
      goalRequirements,
      planFeasibility
    );

    const result: GoalBasedPlanningResult = {
      overallPlan: {
        totalRequiredSavings,
        recommendedSavingsRate,
        planFeasibility,
        confidenceScore,
      },
      goalPrioritization,
      savingsAllocation,
      recommendations,
    };

    // Cache the result
    this.setCache(cacheKey, result, ['goal_planning']);

    // Record performance
    const executionTime = performance.now() - startTime;
    this.recordPerformance(
      'calculateGoalBasedPlanning',
      executionTime,
      false,
      params.goals.length
    );

    return result;
  }

  /**
   * Analyze budget and provide adjustment recommendations
   */
  calculateBudgetAdjustments(
    params: BudgetAdjustmentParams
  ): BudgetAdjustmentResult {
    const startTime = performance.now();

    // Generate cache key
    const cacheKey = this.generateCacheKey('budget_adjustment', params);

    // Check cache first
    const cachedResult = this.getFromCache(cacheKey);
    if (cachedResult) {
      this.recordPerformance(
        'calculateBudgetAdjustments',
        performance.now() - startTime,
        true,
        params.currentBudget.expenses.length
      );
      return cachedResult;
    }

    // Validate parameters
    this.validateBudgetAdjustmentParams(params);

    // Calculate current savings gap
    const currentSavings =
      params.currentBudget.income -
      params.currentBudget.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const savingsGap = params.savingsGoal - currentSavings;

    if (savingsGap <= 0) {
      // Already meeting savings goal
      return {
        adjustmentPlan: [],
        totalSavingsIncrease: 0,
        newSavingsRate: currentSavings / params.currentBudget.income,
        implementationStrategy: [],
        alternativeStrategies: [],
      };
    }

    // Analyze each expense category for reduction potential
    const adjustmentPlan = params.currentBudget.expenses
      .filter(
        expense =>
          !params.preferences?.protectedCategories?.includes(expense.category)
      )
      .map(expense => {
        const maxReduction = expense.amount * expense.flexibility;
        const recommendedReduction = Math.min(maxReduction, savingsGap * 0.3); // Don't cut any single category too drastically

        let difficulty: 'easy' | 'medium' | 'hard';
        let qualityOfLifeImpact: 'low' | 'medium' | 'high';

        if (expense.essential) {
          difficulty = 'hard';
          qualityOfLifeImpact = 'high';
        } else if (expense.flexibility > 0.5) {
          difficulty = 'easy';
          qualityOfLifeImpact = 'low';
        } else {
          difficulty = 'medium';
          qualityOfLifeImpact = 'medium';
        }

        return {
          category: expense.category,
          currentAmount: expense.amount,
          recommendedAmount: expense.amount - recommendedReduction,
          reduction: recommendedReduction,
          reductionPercentage: recommendedReduction / expense.amount,
          difficulty,
          qualityOfLifeImpact,
        };
      })
      .filter(adjustment => adjustment.reduction > 0)
      .sort((a, b) => {
        // Prioritize easy reductions first
        const difficultyScore = { easy: 1, medium: 2, hard: 3 };
        return difficultyScore[a.difficulty] - difficultyScore[b.difficulty];
      });

    const totalSavingsIncrease = adjustmentPlan.reduce(
      (sum, adj) => sum + adj.reduction,
      0
    );
    const newSavingsRate =
      (currentSavings + totalSavingsIncrease) / params.currentBudget.income;

    // Create implementation strategy
    const implementationStrategy = [
      {
        phase: 1,
        duration: '1 month',
        changes: adjustmentPlan
          .filter(adj => adj.difficulty === 'easy')
          .map(adj => `Reduce ${adj.category} by $${adj.reduction.toFixed(0)}`),
        expectedSavings: adjustmentPlan
          .filter(adj => adj.difficulty === 'easy')
          .reduce((sum, adj) => sum + adj.reduction, 0),
      },
      {
        phase: 2,
        duration: '2-3 months',
        changes: adjustmentPlan
          .filter(adj => adj.difficulty === 'medium')
          .map(adj => `Reduce ${adj.category} by $${adj.reduction.toFixed(0)}`),
        expectedSavings: adjustmentPlan
          .filter(adj => adj.difficulty === 'medium')
          .reduce((sum, adj) => sum + adj.reduction, 0),
      },
      {
        phase: 3,
        duration: '3-6 months',
        changes: adjustmentPlan
          .filter(adj => adj.difficulty === 'hard')
          .map(adj => `Reduce ${adj.category} by $${adj.reduction.toFixed(0)}`),
        expectedSavings: adjustmentPlan
          .filter(adj => adj.difficulty === 'hard')
          .reduce((sum, adj) => sum + adj.reduction, 0),
      },
    ].filter(phase => phase.changes.length > 0);

    // Generate alternative strategies
    const alternativeStrategies = [
      {
        strategy: 'Increase Income',
        description: 'Focus on earning more rather than spending less',
        potentialSavings: savingsGap,
        effort: 'medium' as const,
        timeframe: '3-12 months',
      },
      {
        strategy: 'Hybrid Approach',
        description: 'Combine moderate expense reduction with income increase',
        potentialSavings: savingsGap,
        effort: 'medium' as const,
        timeframe: '2-6 months',
      },
      {
        strategy: 'Lifestyle Downsizing',
        description: 'Make significant lifestyle changes for maximum savings',
        potentialSavings: savingsGap * 1.5,
        effort: 'high' as const,
        timeframe: '1-3 months',
      },
    ];

    const result: BudgetAdjustmentResult = {
      adjustmentPlan,
      totalSavingsIncrease,
      newSavingsRate,
      implementationStrategy,
      alternativeStrategies,
    };

    // Cache the result
    this.setCache(cacheKey, result, ['budget_adjustment']);

    // Record performance
    const executionTime = performance.now() - startTime;
    this.recordPerformance(
      'calculateBudgetAdjustments',
      executionTime,
      false,
      params.currentBudget.expenses.length
    );

    return result;
  }

  /**
   * Enhanced debt payoff strategies calculator
   * Epic 7, Story 6: Debt Payoff Strategy Calculator
   */
  public calculateDebtPayoff(params: DebtPayoffParams): DebtPayoffResult {
    // Input validation
    if (!params.debts || params.debts.length === 0) {
      throw new Error('At least one debt must be provided');
    }

    for (const debt of params.debts) {
      if (debt.balance < 0) {
        throw new Error('Debt balance cannot be negative');
      }
      if (debt.interestRate < 0 || debt.interestRate > 1) {
        throw new Error('Interest rate must be between 0 and 100%');
      }
      if (debt.minimumPayment < 0) {
        throw new Error('Minimum payment cannot be negative');
      }
    }
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

      // Validate input parameters
      if (!debts || debts.length === 0) {
        throw new Error('At least one debt must be provided');
      }

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

      const payoffSchedule: Array<{
        month: number;
        debtId: string;
        debtName: string;
        payment: number;
        principalPayment: number;
        interestPayment: number;
        remainingBalance: number;
        isPaidOff: boolean;
      }> = [];
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

      // Enhanced result with Story 6 features
      const strategies = this.calculateAllDebtStrategies(params);
      const consolidationAnalysis = params.includeConsolidationAnalysis
        ? this.calculateConsolidationAnalysis(params)
        : undefined;
      const creditScoreProjections = params.includeCreditScoreProjections
        ? this.calculateCreditScoreProjections(params)
        : undefined;
      const emergencyFundAnalysis = params.includeEmergencyFundAnalysis
        ? this.calculateEmergencyFundAnalysis(params)
        : undefined;
      const fireIntegration = params.includeFireIntegration
        ? this.calculateFireIntegration(params)
        : undefined;
      const recommendations = this.generateDebtPayoffRecommendations(
        params,
        strategies
      );

      const result: DebtPayoffResult = {
        // Legacy compatibility
        strategy,
        totalInterest,
        totalTime: currentMonth,
        monthlySavings: extraPayment,
        payoffSchedule,
        debtOrder,

        // Enhanced features (Story 6)
        strategies,
        consolidationAnalysis,
        creditScoreProjections,
        emergencyFundAnalysis,
        fireIntegration,
        recommendations,
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
      throw new Error(
        `Debt payoff calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Calculate all debt payoff strategies for comparison
   * Epic 7, Story 6: Strategy Comparison Engine
   */
  private calculateAllDebtStrategies(params: DebtPayoffParams): Array<{
    strategyType: DebtPayoffStrategy;
    strategyName: string;
    description: string;
    totalMonths: number;
    totalInterestPaid: number;
    totalAmountPaid: number;
    monthlyPayment: number;
    interestSavings: number;
    timeSavings: number;
  }> {
    const strategies: DebtPayoffStrategy[] = [
      'snowball',
      'avalanche',
      'highest_payment',
      'minimum_only',
    ];
    const results = [];

    // Calculate baseline (minimum payments only)
    const baselineParams = {
      ...params,
      strategy: 'minimum_only' as DebtPayoffStrategy,
      extraPayment: 0,
    };
    const baseline = this.calculateSingleDebtStrategy(baselineParams);

    for (const strategy of strategies) {
      const strategyParams = { ...params, strategy };
      const result = this.calculateSingleDebtStrategy(strategyParams);

      const strategyInfo = this.getStrategyInfo(strategy);

      results.push({
        strategyType: strategy,
        strategyName: strategyInfo.name,
        description: strategyInfo.description,
        totalMonths: result.totalTime,
        totalInterestPaid: result.totalInterest,
        totalAmountPaid:
          result.totalInterest +
          params.debts.reduce((sum, d) => sum + d.balance, 0),
        monthlyPayment:
          params.debts.reduce((sum, d) => sum + d.minimumPayment, 0) +
          params.extraPayment,
        interestSavings: baseline.totalInterest - result.totalInterest,
        timeSavings: baseline.totalTime - result.totalTime,
      });
    }

    return results;
  }

  /**
   * Get strategy information
   */
  private getStrategyInfo(strategy: DebtPayoffStrategy): {
    name: string;
    description: string;
  } {
    const strategyMap = {
      snowball: {
        name: 'Debt Snowball',
        description:
          'Pay off smallest balances first for psychological wins and momentum',
      },
      avalanche: {
        name: 'Debt Avalanche',
        description:
          'Pay off highest interest rates first for maximum interest savings',
      },
      highest_payment: {
        name: 'Highest Payment First',
        description: 'Target debts with highest minimum payments first',
      },
      minimum_only: {
        name: 'Minimum Payments Only',
        description: 'Pay only minimum required payments on all debts',
      },
      custom: {
        name: 'Custom Order',
        description: 'User-defined payoff order based on personal preferences',
      },
      debt_to_income: {
        name: 'Debt-to-Income Priority',
        description: 'Prioritize debts with highest debt-to-income impact',
      },
      credit_impact: {
        name: 'Credit Score Impact',
        description: 'Focus on debts with highest positive credit score impact',
      },
    };

    return (
      strategyMap[strategy] || {
        name: 'Unknown Strategy',
        description: 'Unknown strategy type',
      }
    );
  }

  /**
   * Calculate single debt strategy
   */
  private calculateSingleDebtStrategy(params: DebtPayoffParams): {
    totalTime: number;
    totalInterest: number;
  } {
    // Simplified calculation for strategy comparison
    const debts = [...params.debts];
    let totalInterest = 0;
    let currentMonth = 0;
    const maxMonths = 600; // 50 years maximum

    // Sort debts based on strategy
    this.sortDebtsByStrategy(debts, params.strategy);

    while (debts.some(d => d.balance > 0) && currentMonth < maxMonths) {
      currentMonth++;
      let remainingExtra = params.extraPayment;

      // Apply minimum payments and interest
      for (const debt of debts) {
        if (debt.balance > 0) {
          const monthlyInterest = (debt.balance * debt.interestRate) / 12;
          totalInterest += monthlyInterest;

          const principalPayment = Math.min(
            debt.minimumPayment - monthlyInterest,
            debt.balance
          );
          debt.balance = Math.max(0, debt.balance - principalPayment);
        }
      }

      // Apply extra payments based on strategy
      for (const debt of debts) {
        if (debt.balance > 0 && remainingExtra > 0) {
          const extraPayment = Math.min(remainingExtra, debt.balance);
          debt.balance -= extraPayment;
          remainingExtra -= extraPayment;

          if (params.strategy !== 'minimum_only') {
            break; // Focus extra payment on first debt in strategy order
          }
        }
      }
    }

    return { totalTime: currentMonth, totalInterest };
  }

  /**
   * Sort debts by strategy
   */
  private sortDebtsByStrategy(
    debts: DebtAccount[],
    strategy: DebtPayoffStrategy
  ): void {
    switch (strategy) {
      case 'snowball':
        debts.sort((a, b) => a.balance - b.balance);
        break;
      case 'avalanche':
        debts.sort((a, b) => b.interestRate - a.interestRate);
        break;
      case 'highest_payment':
        debts.sort((a, b) => b.minimumPayment - a.minimumPayment);
        break;
      case 'debt_to_income':
        // Assuming monthly income is available in params
        debts.sort(
          (a, b) => b.balance / b.minimumPayment - a.balance / a.minimumPayment
        );
        break;
      case 'credit_impact':
        // Prioritize credit cards and high utilization debts
        debts.sort((a, b) => {
          const aScore = this.getCreditImpactScore(a);
          const bScore = this.getCreditImpactScore(b);
          return bScore - aScore;
        });
        break;
      default:
        // Keep original order for minimum_only and custom
        break;
    }
  }

  /**
   * Get credit impact score for debt prioritization
   */
  private getCreditImpactScore(debt: DebtAccount): number {
    let score = 0;

    // Credit cards have higher impact
    if (debt.type === 'credit_card') {
      score += 50;

      // High utilization has higher impact
      if (debt.creditLimit) {
        const utilization = debt.balance / debt.creditLimit;
        if (utilization > 0.3) score += 30;
        if (utilization > 0.7) score += 20;
      }
    }

    // Higher interest rates have more impact
    score += debt.interestRate * 2;

    // Accounts reported to credit have higher impact
    if (debt.reportedToCredit) {
      score += 20;
    }

    return score;
  }

  /**
   * Calculate debt consolidation analysis
   * Epic 7, Story 6: Consolidation Analysis
   */
  private calculateConsolidationAnalysis(params: DebtPayoffParams): any {
    const eligibleDebts = params.debts
      .filter(
        debt => debt.type === 'credit_card' || debt.type === 'personal_loan'
      )
      .map(debt => debt.id);

    const totalDebt = params.debts.reduce((sum, debt) => sum + debt.balance, 0);
    const weightedInterestRate =
      totalDebt > 0
        ? params.debts.reduce(
            (sum, debt) => sum + debt.balance * debt.interestRate,
            0
          ) / totalDebt
        : 0.15; // Default 15% if no debt

    const consolidationOptions = [
      {
        optionName: 'Personal Loan Consolidation',
        newInterestRate: Math.max(0.06, weightedInterestRate - 0.03), // 3% lower than weighted average
        newMonthlyPayment: totalDebt * 0.02, // 2% of total debt
        totalMonths: 60, // 5 years
        totalInterestPaid: 0,
        savingsVsOriginal: 0,
        requirements: [
          'Credit score 650+',
          'Debt-to-income ratio <40%',
          'Stable income',
        ],
        pros: [
          'Single monthly payment',
          'Fixed interest rate',
          'Predictable payoff timeline',
        ],
        cons: [
          'May require collateral',
          'Origination fees',
          'Temptation to accumulate new debt',
        ],
      },
      {
        optionName: 'Balance Transfer Credit Card',
        newInterestRate: 0.0, // 0% promotional rate
        newMonthlyPayment: totalDebt * 0.025, // 2.5% of total debt
        totalMonths: 18, // 18 months promotional period
        totalInterestPaid: 0,
        savingsVsOriginal: 0,
        requirements: [
          'Excellent credit score 720+',
          'Low credit utilization',
          'Good payment history',
        ],
        pros: [
          '0% promotional rate',
          'No origination fees',
          'Rewards potential',
        ],
        cons: [
          'Promotional rate expires',
          'Balance transfer fees',
          'High rate after promotion',
        ],
      },
    ];

    // Calculate savings for each option
    const originalResult = this.calculateSingleDebtStrategy(params);

    consolidationOptions.forEach(option => {
      option.totalInterestPaid =
        (option.newInterestRate * totalDebt * option.totalMonths) / 12;
      option.savingsVsOriginal =
        originalResult.totalInterest - option.totalInterestPaid;
    });

    const recommendedOption = consolidationOptions.reduce((best, current) =>
      current.savingsVsOriginal > best.savingsVsOriginal ? current : best
    ).optionName;

    return {
      eligibleDebts,
      consolidationOptions,
      recommendedOption,
    };
  }

  /**
   * Calculate credit score projections
   * Epic 7, Story 6: Credit Score Analysis
   */
  private calculateCreditScoreProjections(params: DebtPayoffParams): any {
    const currentScore = 650; // Default starting score
    const projectedScores = [];

    // Calculate credit utilization impact
    const totalCreditLimit = params.debts
      .filter(debt => debt.creditLimit)
      .reduce((sum, debt) => sum + (debt.creditLimit || 0), 0);

    const totalCreditCardDebt = params.debts
      .filter(debt => debt.type === 'credit_card')
      .reduce((sum, debt) => sum + debt.balance, 0);

    const currentUtilization =
      totalCreditLimit > 0 ? totalCreditCardDebt / totalCreditLimit : 0;

    // Project score improvements over time
    for (let month = 0; month <= 24; month += 6) {
      const utilizationImprovement = Math.max(
        0,
        currentUtilization - month * 0.05
      );
      const paymentHistoryImprovement = month * 2; // 2 points per 6 months of good payments
      const creditAgeImprovement = month * 0.5; // 0.5 points per 6 months

      const projectedScore = Math.min(
        850,
        currentScore +
          paymentHistoryImprovement +
          (currentUtilization > 0.3
            ? (currentUtilization - utilizationImprovement) * 100
            : 0) +
          creditAgeImprovement
      );

      projectedScores.push({
        month,
        score: Math.round(projectedScore),
        factors: [
          {
            factor: 'Payment History',
            impact: paymentHistoryImprovement,
            description: 'Consistent on-time payments improve score',
          },
          {
            factor: 'Credit Utilization',
            impact: utilizationImprovement * 100,
            description: 'Lower credit card balances improve utilization ratio',
          },
          {
            factor: 'Credit Age',
            impact: creditAgeImprovement,
            description: 'Older accounts improve average account age',
          },
        ],
      });
    }

    const scoreImprovementTips = [
      'Pay all bills on time to build positive payment history',
      'Keep credit card balances below 30% of credit limits',
      'Pay down high-interest debt first to improve utilization',
      'Avoid closing old credit cards to maintain credit history length',
      "Consider becoming an authorized user on a family member's account",
      'Monitor credit reports regularly for errors and disputes',
    ];

    return {
      currentScore,
      projectedScores,
      scoreImprovementTips,
    };
  }

  /**
   * Calculate emergency fund vs debt analysis
   * Epic 7, Story 6: Emergency Fund Analysis
   */
  private calculateEmergencyFundAnalysis(params: DebtPayoffParams): any {
    const monthlyExpenses = params.monthlyExpenses;
    const recommendedEmergencyFund = monthlyExpenses * 6; // 6 months of expenses

    const scenarios = [
      {
        scenarioName: 'Emergency Fund First',
        emergencyFundAmount: recommendedEmergencyFund,
        debtPayoffAmount: 0,
        description: 'Build full emergency fund before aggressive debt payoff',
        totalInterestPaid: 0,
        payoffTimeMonths: 0,
        riskScore: 20, // Low risk
        advantages: [
          'Financial security for unexpected expenses',
          'Prevents need to use credit cards for emergencies',
          'Peace of mind and reduced financial stress',
        ],
        disadvantages: [
          'Higher total interest paid on debt',
          'Longer time to become debt-free',
          'Opportunity cost of low emergency fund returns',
        ],
      },
      {
        scenarioName: 'Debt First',
        emergencyFundAmount: monthlyExpenses * 1, // 1 month only
        debtPayoffAmount: params.extraPayment,
        description: 'Minimal emergency fund, focus on debt elimination',
        totalInterestPaid: 0,
        payoffTimeMonths: 0,
        riskScore: 80, // High risk
        advantages: [
          'Faster debt elimination',
          'Lower total interest paid',
          'Improved cash flow sooner',
        ],
        disadvantages: [
          'Vulnerable to financial emergencies',
          'May need to use credit for unexpected expenses',
          'Higher financial stress and risk',
        ],
      },
      {
        scenarioName: 'Balanced Approach',
        emergencyFundAmount: monthlyExpenses * 3, // 3 months
        debtPayoffAmount: params.extraPayment * 0.7, // 70% to debt
        description: 'Build moderate emergency fund while paying down debt',
        totalInterestPaid: 0,
        payoffTimeMonths: 0,
        riskScore: 40, // Medium risk
        advantages: [
          'Balanced risk and reward',
          'Some emergency protection',
          'Reasonable debt payoff timeline',
        ],
        disadvantages: [
          'Compromise on both goals',
          'Moderate interest costs',
          'Longer timeline than debt-first approach',
        ],
      },
    ];

    // Calculate outcomes for each scenario
    scenarios.forEach(scenario => {
      const scenarioParams = {
        ...params,
        extraPayment: scenario.debtPayoffAmount,
      };
      const result = this.calculateSingleDebtStrategy(scenarioParams);
      scenario.totalInterestPaid = result.totalInterest;
      scenario.payoffTimeMonths = result.totalTime;
    });

    const recommendedScenario = 'Balanced Approach';
    const reasoning =
      'Provides reasonable emergency protection while making meaningful progress on debt elimination';

    return {
      currentEmergencyFund: params.emergencyFund,
      recommendedEmergencyFund,
      scenarios,
      recommendedScenario,
      reasoning,
    };
  }

  /**
   * Calculate FIRE integration analysis
   * Epic 7, Story 6: FIRE Timeline Integration
   */
  private calculateFireIntegration(params: DebtPayoffParams): any {
    if (!params.fireGoal) {
      return undefined;
    }

    const { targetAmount, currentAge, targetAge, expectedReturn } =
      params.fireGoal;

    // Calculate debt-free age
    const debtPayoffResult = this.calculateSingleDebtStrategy(params);
    const debtFreeAge = Math.max(
      currentAge + 0.1,
      currentAge + debtPayoffResult.totalTime / 12
    );

    // Calculate FIRE timeline with debt
    const monthsToFire = (targetAge - currentAge) * 12;
    const availableForInvestment =
      params.monthlyIncome -
      params.monthlyExpenses -
      params.debts.reduce((sum, d) => sum + d.minimumPayment, 0) -
      params.extraPayment;

    const fireTimelineWithDebt = {
      ageAtFire: targetAge,
      totalSavingsNeeded: targetAmount,
      monthlySavingsRequired: availableForInvestment,
    };

    // Calculate FIRE timeline debt-free
    const monthsAfterDebtFree = Math.max(
      0,
      monthsToFire - debtPayoffResult.totalTime
    );
    const availableAfterDebtFree =
      params.monthlyIncome - params.monthlyExpenses;

    const fireTimelineDebtFree = {
      ageAtFire: Math.max(debtFreeAge, targetAge),
      totalSavingsNeeded: targetAmount,
      monthlySavingsRequired: availableAfterDebtFree,
    };

    // Investment vs debt analysis
    const totalDebtBalance = params.debts.reduce(
      (sum, debt) => sum + debt.balance,
      0
    );
    const averageDebtInterestRate =
      totalDebtBalance > 0
        ? params.debts.reduce(
            (sum, debt) => sum + debt.balance * debt.interestRate,
            0
          ) / totalDebtBalance
        : 0.06; // Default 6% if no debt

    const debtPayoffROI = averageDebtInterestRate; // Guaranteed return
    const expectedInvestmentROI = expectedReturn;

    let recommendation: 'pay_debt_first' | 'invest_first' | 'balanced_approach';
    let reasoning: string;

    if (debtPayoffROI > expectedInvestmentROI + 0.02) {
      // 2% buffer for guaranteed return
      recommendation = 'pay_debt_first';
      reasoning = `Debt interest rates (${(debtPayoffROI * 100).toFixed(1)}%) exceed expected investment returns (${(expectedInvestmentROI * 100).toFixed(1)}%) by significant margin`;
    } else if (expectedInvestmentROI > debtPayoffROI + 0.03) {
      // 3% buffer for market risk
      recommendation = 'invest_first';
      reasoning = `Expected investment returns (${(expectedInvestmentROI * 100).toFixed(1)}%) significantly exceed debt interest rates (${(debtPayoffROI * 100).toFixed(1)}%)`;
    } else {
      recommendation = 'balanced_approach';
      reasoning = `Debt rates and investment returns are similar - balanced approach recommended`;
    }

    const balancedApproach =
      recommendation === 'balanced_approach'
        ? {
            debtPaymentPercentage: 60,
            investmentPercentage: 40,
            projectedOutcome:
              'Moderate debt payoff timeline with investment growth',
          }
        : undefined;

    return {
      debtFreeAge,
      fireTimelineWithDebt,
      fireTimelineDebtFree,
      investmentVsDebtAnalysis: {
        debtPayoffROI,
        expectedInvestmentROI,
        recommendation,
        reasoning,
        balancedApproach,
      },
    };
  }

  /**
   * Generate debt payoff recommendations
   * Epic 7, Story 6: Recommendation Engine
   */
  private generateDebtPayoffRecommendations(
    params: DebtPayoffParams,
    strategies: any[]
  ): any[] {
    const recommendations = [];

    // Strategy recommendation
    const bestStrategy = strategies.reduce((best, current) =>
      current.interestSavings > best.interestSavings ? current : best
    );

    recommendations.push({
      category: 'strategy',
      recommendation: `Use ${bestStrategy.strategyName} for optimal debt payoff`,
      impact: `Save $${bestStrategy.interestSavings.toLocaleString()} in interest and ${bestStrategy.timeSavings} months`,
      priority: 'high',
      implementationSteps: [
        'List all debts with balances and interest rates',
        `Sort debts according to ${bestStrategy.strategyName} method`,
        'Make minimum payments on all debts',
        'Apply extra payments to priority debt',
        'Repeat until all debts are paid off',
      ],
      timeframe: `${bestStrategy.totalMonths} months`,
    });

    // Emergency fund recommendation
    const emergencyFundRatio = params.emergencyFund / params.monthlyExpenses;
    if (emergencyFundRatio < 3) {
      recommendations.push({
        category: 'emergency_fund',
        recommendation:
          'Build emergency fund to 3-6 months of expenses before aggressive debt payoff',
        impact: 'Prevents need to use credit cards for unexpected expenses',
        priority: emergencyFundRatio < 1 ? 'high' : 'medium',
        implementationSteps: [
          'Calculate 3-6 months of essential expenses',
          'Open high-yield savings account for emergency fund',
          'Automate monthly transfers to emergency fund',
          'Reduce debt payments temporarily if needed',
        ],
        timeframe: '6-12 months',
      });
    }

    // Credit improvement recommendation
    const creditCardDebts = params.debts.filter(d => d.type === 'credit_card');
    if (creditCardDebts.length > 0) {
      const totalCreditUsed = creditCardDebts.reduce(
        (sum, d) => sum + d.balance,
        0
      );
      const totalCreditLimit = creditCardDebts.reduce(
        (sum, d) => sum + (d.creditLimit || 0),
        0
      );
      const utilization =
        totalCreditLimit > 0 ? totalCreditUsed / totalCreditLimit : 0;

      if (utilization > 0.3) {
        recommendations.push({
          category: 'credit_improvement',
          recommendation:
            'Prioritize credit card debt to improve credit utilization ratio',
          impact: 'Improve credit score by 20-50 points within 6 months',
          priority: 'high',
          implementationSteps: [
            'Focus extra payments on credit cards first',
            'Keep credit card balances below 30% of limits',
            'Consider balance transfer to lower interest rate',
            'Avoid closing paid-off credit cards',
          ],
          timeframe: '3-6 months',
        });
      }
    }

    // FIRE planning recommendation
    if (params.fireGoal) {
      recommendations.push({
        category: 'fire_planning',
        recommendation: 'Integrate debt payoff with FIRE timeline planning',
        impact: 'Optimize path to financial independence',
        priority: 'medium',
        implementationSteps: [
          'Calculate debt-free date',
          'Project investment capacity after debt payoff',
          'Consider balanced approach if investment returns exceed debt rates',
          'Automate investments once debt-free',
        ],
        timeframe: 'Ongoing',
      });
    }

    // Consolidation recommendation
    if (params.debts.length > 3) {
      recommendations.push({
        category: 'consolidation',
        recommendation:
          'Consider debt consolidation to simplify payments and potentially reduce interest',
        impact: 'Simplify debt management and potentially save on interest',
        priority: 'low',
        implementationSteps: [
          'Research personal loan options',
          'Compare balance transfer credit cards',
          'Calculate total cost including fees',
          'Ensure you qualify for better rates',
        ],
        timeframe: '1-2 months',
      });
    }

    return recommendations;
  }

  /**
   * Calculate comprehensive FIRE number based on expenses (Story 2)
   */
  public calculateFIRENumber(
    params: FIRENumberCalculationParams
  ): FIRENumberCalculationResult {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey('fire_number', params);

    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.recordPerformance(
        'calculateFIRENumber',
        performance.now() - startTime,
        true,
        1
      );
      return cached;
    }

    try {
      // Validate input parameters
      if (
        params.monthlyExpenses <= 0 &&
        (!params.annualExpenses || params.annualExpenses <= 0)
      ) {
        throw new Error(
          'Monthly or annual expenses must be provided and greater than 0'
        );
      }

      // Calculate annual expenses
      const annualExpenses =
        params.annualExpenses || params.monthlyExpenses * 12;
      const withdrawalRate = params.withdrawalRate || 0.04; // Default 4% rule
      const safetyMargin = params.safetyMargin || 0; // Default no safety margin
      const costOfLivingMultiplier = params.costOfLivingMultiplier || 1.0;

      // Basic FIRE number calculation
      const baseFireNumber = annualExpenses / withdrawalRate;
      const adjustedFireNumber =
        baseFireNumber * costOfLivingMultiplier * (1 + safetyMargin);

      // Calculate FIRE variants
      const leanFireNumber = (annualExpenses * 0.7) / withdrawalRate; // 70% of expenses
      const fatFireNumber = (annualExpenses * 2.0) / withdrawalRate; // 200% of expenses
      const coastFireNumber = baseFireNumber * 0.6; // Amount needed to coast to traditional retirement
      const baristaFireNumber = baseFireNumber * 0.5; // 50% with part-time income covering rest

      // Healthcare cost projections
      let healthcareCosts: FIRENumberCalculationResult['healthcareCosts'];
      if (params.healthcareExpenses) {
        const hc = params.healthcareExpenses;
        const annualHealthcareCost =
          hc.monthlyPremium * 12 + hc.annualDeductible;
        const inflationRate = hc.inflationRate || 0.06; // Default 6% healthcare inflation
        const coverageGapYears = 10; // Assume 10 years until Medicare eligibility

        const inflationAdjustedCost =
          annualHealthcareCost *
          Math.pow(1 + inflationRate, coverageGapYears / 2);
        const totalGapCost = inflationAdjustedCost * coverageGapYears;

        healthcareCosts = {
          annualCost: annualHealthcareCost,
          inflationAdjustedCost,
          coverageGapYears,
          totalGapCost,
        };
      }

      // Social Security impact
      let socialSecurityImpact: FIRENumberCalculationResult['socialSecurityImpact'];
      if (params.socialSecurity) {
        const ss = params.socialSecurity;
        const annualBenefit = ss.estimatedBenefit * 12;
        const yearsUntilBenefit = Math.max(0, ss.startAge - 62); // Assume early retirement at 62
        const discountRate = 0.03; // Conservative discount rate
        const presentValue =
          annualBenefit / Math.pow(1 + discountRate, yearsUntilBenefit);
        const fireNumberReduction = presentValue / withdrawalRate;

        socialSecurityImpact = {
          annualBenefit,
          presentValue,
          fireNumberReduction,
        };
      }

      // Stress test scenarios
      const stressTestResults = (
        params.stressTestScenarios || [
          {
            name: 'Market Downturn',
            marketReturnAdjustment: -0.02,
            inflationAdjustment: 0.01,
            expenseAdjustment: 0.1,
          },
          {
            name: 'High Inflation',
            marketReturnAdjustment: 0,
            inflationAdjustment: 0.03,
            expenseAdjustment: 0.15,
          },
          {
            name: 'Economic Recession',
            marketReturnAdjustment: -0.03,
            inflationAdjustment: 0.02,
            expenseAdjustment: 0.2,
          },
        ]
      ).map(scenario => {
        const adjustedWithdrawalRate = Math.max(
          0.025,
          withdrawalRate + scenario.marketReturnAdjustment
        );
        const adjustedExpenses =
          annualExpenses * (1 + scenario.expenseAdjustment);
        const scenarioFireNumber = adjustedExpenses / adjustedWithdrawalRate;
        const percentageIncrease =
          ((scenarioFireNumber - baseFireNumber) / baseFireNumber) * 100;

        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        if (percentageIncrease > 50) riskLevel = 'high';
        else if (percentageIncrease > 25) riskLevel = 'medium';

        return {
          scenario: scenario.name,
          adjustedFireNumber: scenarioFireNumber,
          percentageIncrease,
          riskLevel,
        };
      });

      // Generate recommendations
      const recommendations: FIRENumberCalculationResult['recommendations'] =
        [];

      if (withdrawalRate > 0.04) {
        recommendations.push({
          category: 'Withdrawal Rate',
          suggestion:
            'Consider reducing withdrawal rate to 4% or lower for increased safety',
          impact: adjustedFireNumber * 0.25,
          priority: 'high',
        });
      }

      if (!params.healthcareExpenses) {
        recommendations.push({
          category: 'Healthcare',
          suggestion:
            'Include healthcare cost projections for more accurate FIRE planning',
          impact: 50000, // Estimated impact
          priority: 'high',
        });
      }

      if (safetyMargin < 0.1) {
        recommendations.push({
          category: 'Safety Margin',
          suggestion:
            'Consider adding 10-20% safety margin for unexpected expenses',
          impact: baseFireNumber * 0.15,
          priority: 'medium',
        });
      }

      // Expense breakdown
      const expenseBreakdown = params.expenseCategories?.map(category => ({
        category: category.category,
        monthlyAmount: category.monthlyAmount,
        annualAmount: category.monthlyAmount * 12,
        inflationRate: category.inflationRate,
        fireContribution: (category.monthlyAmount * 12) / withdrawalRate,
        essential: category.essential,
      })) || [
        {
          category: 'Total Expenses',
          monthlyAmount: annualExpenses / 12,
          annualAmount: annualExpenses,
          inflationRate: 0.03,
          fireContribution: baseFireNumber,
          essential: true,
        },
      ];

      const result: FIRENumberCalculationResult = {
        fireNumber: adjustedFireNumber,
        leanFireNumber,
        fatFireNumber,
        coastFireNumber,
        baristaFireNumber,
        annualExpenses,
        withdrawalRate,
        safetyMargin,
        costOfLivingAdjustment: costOfLivingMultiplier,
        adjustedFireNumber,
        healthcareCosts,
        socialSecurityImpact,
        stressTestResults,
        recommendations,
        expenseBreakdown,
      };

      this.setCache(cacheKey, result, ['fire_calculations']);

      const executionTime = performance.now() - startTime;
      this.recordPerformance('calculateFIRENumber', executionTime, false, 1);

      return result;
    } catch (error) {
      const executionTime = performance.now() - startTime;
      this.recordPerformance('calculateFIRENumber', executionTime, false, 1);
      throw new Error(
        `FIRE number calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Calculate expense-based FIRE with category analysis and geographic adjustments
   */
  public calculateExpenseBasedFIRE(params: {
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
  }): {
    totalFireNumber: number;
    categoryBreakdown: Array<{
      category: string;
      currentAnnual: number;
      projectedAnnual: number;
      fireContribution: number;
      essential: boolean;
      geographicAdjustment: number;
    }>;
    geographicAdjustments: {
      location: string;
      costOfLivingIndex: number;
      totalAdjustment: number;
      adjustedFireNumber: number;
    };
    inflationImpact: {
      currentTotal: number;
      projectedTotal: number;
      inflationIncrease: number;
      fireNumberIncrease: number;
    };
    optimizationSuggestions: Array<{
      category: string;
      suggestion: string;
      potentialSavings: number;
      difficulty: 'easy' | 'medium' | 'hard';
    }>;
  } {
    const startTime = performance.now();

    try {
      const withdrawalRate = params.withdrawalRate || 0.04;
      const projectionYears = params.projectionYears || 10;
      const costOfLivingIndex = params.costOfLivingIndex || 1.0;

      // Geographic cost-of-living adjustments by category
      const geographicMultipliers: Record<string, number> = {
        housing: costOfLivingIndex * 1.2, // Housing is most sensitive
        food: costOfLivingIndex * 0.8, // Food less sensitive
        transportation: costOfLivingIndex * 0.9,
        healthcare: costOfLivingIndex * 1.1,
        utilities: costOfLivingIndex * 0.95,
        entertainment: costOfLivingIndex * 0.85,
        default: costOfLivingIndex,
      };

      // Calculate category breakdown with projections
      const categoryBreakdown = params.expenseCategories.map(category => {
        const geographicMultiplier = category.geographicSensitive
          ? geographicMultipliers[category.category.toLowerCase()] ||
            geographicMultipliers.default
          : 1.0;

        const adjustedMonthlyAmount =
          category.monthlyAmount * geographicMultiplier;
        const currentAnnual = adjustedMonthlyAmount * 12;
        const projectedAnnual =
          currentAnnual * Math.pow(1 + category.inflationRate, projectionYears);
        const fireContribution = projectedAnnual / withdrawalRate;

        return {
          category: category.category,
          currentAnnual,
          projectedAnnual,
          fireContribution,
          essential: category.essential,
          geographicAdjustment: geographicMultiplier,
        };
      });

      // Calculate totals
      const currentTotal = categoryBreakdown.reduce(
        (sum, cat) => sum + cat.currentAnnual,
        0
      );
      const projectedTotal = categoryBreakdown.reduce(
        (sum, cat) => sum + cat.projectedAnnual,
        0
      );
      const totalFireNumber = categoryBreakdown.reduce(
        (sum, cat) => sum + cat.fireContribution,
        0
      );

      // Geographic adjustments summary
      const geographicAdjustments = {
        location: params.geographicLocation || 'Unknown',
        costOfLivingIndex,
        totalAdjustment: costOfLivingIndex,
        adjustedFireNumber: totalFireNumber,
      };

      // Inflation impact analysis
      const inflationImpact = {
        currentTotal,
        projectedTotal,
        inflationIncrease: projectedTotal - currentTotal,
        fireNumberIncrease: (projectedTotal - currentTotal) / withdrawalRate,
      };

      // Generate optimization suggestions
      const optimizationSuggestions = categoryBreakdown
        .filter(cat => !cat.essential || cat.fireContribution > 100000) // Focus on non-essential or high-impact categories
        .map(cat => {
          let suggestion = '';
          let potentialSavings = 0;
          let difficulty: 'easy' | 'medium' | 'hard' = 'medium';

          switch (cat.category.toLowerCase()) {
            case 'housing':
              suggestion =
                'Consider house hacking, downsizing, or relocating to lower cost area';
              potentialSavings = cat.fireContribution * 0.3;
              difficulty = 'hard';
              break;
            case 'transportation':
              suggestion =
                'Optimize transportation costs with public transit, biking, or car sharing';
              potentialSavings = cat.fireContribution * 0.4;
              difficulty = 'medium';
              break;
            case 'food':
              suggestion =
                'Meal planning, cooking at home, and bulk buying can reduce food costs';
              potentialSavings = cat.fireContribution * 0.25;
              difficulty = 'easy';
              break;
            case 'entertainment':
              suggestion = 'Find free or low-cost entertainment alternatives';
              potentialSavings = cat.fireContribution * 0.5;
              difficulty = 'easy';
              break;
            case 'utilities':
              suggestion =
                'Energy efficiency improvements and usage optimization';
              potentialSavings = cat.fireContribution * 0.2;
              difficulty = 'medium';
              break;
            default:
              suggestion = `Review ${cat.category} expenses for optimization opportunities`;
              potentialSavings = cat.fireContribution * 0.15;
              difficulty = 'medium';
          }

          return {
            category: cat.category,
            suggestion,
            potentialSavings,
            difficulty,
          };
        })
        .sort((a, b) => b.potentialSavings - a.potentialSavings); // Sort by potential savings

      const result = {
        totalFireNumber,
        categoryBreakdown,
        geographicAdjustments,
        inflationImpact,
        optimizationSuggestions,
      };

      const executionTime = performance.now() - startTime;
      this.recordPerformance(
        'calculateExpenseBasedFIRE',
        executionTime,
        false,
        params.expenseCategories.length
      );

      return result;
    } catch (error) {
      const executionTime = performance.now() - startTime;
      this.recordPerformance(
        'calculateExpenseBasedFIRE',
        executionTime,
        false,
        params.expenseCategories?.length || 0
      );
      throw new Error(
        `Expense-based FIRE calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Calculate healthcare cost projections for early retirement
   */
  public calculateHealthcareCostProjections(params: {
    currentAge: number;
    retirementAge: number;
    currentHealthcareCost: number;
    healthcareInflationRate?: number;
    employerCoverage?: {
      monthlyPremium: number;
      employerContribution: number;
      cobraMonths: number;
    };
    marketplacePlans?: Array<{
      planType: 'bronze' | 'silver' | 'gold' | 'platinum';
      monthlyPremium: number;
      deductible: number;
      outOfPocketMax: number;
      subsidyEligible: boolean;
    }>;
    medicareAge?: number;
    chronicConditions?: Array<{
      condition: string;
      annualCost: number;
      inflationRate: number;
    }>;
    emergencyFund?: number;
  }): {
    totalProjectedCost: number;
    yearlyBreakdown: Array<{
      age: number;
      year: number;
      coverageType: string;
      monthlyPremium: number;
      annualPremium: number;
      estimatedOutOfPocket: number;
      totalAnnualCost: number;
      cumulativeCost: number;
    }>;
    coverageGaps: Array<{
      startAge: number;
      endAge: number;
      gapType: string;
      estimatedCost: number;
      riskLevel: 'low' | 'medium' | 'high';
    }>;
    recommendations: Array<{
      category: string;
      recommendation: string;
      estimatedSavings: number;
      implementationDifficulty: 'easy' | 'medium' | 'hard';
    }>;
    fireImpact: {
      healthcareFireNumber: number;
      percentageOfTotalFire: number;
      monthlyReserveNeeded: number;
    };
  } {
    const startTime = performance.now();

    try {
      const healthcareInflationRate = params.healthcareInflationRate || 0.06; // Default 6% healthcare inflation
      const medicareAge = params.medicareAge || 65;
      const retirementYears = medicareAge - params.retirementAge;

      if (retirementYears <= 0) {
        throw new Error(
          'Retirement age must be before Medicare eligibility age'
        );
      }

      const yearlyBreakdown: Array<{
        age: number;
        year: number;
        coverageType: string;
        monthlyPremium: number;
        annualPremium: number;
        estimatedOutOfPocket: number;
        totalAnnualCost: number;
        cumulativeCost: number;
      }> = [];

      let cumulativeCost = 0;
      const coverageGaps: Array<{
        startAge: number;
        endAge: number;
        gapType: string;
        estimatedCost: number;
        riskLevel: 'low' | 'medium' | 'high';
      }> = [];

      // Calculate year-by-year costs
      for (let year = 0; year < retirementYears; year++) {
        const currentAge = params.retirementAge + year;
        let coverageType = '';
        let monthlyPremium = 0;
        let estimatedOutOfPocket = 0;

        // Determine coverage type and costs
        if (year === 0 && params.employerCoverage) {
          // COBRA coverage (typically 18 months)
          const cobraMonths = Math.min(
            params.employerCoverage.cobraMonths || 18,
            12
          );
          if (year === 0) {
            coverageType = 'COBRA';
            monthlyPremium = params.employerCoverage.monthlyPremium * 1.02; // 102% of group rate
            estimatedOutOfPocket = params.currentHealthcareCost * 0.8; // Assume good coverage
          }
        }

        if (
          coverageType === '' ||
          (year === 1 &&
            params.employerCoverage?.cobraMonths &&
            params.employerCoverage.cobraMonths < 24)
        ) {
          // Marketplace coverage
          const marketplacePlan = params.marketplacePlans?.[0] || {
            planType: 'silver' as const,
            monthlyPremium: 800,
            deductible: 5000,
            outOfPocketMax: 8000,
            subsidyEligible: false,
          };

          coverageType = `Marketplace ${marketplacePlan.planType}`;
          monthlyPremium = marketplacePlan.monthlyPremium;
          estimatedOutOfPocket = marketplacePlan.deductible * 0.6; // Assume 60% of deductible used
        }

        // Apply healthcare inflation
        const inflationMultiplier = Math.pow(1 + healthcareInflationRate, year);
        monthlyPremium *= inflationMultiplier;
        estimatedOutOfPocket *= inflationMultiplier;

        // Add chronic condition costs
        const chronicConditionCosts =
          params.chronicConditions?.reduce((total, condition) => {
            return (
              total +
              condition.annualCost * Math.pow(1 + condition.inflationRate, year)
            );
          }, 0) || 0;

        const annualPremium = monthlyPremium * 12;
        const totalAnnualCost =
          annualPremium + estimatedOutOfPocket + chronicConditionCosts;
        cumulativeCost += totalAnnualCost;

        yearlyBreakdown.push({
          age: currentAge,
          year: year + 1,
          coverageType,
          monthlyPremium,
          annualPremium,
          estimatedOutOfPocket: estimatedOutOfPocket + chronicConditionCosts,
          totalAnnualCost,
          cumulativeCost,
        });
      }

      // Identify coverage gaps
      if (!params.employerCoverage) {
        coverageGaps.push({
          startAge: params.retirementAge,
          endAge: medicareAge,
          gapType: 'No employer coverage transition',
          estimatedCost: cumulativeCost * 0.2, // 20% additional risk
          riskLevel: 'high',
        });
      }

      if (params.chronicConditions && params.chronicConditions.length > 0) {
        coverageGaps.push({
          startAge: params.retirementAge,
          endAge: medicareAge,
          gapType: 'Chronic condition coverage risk',
          estimatedCost:
            params.chronicConditions.reduce((sum, c) => sum + c.annualCost, 0) *
            retirementYears *
            0.3,
          riskLevel: 'medium',
        });
      }

      // Generate recommendations
      const recommendations: Array<{
        category: string;
        recommendation: string;
        estimatedSavings: number;
        implementationDifficulty: 'easy' | 'medium' | 'hard';
      }> = [];

      recommendations.push({
        category: 'Health Savings Account',
        recommendation:
          'Maximize HSA contributions before retirement for tax-free healthcare expenses',
        estimatedSavings: cumulativeCost * 0.25, // 25% tax savings
        implementationDifficulty: 'easy',
      });

      recommendations.push({
        category: 'Preventive Care',
        recommendation:
          'Invest in preventive care and healthy lifestyle to reduce future costs',
        estimatedSavings: cumulativeCost * 0.15,
        implementationDifficulty: 'medium',
      });

      if (params.marketplacePlans && params.marketplacePlans.length > 1) {
        recommendations.push({
          category: 'Plan Optimization',
          recommendation:
            'Compare marketplace plans annually and consider bronze plans with HSA',
          estimatedSavings: cumulativeCost * 0.1,
          implementationDifficulty: 'easy',
        });
      }

      recommendations.push({
        category: 'Geographic Arbitrage',
        recommendation:
          'Consider relocating to areas with lower healthcare costs',
        estimatedSavings: cumulativeCost * 0.2,
        implementationDifficulty: 'hard',
      });

      // Calculate FIRE impact
      const withdrawalRate = 0.04;
      const healthcareFireNumber = cumulativeCost / withdrawalRate;
      const monthlyReserveNeeded = cumulativeCost / retirementYears / 12;

      const fireImpact = {
        healthcareFireNumber,
        percentageOfTotalFire: 0.15, // Placeholder - would need total FIRE number to calculate
        monthlyReserveNeeded,
      };

      const result = {
        totalProjectedCost: cumulativeCost,
        yearlyBreakdown,
        coverageGaps,
        recommendations,
        fireImpact,
      };

      const executionTime = performance.now() - startTime;
      this.recordPerformance(
        'calculateHealthcareCostProjections',
        executionTime,
        false,
        retirementYears
      );

      return result;
    } catch (error) {
      const executionTime = performance.now() - startTime;
      this.recordPerformance(
        'calculateHealthcareCostProjections',
        executionTime,
        false,
        0
      );
      throw new Error(
        `Healthcare cost projection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Calculate Social Security benefits and FIRE stress testing
   */
  public calculateSocialSecurityAndStressTesting(params: {
    currentAge: number;
    currentIncome: number;
    projectedIncomeGrowth?: number;
    retirementAge: number;
    lifeExpectancy?: number;
    socialSecurityStartAge?: number;
    baseFireNumber: number;
    stressTestScenarios?: Array<{
      name: string;
      marketReturnAdjustment: number;
      inflationAdjustment: number;
      socialSecurityAdjustment: number;
      healthcareInflationAdjustment: number;
    }>;
  }): {
    socialSecurityProjection: {
      estimatedBenefit: number;
      fullRetirementAge: number;
      earlyRetirementReduction: number;
      delayedRetirementCredit: number;
      breakEvenAge: number;
      lifetimeValue: number;
      fireNumberReduction: number;
    };
    stressTestResults: Array<{
      scenario: string;
      adjustedFireNumber: number;
      socialSecurityImpact: number;
      totalAdjustment: number;
      percentageIncrease: number;
      riskLevel: 'low' | 'medium' | 'high' | 'extreme';
      recommendations: string[];
    }>;
    optimizedStrategy: {
      recommendedSocialSecurityAge: number;
      recommendedFireNumber: number;
      confidenceLevel: number;
      keyRisks: string[];
      mitigationStrategies: string[];
    };
  } {
    const startTime = performance.now();

    try {
      // Social Security calculations
      const fullRetirementAge = params.currentAge < 1960 ? 67 : 67; // Simplified
      const socialSecurityStartAge =
        params.socialSecurityStartAge || fullRetirementAge;
      const lifeExpectancy = params.lifeExpectancy || 85;

      // Estimate Social Security benefit (simplified calculation)
      const averageIndexedMonthlyEarnings = params.currentIncome / 12;
      const primaryInsuranceAmount = Math.min(
        averageIndexedMonthlyEarnings * 0.9, // 90% of first $1,174
        1174 * 0.9 + (averageIndexedMonthlyEarnings - 1174) * 0.32 // 32% of next amount
      );

      // Adjust for early/delayed retirement
      let adjustmentFactor = 1.0;
      if (socialSecurityStartAge < fullRetirementAge) {
        const monthsEarly = (fullRetirementAge - socialSecurityStartAge) * 12;
        adjustmentFactor = 1 - monthsEarly * 0.0055; // Roughly 6.6% per year early
      } else if (socialSecurityStartAge > fullRetirementAge) {
        const monthsDelayed = (socialSecurityStartAge - fullRetirementAge) * 12;
        adjustmentFactor = 1 + monthsDelayed * 0.0067; // 8% per year delayed
      }

      const estimatedBenefit = primaryInsuranceAmount * adjustmentFactor;
      const annualBenefit = estimatedBenefit * 12;
      const yearsReceiving = lifeExpectancy - socialSecurityStartAge;
      const lifetimeValue = annualBenefit * yearsReceiving;

      // Calculate break-even age for delayed benefits
      const fullBenefit = primaryInsuranceAmount * 12;
      const delayedBenefit = primaryInsuranceAmount * 1.32 * 12; // 32% increase for age 70
      const breakEvenAge =
        fullRetirementAge + (fullBenefit * 3) / (delayedBenefit - fullBenefit);

      // FIRE number reduction from Social Security
      const presentValueSS =
        lifetimeValue /
        Math.pow(1.03, socialSecurityStartAge - params.retirementAge);
      const fireNumberReduction = presentValueSS / 0.04; // 4% rule

      const socialSecurityProjection = {
        estimatedBenefit,
        fullRetirementAge,
        earlyRetirementReduction:
          socialSecurityStartAge < fullRetirementAge ? 1 - adjustmentFactor : 0,
        delayedRetirementCredit:
          socialSecurityStartAge > fullRetirementAge ? adjustmentFactor - 1 : 0,
        breakEvenAge,
        lifetimeValue,
        fireNumberReduction,
      };

      // Stress test scenarios
      const defaultScenarios = [
        {
          name: 'Market Crash',
          marketReturnAdjustment: -0.03,
          inflationAdjustment: 0.02,
          socialSecurityAdjustment: -0.1,
          healthcareInflationAdjustment: 0.02,
        },
        {
          name: 'High Inflation',
          marketReturnAdjustment: -0.01,
          inflationAdjustment: 0.04,
          socialSecurityAdjustment: 0.02, // COLA adjustments
          healthcareInflationAdjustment: 0.03,
        },
        {
          name: 'Social Security Cuts',
          marketReturnAdjustment: 0,
          inflationAdjustment: 0.01,
          socialSecurityAdjustment: -0.25, // 25% benefit reduction
          healthcareInflationAdjustment: 0.01,
        },
        {
          name: 'Healthcare Crisis',
          marketReturnAdjustment: -0.01,
          inflationAdjustment: 0.02,
          socialSecurityAdjustment: 0,
          healthcareInflationAdjustment: 0.05,
        },
        {
          name: 'Perfect Storm',
          marketReturnAdjustment: -0.04,
          inflationAdjustment: 0.05,
          socialSecurityAdjustment: -0.2,
          healthcareInflationAdjustment: 0.04,
        },
      ];

      const scenarios = params.stressTestScenarios || defaultScenarios;

      const stressTestResults = scenarios.map(scenario => {
        // Adjust withdrawal rate for market returns
        const adjustedWithdrawalRate = Math.max(
          0.025,
          0.04 + scenario.marketReturnAdjustment
        );

        // Adjust Social Security benefits
        const adjustedSSBenefit =
          annualBenefit * (1 + scenario.socialSecurityAdjustment);
        const adjustedSSReduction =
          (adjustedSSBenefit * yearsReceiving) / adjustedWithdrawalRate;

        // Calculate adjusted FIRE number
        const baseAdjustment =
          params.baseFireNumber *
          (scenario.inflationAdjustment +
            scenario.healthcareInflationAdjustment);
        const withdrawalRateAdjustment =
          params.baseFireNumber * (scenario.marketReturnAdjustment / 0.04);
        const socialSecurityImpact = fireNumberReduction - adjustedSSReduction;

        const totalAdjustment =
          baseAdjustment + withdrawalRateAdjustment + socialSecurityImpact;
        const adjustedFireNumber = params.baseFireNumber + totalAdjustment;
        const percentageIncrease =
          (totalAdjustment / params.baseFireNumber) * 100;

        // Determine risk level
        let riskLevel: 'low' | 'medium' | 'high' | 'extreme' = 'low';
        if (percentageIncrease > 75) riskLevel = 'extreme';
        else if (percentageIncrease > 50) riskLevel = 'high';
        else if (percentageIncrease > 25) riskLevel = 'medium';

        // Generate recommendations
        const recommendations: string[] = [];
        if (scenario.marketReturnAdjustment < -0.02) {
          recommendations.push('Increase bond allocation for stability');
          recommendations.push('Consider dividend-focused investments');
        }
        if (scenario.socialSecurityAdjustment < -0.1) {
          recommendations.push('Delay Social Security to maximize benefits');
          recommendations.push('Increase personal savings to compensate');
        }
        if (scenario.healthcareInflationAdjustment > 0.03) {
          recommendations.push('Maximize HSA contributions');
          recommendations.push('Consider healthcare-focused investments');
        }

        return {
          scenario: scenario.name,
          adjustedFireNumber,
          socialSecurityImpact,
          totalAdjustment,
          percentageIncrease,
          riskLevel,
          recommendations,
        };
      });

      // Optimized strategy
      const averageIncrease =
        stressTestResults.reduce((sum, r) => sum + r.percentageIncrease, 0) /
        stressTestResults.length;
      const highRiskScenarios = stressTestResults.filter(
        r => r.riskLevel === 'high' || r.riskLevel === 'extreme'
      ).length;

      const optimizedStrategy = {
        recommendedSocialSecurityAge:
          breakEvenAge < lifeExpectancy - 5 ? 70 : fullRetirementAge,
        recommendedFireNumber:
          params.baseFireNumber * (1 + Math.max(0.15, averageIncrease / 100)),
        confidenceLevel: Math.max(
          0.6,
          1 - highRiskScenarios / stressTestResults.length
        ),
        keyRisks: [
          'Market volatility during early retirement',
          'Healthcare cost inflation',
          'Social Security benefit reductions',
          'Longevity risk beyond life expectancy',
        ],
        mitigationStrategies: [
          'Maintain 3-5 years of expenses in bonds/cash',
          'Maximize HSA contributions for healthcare costs',
          'Consider part-time work flexibility (Barista FIRE)',
          'Delay Social Security to age 70 if healthy',
          'Geographic arbitrage for lower living costs',
        ],
      };

      const result = {
        socialSecurityProjection,
        stressTestResults,
        optimizedStrategy,
      };

      const executionTime = performance.now() - startTime;
      this.recordPerformance(
        'calculateSocialSecurityAndStressTesting',
        executionTime,
        false,
        scenarios.length
      );

      return result;
    } catch (error) {
      const executionTime = performance.now() - startTime;
      this.recordPerformance(
        'calculateSocialSecurityAndStressTesting',
        executionTime,
        false,
        0
      );
      throw new Error(
        `Social Security and stress testing calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
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

  // Helper methods for savings rate calculations (Story 3)

  /**
   * Validate savings rate calculation parameters
   */
  private validateSavingsRateParams(
    params: SavingsRateCalculationParams
  ): void {
    if (params.currentAge < 18 || params.currentAge > 100) {
      throw new Error('Current age must be between 18 and 100');
    }
    if (params.currentIncome <= 0) {
      throw new Error('Current income must be positive');
    }
    if (params.currentSavings < 0) {
      throw new Error('Current savings cannot be negative');
    }
    if (params.monthlyExpenses <= 0) {
      throw new Error('Monthly expenses must be positive');
    }
    if (params.goals.length === 0) {
      throw new Error('At least one financial goal is required');
    }

    // Validate each goal
    params.goals.forEach((goal, index) => {
      if (goal.targetAmount <= 0) {
        throw new Error(`Goal ${index + 1}: Target amount must be positive`);
      }
      if (goal.targetDate <= new Date()) {
        throw new Error(`Goal ${index + 1}: Target date must be in the future`);
      }
      if (goal.currentProgress < 0) {
        throw new Error(
          `Goal ${index + 1}: Current progress cannot be negative`
        );
      }
    });
  }

  /**
   * Validate goal-based planning parameters
   */
  private validateGoalPlanningParams(params: GoalBasedPlanningParams): void {
    if (params.currentIncome <= 0) {
      throw new Error('Current income must be positive');
    }
    if (params.currentExpenses < 0) {
      throw new Error('Current expenses cannot be negative');
    }
    if (params.availableForSavings < 0) {
      throw new Error('Available savings amount cannot be negative');
    }
    if (params.expectedReturn < -0.5 || params.expectedReturn > 1) {
      throw new Error('Expected return must be between -50% and 100%');
    }
    if (params.inflationRate < 0 || params.inflationRate > 0.2) {
      throw new Error('Inflation rate must be between 0% and 20%');
    }
  }

  /**
   * Validate budget adjustment parameters
   */
  private validateBudgetAdjustmentParams(params: BudgetAdjustmentParams): void {
    if (params.currentBudget.income <= 0) {
      throw new Error('Income must be positive');
    }
    if (params.savingsGoal < 0) {
      throw new Error('Savings goal cannot be negative');
    }
    if (params.targetSavingsRate < 0 || params.targetSavingsRate > 1) {
      throw new Error('Target savings rate must be between 0% and 100%');
    }

    params.currentBudget.expenses.forEach((expense, index) => {
      if (expense.amount < 0) {
        throw new Error(`Expense ${index + 1}: Amount cannot be negative`);
      }
      if (expense.flexibility < 0 || expense.flexibility > 1) {
        throw new Error(
          `Expense ${index + 1}: Flexibility must be between 0 and 1`
        );
      }
    });
  }

  /**
   * Calculate required savings for each goal
   */
  private calculateGoalRequirements(
    params: SavingsRateCalculationParams
  ): Array<{
    goalId: string;
    goalName: string;
    requiredMonthlySavings: number;
    monthsToGoal: number;
    priority: 'high' | 'medium' | 'low';
    achievabilityScore: number;
  }> {
    return params.goals.map(goal => {
      const monthsToGoal = this.calculateMonthsToDate(goal.targetDate);
      const remainingAmount = goal.targetAmount - goal.currentProgress;

      // Apply income growth if specified
      let adjustedIncome = params.currentIncome;
      if (params.incomeGrowth) {
        const yearsToGoal = monthsToGoal / 12;
        adjustedIncome =
          params.currentIncome *
          Math.pow(1 + params.incomeGrowth.annualGrowthRate, yearsToGoal);
      }

      // Calculate required monthly savings using future value formula
      const monthlyRate = 0.07 / 12; // Assume 7% annual return
      const requiredMonthlySavings = this.calculateRequiredMonthlySavings(
        remainingAmount,
        monthsToGoal,
        monthlyRate
      );

      // Calculate achievability score based on income and constraints
      const maxPossibleSavings =
        adjustedIncome * (params.budgetConstraints?.maxSavingsRate || 0.5);
      const achievabilityScore = Math.min(
        100,
        (maxPossibleSavings / requiredMonthlySavings) * 100
      );

      return {
        goalId: goal.id,
        goalName: goal.name,
        requiredMonthlySavings,
        monthsToGoal,
        priority: goal.priority,
        achievabilityScore,
      };
    });
  }

  /**
   * Calculate required monthly savings for a target amount
   */
  private calculateRequiredMonthlySavings(
    targetAmount: number,
    months: number,
    monthlyReturn: number
  ): number {
    if (monthlyReturn === 0) {
      return targetAmount / months;
    }

    // Future value of annuity formula: FV = PMT * [((1 + r)^n - 1) / r]
    // Solving for PMT: PMT = FV / [((1 + r)^n - 1) / r]
    const futureValueFactor =
      (Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn;
    return targetAmount / futureValueFactor;
  }

  /**
   * Calculate months between now and target date
   */
  private calculateMonthsToDate(targetDate: Date): number {
    const now = new Date();
    const diffTime = targetDate.getTime() - now.getTime();
    const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.44); // Average days per month
    return Math.max(1, Math.round(diffMonths));
  }

  /**
   * Optimize savings allocation across multiple goals
   */
  private optimizeSavingsAllocation(
    params: SavingsRateCalculationParams,
    goalCalculations: Array<{
      goalId: string;
      goalName: string;
      requiredMonthlySavings: number;
      monthsToGoal: number;
      priority: 'high' | 'medium' | 'low';
      achievabilityScore: number;
    }>
  ): {
    totalSavingsRate: number;
    totalMonthlySavings: number;
    goalBreakdown: Array<{
      goalId: string;
      goalName: string;
      requiredMonthlySavings: number;
      timelineAdjustment?: {
        originalDate: Date;
        adjustedDate: Date;
        reasonForAdjustment: string;
      };
      achievabilityScore: number;
      priority: 'high' | 'medium' | 'low';
    }>;
  } {
    const maxSavingsRate = params.budgetConstraints?.maxSavingsRate || 0.5;
    const maxMonthlySavings = params.currentIncome * maxSavingsRate;

    // Sort goals by priority and achievability
    const priorityWeights = { high: 3, medium: 2, low: 1 };
    const sortedGoals = [...goalCalculations].sort((a, b) => {
      const aPriority = priorityWeights[a.priority];
      const bPriority = priorityWeights[b.priority];
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }
      return b.achievabilityScore - a.achievabilityScore; // Higher achievability first
    });

    let totalRequiredSavings = sortedGoals.reduce(
      (sum, goal) => sum + goal.requiredMonthlySavings,
      0
    );

    // If total required savings exceeds maximum, adjust timelines for flexible goals
    const goalBreakdown = sortedGoals.map(goal => {
      const originalGoal = params.goals.find(g => g.id === goal.goalId)!;
      let adjustedGoal: {
        goalId: string;
        goalName: string;
        requiredMonthlySavings: number;
        monthsToGoal: number;
        priority: 'high' | 'medium' | 'low';
        achievabilityScore: number;
        timelineAdjustment?: {
          originalDate: Date;
          adjustedDate: Date;
          reasonForAdjustment: string;
        };
      } = { ...goal };

      if (totalRequiredSavings > maxMonthlySavings && originalGoal.isFlexible) {
        // Extend timeline to reduce required monthly savings
        const extensionFactor = Math.min(
          2,
          totalRequiredSavings / maxMonthlySavings
        );
        const newMonths = Math.round(goal.monthsToGoal * extensionFactor);
        const newRequiredSavings = this.calculateRequiredMonthlySavings(
          originalGoal.targetAmount - originalGoal.currentProgress,
          newMonths,
          0.07 / 12
        );

        adjustedGoal.requiredMonthlySavings = newRequiredSavings;
        adjustedGoal.timelineAdjustment = {
          originalDate: originalGoal.targetDate,
          adjustedDate: new Date(
            Date.now() + newMonths * 30 * 24 * 60 * 60 * 1000
          ),
          reasonForAdjustment:
            'Extended timeline to make savings goal achievable within budget constraints',
        };
      }

      return adjustedGoal;
    });

    // Recalculate total after adjustments
    totalRequiredSavings = goalBreakdown.reduce(
      (sum, goal) => sum + goal.requiredMonthlySavings,
      0
    );
    const totalSavingsRate = Math.min(
      totalRequiredSavings / params.currentIncome,
      maxSavingsRate
    );

    return {
      totalSavingsRate,
      totalMonthlySavings: totalRequiredSavings,
      goalBreakdown,
    };
  }

  /**
   * Generate budget adjustment recommendations
   */
  private generateBudgetAdjustments(
    params: SavingsRateCalculationParams,
    optimizedAllocation: any
  ): Array<{
    category: string;
    currentAmount: number;
    recommendedAmount: number;
    potentialSavings: number;
    difficulty: 'easy' | 'medium' | 'hard';
    impact: 'low' | 'medium' | 'high';
  }> {
    const savingsGap =
      optimizedAllocation.totalMonthlySavings -
      (params.currentIncome - params.monthlyExpenses);

    if (savingsGap <= 0) {
      return []; // No adjustments needed
    }

    // Generate generic budget adjustment recommendations
    const recommendations = [
      {
        category: 'Dining Out',
        currentAmount: params.monthlyExpenses * 0.15, // Assume 15% of expenses
        recommendedAmount: params.monthlyExpenses * 0.1, // Reduce to 10%
        potentialSavings: params.monthlyExpenses * 0.05,
        difficulty: 'easy' as const,
        impact: 'medium' as const,
      },
      {
        category: 'Entertainment',
        currentAmount: params.monthlyExpenses * 0.08, // Assume 8% of expenses
        recommendedAmount: params.monthlyExpenses * 0.05, // Reduce to 5%
        potentialSavings: params.monthlyExpenses * 0.03,
        difficulty: 'easy' as const,
        impact: 'low' as const,
      },
      {
        category: 'Subscriptions',
        currentAmount: params.monthlyExpenses * 0.05, // Assume 5% of expenses
        recommendedAmount: params.monthlyExpenses * 0.02, // Reduce to 2%
        potentialSavings: params.monthlyExpenses * 0.03,
        difficulty: 'easy' as const,
        impact: 'low' as const,
      },
      {
        category: 'Transportation',
        currentAmount: params.monthlyExpenses * 0.15, // Assume 15% of expenses
        recommendedAmount: params.monthlyExpenses * 0.12, // Reduce to 12%
        potentialSavings: params.monthlyExpenses * 0.03,
        difficulty: 'medium' as const,
        impact: 'medium' as const,
      },
    ];

    // Filter and sort by potential savings
    return recommendations
      .filter(rec => rec.potentialSavings > 0)
      .sort((a, b) => b.potentialSavings - a.potentialSavings)
      .slice(0, 5); // Return top 5 recommendations
  }

  /**
   * Generate income optimization suggestions
   */
  private generateIncomeOptimization(
    params: SavingsRateCalculationParams
  ): Array<{
    strategy: string;
    potentialIncomeIncrease: number;
    timeframe: string;
    effort: 'low' | 'medium' | 'high';
    probability: number;
  }> {
    const currentIncome = params.currentIncome;

    return [
      {
        strategy: 'Negotiate salary increase',
        potentialIncomeIncrease: currentIncome * 0.05, // 5% increase
        timeframe: '3-6 months',
        effort: 'medium' as const,
        probability: 0.6,
      },
      {
        strategy: 'Develop new skills for promotion',
        potentialIncomeIncrease: currentIncome * 0.15, // 15% increase
        timeframe: '6-12 months',
        effort: 'high' as const,
        probability: 0.4,
      },
      {
        strategy: 'Start freelance/side business',
        potentialIncomeIncrease: currentIncome * 0.2, // 20% additional income
        timeframe: '3-9 months',
        effort: 'high' as const,
        probability: 0.3,
      },
      {
        strategy: 'Switch to higher-paying job',
        potentialIncomeIncrease: currentIncome * 0.25, // 25% increase
        timeframe: '2-6 months',
        effort: 'medium' as const,
        probability: 0.5,
      },
      {
        strategy: 'Optimize tax withholdings',
        potentialIncomeIncrease: currentIncome * 0.02, // 2% effective increase
        timeframe: '1 month',
        effort: 'low' as const,
        probability: 0.9,
      },
    ];
  }

  /**
   * Analyze timelines for all goals
   */
  private analyzeTimelines(
    params: SavingsRateCalculationParams,
    optimizedAllocation: any
  ): {
    earliestGoalCompletion: Date;
    latestGoalCompletion: Date;
    totalSavingsPeriod: number;
    peakSavingsRate: number;
    averageSavingsRate: number;
  } {
    const goalDates = params.goals.map(goal => goal.targetDate);
    const earliestGoalCompletion = new Date(
      Math.min(...goalDates.map(d => d.getTime()))
    );
    const latestGoalCompletion = new Date(
      Math.max(...goalDates.map(d => d.getTime()))
    );

    const totalSavingsPeriod =
      (latestGoalCompletion.getTime() - Date.now()) /
      (1000 * 60 * 60 * 24 * 365.25);
    const peakSavingsRate = optimizedAllocation.totalSavingsRate;
    const averageSavingsRate = optimizedAllocation.totalSavingsRate * 0.8; // Assume some variation

    return {
      earliestGoalCompletion,
      latestGoalCompletion,
      totalSavingsPeriod,
      peakSavingsRate,
      averageSavingsRate,
    };
  }

  /**
   * Generate scenario analysis
   */
  private generateScenarioAnalysis(
    params: SavingsRateCalculationParams,
    optimizedAllocation: any
  ): Array<{
    scenario: string;
    requiredSavingsRate: number;
    goalAchievementRate: number;
    tradeoffs: string[];
  }> {
    const baseRate = optimizedAllocation.totalSavingsRate;

    return [
      {
        scenario: 'Conservative (All goals achieved)',
        requiredSavingsRate: baseRate,
        goalAchievementRate: 1.0,
        tradeoffs: [
          'Higher savings rate required',
          'Less discretionary spending',
        ],
      },
      {
        scenario: 'Moderate (High priority goals only)',
        requiredSavingsRate: baseRate * 0.7,
        goalAchievementRate: 0.7,
        tradeoffs: [
          'Some lower priority goals delayed',
          'More balanced lifestyle',
        ],
      },
      {
        scenario: 'Aggressive (Income growth assumed)',
        requiredSavingsRate: baseRate * 0.8,
        goalAchievementRate: 1.0,
        tradeoffs: [
          'Dependent on income increases',
          'Career development required',
        ],
      },
      {
        scenario: 'Flexible (Timeline adjustments)',
        requiredSavingsRate: baseRate * 0.6,
        goalAchievementRate: 1.0,
        tradeoffs: [
          'Extended timelines for some goals',
          'Lower immediate pressure',
        ],
      },
    ];
  }

  /**
   * Create progress milestones
   */
  private createProgressMilestones(
    params: SavingsRateCalculationParams,
    optimizedAllocation: any
  ): Array<{
    date: Date;
    description: string;
    targetSavings: number;
    goalProgress: Record<string, number>;
  }> {
    const milestones = [];
    const monthlyTarget = optimizedAllocation.totalMonthlySavings;

    // Create quarterly milestones for the first 2 years
    for (let quarter = 1; quarter <= 8; quarter++) {
      const date = new Date();
      date.setMonth(date.getMonth() + quarter * 3);

      const targetSavings = monthlyTarget * quarter * 3;
      const goalProgress: Record<string, number> = {};

      // Calculate progress for each goal
      optimizedAllocation.goalBreakdown.forEach((goal: any) => {
        const goalMonthlySavings = goal.requiredMonthlySavings;
        const goalTargetAmount =
          params.goals.find(g => g.id === goal.goalId)?.targetAmount || 0;
        const currentProgress =
          params.goals.find(g => g.id === goal.goalId)?.currentProgress || 0;

        const progressAmount = goalMonthlySavings * quarter * 3;
        const totalProgress = currentProgress + progressAmount;
        goalProgress[goal.goalId] = Math.min(
          100,
          (totalProgress / goalTargetAmount) * 100
        );
      });

      milestones.push({
        date,
        description: `Quarter ${quarter} savings milestone`,
        targetSavings,
        goalProgress,
      });
    }

    return milestones;
  }

  /**
   * Generate savings allocation timeline
   */
  private generateSavingsAllocation(
    params: GoalBasedPlanningParams,
    goalRequirements: Array<{
      goalId: string;
      requiredMonthlySavings: number;
      adjustedTargetAmount: number;
      monthsToGoal: number;
      priority: number;
    }>
  ): Array<{
    month: number;
    totalSavings: number;
    goalAllocations: Record<string, number>;
    cumulativeProgress: Record<string, number>;
  }> {
    const allocation = [];
    const maxMonths = Math.max(...goalRequirements.map(g => g.monthsToGoal));
    const cumulativeProgress: Record<string, number> = {};

    // Initialize cumulative progress
    goalRequirements.forEach(goal => {
      cumulativeProgress[goal.goalId] = 0;
    });

    for (let month = 1; month <= Math.min(maxMonths, 60); month++) {
      // Limit to 5 years
      const goalAllocations: Record<string, number> = {};
      let totalSavings = 0;

      goalRequirements.forEach(goal => {
        if (month <= goal.monthsToGoal) {
          const allocation = Math.min(
            goal.requiredMonthlySavings,
            params.availableForSavings * (goal.priority / 10)
          );
          goalAllocations[goal.goalId] = allocation;
          cumulativeProgress[goal.goalId] += allocation;
          totalSavings += allocation;
        }
      });

      allocation.push({
        month,
        totalSavings,
        goalAllocations,
        cumulativeProgress: { ...cumulativeProgress },
      });
    }

    return allocation;
  }

  /**
   * Generate planning recommendations
   */
  private generatePlanningRecommendations(
    params: GoalBasedPlanningParams,
    goalRequirements: Array<{
      goalId: string;
      requiredMonthlySavings: number;
      adjustedTargetAmount: number;
      monthsToGoal: number;
      priority: number;
    }>,
    planFeasibility: 'achievable' | 'challenging' | 'unrealistic'
  ): Array<{
    type:
      | 'goal_adjustment'
      | 'timeline_change'
      | 'savings_increase'
      | 'income_boost';
    description: string;
    impact: number;
    effort: 'low' | 'medium' | 'high';
  }> {
    const recommendations = [];

    if (planFeasibility === 'unrealistic') {
      recommendations.push({
        type: 'goal_adjustment' as const,
        description:
          'Consider reducing target amounts for lower priority goals',
        impact: 30,
        effort: 'low' as const,
      });

      recommendations.push({
        type: 'timeline_change' as const,
        description:
          'Extend timelines for flexible goals to reduce monthly savings pressure',
        impact: 25,
        effort: 'low' as const,
      });

      recommendations.push({
        type: 'income_boost' as const,
        description:
          'Focus on increasing income through career development or side income',
        impact: 40,
        effort: 'high' as const,
      });
    } else if (planFeasibility === 'challenging') {
      recommendations.push({
        type: 'savings_increase' as const,
        description:
          'Look for additional areas to cut expenses and increase savings rate',
        impact: 20,
        effort: 'medium' as const,
      });

      recommendations.push({
        type: 'income_boost' as const,
        description:
          'Consider salary negotiation or skill development for promotion',
        impact: 25,
        effort: 'medium' as const,
      });
    } else {
      recommendations.push({
        type: 'goal_adjustment' as const,
        description:
          'Consider adding additional goals or increasing target amounts',
        impact: 15,
        effort: 'low' as const,
      });
    }

    return recommendations;
  }

  /**
   * Calculate comprehensive Coast FIRE analysis with multiple coast points
   * Epic 7, Story 4: Coast FIRE Calculations
   */
  public calculateCoastFIREAnalysis(
    params: CoastFIRECalculationParams
  ): CoastFIRECalculationResult {
    const startTime = performance.now();

    try {
      // Input validation
      if (params.currentAge < 18 || params.currentAge > 100) {
        throw new Error('Current age must be between 18 and 100');
      }
      if (params.currentSavings < 0) {
        throw new Error('Current savings cannot be negative');
      }
      if (params.targetFireNumber <= 0) {
        throw new Error('Target FIRE number must be positive');
      }
      if (params.expectedReturn <= 0 || params.expectedReturn > 0.5) {
        throw new Error('Expected return must be between 0% and 50%');
      }

      // Default parameters
      const coastAges = params.coastAges || [30, 35, 40, 45, 50];
      const traditionalRetirementAge = params.traditionalRetirementAge || 65;
      const inflationRate = params.inflationRate || 0.03;
      const currentMonthlyContributions =
        params.currentMonthlyContributions || 0;

      // Calculate coast points
      const coastPoints = coastAges
        .filter(age => age > params.currentAge)
        .map(coastAge => {
          const yearsToCoast = coastAge - params.currentAge;
          const yearsFromCoastToRetirement =
            traditionalRetirementAge - coastAge;

          // Amount needed at coast age to reach FIRE number by retirement
          const requiredAmountAtCoast =
            params.targetFireNumber /
            Math.pow(1 + params.expectedReturn, yearsFromCoastToRetirement);

          // Current trajectory with contributions
          const futureValueWithContributions =
            params.currentSavings *
              Math.pow(1 + params.expectedReturn, yearsToCoast) +
            currentMonthlyContributions *
              12 *
              ((Math.pow(1 + params.expectedReturn, yearsToCoast) - 1) /
                params.expectedReturn);

          const currentShortfall = Math.max(
            0,
            requiredAmountAtCoast - futureValueWithContributions
          );

          // Monthly contributions needed to reach coast point
          const monthlyContributionsNeeded =
            currentShortfall > 0
              ? (currentShortfall * params.expectedReturn) /
                (12 * (Math.pow(1 + params.expectedReturn, yearsToCoast) - 1))
              : 0;

          // Years to reach coast point with current contributions
          const yearsToReachCoastPoint =
            currentShortfall > 0 && currentMonthlyContributions > 0
              ? Math.log(
                  1 +
                    (currentShortfall * params.expectedReturn) /
                      (currentMonthlyContributions * 12)
                ) / Math.log(1 + params.expectedReturn)
              : yearsToCoast;

          // Feasibility assessment
          const feasible =
            currentShortfall === 0 ||
            monthlyContributionsNeeded < currentMonthlyContributions * 2;
          const confidenceLevel: 'high' | 'medium' | 'low' =
            currentShortfall === 0
              ? 'high'
              : monthlyContributionsNeeded < currentMonthlyContributions * 1.5
                ? 'medium'
                : 'low';

          return {
            age: coastAge,
            requiredAmount: requiredAmountAtCoast,
            currentShortfall,
            monthlyContributionsNeeded,
            yearsToReachCoastPoint,
            feasible,
            confidenceLevel,
          };
        });

      // Find optimal coast point (first feasible one or lowest shortfall)
      const optimalCoastPoint =
        coastPoints.length > 0
          ? coastPoints.find(cp => cp.feasible) ||
            coastPoints.reduce((min, cp) =>
              cp.currentShortfall < min.currentShortfall ? cp : min
            )
          : undefined;

      // Timeline visualization data
      const timeline = {
        contributionPhase: {
          startAge: params.currentAge,
          endAge: optimalCoastPoint?.age || coastAges[0],
          totalContributions:
            (optimalCoastPoint?.yearsToReachCoastPoint || 0) *
            currentMonthlyContributions *
            12,
          projectedValue: optimalCoastPoint?.requiredAmount || 0,
        },
        coastPhase: {
          startAge: optimalCoastPoint?.age || coastAges[0],
          endAge: traditionalRetirementAge,
          startingAmount: optimalCoastPoint?.requiredAmount || 0,
          finalAmount: params.targetFireNumber,
          compoundGrowth:
            params.targetFireNumber - (optimalCoastPoint?.requiredAmount || 0),
        },
      };

      // Generate recommendations
      const recommendations = this.generateCoastFIRERecommendations(
        params,
        coastPoints,
        optimalCoastPoint
      );

      // Geographic arbitrage analysis
      let geographicArbitrage;
      if (params.geographicArbitrage) {
        const ga = params.geographicArbitrage;
        const currentLocationCost = params.targetFireNumber;
        const targetLocationCost =
          params.targetFireNumber * (1 - ga.costOfLivingReduction);
        const fireNumberReduction = currentLocationCost - targetLocationCost;
        const coastPointImprovement = fireNumberReduction * 0.6; // Assuming 60% coast ratio
        const netBenefit = fireNumberReduction - ga.movingCosts;
        const paybackPeriod = ga.movingCosts / (fireNumberReduction * 0.04); // Assuming 4% withdrawal rate

        geographicArbitrage = {
          currentLocationCost,
          targetLocationCost,
          fireNumberReduction,
          coastPointImprovement,
          netBenefit,
          paybackPeriod,
        };
      }

      // Healthcare gap analysis
      let healthcareGapAnalysis;
      if (params.healthcareGapAnalysis) {
        const hga = params.healthcareGapAnalysis;
        const gapYears =
          hga.ageForMedicare - (optimalCoastPoint?.age || params.currentAge);
        const totalGapCost = gapYears * hga.estimatedMonthlyCost * 12;
        const monthlyBudgetImpact = hga.estimatedMonthlyCost;
        const additionalFireNeeded = totalGapCost / 0.04; // 4% rule

        healthcareGapAnalysis = {
          gapYears,
          totalGapCost,
          monthlyBudgetImpact,
          mitigationStrategies: [
            'COBRA continuation coverage (18-36 months)',
            'ACA marketplace plans with subsidies',
            'Healthcare sharing ministries',
            'Part-time work for benefits (Barista FIRE)',
            "Spouse's employer coverage",
            'Health Savings Account (HSA) for tax-free withdrawals',
          ],
          additionalFireNeeded,
        };
      }

      // Stress testing scenarios
      const stressTestResults = this.generateCoastFIREStressTests(
        params,
        coastPoints
      );

      const result: CoastFIRECalculationResult = {
        coastPoints,
        timeline,
        recommendations,
        geographicArbitrage,
        healthcareGapAnalysis,
        stressTestResults,
      };

      // Cache the result
      const cacheKey = `coast_fire_${JSON.stringify(params)}`;
      this.setCache(cacheKey, result, []);

      return result;
    } catch (error) {
      throw new Error(
        `Coast FIRE calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate Coast FIRE recommendations based on analysis
   */
  private generateCoastFIRERecommendations(
    params: CoastFIRECalculationParams,
    coastPoints: CoastFIRECalculationResult['coastPoints'],
    optimalCoastPoint: CoastFIRECalculationResult['coastPoints'][0] | undefined
  ): CoastFIRECalculationResult['recommendations'] {
    const recommendations: CoastFIRECalculationResult['recommendations'] = [];

    // Contribution recommendations
    if (optimalCoastPoint && optimalCoastPoint.currentShortfall > 0) {
      recommendations.push({
        category: 'contribution',
        suggestion: `Increase monthly contributions by $${Math.round(optimalCoastPoint.monthlyContributionsNeeded)} to reach Coast FIRE by age ${optimalCoastPoint.age}`,
        impact: `Reduces required savings by ${Math.round((1 - 0.6) * 100)}% compared to traditional FIRE`,
        priority: 'high',
      });
    }

    // Timeline recommendations
    const feasibleCoastPoints = coastPoints.filter(cp => cp.feasible);
    if (feasibleCoastPoints.length > 0) {
      const earliestFeasible = feasibleCoastPoints[0];
      recommendations.push({
        category: 'timeline',
        suggestion: `Target Coast FIRE by age ${earliestFeasible.age} for maximum flexibility`,
        impact: `${65 - earliestFeasible.age} years of financial freedom without required contributions`,
        priority: 'medium',
      });
    }

    // Strategy recommendations
    recommendations.push({
      category: 'strategy',
      suggestion:
        'Consider geographic arbitrage to reduce required Coast FIRE amount',
      impact: 'Can reduce FIRE number by 20-40% depending on location',
      priority: 'medium',
    });

    recommendations.push({
      category: 'strategy',
      suggestion:
        'Plan for healthcare coverage gap between employer insurance and Medicare',
      impact: 'Healthcare costs can add $500-2000/month to expenses',
      priority: 'high',
    });

    // Risk recommendations
    recommendations.push({
      category: 'risk',
      suggestion: 'Maintain emergency fund even during coast phase',
      impact: 'Protects against sequence of returns risk',
      priority: 'high',
    });

    recommendations.push({
      category: 'risk',
      suggestion:
        'Consider part-time work flexibility (Barista FIRE) as backup plan',
      impact: 'Provides income buffer and potential benefits coverage',
      priority: 'medium',
    });

    return recommendations;
  }

  /**
   * Generate stress test scenarios for Coast FIRE
   */
  private generateCoastFIREStressTests(
    params: CoastFIRECalculationParams,
    coastPoints: CoastFIRECalculationResult['coastPoints']
  ): CoastFIRECalculationResult['stressTestResults'] {
    const scenarios = [
      {
        name: 'Market Crash (-30%)',
        returnAdjustment: -0.03,
        riskLevel: 'high' as const,
      },
      {
        name: 'Low Returns (2% real)',
        returnAdjustment: -0.02,
        riskLevel: 'medium' as const,
      },
      {
        name: 'High Inflation (+2%)',
        returnAdjustment: -0.02,
        riskLevel: 'medium' as const,
      },
      {
        name: 'Extended Bear Market',
        returnAdjustment: -0.025,
        riskLevel: 'high' as const,
      },
    ];

    return scenarios.map(scenario => {
      const adjustedReturn = params.expectedReturn + scenario.returnAdjustment;
      const traditionalRetirementAge = params.traditionalRetirementAge || 65;

      const adjustedCoastPoints = coastPoints.map(cp => {
        const yearsFromCoastToRetirement = traditionalRetirementAge - cp.age;
        const adjustedRequiredAmount =
          params.targetFireNumber /
          Math.pow(1 + adjustedReturn, yearsFromCoastToRetirement);
        const impactPercentage =
          ((adjustedRequiredAmount - cp.requiredAmount) / cp.requiredAmount) *
          100;

        return {
          age: cp.age,
          requiredAmount: adjustedRequiredAmount,
          impactPercentage,
        };
      });

      const mitigationSuggestions = [
        'Increase safety margin in Coast FIRE calculations',
        'Consider more conservative return assumptions',
        'Maintain flexibility to return to work if needed',
        'Diversify income sources during coast phase',
        'Build larger emergency fund before coasting',
      ];

      return {
        scenario: scenario.name,
        adjustedCoastPoints,
        riskLevel: scenario.riskLevel,
        mitigationSuggestions,
      };
    });
  }

  /**
   * Calculate comprehensive Barista FIRE analysis with part-time work scenarios
   * Epic 7, Story 4: Barista FIRE Calculations
   */
  public calculateBaristaFIREAnalysis(
    params: BaristaFIRECalculationParams
  ): BaristaFIRECalculationResult {
    const startTime = performance.now();

    try {
      // Input validation
      if (params.currentAge < 18 || params.currentAge > 100) {
        throw new Error('Current age must be between 18 and 100');
      }
      if (params.currentSavings < 0) {
        throw new Error('Current savings cannot be negative');
      }
      if (params.fullFireNumber <= 0) {
        throw new Error('Full FIRE number must be positive');
      }
      if (params.expectedReturn <= 0 || params.expectedReturn > 0.5) {
        throw new Error('Expected return must be between 0% and 50%');
      }

      // Default parameters
      const socialSecurityAge = params.socialSecurityAge || 67;
      const bridgeYears =
        params.bridgeYears || socialSecurityAge - params.currentAge;

      // Analyze each Barista FIRE scenario
      const scenarios = params.partTimeScenarios.map(scenario => {
        // Calculate required savings for Barista FIRE
        const annualExpensesDuringBarista =
          params.baristaPhaseExpenses.annualExpenses;
        const annualIncomeFromWork =
          scenario.annualIncome + scenario.benefitsValue;
        const annualIncomeNeededFromSavings = Math.max(
          0,
          annualExpensesDuringBarista - annualIncomeFromWork
        );

        // Required savings using 4% rule for the gap
        const requiredSavings = annualIncomeNeededFromSavings / 0.04;
        const savingsReduction = params.fullFireNumber - requiredSavings;

        // Calculate time to reach Barista FIRE
        const monthlyContributionsNeeded =
          requiredSavings > params.currentSavings
            ? ((requiredSavings - params.currentSavings) *
                params.expectedReturn) /
              (12 *
                (Math.pow(
                  1 + params.expectedReturn,
                  scenario.startAge - params.currentAge
                ) -
                  1))
            : 0;

        const totalYearsToFire = scenario.startAge - params.currentAge;
        const baristaPhaseYears = scenario.workYears;

        // Feasibility score (0-100)
        const feasibilityScore = Math.min(
          100,
          Math.max(
            0,
            100 -
              (monthlyContributionsNeeded / 1000) * 10 -
              (scenario.workYears / 20) * 20
          )
        );

        // Financial projections
        const savingsAtBaristaStart = requiredSavings;
        const incomeFromSavings = savingsAtBaristaStart * 0.04; // 4% withdrawal
        const incomeFromWork = scenario.annualIncome;
        const totalAnnualIncome =
          incomeFromSavings + incomeFromWork + scenario.benefitsValue;
        const expenseCoverage =
          (totalAnnualIncome / annualExpensesDuringBarista) * 100;

        // Risk analysis
        const risks = [
          {
            type: 'income' as const,
            description: 'Part-time work may not be available or sustainable',
            impact: 'high' as const,
            mitigation: 'Develop multiple income streams and marketable skills',
          },
          {
            type: 'health' as const,
            description:
              'Healthcare costs may be higher without employer benefits',
            impact: 'medium' as const,
            mitigation:
              'Budget for ACA marketplace premiums and higher deductibles',
          },
          {
            type: 'market' as const,
            description: 'Market downturns could reduce withdrawal capacity',
            impact: 'medium' as const,
            mitigation:
              'Maintain larger emergency fund and flexible work arrangements',
          },
          {
            type: 'inflation' as const,
            description: 'Rising costs could outpace part-time income growth',
            impact: 'medium' as const,
            mitigation: 'Choose work with inflation-adjusted income potential',
          },
        ];

        return {
          name: scenario.name,
          requiredSavings,
          savingsReduction,
          partTimeIncome: scenario.annualIncome,
          benefitsValue: scenario.benefitsValue,
          totalYearsToFire,
          baristaPhaseYears,
          feasibilityScore,
          projections: {
            savingsAtBaristaStart,
            incomeFromSavings,
            incomeFromWork,
            totalAnnualIncome,
            expenseCoverage,
          },
          risks,
        };
      });

      // Find recommended scenario (highest feasibility score)
      const recommendedScenario = scenarios.reduce((best, current) =>
        current.feasibilityScore > best.feasibilityScore ? current : best
      );

      const recommendedScenarioResult = {
        scenarioName: recommendedScenario.name,
        reasonsForRecommendation: [
          `Highest feasibility score: ${recommendedScenario.feasibilityScore}/100`,
          `Reduces required savings by $${Math.round(recommendedScenario.savingsReduction).toLocaleString()}`,
          `Provides ${recommendedScenario.baristaPhaseYears} years of flexible work transition`,
        ],
        keyBenefits: [
          'Reduced savings requirement compared to full FIRE',
          'Maintained income and benefits during transition',
          'Flexibility to adjust work hours and lifestyle',
          'Social engagement and purpose through continued work',
        ],
        potentialDrawbacks: [
          'Dependence on continued ability to work',
          'Potential healthcare coverage gaps',
          'Market risk on smaller savings base',
          'Less complete financial independence',
        ],
      };

      // Comparison with full FIRE
      const fullFireComparison = {
        fullFireAmount: params.fullFireNumber,
        baristaFireAmount: recommendedScenario.requiredSavings,
        savingsReduction: recommendedScenario.savingsReduction,
        timeToFireReduction:
          Math.max(
            0,
            (params.fullFireNumber - params.currentSavings) /
              (recommendedScenario.requiredSavings - params.currentSavings) -
              1
          ) * recommendedScenario.totalYearsToFire,
        flexibilityScore: Math.min(
          100,
          recommendedScenario.feasibilityScore + 20
        ), // Bonus for flexibility
      };

      const result: BaristaFIRECalculationResult = {
        scenarios,
        recommendedScenario: recommendedScenarioResult,
        fullFireComparison,
      };

      // Cache the result
      const cacheKey = `barista_fire_${JSON.stringify(params)}`;
      this.setCache(cacheKey, result, []);

      return result;
    } catch (error) {
      throw new Error(
        `Barista FIRE calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate Coast FIRE timeline visualization data
   * Epic 7, Story 4: Timeline Visualization
   */
  public generateCoastFIRETimelineData(
    params: CoastFIRECalculationParams,
    coastPoint: { age: number; requiredAmount: number }
  ): {
    timelineData: Array<{
      age: number;
      year: number;
      phase: 'contribution' | 'coast';
      accountValue: number;
      contributions: number;
      growth: number;
      withdrawals: number;
      milestones: string[];
    }>;
    phaseBreakdown: {
      contributionPhase: {
        duration: number;
        totalContributions: number;
        totalGrowth: number;
        endValue: number;
      };
      coastPhase: {
        duration: number;
        totalGrowth: number;
        startValue: number;
        endValue: number;
      };
    };
  } {
    const currentYear = new Date().getFullYear();
    const traditionalRetirementAge = params.traditionalRetirementAge || 65;
    const currentMonthlyContributions = params.currentMonthlyContributions || 0;
    const annualContributions = currentMonthlyContributions * 12;

    const timelineData = [];
    let accountValue = params.currentSavings;
    let totalContributions = 0;
    let contributionPhaseGrowth = 0;
    let coastPhaseGrowth = 0;

    // Contribution phase
    for (let age = params.currentAge; age <= coastPoint.age; age++) {
      const year = currentYear + (age - params.currentAge);
      const growth = accountValue * params.expectedReturn;
      accountValue += growth + annualContributions;
      totalContributions += annualContributions;
      contributionPhaseGrowth += growth;

      const milestones = [];
      if (age === coastPoint.age) {
        milestones.push('Coast FIRE Achieved');
      }
      if (age === params.currentAge + 5) {
        milestones.push('5-Year Mark');
      }
      if (age === params.currentAge + 10) {
        milestones.push('10-Year Mark');
      }

      timelineData.push({
        age,
        year,
        phase: 'contribution' as const,
        accountValue,
        contributions: annualContributions,
        growth,
        withdrawals: 0,
        milestones,
      });
    }

    const coastStartValue = accountValue;

    // Coast phase
    for (let age = coastPoint.age + 1; age <= traditionalRetirementAge; age++) {
      const year = currentYear + (age - params.currentAge);
      const growth = accountValue * params.expectedReturn;
      accountValue += growth;
      coastPhaseGrowth += growth;

      const milestones = [];
      if (age === traditionalRetirementAge) {
        milestones.push('Traditional Retirement Age');
      }
      if (age === 65 && traditionalRetirementAge !== 65) {
        milestones.push('Medicare Eligibility');
      }

      timelineData.push({
        age,
        year,
        phase: 'coast' as const,
        accountValue,
        contributions: 0,
        growth,
        withdrawals: 0,
        milestones,
      });
    }

    const phaseBreakdown = {
      contributionPhase: {
        duration: coastPoint.age - params.currentAge,
        totalContributions,
        totalGrowth: contributionPhaseGrowth,
        endValue: coastStartValue,
      },
      coastPhase: {
        duration: traditionalRetirementAge - coastPoint.age,
        totalGrowth: coastPhaseGrowth,
        startValue: coastStartValue,
        endValue: accountValue,
      },
    };

    return { timelineData, phaseBreakdown };
  }

  /**
   * Comprehensive market volatility and downturn modeling
   * Epic 7, Story 5: Market Volatility & Downturn Modeling
   */
  public calculateMarketVolatilityScenarios(
    params: MarketScenarioParams
  ): MarketScenarioResult {
    const startTime = performance.now();

    try {
      // Input validation
      if (params.currentPortfolioValue < 0) {
        throw new Error('Portfolio value cannot be negative');
      }
      if (params.monthlyContributions < 0) {
        throw new Error('Monthly contributions cannot be negative');
      }
      if (params.timeHorizon <= 0 || params.timeHorizon > 50) {
        throw new Error('Time horizon must be between 1 and 50 years');
      }
      if (params.expectedReturn <= -1 || params.expectedReturn > 1) {
        throw new Error('Expected return must be between -100% and 100%');
      }

      // Default parameters
      const confidenceIntervals = params.confidenceIntervals || [
        10, 25, 50, 75, 90,
      ];
      const simulationIterations = params.simulationIterations || 10000;
      const volatilityModel = params.volatilityModel || 'hybrid';

      // Generate scenarios for each requested scenario type
      const scenarios = params.scenarioTypes.map(scenarioType => {
        const scenarioData = this.getHistoricalScenarioData(scenarioType);
        const scenarioResult = this.simulateMarketScenario(
          params,
          scenarioData,
          simulationIterations
        );

        return {
          scenarioType,
          description: scenarioData.description,
          probability: scenarioData.probability,
          portfolioImpact: scenarioResult.portfolioImpact,
          timeline: scenarioResult.timeline,
          confidenceIntervals: this.calculateConfidenceIntervals(
            scenarioResult.simulationResults,
            confidenceIntervals
          ),
        };
      });

      // Calculate overall volatility analysis
      const volatilityAnalysis = this.calculateVolatilityMetrics(
        params,
        scenarios,
        volatilityModel
      );

      // Recovery analysis if requested
      let recoveryAnalysis;
      if (params.includeRecoveryAnalysis) {
        recoveryAnalysis = this.calculateRecoveryAnalysis(params, scenarios);
      }

      // Safe withdrawal rate analysis if withdrawal phase specified
      let safeWithdrawalRateAnalysis;
      if (params.withdrawalPhase) {
        safeWithdrawalRateAnalysis = this.calculateSafeWithdrawalRates(
          params,
          scenarios,
          volatilityAnalysis
        );
      }

      // Generate recommendations
      const recommendations = this.generateMarketVolatilityRecommendations(
        params,
        scenarios,
        volatilityAnalysis
      );

      const result: MarketScenarioResult = {
        scenarios,
        volatilityAnalysis,
        recoveryAnalysis,
        safeWithdrawalRateAnalysis,
        recommendations,
      };

      // Cache the result
      const cacheKey = `market_volatility_${JSON.stringify(params)}`;
      this.setCache(cacheKey, result, []);

      return result;
    } catch (error) {
      throw new Error(
        `Market volatility calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get historical scenario data for market events
   */
  private getHistoricalScenarioData(scenarioType: MarketScenarioType): {
    description: string;
    probability: number;
    monthlyReturns: number[];
    duration: number;
    recoveryPattern: number[];
  } {
    const scenarioData = {
      great_recession_2008: {
        description:
          '2008 Financial Crisis - Severe market downturn with banking sector collapse',
        probability: 0.02, // ~2% chance per decade
        monthlyReturns: [
          -0.09, -0.17, -0.08, -0.11, -0.07, -0.05, 0.03, -0.09, -0.17, -0.07,
          0.08, 0.01,
        ],
        duration: 18, // 18 months of impact
        recoveryPattern: [
          0.05, 0.08, 0.12, 0.09, 0.06, 0.04, 0.03, 0.02, 0.02, 0.01,
        ],
      },
      covid_crash_2020: {
        description:
          '2020 COVID-19 Pandemic - Sharp but brief market crash with rapid recovery',
        probability: 0.05, // ~5% chance per decade (pandemic/external shock)
        monthlyReturns: [-0.12, -0.34, 0.13, 0.05, 0.05, 0.02],
        duration: 6, // 6 months of major impact
        recoveryPattern: [0.08, 0.12, 0.15, 0.1, 0.06, 0.04],
      },
      dot_com_crash_2000: {
        description:
          '2000 Dot-com Bubble Burst - Technology sector collapse with prolonged bear market',
        probability: 0.03, // ~3% chance per decade
        monthlyReturns: [
          -0.1, -0.06, -0.03, -0.09, -0.08, -0.07, -0.11, -0.06, -0.04, -0.08,
          -0.03, -0.06,
        ],
        duration: 30, // 30 months of bear market
        recoveryPattern: [0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.05, 0.04, 0.03],
      },
      black_monday_1987: {
        description:
          '1987 Black Monday - Single day 22% crash with quick recovery',
        probability: 0.08, // ~8% chance per decade (market correction)
        monthlyReturns: [-0.22, 0.02, -0.08, 0.04, 0.06],
        duration: 5, // 5 months of impact
        recoveryPattern: [0.08, 0.12, 0.06, 0.04],
      },
      stagflation_1970s: {
        description:
          '1970s Stagflation - High inflation with low growth and market stagnation',
        probability: 0.01, // ~1% chance per decade
        monthlyReturns: Array(60)
          .fill(0)
          .map(() => -0.02 + Math.random() * 0.04), // 5 years of low/negative returns
        duration: 60,
        recoveryPattern: Array(24)
          .fill(0)
          .map(() => 0.03 + Math.random() * 0.04),
      },
      lost_decade_japan: {
        description:
          'Japan Lost Decade - Prolonged economic stagnation with minimal returns',
        probability: 0.005, // ~0.5% chance per decade
        monthlyReturns: Array(120)
          .fill(0)
          .map(() => -0.01 + Math.random() * 0.02), // 10 years of near-zero returns
        duration: 120,
        recoveryPattern: Array(36)
          .fill(0)
          .map(() => 0.01 + Math.random() * 0.02),
      },
      sustained_low_returns: {
        description:
          'Sustained Low Returns - Extended period of below-average market performance',
        probability: 0.15, // ~15% chance per decade
        monthlyReturns: Array(60)
          .fill(0)
          .map(() => 0.01 + Math.random() * 0.03), // 5 years of low returns
        duration: 60,
        recoveryPattern: Array(24)
          .fill(0)
          .map(() => 0.04 + Math.random() * 0.03),
      },
      high_inflation_period: {
        description:
          'High Inflation Period - Sustained high inflation eroding real returns',
        probability: 0.1, // ~10% chance per decade
        monthlyReturns: Array(36)
          .fill(0)
          .map(() => 0.02 + Math.random() * 0.04), // 3 years of inflation impact
        duration: 36,
        recoveryPattern: Array(12)
          .fill(0)
          .map(() => 0.05 + Math.random() * 0.03),
      },
      rising_interest_rates: {
        description:
          'Rising Interest Rates - Federal Reserve tightening cycle impacting valuations',
        probability: 0.2, // ~20% chance per decade
        monthlyReturns: Array(18)
          .fill(0)
          .map(() => -0.01 + Math.random() * 0.03), // 18 months of rate impact
        duration: 18,
        recoveryPattern: Array(12)
          .fill(0)
          .map(() => 0.03 + Math.random() * 0.04),
      },
      market_correction_10: {
        description: '10% Market Correction - Standard market pullback',
        probability: 0.3, // ~30% chance per decade
        monthlyReturns: [-0.05, -0.03, -0.02, 0.01, 0.02],
        duration: 5,
        recoveryPattern: [0.04, 0.06, 0.03, 0.02],
      },
      bear_market_20: {
        description: '20% Bear Market - Significant market decline',
        probability: 0.15, // ~15% chance per decade
        monthlyReturns: [-0.08, -0.06, -0.04, -0.02, 0.01, 0.03],
        duration: 8,
        recoveryPattern: [0.06, 0.08, 0.05, 0.04, 0.03],
      },
      severe_recession_30: {
        description: '30% Severe Recession - Major economic downturn',
        probability: 0.05, // ~5% chance per decade
        monthlyReturns: [-0.12, -0.1, -0.08, -0.05, -0.03, 0.02, 0.04],
        duration: 12,
        recoveryPattern: [0.08, 0.1, 0.07, 0.05, 0.04, 0.03],
      },
    };

    return scenarioData[scenarioType];
  }

  /**
   * Simulate market scenario with Monte Carlo approach
   */
  private simulateMarketScenario(
    params: MarketScenarioParams,
    scenarioData: any,
    iterations: number
  ): {
    portfolioImpact: any;
    timeline: any[];
    simulationResults: number[];
  } {
    const simulationResults: number[] = [];
    const timeline: any[] = [];

    // Run Monte Carlo simulations
    for (let i = 0; i < iterations; i++) {
      let portfolioValue = params.currentPortfolioValue;
      const monthlyTimeline: any[] = [];
      let maxDrawdown = 0;
      let currentDrawdown = 0;
      const peakValue = portfolioValue;

      // Apply scenario returns
      for (let month = 0; month < scenarioData.duration; month++) {
        const monthlyReturn =
          scenarioData.monthlyReturns[
            month % scenarioData.monthlyReturns.length
          ];
        const volatilityAdjustment = (Math.random() - 0.5) * 0.1; // Add some randomness
        const adjustedReturn = monthlyReturn + volatilityAdjustment;

        portfolioValue =
          portfolioValue * (1 + adjustedReturn) + params.monthlyContributions;

        // Calculate drawdown
        currentDrawdown = Math.max(0, (peakValue - portfolioValue) / peakValue);
        maxDrawdown = Math.max(maxDrawdown, currentDrawdown);

        if (i === 0) {
          // Only store timeline for first iteration to avoid memory issues
          monthlyTimeline.push({
            month,
            portfolioValue,
            monthlyReturn: adjustedReturn,
            cumulativeReturn:
              (portfolioValue - params.currentPortfolioValue) /
              params.currentPortfolioValue,
            drawdown: currentDrawdown,
          });
        }
      }

      // Apply recovery pattern
      for (
        let month = 0;
        month < scenarioData.recoveryPattern.length;
        month++
      ) {
        const recoveryReturn = scenarioData.recoveryPattern[month];
        portfolioValue =
          portfolioValue * (1 + recoveryReturn) + params.monthlyContributions;

        if (i === 0) {
          monthlyTimeline.push({
            month: scenarioData.duration + month,
            portfolioValue,
            monthlyReturn: recoveryReturn,
            cumulativeReturn:
              (portfolioValue - params.currentPortfolioValue) /
              params.currentPortfolioValue,
            drawdown: Math.max(0, (peakValue - portfolioValue) / peakValue),
          });
        }
      }

      simulationResults.push(portfolioValue);
      if (i === 0) {
        timeline.push(...monthlyTimeline);
      }
    }

    // Calculate portfolio impact metrics
    const finalValues = simulationResults.sort((a, b) => a - b);
    const medianValue = finalValues[Math.floor(finalValues.length / 2)];
    const peakDecline = Math.max(...timeline.map(t => t.drawdown));
    const recoveryTimeMonths = timeline.findIndex(
      t => t.portfolioValue >= params.currentPortfolioValue
    );

    const portfolioImpact = {
      peakDecline,
      recoveryTimeMonths:
        recoveryTimeMonths === -1
          ? scenarioData.duration + scenarioData.recoveryPattern.length
          : recoveryTimeMonths,
      finalValue: medianValue,
      totalReturn:
        (medianValue - params.currentPortfolioValue) /
        params.currentPortfolioValue,
    };

    return { portfolioImpact, timeline, simulationResults };
  }

  /**
   * Calculate confidence intervals from simulation results
   */
  private calculateConfidenceIntervals(
    simulationResults: number[],
    intervals: number[]
  ): Array<{
    percentile: number;
    portfolioValue: number;
    probability: number;
  }> {
    const sortedResults = [...simulationResults].sort((a, b) => a - b);

    return intervals.map(percentile => {
      const index = Math.floor((percentile / 100) * sortedResults.length);
      return {
        percentile,
        portfolioValue: sortedResults[index],
        probability: percentile / 100,
      };
    });
  }

  /**
   * Calculate volatility metrics
   */
  private calculateVolatilityMetrics(
    params: MarketScenarioParams,
    scenarios: any[],
    volatilityModel: string
  ): any {
    // Calculate aggregate volatility metrics across all scenarios
    const allReturns = scenarios.flatMap(s =>
      s.timeline.map((t: any) => t.monthlyReturn)
    );
    const meanReturn =
      allReturns.reduce((sum, r) => sum + r, 0) / allReturns.length;
    const variance =
      allReturns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) /
      allReturns.length;
    const annualVolatility = Math.sqrt(variance * 12);

    // Calculate Sharpe ratio (assuming 2% risk-free rate)
    const riskFreeRate = 0.02 / 12; // Monthly risk-free rate
    const excessReturn = meanReturn - riskFreeRate;
    const sharpeRatio = excessReturn / Math.sqrt(variance);

    // Calculate max drawdown across all scenarios
    const maxDrawdown = Math.max(
      ...scenarios.map(s => s.portfolioImpact.peakDecline)
    );

    // Calculate volatility of volatility
    const monthlyVolatilities = [];
    for (let i = 0; i < allReturns.length - 12; i += 12) {
      const yearReturns = allReturns.slice(i, i + 12);
      const yearMean = yearReturns.reduce((sum, r) => sum + r, 0) / 12;
      const yearVariance =
        yearReturns.reduce((sum, r) => sum + Math.pow(r - yearMean, 2), 0) / 12;
      monthlyVolatilities.push(Math.sqrt(yearVariance * 12));
    }
    const volOfVol =
      monthlyVolatilities.length > 1
        ? Math.sqrt(
            monthlyVolatilities.reduce((sum, v, i, arr) => {
              const mean = arr.reduce((s, val) => s + val, 0) / arr.length;
              return sum + Math.pow(v - mean, 2);
            }, 0) /
              (monthlyVolatilities.length - 1)
          )
        : 0;

    // Calculate Value at Risk (VaR) and Conditional VaR
    const sortedReturns = [...allReturns].sort((a, b) => a - b);
    const var95Index = Math.floor(0.05 * sortedReturns.length);
    const var99Index = Math.floor(0.01 * sortedReturns.length);

    const valueAtRisk = {
      confidence95: Math.abs(sortedReturns[var95Index]),
      confidence99: Math.abs(sortedReturns[var99Index]),
    };

    const conditionalValueAtRisk = {
      confidence95: Math.abs(
        sortedReturns.slice(0, var95Index).reduce((sum, r) => sum + r, 0) /
          var95Index
      ),
      confidence99: Math.abs(
        sortedReturns.slice(0, var99Index).reduce((sum, r) => sum + r, 0) /
          var99Index
      ),
    };

    return {
      annualVolatility,
      sharpeRatio,
      maxDrawdown,
      volatilityOfVolatility: volOfVol,
      valueAtRisk,
      conditionalValueAtRisk,
    };
  }

  /**
   * Calculate recovery analysis
   */
  private calculateRecoveryAnalysis(
    params: MarketScenarioParams,
    scenarios: any[]
  ): any {
    const recoveryTimes = scenarios.map(
      s => s.portfolioImpact.recoveryTimeMonths
    );
    const averageRecoveryTime =
      recoveryTimes.reduce((sum, time) => sum + time, 0) / recoveryTimes.length;

    // Dollar-cost averaging benefit calculation
    const dollarCostAveragingBenefit = 0.15; // Assume 15% benefit during volatile periods

    // Rebalancing benefit calculation
    const rebalancingBenefit = params.rebalancingStrategy ? 0.08 : 0; // 8% benefit if rebalancing

    // Recovery scenarios
    const recoveryScenarios = [
      {
        scenarioName: 'V-Shaped Recovery',
        recoveryTimeMonths: averageRecoveryTime * 0.7,
        finalValue: params.currentPortfolioValue * 1.2,
        benefitVsBuyAndHold: 0.05,
      },
      {
        scenarioName: 'U-Shaped Recovery',
        recoveryTimeMonths: averageRecoveryTime,
        finalValue: params.currentPortfolioValue * 1.1,
        benefitVsBuyAndHold: 0.02,
      },
      {
        scenarioName: 'L-Shaped Recovery',
        recoveryTimeMonths: averageRecoveryTime * 1.5,
        finalValue: params.currentPortfolioValue * 0.95,
        benefitVsBuyAndHold: -0.03,
      },
    ];

    return {
      averageRecoveryTime,
      dollarCostAveragingBenefit,
      rebalancingBenefit,
      recoveryScenarios,
    };
  }

  /**
   * Calculate safe withdrawal rates under market stress
   */
  private calculateSafeWithdrawalRates(
    params: MarketScenarioParams,
    scenarios: any[],
    volatilityAnalysis: any
  ): any {
    const baseWithdrawalRate = 0.04; // 4% rule

    // Adjust for volatility and sequence of returns risk
    const volatilityAdjustment = Math.min(
      0.01,
      volatilityAnalysis.annualVolatility * 0.5
    );
    const sequenceRiskAdjustment = Math.min(
      0.005,
      volatilityAnalysis.maxDrawdown * 0.1
    );

    const stressTestedSafeRate = Math.max(
      0.025,
      baseWithdrawalRate - volatilityAdjustment - sequenceRiskAdjustment
    );

    // Dynamic withdrawal strategies
    const dynamicStrategies = [
      {
        strategyName: 'Fixed 4% Rule',
        successRate: 0.85,
        averageWithdrawal: baseWithdrawalRate,
        worstCaseWithdrawal: baseWithdrawalRate,
      },
      {
        strategyName: 'Dynamic Withdrawal (Floor/Ceiling)',
        successRate: 0.95,
        averageWithdrawal: baseWithdrawalRate * 0.95,
        worstCaseWithdrawal: baseWithdrawalRate * 0.75,
      },
      {
        strategyName: 'Bond Tent Strategy',
        successRate: 0.92,
        averageWithdrawal: baseWithdrawalRate * 0.98,
        worstCaseWithdrawal: baseWithdrawalRate * 0.85,
      },
    ];

    return {
      currentSafeRate: baseWithdrawalRate,
      stressTestedSafeRate,
      sequenceOfReturnsRisk: volatilityAnalysis.maxDrawdown,
      dynamicStrategies,
    };
  }

  /**
   * Generate market volatility recommendations
   */
  private generateMarketVolatilityRecommendations(
    params: MarketScenarioParams,
    scenarios: any[],
    volatilityAnalysis: any
  ): Array<{
    category: 'allocation' | 'timing' | 'strategy' | 'risk_management';
    recommendation: string;
    impact: string;
    priority: 'high' | 'medium' | 'low';
    implementationComplexity: 'low' | 'medium' | 'high';
  }> {
    const recommendations = [];

    // High volatility recommendations
    if (volatilityAnalysis.annualVolatility > 0.2) {
      recommendations.push({
        category: 'allocation' as const,
        recommendation:
          'Consider reducing equity allocation by 10-15% to lower portfolio volatility',
        impact:
          'Reduces portfolio volatility by 15-25% with minimal impact on long-term returns',
        priority: 'high' as const,
        implementationComplexity: 'low' as const,
      });
    }

    // High drawdown recommendations
    if (volatilityAnalysis.maxDrawdown > 0.3) {
      recommendations.push({
        category: 'risk_management' as const,
        recommendation:
          'Implement systematic rebalancing to reduce sequence of returns risk',
        impact:
          'Can improve returns by 0.5-1.5% annually during volatile periods',
        priority: 'high' as const,
        implementationComplexity: 'medium' as const,
      });
    }

    // Dollar-cost averaging recommendation
    recommendations.push({
      category: 'strategy' as const,
      recommendation:
        'Maintain consistent dollar-cost averaging during market downturns',
      impact: 'Historically improves returns by 10-20% during volatile periods',
      priority: 'medium' as const,
      implementationComplexity: 'low' as const,
    });

    // Emergency fund recommendation
    const emergencyFundMonths = Math.max(
      6,
      Math.ceil(volatilityAnalysis.maxDrawdown * 24)
    );
    recommendations.push({
      category: 'risk_management' as const,
      recommendation: `Maintain ${emergencyFundMonths} months of expenses in emergency fund`,
      impact: 'Prevents forced selling during market downturns',
      priority: 'high' as const,
      implementationComplexity: 'low' as const,
    });

    // Diversification recommendation
    recommendations.push({
      category: 'allocation' as const,
      recommendation:
        'Consider adding international and alternative investments for diversification',
      impact:
        'Can reduce portfolio volatility by 5-15% while maintaining returns',
      priority: 'medium' as const,
      implementationComplexity: 'medium' as const,
    });

    // Timing recommendation
    if (scenarios.some(s => s.scenarioType.includes('recession'))) {
      recommendations.push({
        category: 'timing' as const,
        recommendation:
          'Avoid market timing; maintain disciplined investment approach',
        impact: 'Prevents behavioral mistakes that can cost 2-4% annually',
        priority: 'high' as const,
        implementationComplexity: 'low' as const,
      });
    }

    return recommendations;
  }

  /**
   * Comprehensive market stress testing
   * Epic 7, Story 5: Market Stress Testing
   */
  public calculateMarketStressTest(
    params: MarketStressTestParams
  ): MarketStressTestResult {
    const startTime = performance.now();

    try {
      // Input validation
      if (params.portfolioValue < 0) {
        throw new Error('Portfolio value cannot be negative');
      }
      if (params.timeHorizon <= 0 || params.timeHorizon > 50) {
        throw new Error('Time horizon must be between 1 and 50 years');
      }

      // Run stress tests for each scenario
      const stressTestResults = params.stressScenarios.map(scenario => {
        const stressResult = this.runStressTestScenario(params, scenario);

        return {
          scenarioName: scenario.name,
          maxDrawdown: stressResult.maxDrawdown,
          timeToRecovery: stressResult.timeToRecovery,
          finalPortfolioValue: stressResult.finalPortfolioValue,
          probabilityOfOccurrence: scenario.probability,
          mitigationStrategies: this.generateMitigationStrategies(stressResult),
        };
      });

      // Calculate overall portfolio resilience
      const portfolioResilience = this.calculatePortfolioResilience(
        params,
        stressTestResults
      );

      const result: MarketStressTestResult = {
        stressTestResults,
        portfolioResilience,
      };

      // Cache the result
      const cacheKey = `market_stress_test_${JSON.stringify(params)}`;
      this.setCache(cacheKey, result, []);

      return result;
    } catch (error) {
      throw new Error(
        `Market stress test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Run individual stress test scenario
   */
  private runStressTestScenario(
    params: MarketStressTestParams,
    scenario: any
  ): {
    maxDrawdown: number;
    timeToRecovery: number;
    finalPortfolioValue: number;
  } {
    let portfolioValue = params.portfolioValue;
    let maxDrawdown = 0;
    let peakValue = portfolioValue;
    let timeToRecovery = 0;
    let recoveryAchieved = false;

    // Apply stress scenario returns
    for (let month = 0; month < scenario.duration; month++) {
      const monthlyReturn =
        scenario.monthlyReturns[month % scenario.monthlyReturns.length];
      portfolioValue =
        portfolioValue * (1 + monthlyReturn) + params.monthlyContributions;

      // Track peak and drawdown
      if (portfolioValue > peakValue) {
        peakValue = portfolioValue;
      }

      const currentDrawdown = (peakValue - portfolioValue) / peakValue;
      maxDrawdown = Math.max(maxDrawdown, currentDrawdown);
    }

    // Apply recovery phase
    const recoveryMonths = Math.min(
      120,
      params.timeHorizon * 12 - scenario.duration
    ); // Max 10 years recovery
    for (let month = 0; month < recoveryMonths; month++) {
      const recoveryReturn =
        params.recoveryAssumptions.averageRecoveryReturn / 12;
      const volatilityAdjustment =
        ((Math.random() - 0.5) *
          params.recoveryAssumptions.recoveryVolatility) /
        12;
      const adjustedReturn = recoveryReturn + volatilityAdjustment;

      portfolioValue =
        portfolioValue * (1 + adjustedReturn) + params.monthlyContributions;

      // Check if recovery achieved
      if (!recoveryAchieved && portfolioValue >= peakValue) {
        timeToRecovery = scenario.duration + month;
        recoveryAchieved = true;
      }
    }

    // If recovery not achieved, set to maximum time
    if (!recoveryAchieved) {
      timeToRecovery = scenario.duration + recoveryMonths;
    }

    return {
      maxDrawdown,
      timeToRecovery,
      finalPortfolioValue: portfolioValue,
    };
  }

  /**
   * Generate mitigation strategies for stress test results
   */
  private generateMitigationStrategies(stressResult: any): Array<{
    strategy: string;
    effectivenessScore: number;
    implementationCost: number;
    description: string;
  }> {
    const strategies = [];

    // Emergency fund strategy
    strategies.push({
      strategy: 'Enhanced Emergency Fund',
      effectivenessScore: 85,
      implementationCost: 0.02, // 2% opportunity cost
      description:
        'Maintain 12-18 months of expenses to avoid forced selling during downturns',
    });

    // Diversification strategy
    strategies.push({
      strategy: 'Portfolio Diversification',
      effectivenessScore: 70,
      implementationCost: 0.005, // 0.5% in fees
      description:
        'Add international stocks, bonds, and alternative investments',
    });

    // Rebalancing strategy
    strategies.push({
      strategy: 'Systematic Rebalancing',
      effectivenessScore: 60,
      implementationCost: 0.001, // 0.1% in transaction costs
      description:
        'Rebalance quarterly or when allocations drift >5% from targets',
    });

    // Dollar-cost averaging
    strategies.push({
      strategy: 'Dollar-Cost Averaging',
      effectivenessScore: 55,
      implementationCost: 0,
      description: 'Continue regular investments during market downturns',
    });

    // Defensive allocation
    if (stressResult.maxDrawdown > 0.3) {
      strategies.push({
        strategy: 'Defensive Asset Allocation',
        effectivenessScore: 75,
        implementationCost: 0.01, // 1% lower expected returns
        description:
          'Reduce equity allocation by 10-20% and increase bond allocation',
      });
    }

    return strategies;
  }

  /**
   * Calculate overall portfolio resilience score
   */
  private calculatePortfolioResilience(
    params: MarketStressTestParams,
    stressTestResults: any[]
  ): {
    overallScore: number;
    worstCaseScenario: string;
    recommendedActions: string[];
    emergencyFundRecommendation: number;
  } {
    // Calculate weighted resilience score
    const weightedScores = stressTestResults.map(result => {
      const drawdownScore = Math.max(0, 100 - result.maxDrawdown * 100);
      const recoveryScore = Math.max(0, 100 - result.timeToRecovery / 2);
      const probabilityWeight = result.probabilityOfOccurrence;

      return ((drawdownScore + recoveryScore) / 2) * probabilityWeight;
    });

    const overallScore =
      weightedScores.reduce((sum, score) => sum + score, 0) /
      stressTestResults.reduce(
        (sum, result) => sum + result.probabilityOfOccurrence,
        0
      );

    // Find worst case scenario
    const worstCase = stressTestResults.reduce((worst, current) =>
      current.maxDrawdown > worst.maxDrawdown ? current : worst
    );

    // Generate recommended actions based on resilience score
    const recommendedActions = [];

    if (overallScore < 60) {
      recommendedActions.push(
        'Consider reducing portfolio risk through diversification'
      );
      recommendedActions.push(
        'Increase emergency fund to 12+ months of expenses'
      );
      recommendedActions.push('Implement systematic rebalancing strategy');
    } else if (overallScore < 80) {
      recommendedActions.push(
        'Maintain current strategy with minor adjustments'
      );
      recommendedActions.push(
        'Consider adding defensive assets during high volatility periods'
      );
    } else {
      recommendedActions.push(
        'Portfolio shows strong resilience to market stress'
      );
      recommendedActions.push('Continue current investment strategy');
    }

    // Emergency fund recommendation based on worst case
    const emergencyFundRecommendation = Math.max(
      6,
      Math.ceil(worstCase.maxDrawdown * 18)
    );

    return {
      overallScore,
      worstCaseScenario: worstCase.scenarioName,
      recommendedActions,
      emergencyFundRecommendation,
    };
  }
}

// Export singleton instance
export const financialCalculationEngine = new FinancialCalculationEngine();
