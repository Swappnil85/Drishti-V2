import Queue from 'bull';
import { privacyService } from '../privacy/PrivacyService';
import { query } from '../../db/connection';

interface RetentionJobData {
  userId: string;
  scheduledDeletionDate: string;
  retentionPolicy: string;
}

export class RetentionScheduler {
  private queue: Queue.Queue<RetentionJobData>;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.queue = new Queue<RetentionJobData>('retention scheduler', redisUrl);
    this.setupProcessors();
  }

  private setupProcessors() {
    // Process scheduled deletions
    this.queue.process('scheduled-deletion', async job => {
      const { userId, scheduledDeletionDate, retentionPolicy } = job.data;

      console.log(`Processing scheduled deletion for user ${userId}`);

      try {
        // Execute the deletion
        const result = await privacyService.deleteUserData(userId, {});

        // Log the completion
        await query(
          `INSERT INTO deletion_log (user_id, deletion_type, scheduled_date, completed_date, receipt_hash, retention_policy)
           VALUES ($1, 'scheduled', $2, NOW(), $3, $4)`,
          [userId, scheduledDeletionDate, result.receiptHash, retentionPolicy]
        );

        console.log(
          `Completed scheduled deletion for user ${userId}, receipt: ${result.receiptHash}`
        );
        return { success: true, receiptHash: result.receiptHash };
      } catch (error) {
        console.error(`Failed scheduled deletion for user ${userId}:`, error);

        // Log the failure
        await query(
          `INSERT INTO deletion_log (user_id, deletion_type, scheduled_date, error, retention_policy)
           VALUES ($1, 'scheduled_failed', $2, $3, $4)`,
          [
            userId,
            scheduledDeletionDate,
            (error as Error).message,
            retentionPolicy,
          ]
        );

        throw error;
      }
    });

    // Process retention policy enforcement
    this.queue.process('retention-enforcement', async job => {
      console.log('Running retention policy enforcement');

      try {
        // Find users with expired retention periods
        const expiredUsers = await query(`
          SELECT u.id, u.email, u.preferences->>'pendingDeletionAt' as deletion_date
          FROM users u
          WHERE u.preferences->>'pendingDeletionAt' IS NOT NULL
          AND (u.preferences->>'pendingDeletionAt')::timestamp <= NOW()
          AND u.is_active = true
        `);

        console.log(
          `Found ${expiredUsers.rows.length} users with expired retention periods`
        );

        for (const user of expiredUsers.rows) {
          // Schedule immediate deletion
          await this.queue.add(
            'scheduled-deletion',
            {
              userId: user.id,
              scheduledDeletionDate: user.deletion_date,
              retentionPolicy: 'user_requested',
            },
            {
              attempts: 3,
              backoff: { type: 'exponential' },
              delay: 1000, // 1 second delay
            }
          );
        }

        // Find inactive users based on retention policy
        const retentionDays = parseInt(
          process.env.USER_RETENTION_DAYS || '2555',
          10
        ); // ~7 years default
        const inactiveUsers = await query(`
          SELECT u.id, u.email, u.updated_at
          FROM users u
          WHERE u.updated_at < NOW() - INTERVAL '${retentionDays} days'
          AND u.is_active = true
          AND u.preferences->>'pendingDeletionAt' IS NULL
        `);

        console.log(
          `Found ${inactiveUsers.rows.length} inactive users for retention enforcement`
        );

        for (const user of inactiveUsers.rows) {
          // Schedule deletion with grace period
          const gracePeriodDays = parseInt(
            process.env.RETENTION_GRACE_PERIOD_DAYS || '30',
            10
          );
          const scheduledDate = new Date(
            Date.now() + gracePeriodDays * 24 * 60 * 60 * 1000
          );

          // Update user with pending deletion
          await query(
            `UPDATE users 
             SET preferences = jsonb_set(COALESCE(preferences, '{}'::jsonb), '{pendingDeletionAt}', to_jsonb($2::timestamp))
             WHERE id = $1`,
            [user.id, scheduledDate.toISOString()]
          );

          // Schedule the deletion job
          await this.queue.add(
            'scheduled-deletion',
            {
              userId: user.id,
              scheduledDeletionDate: scheduledDate.toISOString(),
              retentionPolicy: 'automatic_retention',
            },
            {
              delay: gracePeriodDays * 24 * 60 * 60 * 1000, // Delay until scheduled date
              attempts: 3,
              backoff: { type: 'exponential' },
            }
          );

          console.log(
            `Scheduled retention deletion for user ${user.id} on ${scheduledDate.toISOString()}`
          );
        }

        return {
          success: true,
          expiredUsers: expiredUsers.rows.length,
          inactiveUsers: inactiveUsers.rows.length,
        };
      } catch (error) {
        console.error('Retention enforcement failed:', error);
        throw error;
      }
    });
  }

  async scheduleRetentionEnforcement() {
    // Run daily at 3 AM UTC
    await this.queue.add(
      'retention-enforcement',
      {
        userId: 'stub',
        scheduledDeletionDate: new Date().toISOString(),
        retentionPolicy: 'system',
      } as any,
      {
        repeat: { cron: '0 3 * * *' },
        removeOnComplete: 10,
        removeOnFail: 5,
      }
    );
    console.log('📅 Daily retention enforcement scheduled');
  }

  async scheduleUserDeletion(
    userId: string,
    scheduledDate: Date,
    retentionPolicy: string
  ) {
    const delay = scheduledDate.getTime() - Date.now();

    if (delay <= 0) {
      // Schedule immediately if date is in the past
      await this.queue.add(
        'scheduled-deletion',
        {
          userId,
          scheduledDeletionDate: scheduledDate.toISOString(),
          retentionPolicy,
        },
        {
          attempts: 3,
          backoff: { type: 'exponential' },
        }
      );
    } else {
      // Schedule for future execution
      await this.queue.add(
        'scheduled-deletion',
        {
          userId,
          scheduledDeletionDate: scheduledDate.toISOString(),
          retentionPolicy,
        },
        {
          delay,
          attempts: 3,
          backoff: { type: 'exponential' },
        }
      );
    }

    console.log(
      `Scheduled deletion for user ${userId} at ${scheduledDate.toISOString()}`
    );
  }

  async cancelScheduledDeletion(userId: string) {
    // Remove pending deletion from user preferences
    await query(
      `UPDATE users 
       SET preferences = preferences - 'pendingDeletionAt'
       WHERE id = $1`,
      [userId]
    );

    // Cancel any pending jobs (this is simplified - in production you'd need job tracking)
    console.log(`Cancelled scheduled deletion for user ${userId}`);
  }

  async getRetentionStats() {
    const stats = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE preferences->>'pendingDeletionAt' IS NOT NULL) as scheduled_deletions,
        COUNT(*) FILTER (WHERE updated_at < NOW() - INTERVAL '1 year' AND is_active = true) as inactive_users,
        COUNT(*) FILTER (WHERE is_active = false) as deleted_users
      FROM users
    `);

    return stats.rows[0];
  }

  async shutdown() {
    await this.queue.close();
  }
}

export const retentionScheduler = new RetentionScheduler();
