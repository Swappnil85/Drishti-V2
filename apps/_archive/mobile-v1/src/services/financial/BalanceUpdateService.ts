/**
 * BalanceUpdateService
 * Service for managing account balance updates with history tracking
 */

import { database } from '../../database';
import { Q } from '@nozbe/watermelondb';
import type FinancialAccount from '../../database/models/FinancialAccount';
import type BalanceHistory from '../../database/models/BalanceHistory';

export interface BalanceUpdateData {
  accountId: string;
  newBalance: number;
  notes?: string;
  updateMethod?: 'manual' | 'bulk' | 'import' | 'automatic';
  metadata?: Record<string, any>;
}

export interface BulkBalanceUpdateData {
  updates: BalanceUpdateData[];
  globalNotes?: string;
}

export interface BalanceUpdateResult {
  success: boolean;
  account?: FinancialAccount;
  historyEntry?: BalanceHistory;
  error?: string;
  warnings?: string[];
}

export interface BulkBalanceUpdateResult {
  success: boolean;
  totalUpdates: number;
  successfulUpdates: number;
  failedUpdates: number;
  results: BalanceUpdateResult[];
  errors: string[];
}

export interface BalanceValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

class BalanceUpdateService {
  /**
   * Update a single account balance
   */
  async updateAccountBalance(updateData: BalanceUpdateData): Promise<BalanceUpdateResult> {
    try {
      const account = await database.get('financial_accounts').find(updateData.accountId);
      
      if (!account) {
        return {
          success: false,
          error: 'Account not found',
        };
      }

      // Validate the balance update
      const validation = this.validateBalanceUpdate(account, updateData.newBalance);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', '),
          warnings: validation.warnings,
        };
      }

      const previousBalance = account.balance;
      const changeAmount = updateData.newBalance - previousBalance;
      const changePercentage = previousBalance !== 0 ? (changeAmount / Math.abs(previousBalance)) * 100 : 0;

      let updatedAccount: FinancialAccount;
      let historyEntry: BalanceHistory;

      await database.write(async () => {
        // Update the account balance
        updatedAccount = await account.update((acc: any) => {
          acc.balance = updateData.newBalance;
          acc.updatedAt = new Date();
        });

        // Create balance history entry
        const balanceHistoryCollection = database.get('balance_history');
        historyEntry = await balanceHistoryCollection.create((history: any) => {
          history.accountId = updateData.accountId;
          history.previousBalance = previousBalance;
          history.newBalance = updateData.newBalance;
          history.changeAmount = changeAmount;
          history.changePercentage = changePercentage;
          history.updateMethod = updateData.updateMethod || 'manual';
          history.notes = updateData.notes;
          history.metadata = updateData.metadata || {};
          history.createdAt = new Date();
          history.updatedAt = new Date();
        });
      });

      return {
        success: true,
        account: updatedAccount!,
        historyEntry: historyEntry!,
        warnings: validation.warnings,
      };
    } catch (error) {
      console.error('Error updating account balance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Update multiple account balances in bulk
   */
  async updateMultipleBalances(bulkData: BulkBalanceUpdateData): Promise<BulkBalanceUpdateResult> {
    const results: BalanceUpdateResult[] = [];
    const errors: string[] = [];
    let successfulUpdates = 0;
    let failedUpdates = 0;

    for (const updateData of bulkData.updates) {
      try {
        // Add global notes if provided
        const enhancedUpdateData = {
          ...updateData,
          notes: updateData.notes || bulkData.globalNotes,
          updateMethod: updateData.updateMethod || 'bulk',
        };

        const result = await this.updateAccountBalance(enhancedUpdateData);
        results.push(result);

        if (result.success) {
          successfulUpdates++;
        } else {
          failedUpdates++;
          if (result.error) {
            errors.push(`Account ${updateData.accountId}: ${result.error}`);
          }
        }
      } catch (error) {
        failedUpdates++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Account ${updateData.accountId}: ${errorMessage}`);
        results.push({
          success: false,
          error: errorMessage,
        });
      }
    }

    return {
      success: failedUpdates === 0,
      totalUpdates: bulkData.updates.length,
      successfulUpdates,
      failedUpdates,
      results,
      errors,
    };
  }

  /**
   * Validate a balance update
   */
  validateBalanceUpdate(account: FinancialAccount, newBalance: number): BalanceValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check if balance is a valid number
    if (isNaN(newBalance) || !isFinite(newBalance)) {
      errors.push('Balance must be a valid number');
      return { isValid: false, warnings, errors };
    }

    const currentBalance = account.balance;
    const changeAmount = newBalance - currentBalance;
    const changePercentage = currentBalance !== 0 ? Math.abs(changeAmount / currentBalance) * 100 : 0;

    // Account type specific validation
    switch (account.accountType) {
      case 'checking':
        if (newBalance < -10000) {
          errors.push('Checking account balance cannot be less than -$10,000');
        } else if (newBalance < 0) {
          warnings.push('Checking account has a negative balance (overdraft)');
        }
        break;

      case 'savings':
        if (newBalance < 0) {
          errors.push('Savings account balance cannot be negative');
        }
        break;

      case 'credit':
        if (newBalance > 0) {
          warnings.push('Credit account has a positive balance (overpayment)');
        }
        if (newBalance < -100000) {
          warnings.push('Credit account balance is unusually high');
        }
        break;

      case 'investment':
        if (newBalance < 0) {
          warnings.push('Investment account has a negative balance');
        }
        break;

      case 'retirement':
        if (newBalance < 0) {
          errors.push('Retirement account balance cannot be negative');
        }
        break;
    }

    // Significant change warnings (>20% change)
    if (changePercentage > 20) {
      warnings.push(`This is a significant balance change (${changePercentage.toFixed(1)}%). Please verify the amount.`);
    }

    // Large absolute change warnings
    if (Math.abs(changeAmount) > 50000) {
      warnings.push(`This is a large balance change ($${Math.abs(changeAmount).toLocaleString()}). Please verify the amount.`);
    }

    // Unusual balance amounts
    if (newBalance > 1000000) {
      warnings.push('This is an unusually high balance. Please verify the amount.');
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
    };
  }

  /**
   * Get balance history for an account
   */
  async getBalanceHistory(accountId: string, limit: number = 50): Promise<BalanceHistory[]> {
    try {
      return await database
        .get('balance_history')
        .query(
          Q.where('account_id', accountId),
          Q.sortBy('created_at', Q.desc),
          Q.take(limit)
        )
        .fetch();
    } catch (error) {
      console.error('Error fetching balance history:', error);
      return [];
    }
  }

  /**
   * Get recent balance changes across all accounts for a user
   */
  async getRecentBalanceChanges(userId: string, limit: number = 20): Promise<BalanceHistory[]> {
    try {
      // First get user's accounts
      const userAccounts = await database
        .get('financial_accounts')
        .query(Q.where('user_id', userId))
        .fetch();

      const accountIds = userAccounts.map(account => account.id);

      if (accountIds.length === 0) {
        return [];
      }

      return await database
        .get('balance_history')
        .query(
          Q.where('account_id', Q.oneOf(accountIds)),
          Q.sortBy('created_at', Q.desc),
          Q.take(limit)
        )
        .fetch();
    } catch (error) {
      console.error('Error fetching recent balance changes:', error);
      return [];
    }
  }

  /**
   * Calculate net worth change from balance history
   */
  async calculateNetWorthChange(userId: string, days: number = 30): Promise<{
    currentNetWorth: number;
    previousNetWorth: number;
    change: number;
    changePercentage: number;
  }> {
    try {
      // Get current net worth
      const userAccounts = await database
        .get('financial_accounts')
        .query(
          Q.where('user_id', userId),
          Q.where('is_active', true)
        )
        .fetch();

      const currentNetWorth = userAccounts.reduce((total, account) => {
        return total + (account.accountType === 'credit' ? -account.balance : account.balance);
      }, 0);

      // Get balance history from specified days ago
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // This is a simplified calculation - in a real implementation,
      // you'd need to reconstruct the net worth at the specific point in time
      const previousNetWorth = currentNetWorth; // Placeholder

      const change = currentNetWorth - previousNetWorth;
      const changePercentage = previousNetWorth !== 0 ? (change / Math.abs(previousNetWorth)) * 100 : 0;

      return {
        currentNetWorth,
        previousNetWorth,
        change,
        changePercentage,
      };
    } catch (error) {
      console.error('Error calculating net worth change:', error);
      return {
        currentNetWorth: 0,
        previousNetWorth: 0,
        change: 0,
        changePercentage: 0,
      };
    }
  }
}

// Export singleton instance
export const balanceUpdateService = new BalanceUpdateService();
