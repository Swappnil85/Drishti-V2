import { query, transaction } from '../../db/connection';
import {
  FinancialAccount,
  CreateFinancialAccountDto,
  UpdateFinancialAccountDto,
  FinancialPaginatedResponse,
} from '@drishti/shared/types/financial';
import { AppError, SystemErrors, ValidationErrors } from '../../utils/errors';

export class FinancialAccountService {
  private static instance: FinancialAccountService;

  public static getInstance(): FinancialAccountService {
    if (!FinancialAccountService.instance) {
      FinancialAccountService.instance = new FinancialAccountService();
    }
    return FinancialAccountService.instance;
  }

  /**
   * Create a new financial account for a user
   */
  async createAccount(
    userId: string,
    accountData: CreateFinancialAccountDto
  ): Promise<FinancialAccount> {
    try {
      const result = await query<FinancialAccount>(
        `
        INSERT INTO financial_accounts (
          user_id, name, account_type, institution, balance, 
          currency, interest_rate, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `,
        [
          userId,
          accountData.name,
          accountData.account_type,
          accountData.institution || null,
          accountData.balance,
          accountData.currency || 'USD',
          accountData.interest_rate || null,
          JSON.stringify(accountData.metadata || {}),
        ]
      );

      if (result.rows.length === 0) {
        throw SystemErrors.databaseError(
          new Error('Failed to create financial account')
        );
      }

      return this.formatAccount(result.rows[0]);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw SystemErrors.databaseError(error as Error);
    }
  }

  /**
   * Get all financial accounts for a user with pagination
   */
  async getUserAccounts(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      accountType?: string;
      isActive?: boolean;
      institution?: string;
    } = {}
  ): Promise<FinancialPaginatedResponse<FinancialAccount>> {
    try {
      const {
        page = 1,
        limit = 20,
        accountType,
        isActive,
        institution,
      } = options;

      const offset = (page - 1) * limit;
      let whereConditions = ['user_id = $1'];
      let queryParams: any[] = [userId];
      let paramIndex = 2;

      // Add optional filters
      if (accountType) {
        whereConditions.push(`account_type = $${paramIndex}`);
        queryParams.push(accountType);
        paramIndex++;
      }

      if (isActive !== undefined) {
        whereConditions.push(`is_active = $${paramIndex}`);
        queryParams.push(isActive);
        paramIndex++;
      }

      if (institution) {
        whereConditions.push(`institution ILIKE $${paramIndex}`);
        queryParams.push(`%${institution}%`);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Get total count
      const countResult = await query<{ count: string }>(
        `
        SELECT COUNT(*) as count
        FROM financial_accounts
        WHERE ${whereClause}
      `,
        queryParams
      );

      const total = parseInt(countResult.rows[0].count, 10);

      // Get paginated results
      const result = await query<FinancialAccount>(
        `
        SELECT *
        FROM financial_accounts
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `,
        [...queryParams, limit, offset]
      );

      const accounts = result.rows.map(row => this.formatAccount(row));

      return {
        success: true,
        data: accounts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw SystemErrors.databaseError(error as Error);
    }
  }

  /**
   * Get all accounts for a user
   */
  async getAccountsByUserId(userId: string): Promise<FinancialAccount[]> {
    try {
      const result = await query<FinancialAccount>(
        `
        SELECT * FROM financial_accounts
        WHERE user_id = $1 AND is_active = true
        ORDER BY created_at DESC
        `,
        [userId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching user accounts:', error);
      throw new Error('Failed to fetch user accounts');
    }
  }

  /**
   * Get a specific financial account by ID
   */
  async getAccountById(
    userId: string,
    accountId: string
  ): Promise<FinancialAccount | null> {
    try {
      const result = await query<FinancialAccount>(
        `
        SELECT *
        FROM financial_accounts
        WHERE id = $1 AND user_id = $2
      `,
        [accountId, userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.formatAccount(result.rows[0]);
    } catch (error) {
      throw SystemErrors.databaseError(error as Error);
    }
  }

  /**
   * Update a financial account
   */
  async updateAccount(
    userId: string,
    accountId: string,
    updateData: UpdateFinancialAccountDto
  ): Promise<FinancialAccount | null> {
    try {
      const setClause: string[] = [];
      const queryParams: any[] = [];
      let paramIndex = 1;

      // Build dynamic SET clause
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'metadata') {
            setClause.push(`${key} = $${paramIndex}`);
            queryParams.push(JSON.stringify(value));
          } else {
            setClause.push(`${key} = $${paramIndex}`);
            queryParams.push(value);
          }
          paramIndex++;
        }
      });

      if (setClause.length === 0) {
        throw ValidationErrors.invalidInput('No valid fields to update');
      }

      // Add synced_at update
      setClause.push(`synced_at = NOW()`);

      queryParams.push(accountId, userId);

      const result = await query<FinancialAccount>(
        `
        UPDATE financial_accounts
        SET ${setClause.join(', ')}
        WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
        RETURNING *
      `,
        queryParams
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.formatAccount(result.rows[0]);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw SystemErrors.databaseError(error as Error);
    }
  }

  /**
   * Delete a financial account (soft delete by setting is_active = false)
   */
  async deleteAccount(userId: string, accountId: string): Promise<boolean> {
    try {
      const result = await query(
        `
        UPDATE financial_accounts
        SET is_active = false, synced_at = NOW()
        WHERE id = $1 AND user_id = $2
      `,
        [accountId, userId]
      );

      return result.rowCount > 0;
    } catch (error) {
      throw SystemErrors.databaseError(error as Error);
    }
  }

  /**
   * Get account balance summary for a user
   */
  async getAccountSummary(userId: string): Promise<{
    total_assets: number;
    total_liabilities: number;
    net_worth: number;
    accounts_by_type: Record<string, { count: number; balance: number }>;
  }> {
    try {
      const result = await query<{
        account_type: string;
        count: string;
        total_balance: string;
      }>(
        `
        SELECT
          account_type,
          COUNT(*) as count,
          SUM(balance) as total_balance
        FROM financial_accounts
        WHERE user_id = $1 AND is_active = true
        GROUP BY account_type
      `,
        [userId]
      );

      let totalAssets = 0;
      let totalLiabilities = 0;
      const accountsByType: Record<string, { count: number; balance: number }> =
        {};

      result.rows.forEach(row => {
        const balance = parseFloat(row.total_balance);
        const count = parseInt(row.count, 10);

        accountsByType[row.account_type] = {
          count,
          balance,
        };

        // Categorize as assets or liabilities
        if (['credit', 'loan', 'mortgage'].includes(row.account_type)) {
          totalLiabilities += Math.abs(balance); // Ensure positive for liabilities
        } else {
          totalAssets += balance;
        }
      });

      return {
        total_assets: totalAssets,
        total_liabilities: totalLiabilities,
        net_worth: totalAssets - totalLiabilities,
        accounts_by_type: accountsByType,
      };
    } catch (error) {
      throw SystemErrors.databaseError(error as Error);
    }
  }

  /**
   * Get derived net worth trends for the past N months.
   * Uses current account balances as the latest month value and derives prior
   * months using aggregated transaction deltas per month as an approximation.
   *
   * NOTE: This is a best-effort derivation until we persist historical snapshots.
   */
  async getNetWorthTrends(
    userId: string,
    months: number = 12
  ): Promise<Array<{ month: string; value: number }>> {
    try {
      // Clamp months to a reasonable range
      const m = Math.max(1, Math.min(60, Math.floor(months)));

      // 1) Get current net worth
      const summary = await this.getAccountSummary(userId);
      const currentNetWorth = summary.net_worth;

      // 2) Build month keys oldest -> newest for past m months
      const monthsArr: Array<{ key: string; label: string; date: Date }> = [];
      const now = new Date();
      for (let i = m - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = d.getFullYear();
        const mon = String(d.getMonth() + 1).padStart(2, '0');
        const key = `${y}-${mon}`; // YYYY-MM
        const label = d.toLocaleString('en-US', { month: 'short' });
        monthsArr.push({ key, label, date: d });
      }

      // 3) Aggregate transaction deltas per month for the date range
      const rangeStart = monthsArr[0].date; // first day of oldest month
      const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0); // last day of current month

      const txnResult = await query<{ month: string; delta: string }>(
        `
        SELECT to_char(date_trunc('month', transaction_date), 'YYYY-MM') as month,
               COALESCE(SUM(amount), 0) as delta
        FROM account_transactions
        WHERE user_id = $1 AND transaction_date BETWEEN $2 AND $3
        GROUP BY 1
        ORDER BY 1 ASC
      `,
        [userId, rangeStart, rangeEnd]
      );

      const deltaByMonth = new Map<string, number>();
      txnResult.rows.forEach(r => {
        deltaByMonth.set(r.month, parseFloat(r.delta));
      });

      // 4) Derive monthly net worth values using backward accumulation
      const values: number[] = new Array(m);
      // Latest month is current net worth
      values[m - 1] = currentNetWorth;
      // Work backwards: prev = next - delta(next)
      for (let idx = m - 2; idx >= 0; idx--) {
        const nextMonthKey = monthsArr[idx + 1].key;
        const nextDelta = deltaByMonth.get(nextMonthKey) || 0;
        values[idx] = values[idx + 1] - nextDelta;
      }

      // 5) Return formatted series (oldest -> newest)
      return monthsArr.map((mm, i) => ({
        month: mm.label,
        value: Math.round(values[i]),
      }));
    } catch (error) {
      throw SystemErrors.databaseError(error as Error);
    }
  }

  /**
   * Update account balance (typically called after transactions)
   */
  async updateAccountBalance(
    accountId: string,
    newBalance: number
  ): Promise<void> {
    try {
      await query(
        `
        UPDATE financial_accounts
        SET balance = $1, synced_at = NOW()
        WHERE id = $2
      `,
        [newBalance, accountId]
      );
    } catch (error) {
      throw SystemErrors.databaseError(error as Error);
    }
  }

  /**
   * Bulk create accounts (for data import)
   */
  async bulkCreateAccounts(
    userId: string,
    accountsData: CreateFinancialAccountDto[]
  ): Promise<FinancialAccount[]> {
    try {
      return await transaction(async client => {
        const createdAccounts: FinancialAccount[] = [];

        for (const accountData of accountsData) {
          const result = await client.query(
            `
            INSERT INTO financial_accounts (
              user_id, name, account_type, institution, balance, 
              currency, interest_rate, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
          `,
            [
              userId,
              accountData.name,
              accountData.account_type,
              accountData.institution || null,
              accountData.balance,
              accountData.currency || 'USD',
              accountData.interest_rate || null,
              JSON.stringify(accountData.metadata || {}),
            ]
          );

          if (result.rows.length > 0) {
            createdAccounts.push(this.formatAccount(result.rows[0]));
          }
        }

        return createdAccounts;
      });
    } catch (error) {
      throw SystemErrors.databaseError(error as Error);
    }
  }

  /**
   * Format account data from database
   */
  private formatAccount(row: any): FinancialAccount {
    return {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      account_type: row.account_type,
      institution: row.institution,
      balance: parseFloat(row.balance),
      currency: row.currency,
      interest_rate: row.interest_rate ? parseFloat(row.interest_rate) : 0,
      is_active: row.is_active,
      metadata:
        typeof row.metadata === 'string'
          ? JSON.parse(row.metadata)
          : row.metadata,
      created_at: row.created_at,
      updated_at: row.updated_at,
      synced_at: row.synced_at,
    };
  }
}

export const financialAccountService = FinancialAccountService.getInstance();
