/**
 * Native Database Configuration
 * Real SQLite database for mobile platforms
 */

import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

// Import models
import User from './models/User';
import FinancialInstitution from './models/FinancialInstitution';
import FinancialAccount from './models/FinancialAccount';
import BalanceHistory from './models/BalanceHistory';
import FinancialGoal from './models/FinancialGoal';
import Scenario from './models/Scenario';

// Import schemas and migrations
import { schema } from './schema';
import { migrations } from './migrations';

// Database adapter configuration
const adapter = new SQLiteAdapter({
  schema,
  migrations,
  jsi: true, // Enable JSI for better performance
  dbName: 'drishti.db',
});

// Create database instance
export const database = new Database({
  adapter,
  modelClasses: [
    User,
    FinancialInstitution,
    FinancialAccount,
    BalanceHistory,
    FinancialGoal,
    Scenario,
  ],
});

export default database;
