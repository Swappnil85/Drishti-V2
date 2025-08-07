import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getDatabaseHealth, query } from '../db/connection';
import { healthMonitoringService } from '../services/monitoring/HealthMonitoringService';
import { cacheService } from '../services/cache/CacheService';
import { websocketService } from '../services/websocket/WebSocketService';
import { advancedAuthService } from '../services/auth/AdvancedAuthService';
import { securityMiddleware } from '../middleware/security';
import { jwtService } from '../auth/jwt';

/**
 * Enhanced Monitoring and Health Check Routes
 * Comprehensive health monitoring with external service integration
 */

// Authentication middleware for admin endpoints
async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        success: false,
        error: 'Authorization header is required',
      });
    }

    const token = authHeader.substring(7);
    const payload = jwtService.verifyAccessToken(token);

    if (!payload) {
      return reply.code(401).send({
        success: false,
        error: 'Invalid or expired token',
      });
    }

    // Check if user has admin role (simplified check)
    const userRole = advancedAuthService.getUserRole('admin');
    if (!userRole) {
      return reply.code(403).send({
        success: false,
        error: 'Admin access required',
      });
    }

    // Add user info to request
    (request as any).user = payload;
  } catch (error) {
    return reply.code(401).send({
      success: false,
      error: 'Authentication failed',
    });
  }
}

export async function monitoringRoutes(fastify: FastifyInstance) {
  // Health check endpoint
  fastify.get(
    '/health',
    async (request: FastifyRequest, reply: FastifyReply) => {
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
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  // Detailed health check with authentication
  fastify.get(
    '/health/detailed',
    {
      preHandler: requireAdmin,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const detailedHealth = await performDetailedHealthCheck();
        return reply.send({
          success: true,
          data: detailedHealth,
        });
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Health check failed',
        });
      }
    }
  );

  // Security metrics endpoint
  fastify.get(
    '/security/metrics',
    {
      preHandler: requireAdmin,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const hours = parseInt((request.query as any)?.hours) || 24;
        const securityStats = securityMiddleware.getStats();
        const activeAlerts = healthMonitoringService
          .getActiveAlerts()
          .filter(alert => alert.component === 'security');

        return reply.send({
          success: true,
          timeframe: `${hours} hours`,
          timestamp: new Date().toISOString(),
          data: {
            ...securityStats,
            activeSecurityAlerts: activeAlerts.length,
            alerts: activeAlerts.slice(0, 10),
          },
        });
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to get security metrics',
        });
      }
    }
  );

  // Security events endpoint (alerts)
  fastify.get(
    '/security/events',
    {
      preHandler: requireAdmin,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const query = request.query as any;
        const severity = query?.severity;

        let alerts = healthMonitoringService
          .getActiveAlerts()
          .filter(alert => alert.component === 'security');

        if (severity) {
          alerts = alerts.filter(alert => alert.severity === severity);
        }

        return reply.send({
          success: true,
          severity: severity || 'all',
          timestamp: new Date().toISOString(),
          count: alerts.length,
          events: alerts.slice(0, 100), // Limit to 100 events
        });
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to get security events',
        });
      }
    }
  );

  // Security report endpoint
  fastify.get(
    '/security/report',
    {
      preHandler: requireAdmin,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const hours = parseInt((request.query as any)?.hours) || 24;
        const securityStats = securityMiddleware.getStats();
        const alerts = healthMonitoringService
          .getActiveAlerts()
          .filter(alert => alert.component === 'security');

        const report = `
DRISHTI SECURITY REPORT
Generated: ${new Date().toISOString()}
Timeframe: Last ${hours} hours

=== SECURITY STATISTICS ===
Blocked IPs: ${securityStats.blockedIPs}
Whitelisted IPs: ${securityStats.whitelistedIPs}
Suspicious IPs: ${securityStats.suspiciousIPs}
Active Rate Limits: ${securityStats.activeRateLimits}

=== ACTIVE SECURITY ALERTS ===
Total Alerts: ${alerts.length}
${alerts
  .map(
    alert => `
- [${alert.severity.toUpperCase()}] ${alert.title}
  Time: ${alert.timestamp.toISOString()}
  Description: ${alert.description}
`
  )
  .join('')}

=== CONFIGURATION ===
DDoS Protection: ${securityStats.config.enableDDoSProtection ? 'Enabled' : 'Disabled'}
Anomaly Detection: ${securityStats.config.enableAnomalyDetection ? 'Enabled' : 'Disabled'}
Geographic Restrictions: ${securityStats.config.enableGeographicRestrictions ? 'Enabled' : 'Disabled'}
        `.trim();

        return reply.type('text/plain').send(report);
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to generate security report',
        });
      }
    }
  );

  // System metrics endpoint
  fastify.get(
    '/system/metrics',
    {
      preHandler: requireAdmin,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const systemMetrics = await getSystemMetrics();
        return reply.send({
          success: true,
          data: systemMetrics,
        });
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to get system metrics',
        });
      }
    }
  );

  // Database metrics endpoint
  fastify.get(
    '/database/metrics',
    {
      preHandler: requireAdmin,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const dbMetrics = await getDatabaseMetrics();
        return reply.send({
          success: true,
          data: dbMetrics,
        });
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to get database metrics',
        });
      }
    }
  );

  // Add Prometheus metrics endpoint
  fastify.get(
    '/metrics/prometheus',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const healthStatus = healthMonitoringService.getHealthStatus();
        const systemMetrics = healthMonitoringService.getSystemMetrics();
        const monitoringStats = healthMonitoringService.getStats();

        // Generate Prometheus format metrics
        let prometheusMetrics = '';

        // Health status metrics
        prometheusMetrics += `# HELP drishti_health_status Overall health status (1=healthy, 0.5=degraded, 0=unhealthy)\n`;
        prometheusMetrics += `# TYPE drishti_health_status gauge\n`;
        const healthValue =
          healthStatus.overall === 'healthy'
            ? 1
            : healthStatus.overall === 'degraded'
              ? 0.5
              : 0;
        prometheusMetrics += `drishti_health_status ${healthValue}\n\n`;

        // Uptime metrics
        prometheusMetrics += `# HELP drishti_uptime_seconds Application uptime in seconds\n`;
        prometheusMetrics += `# TYPE drishti_uptime_seconds counter\n`;
        prometheusMetrics += `drishti_uptime_seconds ${Math.floor(process.uptime())}\n\n`;

        // Memory metrics
        const memUsage = process.memoryUsage();
        prometheusMetrics += `# HELP drishti_memory_usage_bytes Memory usage in bytes\n`;
        prometheusMetrics += `# TYPE drishti_memory_usage_bytes gauge\n`;
        prometheusMetrics += `drishti_memory_usage_bytes{type="rss"} ${memUsage.rss}\n`;
        prometheusMetrics += `drishti_memory_usage_bytes{type="heap_used"} ${memUsage.heapUsed}\n`;
        prometheusMetrics += `drishti_memory_usage_bytes{type="heap_total"} ${memUsage.heapTotal}\n`;
        prometheusMetrics += `drishti_memory_usage_bytes{type="external"} ${memUsage.external}\n\n`;

        // Active alerts
        prometheusMetrics += `# HELP drishti_active_alerts Number of active alerts\n`;
        prometheusMetrics += `# TYPE drishti_active_alerts gauge\n`;
        prometheusMetrics += `drishti_active_alerts ${monitoringStats.activeAlerts}\n\n`;

        reply.header(
          'Content-Type',
          'text/plain; version=0.0.4; charset=utf-8'
        );
        return reply.send(prometheusMetrics);
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to generate Prometheus metrics',
        });
      }
    }
  );
}

/**
 * Perform basic health check using health monitoring service
 */
async function performHealthCheck(): Promise<any> {
  try {
    const healthStatus = healthMonitoringService.getHealthStatus();
    const dbHealth = await getDatabaseHealth();

    return {
      status: healthStatus.overall,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbHealth.status === 'healthy',
      version: process.env.npm_package_version || '2.1.0',
      checks: healthStatus.checks.length,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: false,
      version: process.env.npm_package_version || '2.1.0',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Perform detailed health check using health monitoring service
 */
async function performDetailedHealthCheck(): Promise<any> {
  try {
    const healthStatus = healthMonitoringService.getHealthStatus();
    const systemMetrics = healthMonitoringService.getSystemMetrics();
    const activeAlerts = healthMonitoringService.getActiveAlerts();

    return {
      timestamp: new Date().toISOString(),
      status: healthStatus.overall,
      uptime: healthStatus.uptime,
      checks: healthStatus.checks.reduce((acc, check) => {
        acc[check.name] = {
          status: check.status,
          responseTime: check.responseTime,
          details: check.details,
          error: check.error,
        };
        return acc;
      }, {} as any),
      systemMetrics,
      activeAlerts: activeAlerts.length,
      alerts: activeAlerts.slice(0, 5), // Show first 5 alerts
    };
  } catch (error) {
    return {
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get system metrics using health monitoring service
 */
async function getSystemMetrics(): Promise<any> {
  const systemMetrics = healthMonitoringService.getSystemMetrics();
  const monitoringStats = healthMonitoringService.getStats();

  return {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    system: systemMetrics,
    monitoring: monitoringStats,
    services: {
      cache: cacheService.getStats(),
      websocket: websocketService.getStats(),
      authentication: advancedAuthService.getStats(),
      security: securityMiddleware.getStats(),
    },
    version: {
      node: process.version,
      app: process.env.npm_package_version || '2.1.0',
    },
    environment: process.env.NODE_ENV || 'development',
    pid: process.pid,
  };
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
      connectionUtilization: Math.round(
        (parseInt(stats.active_connections) / parseInt(stats.max_connections)) *
          100
      ),
    };
  } catch (error) {
    throw new Error(
      `Failed to get database metrics: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
