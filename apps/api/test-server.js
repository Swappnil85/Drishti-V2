// Simple test server to verify basic functionality
const http = require('http');
const url = require('url');

// Mock database connection test
const mockTestConnection = async () => {
  console.log('🔍 Mock: Testing database connection...');

  // Check if DATABASE_URL is configured
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.includes('username:password')) {
    console.log('⚠️  Mock: Database URL not properly configured');
    return false;
  }

  // Simulate successful connection
  console.log('✅ Mock: Database connection simulated successfully');
  return true;
};

// Mock database health check
const mockGetDatabaseHealth = async () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl || databaseUrl.includes('username:password')) {
    return {
      status: 'unhealthy',
      error: 'Database URL not configured',
      timestamp: new Date().toISOString(),
      note: 'This is a mock response - PostgreSQL not installed',
    };
  }

  return {
    status: 'healthy',
    latency: '5ms',
    timestamp: new Date().toISOString(),
    note: 'This is a mock response - PostgreSQL not installed',
  };
};

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    if (path === '/health') {
      // Basic health check
      const response = {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };
      res.writeHead(200);
      res.end(JSON.stringify(response, null, 2));
    } else if (path === '/health/db') {
      // Database health check
      const dbHealth = await mockGetDatabaseHealth();
      const statusCode = dbHealth.status === 'healthy' ? 200 : 503;
      res.writeHead(statusCode);
      res.end(JSON.stringify(dbHealth, null, 2));
    } else if (path === '/') {
      // Hello world endpoint with database connection verification
      const dbConnected = await mockTestConnection();
      const response = {
        message: 'Drishti API is running!',
        database: dbConnected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
        note: 'Using mock database connection for demo',
      };
      res.writeHead(200);
      res.end(JSON.stringify(response, null, 2));
    } else {
      // 404 Not Found
      res.writeHead(404);
      res.end(
        JSON.stringify(
          {
            error: 'Not Found',
            message: `Path ${path} not found`,
            timestamp: new Date().toISOString(),
          },
          null,
          2
        )
      );
    }
  } catch (error) {
    // 500 Internal Server Error
    res.writeHead(500);
    res.end(
      JSON.stringify(
        {
          error: 'Internal Server Error',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
        null,
        2
      )
    );
  }
});

// Start server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, async () => {
  console.log('🔍 Testing database connection...');
  const dbConnected = await mockTestConnection();

  if (dbConnected) {
    console.log('✅ Database connection successful');
  } else {
    console.log(
      '⚠️  Database connection failed - server will start but database features may not work'
    );
  }

  console.log(`🚀 Server running at http://${HOST}:${PORT}`);
  console.log(`🏥 Health check available at http://${HOST}:${PORT}/health`);
  console.log(
    `🗄️  Database health check available at http://${HOST}:${PORT}/health/db`
  );
});

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('🛑 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server shut down complete');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
