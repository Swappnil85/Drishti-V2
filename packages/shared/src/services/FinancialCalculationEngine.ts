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
      throw new Error(
        `Debt payoff calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
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
}

// Export singleton instance
export const financialCalculationEngine = new FinancialCalculationEngine();
