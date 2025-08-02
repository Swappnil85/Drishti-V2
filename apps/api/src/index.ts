import Fastify from 'fastify';
import type { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import dotenv from 'dotenv';
import { mockTestConnection, mockGetDatabaseHealth } from './db/mock-connection';

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
        version: '1.0.0',
      },
      host: 'localhost:3000',
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false,
    },
  });
}

// Routes
fastify.get('/health', async (_request: FastifyRequest, _reply: FastifyReply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Database health check endpoint
fastify.get('/health/db', async (_request: FastifyRequest, reply: FastifyReply) => {
  const dbHealth = await mockGetDatabaseHealth();
  const statusCode = dbHealth.status === 'healthy' ? 200 : 503;
  return reply.code(statusCode).send(dbHealth);
});

// Hello world endpoint with database connection verification
fastify.get('/', async (_request: FastifyRequest, _reply: FastifyReply) => {
  const dbConnected = await mockTestConnection();
  return {
    message: 'Drishti API is running!',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    note: 'Using mock database connection for demo'
  };
});

// Start server
const start = async () => {
  try {
    // Test database connection before starting server
    console.log('🔍 Testing database connection...');
    const dbConnected = await mockTestConnection();

    if (dbConnected) {
      console.log('✅ Database connection successful');
    } else {
      console.log('⚠️  Database connection failed - server will start but database features may not work');
    }

    await registerPlugins();

    const port = parseInt(process.env.PORT || '3000', 10);
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });
    console.log(`🚀 Server running at http://${host}:${port}`);
    console.log(`📚 API Documentation available at http://${host}:${port}/docs`);
    console.log(`🏥 Health check available at http://${host}:${port}/health`);
    console.log(`🗄️  Database health check available at http://${host}:${port}/health/db`);
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
    // Note: closeConnection() would be called here with real database
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
