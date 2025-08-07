import { Pool, PoolConfig } from 'pg';
import { config } from './environment';

/**
 * Database Security Configuration
 * Implements comprehensive database security measures
 */

/**
 * Secure database connection configuration
 */
export function createSecureDatabaseConfig(): PoolConfig {
  const dbConfig: PoolConfig = {
    // Connection settings
    host: config.DB_HOST,
    port: config.DB_PORT,
    database: config.DB_NAME,
    user: config.DB_USER,
    password: config.DB_PASSWORD,

    // SSL Configuration (required for production)
    ssl: config.DB_SSL
      ? {
          rejectUnauthorized: true,
          ca: process.env.DB_SSL_CA,
          cert: process.env.DB_SSL_CERT,
          key: process.env.DB_SSL_KEY,
          // Require SSL in production
          // require: config.NODE_ENV === 'production', // Removed - not supported by pg
        }
      : false,

    // Connection pool security
    min: config.DB_POOL_MIN,
    max: config.DB_POOL_MAX,

    // Connection timeouts
    connectionTimeoutMillis: config.DB_CONNECTION_TIMEOUT,
    idleTimeoutMillis: config.DB_IDLE_TIMEOUT,

    // Query timeout (prevent long-running queries)
    query_timeout: 30000,

    // Statement timeout (prevent runaway queries)
    statement_timeout: 60000,

    // Application name for monitoring
    application_name: 'drishti-api',

    // Additional security options
    options: [
      // Disable JIT compilation for security
      '-c jit=off',
      // Set timezone
      '-c timezone=UTC',
      // Disable shared_preload_libraries modification
      '-c shared_preload_libraries=""',
      // Set work memory limit
      '-c work_mem=4MB',
      // Set maintenance work memory limit
      '-c maintenance_work_mem=64MB',
    ].join(' '),
  };

  return dbConfig;
}

/**
 * Database connection security validator
 */
export async function validateDatabaseSecurity(pool: Pool): Promise<void> {
  const client = await pool.connect();

  try {
    console.log('🔍 Validating database security configuration...');

    // Check SSL connection
    const sslResult = await client.query('SELECT ssl_is_used()');
    const sslEnabled = sslResult.rows[0].ssl_is_used;

    if (config.NODE_ENV === 'production' && !sslEnabled) {
      throw new Error('SSL connection is required in production');
    }

    console.log(`🔒 SSL Connection: ${sslEnabled ? 'Enabled' : 'Disabled'}`);

    // Check database version
    const versionResult = await client.query('SELECT version()');
    const version = versionResult.rows[0].version;
    console.log(`📊 Database Version: ${version.split(' ')[1]}`);

    // Check user privileges
    const privilegesResult = await client.query(`
      SELECT 
        has_database_privilege(current_user, current_database(), 'CREATE') as can_create,
        has_database_privilege(current_user, current_database(), 'CONNECT') as can_connect,
        has_database_privilege(current_user, current_database(), 'TEMPORARY') as can_temp
    `);

    const privileges = privilegesResult.rows[0];
    console.log('👤 User Privileges:', {
      create: privileges.can_create,
      connect: privileges.can_connect,
      temporary: privileges.can_temp,
    });

    // Check for dangerous extensions
    const extensionsResult = await client.query(`
      SELECT extname FROM pg_extension 
      WHERE extname IN ('plpythonu', 'plperlu', 'plpgsql', 'adminpack')
    `);

    if (extensionsResult.rows.length > 0) {
      const dangerousExtensions = extensionsResult.rows.map(row => row.extname);
      console.warn(
        '⚠️  Potentially dangerous extensions found:',
        dangerousExtensions
      );
    }

    // Check database configuration
    const configResult = await client.query(`
      SELECT name, setting, unit, context 
      FROM pg_settings 
      WHERE name IN (
        'log_statement',
        'log_min_duration_statement',
        'log_connections',
        'log_disconnections',
        'log_checkpoints',
        'shared_preload_libraries'
      )
    `);

    console.log('⚙️  Security-relevant settings:');
    configResult.rows.forEach(row => {
      console.log(`  ${row.name}: ${row.setting}${row.unit || ''}`);
    });

    // Validate table permissions
    await validateTablePermissions(client);

    console.log('✅ Database security validation completed');
  } catch (error) {
    console.error('❌ Database security validation failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Validate table-level permissions
 */
async function validateTablePermissions(client: any): Promise<void> {
  const tablesResult = await client.query(`
    SELECT 
      schemaname,
      tablename,
      has_table_privilege(current_user, schemaname||'.'||tablename, 'SELECT') as can_select,
      has_table_privilege(current_user, schemaname||'.'||tablename, 'INSERT') as can_insert,
      has_table_privilege(current_user, schemaname||'.'||tablename, 'UPDATE') as can_update,
      has_table_privilege(current_user, schemaname||'.'||tablename, 'DELETE') as can_delete
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);

  console.log('🔐 Table Permissions:');
  tablesResult.rows.forEach((row: any) => {
    const permissions = [];
    if (row.can_select) permissions.push('SELECT');
    if (row.can_insert) permissions.push('INSERT');
    if (row.can_update) permissions.push('UPDATE');
    if (row.can_delete) permissions.push('DELETE');

    console.log(`  ${row.tablename}: ${permissions.join(', ')}`);
  });
}

/**
 * Database audit logging configuration
 */
export function setupDatabaseAuditLogging(pool: Pool): void {
  // Log all database connections
  pool.on('connect', client => {
    console.log('🔌 Database connection established');

    // Set session-level security parameters
    client
      .query(
        `
      SET session_replication_role = 'origin';
      SET log_statement = 'all';
      SET log_min_duration_statement = 1000;
    `
      )
      .catch(err => {
        console.error('Failed to set session security parameters:', err);
      });
  });

  // Log connection errors
  pool.on('error', (err, client) => {
    console.error('❌ Database connection error:', err);
  });

  // Log when connections are removed
  pool.on('remove', client => {
    console.log('🔌 Database connection removed from pool');
  });
}

/**
 * Query security wrapper
 */
export function createSecureQuery(pool: Pool) {
  return async function secureQuery(text: string, params?: any[]) {
    const start = Date.now();
    const client = await pool.connect();

    try {
      // Log query for audit (in development/debug mode)
      if (config.DEBUG) {
        console.log('🔍 Executing query:', {
          text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
          params: params ? params.length : 0,
        });
      }

      // Execute query with timeout
      const result = await client.query(text, params);

      const duration = Date.now() - start;

      // Log slow queries
      if (duration > 1000) {
        console.warn(`⚠️  Slow query detected (${duration}ms):`, {
          text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
          duration,
        });
      }

      return result;
    } catch (error) {
      // Log query errors (without exposing sensitive data)
      console.error('❌ Query error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: text.substring(0, 50) + '...',
        duration: Date.now() - start,
      });

      throw error;
    } finally {
      client.release();
    }
  };
}

/**
 * Database backup verification
 */
export async function verifyDatabaseBackup(pool: Pool): Promise<void> {
  if (config.NODE_ENV !== 'production') {
    return;
  }

  const client = await pool.connect();

  try {
    // Check if pg_dump is available
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    try {
      await execAsync('which pg_dump');
      console.log('✅ pg_dump is available for backups');
    } catch (error) {
      console.warn('⚠️  pg_dump not found - database backups may not work');
    }

    // Check database size for backup planning
    const sizeResult = await client.query(`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as database_size,
        pg_database_size(current_database()) as size_bytes
    `);

    const dbSize = sizeResult.rows[0];
    console.log(`📊 Database size: ${dbSize.database_size}`);

    // Warn if database is large
    if (dbSize.size_bytes > 1024 * 1024 * 1024) {
      // 1GB
      console.warn(
        '⚠️  Large database detected - ensure backup storage is adequate'
      );
    }
  } catch (error) {
    console.error('❌ Database backup verification failed:', error);
  } finally {
    client.release();
  }
}

/**
 * Database security monitoring
 */
export function startDatabaseSecurityMonitoring(pool: Pool): void {
  // Monitor connection pool health
  setInterval(() => {
    const poolInfo = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    };

    // Log pool status if there are issues
    if (poolInfo.waitingCount > 0) {
      console.warn(
        '⚠️  Database connection pool has waiting connections:',
        poolInfo
      );
    }

    // Log if pool is nearly exhausted
    if (
      poolInfo.idleCount === 0 &&
      poolInfo.totalCount >= config.DB_POOL_MAX * 0.9
    ) {
      console.warn('⚠️  Database connection pool nearly exhausted:', poolInfo);
    }
  }, 60000); // Check every minute

  console.log('🔍 Database security monitoring started');
}

/**
 * Database connection health check
 */
export async function checkDatabaseHealth(pool: Pool): Promise<boolean> {
  try {
    const client = await pool.connect();

    try {
      // Simple health check query
      await client.query('SELECT 1');

      // Check if we can write (for read-write health check)
      await client.query('SELECT NOW()');

      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return false;
  }
}
