import Fastify from 'fastify';
import type { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import dotenv from 'dotenv';
import {
  initializeDatabase,
  testConnection,
  getDatabaseHealth,
  closeDatabase,
} from './db/connection';
import { runMigrations, getMigrationStatus } from './db/migrations/migrator';
import { authRoutes } from './routes/auth';

// Load environment variables
dotenv.config();

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

// Register plugins
async function registerPlugins() {
  // Security
  await fastify.register(helmet);
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || true,
  });
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Documentation
  await fastify.register(swagger, {
    swagger: {
      info: {
        title: 'Drishti API',
        description: 'AI-powered visual assistance API',
        version: '2.0.0',
      },
      host: 'localhost:3000',
      schemes: ['http', 'https'],
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
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false,
    },
  });

  // Register authentication routes
  await fastify.register(authRoutes, { prefix: '/auth' });
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

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('🛑 Shutting down gracefully...');
  try {
    await fastify.close();
    await closeDatabase();
    console.log('✅ Server shut down complete');
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
