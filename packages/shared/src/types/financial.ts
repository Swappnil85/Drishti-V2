// Shared types for financial entities across mobile and API

export type AccountType =
  | 'checking'
  | 'savings'
  | 'investment'
  | 'retirement'
  | 'credit'
  | 'loan'
  | 'other';
export type GoalType =
  | 'savings'
  | 'retirement'
  | 'debt_payoff'
  | 'emergency_fund'
  | 'investment'
  | 'other';
export type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'transfer'
  | 'interest'
  | 'fee'
  | 'adjustment';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY';
export type Priority = 1 | 2 | 3 | 4 | 5;

// Base entity interface with common fields
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
  synced_at?: string;
}

// Financial User entity (extends base user type)
export interface FinancialUser extends BaseEntity {
  email: string;
  name: string;
  avatar_url?: string;
  email_verified: boolean;
  is_active: boolean;
  provider: 'email' | 'google' | 'apple';
  provider_id?: string;
}

// Financial Account entity
export interface FinancialAccount extends BaseEntity {
  user_id: string;
  name: string;
  account_type: AccountType;
  institution?: string;
  balance: number;
  currency: Currency;
  interest_rate?: number;
  is_active: boolean;
  metadata: Record<string, any>;
}

// Financial Goal entity
export interface FinancialGoal extends BaseEntity {
  user_id: string;
  name: string;
  goal_type: GoalType;
  target_amount: number;
  current_amount: number;
  target_date?: string; // ISO date string
  priority: Priority;
  description?: string;
  is_active: boolean;
  metadata: Record<string, any>;
}

// Scenario entity
export interface Scenario extends BaseEntity {
  user_id: string;
  name: string;
  description?: string;
  assumptions: ScenarioAssumptions;
  projections: ScenarioProjections;
  is_active: boolean;
  is_default: boolean;
}

// Scenario assumptions structure
export interface ScenarioAssumptions {
  inflation_rate: number;
  market_return: number;
  savings_rate: number;
  retirement_age: number;
  life_expectancy: number;
  [key: string]: any; // Allow additional custom assumptions
}

// Scenario projections structure
export interface ScenarioProjections {
  retirement_savings?: number;
  monthly_retirement_income?: number;
  goal_completion_dates?: Record<string, string>;
  net_worth_projection?: Array<{
    year: number;
    amount: number;
  }>;
  [key: string]: any; // Allow additional custom projections
}

// Scenario Goals junction entity
export interface ScenarioGoal extends BaseEntity {
  scenario_id: string;
  goal_id: string;
  allocation_percentage: number;
}

// Account Transaction entity
export interface AccountTransaction extends BaseEntity {
  account_id: string;
  user_id: string;
  amount: number;
  transaction_type: TransactionType;
  description?: string;
  transaction_date: string; // ISO date string
  metadata: Record<string, any>;
}

// Goal Progress entity
export interface GoalProgress extends BaseEntity {
  goal_id: string;
  user_id: string;
  amount: number;
  progress_date: string; // ISO date string
  notes?: string;
}

// Create/Update DTOs (Data Transfer Objects)
export interface CreateFinancialAccountDto {
  name: string;
  account_type: AccountType;
  institution?: string;
  balance: number;
  currency?: Currency;
  interest_rate?: number;
  metadata?: Record<string, any>;
}

export interface UpdateFinancialAccountDto
  extends Partial<CreateFinancialAccountDto> {
  is_active?: boolean;
}

export interface CreateFinancialGoalDto {
  name: string;
  goal_type: GoalType;
  target_amount: number;
  current_amount?: number;
  target_date?: string;
  priority?: Priority;
  description?: string;
  metadata?: Record<string, any>;
}

export interface UpdateFinancialGoalDto
  extends Partial<CreateFinancialGoalDto> {
  is_active?: boolean;
}

export interface CreateScenarioDto {
  name: string;
  description?: string;
  assumptions?: Partial<ScenarioAssumptions>;
  is_default?: boolean;
}

export interface UpdateScenarioDto extends Partial<CreateScenarioDto> {
  projections?: Partial<ScenarioProjections>;
  is_active?: boolean;
}

export interface CreateAccountTransactionDto {
  account_id: string;
  amount: number;
  transaction_type: TransactionType;
  description?: string;
  transaction_date?: string;
  metadata?: Record<string, any>;
}

export interface CreateGoalProgressDto {
  goal_id: string;
  amount: number;
  progress_date?: string;
  notes?: string;
}

// Financial API Response types
export interface FinancialApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface FinancialPaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Sync-related types
export interface SyncStatus {
  last_sync: string;
  pending_changes: number;
  sync_in_progress: boolean;
  last_error?: string;
}

export interface SyncData<T> {
  created: T[];
  updated: T[];
  deleted: string[]; // IDs of deleted items
  last_sync_timestamp: string;
}

// Financial summary types
export interface FinancialSummary {
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  monthly_income: number;
  monthly_expenses: number;
  savings_rate: number;
  goal_progress: Array<{
    goal_id: string;
    goal_name: string;
    progress_percentage: number;
    target_amount: number;
    current_amount: number;
  }>;
}

// Dashboard data type
export interface DashboardData {
  user: FinancialUser;
  financial_summary: FinancialSummary;
  recent_transactions: AccountTransaction[];
  active_goals: FinancialGoal[];
  default_scenario?: Scenario;
  sync_status: SyncStatus;
}

// Validation schemas (to be used with Zod)
export const ACCOUNT_TYPES: AccountType[] = [
  'checking',
  'savings',
  'investment',
  'retirement',
  'credit',
  'loan',
  'other',
];
export const GOAL_TYPES: GoalType[] = [
  'savings',
  'retirement',
  'debt_payoff',
  'emergency_fund',
  'investment',
  'other',
];
export const TRANSACTION_TYPES: TransactionType[] = [
  'deposit',
  'withdrawal',
  'transfer',
  'interest',
  'fee',
  'adjustment',
];
export const CURRENCIES: Currency[] = [
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'AUD',
  'JPY',
];
export const PRIORITIES: Priority[] = [1, 2, 3, 4, 5];

// Default values
export const DEFAULT_SCENARIO_ASSUMPTIONS: ScenarioAssumptions = {
  inflation_rate: 0.03,
  market_return: 0.07,
  savings_rate: 0.2,
  retirement_age: 65,
  life_expectancy: 85,
};

// Financial Calculation Engine Types

// Compound Interest Calculation Parameters
export interface CompoundInterestParams {
  principal: number;
  annualRate: number;
  compoundingFrequency: number; // times per year (1=annually, 12=monthly, 365=daily)
  timeInYears: number;
  additionalContributions?: number; // regular contributions
  contributionFrequency?: number; // frequency of contributions per year
  contributionTiming?: 'beginning' | 'end'; // when contributions are made
}

// Future Value Calculation Result
export interface FutureValueResult {
  futureValue: number;
  totalContributions: number;
  totalInterestEarned: number;
  effectiveAnnualRate: number;
  breakdown: {
    principalGrowth: number;
    contributionGrowth: number;
    compoundInterest: number;
  };
}

// Account Projection Parameters
export interface AccountProjectionParams {
  accountId: string;
  currentBalance: number;
  interestRate: number;
  monthlyContribution: number;
  projectionYears: number;
  inflationRate?: number;
  taxRate?: number;
  fees?: {
    annualFee?: number;
    managementFeeRate?: number;
    transactionFee?: number;
  };
}

// Account Projection Result
export interface AccountProjectionResult {
  accountId: string;
  projections: Array<{
    year: number;
    month: number;
    balance: number;
    contributions: number;
    interest: number;
    fees: number;
    realValue: number; // inflation-adjusted
    afterTaxValue: number; // tax-adjusted
  }>;
  summary: {
    finalBalance: number;
    totalContributions: number;
    totalInterest: number;
    totalFees: number;
    realFinalValue: number;
    afterTaxFinalValue: number;
    averageAnnualReturn: number;
    effectiveRate: number;
  };
}

// Monte Carlo Simulation Parameters
export interface MonteCarloParams {
  initialValue: number;
  monthlyContribution: number;
  yearsToProject: number;
  expectedReturn: number;
  volatility: number; // standard deviation
  iterations: number; // default 1000
  inflationRate?: number;
  correlationMatrix?: number[][]; // for multiple assets
}

// Monte Carlo Simulation Result
export interface MonteCarloResult {
  iterations: number;
  projections: Array<{
    percentile: number; // 5th, 10th, 25th, 50th, 75th, 90th, 95th
    finalValue: number;
    realValue: number; // inflation-adjusted
  }>;
  confidenceIntervals: {
    p90: { min: number; max: number }; // 90% confidence interval
    p80: { min: number; max: number }; // 80% confidence interval
    p50: { min: number; max: number }; // 50% confidence interval
  };
  statistics: {
    mean: number;
    median: number;
    standardDeviation: number;
    skewness: number;
    kurtosis: number;
    probabilityOfLoss: number; // probability of losing money
    probabilityOfTarget: number; // probability of reaching target (if provided)
  };
  yearlyProjections: Array<{
    year: number;
    percentiles: {
      p5: number;
      p10: number;
      p25: number;
      p50: number;
      p75: number;
      p90: number;
      p95: number;
    };
  }>;
}

// FIRE Calculation Parameters
export interface FIRECalculationParams {
  currentAge: number;
  currentSavings: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  expectedReturn: number;
  inflationRate: number;
  withdrawalRate: number; // default 4%
  targetAge?: number;
  socialSecurityBenefit?: number;
  pensionBenefit?: number;
  healthcareCosts?: number;
}

// FIRE Calculation Result
export interface FIRECalculationResult {
  fireNumber: number;
  yearsToFire: number;
  ageAtFire: number;
  monthlyRequiredSavings: number;
  savingsRate: number;
  projections: {
    leanFire: { amount: number; yearsToReach: number };
    regularFire: { amount: number; yearsToReach: number };
    fatFire: { amount: number; yearsToReach: number };
    coastFire: { amount: number; ageToStop: number };
    baristaFire: { amount: number; partTimeIncome: number };
  };
  scenarios: Array<{
    name: string;
    fireNumber: number;
    yearsToReach: number;
    monthlyIncome: number;
    assumptions: string[];
  }>;
}

// Enhanced FIRE Number Calculation Parameters (Story 2)
export interface FIRENumberCalculationParams {
  // Basic expense information
  monthlyExpenses: number;
  annualExpenses?: number; // Alternative to monthly

  // FIRE calculation settings
  withdrawalRate?: number; // Default 0.04 (4% rule)
  safetyMargin?: number; // Additional buffer percentage

  // Geographic and lifestyle adjustments
  geographicLocation?: string;
  costOfLivingMultiplier?: number;
  lifestyleInflationRate?: number;

  // Expense categories with individual inflation rates
  expenseCategories?: Array<{
    category: string;
    monthlyAmount: number;
    inflationRate: number;
    essential: boolean;
  }>;

  // Healthcare considerations
  healthcareExpenses?: {
    monthlyPremium: number;
    annualDeductible: number;
    outOfPocketMax: number;
    inflationRate: number;
  };

  // Social Security integration
  socialSecurity?: {
    estimatedBenefit: number;
    startAge: number;
    inflationAdjusted: boolean;
  };

  // Stress testing parameters
  stressTestScenarios?: Array<{
    name: string;
    marketReturnAdjustment: number;
    inflationAdjustment: number;
    expenseAdjustment: number;
  }>;
}

// Enhanced FIRE Number Calculation Result
export interface FIRENumberCalculationResult {
  // Basic FIRE numbers
  fireNumber: number;
  leanFireNumber: number;
  fatFireNumber: number;
  coastFireNumber: number;
  baristaFireNumber: number;

  // Calculation details
  annualExpenses: number;
  withdrawalRate: number;
  safetyMargin: number;

  // Geographic adjustments
  costOfLivingAdjustment: number;
  adjustedFireNumber: number;

  // Healthcare projections
  healthcareCosts?: {
    annualCost: number;
    inflationAdjustedCost: number;
    coverageGapYears: number;
    totalGapCost: number;
  };

  // Social Security impact
  socialSecurityImpact?: {
    annualBenefit: number;
    presentValue: number;
    fireNumberReduction: number;
  };

  // Stress test results
  stressTestResults: Array<{
    scenario: string;
    adjustedFireNumber: number;
    percentageIncrease: number;
    riskLevel: 'low' | 'medium' | 'high';
  }>;

  // Recommendations
  recommendations: Array<{
    category: string;
    suggestion: string;
    impact: number;
    priority: 'high' | 'medium' | 'low';
  }>;

  // Expense breakdown
  expenseBreakdown: Array<{
    category: string;
    monthlyAmount: number;
    annualAmount: number;
    inflationRate: number;
    fireContribution: number;
    essential: boolean;
  }>;
}

// Savings Rate Calculation Parameters (Story 3)
export interface SavingsRateCalculationParams {
  // Current financial situation
  currentAge: number;
  currentIncome: number;
  currentSavings: number;
  monthlyExpenses: number;

  // Financial goals
  goals: Array<{
    id: string;
    name: string;
    targetAmount: number;
    targetDate: Date;
    priority: 'high' | 'medium' | 'low';
    goalType:
      | 'retirement'
      | 'emergency_fund'
      | 'house_down_payment'
      | 'education'
      | 'vacation'
      | 'debt_payoff'
      | 'other';
    currentProgress: number;
    isFlexible: boolean; // Can timeline be adjusted?
  }>;

  // Income projections
  incomeGrowth?: {
    annualGrowthRate: number;
    promotionSchedule?: Array<{
      year: number;
      salaryIncrease: number;
    }>;
    bonusExpectations?: Array<{
      year: number;
      bonusAmount: number;
    }>;
  };

  // Budget constraints
  budgetConstraints?: {
    maxSavingsRate: number; // Maximum percentage of income that can be saved
    essentialExpenses: number; // Non-negotiable monthly expenses
    discretionaryExpenses: number; // Flexible monthly expenses
    emergencyFundMonths: number; // Months of expenses to maintain as emergency fund
  };

  // Optimization preferences
  optimizationPreferences?: {
    prioritizeHighPriorityGoals: boolean;
    allowTimelineAdjustments: boolean;
    preferEarlierGoals: boolean;
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  };
}

// Savings Rate Calculation Result
export interface SavingsRateCalculationResult {
  // Overall savings rate recommendation
  recommendedSavingsRate: number;
  requiredMonthlySavings: number;
  currentSavingsGap: number;

  // Goal-specific breakdown
  goalBreakdown: Array<{
    goalId: string;
    goalName: string;
    requiredMonthlySavings: number;
    timelineAdjustment?: {
      originalDate: Date;
      adjustedDate: Date;
      reasonForAdjustment: string;
    };
    achievabilityScore: number; // 0-100 score
    priority: 'high' | 'medium' | 'low';
  }>;

  // Budget adjustment recommendations
  budgetAdjustments: Array<{
    category: string;
    currentAmount: number;
    recommendedAmount: number;
    potentialSavings: number;
    difficulty: 'easy' | 'medium' | 'hard';
    impact: 'low' | 'medium' | 'high';
  }>;

  // Income optimization suggestions
  incomeOptimization: Array<{
    strategy: string;
    potentialIncomeIncrease: number;
    timeframe: string;
    effort: 'low' | 'medium' | 'high';
    probability: number; // 0-1 probability of success
  }>;

  // Timeline analysis
  timelineAnalysis: {
    earliestGoalCompletion: Date;
    latestGoalCompletion: Date;
    totalSavingsPeriod: number; // in years
    peakSavingsRate: number;
    averageSavingsRate: number;
  };

  // Scenario analysis
  scenarioAnalysis: Array<{
    scenario: string;
    requiredSavingsRate: number;
    goalAchievementRate: number; // Percentage of goals achieved
    tradeoffs: string[];
  }>;

  // Progress tracking milestones
  milestones: Array<{
    date: Date;
    description: string;
    targetSavings: number;
    goalProgress: Record<string, number>; // goalId -> progress percentage
  }>;
}

// Goal-Based Financial Planning Parameters
export interface GoalBasedPlanningParams {
  goals: Array<{
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: Date;
    priority: number; // 1-10 scale
    goalType: string;
    inflationAdjusted: boolean;
  }>;

  currentIncome: number;
  currentExpenses: number;
  availableForSavings: number;
  expectedReturn: number;
  inflationRate: number;

  constraints?: {
    maxSavingsRate: number;
    minEmergencyFund: number;
    flexibleGoals: string[]; // Goal IDs that can have timeline adjustments
  };
}

// Goal-Based Financial Planning Result
export interface GoalBasedPlanningResult {
  overallPlan: {
    totalRequiredSavings: number;
    recommendedSavingsRate: number;
    planFeasibility: 'achievable' | 'challenging' | 'unrealistic';
    confidenceScore: number;
  };

  goalPrioritization: Array<{
    goalId: string;
    rank: number;
    allocatedSavings: number;
    projectedCompletion: Date;
    successProbability: number;
  }>;

  savingsAllocation: Array<{
    month: number;
    totalSavings: number;
    goalAllocations: Record<string, number>; // goalId -> amount
    cumulativeProgress: Record<string, number>; // goalId -> total saved
  }>;

  recommendations: Array<{
    type:
      | 'goal_adjustment'
      | 'timeline_change'
      | 'savings_increase'
      | 'income_boost';
    description: string;
    impact: number;
    effort: 'low' | 'medium' | 'high';
  }>;
}

// Budget Adjustment Analysis Parameters
export interface BudgetAdjustmentParams {
  currentBudget: {
    income: number;
    expenses: Array<{
      category: string;
      amount: number;
      essential: boolean;
      flexibility: number; // 0-1 scale, how much can be reduced
    }>;
  };

  savingsGoal: number;
  targetSavingsRate: number;

  preferences?: {
    protectedCategories: string[]; // Categories that shouldn't be touched
    priorityReductions: string[]; // Categories to reduce first
    lifestyleImportance: number; // 0-1 scale
  };
}

// Budget Adjustment Analysis Result
export interface BudgetAdjustmentResult {
  adjustmentPlan: Array<{
    category: string;
    currentAmount: number;
    recommendedAmount: number;
    reduction: number;
    reductionPercentage: number;
    difficulty: 'easy' | 'medium' | 'hard';
    qualityOfLifeImpact: 'low' | 'medium' | 'high';
  }>;

  totalSavingsIncrease: number;
  newSavingsRate: number;
  implementationStrategy: Array<{
    phase: number;
    duration: string;
    changes: string[];
    expectedSavings: number;
  }>;

  alternativeStrategies: Array<{
    strategy: string;
    description: string;
    potentialSavings: number;
    effort: 'low' | 'medium' | 'high';
    timeframe: string;
  }>;
}

// Debt Payoff Calculation Parameters
export interface DebtPayoffParams {
  debts: Array<{
    id: string;
    name: string;
    balance: number;
    interestRate: number;
    minimumPayment: number;
  }>;
  extraPayment: number;
  strategy: 'snowball' | 'avalanche' | 'custom';
  customOrder?: string[]; // debt IDs in custom order
}

// Debt Payoff Result
export interface DebtPayoffResult {
  strategy: string;
  totalInterest: number;
  totalTime: number; // months
  monthlySavings: number;
  payoffSchedule: Array<{
    month: number;
    debtId: string;
    debtName: string;
    payment: number;
    principalPayment: number;
    interestPayment: number;
    remainingBalance: number;
    isPaidOff: boolean;
  }>;
  debtOrder: Array<{
    debtId: string;
    debtName: string;
    order: number;
    payoffMonth: number;
    totalInterest: number;
  }>;
  comparison?: {
    snowball: { totalInterest: number; totalTime: number };
    avalanche: { totalInterest: number; totalTime: number };
    savings: { interest: number; time: number };
  };
}

// Goal Progress Projection Parameters
export interface GoalProjectionParams {
  goalId: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  targetDate?: string;
  interestRate: number;
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  inflationAdjusted: boolean;
}

// Goal Progress Projection Result
export interface GoalProjectionResult {
  goalId: string;
  isOnTrack: boolean;
  projectedCompletionDate: string;
  monthsToCompletion: number;
  requiredMonthlyContribution: number;
  projectedFinalAmount: number;
  shortfall: number; // negative if surplus
  recommendations: string[];
  milestones: Array<{
    date: string;
    amount: number;
    progressPercentage: number;
  }>;
  riskAnalysis: {
    probabilityOfSuccess: number;
    worstCaseScenario: number;
    bestCaseScenario: number;
    recommendedAdjustments: string[];
  };
}

// Portfolio Optimization Parameters
export interface PortfolioOptimizationParams {
  assets: Array<{
    id: string;
    name: string;
    expectedReturn: number;
    volatility: number;
    currentAllocation: number;
  }>;
  correlationMatrix: number[][];
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  timeHorizon: number; // years
  constraints?: {
    minAllocation?: Record<string, number>;
    maxAllocation?: Record<string, number>;
    excludeAssets?: string[];
  };
}

// Portfolio Optimization Result
export interface PortfolioOptimizationResult {
  optimizedAllocation: Array<{
    assetId: string;
    assetName: string;
    currentAllocation: number;
    recommendedAllocation: number;
    difference: number;
  }>;
  expectedReturn: number;
  expectedVolatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  rebalancingRecommendations: Array<{
    action: 'buy' | 'sell';
    assetId: string;
    amount: number;
    reason: string;
  }>;
  riskMetrics: {
    valueAtRisk: number; // 95% VaR
    conditionalValueAtRisk: number; // Expected Shortfall
    beta: number;
    alpha: number;
  };
}

// Tax Optimization Parameters
export interface TaxOptimizationParams {
  accounts: Array<{
    id: string;
    type: 'taxable' | 'traditional_ira' | 'roth_ira' | '401k' | 'hsa';
    balance: number;
    contributionLimit: number;
    currentContribution: number;
  }>;
  income: number;
  taxBracket: number;
  state?: string; // for state tax calculations
  retirementAge: number;
  currentAge: number;
}

// Tax Optimization Result
export interface TaxOptimizationResult {
  recommendations: Array<{
    accountId: string;
    accountType: string;
    recommendedContribution: number;
    currentContribution: number;
    taxSavings: number;
    priority: number;
    reasoning: string;
  }>;
  totalTaxSavings: number;
  optimalWithdrawalStrategy: Array<{
    age: number;
    withdrawals: Array<{
      accountId: string;
      amount: number;
      taxImplications: number;
    }>;
  }>;
  rothConversionOpportunities: Array<{
    year: number;
    amount: number;
    taxCost: number;
    longTermBenefit: number;
  }>;
}

// Real-time Calculation Cache
export interface CalculationCache {
  key: string;
  result: any;
  timestamp: number;
  expiresAt: number;
  dependencies: string[]; // account IDs or other dependencies
  computationTime: number; // milliseconds
}

// Performance Metrics
export interface CalculationPerformanceMetrics {
  functionName: string;
  executionTime: number;
  cacheHit: boolean;
  inputSize: number;
  complexity: 'O(1)' | 'O(n)' | 'O(n²)' | 'O(log n)';
  memoryUsage: number;
  timestamp: number;
}

// Calculation Request
export interface CalculationRequest {
  type:
    | 'future_value'
    | 'monte_carlo'
    | 'fire'
    | 'debt_payoff'
    | 'goal_projection'
    | 'portfolio_optimization'
    | 'tax_optimization';
  params: any;
  userId: string;
  priority: 'low' | 'normal' | 'high' | 'realtime';
  cacheKey?: string;
  timeout?: number; // milliseconds
}

// Calculation Response
export interface CalculationResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  executionTime: number;
  cacheHit: boolean;
  warnings?: string[];
  metadata: {
    calculationType: string;
    timestamp: string;
    version: string;
    confidence: number; // 0-1 for probabilistic calculations
  };
}

// Coast FIRE Calculation Parameters (Story 4)
export interface CoastFIRECalculationParams {
  // Basic information
  currentAge: number;
  currentSavings: number;
  targetFireNumber: number;
  expectedReturn: number;

  // Coast points to calculate
  coastAges?: number[]; // Default: [30, 35, 40, 45, 50]
  traditionalRetirementAge?: number; // Default: 65

  // Optional parameters
  inflationRate?: number;
  currentMonthlyContributions?: number;

  // Geographic arbitrage
  geographicArbitrage?: {
    currentLocation: string;
    targetLocation: string;
    costOfLivingReduction: number; // Percentage reduction (0.0 to 1.0)
    movingCosts: number;
    timeToMove: number; // Years from now
  };

  // Healthcare considerations
  healthcareGapAnalysis?: {
    currentEmployerCoverage: boolean;
    estimatedMonthlyCost: number;
    ageForMedicare: number; // Usually 65
    bridgeInsuranceYears: number;
  };
}

// Coast FIRE Calculation Result
export interface CoastFIRECalculationResult {
  // Coast point analysis
  coastPoints: Array<{
    age: number;
    requiredAmount: number;
    currentShortfall: number;
    monthlyContributionsNeeded: number;
    yearsToReachCoastPoint: number;
    feasible: boolean;
    confidenceLevel: 'high' | 'medium' | 'low';
  }>;

  // Timeline visualization data
  timeline: {
    contributionPhase: {
      startAge: number;
      endAge: number;
      totalContributions: number;
      projectedValue: number;
    };
    coastPhase: {
      startAge: number;
      endAge: number;
      startingAmount: number;
      finalAmount: number;
      compoundGrowth: number;
    };
  };

  // Recommendations
  recommendations: Array<{
    category: 'contribution' | 'timeline' | 'strategy' | 'risk';
    suggestion: string;
    impact: string;
    priority: 'high' | 'medium' | 'low';
  }>;

  // Geographic arbitrage analysis
  geographicArbitrage?: {
    currentLocationCost: number;
    targetLocationCost: number;
    fireNumberReduction: number;
    coastPointImprovement: number;
    netBenefit: number;
    paybackPeriod: number; // Years to recover moving costs
  };

  // Healthcare gap analysis
  healthcareGapAnalysis?: {
    gapYears: number;
    totalGapCost: number;
    monthlyBudgetImpact: number;
    mitigationStrategies: string[];
    additionalFireNeeded: number;
  };

  // Stress testing
  stressTestResults: Array<{
    scenario: string;
    adjustedCoastPoints: Array<{
      age: number;
      requiredAmount: number;
      impactPercentage: number;
    }>;
    riskLevel: 'low' | 'medium' | 'high';
    mitigationSuggestions: string[];
  }>;
}

// Barista FIRE Calculation Parameters
export interface BaristaFIRECalculationParams {
  // Basic FIRE information
  currentAge: number;
  currentSavings: number;
  fullFireNumber: number;
  expectedReturn: number;

  // Part-time work scenarios
  partTimeScenarios: Array<{
    name: string;
    annualIncome: number;
    benefitsValue: number; // Healthcare, etc.
    workYears: number; // How many years of part-time work
    startAge: number;
  }>;

  // Expenses during Barista phase
  baristaPhaseExpenses: {
    annualExpenses: number;
    healthcareCosts: number;
    inflationRate: number;
  };

  // Optional parameters
  socialSecurityAge?: number;
  bridgeYears?: number; // Years between stopping full-time and Social Security
}

// Barista FIRE Calculation Result
export interface BaristaFIRECalculationResult {
  // Barista scenarios analysis
  scenarios: Array<{
    name: string;
    requiredSavings: number;
    savingsReduction: number; // Compared to full FIRE
    partTimeIncome: number;
    benefitsValue: number;
    totalYearsToFire: number;
    baristaPhaseYears: number;
    feasibilityScore: number; // 0-100

    // Financial projections
    projections: {
      savingsAtBaristaStart: number;
      incomeFromSavings: number;
      incomeFromWork: number;
      totalAnnualIncome: number;
      expenseCoverage: number; // Percentage of expenses covered
    };

    // Risk analysis
    risks: Array<{
      type: 'income' | 'health' | 'market' | 'inflation';
      description: string;
      impact: 'low' | 'medium' | 'high';
      mitigation: string;
    }>;
  }>;

  // Optimal scenario recommendation
  recommendedScenario: {
    scenarioName: string;
    reasonsForRecommendation: string[];
    keyBenefits: string[];
    potentialDrawbacks: string[];
  };

  // Comparison with full FIRE
  fullFireComparison: {
    fullFireAmount: number;
    baristaFireAmount: number;
    savingsReduction: number;
    timeToFireReduction: number; // Years saved
    flexibilityScore: number; // 0-100
  };
}

// Market Volatility & Downturn Modeling (Story 5)
export interface MarketScenarioParams {
  // Basic portfolio information
  currentPortfolioValue: number;
  monthlyContributions: number;
  expectedReturn: number;
  timeHorizon: number; // Years

  // Scenario configuration
  scenarioTypes: MarketScenarioType[];
  includeHistoricalData?: boolean;
  confidenceIntervals?: number[]; // Default: [10, 25, 50, 75, 90]

  // Volatility settings
  volatilityModel?: 'historical' | 'monte_carlo' | 'hybrid';
  simulationIterations?: number; // Default: 10000

  // Recovery analysis
  includeRecoveryAnalysis?: boolean;
  dollarCostAveragingAnalysis?: boolean;
  rebalancingStrategy?: RebalancingStrategy;

  // Withdrawal phase analysis
  withdrawalPhase?: {
    startAge: number;
    annualWithdrawal: number;
    withdrawalStrategy: 'fixed' | 'dynamic' | 'floor_ceiling';
  };
}

export interface MarketScenarioResult {
  // Scenario analysis results
  scenarios: Array<{
    scenarioType: MarketScenarioType;
    description: string;
    probability: number; // Historical probability of occurrence

    // Impact analysis
    portfolioImpact: {
      peakDecline: number; // Maximum drawdown percentage
      recoveryTimeMonths: number;
      finalValue: number;
      totalReturn: number;
    };

    // Timeline analysis
    timeline: Array<{
      month: number;
      portfolioValue: number;
      monthlyReturn: number;
      cumulativeReturn: number;
      drawdown: number;
    }>;

    // Confidence intervals
    confidenceIntervals: Array<{
      percentile: number;
      portfolioValue: number;
      probability: number;
    }>;
  }>;

  // Volatility analysis
  volatilityAnalysis: {
    annualVolatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    volatilityOfVolatility: number;

    // Risk metrics
    valueAtRisk: {
      confidence95: number;
      confidence99: number;
    };
    conditionalValueAtRisk: {
      confidence95: number;
      confidence99: number;
    };
  };

  // Recovery analysis
  recoveryAnalysis?: {
    averageRecoveryTime: number;
    dollarCostAveragingBenefit: number;
    rebalancingBenefit: number;

    // Recovery scenarios
    recoveryScenarios: Array<{
      scenarioName: string;
      recoveryTimeMonths: number;
      finalValue: number;
      benefitVsBuyAndHold: number;
    }>;
  };

  // Safe withdrawal rate analysis
  safeWithdrawalRateAnalysis?: {
    currentSafeRate: number;
    stressTestedSafeRate: number;
    sequenceOfReturnsRisk: number;

    // Dynamic withdrawal strategies
    dynamicStrategies: Array<{
      strategyName: string;
      successRate: number;
      averageWithdrawal: number;
      worstCaseWithdrawal: number;
    }>;
  };

  // Recommendations
  recommendations: Array<{
    category: 'allocation' | 'timing' | 'strategy' | 'risk_management';
    recommendation: string;
    impact: string;
    priority: 'high' | 'medium' | 'low';
    implementationComplexity: 'low' | 'medium' | 'high';
  }>;
}

// Market scenario types based on historical events
export type MarketScenarioType =
  | 'great_recession_2008'
  | 'covid_crash_2020'
  | 'dot_com_crash_2000'
  | 'black_monday_1987'
  | 'stagflation_1970s'
  | 'lost_decade_japan'
  | 'sustained_low_returns'
  | 'high_inflation_period'
  | 'rising_interest_rates'
  | 'market_correction_10'
  | 'bear_market_20'
  | 'severe_recession_30';

// Rebalancing strategies
export interface RebalancingStrategy {
  type: 'none' | 'calendar' | 'threshold' | 'hybrid';
  frequency?: 'monthly' | 'quarterly' | 'annually';
  thresholdPercentage?: number; // For threshold-based rebalancing
  targetAllocation: {
    stocks: number;
    bonds: number;
    alternatives?: number;
    cash?: number;
  };
}

// Historical market data point
export interface HistoricalMarketData {
  date: string; // ISO date string
  spyReturn: number; // S&P 500 monthly return
  bondReturn: number; // Bond index monthly return
  inflationRate: number; // Monthly inflation rate
  interestRate: number; // Risk-free rate
  volatilityIndex: number; // VIX or similar volatility measure
}

// Market stress test parameters
export interface MarketStressTestParams {
  portfolioValue: number;
  monthlyContributions: number;
  timeHorizon: number;

  // Stress test scenarios
  stressScenarios: Array<{
    name: string;
    duration: number; // Months
    monthlyReturns: number[];
    probability: number;
  }>;

  // Recovery assumptions
  recoveryAssumptions: {
    averageRecoveryReturn: number;
    recoveryVolatility: number;
    correlationWithCrash: number;
  };
}

// Market stress test result
export interface MarketStressTestResult {
  stressTestResults: Array<{
    scenarioName: string;

    // Impact metrics
    maxDrawdown: number;
    timeToRecovery: number;
    finalPortfolioValue: number;
    probabilityOfOccurrence: number;

    // Mitigation analysis
    mitigationStrategies: Array<{
      strategy: string;
      effectivenessScore: number; // 0-100
      implementationCost: number;
      description: string;
    }>;
  }>;

  // Overall portfolio resilience
  portfolioResilience: {
    overallScore: number; // 0-100
    worstCaseScenario: string;
    recommendedActions: string[];
    emergencyFundRecommendation: number;
  };
}

// Batch Calculation Request
export interface BatchCalculationRequest {
  calculations: CalculationRequest[];
  parallel: boolean;
  maxConcurrency?: number;
  failFast?: boolean; // stop on first error
}

// Batch Calculation Response
export interface BatchCalculationResponse {
  results: CalculationResponse[];
  totalExecutionTime: number;
  successCount: number;
  errorCount: number;
  errors: Array<{
    index: number;
    error: string;
  }>;
}

export const DEFAULT_CURRENCY: Currency = 'USD';
export const DEFAULT_PRIORITY: Priority = 3;
