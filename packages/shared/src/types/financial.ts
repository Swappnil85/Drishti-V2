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

export const DEFAULT_CURRENCY: Currency = 'USD';
export const DEFAULT_PRIORITY: Priority = 3;
