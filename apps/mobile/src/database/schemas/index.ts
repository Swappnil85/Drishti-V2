import { appSchema as createAppSchema, tableSchema } from '@nozbe/watermelondb';

// Define the database schema
export const appSchema = createAppSchema({
  version: 1,
  tables: [
    // User table schema
    tableSchema({
      name: 'users',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'email', type: 'string', isIndexed: true },
        { name: 'avatar_url', type: 'string', isOptional: true },
        { name: 'is_active', type: 'boolean' },
        { name: 'last_login_at', type: 'number', isOptional: true },
        { name: 'preferences', type: 'string', isOptional: true }, // JSON string
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});

// Export individual table schemas for reference
export const userTableSchema = {
  name: 'users',
  columns: [
    { name: 'name', type: 'string' },
    { name: 'email', type: 'string', isIndexed: true },
    { name: 'avatar_url', type: 'string', isOptional: true },
    { name: 'is_active', type: 'boolean' },
    { name: 'last_login_at', type: 'number', isOptional: true },
    { name: 'preferences', type: 'string', isOptional: true },
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
  ],
};
