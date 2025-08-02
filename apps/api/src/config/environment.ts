import { z } from 'zod';

/**
 * Environment configuration schema with validation
 * Ensures all required environment variables are present and valid
 */
const environmentSchema = z.object({
  // Application Configuration
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().transform(Number).default('3001'),
  API_VERSION: z.string().default('v1'),
  APP_NAME: z.string().default('Drishti API'),

  // Database Configuration
  DATABASE_URL: z.string().url().optional(),
  DB_HOST: z.string().min(1, 'Database host is required'),
  DB_PORT: z.string().transform(Number).default('5432'),
  DB_NAME: z.string().min(1, 'Database name is required'),
  DB_USER: z.string().min(1, 'Database user is required'),
  DB_PASSWORD: z
    .string()
    .min(8, 'Database password must be at least 8 characters'),
  DB_SSL: z
    .string()
    .transform(val => val === 'true')
    .default('false'),
  DB_POOL_MIN: z.string().transform(Number).default(2),
  DB_POOL_MAX: z.string().transform(Number).default(20),
  DB_CONNECTION_TIMEOUT: z.string().transform(Number).default(30000),
  DB_IDLE_TIMEOUT: z.string().transform(Number).default(600000),

  // JWT Configuration
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT access secret must be at least 32 characters'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT refresh secret must be at least 32 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  JWT_ISSUER: z.string().default('drishti-api'),
  JWT_AUDIENCE: z.string().default('drishti-mobile'),

  // Session Configuration
  SESSION_SECRET: z
    .string()
    .min(32, 'Session secret must be at least 32 characters'),
  SESSION_TIMEOUT: z.string().transform(Number).default(3600000),
  MAX_CONCURRENT_SESSIONS: z.string().transform(Number).default(5),

  // Security Configuration
  BCRYPT_ROUNDS: z.string().transform(Number).default(12),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default(5),
  ACCOUNT_LOCK_DURATION: z.string().transform(Number).default(3600000),
  MAX_FAILED_LOGIN_ATTEMPTS: z.string().transform(Number).default(5),

  // CORS Configuration
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  CORS_CREDENTIALS: z
    .string()
    .transform(val => val === 'true')
    .default(true),

  // SSL/TLS Configuration
  HTTPS_ENABLED: z
    .string()
    .transform(val => val === 'true')
    .default(false),
  SSL_CERT_PATH: z.string().optional(),
  SSL_KEY_PATH: z.string().optional(),
  SSL_CA_PATH: z.string().optional(),
  FORCE_HTTPS: z
    .string()
    .transform(val => val === 'true')
    .default(false),

  // OAuth Configuration (Optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_TEAM_ID: z.string().optional(),
  APPLE_KEY_ID: z.string().optional(),
  APPLE_PRIVATE_KEY_PATH: z.string().optional(),

  // Email Configuration
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).default(587),
  SMTP_SECURE: z
    .string()
    .transform(val => val === 'true')
    .default(true),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),
  FROM_NAME: z.string().default('Drishti'),

  // Redis Configuration
  REDIS_URL: z.string().url().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().transform(Number).default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().transform(Number).default(0),
  REDIS_TLS: z
    .string()
    .transform(val => val === 'true')
    .default(false),

  // Monitoring and Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'text']).default('json'),
  SENTRY_DSN: z.string().url().optional(),
  ENABLE_REQUEST_LOGGING: z
    .string()
    .transform(val => val === 'true')
    .default(true),
  ENABLE_ERROR_TRACKING: z
    .string()
    .transform(val => val === 'true')
    .default(true),

  // Health Check Configuration
  HEALTH_CHECK_ENABLED: z
    .string()
    .transform(val => val === 'true')
    .default(true),
  HEALTH_CHECK_PATH: z.string().default('/health'),
  HEALTH_CHECK_TIMEOUT: z.string().transform(Number).default(5000),

  // Feature Flags
  ENABLE_REGISTRATION: z
    .string()
    .transform(val => val === 'true')
    .default(true),
  ENABLE_OAUTH: z
    .string()
    .transform(val => val === 'true')
    .default(false),
  ENABLE_EMAIL_VERIFICATION: z
    .string()
    .transform(val => val === 'true')
    .default(true),
  ENABLE_PASSWORD_RESET: z
    .string()
    .transform(val => val === 'true')
    .default(true),

  // Debug Configuration
  DEBUG: z
    .string()
    .transform(val => val === 'true')
    .default(false),
  ENABLE_SWAGGER: z
    .string()
    .transform(val => val === 'true')
    .default(false),
});

/**
 * Validate and parse environment variables
 */
function validateEnvironment() {
  try {
    const env = environmentSchema.parse(process.env);

    // Additional validation for production
    if (env.NODE_ENV === 'production') {
      validateProductionEnvironment(env);
    }

    return env;
  } catch (error) {
    console.error('❌ Environment validation failed:');
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

/**
 * Additional validation for production environment
 */
function validateProductionEnvironment(env: any) {
  const productionErrors: string[] = [];

  // Check critical security configurations
  if (!env.HTTPS_ENABLED) {
    productionErrors.push('HTTPS must be enabled in production');
  }

  if (env.DEBUG) {
    productionErrors.push('DEBUG must be disabled in production');
  }

  if (env.ENABLE_SWAGGER) {
    productionErrors.push('Swagger must be disabled in production');
  }

  // Check JWT secrets strength
  if (env.JWT_ACCESS_SECRET.length < 64) {
    productionErrors.push(
      'JWT_ACCESS_SECRET should be at least 64 characters in production'
    );
  }

  if (env.JWT_REFRESH_SECRET.length < 64) {
    productionErrors.push(
      'JWT_REFRESH_SECRET should be at least 64 characters in production'
    );
  }

  // Check database security
  if (!env.DB_SSL) {
    productionErrors.push('Database SSL must be enabled in production');
  }

  // Check monitoring configuration
  if (!env.SENTRY_DSN) {
    console.warn(
      '⚠️  Warning: SENTRY_DSN not configured for production error tracking'
    );
  }

  if (productionErrors.length > 0) {
    console.error('❌ Production environment validation failed:');
    productionErrors.forEach(error => {
      console.error(`  - ${error}`);
    });
    process.exit(1);
  }
}

/**
 * Get validated environment configuration
 */
export const config = validateEnvironment();

/**
 * Environment type definitions
 */
export type Environment = z.infer<typeof environmentSchema>;

/**
 * Check if running in production
 */
export const isProduction = config.NODE_ENV === 'production';

/**
 * Check if running in development
 */
export const isDevelopment = config.NODE_ENV === 'development';

/**
 * Check if running in test
 */
export const isTest = config.NODE_ENV === 'test';

/**
 * Get database configuration
 */
export const getDatabaseConfig = () => ({
  host: config.DB_HOST,
  port: config.DB_PORT,
  database: config.DB_NAME,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  ssl: config.DB_SSL,
  min: config.DB_POOL_MIN,
  max: config.DB_POOL_MAX,
  connectionTimeoutMillis: config.DB_CONNECTION_TIMEOUT,
  idleTimeoutMillis: config.DB_IDLE_TIMEOUT,
});

/**
 * Get JWT configuration
 */
export const getJWTConfig = () => ({
  accessSecret: config.JWT_ACCESS_SECRET,
  refreshSecret: config.JWT_REFRESH_SECRET,
  accessExpiry: config.JWT_ACCESS_EXPIRY,
  refreshExpiry: config.JWT_REFRESH_EXPIRY,
  issuer: config.JWT_ISSUER,
  audience: config.JWT_AUDIENCE,
});

/**
 * Get security configuration
 */
export const getSecurityConfig = () => ({
  bcryptRounds: config.BCRYPT_ROUNDS,
  rateLimitWindowMs: config.RATE_LIMIT_WINDOW_MS,
  rateLimitMaxRequests: config.RATE_LIMIT_MAX_REQUESTS,
  accountLockDuration: config.ACCOUNT_LOCK_DURATION,
  maxFailedLoginAttempts: config.MAX_FAILED_LOGIN_ATTEMPTS,
  sessionTimeout: config.SESSION_TIMEOUT,
  maxConcurrentSessions: config.MAX_CONCURRENT_SESSIONS,
});

console.log(`🚀 Environment: ${config.NODE_ENV}`);
console.log(`📡 API Port: ${config.PORT}`);
console.log(`🔒 HTTPS: ${config.HTTPS_ENABLED ? 'Enabled' : 'Disabled'}`);
console.log(
  `🛡️  Security: ${isProduction ? 'Production Mode' : 'Development Mode'}`
);
