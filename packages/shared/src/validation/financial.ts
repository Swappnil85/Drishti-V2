import { z } from 'zod';
import {
  ACCOUNT_TYPES,
  GOAL_TYPES,
  TRANSACTION_TYPES,
  CURRENCIES,
  PRIORITIES,
  DEFAULT_CURRENCY,
  DEFAULT_PRIORITY,
} from '../types/financial';

// Base validation schemas
const uuidSchema = z.string().uuid('Invalid UUID format');
const positiveNumberSchema = z.number().positive('Must be a positive number');
const nonNegativeNumberSchema = z.number().min(0, 'Must be non-negative');
const percentageSchema = z
  .number()
  .min(0)
  .max(100, 'Must be between 0 and 100');
const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be in YYYY-MM-DD format');
const timestampSchema = z.string().datetime('Must be a valid ISO timestamp');

// Financial Account validation schemas
export const createFinancialAccountSchema = z.object({
  name: z
    .string()
    .min(1, 'Account name is required')
    .max(255, 'Account name must be less than 255 characters')
    .trim(),
  account_type: z.enum(ACCOUNT_TYPES as [string, ...string[]], {
    errorMap: () => ({
      message: `Account type must be one of: ${ACCOUNT_TYPES.join(', ')}`,
    }),
  }),
  institution: z
    .string()
    .max(255, 'Institution name must be less than 255 characters')
    .trim()
    .optional(),
  balance: z
    .number()
    .finite('Balance must be a finite number')
    .refine(
      val => Math.abs(val) <= 999999999999.99,
      'Balance exceeds maximum allowed value'
    ),
  currency: z
    .enum(CURRENCIES as [string, ...string[]], {
      errorMap: () => ({
        message: `Currency must be one of: ${CURRENCIES.join(', ')}`,
      }),
    })
    .default(DEFAULT_CURRENCY),
  interest_rate: z
    .number()
    .min(0, 'Interest rate cannot be negative')
    .max(1, 'Interest rate must be less than or equal to 1 (100%)')
    .optional(),
  metadata: z.record(z.any()).default({}),
});

export const updateFinancialAccountSchema = createFinancialAccountSchema
  .partial()
  .extend({
    is_active: z.boolean().optional(),
  });

// Financial Goal validation schemas
export const createFinancialGoalSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Goal name is required')
      .max(255, 'Goal name must be less than 255 characters')
      .trim(),
    goal_type: z.enum(GOAL_TYPES as [string, ...string[]], {
      errorMap: () => ({
        message: `Goal type must be one of: ${GOAL_TYPES.join(', ')}`,
      }),
    }),
    target_amount: positiveNumberSchema.refine(
      val => val <= 999999999999.99,
      'Target amount exceeds maximum allowed value'
    ),
    current_amount: nonNegativeNumberSchema
      .refine(
        val => val <= 999999999999.99,
        'Current amount exceeds maximum allowed value'
      )
      .default(0),
    target_date: dateStringSchema.optional(),
    priority: z
      .enum(PRIORITIES.map(String) as [string, ...string[]], {
        errorMap: () => ({
          message: `Priority must be one of: ${PRIORITIES.join(', ')}`,
        }),
      })
      .transform(Number)
      .default(String(DEFAULT_PRIORITY)),
    description: z
      .string()
      .max(1000, 'Description must be less than 1000 characters')
      .trim()
      .optional(),
    metadata: z.record(z.any()).default({}),
  })
  .refine(
    data => !data.target_date || data.current_amount <= data.target_amount,
    {
      message: 'Current amount cannot exceed target amount',
      path: ['current_amount'],
    }
  )
  .refine(
    data => !data.target_date || new Date(data.target_date) > new Date(),
    {
      message: 'Target date must be in the future',
      path: ['target_date'],
    }
  );

export const updateFinancialGoalSchema = z.object({
  name: z
    .string()
    .min(1, 'Goal name is required')
    .max(255, 'Goal name must be less than 255 characters')
    .trim()
    .optional(),
  goal_type: z
    .enum(GOAL_TYPES as [string, ...string[]], {
      errorMap: () => ({
        message: `Goal type must be one of: ${GOAL_TYPES.join(', ')}`,
      }),
    })
    .optional(),
  target_amount: positiveNumberSchema
    .refine(
      val => val <= 999999999999.99,
      'Target amount exceeds maximum allowed value'
    )
    .optional(),
  current_amount: nonNegativeNumberSchema
    .refine(
      val => val <= 999999999999.99,
      'Current amount exceeds maximum allowed value'
    )
    .optional(),
  target_date: dateStringSchema.optional(),
  priority: z
    .enum(PRIORITIES.map(String) as [string, ...string[]], {
      errorMap: () => ({
        message: `Priority must be one of: ${PRIORITIES.join(', ')}`,
      }),
    })
    .transform(Number)
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .trim()
    .optional(),
  metadata: z.record(z.any()).optional(),
  is_active: z.boolean().optional(),
});

// Scenario validation schemas
const scenarioAssumptionsSchema = z
  .object({
    inflation_rate: z
      .number()
      .min(0, 'Inflation rate cannot be negative')
      .max(0.5, 'Inflation rate seems unreasonably high (>50%)')
      .default(0.03),
    market_return: z
      .number()
      .min(-0.5, 'Market return seems unreasonably low (<-50%)')
      .max(0.5, 'Market return seems unreasonably high (>50%)')
      .default(0.07),
    savings_rate: z
      .number()
      .min(0, 'Savings rate cannot be negative')
      .max(1, 'Savings rate cannot exceed 100%')
      .default(0.2),
    retirement_age: z
      .number()
      .int('Retirement age must be a whole number')
      .min(50, 'Retirement age must be at least 50')
      .max(100, 'Retirement age must be less than 100')
      .default(65),
    life_expectancy: z
      .number()
      .int('Life expectancy must be a whole number')
      .min(60, 'Life expectancy must be at least 60')
      .max(120, 'Life expectancy must be less than 120')
      .default(85),
  })
  .catchall(z.any()); // Allow additional custom assumptions

export const createScenarioSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Scenario name is required')
      .max(255, 'Scenario name must be less than 255 characters')
      .trim(),
    description: z
      .string()
      .max(1000, 'Description must be less than 1000 characters')
      .trim()
      .optional(),
    assumptions: scenarioAssumptionsSchema.partial().default({}),
    is_default: z.boolean().default(false),
  })
  .refine(
    data =>
      data.assumptions.retirement_age === undefined ||
      data.assumptions.life_expectancy === undefined ||
      data.assumptions.retirement_age < data.assumptions.life_expectancy,
    {
      message: 'Retirement age must be less than life expectancy',
      path: ['assumptions', 'retirement_age'],
    }
  );

export const updateScenarioSchema = z.object({
  name: z
    .string()
    .min(1, 'Scenario name is required')
    .max(255, 'Scenario name must be less than 255 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .trim()
    .optional(),
  assumptions: scenarioAssumptionsSchema.optional(),
  projections: z.record(z.any()).optional(),
  is_active: z.boolean().optional(),
  is_default: z.boolean().optional(),
});

// Account Transaction validation schemas
export const createAccountTransactionSchema = z.object({
  account_id: uuidSchema,
  amount: z
    .number()
    .finite('Amount must be a finite number')
    .refine(val => val !== 0, 'Transaction amount cannot be zero')
    .refine(
      val => Math.abs(val) <= 999999999999.99,
      'Amount exceeds maximum allowed value'
    ),
  transaction_type: z.enum(TRANSACTION_TYPES as [string, ...string[]], {
    errorMap: () => ({
      message: `Transaction type must be one of: ${TRANSACTION_TYPES.join(', ')}`,
    }),
  }),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional(),
  transaction_date: dateStringSchema.optional(),
  metadata: z.record(z.any()).default({}),
});

// Goal Progress validation schemas
export const createGoalProgressSchema = z.object({
  goal_id: uuidSchema,
  amount: nonNegativeNumberSchema.refine(
    val => val <= 999999999999.99,
    'Amount exceeds maximum allowed value'
  ),
  progress_date: dateStringSchema.optional(),
  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .trim()
    .optional(),
});

// Scenario Goal validation schemas
export const createScenarioGoalSchema = z.object({
  scenario_id: uuidSchema,
  goal_id: uuidSchema,
  allocation_percentage: percentageSchema.default(100),
});

// Query parameter validation schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const financialAccountQuerySchema = paginationSchema.extend({
  account_type: z.enum(ACCOUNT_TYPES as [string, ...string[]]).optional(),
  is_active: z.coerce.boolean().optional(),
  institution: z.string().optional(),
});

export const financialGoalQuerySchema = paginationSchema.extend({
  goal_type: z.enum(GOAL_TYPES as [string, ...string[]]).optional(),
  is_active: z.coerce.boolean().optional(),
  priority: z.coerce.number().int().min(1).max(5).optional(),
});

export const scenarioQuerySchema = paginationSchema.extend({
  is_active: z.coerce.boolean().optional(),
  is_default: z.coerce.boolean().optional(),
});

export const transactionQuerySchema = paginationSchema.extend({
  account_id: uuidSchema.optional(),
  transaction_type: z
    .enum(TRANSACTION_TYPES as [string, ...string[]])
    .optional(),
  start_date: dateStringSchema.optional(),
  end_date: dateStringSchema.optional(),
});

// Bulk operation schemas
export const bulkCreateFinancialAccountsSchema = z.object({
  accounts: z.array(createFinancialAccountSchema).min(1).max(50),
});

export const bulkUpdateFinancialAccountsSchema = z.object({
  updates: z
    .array(
      z.object({
        id: uuidSchema,
        data: updateFinancialAccountSchema,
      })
    )
    .min(1)
    .max(50),
});

// Sync-related schemas
export const syncRequestSchema = z.object({
  last_sync_timestamp: timestampSchema.optional(),
  entity_types: z
    .array(
      z.enum([
        'financial_accounts',
        'financial_goals',
        'scenarios',
        'transactions',
      ])
    )
    .optional(),
});

// Dashboard query schema
export const dashboardQuerySchema = z.object({
  include_transactions: z.coerce.boolean().default(true),
  transaction_limit: z.coerce.number().int().min(1).max(50).default(10),
  include_projections: z.coerce.boolean().default(true),
});

// Export all schemas for easy access
export const financialValidationSchemas = {
  // Create schemas
  createFinancialAccount: createFinancialAccountSchema,
  createFinancialGoal: createFinancialGoalSchema,
  createScenario: createScenarioSchema,
  createAccountTransaction: createAccountTransactionSchema,
  createGoalProgress: createGoalProgressSchema,
  createScenarioGoal: createScenarioGoalSchema,

  // Update schemas
  updateFinancialAccount: updateFinancialAccountSchema,
  updateFinancialGoal: updateFinancialGoalSchema,
  updateScenario: updateScenarioSchema,

  // Query schemas
  financialAccountQuery: financialAccountQuerySchema,
  financialGoalQuery: financialGoalQuerySchema,
  scenarioQuery: scenarioQuerySchema,
  transactionQuery: transactionQuerySchema,
  dashboardQuery: dashboardQuerySchema,

  // Bulk operation schemas
  bulkCreateFinancialAccounts: bulkCreateFinancialAccountsSchema,
  bulkUpdateFinancialAccounts: bulkUpdateFinancialAccountsSchema,

  // Sync schemas
  syncRequest: syncRequestSchema,

  // Utility schemas
  pagination: paginationSchema,
  uuid: uuidSchema,
  dateString: dateStringSchema,
  timestamp: timestampSchema,
};
