import { PoolClient } from 'pg';
import { getPool } from '../connection';
import fs from 'fs/promises';
import path from 'path';

// Migration interface
export interface Migration {
  id: string;
  name: string;
  up: string;
  down: string;
  timestamp: Date;
}

// Migration record interface
export interface MigrationRecord {
  id: string;
  name: string;
  executed_at: Date;
  checksum: string;
}

// Migration result interface
export interface MigrationResult {
  success: boolean;
  migrationsRun: string[];
  errors: string[];
}

// Create migrations table if it doesn't exist
const createMigrationsTable = async (client: PoolClient): Promise<void> => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      checksum VARCHAR(64) NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_migrations_executed_at ON migrations(executed_at);
  `);
};

// Calculate checksum for migration content
const calculateChecksum = (content: string): string => {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(content).digest('hex');
};

// Load migration files from directory
const loadMigrationFiles = async (): Promise<Migration[]> => {
  const migrationsDir = path.join(__dirname, '.');
  const files = await fs.readdir(migrationsDir);
  
  const migrationFiles = files
    .filter(file => file.endsWith('.sql') && file !== 'migrator.ts')
    .sort(); // Sort to ensure consistent order

  const migrations: Migration[] = [];

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Parse migration file (expecting -- UP and -- DOWN sections)
    const sections = content.split('-- DOWN');
    if (sections.length !== 2) {
      throw new Error(`Invalid migration file format: ${file}. Expected -- UP and -- DOWN sections.`);
    }

    const upSection = sections[0].replace('-- UP', '').trim();
    const downSection = sections[1].trim();

    // Extract timestamp and name from filename (format: YYYYMMDD_HHMMSS_name.sql)
    const match = file.match(/^(\d{8}_\d{6})_(.+)\.sql$/);
    if (!match) {
      throw new Error(`Invalid migration filename format: ${file}. Expected: YYYYMMDD_HHMMSS_name.sql`);
    }

    const [, timestampStr, name] = match;
    const timestamp = new Date(
      parseInt(timestampStr.substr(0, 4)), // year
      parseInt(timestampStr.substr(4, 2)) - 1, // month (0-based)
      parseInt(timestampStr.substr(6, 2)), // day
      parseInt(timestampStr.substr(9, 2)), // hour
      parseInt(timestampStr.substr(11, 2)), // minute
      parseInt(timestampStr.substr(13, 2))  // second
    );

    migrations.push({
      id: timestampStr,
      name,
      up: upSection,
      down: downSection,
      timestamp,
    });
  }

  return migrations;
};

// Get executed migrations from database
const getExecutedMigrations = async (client: PoolClient): Promise<MigrationRecord[]> => {
  const result = await client.query(
    'SELECT id, name, executed_at, checksum FROM migrations ORDER BY executed_at ASC'
  );
  return result.rows;
};

// Execute a single migration
const executeMigration = async (
  client: PoolClient,
  migration: Migration,
  direction: 'up' | 'down' = 'up'
): Promise<void> => {
  const sql = direction === 'up' ? migration.up : migration.down;
  const checksum = calculateChecksum(migration.up);

  console.log(`[Migration] Executing ${direction}: ${migration.id}_${migration.name}`);

  try {
    // Execute the migration SQL
    await client.query(sql);

    if (direction === 'up') {
      // Record the migration as executed
      await client.query(
        'INSERT INTO migrations (id, name, executed_at, checksum) VALUES ($1, $2, NOW(), $3)',
        [migration.id, migration.name, checksum]
      );
    } else {
      // Remove the migration record
      await client.query('DELETE FROM migrations WHERE id = $1', [migration.id]);
    }

    console.log(`[Migration] Successfully executed ${direction}: ${migration.id}_${migration.name}`);
  } catch (error) {
    console.error(`[Migration] Failed to execute ${direction}: ${migration.id}_${migration.name}`, error);
    throw error;
  }
};

// Run pending migrations
export const runMigrations = async (): Promise<MigrationResult> => {
  const pool = getPool();
  const client = await pool.connect();
  
  const result: MigrationResult = {
    success: true,
    migrationsRun: [],
    errors: [],
  };

  try {
    await client.query('BEGIN');

    // Create migrations table if it doesn't exist
    await createMigrationsTable(client);

    // Load all migration files
    const allMigrations = await loadMigrationFiles();
    
    // Get executed migrations
    const executedMigrations = await getExecutedMigrations(client);
    const executedIds = new Set(executedMigrations.map(m => m.id));

    // Find pending migrations
    const pendingMigrations = allMigrations.filter(m => !executedIds.has(m.id));

    if (pendingMigrations.length === 0) {
      console.log('[Migration] No pending migrations found');
      await client.query('COMMIT');
      return result;
    }

    console.log(`[Migration] Found ${pendingMigrations.length} pending migrations`);

    // Execute pending migrations
    for (const migration of pendingMigrations) {
      try {
        await executeMigration(client, migration, 'up');
        result.migrationsRun.push(`${migration.id}_${migration.name}`);
      } catch (error) {
        const errorMsg = `Failed to execute migration ${migration.id}_${migration.name}: ${error}`;
        result.errors.push(errorMsg);
        result.success = false;
        throw new Error(errorMsg);
      }
    }

    await client.query('COMMIT');
    console.log(`[Migration] Successfully executed ${result.migrationsRun.length} migrations`);

  } catch (error) {
    await client.query('ROLLBACK');
    result.success = false;
    if (!result.errors.length) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown migration error');
    }
    console.error('[Migration] Migration failed, rolled back:', error);
  } finally {
    client.release();
  }

  return result;
};

// Rollback last migration
export const rollbackMigration = async (): Promise<MigrationResult> => {
  const pool = getPool();
  const client = await pool.connect();
  
  const result: MigrationResult = {
    success: true,
    migrationsRun: [],
    errors: [],
  };

  try {
    await client.query('BEGIN');

    // Get the last executed migration
    const lastMigrationResult = await client.query(
      'SELECT id, name FROM migrations ORDER BY executed_at DESC LIMIT 1'
    );

    if (lastMigrationResult.rows.length === 0) {
      console.log('[Migration] No migrations to rollback');
      await client.query('COMMIT');
      return result;
    }

    const lastMigration = lastMigrationResult.rows[0];
    
    // Load all migrations to find the one to rollback
    const allMigrations = await loadMigrationFiles();
    const migrationToRollback = allMigrations.find(m => m.id === lastMigration.id);

    if (!migrationToRollback) {
      throw new Error(`Migration file not found for rollback: ${lastMigration.id}_${lastMigration.name}`);
    }

    await executeMigration(client, migrationToRollback, 'down');
    result.migrationsRun.push(`${migrationToRollback.id}_${migrationToRollback.name} (rollback)`);

    await client.query('COMMIT');
    console.log(`[Migration] Successfully rolled back migration: ${migrationToRollback.id}_${migrationToRollback.name}`);

  } catch (error) {
    await client.query('ROLLBACK');
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Unknown rollback error');
    console.error('[Migration] Rollback failed:', error);
  } finally {
    client.release();
  }

  return result;
};

// Get migration status
export const getMigrationStatus = async (): Promise<{
  executed: MigrationRecord[];
  pending: string[];
  total: number;
}> => {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await createMigrationsTable(client);
    
    const allMigrations = await loadMigrationFiles();
    const executedMigrations = await getExecutedMigrations(client);
    const executedIds = new Set(executedMigrations.map(m => m.id));
    
    const pendingMigrations = allMigrations
      .filter(m => !executedIds.has(m.id))
      .map(m => `${m.id}_${m.name}`);

    return {
      executed: executedMigrations,
      pending: pendingMigrations,
      total: allMigrations.length,
    };
  } finally {
    client.release();
  }
};
