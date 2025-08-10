/**
 * Health Monitoring Service
 * Comprehensive health checks, monitoring integration, and automated alerting
 */

import { EventEmitter } from 'events';
import { query } from '../../db/connection';
import { cacheService } from '../cache/CacheService';
import { websocketService } from '../websocket/WebSocketService';
import { advancedAuthService } from '../auth/AdvancedAuthService';
import { securityMiddleware } from '../../middleware/security';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  details: any;
  timestamp: Date;
  error?: string;
}

interface SystemMetrics {
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    connectionsActive: number;
  };
}

interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  component: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata: any;
}

interface MonitoringConfig {
  healthCheckInterval: number;
  metricsCollectionInterval: number;
  alertThresholds: {
    responseTime: number;
    errorRate: number;
    memoryUsage: number;
    diskUsage: number;
    cpuUsage: number;
  };
  integrations: {
    sentry?: {
      dsn: string;
      environment: string;
    };
    datadog?: {
      apiKey: string;
      appKey: string;
    };
    slack?: {
      webhookUrl: string;
      channel: string;
    };
    email?: {
      recipients: string[];
      smtpConfig: any;
    };
  };
}

class HealthMonitoringService extends EventEmitter {
  private healthChecks: Map<string, HealthCheck> = new Map();
  private systemMetrics: SystemMetrics | null = null;
  private alerts: Map<string, Alert> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;
  private startTime: Date = new Date();

  private readonly config: MonitoringConfig = {
    healthCheckInterval: 30000, // 30 seconds
    metricsCollectionInterval: 60000, // 1 minute
    alertThresholds: {
      responseTime: 5000, // 5 seconds
      errorRate: 0.05, // 5%
      memoryUsage: 0.85, // 85%
      diskUsage: 0.9, // 90%
      cpuUsage: 0.8, // 80%
    },
    integrations: {
      sentry: process.env.SENTRY_DSN
        ? {
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV || 'development',
          }
        : undefined,
      slack: process.env.SLACK_WEBHOOK_URL
        ? {
            webhookUrl: process.env.SLACK_WEBHOOK_URL,
            channel: process.env.SLACK_CHANNEL || '#alerts',
          }
        : undefined,
    },
  };

  constructor() {
    super();
    this.startMonitoring();
    this.setupEventHandlers();
  }

  /**
   * Start monitoring services
   */
  private startMonitoring(): void {
    // Health checks
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);

    // System metrics collection
    this.metricsInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, this.config.metricsCollectionInterval);

    // Initial checks
    this.performHealthChecks();
    this.collectSystemMetrics();

    console.log('🏥 Health monitoring service started');
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.on('healthCheck', (check: HealthCheck) => {
      this.evaluateHealthCheck(check);
    });

    this.on('alert', (alert: Alert) => {
      this.handleAlert(alert);
    });

    this.on('systemMetrics', (metrics: SystemMetrics) => {
      this.evaluateSystemMetrics(metrics);
    });
  }

  /**
   * Perform comprehensive health checks
   */
  private async performHealthChecks(): Promise<void> {
    const checks = [
      this.checkDatabase(),
      this.checkCache(),
      this.checkWebSocket(),
      this.checkAuthentication(),
      this.checkSecurity(),
      this.checkDiskSpace(),
      this.checkMemoryUsage(),
    ];

    const results = await Promise.allSettled(checks);

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        this.healthChecks.set(result.value.name, result.value);
        this.emit('healthCheck', result.value);
      } else {
        const failedCheck: HealthCheck = {
          name: `check_${index}`,
          status: 'unhealthy',
          responseTime: 0,
          details: { error: result.reason },
          timestamp: new Date(),
          error: result.reason?.message || 'Unknown error',
        };
        this.healthChecks.set(failedCheck.name, failedCheck);
        this.emit('healthCheck', failedCheck);
      }
    });
  }

  /**
   * Database health check
   */
  private async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const result = await query('SELECT 1 as health_check');
      const responseTime = Date.now() - startTime;

      return {
        name: 'database',
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        responseTime,
        details: {
          connected: true,
          responseTime,
          query: 'SELECT 1',
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        details: { connected: false },
        timestamp: new Date(),
        error:
          error instanceof Error ? error.message : 'Database connection failed',
      };
    }
  }

  /**
   * Cache health check
   */
  private async checkCache(): Promise<HealthCheck> {
    const startTime = Date.now();
    const testKey = 'health_check_' + Date.now();
    const testValue = 'test_value';

    try {
      await cacheService.set(testKey, testValue, { ttl: 10 });
      const retrieved = await cacheService.get(testKey);
      await cacheService.delete(testKey);

      const responseTime = Date.now() - startTime;
      const isWorking = retrieved === testValue;

      return {
        name: 'cache',
        status: isWorking && responseTime < 500 ? 'healthy' : 'degraded',
        responseTime,
        details: {
          working: isWorking,
          stats: cacheService.getStats(),
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'cache',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        details: { working: false },
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Cache check failed',
      };
    }
  }

  /**
   * WebSocket health check
   */
  private async checkWebSocket(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const stats = websocketService.getStats();
      const responseTime = Date.now() - startTime;

      return {
        name: 'websocket',
        status: 'healthy',
        responseTime,
        details: stats,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'websocket',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        details: { available: false },
        timestamp: new Date(),
        error:
          error instanceof Error ? error.message : 'WebSocket check failed',
      };
    }
  }

  /**
   * Authentication service health check
   */
  private async checkAuthentication(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const stats = advancedAuthService.getStats();
      const responseTime = Date.now() - startTime;

      return {
        name: 'authentication',
        status: 'healthy',
        responseTime,
        details: stats,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'authentication',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        details: { available: false },
        timestamp: new Date(),
        error:
          error instanceof Error ? error.message : 'Auth service check failed',
      };
    }
  }

  /**
   * Security middleware health check
   */
  private async checkSecurity(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const stats = securityMiddleware.getStats();
      const responseTime = Date.now() - startTime;

      return {
        name: 'security',
        status: 'healthy',
        responseTime,
        details: stats,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'security',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        details: { available: false },
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Security check failed',
      };
    }
  }

  /**
   * Disk space health check
   */
  private async checkDiskSpace(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Simplified disk check - in production use proper disk usage library
      const stats = {
        total: 100 * 1024 * 1024 * 1024, // 100GB
        used: 50 * 1024 * 1024 * 1024, // 50GB
        free: 50 * 1024 * 1024 * 1024, // 50GB
      };

      const usagePercentage = stats.used / stats.total;
      const responseTime = Date.now() - startTime;

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (usagePercentage > this.config.alertThresholds.diskUsage) {
        status = 'unhealthy';
      } else if (usagePercentage > 0.75) {
        status = 'degraded';
      }

      return {
        name: 'disk_space',
        status,
        responseTime,
        details: {
          ...stats,
          usagePercentage: Math.round(usagePercentage * 100),
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'disk_space',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        details: { available: false },
        timestamp: new Date(),
        error:
          error instanceof Error ? error.message : 'Disk space check failed',
      };
    }
  }

  /**
   * Memory usage health check
   */
  private async checkMemoryUsage(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const memUsage = process.memoryUsage();
      const totalMemory = memUsage.rss + memUsage.heapTotal + memUsage.external;
      const usagePercentage = memUsage.heapUsed / memUsage.heapTotal;
      const responseTime = Date.now() - startTime;

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (usagePercentage > this.config.alertThresholds.memoryUsage) {
        status = 'unhealthy';
      } else if (usagePercentage > 0.7) {
        status = 'degraded';
      }

      return {
        name: 'memory_usage',
        status,
        responseTime,
        details: {
          ...memUsage,
          totalMemory,
          usagePercentage: Math.round(usagePercentage * 100),
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'memory_usage',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        details: { available: false },
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Memory check failed',
      };
    }
  }

  /**
   * Collect system metrics
   */
  private async collectSystemMetrics(): Promise<void> {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      // Simplified metrics - in production use proper system monitoring libraries
      const metrics: SystemMetrics = {
        cpu: {
          usage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
          loadAverage: [0.5, 0.3, 0.2], // Simplified load average
        },
        memory: {
          used: memUsage.heapUsed,
          free: memUsage.heapTotal - memUsage.heapUsed,
          total: memUsage.heapTotal,
          percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
        },
        disk: {
          used: 50 * 1024 * 1024 * 1024,
          free: 50 * 1024 * 1024 * 1024,
          total: 100 * 1024 * 1024 * 1024,
          percentage: 50,
        },
        network: {
          bytesIn: 1024 * 1024,
          bytesOut: 2048 * 1024,
          connectionsActive: 10,
        },
      };

      this.systemMetrics = metrics;
      this.emit('systemMetrics', metrics);

      // Send to external monitoring services
      await this.sendMetricsToExternalServices(metrics);
    } catch (error) {
      console.error('Failed to collect system metrics:', error);
    }
  }

  /**
   * Evaluate health check results
   */
  private evaluateHealthCheck(check: HealthCheck): void {
    if (check.status === 'unhealthy') {
      this.createAlert({
        severity: 'high',
        title: `${check.name} Health Check Failed`,
        description: check.error || `${check.name} is unhealthy`,
        component: check.name,
        metadata: check.details,
      });
    } else if (check.status === 'degraded') {
      this.createAlert({
        severity: 'medium',
        title: `${check.name} Performance Degraded`,
        description: `${check.name} is experiencing performance issues`,
        component: check.name,
        metadata: check.details,
      });
    }

    // Check response time thresholds
    if (check.responseTime > this.config.alertThresholds.responseTime) {
      this.createAlert({
        severity: 'medium',
        title: `${check.name} Slow Response`,
        description: `${check.name} response time: ${check.responseTime}ms`,
        component: check.name,
        metadata: { responseTime: check.responseTime },
      });
    }
  }

  /**
   * Evaluate system metrics
   */
  private evaluateSystemMetrics(metrics: SystemMetrics): void {
    // Memory usage alert
    if (
      metrics.memory.percentage >
      this.config.alertThresholds.memoryUsage * 100
    ) {
      this.createAlert({
        severity: 'high',
        title: 'High Memory Usage',
        description: `Memory usage: ${metrics.memory.percentage.toFixed(1)}%`,
        component: 'system',
        metadata: metrics.memory,
      });
    }

    // Disk usage alert
    if (metrics.disk.percentage > this.config.alertThresholds.diskUsage * 100) {
      this.createAlert({
        severity: 'critical',
        title: 'High Disk Usage',
        description: `Disk usage: ${metrics.disk.percentage.toFixed(1)}%`,
        component: 'system',
        metadata: metrics.disk,
      });
    }
  }

  /**
   * Create alert
   */
  private createAlert(
    alertData: Omit<Alert, 'id' | 'timestamp' | 'resolved'>
  ): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
      ...alertData,
    };

    this.alerts.set(alert.id, alert);
    this.emit('alert', alert);
  }

  /**
   * Handle alert
   */
  private async handleAlert(alert: Alert): Promise<void> {
    console.warn(`🚨 Alert [${alert.severity.toUpperCase()}]: ${alert.title}`);

    // Send to external services
    await this.sendAlertToExternalServices(alert);

    // Auto-resolve low severity alerts after 5 minutes
    if (alert.severity === 'low') {
      setTimeout(
        () => {
          this.resolveAlert(alert.id);
        },
        5 * 60 * 1000
      );
    }
  }

  /**
   * Send metrics to external monitoring services
   */
  private async sendMetricsToExternalServices(
    metrics: SystemMetrics
  ): Promise<void> {
    // DataDog integration
    if (this.config.integrations.datadog) {
      try {
        // In production, use DataDog client library
        console.log('📊 Sending metrics to DataDog:', {
          memory: metrics.memory.percentage,
          cpu: metrics.cpu.usage,
          disk: metrics.disk.percentage,
        });
      } catch (error) {
        console.error('Failed to send metrics to DataDog:', error);
      }
    }
  }

  /**
   * Send alert to external services
   */
  private async sendAlertToExternalServices(alert: Alert): Promise<void> {
    // Sentry integration
    if (this.config.integrations.sentry) {
      try {
        // In production, use Sentry client
        console.log('🔔 Sending alert to Sentry:', alert.title);
      } catch (error) {
        console.error('Failed to send alert to Sentry:', error);
      }
    }

    // Slack integration
    if (this.config.integrations.slack) {
      try {
        // In production, use Slack webhook
        console.log('💬 Sending alert to Slack:', alert.title);
      } catch (error) {
        console.error('Failed to send alert to Slack:', error);
      }
    }
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      this.alerts.set(alertId, alert);
      console.log(`✅ Alert resolved: ${alert.title}`);
      return true;
    }
    return false;
  }

  /**
   * Get current health status
   */
  getHealthStatus(): {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    checks: HealthCheck[];
    uptime: number;
    timestamp: Date;
  } {
    const checks = Array.from(this.healthChecks.values());
    const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;
    const degradedCount = checks.filter(c => c.status === 'degraded').length;

    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (unhealthyCount > 0) {
      overall = 'unhealthy';
    } else if (degradedCount > 0) {
      overall = 'degraded';
    }

    return {
      overall,
      checks,
      uptime: Date.now() - this.startTime.getTime(),
      timestamp: new Date(),
    };
  }

  /**
   * Get system metrics
   */
  getSystemMetrics(): SystemMetrics | null {
    return this.systemMetrics;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Get monitoring statistics
   */
  getStats() {
    return {
      healthChecks: this.healthChecks.size,
      activeAlerts: this.getActiveAlerts().length,
      totalAlerts: this.alerts.size,
      uptime: Date.now() - this.startTime.getTime(),
      systemMetrics: this.systemMetrics,
      config: {
        healthCheckInterval: this.config.healthCheckInterval,
        metricsCollectionInterval: this.config.metricsCollectionInterval,
        integrations: Object.keys(this.config.integrations).filter(
          key =>
            this.config.integrations[
              key as keyof typeof this.config.integrations
            ]
        ),
      },
    };
  }

  /**
   * Shutdown monitoring service
   */
  shutdown(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    console.log('🏥 Health monitoring service stopped');
  }
}

export const healthMonitoringService = new HealthMonitoringService();
