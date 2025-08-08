import Queue from 'bull';
import { retentionService } from '../privacy/RetentionService';

export class RetentionQueue {
  private queue: Queue.Queue;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.queue = new Queue('retention processing', redisUrl);
    this.setupProcessors();
  }

  private setupProcessors() {
    this.queue.process('daily-retention', async (job) => {
      console.log('🗑️  Processing daily retention job...');
      try {
        const result = await retentionService.runScheduledDeletions();
        console.log(`✅ Processed ${result.processed.length} scheduled deletions`);
        return result;
      } catch (error) {
        console.error('❌ Retention job failed:', error);
        throw error;
      }
    });
  }

  async scheduleDaily() {
    // Schedule daily at 2 AM UTC
    await this.queue.add('daily-retention', {}, {
      repeat: { cron: '0 2 * * *' },
      removeOnComplete: 10,
      removeOnFail: 5,
    });
    console.log('📅 Daily retention job scheduled for 2 AM UTC');
  }

  async getStats() {
    const waiting = await this.queue.getWaiting();
    const active = await this.queue.getActive();
    const completed = await this.queue.getCompleted();
    const failed = await this.queue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    };
  }

  async shutdown() {
    await this.queue.close();
  }
}

export const retentionQueue = new RetentionQueue();
