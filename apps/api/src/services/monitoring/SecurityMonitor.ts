import { EventEmitter } from 'events';
import { config } from '../../config/environment';

/**
 * Security Monitoring Service
 * Monitors security events and triggers alerts
 */

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  timestamp: Date;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, any>;
  resolved: boolean;
}

export enum SecurityEventType {
  FAILED_LOGIN = 'failed_login',
  ACCOUNT_LOCKED = 'account_locked',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  BRUTE_FORCE_ATTACK = 'brute_force_attack',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  INVALID_TOKEN = 'invalid_token',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  SYSTEM_ERROR = 'system_error',
  DATABASE_ERROR = 'database_error',
  SSL_ERROR = 'ssl_error',
  CONFIGURATION_CHANGE = 'configuration_change',
}

export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface AlertChannel {
  name: string;
  enabled: boolean;
  config: Record<string, any>;
}

export class SecurityMonitor extends EventEmitter {
  private static instance: SecurityMonitor;
  private events: SecurityEvent[] = [];
  private alertChannels: Map<string, AlertChannel> = new Map();
  private rateLimitTracking: Map<string, number[]> = new Map();
  private suspiciousIPs: Set<string> = new Set();

  private constructor() {
    super();
    this.setupDefaultAlertChannels();
    this.startPeriodicCleanup();
  }

  public static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  /**
   * Record a security event
   */
  public recordEvent(
    type: SecurityEventType,
    severity: SecuritySeverity,
    details: Record<string, any>,
    context?: {
      userId?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): SecurityEvent {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      type,
      severity,
      timestamp: new Date(),
      userId: context?.userId,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      details,
      resolved: false,
    };

    this.events.push(event);
    this.emit('securityEvent', event);

    // Trigger alerts based on severity
    this.processEventForAlerts(event);

    // Update tracking for pattern detection
    this.updateSecurityTracking(event);

    console.log(`🚨 Security Event [${severity.toUpperCase()}]: ${type}`, {
      id: event.id,
      userId: event.userId,
      ipAddress: event.ipAddress,
      details: event.details,
    });

    return event;
  }

  /**
   * Record failed login attempt
   */
  public recordFailedLogin(
    email: string,
    ipAddress: string,
    userAgent: string,
    reason: string
  ): void {
    const details = {
      email,
      reason,
      timestamp: new Date().toISOString(),
    };

    // Check for brute force patterns
    const recentFailures = this.getRecentFailedLogins(ipAddress);
    if (recentFailures >= 5) {
      this.recordEvent(
        SecurityEventType.BRUTE_FORCE_ATTACK,
        SecuritySeverity.HIGH,
        { ...details, recentFailures },
        { ipAddress, userAgent }
      );
      this.suspiciousIPs.add(ipAddress);
    } else {
      this.recordEvent(
        SecurityEventType.FAILED_LOGIN,
        SecuritySeverity.MEDIUM,
        details,
        { ipAddress, userAgent }
      );
    }
  }

  /**
   * Record account lockout
   */
  public recordAccountLocked(
    userId: string,
    email: string,
    ipAddress: string,
    reason: string
  ): void {
    this.recordEvent(
      SecurityEventType.ACCOUNT_LOCKED,
      SecuritySeverity.HIGH,
      {
        email,
        reason,
        lockDuration: config.ACCOUNT_LOCK_DURATION,
      },
      { userId, ipAddress }
    );
  }

  /**
   * Record rate limit exceeded
   */
  public recordRateLimitExceeded(
    ipAddress: string,
    endpoint: string,
    requestCount: number
  ): void {
    this.recordEvent(
      SecurityEventType.RATE_LIMIT_EXCEEDED,
      SecuritySeverity.MEDIUM,
      {
        endpoint,
        requestCount,
        limit: config.RATE_LIMIT_MAX_REQUESTS,
      },
      { ipAddress }
    );
  }

  /**
   * Record suspicious activity
   */
  public recordSuspiciousActivity(
    type: string,
    details: Record<string, any>,
    context?: {
      userId?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): void {
    this.recordEvent(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      SecuritySeverity.HIGH,
      { activityType: type, ...details },
      context
    );
  }

  /**
   * Get recent security events
   */
  public getRecentEvents(
    hours: number = 24,
    severity?: SecuritySeverity
  ): SecurityEvent[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    return this.events.filter(event => {
      const matchesTime = event.timestamp >= cutoff;
      const matchesSeverity = !severity || event.severity === severity;
      return matchesTime && matchesSeverity;
    });
  }

  /**
   * Get security statistics
   */
  public getSecurityStats(hours: number = 24): Record<string, any> {
    const recentEvents = this.getRecentEvents(hours);

    const stats = {
      totalEvents: recentEvents.length,
      eventsBySeverity: {} as Record<string, number>,
      eventsByType: {} as Record<string, number>,
      topSuspiciousIPs: this.getTopSuspiciousIPs(10),
      unresolvedEvents: recentEvents.filter(e => !e.resolved).length,
      averageEventsPerHour: Math.round(recentEvents.length / hours),
    };

    // Count by severity
    Object.values(SecuritySeverity).forEach(severity => {
      stats.eventsBySeverity[severity] = recentEvents.filter(
        e => e.severity === severity
      ).length;
    });

    // Count by type
    Object.values(SecurityEventType).forEach(type => {
      stats.eventsByType[type] = recentEvents.filter(
        e => e.type === type
      ).length;
    });

    return stats;
  }

  /**
   * Check if IP is suspicious
   */
  public isSuspiciousIP(ipAddress: string): boolean {
    return this.suspiciousIPs.has(ipAddress);
  }

  /**
   * Generate security report
   */
  public generateSecurityReport(hours: number = 24): string {
    const stats = this.getSecurityStats(hours);
    const recentEvents = this.getRecentEvents(hours);

    let report = `🔒 Security Report (Last ${hours} hours)\n`;
    report += `==========================================\n\n`;

    report += `📊 Summary:\n`;
    report += `- Total Events: ${stats.totalEvents}\n`;
    report += `- Unresolved Events: ${stats.unresolvedEvents}\n`;
    report += `- Average Events/Hour: ${stats.averageEventsPerHour}\n\n`;

    report += `🚨 Events by Severity:\n`;
    Object.entries(stats.eventsBySeverity).forEach(([severity, count]) => {
      if (count > 0) {
        report += `- ${severity.toUpperCase()}: ${count}\n`;
      }
    });

    report += `\n📋 Events by Type:\n`;
    Object.entries(stats.eventsByType).forEach(([type, count]) => {
      if (count > 0) {
        report += `- ${type.replace(/_/g, ' ').toUpperCase()}: ${count}\n`;
      }
    });

    if (stats.topSuspiciousIPs.length > 0) {
      report += `\n🚩 Top Suspicious IPs:\n`;
      stats.topSuspiciousIPs.forEach((ip, index) => {
        report += `${index + 1}. ${ip}\n`;
      });
    }

    // Recent critical events
    const criticalEvents = recentEvents.filter(
      e => e.severity === SecuritySeverity.CRITICAL
    );

    if (criticalEvents.length > 0) {
      report += `\n🔥 Recent Critical Events:\n`;
      criticalEvents.slice(0, 5).forEach(event => {
        report += `- ${event.timestamp.toISOString()}: ${event.type}\n`;
        report += `  Details: ${JSON.stringify(event.details)}\n`;
      });
    }

    return report;
  }

  /**
   * Setup default alert channels
   */
  private setupDefaultAlertChannels(): void {
    // Console logging (always enabled)
    this.alertChannels.set('console', {
      name: 'Console',
      enabled: true,
      config: {},
    });

    // Email alerts (if configured)
    if (config.SMTP_HOST && config.FROM_EMAIL) {
      this.alertChannels.set('email', {
        name: 'Email',
        enabled: true,
        config: {
          recipients: [config.FROM_EMAIL],
          smtpHost: config.SMTP_HOST,
          smtpPort: config.SMTP_PORT,
          smtpUser: config.SMTP_USER,
          smtpPassword: config.SMTP_PASSWORD,
        },
      });
    }

    // Sentry integration (if configured)
    if (config.SENTRY_DSN) {
      this.alertChannels.set('sentry', {
        name: 'Sentry',
        enabled: true,
        config: {
          dsn: config.SENTRY_DSN,
        },
      });
    }
  }

  /**
   * Process event for alerts
   */
  private processEventForAlerts(event: SecurityEvent): void {
    // Determine if alert should be sent based on severity and type
    const shouldAlert = this.shouldTriggerAlert(event);

    if (shouldAlert) {
      this.sendAlert(event);
    }
  }

  /**
   * Determine if alert should be triggered
   */
  private shouldTriggerAlert(event: SecurityEvent): boolean {
    // Always alert on critical events
    if (event.severity === SecuritySeverity.CRITICAL) {
      return true;
    }

    // Alert on high severity events
    if (event.severity === SecuritySeverity.HIGH) {
      return true;
    }

    // Alert on specific medium severity events
    if (event.severity === SecuritySeverity.MEDIUM) {
      const alertableTypes = [
        SecurityEventType.BRUTE_FORCE_ATTACK,
        SecurityEventType.ACCOUNT_LOCKED,
        SecurityEventType.SUSPICIOUS_ACTIVITY,
      ];
      return alertableTypes.includes(event.type);
    }

    return false;
  }

  /**
   * Send alert through configured channels
   */
  private async sendAlert(event: SecurityEvent): Promise<void> {
    const alertMessage = this.formatAlertMessage(event);

    for (const [channelId, channel] of this.alertChannels) {
      if (!channel.enabled) continue;

      try {
        await this.sendAlertToChannel(channelId, channel, alertMessage, event);
      } catch (error) {
        console.error(`Failed to send alert to ${channel.name}:`, error);
      }
    }
  }

  /**
   * Send alert to specific channel
   */
  private async sendAlertToChannel(
    channelId: string,
    channel: AlertChannel,
    message: string,
    event: SecurityEvent
  ): Promise<void> {
    switch (channelId) {
      case 'console':
        console.error(`🚨 SECURITY ALERT: ${message}`);
        break;

      case 'email':
        // Email implementation would go here
        console.log(`📧 Email alert would be sent: ${message}`);
        break;

      case 'sentry':
        // Sentry implementation would go here
        console.log(`📊 Sentry alert would be sent: ${message}`);
        break;

      default:
        console.warn(`Unknown alert channel: ${channelId}`);
    }
  }

  /**
   * Format alert message
   */
  private formatAlertMessage(event: SecurityEvent): string {
    return `[${event.severity.toUpperCase()}] ${event.type.replace(/_/g, ' ').toUpperCase()} - ${JSON.stringify(event.details)}`;
  }

  /**
   * Update security tracking for pattern detection
   */
  private updateSecurityTracking(event: SecurityEvent): void {
    if (event.ipAddress) {
      // Track failed logins by IP
      if (event.type === SecurityEventType.FAILED_LOGIN) {
        const key = `failed_login_${event.ipAddress}`;
        const timestamps = this.rateLimitTracking.get(key) || [];
        timestamps.push(Date.now());

        // Keep only last hour
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        const recentTimestamps = timestamps.filter(ts => ts > oneHourAgo);
        this.rateLimitTracking.set(key, recentTimestamps);
      }
    }
  }

  /**
   * Get recent failed logins for IP
   */
  private getRecentFailedLogins(ipAddress: string): number {
    const key = `failed_login_${ipAddress}`;
    const timestamps = this.rateLimitTracking.get(key) || [];
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    return timestamps.filter(ts => ts > oneHourAgo).length;
  }

  /**
   * Get top suspicious IPs
   */
  private getTopSuspiciousIPs(limit: number): string[] {
    return Array.from(this.suspiciousIPs).slice(0, limit);
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start periodic cleanup of old events
   */
  private startPeriodicCleanup(): void {
    setInterval(
      () => {
        this.cleanupOldEvents();
      },
      60 * 60 * 1000
    ); // Run every hour
  }

  /**
   * Clean up old events to prevent memory leaks
   */
  private cleanupOldEvents(): void {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Remove events older than 7 days
    this.events = this.events.filter(event => event.timestamp >= sevenDaysAgo);

    // Clean up rate limit tracking
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [key, timestamps] of this.rateLimitTracking) {
      const recentTimestamps = timestamps.filter(ts => ts > oneHourAgo);
      if (recentTimestamps.length === 0) {
        this.rateLimitTracking.delete(key);
      } else {
        this.rateLimitTracking.set(key, recentTimestamps);
      }
    }

    console.log(
      `🧹 Cleaned up old security events. Current count: ${this.events.length}`
    );
  }
}

// Export singleton instance
export const securityMonitor = SecurityMonitor.getInstance();

/**
 * Security monitoring middleware
 */
export function securityMonitoringMiddleware(req: any, res: any, next: any) {
  const startTime = Date.now();

  // Track request details
  const requestDetails = {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ipAddress: req.ip || req.connection.remoteAddress,
    timestamp: new Date().toISOString(),
  };

  // Check for suspicious patterns in request
  if (detectSuspiciousRequest(req)) {
    securityMonitor.recordSuspiciousActivity(
      'suspicious_request',
      {
        ...requestDetails,
        suspiciousIndicators: getSuspiciousIndicators(req),
      },
      {
        ipAddress: requestDetails.ipAddress,
        userAgent: requestDetails.userAgent,
      }
    );
  }

  // Monitor response
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;

    // Log slow requests
    if (responseTime > 5000) {
      securityMonitor.recordEvent(
        SecurityEventType.SYSTEM_ERROR,
        SecuritySeverity.MEDIUM,
        {
          ...requestDetails,
          responseTime,
          statusCode: res.statusCode,
          type: 'slow_request',
        }
      );
    }

    // Log error responses
    if (res.statusCode >= 500) {
      securityMonitor.recordEvent(
        SecurityEventType.SYSTEM_ERROR,
        SecuritySeverity.HIGH,
        {
          ...requestDetails,
          responseTime,
          statusCode: res.statusCode,
          type: 'server_error',
        }
      );
    }
  });

  next();
}

/**
 * Detect suspicious request patterns
 */
function detectSuspiciousRequest(req: any): boolean {
  const suspiciousPatterns = [
    // SQL injection patterns
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
    // XSS patterns
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    // Path traversal
    /\.\.\//g,
    /\.\.\\/g,
    // Command injection
    /[;&|`$()]/g,
  ];

  const testStrings = [
    req.url,
    JSON.stringify(req.query),
    JSON.stringify(req.body),
    req.get('User-Agent') || '',
    req.get('Referer') || '',
  ];

  return testStrings.some(str =>
    suspiciousPatterns.some(pattern => pattern.test(str))
  );
}

/**
 * Get suspicious indicators from request
 */
function getSuspiciousIndicators(req: any): string[] {
  const indicators: string[] = [];

  if (req.url.includes('..')) indicators.push('path_traversal');
  if (req.url.includes('<script')) indicators.push('xss_attempt');
  if (req.url.match(/\b(union|select|insert|update|delete)\b/i))
    indicators.push('sql_injection');
  if (req.get('User-Agent')?.includes('bot')) indicators.push('bot_user_agent');
  if (!req.get('User-Agent')) indicators.push('missing_user_agent');

  return indicators;
}
