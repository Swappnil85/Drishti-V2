/**
 * BalanceHistory Model
 * Tracks balance changes over time for trend analysis
 */

import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';
import type FinancialAccount from './FinancialAccount';

export default class BalanceHistory extends Model {
  static table = 'balance_history';

  static associations: Associations = {
    financial_accounts: { type: 'belongs_to', key: 'account_id' },
  };

  @field('account_id') accountId!: string;
  @field('previous_balance') previousBalance!: number;
  @field('new_balance') newBalance!: number;
  @field('change_amount') changeAmount!: number;
  @field('change_percentage') changePercentage!: number;
  @field('update_method') updateMethod!: string; // 'manual', 'bulk', 'import', 'automatic'
  @field('notes') notes?: string;
  @field('metadata') metadataRaw!: string; // JSON string

  // Timestamps
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  // Relations
  @relation('financial_accounts', 'account_id') account!: FinancialAccount;

  /**
   * Get parsed metadata
   */
  get metadata(): Record<string, any> {
    try {
      return JSON.parse(this.metadataRaw || '{}');
    } catch {
      return {};
    }
  }

  /**
   * Set metadata (will be stringified)
   */
  set metadata(value: Record<string, any>) {
    this.metadataRaw = JSON.stringify(value || {});
  }

  /**
   * Get formatted change amount with currency
   */
  getFormattedChangeAmount(currency: string = 'USD'): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      signDisplay: 'always',
    });
    return formatter.format(this.changeAmount);
  }

  /**
   * Get formatted change percentage
   */
  getFormattedChangePercentage(): string {
    const sign = this.changePercentage >= 0 ? '+' : '';
    return `${sign}${this.changePercentage.toFixed(2)}%`;
  }

  /**
   * Check if this is a significant change (>20% variation)
   */
  isSignificantChange(): boolean {
    return Math.abs(this.changePercentage) > 20;
  }

  /**
   * Get change direction
   */
  getChangeDirection(): 'increase' | 'decrease' | 'no_change' {
    if (this.changeAmount > 0) return 'increase';
    if (this.changeAmount < 0) return 'decrease';
    return 'no_change';
  }

  /**
   * Get change magnitude description
   */
  getChangeMagnitude(): 'small' | 'moderate' | 'large' | 'significant' {
    const absPercentage = Math.abs(this.changePercentage);
    
    if (absPercentage < 5) return 'small';
    if (absPercentage < 15) return 'moderate';
    if (absPercentage < 25) return 'large';
    return 'significant';
  }
}
