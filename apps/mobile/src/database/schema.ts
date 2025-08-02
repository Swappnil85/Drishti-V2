import { appSchema, tableSchema } from '@nozbe/watermelondb';

// WatermelonDB schema for offline-first financial data
export const schema = appSchema({
  version: 1,
  tables: [
    // Users table
    tableSchema({
      name: 'users',
      columns: [
        { name: 'email', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'avatar_url', type: 'string', isOptional: true },
        { name: 'email_verified', type: 'boolean' },
        { name: 'is_active', type: 'boolean' },
        { name: 'provider', type: 'string' },
        { name: 'provider_id', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'synced_at', type: 'number', isOptional: true },
      ],
    }),

    // Financial Accounts table
    tableSchema({
      name: 'financial_accounts',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'account_type', type: 'string', isIndexed: true },
        { name: 'institution', type: 'string', isOptional: true },
        { name: 'balance', type: 'number' },
        { name: 'currency', type: 'string' },
        { name: 'interest_rate', type: 'number', isOptional: true },
        { name: 'is_active', type: 'boolean', isIndexed: true },
        { name: 'metadata', type: 'string' }, // JSON string
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'synced_at', type: 'number', isOptional: true },
      ],
    }),

    // Financial Goals table
    tableSchema({
      name: 'financial_goals',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'goal_type', type: 'string', isIndexed: true },
        { name: 'target_amount', type: 'number' },
        { name: 'current_amount', type: 'number' },
        { name: 'target_date', type: 'string', isOptional: true }, // ISO date string
        { name: 'priority', type: 'number' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'is_active', type: 'boolean', isIndexed: true },
        { name: 'metadata', type: 'string' }, // JSON string
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'synced_at', type: 'number', isOptional: true },
      ],
    }),

    // Scenarios table
    tableSchema({
      name: 'scenarios',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'assumptions', type: 'string' }, // JSON string
        { name: 'projections', type: 'string' }, // JSON string
        { name: 'is_active', type: 'boolean', isIndexed: true },
        { name: 'is_default', type: 'boolean', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'synced_at', type: 'number', isOptional: true },
      ],
    }),

    // Scenario Goals junction table
    tableSchema({
      name: 'scenario_goals',
      columns: [
        { name: 'scenario_id', type: 'string', isIndexed: true },
        { name: 'goal_id', type: 'string', isIndexed: true },
        { name: 'allocation_percentage', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Account Transactions table
    tableSchema({
      name: 'account_transactions',
      columns: [
        { name: 'account_id', type: 'string', isIndexed: true },
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'amount', type: 'number' },
        { name: 'transaction_type', type: 'string', isIndexed: true },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'transaction_date', type: 'string' }, // ISO date string
        { name: 'metadata', type: 'string' }, // JSON string
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'synced_at', type: 'number', isOptional: true },
      ],
    }),

    // Goal Progress table
    tableSchema({
      name: 'goal_progress',
      columns: [
        { name: 'goal_id', type: 'string', isIndexed: true },
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'amount', type: 'number' },
        { name: 'progress_date', type: 'string' }, // ISO date string
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'synced_at', type: 'number', isOptional: true },
      ],
    }),

    // Sync Status table (for tracking sync state)
    tableSchema({
      name: 'sync_status',
      columns: [
        { name: 'entity_type', type: 'string', isIndexed: true },
        { name: 'last_sync', type: 'number' },
        { name: 'pending_changes', type: 'number' },
        { name: 'sync_in_progress', type: 'boolean' },
        { name: 'last_error', type: 'string', isOptional: true },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // User Sessions table (for offline session management)
    tableSchema({
      name: 'user_sessions',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'access_token', type: 'string' },
        { name: 'refresh_token', type: 'string' },
        { name: 'expires_at', type: 'number' },
        { name: 'device_info', type: 'string', isOptional: true },
        { name: 'is_active', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});

// Migration definitions for schema updates
export const migrations = [
  // Migration 1: Initial schema
  // Future migrations will be added here as the schema evolves
];

// Table names constants for type safety
export const TABLE_NAMES = {
  USERS: 'users',
  FINANCIAL_ACCOUNTS: 'financial_accounts',
  FINANCIAL_GOALS: 'financial_goals',
  SCENARIOS: 'scenarios',
  SCENARIO_GOALS: 'scenario_goals',
  ACCOUNT_TRANSACTIONS: 'account_transactions',
  GOAL_PROGRESS: 'goal_progress',
  SYNC_STATUS: 'sync_status',
  USER_SESSIONS: 'user_sessions',
} as const;

// Column names constants for type safety
export const COLUMN_NAMES = {
  ID: 'id',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  SYNCED_AT: 'synced_at',
  USER_ID: 'user_id',
  IS_ACTIVE: 'is_active',
  NAME: 'name',
  EMAIL: 'email',
  ACCOUNT_TYPE: 'account_type',
  GOAL_TYPE: 'goal_type',
  TRANSACTION_TYPE: 'transaction_type',
  IS_DEFAULT: 'is_default',
  BALANCE: 'balance',
  TARGET_AMOUNT: 'target_amount',
  CURRENT_AMOUNT: 'current_amount',
  PRIORITY: 'priority',
  INSTITUTION: 'institution',
  CURRENCY: 'currency',
  METADATA: 'metadata',
  ASSUMPTIONS: 'assumptions',
  PROJECTIONS: 'projections',
  SCENARIO_ID: 'scenario_id',
  GOAL_ID: 'goal_id',
  ACCOUNT_ID: 'account_id',
  ALLOCATION_PERCENTAGE: 'allocation_percentage',
  AMOUNT: 'amount',
  TRANSACTION_DATE: 'transaction_date',
  PROGRESS_DATE: 'progress_date',
  DESCRIPTION: 'description',
  NOTES: 'notes',
  TARGET_DATE: 'target_date',
  ENTITY_TYPE: 'entity_type',
  LAST_SYNC: 'last_sync',
  PENDING_CHANGES: 'pending_changes',
  SYNC_IN_PROGRESS: 'sync_in_progress',
  LAST_ERROR: 'last_error',
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  EXPIRES_AT: 'expires_at',
  DEVICE_INFO: 'device_info',
  AVATAR_URL: 'avatar_url',
  EMAIL_VERIFIED: 'email_verified',
  PROVIDER: 'provider',
  PROVIDER_ID: 'provider_id',
  INTEREST_RATE: 'interest_rate',
} as const;
