import Fastify from 'fastify';
import type { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import compress from '@fastify/compress';
import websocket from '@fastify/websocket';
import dotenv from 'dotenv';
import {
  initializeDatabase,
  testConnection,
  getDatabaseHealth,
  closeDatabase,
} from './db/connection';
import { runMigrations, getMigrationStatus } from './db/migrations/migrator';
import { authRoutes } from './routes/auth';
import { financialRoutes } from './routes/financial';
import { syncRoutes } from './routes/sync';
import calculationsRoutes from './routes/calculations';
import { monitoringRoutes } from './routes/monitoring';
import privacyRoutes from './routes/privacy';
import pinningRoutes from './routes/pinning';
import certificateRoutes from './routes/certificates';
import retentionRoutes from './routes/retention';
import attestationRoutes from './routes/attestation';
import adminRoutes from './routes/admin';
// import { graphqlRoutes } from './routes/graphql';
// import { batchRoutes } from './routes/batch';
import { cacheService } from './services/cache/CacheService';
// import { websocketService } from './services/websocket/WebSocketService';
import { healthMonitoringService } from './services/monitoring/HealthMonitoringService';
import { databaseOptimizationService } from './services/database/DatabaseOptimizationService';
import { retentionQueue } from './services/queue/RetentionQueue';
import { certificateQueue } from './services/queue/CertificateQueue';
import { retentionScheduler } from './services/queue/RetentionScheduler';

// Load environment variables
dotenv.config();

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

// Register plugins
async function registerPlugins() {
  // Performance and compression
  await fastify.register(compress, {
    global: true,
    encodings: ['gzip', 'deflate'],
  });

  // WebSocket support
  await fastify.register(websocket);

  // Security
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });

  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    skipOnError: true,
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
  });

  // Documentation
  await fastify.register(swagger, {
    swagger: {
      info: {
        title: 'Drishti API',
        description:
          'FIRE Planning Application API with comprehensive financial tools',
        version: '2.1.0',
        contact: {
          name: 'Drishti API Support',
          email: 'api@drishti.com',
        },
      },
      host: process.env.API_HOST || 'localhost:3000',
      schemes:
        process.env.NODE_ENV === 'production' ? ['https'] : ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      securityDefinitions: {
        Bearer: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
          description: 'Enter: Bearer {token}',
        },
      },
      tags: [
        {
          name: 'Authentication',
          description: 'User authentication and authorization',
        },
        {
          name: 'Financial',
          description: 'Financial accounts and goals management',
        },
        {
          name: 'Calculations',
          description: 'Financial calculations and projections',
        },
        {
          name: 'Batch',
          description: 'Bulk operations for efficient data processing',
        },
        {
          name: 'Monitoring',
          description: 'Health checks and system monitoring',
        },
        { name: 'Sync', description: 'Data synchronization endpoints' },
      ],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      displayOperationId: true,
      defaultModelsExpandDepth: 2,
    },
    staticCSP: true,
  });

  // API Versioning - V1 Routes (Legacy)
  await fastify.register(
    async function (fastify) {
      await fastify.register(authRoutes, { prefix: '/auth' });
      await fastify.register(financialRoutes, { prefix: '/financial' });
      await fastify.register(calculationsRoutes, { prefix: '/calculations' });
      await fastify.register(syncRoutes, { prefix: '/sync' });
    },
    { prefix: '/v1' }
  );

  // API Versioning - V2 Routes (Current)
  await fastify.register(
    async function (fastify) {
      await fastify.register(authRoutes, { prefix: '/auth' });
      await fastify.register(financialRoutes, { prefix: '/financial' });
      await fastify.register(calculationsRoutes, { prefix: '/calculations' });
      await fastify.register(syncRoutes, { prefix: '/sync' });
      await fastify.register(monitoringRoutes, { prefix: '/monitoring' });
      await fastify.register(privacyRoutes, { prefix: '' });
      await fastify.register(retentionRoutes, { prefix: '' });
      // await fastify.register(batchRoutes, { prefix: '/batch' });
      // await fastify.register(graphqlRoutes, { prefix: '/graphql' });
    },
    { prefix: '/v2' }
  );

  // Default routes (current version)
  await fastify.register(authRoutes, { prefix: '/auth' });
  await fastify.register(financialRoutes, { prefix: '/financial' });
  await fastify.register(calculationsRoutes, { prefix: '/calculations' });
  await fastify.register(syncRoutes, { prefix: '/sync' });
  await fastify.register(monitoringRoutes, { prefix: '/monitoring' });
  await fastify.register(privacyRoutes, { prefix: '' });
  await fastify.register(pinningRoutes, { prefix: '' });
  await fastify.register(certificateRoutes, { prefix: '' });
  // await fastify.register(batchRoutes, { prefix: '/batch' });
  await fastify.register(attestationRoutes, { prefix: '' });
  await fastify.register(adminRoutes, { prefix: '' });
  // await fastify.register(graphqlRoutes, { prefix: '/graphql' });

  // WebSocket routes
  // websocketService.registerRoutes(fastify);
}

// Routes
fastify.get(
  '/health',
  async (_request: FastifyRequest, _reply: FastifyReply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
);

// Database health check endpoint
fastify.get(
  '/health/db',
  async (_request: FastifyRequest, reply: FastifyReply) => {
    const dbHealth = await getDatabaseHealth();
    const statusCode = dbHealth.status === 'healthy' ? 200 : 503;
    return reply.code(statusCode).send(dbHealth);
  }
);

// Migration status endpoint
fastify.get(
  '/health/migrations',
  async (_request: FastifyRequest, _reply: FastifyReply) => {
    try {
      const migrationStatus = await getMigrationStatus();
      return {
        status: 'ok',
        migrations: migrationStatus,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }
);

// Hello world endpoint with database connection verification
fastify.get('/', async (_request: FastifyRequest, _reply: FastifyReply) => {
  const dbConnected = await testConnection();
  return {
    message: 'Drishti API is running!',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
  };
});

// Start server
const start = async () => {
  try {
    // Test database connection before starting server
    console.log('🔍 Testing database connection...');
    // Initialize database connection
    await initializeDatabase();
    console.log('✅ Database connection established');

    // Run database migrations
    console.log('🔄 Running database migrations...');
    const migrationResult = await runMigrations();

    if (migrationResult.success) {
      if (migrationResult.migrationsRun.length > 0) {
        console.log(
          `✅ Successfully ran ${migrationResult.migrationsRun.length} migrations:`
        );
        migrationResult.migrationsRun.forEach(migration => {
          console.log(`   - ${migration}`);
        });
      } else {
        console.log('✅ Database is up to date');
      }
    } else {
      console.error('❌ Migration failed:', migrationResult.errors);
      throw new Error('Database migration failed');
    }

    const dbConnected = await testConnection();

    if (dbConnected) {
      console.log('✅ Database connection successful');
    } else {
      console.log(
        '⚠️  Database connection failed - server will start but database features may not work'
      );
    }

    await registerPlugins();

    // Initialize background jobs if Redis is available
    if (
      process.env.REDIS_URL &&
      process.env.ENABLE_BACKGROUND_JOBS !== 'false'
    ) {
      try {
        await retentionQueue.scheduleDaily();
        await certificateQueue.scheduleDaily();
        await retentionScheduler.scheduleRetentionEnforcement();
        console.log(
          '✅ Background retention, certificate, and scheduler jobs scheduled'
        );
      } catch (error) {
        console.warn('⚠️  Failed to schedule background jobs:', error);
      }
    }

    const port = parseInt(process.env.PORT || '3000', 10);
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });
    console.log(`🚀 Server running at http://${host}:${port}`);
    console.log(
      `📚 API Documentation available at http://${host}:${port}/docs`
    );
    console.log(`🏥 Health check available at http://${host}:${port}/health`);
    console.log(
      `🗄️  Database health check available at http://${host}:${port}/health/db`
    );
    console.log(
      `📊 Migration status available at http://${host}:${port}/health/migrations`
    );
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Enhanced graceful shutdown
const gracefulShutdown = async (signal?: string) => {
  console.log(
    `🛑 ${signal || 'Shutdown signal'} received, shutting down gracefully...`
  );
  try {
    // Stop accepting new connections
    await fastify.close();
    console.log('✅ HTTP server closed');

    // Shutdown monitoring services
    healthMonitoringService.shutdown();
    console.log('✅ Health monitoring service stopped');

    // Shutdown database optimization service
    await databaseOptimizationService.shutdown();
    console.log('✅ Database optimization service stopped');

    // Shutdown background jobs
    if (process.env.REDIS_URL) {
      try {
        await retentionQueue.shutdown();
        await certificateQueue.shutdown();
        await retentionScheduler.shutdown();
        console.log('✅ Background job queues stopped');
      } catch (error) {
        console.warn('⚠️  Error stopping background jobs:', error);
      }
    }

    // Close database connections
    await closeDatabase();
    console.log('✅ Database connections closed');

    console.log('✅ Graceful shutdown completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

start();
