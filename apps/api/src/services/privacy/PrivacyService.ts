import { query, transaction } from '../../db/connection';
import crypto from 'crypto';

export type ExportFormat = 'json' | 'csv' | 'pdf' | 'zip';

export interface ExportOptions {
  types?: Array<'user' | 'accounts' | 'goals' | 'scenarios' | 'sessions'>;
  format?: ExportFormat;
}

export interface DeletionOptions {
  scheduleDays?: number; // if provided, schedule deletion in future instead of immediate
}

export class PrivacyService {
  async getUserData(userId: string, types?: ExportOptions['types']) {
    const include = new Set(
      types ?? ['user', 'accounts', 'goals', 'scenarios']
    );

    const results: Record<string, any> = {};

    if (include.has('user')) {
      const user = await query(
        `SELECT id, email, name, avatar_url, email_verified, is_active, preferences, created_at, updated_at
         FROM users WHERE id = $1`,
        [userId]
      );
      results.user = user.rows?.[0] ?? null;
    }

    if (include.has('accounts')) {
      const accounts = await query(
        `SELECT * FROM financial_accounts WHERE user_id = $1`,
        [userId]
      );
      results.accounts = accounts.rows;
    }

    if (include.has('goals')) {
      const goals = await query(
        `SELECT * FROM financial_goals WHERE user_id = $1`,
        [userId]
      );
      results.goals = goals.rows;
    }

    if (include.has('scenarios')) {
      const scenarios = await query(
        `SELECT * FROM scenarios WHERE user_id = $1`,
        [userId]
      );
      results.scenarios = scenarios.rows;
    }

    if (include.has('sessions')) {
      const sessions = await query(
        `SELECT id, user_id, created_at, last_activity_at, expires_at, is_active, ip_address, user_agent
         FROM sessions WHERE user_id = $1`,
        [userId]
      );
      results.sessions = sessions.rows;
    }

    return results;
  }

  async exportData(userId: string, options: ExportOptions = {}) {
    const { format = 'json', types } = options;
    const data = await this.getUserData(userId, types);

    if (format === 'json') {
      return {
        format,
        exportedAt: new Date().toISOString(),
        data,
      };
    }

    if (format === 'csv') {
      // For CSV, only allow single type for simplicity
      const singleType =
        (types && types.length === 1 ? types[0] : undefined) ?? 'accounts';
      const dataset = (data as any)[singleType] ?? [];
      const csv = this.toCSV(dataset);
      return {
        format,
        type: singleType,
        exportedAt: new Date().toISOString(),
        csv,
      };
    }

    if (format === 'pdf') {
      const { exportPdfService } = await import('./ExportPdfService');
      const pdf = await exportPdfService.generateUserDataPdf(userId, data);
      return {
        format,
        exportedAt: new Date().toISOString(),
        pdf: pdf.toString('base64'),
      };
    }

    if (format === 'zip') {
      const { exportArchiveService } = await import('./ExportArchiveService');
      // Build manifest and include JSON and CSV (accounts) for portability demo
      const counts = {
        user: data.user ? 1 : 0,
        accounts: Array.isArray(data.accounts) ? data.accounts.length : 0,
        goals: Array.isArray(data.goals) ? data.goals.length : 0,
        scenarios: Array.isArray(data.scenarios) ? data.scenarios.length : 0,
        sessions: Array.isArray(data.sessions) ? data.sessions.length : 0,
      };
      const manifest = exportArchiveService.buildManifest(
        userId,
        ['json', 'csv'],
        counts
      );
      const files: Array<{ name: string; content: string | Buffer }> = [];
      files.push({
        name: 'manifest.json',
        content: JSON.stringify(manifest, null, 2),
      });
      files.push({
        name: 'export.json',
        content: JSON.stringify(data, null, 2),
      });
      const singleType = 'accounts';
      const dataset = (data as any)[singleType] ?? [];
      files.push({ name: `${singleType}.csv`, content: this.toCSV(dataset) });

      const zip = await exportArchiveService.buildZip(files);
      return {
        format,
        exportedAt: new Date().toISOString(),
        zip: zip.toString('base64'),
      };
    }

    // default fallback
    return { format: 'json', exportedAt: new Date().toISOString(), data };
  }

  async deleteUserData(userId: string, options: DeletionOptions = {}) {
    const scheduleDays =
      options.scheduleDays && options.scheduleDays > 0
        ? options.scheduleDays
        : 0;

    if (scheduleDays > 0) {
      // Store a pending deletion schedule in users.preferences JSONB
      await query(
        `UPDATE users
         SET preferences = jsonb_set(COALESCE(preferences, '{}'::jsonb), '{pendingDeletionAt}', to_jsonb(NOW() + ($2 || ' days')::interval))
         WHERE id = $1`,
        [userId, String(scheduleDays)]
      );

      const receiptHash = this.generateReceiptHash({
        userId,
        scheduledAt: new Date().toISOString(),
        scheduleDays,
      });
      return { scheduled: true, scheduleDays, receiptHash };
    }

    // Immediate deletion/anonymization in a transaction
    const performedAt = new Date().toISOString();
    await transaction(async client => {
      // Soft delete related data
      await client.query(
        `UPDATE financial_accounts SET is_active = false, updated_at = NOW(), synced_at = NOW() WHERE user_id = $1`,
        [userId]
      );
      await client.query(
        `UPDATE financial_goals SET is_active = false, updated_at = NOW(), synced_at = NOW() WHERE user_id = $1`,
        [userId]
      );
      await client.query(
        `UPDATE scenarios SET is_active = false, updated_at = NOW(), synced_at = NOW() WHERE user_id = $1`,
        [userId]
      );

      // Deactivate sessions
      await client.query(
        `UPDATE sessions SET is_active = false, updated_at = NOW() WHERE user_id = $1`,
        [userId]
      );

      // Anonymize user row and deactivate
      // Replace email with a non-reversible placeholder and clear PII-like fields
      const placeholderEmail = `deleted+${userId}@example.com`;
      await client.query(
        `UPDATE users
         SET email = $2,
             name = 'Deleted User',
             avatar_url = NULL,
             is_active = false,
             preferences = jsonb_set(COALESCE(preferences, '{}'::jsonb), '{deletedAt}', to_jsonb(NOW()))
         WHERE id = $1`,
        [userId, placeholderEmail]
      );
    });

    const receiptHash = this.generateReceiptHash({
      userId,
      performedAt,
      action: 'delete',
    });
    return { scheduled: false, performedAt, receiptHash };
  }

  // Retrieve current privacy policy (stub - from config or DB in future)
  async getPrivacyPolicy() {
    return {
      version: '1.0.0',
      updatedAt: '2025-01-01T00:00:00.000Z',
      url: 'https://drishti.app/privacy-policy',
      summary:
        'We collect and process your data according to GDPR/CCPA principles. You control your data.',
    };
  }

  // Get user consent preferences from users.preferences JSONB
  async getUserConsent(userId: string) {
    const res = await query(`SELECT preferences FROM users WHERE id = $1`, [
      userId,
    ]);
    const prefs = res.rows?.[0]?.preferences || {};
    return (
      prefs.consent || {
        marketing: false,
        analytics: true,
        personalization: false,
      }
    );
  }

  // Update user consent preferences in users.preferences JSONB
  async updateUserConsent(userId: string, consent: Record<string, any>) {
    await query(
      `UPDATE users SET preferences =
        CASE WHEN preferences IS NULL THEN jsonb_build_object('consent', $2::jsonb)
             ELSE jsonb_set(preferences, '{consent}', $2::jsonb, true)
        END,
        updated_at = NOW()
       WHERE id = $1`,
      [userId, JSON.stringify(consent)]
    );
    return { success: true };
  }

  // Consent history for auditability
  async getConsentHistory(userId: string, limit = 50) {
    const res = await query(
      `SELECT id, user_id, consent, policy_version, user_agent, ip_address, created_at
       FROM consent_audit WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, String(limit)]
    );
    return res.rows || [];
  }

  async recordConsentAudit(
    userId: string,
    consent: Record<string, any>,
    policyVersion: string,
    context?: { ip?: string; ua?: string }
  ) {
    await query(
      `INSERT INTO consent_audit (user_id, consent, policy_version, user_agent, ip_address, created_at)
       VALUES ($1, $2::jsonb, $3, $4, $5, NOW())`,
      [
        userId,
        JSON.stringify(consent),
        policyVersion,
        context?.ua || null,
        context?.ip || null,
      ]
    );
  }

  private toCSV(rows: any[]): string {
    if (!rows || rows.length === 0) return '';
    const headers = Object.keys(rows[0]);
    const escape = (val: any) => {
      if (val === null || val === undefined) return '';
      const s = String(val);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };
    const lines = [headers.join(',')];
    for (const row of rows) {
      lines.push(headers.map(h => escape(row[h])).join(','));
    }
    return lines.join('\n');
  }

  private generateReceiptHash(payload: Record<string, any>): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');
  }
}

export const privacyService = new PrivacyService();
