import { query } from '../../db/connection';
import { privacyService } from './PrivacyService';

export class RetentionService {
  // Process users who have a pendingDeletionAt in preferences and it's due
  async runScheduledDeletions(): Promise<{ processed: string[] }> {
    const res = await query(
      `SELECT id FROM users 
       WHERE preferences ? 'pendingDeletionAt' 
         AND (preferences->>'pendingDeletionAt')::timestamp <= NOW()`,
      []
    );

    const processed: string[] = [];
    for (const row of res.rows) {
      try {
        await privacyService.deleteUserData(row.id, { scheduleDays: 0 });
        // Clear the pendingDeletionAt
        await query(
          `UPDATE users SET preferences = preferences - 'pendingDeletionAt' WHERE id = $1`,
          [row.id]
        );
        processed.push(row.id);
      } catch (e) {
        // continue others; in production, log
      }
    }

    return { processed };
  }
}

export const retentionService = new RetentionService();

