import { Model } from '@nozbe/watermelondb';
import {
  field,
  readonly,
  date,
  relation,
} from '@nozbe/watermelondb/decorators';
import { TABLE_NAMES } from '../schema';
import type User from './User';
import type { GoalType, Priority } from '@drishti/shared/types/financial';

/**
 * FinancialGoal model for WatermelonDB
 * Represents a user's financial goal (savings, retirement, debt payoff, etc.)
 */
export default class FinancialGoal extends Model {
  static table = TABLE_NAMES.FINANCIAL_GOALS;

  // Goal fields
  @field('user_id') userId!: string;
  @field('name') name!: string;
  @field('goal_type') goalType!: GoalType;
  @field('target_amount') targetAmount!: number;
  @field('current_amount') currentAmount!: number;
  @field('target_date') targetDate?: string; // ISO date string
  @field('priority') priority!: Priority;
  @field('description') description?: string;
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
   * Get target date as Date object
   */
  get targetDateObject(): Date | null {
    if (!this.targetDate) return null;
    try {
      return new Date(this.targetDate);
    } catch {
      return null;
    }
  }

  /**
   * Get formatted target amount
   */
  get formattedTargetAmount(): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD', // TODO: Use user's preferred currency
    });
    return formatter.format(this.targetAmount);
  }

  /**
   * Get formatted current amount
   */
  get formattedCurrentAmount(): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD', // TODO: Use user's preferred currency
    });
    return formatter.format(this.currentAmount);
  }

  /**
   * Calculate progress percentage
   */
  get progressPercentage(): number {
    if (this.targetAmount <= 0) return 0;
    return Math.min((this.currentAmount / this.targetAmount) * 100, 100);
  }

  /**
   * Get remaining amount to reach goal
   */
  get remainingAmount(): number {
    return Math.max(this.targetAmount - this.currentAmount, 0);
  }

  /**
   * Get formatted remaining amount
   */
  get formattedRemainingAmount(): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD', // TODO: Use user's preferred currency
    });
    return formatter.format(this.remainingAmount);
  }

  /**
   * Check if goal is completed
   */
  get isCompleted(): boolean {
    return this.currentAmount >= this.targetAmount;
  }

  /**
   * Check if goal is overdue
   */
  get isOverdue(): boolean {
    if (!this.targetDateObject || this.isCompleted) return false;
    return new Date() > this.targetDateObject;
  }

  /**
   * Get days until target date
   */
  get daysUntilTarget(): number | null {
    if (!this.targetDateObject) return null;
    const today = new Date();
    const diffTime = this.targetDateObject.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get goal type display name
   */
  get goalTypeDisplayName(): string {
    const typeNames: Record<GoalType, string> = {
      savings: 'Savings Goal',
      retirement: 'Retirement Planning',
      debt_payoff: 'Debt Payoff',
      emergency_fund: 'Emergency Fund',
      investment: 'Investment Goal',
      other: 'Other Goal',
    };
    return typeNames[this.goalType] || 'Unknown Goal';
  }

  /**
   * Get priority display name
   */
  get priorityDisplayName(): string {
    const priorityNames: Record<Priority, string> = {
      1: 'Highest',
      2: 'High',
      3: 'Medium',
      4: 'Low',
      5: 'Lowest',
    };
    return priorityNames[this.priority] || 'Unknown';
  }

  /**
   * Get goal icon name based on type
   */
  get iconName(): string {
    const iconNames: Record<GoalType, string> = {
      savings: 'piggy-bank',
      retirement: 'account-clock',
      debt_payoff: 'credit-card-minus',
      emergency_fund: 'shield-check',
      investment: 'trending-up',
      other: 'target',
    };
    return iconNames[this.goalType] || 'target';
  }

  /**
   * Calculate required monthly savings to reach goal
   */
  get requiredMonthlySavings(): number | null {
    if (!this.targetDateObject || this.isCompleted) return null;

    const monthsRemaining = this.daysUntilTarget
      ? Math.max(this.daysUntilTarget / 30, 1)
      : null;
    if (!monthsRemaining) return null;

    return this.remainingAmount / monthsRemaining;
  }

  /**
   * Get formatted required monthly savings
   */
  get formattedRequiredMonthlySavings(): string | null {
    const amount = this.requiredMonthlySavings;
    if (amount === null) return null;

    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD', // TODO: Use user's preferred currency
    });
    return formatter.format(amount);
  }

  /**
   * Check if goal needs sync
   */
  get needsSync(): boolean {
    if (!this.syncedAt) return true;
    return this.updatedAt > this.syncedAt;
  }

  /**
   * Mark goal as synced
   */
  async markAsSynced(): Promise<void> {
    await this.update(goal => {
      goal.syncedAt = new Date();
    });
  }

  /**
   * Update goal progress
   */
  async updateProgress(newAmount: number): Promise<void> {
    await this.update(goal => {
      goal.currentAmount = Math.max(0, newAmount);
    });
  }

  /**
   * Add to goal progress
   */
  async addProgress(amount: number): Promise<void> {
    await this.update(goal => {
      goal.currentAmount = Math.max(0, goal.currentAmount + amount);
    });
  }

  /**
   * Update goal details
   */
  async updateDetails(updates: {
    name?: string;
    targetAmount?: number;
    targetDate?: string;
    priority?: Priority;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.update(goal => {
      if (updates.name !== undefined) goal.name = updates.name;
      if (updates.targetAmount !== undefined)
        goal.targetAmount = Math.max(0, updates.targetAmount);
      if (updates.targetDate !== undefined)
        goal.targetDate = updates.targetDate;
      if (updates.priority !== undefined) goal.priority = updates.priority;
      if (updates.description !== undefined)
        goal.description = updates.description;
      if (updates.metadata !== undefined) goal.metadata = updates.metadata;
    });
  }

  /**
   * Complete goal (set current amount to target amount)
   */
  async complete(): Promise<void> {
    await this.update(goal => {
      goal.currentAmount = goal.targetAmount;
    });
  }

  /**
   * Deactivate goal
   */
  async deactivate(): Promise<void> {
    await this.update(goal => {
      goal.isActive = false;
    });
  }

  /**
   * Activate goal
   */
  async activate(): Promise<void> {
    await this.update(goal => {
      goal.isActive = true;
    });
  }

  /**
   * Get goal summary for display
   */
  get summary(): {
    name: string;
    type: string;
    progress: string;
    target: string;
    remaining: string;
    daysLeft: number | null;
    isCompleted: boolean;
    isOverdue: boolean;
  } {
    return {
      name: this.name,
      type: this.goalTypeDisplayName,
      progress: `${this.progressPercentage.toFixed(1)}%`,
      target: this.formattedTargetAmount,
      remaining: this.formattedRemainingAmount,
      daysLeft: this.daysUntilTarget,
      isCompleted: this.isCompleted,
      isOverdue: this.isOverdue,
    };
  }

  /**
   * Convert to API format
   */
  toAPI(): {
    id: string;
    user_id: string;
    name: string;
    goal_type: GoalType;
    target_amount: number;
    current_amount: number;
    target_date?: string;
    priority: Priority;
    description?: string;
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
      goal_type: this.goalType,
      target_amount: this.targetAmount,
      current_amount: this.currentAmount,
      ...(this.targetDate && { target_date: this.targetDate }),
      priority: this.priority,
      ...(this.description && { description: this.description }),
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
  static fromAPI(apiData: any): Partial<FinancialGoal> {
    return {
      id: apiData.id,
      userId: apiData.user_id,
      name: apiData.name,
      goalType: apiData.goal_type,
      targetAmount: apiData.target_amount,
      currentAmount: apiData.current_amount,
      targetDate: apiData.target_date,
      priority: apiData.priority,
      description: apiData.description,
      isActive: apiData.is_active,
      metadataRaw: JSON.stringify(apiData.metadata || {}),
      createdAt: new Date(apiData.created_at),
      updatedAt: new Date(apiData.updated_at),
      ...(apiData.synced_at && { syncedAt: new Date(apiData.synced_at) }),
    };
  }
}
