/**
 * Database Migrations
 * WatermelonDB migrations for schema changes
 */

import {
  schemaMigrations,
  addColumns,
  createTable,
} from '@nozbe/watermelondb/Schema/migrations';

export const migrations = schemaMigrations({
  migrations: [
    // Migration from version 1 to 2: Add enhanced account fields
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: 'financial_accounts',
          columns: [
            {
              name: 'institution_id',
              type: 'string',
              isOptional: true,
              isIndexed: true,
            },
            { name: 'routing_number', type: 'string', isOptional: true },
            {
              name: 'account_number_encrypted',
              type: 'string',
              isOptional: true,
            },
            {
              name: 'tax_treatment',
              type: 'string',
              isOptional: true,
              isIndexed: true,
            },
            { name: 'tags', type: 'string' }, // JSON array, defaults to '[]'
            { name: 'color', type: 'string', isOptional: true },
            { name: 'linked_account_ids', type: 'string' }, // JSON array, defaults to '[]'
          ],
        }),
      ],
    },
    // Migration from version 2 to 3: Add financial institutions table
    {
      toVersion: 3,
      steps: [
        createTable({
          name: 'financial_institutions',
          columns: [
            { name: 'name', type: 'string' },
            { name: 'institution_type', type: 'string', isIndexed: true },
            { name: 'routing_number', type: 'string', isOptional: true },
            { name: 'swift_code', type: 'string', isOptional: true },
            { name: 'website', type: 'string', isOptional: true },
            { name: 'logo_url', type: 'string', isOptional: true },
            { name: 'country', type: 'string' },
            { name: 'is_active', type: 'boolean', isIndexed: true },
            { name: 'default_interest_rates', type: 'string' }, // JSON string
            { name: 'supported_account_types', type: 'string' }, // JSON string
            { name: 'metadata', type: 'string' }, // JSON string
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
            { name: 'synced_at', type: 'number', isOptional: true },
          ],
        }),
      ],
    },
  ],
});
