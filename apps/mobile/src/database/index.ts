import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { Platform } from 'react-native';

// Import models
import User from './models/User';

// Import schemas
import { appSchema } from './schemas';

// Database adapter configuration
const adapter = new SQLiteAdapter({
  schema: appSchema,
  // Optional: Enable JSI for better performance (iOS/Android only)
  jsi: Platform.OS === 'ios' || Platform.OS === 'android',
  // Database name
  dbName: 'drishti.db',
});

// Create database instance
export const database = new Database({
  adapter,
  modelClasses: [User],
});

// Export database for use in components
export default database;
