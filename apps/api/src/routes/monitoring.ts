import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { securityMonitor } from '../services/monitoring/SecurityMonitor';
import { checkDatabaseHealth } from '../config/database-security';
import { config } from '../config/environment';
import { query } from '../db/connection';

/**
 * Monitoring and Health Check Routes
 */

export async function monitoringRoutes(fastify: FastifyInstance) {
  // Health check endpoint
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const healthStatus = await performHealthCheck();
      
      if (healthStatus.status === 'healthy') {
        return reply.code(200).send(healthStatus);
      } else {
        return reply.code(503).send(healthStatus);
      }
    } catch (error) {
      return reply.code(503).send({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Detailed health check with authentication
  fastify.get('/health/detailed', {
    preHandler: [fastify.authenticate, fastify.requireAdmin]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const detailedHealth = await performDetailedHealthCheck();
      return reply.send(detailedHealth);
    } catch (error) {
      return reply.code(500).send({
        error: error instanceof Error ? error.message : 'Health check failed'
      });
    }
  });

  // Security metrics endpoint
  fastify.get('/security/metrics', {
    preHandler: [fastify.authenticate, fastify.requireAdmin]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const hours = parseInt((request.query as any)?.hours) || 24;
      const metrics = securityMonitor.getSecurityStats(hours);
      
      return reply.send({
        timeframe: `${hours} hours`,
        timestamp: new Date().toISOString(),
        metrics
      });
    } catch (error) {
      return reply.code(500).send({
        error: error instanceof Error ? error.message : 'Failed to get security metrics'
      });
    }
  });

  // Security events endpoint
  fastify.get('/security/events', {
    preHandler: [fastify.authenticate, fastify.requireAdmin]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = request.query as any;
      const hours = parseInt(query?.hours) || 24;
      const severity = query?.severity;
      
      const events = securityMonitor.getRecentEvents(hours, severity);
      
      return reply.send({
        timeframe: `${hours} hours`,
        severity: severity || 'all',
        timestamp: new Date().toISOString(),
        count: events.length,
        events: events.slice(0, 100) // Limit to 100 events
      });
    } catch (error) {
      return reply.code(500).send({
        error: error instanceof Error ? error.message : 'Failed to get security events'
      });
    }
  });

  // Security report endpoint
  fastify.get('/security/report', {
    preHandler: [fastify.authenticate, fastify.requireAdmin]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const hours = parseInt((request.query as any)?.hours) || 24;
      const report = securityMonitor.generateSecurityReport(hours);
      
      return reply.type('text/plain').send(report);
    } catch (error) {
      return reply.code(500).send({
        error: error instanceof Error ? error.message : 'Failed to generate security report'
      });
    }
  });

  // System metrics endpoint
  fastify.get('/system/metrics', {
    preHandler: [fastify.authenticate, fastify.requireAdmin]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const systemMetrics = await getSystemMetrics();
      return reply.send(systemMetrics);
    } catch (error) {
      return reply.code(500).send({
        error: error instanceof Error ? error.message : 'Failed to get system metrics'
      });
    }
  });

  // Database metrics endpoint
  fastify.get('/database/metrics', {
    preHandler: [fastify.authenticate, fastify.requireAdmin]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const dbMetrics = await getDatabaseMetrics();
      return reply.send(dbMetrics);
    } catch (error) {
      return reply.code(500).send({
        error: error instanceof Error ? error.message : 'Failed to get database metrics'
      });
    }
  });
}

/**
 * Perform basic health check
 */
async function performHealthCheck(): Promise<any> {
  const checks = {
    database: false,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  };

  try {
    // Check database connectivity
    checks.database = await checkDatabaseHealth(query as any);
  } catch (error) {
    checks.database = false;
  }

  const status = checks.database ? 'healthy' : 'unhealthy';

  return {
    status,
    ...checks
  };
}

/**
 * Perform detailed health check
 */
async function performDetailedHealthCheck(): Promise<any> {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {
      database: { status: 'unknown', details: {} },
      memory: { status: 'unknown', details: {} },
      disk: { status: 'unknown', details: {} },
      ssl: { status: 'unknown', details: {} },
      security: { status: 'unknown', details: {} }
    }
  };

  // Database check
  try {
    const dbHealthy = await checkDatabaseHealth(query as any);
    const dbMetrics = await getDatabaseMetrics();
    
    checks.checks.database = {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      details: dbMetrics
    };
  } catch (error) {
    checks.checks.database = {
      status: 'error',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }

  // Memory check
  try {
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };

    const memoryStatus = memUsageMB.heapUsed > 500 ? 'warning' : 'healthy';
    
    checks.checks.memory = {
      status: memoryStatus,
      details: memUsageMB
    };
  } catch (error) {
    checks.checks.memory = {
      status: 'error',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }

  // SSL check
  try {
    checks.checks.ssl = {
      status: config.HTTPS_ENABLED ? 'enabled' : 'disabled',
      details: {
        httpsEnabled: config.HTTPS_ENABLED,
        forceHttps: config.FORCE_HTTPS,
        sslConfigured: !!(config.SSL_CERT_PATH && config.SSL_KEY_PATH)
      }
    };
  } catch (error) {
    checks.checks.ssl = {
      status: 'error',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }

  // Security check
  try {
    const securityStats = securityMonitor.getSecurityStats(1); // Last hour
    const criticalEvents = securityStats.eventsBySeverity.critical || 0;
    
    checks.checks.security = {
      status: criticalEvents > 0 ? 'warning' : 'healthy',
      details: {
        recentEvents: securityStats.totalEvents,
        criticalEvents,
        suspiciousIPs: securityMonitor.getTopSuspiciousIPs ? securityMonitor.getTopSuspiciousIPs(5) : []
      }
    };
  } catch (error) {
    checks.checks.security = {
      status: 'error',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }

  // Determine overall status
  const hasErrors = Object.values(checks.checks).some(check => check.status === 'error');
  const hasWarnings = Object.values(checks.checks).some(check => check.status === 'warning');
  
  if (hasErrors) {
    checks.status = 'unhealthy';
  } else if (hasWarnings) {
    checks.status = 'degraded';
  } else {
    checks.status = 'healthy';
  }

  return checks;
}

/**
 * Get system metrics
 */
async function getSystemMetrics(): Promise<any> {
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    version: {
      node: process.version,
      app: process.env.npm_package_version || '1.0.0'
    },
    environment: config.NODE_ENV,
    pid: process.pid
  };

  return metrics;
}

/**
 * Get database metrics
 */
async function getDatabaseMetrics(): Promise<any> {
  try {
    const result = await query(`
      SELECT 
        pg_database_size(current_database()) as database_size,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) as active_connections,
        (SELECT setting FROM pg_settings WHERE name = 'max_connections') as max_connections,
        current_database() as database_name,
        version() as database_version
    `);

    const stats = result.rows[0];
    
    return {
      timestamp: new Date().toISOString(),
      databaseName: stats.database_name,
      databaseVersion: stats.database_version.split(' ')[1],
      databaseSize: parseInt(stats.database_size),
      databaseSizeMB: Math.round(parseInt(stats.database_size) / 1024 / 1024),
      activeConnections: parseInt(stats.active_connections),
      maxConnections: parseInt(stats.max_connections),
      connectionUtilization: Math.round((parseInt(stats.active_connections) / parseInt(stats.max_connections)) * 100)
    };
  } catch (error) {
    throw new Error(`Failed to get database metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
