import { Model } from '@nozbe/watermelondb';
import {
  field,
  readonly,
  date,
  relation,
} from '@nozbe/watermelondb/decorators';
import { TABLE_NAMES } from '../schema';
import type User from './User';
import type { AccountType, Currency } from '@drishti/shared/types/financial';

/**
 * FinancialAccount model for WatermelonDB
 * Represents a user's financial account (checking, savings, investment, etc.)
 */
export default class FinancialAccount extends Model {
  static table = TABLE_NAMES.FINANCIAL_ACCOUNTS;

  // Account fields
  @field('user_id') userId!: string;
  @field('name') name!: string;
  @field('account_type') accountType!: AccountType;
  @field('institution') institution?: string;
  @field('balance') balance!: number;
  @field('currency') currency!: Currency;
  @field('interest_rate') interestRate?: number;
  @field('institution_id') institutionId?: string;
  @field('routing_number') routingNumber?: string;
  @field('account_number_encrypted') accountNumberEncrypted?: string;
  @field('tax_treatment') taxTreatment?: string;
  @field('tags') tagsRaw!: string; // JSON array
  @field('color') color?: string;
  @field('linked_account_ids') linkedAccountIdsRaw!: string; // JSON array
  @field('is_active') isActive!: boolean;
  @field('metadata') metadataRaw!: string; // JSON string

  // Timestamps
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
  @date('synced_at') syncedAt?: Date;

  // Relationships
  @relation(TABLE_NAMES.USERS, 'user_id') user!: User;

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
    this.metadataRaw = JSON.stringify(value);
  }

  /**
   * Get parsed tags array
   */
  get tags(): string[] {
    try {
      return JSON.parse(this.tagsRaw || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Set tags (will be stringified)
   */
  set tags(value: string[]) {
    this.tagsRaw = JSON.stringify(value || []);
  }

  /**
   * Get parsed linked account IDs array
   */
  get linkedAccountIds(): string[] {
    try {
      return JSON.parse(this.linkedAccountIdsRaw || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Set linked account IDs (will be stringified)
   */
  set linkedAccountIds(value: string[]) {
    this.linkedAccountIdsRaw = JSON.stringify(value || []);
  }

  /**
   * Get formatted balance with currency
   */
  get formattedBalance(): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency,
    });
    return formatter.format(this.balance);
  }

  /**
   * Check if account is a liability (credit card, loan)
   */
  get isLiability(): boolean {
    return ['credit', 'loan'].includes(this.accountType);
  }

  /**
   * Check if account is an asset
   */
  get isAsset(): boolean {
    return !this.isLiability;
  }

  /**
   * Get account type display name
   */
  get accountTypeDisplayName(): string {
    const typeNames: Record<AccountType, string> = {
      checking: 'Checking Account',
      savings: 'Savings Account',
      investment: 'Investment Account',
      retirement: 'Retirement Account',
      credit: 'Credit Card',
      loan: 'Loan',
      other: 'Other Account',
    };
    return typeNames[this.accountType] || 'Unknown Account';
  }

  /**
   * Get account icon name based on type
   */
  get iconName(): string {
    const iconNames: Record<AccountType, string> = {
      checking: 'account-check',
      savings: 'piggy-bank',
      investment: 'trending-up',
      retirement: 'account-clock',
      credit: 'credit-card',
      loan: 'bank-minus',
      other: 'account',
    };
    return iconNames[this.accountType] || 'account';
  }

  /**
   * Check if account needs sync
   */
  get needsSync(): boolean {
    if (!this.syncedAt) return true;
    return this.updatedAt > this.syncedAt;
  }

  /**
   * Mark account as synced
   */
  async markAsSynced(): Promise<void> {
    await this.update(account => {
      account.syncedAt = new Date();
    });
  }

  /**
   * Update account balance
   */
  async updateBalance(newBalance: number): Promise<void> {
    await this.update(account => {
      account.balance = newBalance;
    });
  }

  /**
   * Update account details
   */
  async updateDetails(updates: {
    name?: string;
    institution?: string;
    interestRate?: number;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.update(account => {
      if (updates.name !== undefined) account.name = updates.name;
      if (updates.institution !== undefined)
        account.institution = updates.institution;
      if (updates.interestRate !== undefined)
        account.interestRate = updates.interestRate;
      if (updates.metadata !== undefined) account.metadata = updates.metadata;
    });
  }

  /**
   * Deactivate account
   */
  async deactivate(): Promise<void> {
    await this.update(account => {
      account.isActive = false;
    });
  }

  /**
   * Activate account
   */
  async activate(): Promise<void> {
    await this.update(account => {
      account.isActive = true;
    });
  }

  /**
   * Calculate monthly interest (if applicable)
   */
  get monthlyInterest(): number {
    if (!this.interestRate || this.interestRate <= 0) return 0;
    return (this.balance * this.interestRate) / 12;
  }

  /**
   * Calculate annual interest (if applicable)
   */
  get annualInterest(): number {
    if (!this.interestRate || this.interestRate <= 0) return 0;
    return this.balance * this.interestRate;
  }

  /**
   * Get account summary for display
   */
  get summary(): {
    name: string;
    type: string;
    balance: string;
    institution?: string;
    isLiability: boolean;
  } {
    return {
      name: this.name,
      type: this.accountTypeDisplayName,
      balance: this.formattedBalance,
      ...(this.institution && { institution: this.institution }),
      isLiability: this.isLiability,
    };
  }

  /**
   * Convert to API format
   */
  toAPI(): {
    id: string;
    user_id: string;
    name: string;
    account_type: AccountType;
    institution?: string;
    balance: number;
    currency: Currency;
    interest_rate?: number;
    is_active: boolean;
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
    synced_at?: string;
  } {
    return {
      id: this.id,
      user_id: this.userId,
      name: this.name,
      account_type: this.accountType,
      balance: this.balance,
      currency: this.currency,
      ...(this.institution && { institution: this.institution }),
      ...(this.interestRate && { interest_rate: this.interestRate }),
      is_active: this.isActive,
      metadata: this.metadata,
      created_at: this.createdAt.toISOString(),
      updated_at: this.updatedAt.toISOString(),
      ...(this.syncedAt && { synced_at: this.syncedAt.toISOString() }),
    };
  }

  /**
   * Create from API data
   */
  static fromAPI(apiData: any): Partial<FinancialAccount> {
    return {
      id: apiData.id,
      userId: apiData.user_id,
      name: apiData.name,
      accountType: apiData.account_type,
      institution: apiData.institution,
      balance: apiData.balance,
      currency: apiData.currency,
      interestRate: apiData.interest_rate,
      isActive: apiData.is_active,
      metadataRaw: JSON.stringify(apiData.metadata || {}),
      createdAt: new Date(apiData.created_at),
      updatedAt: new Date(apiData.updated_at),
      ...(apiData.synced_at && { syncedAt: new Date(apiData.synced_at) }),
    };
  }

  /**
   * Validate account data
   */
  static validate(data: {
    name: string;
    accountType: AccountType;
    balance: number;
    currency: Currency;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Account name is required');
    }

    if (!data.accountType) {
      errors.push('Account type is required');
    }

    if (typeof data.balance !== 'number' || isNaN(data.balance)) {
      errors.push('Valid balance is required');
    }

    if (!data.currency) {
      errors.push('Currency is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
