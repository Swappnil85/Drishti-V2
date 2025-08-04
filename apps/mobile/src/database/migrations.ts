/**
 * Database Migrations
 * WatermelonDB migrations for schema changes
 */

import { schemaMigrations, addColumns } from '@nozbe/watermelondb/Schema/migrations';

export const migrations = schemaMigrations({
  migrations: [
    // Migration from version 1 to 2: Add enhanced account fields
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: 'financial_accounts',
          columns: [
            { name: 'institution_id', type: 'string', isOptional: true, isIndexed: true },
            { name: 'routing_number', type: 'string', isOptional: true },
            { name: 'account_number_encrypted', type: 'string', isOptional: true },
            { name: 'tax_treatment', type: 'string', isOptional: true, isIndexed: true },
            { name: 'tags', type: 'string' }, // JSON array, defaults to '[]'
            { name: 'color', type: 'string', isOptional: true },
            { name: 'linked_account_ids', type: 'string' }, // JSON array, defaults to '[]'
          ],
        }),
      ],
    },
  ],
});
