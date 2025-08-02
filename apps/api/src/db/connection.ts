import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { Pool, PoolClient } from 'pg';
import {
  createPool,
  validateConfig,
  getPoolMetrics,
  PoolMetrics,
} from './config';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database connection pools
let postgresJsClient: postgres.Sql | null = null;
let pgPool: Pool | null = null;

// Database health interface
export interface DatabaseHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  latency?: string;
  error?: string;
  timestamp: string;
  poolMetrics?: PoolMetrics | undefined;
  connectionCount?: number | undefined;
}

// Initialize postgres-js client for Drizzle ORM
const initializePostgresJs = (): postgres.Sql => {
  if (postgresJsClient) {
    return postgresJsClient;
  }

  const connectionString =
    process.env.DATABASE_URL || 'postgresql://localhost:5432/drishti_dev';

  postgresJsClient = postgres(connectionString, {
    max: 20, // Maximum number of connections
    idle_timeout: 30, // Close idle connections after 30 seconds
    connect_timeout: 30, // Connection timeout in seconds
    prepare: false, // Disable prepared statements for better compatibility
    transform: {
      undefined: null, // Transform undefined to null
    },
    onnotice: process.env.NODE_ENV === 'development' ? console.log : () => {},
  });

  return postgresJsClient;
};

// Create Drizzle database instance
export const db = drizzle(initializePostgresJs());

// Initialize PostgreSQL connection pool with retry logic
export const initializeDatabase = async (retries = 3): Promise<Pool> => {
  if (pgPool) {
    return pgPool;
  }

  // Validate configuration first
  if (!validateConfig()) {
    throw new Error('Invalid database configuration');
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(
        `[DB] Initializing database connection (attempt ${attempt}/${retries})`
      );

      pgPool = createPool();

      // Test the connection
      const client = await pgPool.connect();
      try {
        const result = await client.query(
          'SELECT NOW() as current_time, version() as version'
        );
        console.log(
          `[DB] Connected successfully at ${result.rows[0].current_time}`
        );
        console.log(
          `[DB] PostgreSQL version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`
        );
      } finally {
        client.release();
      }

      // Set up pool event handlers
      setupPoolEventHandlers(pgPool);

      console.log(
        `[DB] Database initialized successfully with pool size ${pgPool.options.max}`
      );
      return pgPool;
    } catch (error) {
      lastError = error as Error;
      console.error(`[DB] Connection attempt ${attempt} failed:`, error);

      if (pgPool) {
        await pgPool.end();
        pgPool = null;
      }

      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`[DB] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Failed to initialize database after ${retries} attempts: ${lastError?.message}`
  );
};

// Set up pool event handlers
const setupPoolEventHandlers = (pool: Pool): void => {
  pool.on('error', err => {
    console.error('[DB Pool] Unexpected error on idle client:', err);
  });

  pool.on('connect', _client => {
    if (process.env.NODE_ENV !== 'test') {
      console.log('[DB Pool] New client connected');
    }
  });

  pool.on('acquire', _client => {
    if (process.env.LOG_LEVEL === 'debug') {
      console.log('[DB Pool] Client acquired from pool');
    }
  });

  pool.on('remove', _client => {
    if (process.env.LOG_LEVEL === 'debug') {
      console.log('[DB Pool] Client removed from pool');
    }
  });
};

// Get database pool
export const getPool = (): Pool => {
  if (!pgPool) {
    throw new Error(
      'Database not initialized. Call initializeDatabase() first.'
    );
  }
  return pgPool;
};

// Database query result interface
export interface DatabaseQueryResult<T = any> {
  rows: T[];
  rowCount: number;
  command: string;
  oid: number;
  fields: any[];
}

// Execute query with automatic connection management
export const query = async <T = any>(
  text: string,
  params?: any[]
): Promise<DatabaseQueryResult<T>> => {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const result = await client.query(text, params);
    return {
      rows: result.rows,
      rowCount: result.rowCount || 0,
      command: result.command,
      oid: result.oid,
      fields: result.fields,
    };
  } finally {
    client.release();
  }
};

// Helper function for client queries within transactions
export const clientQuery = async <T = any>(
  client: PoolClient,
  text: string,
  params?: any[]
): Promise<DatabaseQueryResult<T>> => {
  const result = await client.query(text, params);
  return {
    rows: result.rows,
    rowCount: result.rowCount || 0,
    command: result.command,
    oid: result.oid,
    fields: result.fields,
  };
};

// Execute transaction
export const transaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Test database connection (both postgres-js and pg)
export const testConnection = async (): Promise<boolean> => {
  try {
    // Test postgres-js connection (for Drizzle)
    const client = initializePostgresJs();
    await client`SELECT 1 as test`;

    // Test pg pool connection if initialized
    if (pgPool) {
      const poolClient = await pgPool.connect();
      try {
        await poolClient.query('SELECT 1');
      } finally {
        poolClient.release();
      }
    }

    return true;
  } catch (error) {
    console.error('[DB] Connection test failed:', error);
    return false;
  }
};

// Close all database connections
export const closeDatabase = async (): Promise<void> => {
  console.log('[DB] Closing database connections...');

  // Close postgres-js client
  if (postgresJsClient) {
    await postgresJsClient.end();
    postgresJsClient = null;
    console.log('[DB] Postgres-js client closed');
  }

  // Close pg pool
  if (pgPool) {
    await pgPool.end();
    pgPool = null;
    console.log('[DB] PostgreSQL pool closed');
  }
};

// Get comprehensive database health information
export const getDatabaseHealth = async (): Promise<DatabaseHealth> => {
  const startTime = Date.now();

  try {
    // Test postgres-js connection first
    const client = initializePostgresJs();
    await client`SELECT 1 as health_check`;

    let poolMetrics: PoolMetrics | undefined;
    let connectionCount: number | undefined;

    // Get additional metrics if pg pool is available
    if (pgPool) {
      poolMetrics = getPoolMetrics(pgPool);

      const poolClient = await pgPool.connect();
      try {
        const statsResult = await poolClient.query(`
          SELECT
            count(*) as active_connections,
            (SELECT setting FROM pg_settings WHERE name = 'max_connections') as max_connections
          FROM pg_stat_activity
          WHERE state = 'active'
        `);
        connectionCount = parseInt(statsResult.rows[0].active_connections);
      } finally {
        poolClient.release();
      }
    }

    const latency = Date.now() - startTime;

    // Determine health status
    let status: 'healthy' | 'degraded' = 'healthy';
    if (latency > 1000 || (poolMetrics && poolMetrics.waitingCount > 5)) {
      status = 'degraded';
    }

    return {
      status,
      latency: `${latency}ms`,
      timestamp: new Date().toISOString(),
      poolMetrics,
      connectionCount,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      poolMetrics: pgPool ? getPoolMetrics(pgPool) : undefined,
    };
  }
};

// Legacy alias for backward compatibility
export const closeConnection = closeDatabase;
