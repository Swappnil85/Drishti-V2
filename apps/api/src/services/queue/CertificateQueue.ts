import Queue from 'bull';
import { certificateMonitor } from '../monitoring/CertificateMonitor';
import {
  securityMonitor,
  SecurityEventType,
  SecuritySeverity,
} from '../monitoring/SecurityMonitor';

interface CertJobData {
  host: string;
  thresholdDays: number;
  ctMonitor: boolean;
}

export class CertificateQueue {
  private queue: Queue.Queue<CertJobData>;
  private lastCtCount: number | null = null;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.queue = new Queue<CertJobData>('certificate monitoring', redisUrl);
    this.setupProcessors();
  }

  private setupProcessors() {
    this.queue.process('daily-certificate-check', async job => {
      const { host, thresholdDays, ctMonitor } = job.data;

      // Check certificate freshness
      try {
        const info = await certificateMonitor.fetchServerCertificate(host, 443);
        const expiresAt = info.valid_to ? new Date(info.valid_to).getTime() : 0;
        const daysRemaining = expiresAt
          ? Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24))
          : null;

        if (daysRemaining !== null && daysRemaining <= thresholdDays) {
          securityMonitor.recordEvent(
            SecurityEventType.SSL_ERROR,
            daysRemaining <= 7
              ? SecuritySeverity.CRITICAL
              : SecuritySeverity.HIGH,
            {
              host,
              daysRemaining,
              valid_to: info.valid_to,
              type: 'certificate_expiring',
            }
          );
        }
      } catch (error) {
        securityMonitor.recordEvent(
          SecurityEventType.SSL_ERROR,
          SecuritySeverity.HIGH,
          {
            host,
            error: (error as Error).message,
            type: 'certificate_check_failed',
          }
        );
      }

      // Optional CT log monitoring (best-effort)
      if (ctMonitor) {
        try {
          const entries = await certificateMonitor.fetchCTEntries(host);
          const count = entries.length;
          if (this.lastCtCount !== null && count > this.lastCtCount) {
            securityMonitor.recordSuspiciousActivity('ct_new_entries', {
              host,
              previous: this.lastCtCount,
              current: count,
            });
          }
          this.lastCtCount = count;
        } catch (error) {
          securityMonitor.recordSuspiciousActivity('ct_check_failed', {
            host,
            error: (error as Error).message,
          });
        }
      }

      return { success: true };
    });
  }

  async scheduleDaily() {
    const host = process.env.CERT_MONITOR_HOST || 'api.drishti.app';
    const thresholdDays = parseInt(
      process.env.CERT_FRESHNESS_THRESHOLD_DAYS || '30',
      10
    );
    const ctMonitor =
      (process.env.CT_MONITOR_ENABLED || 'true').toLowerCase() !== 'false';

    await this.queue.add(
      'daily-certificate-check',
      { host, thresholdDays, ctMonitor },
      { repeat: { cron: '0 3 * * *' }, removeOnComplete: 10, removeOnFail: 5 }
    );
    console.log(
      `📅 Daily certificate check scheduled for ${host} (threshold=${thresholdDays}d)`
    );
  }

  async shutdown() {
    await this.queue.close();
  }
}

export const certificateQueue = new CertificateQueue();
