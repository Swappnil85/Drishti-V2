/**
 * NetWorthService
 * Comprehensive service for net worth calculations, trends, and analysis
 */

import { database } from '../../database';
import { Q } from '@nozbe/watermelondb';
import type FinancialAccount from '../../database/models/FinancialAccount';
import type BalanceHistory from '../../database/models/BalanceHistory';

export interface NetWorthData {
  totalNetWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  accountBreakdown: AccountTypeBreakdown[];
  lastUpdated: Date;
}

export interface AccountTypeBreakdown {
  accountType: string;
  totalBalance: number;
  accountCount: number;
  percentage: number;
  accounts: {
    id: string;
    name: string;
    balance: number;
    institution?: string;
  }[];
}

export interface NetWorthTrend {
  date: Date;
  netWorth: number;
  change: number;
  changePercentage: number;
}

export interface NetWorthComparison {
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
  period: 'month' | 'quarter' | 'year';
  periodLabel: string;
}

export interface NetWorthMilestone {
  id: string;
  amount: number;
  label: string;
  achieved: boolean;
  achievedDate?: Date;
  progress: number; // 0-1
  estimatedDate?: Date;
}

export interface MonthlyNetWorthChange {
  month: string;
  year: number;
  startNetWorth: number;
  endNetWorth: number;
  change: number;
  changePercentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

class NetWorthService {
  /**
   * Calculate current net worth with detailed breakdown
   */
  async calculateNetWorth(userId: string): Promise<NetWorthData> {
    try {
      const accounts = await database
        .get('financial_accounts')
        .query(
          Q.where('user_id', userId),
          Q.where('is_active', true)
        )
        .fetch() as FinancialAccount[];

      let totalAssets = 0;
      let totalLiabilities = 0;
      const accountTypeMap = new Map<string, {
        totalBalance: number;
        accountCount: number;
        accounts: any[];
      }>();

      // Process each account
      accounts.forEach(account => {
        const balance = account.balance;
        const accountType = account.accountType;

        // Determine if this is an asset or liability
        const isLiability = this.isLiabilityAccount(accountType, balance);
        
        if (isLiability) {
          totalLiabilities += Math.abs(balance);
        } else {
          totalAssets += balance;
        }

        // Group by account type
        if (!accountTypeMap.has(accountType)) {
          accountTypeMap.set(accountType, {
            totalBalance: 0,
            accountCount: 0,
            accounts: [],
          });
        }

        const typeData = accountTypeMap.get(accountType)!;
        typeData.totalBalance += balance;
        typeData.accountCount += 1;
        typeData.accounts.push({
          id: account.id,
          name: account.name,
          balance: account.balance,
          institution: account.institution,
        });
      });

      const totalNetWorth = totalAssets - totalLiabilities;

      // Create account breakdown with percentages
      const accountBreakdown: AccountTypeBreakdown[] = Array.from(accountTypeMap.entries())
        .map(([accountType, data]) => ({
          accountType,
          totalBalance: data.totalBalance,
          accountCount: data.accountCount,
          percentage: totalNetWorth !== 0 ? (data.totalBalance / totalNetWorth) * 100 : 0,
          accounts: data.accounts,
        }))
        .sort((a, b) => Math.abs(b.totalBalance) - Math.abs(a.totalBalance));

      return {
        totalNetWorth,
        totalAssets,
        totalLiabilities,
        accountBreakdown,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('Error calculating net worth:', error);
      throw new Error('Failed to calculate net worth');
    }
  }

  /**
   * Get historical net worth trends
   */
  async getNetWorthTrends(userId: string, days: number = 90): Promise<NetWorthTrend[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get all balance history within the date range
      const balanceHistory = await database
        .get('balance_history')
        .query(
          Q.where('created_at', Q.gte(startDate.getTime())),
          Q.where('created_at', Q.lte(endDate.getTime())),
          Q.sortBy('created_at', Q.asc)
        )
        .fetch() as BalanceHistory[];

      // Get current accounts to establish baseline
      const currentAccounts = await database
        .get('financial_accounts')
        .query(
          Q.where('user_id', userId),
          Q.where('is_active', true)
        )
        .fetch() as FinancialAccount[];

      // Calculate net worth for each day
      const trends: NetWorthTrend[] = [];
      const dailyNetWorth = new Map<string, number>();

      // Start with current net worth and work backwards
      let currentNetWorth = currentAccounts.reduce((total, account) => {
        return total + (this.isLiabilityAccount(account.accountType, account.balance) 
          ? -Math.abs(account.balance) 
          : account.balance);
      }, 0);

      // Process balance history to reconstruct historical net worth
      // This is a simplified approach - in production, you'd want more sophisticated tracking
      const groupedByDate = this.groupBalanceHistoryByDate(balanceHistory);
      
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        
        const netWorth = dailyNetWorth.get(dateKey) || currentNetWorth;
        const previousNetWorth = i === days ? netWorth : (trends[trends.length - 1]?.netWorth || netWorth);
        
        const change = netWorth - previousNetWorth;
        const changePercentage = previousNetWorth !== 0 ? (change / Math.abs(previousNetWorth)) * 100 : 0;

        trends.push({
          date: new Date(date),
          netWorth,
          change,
          changePercentage,
        });
      }

      return trends;
    } catch (error) {
      console.error('Error getting net worth trends:', error);
      return [];
    }
  }

  /**
   * Get net worth comparison for different periods
   */
  async getNetWorthComparisons(userId: string): Promise<NetWorthComparison[]> {
    try {
      const current = await this.calculateNetWorth(userId);
      const comparisons: NetWorthComparison[] = [];

      // Monthly comparison
      const monthlyComparison = await this.getNetWorthComparison(userId, 30, 'month');
      if (monthlyComparison) {
        comparisons.push(monthlyComparison);
      }

      // Quarterly comparison
      const quarterlyComparison = await this.getNetWorthComparison(userId, 90, 'quarter');
      if (quarterlyComparison) {
        comparisons.push(quarterlyComparison);
      }

      // Yearly comparison
      const yearlyComparison = await this.getNetWorthComparison(userId, 365, 'year');
      if (yearlyComparison) {
        comparisons.push(yearlyComparison);
      }

      return comparisons;
    } catch (error) {
      console.error('Error getting net worth comparisons:', error);
      return [];
    }
  }

  /**
   * Get monthly net worth changes
   */
  async getMonthlyNetWorthChanges(userId: string, months: number = 12): Promise<MonthlyNetWorthChange[]> {
    try {
      const changes: MonthlyNetWorthChange[] = [];
      const currentDate = new Date();

      for (let i = months - 1; i >= 0; i--) {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);

        // This is a simplified calculation - in production, you'd reconstruct actual historical values
        const startNetWorth = 100000; // Placeholder
        const endNetWorth = 105000; // Placeholder
        const change = endNetWorth - startNetWorth;
        const changePercentage = startNetWorth !== 0 ? (change / Math.abs(startNetWorth)) * 100 : 0;

        let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        if (changePercentage > 1) trend = 'increasing';
        else if (changePercentage < -1) trend = 'decreasing';

        changes.push({
          month: monthStart.toLocaleDateString('en-US', { month: 'long' }),
          year: monthStart.getFullYear(),
          startNetWorth,
          endNetWorth,
          change,
          changePercentage,
          trend,
        });
      }

      return changes;
    } catch (error) {
      console.error('Error getting monthly net worth changes:', error);
      return [];
    }
  }

  /**
   * Get net worth milestones
   */
  async getNetWorthMilestones(userId: string): Promise<NetWorthMilestone[]> {
    try {
      const currentNetWorth = await this.calculateNetWorth(userId);
      const current = currentNetWorth.totalNetWorth;

      const milestones: NetWorthMilestone[] = [
        { id: '1', amount: 10000, label: 'First $10K', achieved: false, progress: 0 },
        { id: '2', amount: 25000, label: 'Quarter Million', achieved: false, progress: 0 },
        { id: '3', amount: 50000, label: 'Half Way to 100K', achieved: false, progress: 0 },
        { id: '4', amount: 100000, label: 'Six Figures', achieved: false, progress: 0 },
        { id: '5', amount: 250000, label: 'Quarter Million', achieved: false, progress: 0 },
        { id: '6', amount: 500000, label: 'Half Million', achieved: false, progress: 0 },
        { id: '7', amount: 1000000, label: 'Millionaire', achieved: false, progress: 0 },
        { id: '8', amount: 2000000, label: 'Multi-Millionaire', achieved: false, progress: 0 },
      ];

      return milestones.map(milestone => {
        const achieved = current >= milestone.amount;
        const progress = Math.min(current / milestone.amount, 1);
        
        return {
          ...milestone,
          achieved,
          progress,
          achievedDate: achieved ? new Date() : undefined, // In production, track actual achievement dates
        };
      });
    } catch (error) {
      console.error('Error getting net worth milestones:', error);
      return [];
    }
  }

  /**
   * Helper: Determine if an account is a liability
   */
  private isLiabilityAccount(accountType: string, balance: number): boolean {
    const liabilityTypes = ['credit', 'loan', 'mortgage', 'debt'];
    return liabilityTypes.includes(accountType.toLowerCase()) || balance < 0;
  }

  /**
   * Helper: Get net worth comparison for a specific period
   */
  private async getNetWorthComparison(
    userId: string, 
    days: number, 
    period: 'month' | 'quarter' | 'year'
  ): Promise<NetWorthComparison | null> {
    try {
      const current = await this.calculateNetWorth(userId);
      
      // This is a simplified calculation - in production, you'd reconstruct historical values
      const previous = current.totalNetWorth * 0.95; // Placeholder
      const change = current.totalNetWorth - previous;
      const changePercentage = previous !== 0 ? (change / Math.abs(previous)) * 100 : 0;

      const periodLabels = {
        month: 'vs Last Month',
        quarter: 'vs Last Quarter', 
        year: 'vs Last Year',
      };

      return {
        current: current.totalNetWorth,
        previous,
        change,
        changePercentage,
        period,
        periodLabel: periodLabels[period],
      };
    } catch (error) {
      console.error(`Error getting ${period} comparison:`, error);
      return null;
    }
  }

  /**
   * Helper: Group balance history by date
   */
  private groupBalanceHistoryByDate(history: BalanceHistory[]): Map<string, BalanceHistory[]> {
    const grouped = new Map<string, BalanceHistory[]>();
    
    history.forEach(record => {
      const dateKey = record.createdAt.toISOString().split('T')[0];
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(record);
    });

    return grouped;
  }
}

export const netWorthService = new NetWorthService();
