import { z } from 'zod';

/**
 * Comprehensive Validation Schemas for Drishti API
 * All API endpoints use these schemas for request/response validation
 */

// Common validation patterns
const emailSchema = z.string()
  .email('Invalid email format')
  .min(5, 'Email must be at least 5 characters')
  .max(254, 'Email must not exceed 254 characters')
  .toLowerCase()
  .trim();

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

const nameSchema = z.string()
  .min(1, 'Name is required')
  .max(100, 'Name must not exceed 100 characters')
  .trim()
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

const uuidSchema = z.string()
  .uuid('Invalid UUID format');

const positiveNumberSchema = z.number()
  .positive('Must be a positive number')
  .finite('Must be a finite number');

const currencyAmountSchema = z.number()
  .min(-999999999.99, 'Amount too small')
  .max(999999999.99, 'Amount too large')
  .multipleOf(0.01, 'Amount must have at most 2 decimal places');

const dateSchema = z.string()
  .datetime('Invalid date format')
  .or(z.date());

// Authentication Schemas
export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  provider: z.enum(['email', 'google', 'apple']).default('email'),
  oauthToken: z.string().optional(),
  deviceInfo: z.object({
    platform: z.enum(['ios', 'android', 'web']),
    version: z.string(),
    model: z.string().optional(),
    uniqueId: z.string().optional()
  }).optional()
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema.optional(),
  provider: z.enum(['email', 'google', 'apple']).default('email'),
  oauthToken: z.string().optional(),
  deviceInfo: z.object({
    platform: z.enum(['ios', 'android', 'web']),
    version: z.string(),
    model: z.string().optional(),
    uniqueId: z.string().optional()
  }).optional()
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

export const changePasswordSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: passwordSchema
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword']
});

export const resetPasswordSchema = z.object({
  email: emailSchema
});

export const confirmResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: passwordSchema
});

// User Profile Schemas
export const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  dateOfBirth: dateSchema.optional(),
  phoneNumber: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional(),
  timezone: z.string()
    .min(1, 'Timezone is required')
    .optional(),
  currency: z.string()
    .length(3, 'Currency must be 3 characters (ISO 4217)')
    .toUpperCase()
    .optional(),
  language: z.string()
    .min(2, 'Language code must be at least 2 characters')
    .max(5, 'Language code must not exceed 5 characters')
    .optional()
});

// Financial Account Schemas
export const accountTypeEnum = z.enum([
  'checking',
  'savings',
  'investment',
  'retirement_401k',
  'retirement_ira',
  'retirement_roth_ira',
  'credit_card',
  'loan',
  'mortgage',
  'other'
]);

export const taxTreatmentEnum = z.enum([
  'taxable',
  'tax_deferred',
  'tax_free'
]);

export const createAccountSchema = z.object({
  name: z.string()
    .min(1, 'Account name is required')
    .max(100, 'Account name must not exceed 100 characters')
    .trim(),
  type: accountTypeEnum,
  balance: currencyAmountSchema,
  taxTreatment: taxTreatmentEnum.default('taxable'),
  institution: z.string()
    .max(100, 'Institution name must not exceed 100 characters')
    .trim()
    .optional(),
  accountNumber: z.string()
    .max(50, 'Account number must not exceed 50 characters')
    .optional(),
  interestRate: z.number()
    .min(0, 'Interest rate cannot be negative')
    .max(100, 'Interest rate cannot exceed 100%')
    .optional(),
  isActive: z.boolean().default(true)
});

export const updateAccountSchema = createAccountSchema.partial().extend({
  id: uuidSchema
});

export const updateAccountBalanceSchema = z.object({
  id: uuidSchema,
  balance: currencyAmountSchema,
  note: z.string()
    .max(500, 'Note must not exceed 500 characters')
    .optional()
});

// Financial Goal Schemas
export const goalTypeEnum = z.enum([
  'fire',
  'retirement',
  'emergency_fund',
  'house_down_payment',
  'vacation',
  'education',
  'debt_payoff',
  'other'
]);

export const createGoalSchema = z.object({
  name: z.string()
    .min(1, 'Goal name is required')
    .max(100, 'Goal name must not exceed 100 characters')
    .trim(),
  type: goalTypeEnum,
  targetAmount: positiveNumberSchema,
  targetDate: dateSchema,
  description: z.string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional(),
  priority: z.number()
    .int('Priority must be an integer')
    .min(1, 'Priority must be at least 1')
    .max(10, 'Priority must not exceed 10')
    .default(5),
  isActive: z.boolean().default(true)
});

export const updateGoalSchema = createGoalSchema.partial().extend({
  id: uuidSchema
});

// Scenario Planning Schemas
export const createScenarioSchema = z.object({
  name: z.string()
    .min(1, 'Scenario name is required')
    .max(100, 'Scenario name must not exceed 100 characters')
    .trim(),
  description: z.string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional(),
  assumptions: z.object({
    inflationRate: z.number()
      .min(0, 'Inflation rate cannot be negative')
      .max(20, 'Inflation rate cannot exceed 20%'),
    marketReturn: z.number()
      .min(-50, 'Market return cannot be less than -50%')
      .max(50, 'Market return cannot exceed 50%'),
    savingsRate: z.number()
      .min(0, 'Savings rate cannot be negative')
      .max(100, 'Savings rate cannot exceed 100%'),
    retirementAge: z.number()
      .int('Retirement age must be an integer')
      .min(18, 'Retirement age must be at least 18')
      .max(100, 'Retirement age must not exceed 100'),
    lifeExpectancy: z.number()
      .int('Life expectancy must be an integer')
      .min(50, 'Life expectancy must be at least 50')
      .max(120, 'Life expectancy must not exceed 120')
  }),
  isActive: z.boolean().default(true)
});

export const updateScenarioSchema = createScenarioSchema.partial().extend({
  id: uuidSchema
});

// Sync Schemas
export const syncRequestSchema = z.object({
  lastSyncTimestamp: dateSchema.optional(),
  entities: z.array(z.object({
    type: z.enum(['account', 'goal', 'scenario', 'user']),
    id: uuidSchema,
    data: z.record(z.any()),
    lastModified: dateSchema,
    isDeleted: z.boolean().default(false)
  })).optional()
});

export const bulkSyncSchema = z.object({
  accounts: z.array(createAccountSchema.extend({ id: uuidSchema })).optional(),
  goals: z.array(createGoalSchema.extend({ id: uuidSchema })).optional(),
  scenarios: z.array(createScenarioSchema.extend({ id: uuidSchema })).optional(),
  lastSyncTimestamp: dateSchema.optional()
});

// Query Parameter Schemas
export const paginationSchema = z.object({
  page: z.string()
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'Page must be greater than 0')
    .default('1'),
  limit: z.string()
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100')
    .default('20'),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
});

export const dateRangeSchema = z.object({
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional()
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: 'Start date must be before or equal to end date',
  path: ['endDate']
});

// Response Schemas
export const successResponseSchema = z.object({
  success: z.literal(true),
  data: z.any(),
  message: z.string().optional(),
  timestamp: z.string().datetime()
});

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
  details: z.record(z.any()).optional(),
  timestamp: z.string().datetime()
});

// Health Check Schema
export const healthCheckResponseSchema = z.object({
  status: z.enum(['healthy', 'unhealthy', 'degraded']),
  timestamp: z.string().datetime(),
  uptime: z.number(),
  version: z.string(),
  database: z.boolean(),
  checks: z.record(z.object({
    status: z.string(),
    details: z.record(z.any()).optional()
  })).optional()
});

// Export type definitions
export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type RefreshTokenRequest = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;
export type CreateAccountRequest = z.infer<typeof createAccountSchema>;
export type UpdateAccountRequest = z.infer<typeof updateAccountSchema>;
export type CreateGoalRequest = z.infer<typeof createGoalSchema>;
export type UpdateGoalRequest = z.infer<typeof updateGoalSchema>;
export type CreateScenarioRequest = z.infer<typeof createScenarioSchema>;
export type UpdateScenarioRequest = z.infer<typeof updateScenarioSchema>;
export type SyncRequest = z.infer<typeof syncRequestSchema>;
export type BulkSyncRequest = z.infer<typeof bulkSyncSchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
export type DateRangeQuery = z.infer<typeof dateRangeSchema>;
export type SuccessResponse = z.infer<typeof successResponseSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type HealthCheckResponse = z.infer<typeof healthCheckResponseSchema>;
