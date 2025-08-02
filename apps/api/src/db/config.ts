import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database configuration interface
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean | object;
  connectionTimeoutMillis: number;
  idleTimeoutMillis: number;
  max: number;
  min: number;
}

// Parse DATABASE_URL or use individual environment variables
function parseDatabaseConfig(): DatabaseConfig {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && !databaseUrl.includes('username:password')) {
    // Parse DATABASE_URL
    const url = new URL(databaseUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1), // Remove leading slash
      user: url.username,
      password: url.password,
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
      connectionTimeoutMillis: 30000, // 30 seconds
      idleTimeoutMillis: 30000, // 30 seconds
      max: parseInt(process.env.DB_POOL_MAX || '20'), // Maximum pool size
      min: parseInt(process.env.DB_POOL_MIN || '5'), // Minimum pool size
    };
  }

  // Use individual environment variables
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'drishti_dev',
    user: process.env.DB_USER || 'drishti_user',
    password: process.env.DB_PASSWORD || 'dev_password',
    ssl:
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
    max: parseInt(process.env.DB_POOL_MAX || '20'),
    min: parseInt(process.env.DB_POOL_MIN || '5'),
  };
}

// Export database configuration
export const dbConfig = parseDatabaseConfig();

// Create PostgreSQL connection pool
export const createPool = (): Pool => {
  const poolConfig: PoolConfig = {
    ...dbConfig,
    // Note: Some advanced pool options are not available in the pg PoolConfig type
    // but the pool will still work with the basic configuration
  };

  const pool = new Pool(poolConfig);

  // Handle pool errors
  pool.on('error', err => {
    console.error('[DB Pool] Unexpected error on idle client:', err);
  });

  pool.on('connect', _client => {
    if (process.env.NODE_ENV !== 'test') {
      console.log('[DB Pool] New client connected');
    }
  });

  pool.on('acquire', _client => {
    if (process.env.NODE_ENV !== 'test') {
      console.log('[DB Pool] Client acquired from pool');
    }
  });

  pool.on('remove', _client => {
    if (process.env.NODE_ENV !== 'test') {
      console.log('[DB Pool] Client removed from pool');
    }
  });

  return pool;
};

// Validate database configuration
export const validateConfig = (): boolean => {
  const requiredFields = ['host', 'port', 'database', 'user', 'password'];

  for (const field of requiredFields) {
    if (!dbConfig[field as keyof DatabaseConfig]) {
      console.error(`[DB Config] Missing required field: ${field}`);
      return false;
    }
  }

  // Check for placeholder values
  if (dbConfig.user === 'username' || dbConfig.password === 'password') {
    console.error(
      '[DB Config] Database credentials contain placeholder values'
    );
    return false;
  }

  return true;
};

// Export pool metrics interface
export interface PoolMetrics {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
}

// Get pool connection metrics
export const getPoolMetrics = (pool: Pool): PoolMetrics => {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
};
