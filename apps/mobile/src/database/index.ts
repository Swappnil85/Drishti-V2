import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { Platform } from 'react-native';

// Import models
import User from './models/User';
import FinancialInstitution from './models/FinancialInstitution';
import FinancialAccount from './models/FinancialAccount';
import FinancialGoal from './models/FinancialGoal';
import Scenario from './models/Scenario';

// Import schemas and migrations
import { schema } from './schema';
import { migrations } from './migrations';

// Database adapter configuration
const adapter = new SQLiteAdapter({
  schema,
  migrations,
  // Optional: Enable JSI for better performance (iOS/Android only)
  jsi: Platform.OS === 'ios' || Platform.OS === 'android',
  // Database name
  dbName: 'drishti.db',
});

// Create database instance
export const database = new Database({
  adapter,
  modelClasses: [
    User,
    FinancialInstitution,
    FinancialAccount,
    FinancialGoal,
    Scenario,
  ],
});

// Export database for use in components
export default database;
