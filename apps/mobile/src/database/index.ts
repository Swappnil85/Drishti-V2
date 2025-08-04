import { Database } from '@nozbe/watermelondb';
import { Platform } from 'react-native';

// Create database based on platform
let database: any;

if (Platform.OS === 'web') {
  // Mock database for web builds to avoid SQLite dependency
  database = {
    get: () => ({ query: () => ({ fetch: () => Promise.resolve([]) }) }),
    write: () => Promise.resolve(),
    action: (fn: any) => fn(),
  };
} else {
  // For mobile platforms, use the real database
  const SQLiteAdapter = require('@nozbe/watermelondb/adapters/sqlite').default;

  // Import models
  const User = require('./models/User').default;
  const FinancialInstitution = require('./models/FinancialInstitution').default;
  const FinancialAccount = require('./models/FinancialAccount').default;
  const FinancialGoal = require('./models/FinancialGoal').default;
  const Scenario = require('./models/Scenario').default;

  // Import schemas and migrations
  const { schema } = require('./schema');
  const { migrations } = require('./migrations');

  // Database adapter configuration
  const adapter = new SQLiteAdapter({
    schema,
    migrations,
    jsi: Platform.OS === 'ios' || Platform.OS === 'android',
    dbName: 'drishti.db',
  });

  // Create database instance
  database = new Database({
    adapter,
    modelClasses: [
      User,
      FinancialInstitution,
      FinancialAccount,
      FinancialGoal,
      Scenario,
    ],
  });
}

export { database };
export default database;
