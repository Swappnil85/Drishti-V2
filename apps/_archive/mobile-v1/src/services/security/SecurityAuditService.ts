import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
// Note: Using platform-specific network detection
// import * as Network from 'expo-network';
import { Platform } from 'react-native';

/**
 * Security Audit Service
 * Comprehensive logging and monitoring for sensitive data access
 */

export enum AuditEventType {
  DATA_ACCESS = 'data_access',
  ENCRYPTION = 'encryption',
  DECRYPTION = 'decryption',
  KEY_ROTATION = 'key_rotation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  SECURITY_VIOLATION = 'security_violation',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  DATA_EXPORT = 'data_export',
  CONFIGURATION_CHANGE = 'configuration_change',
}

export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  severity: AuditSeverity;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  deviceInfo: DeviceInfo;
  networkInfo: NetworkInfo;
  details: AuditEventDetails;
  metadata?: Record<string, any>;
}

export interface DeviceInfo {
  deviceId: string;
  platform: string;
  osVersion: string;
  appVersion: string;
  deviceName?: string;
  isEmulator: boolean;
  isRooted?: boolean;
}

export interface NetworkInfo {
  isConnected: boolean;
  connectionType?: string;
  ipAddress?: string;
  isVpn?: boolean;
}

export interface AuditEventDetails {
  action: string;
  resource: string;
  resourceId?: string;
  tableName?: string;
  fieldName?: string;
  success: boolean;
  errorMessage?: string;
  duration?: number;
  dataSize?: number;
  keyId?: string;
}

export interface SecurityAlert {
  id: string;
  type:
    | 'MULTIPLE_FAILED_ATTEMPTS'
    | 'SUSPICIOUS_LOCATION'
    | 'UNUSUAL_ACTIVITY'
    | 'DATA_BREACH_ATTEMPT'
    | 'KEY_COMPROMISE';
  severity: AuditSeverity;
  timestamp: number;
  description: string;
  events: string[]; // Event IDs that triggered this alert
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
}

export interface AuditConfiguration {
  enabled: boolean;
  logLevel: AuditSeverity;
  retentionDays: number;
  maxLogSize: number;
  alertThresholds: {
    failedAttemptsPerHour: number;
    suspiciousActivityScore: number;
    dataAccessFrequency: number;
  };
  sensitiveOperations: string[];
  excludedOperations: string[];
}

class SecurityAuditService {
  private static instance: SecurityAuditService;
  private auditEvents: AuditEvent[] = [];
  private securityAlerts: SecurityAlert[] = [];
  private configuration: AuditConfiguration = {
    enabled: true,
    logLevel: AuditSeverity.LOW,
    retentionDays: 90,
    maxLogSize: 10000, // Maximum number of events to keep in memory
    alertThresholds: {
      failedAttemptsPerHour: 5,
      suspiciousActivityScore: 75,
      dataAccessFrequency: 100,
    },
    sensitiveOperations: [
      'decrypt_account_number',
      'decrypt_ssn',
      'decrypt_tax_id',
      'export_financial_data',
      'key_rotation',
      'backup_creation',
    ],
    excludedOperations: ['ui_navigation', 'app_background', 'app_foreground'],
  };
  private deviceInfo: DeviceInfo | null = null;
  private sessionId: string = '';

  private constructor() {
    this.initializeAuditService();
  }

  public static getInstance(): SecurityAuditService {
    if (!SecurityAuditService.instance) {
      SecurityAuditService.instance = new SecurityAuditService();
    }
    return SecurityAuditService.instance;
  }

  /**
   * Initialize the audit service
   */
  private async initializeAuditService(): Promise<void> {
    try {
      await this.loadConfiguration();
      await this.loadAuditEvents();
      await this.loadSecurityAlerts();
      await this.collectDeviceInfo();
      this.generateSessionId();

      console.log('🔍 Security Audit Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Security Audit Service:', error);
    }
  }

  /**
   * Log an audit event
   */
  public async logEvent(
    type: AuditEventType,
    severity: AuditSeverity,
    details: AuditEventDetails,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      if (!this.configuration.enabled) {
        return '';
      }

      // Check if this operation should be excluded
      if (this.configuration.excludedOperations.includes(details.action)) {
        return '';
      }

      // Check log level
      if (!this.shouldLogEvent(severity)) {
        return '';
      }

      const eventId = this.generateEventId();
      const networkInfo = await this.collectNetworkInfo();

      const auditEvent: AuditEvent = {
        id: eventId,
        type,
        severity,
        timestamp: Date.now(),
        userId,
        sessionId: this.sessionId,
        deviceInfo: this.deviceInfo!,
        networkInfo,
        details,
        metadata,
      };

      // Add to events array
      this.auditEvents.push(auditEvent);

      // Maintain size limit
      if (this.auditEvents.length > this.configuration.maxLogSize) {
        this.auditEvents = this.auditEvents.slice(
          -this.configuration.maxLogSize
        );
      }

      // Save to secure storage
      await this.saveAuditEvents();

      // Check for security alerts
      await this.checkForSecurityAlerts(auditEvent);

      // Log sensitive operations with extra detail
      if (this.configuration.sensitiveOperations.includes(details.action)) {
        console.log(
          `🚨 SENSITIVE OPERATION: ${details.action} by user ${userId} at ${new Date(auditEvent.timestamp).toISOString()}`
        );
      }

      return eventId;
    } catch (error) {
      console.error('❌ Failed to log audit event:', error);
      return '';
    }
  }

  /**
   * Log data access event
   */
  public async logDataAccess(
    action: string,
    tableName: string,
    resourceId: string,
    fieldName?: string,
    success: boolean = true,
    errorMessage?: string,
    userId?: string
  ): Promise<string> {
    const details: AuditEventDetails = {
      action,
      resource: tableName,
      resourceId,
      tableName,
      fieldName,
      success,
      errorMessage,
    };

    const severity = success ? AuditSeverity.LOW : AuditSeverity.MEDIUM;
    return await this.logEvent(
      AuditEventType.DATA_ACCESS,
      severity,
      details,
      userId
    );
  }

  /**
   * Log encryption/decryption event
   */
  public async logCryptoOperation(
    operation: 'encrypt' | 'decrypt',
    keyId: string,
    dataSize: number,
    duration: number,
    success: boolean = true,
    errorMessage?: string,
    userId?: string
  ): Promise<string> {
    const details: AuditEventDetails = {
      action: operation,
      resource: 'encryption_key',
      resourceId: keyId,
      keyId,
      success,
      errorMessage,
      duration,
      dataSize,
    };

    const eventType =
      operation === 'encrypt'
        ? AuditEventType.ENCRYPTION
        : AuditEventType.DECRYPTION;
    const severity = success ? AuditSeverity.LOW : AuditSeverity.HIGH;

    return await this.logEvent(eventType, severity, details, userId);
  }

  /**
   * Log security violation
   */
  public async logSecurityViolation(
    violation: string,
    details: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    const auditDetails: AuditEventDetails = {
      action: 'security_violation',
      resource: 'security_system',
      success: false,
      errorMessage: details,
    };

    return await this.logEvent(
      AuditEventType.SECURITY_VIOLATION,
      AuditSeverity.CRITICAL,
      auditDetails,
      userId,
      { violation, ...metadata }
    );
  }

  /**
   * Get audit events with filtering
   */
  public getAuditEvents(filters?: {
    type?: AuditEventType;
    severity?: AuditSeverity;
    userId?: string;
    startDate?: number;
    endDate?: number;
    limit?: number;
  }): AuditEvent[] {
    let filteredEvents = [...this.auditEvents];

    if (filters) {
      if (filters.type) {
        filteredEvents = filteredEvents.filter(
          event => event.type === filters.type
        );
      }
      if (filters.severity) {
        filteredEvents = filteredEvents.filter(
          event => event.severity === filters.severity
        );
      }
      if (filters.userId) {
        filteredEvents = filteredEvents.filter(
          event => event.userId === filters.userId
        );
      }
      if (filters.startDate) {
        filteredEvents = filteredEvents.filter(
          event => event.timestamp >= filters.startDate!
        );
      }
      if (filters.endDate) {
        filteredEvents = filteredEvents.filter(
          event => event.timestamp <= filters.endDate!
        );
      }
    }

    // Sort by timestamp (newest first)
    filteredEvents.sort((a, b) => b.timestamp - a.timestamp);

    // Apply limit
    if (filters?.limit) {
      filteredEvents = filteredEvents.slice(0, filters.limit);
    }

    return filteredEvents;
  }

  /**
   * Get security alerts
   */
  public getSecurityAlerts(acknowledged?: boolean): SecurityAlert[] {
    let alerts = [...this.securityAlerts];

    if (acknowledged !== undefined) {
      alerts = alerts.filter(alert => alert.acknowledged === acknowledged);
    }

    return alerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Acknowledge security alert
   */
  public async acknowledgeAlert(
    alertId: string,
    acknowledgedBy: string
  ): Promise<boolean> {
    try {
      const alert = this.securityAlerts.find(a => a.id === alertId);
      if (!alert) {
        return false;
      }

      alert.acknowledged = true;
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = Date.now();

      await this.saveSecurityAlerts();

      console.log(
        `✅ Security alert acknowledged: ${alertId} by ${acknowledgedBy}`
      );
      return true;
    } catch (error) {
      console.error('❌ Failed to acknowledge alert:', error);
      return false;
    }
  }

  /**
   * Generate security report
   */
  public generateSecurityReport(days: number = 7): {
    summary: {
      totalEvents: number;
      criticalEvents: number;
      failedOperations: number;
      uniqueUsers: number;
      alertsGenerated: number;
    };
    topEvents: { type: AuditEventType; count: number }[];
    userActivity: { userId: string; eventCount: number }[];
    timelineData: { date: string; events: number }[];
  } {
    const cutoffDate = Date.now() - days * 24 * 60 * 60 * 1000;
    const recentEvents = this.auditEvents.filter(
      event => event.timestamp >= cutoffDate
    );

    // Summary statistics
    const summary = {
      totalEvents: recentEvents.length,
      criticalEvents: recentEvents.filter(
        e => e.severity === AuditSeverity.CRITICAL
      ).length,
      failedOperations: recentEvents.filter(e => !e.details.success).length,
      uniqueUsers: new Set(recentEvents.map(e => e.userId).filter(Boolean))
        .size,
      alertsGenerated: this.securityAlerts.filter(
        a => a.timestamp >= cutoffDate
      ).length,
    };

    // Top event types
    const eventTypeCounts = new Map<AuditEventType, number>();
    recentEvents.forEach(event => {
      eventTypeCounts.set(
        event.type,
        (eventTypeCounts.get(event.type) || 0) + 1
      );
    });
    const topEvents = Array.from(eventTypeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // User activity
    const userActivityMap = new Map<string, number>();
    recentEvents.forEach(event => {
      if (event.userId) {
        userActivityMap.set(
          event.userId,
          (userActivityMap.get(event.userId) || 0) + 1
        );
      }
    });
    const userActivity = Array.from(userActivityMap.entries())
      .map(([userId, eventCount]) => ({ userId, eventCount }))
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 10);

    // Timeline data (daily event counts)
    const timelineMap = new Map<string, number>();
    recentEvents.forEach(event => {
      const date = new Date(event.timestamp).toISOString().split('T')[0];
      timelineMap.set(date, (timelineMap.get(date) || 0) + 1);
    });
    const timelineData = Array.from(timelineMap.entries())
      .map(([date, events]) => ({ date, events }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      summary,
      topEvents,
      userActivity,
      timelineData,
    };
  }

  /**
   * Update audit configuration
   */
  public async updateConfiguration(
    config: Partial<AuditConfiguration>
  ): Promise<void> {
    try {
      this.configuration = { ...this.configuration, ...config };
      await this.saveConfiguration();
      console.log('⚙️ Audit configuration updated');
    } catch (error) {
      console.error('❌ Failed to update audit configuration:', error);
      throw error;
    }
  }

  /**
   * Get current configuration
   */
  public getConfiguration(): AuditConfiguration {
    return { ...this.configuration };
  }

  /**
   * Clear old audit events based on retention policy
   */
  public async cleanupOldEvents(): Promise<number> {
    try {
      const cutoffDate =
        Date.now() - this.configuration.retentionDays * 24 * 60 * 60 * 1000;
      const initialCount = this.auditEvents.length;

      this.auditEvents = this.auditEvents.filter(
        event => event.timestamp >= cutoffDate
      );

      const removedCount = initialCount - this.auditEvents.length;

      if (removedCount > 0) {
        await this.saveAuditEvents();
        console.log(`🧹 Cleaned up ${removedCount} old audit events`);
      }

      return removedCount;
    } catch (error) {
      console.error('❌ Failed to cleanup old events:', error);
      return 0;
    }
  }

  /**
   * Export audit data for compliance
   */
  public async exportAuditData(
    startDate: number,
    endDate: number,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    try {
      const events = this.getAuditEvents({ startDate, endDate });

      // Log the export operation
      await this.logEvent(AuditEventType.DATA_EXPORT, AuditSeverity.HIGH, {
        action: 'export_audit_data',
        resource: 'audit_events',
        success: true,
        dataSize: events.length,
      });

      if (format === 'json') {
        return JSON.stringify(events, null, 2);
      } else {
        // Convert to CSV format
        const headers = [
          'ID',
          'Type',
          'Severity',
          'Timestamp',
          'User ID',
          'Action',
          'Resource',
          'Success',
          'Error Message',
          'Device Platform',
        ];

        const csvRows = [
          headers.join(','),
          ...events.map(event =>
            [
              event.id,
              event.type,
              event.severity,
              new Date(event.timestamp).toISOString(),
              event.userId || '',
              event.details.action,
              event.details.resource,
              event.details.success,
              event.details.errorMessage || '',
              event.deviceInfo.platform,
            ]
              .map(field => `"${String(field).replace(/"/g, '""')}"`)
              .join(',')
          ),
        ];

        return csvRows.join('\n');
      }
    } catch (error) {
      console.error('❌ Failed to export audit data:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private shouldLogEvent(severity: AuditSeverity): boolean {
    const severityLevels = {
      [AuditSeverity.LOW]: 0,
      [AuditSeverity.MEDIUM]: 1,
      [AuditSeverity.HIGH]: 2,
      [AuditSeverity.CRITICAL]: 3,
    };

    return (
      severityLevels[severity] >= severityLevels[this.configuration.logLevel]
    );
  }

  private async checkForSecurityAlerts(event: AuditEvent): Promise<void> {
    try {
      // Check for multiple failed attempts
      if (!event.details.success) {
        await this.checkFailedAttempts(event);
      }

      // Check for suspicious activity patterns
      await this.checkSuspiciousActivity(event);

      // Check for unusual data access patterns
      if (event.type === AuditEventType.DATA_ACCESS) {
        await this.checkDataAccessPatterns(event);
      }
    } catch (error) {
      console.error('❌ Failed to check for security alerts:', error);
    }
  }

  private async checkFailedAttempts(event: AuditEvent): Promise<void> {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentFailures = this.auditEvents.filter(
      e =>
        e.timestamp >= oneHourAgo &&
        e.userId === event.userId &&
        !e.details.success
    );

    if (
      recentFailures.length >=
      this.configuration.alertThresholds.failedAttemptsPerHour
    ) {
      await this.createSecurityAlert(
        'MULTIPLE_FAILED_ATTEMPTS',
        AuditSeverity.HIGH,
        `User ${event.userId} has ${recentFailures.length} failed attempts in the last hour`,
        recentFailures.map(e => e.id)
      );
    }
  }

  private async checkSuspiciousActivity(event: AuditEvent): Promise<void> {
    // Implement suspicious activity detection logic
    // This is a simplified version - in production, you'd use more sophisticated algorithms
    let suspiciousScore = 0;

    // Check for unusual times
    const hour = new Date(event.timestamp).getHours();
    if (hour < 6 || hour > 22) {
      suspiciousScore += 20;
    }

    // Check for rapid successive operations
    const recentEvents = this.auditEvents.filter(
      e =>
        e.timestamp >= event.timestamp - 60000 && // Last minute
        e.userId === event.userId
    );
    if (recentEvents.length > 10) {
      suspiciousScore += 30;
    }

    // Check for sensitive operations
    if (this.configuration.sensitiveOperations.includes(event.details.action)) {
      suspiciousScore += 25;
    }

    if (
      suspiciousScore >=
      this.configuration.alertThresholds.suspiciousActivityScore
    ) {
      await this.createSecurityAlert(
        'UNUSUAL_ACTIVITY',
        AuditSeverity.MEDIUM,
        `Suspicious activity detected for user ${event.userId} (score: ${suspiciousScore})`,
        [event.id]
      );
    }
  }

  private async checkDataAccessPatterns(event: AuditEvent): Promise<void> {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentDataAccess = this.auditEvents.filter(
      e =>
        e.timestamp >= oneHourAgo &&
        e.type === AuditEventType.DATA_ACCESS &&
        e.userId === event.userId
    );

    if (
      recentDataAccess.length >=
      this.configuration.alertThresholds.dataAccessFrequency
    ) {
      await this.createSecurityAlert(
        'UNUSUAL_ACTIVITY',
        AuditSeverity.MEDIUM,
        `High frequency data access detected for user ${event.userId} (${recentDataAccess.length} accesses in 1 hour)`,
        recentDataAccess.map(e => e.id)
      );
    }
  }

  private async createSecurityAlert(
    type: SecurityAlert['type'],
    severity: AuditSeverity,
    description: string,
    eventIds: string[]
  ): Promise<void> {
    const alert: SecurityAlert = {
      id: this.generateAlertId(),
      type,
      severity,
      timestamp: Date.now(),
      description,
      events: eventIds,
      acknowledged: false,
    };

    this.securityAlerts.push(alert);
    await this.saveSecurityAlerts();

    console.warn(`🚨 SECURITY ALERT: ${type} - ${description}`);
  }

  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): void {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async collectDeviceInfo(): Promise<void> {
    try {
      this.deviceInfo = {
        deviceId: await this.getDeviceId(),
        platform: Platform.OS,
        osVersion: Platform.Version.toString(),
        appVersion: '1.0.0', // This would come from app config
        deviceName: Device.deviceName || 'Unknown',
        isEmulator: !Device.isDevice,
        isRooted: false, // This would require additional detection
      };
    } catch (error) {
      console.error('Failed to collect device info:', error);
      this.deviceInfo = {
        deviceId: 'unknown',
        platform: Platform.OS,
        osVersion: 'unknown',
        appVersion: '1.0.0',
        isEmulator: false,
      };
    }
  }

  private async collectNetworkInfo(): Promise<NetworkInfo> {
    try {
      // Note: Using basic network detection for now
      // const networkState = await Network.getNetworkStateAsync();
      return {
        isConnected: true, // Assume connected for now
        connectionType: 'unknown',
      };
    } catch (error) {
      return {
        isConnected: false,
        connectionType: 'unknown',
      };
    }
  }

  private async getDeviceId(): Promise<string> {
    try {
      let deviceId = await SecureStore.getItemAsync('audit_device_id');
      if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await SecureStore.setItemAsync('audit_device_id', deviceId);
      }
      return deviceId;
    } catch (error) {
      return `fallback_${Date.now()}`;
    }
  }

  private async loadConfiguration(): Promise<void> {
    try {
      const configData = await SecureStore.getItemAsync('audit_configuration');
      if (configData) {
        this.configuration = {
          ...this.configuration,
          ...JSON.parse(configData),
        };
      }
    } catch (error) {
      console.error('Failed to load audit configuration:', error);
    }
  }

  private async saveConfiguration(): Promise<void> {
    try {
      await SecureStore.setItemAsync(
        'audit_configuration',
        JSON.stringify(this.configuration)
      );
    } catch (error) {
      console.error('Failed to save audit configuration:', error);
    }
  }

  private async loadAuditEvents(): Promise<void> {
    try {
      const eventsData = await SecureStore.getItemAsync('audit_events');
      if (eventsData) {
        this.auditEvents = JSON.parse(eventsData);
      }
    } catch (error) {
      console.error('Failed to load audit events:', error);
    }
  }

  private async saveAuditEvents(): Promise<void> {
    try {
      await SecureStore.setItemAsync(
        'audit_events',
        JSON.stringify(this.auditEvents)
      );
    } catch (error) {
      console.error('Failed to save audit events:', error);
    }
  }

  private async loadSecurityAlerts(): Promise<void> {
    try {
      const alertsData = await SecureStore.getItemAsync('security_alerts');
      if (alertsData) {
        this.securityAlerts = JSON.parse(alertsData);
      }
    } catch (error) {
      console.error('Failed to load security alerts:', error);
    }
  }

  private async saveSecurityAlerts(): Promise<void> {
    try {
      await SecureStore.setItemAsync(
        'security_alerts',
        JSON.stringify(this.securityAlerts)
      );
    } catch (error) {
      console.error('Failed to save security alerts:', error);
    }
  }
}

export const securityAuditService = SecurityAuditService.getInstance();
