import { Model } from '@nozbe/watermelondb';
import {
  field,
  readonly,
  date,
  relation,
} from '@nozbe/watermelondb/decorators';
import { TABLE_NAMES } from '../schema';
import type User from './User';
import type {
  ScenarioAssumptions,
  ScenarioProjections,
} from '@drishti/shared/types/financial';

/**
 * Scenario model for WatermelonDB
 * Represents a financial planning scenario with assumptions and projections
 */
export default class Scenario extends Model {
  static table = TABLE_NAMES.SCENARIOS;

  // Scenario fields
  @field('user_id') userId: string = '';
  @field('name') name: string = '';
  @field('description') description?: string;
  @field('assumptions') assumptionsRaw: string = '{}'; // JSON string
  @field('projections') projectionsRaw: string = '{}'; // JSON string
  @field('is_active') isActive: boolean = true;
  @field('is_default') isDefault: boolean = false;

  // Timestamps
  @readonly @date('created_at') createdAt: Date = new Date();
  @readonly @date('updated_at') updatedAt: Date = new Date();
  @date('synced_at') syncedAt?: Date;

  // Relationships
  @relation(TABLE_NAMES.USERS, 'user_id') user: User = {} as User;

  /**
   * Get parsed assumptions
   */
  get assumptions(): ScenarioAssumptions {
    try {
      return JSON.parse(this.assumptionsRaw || '{}');
    } catch {
      return {
        inflation_rate: 0.03,
        market_return: 0.07,
        savings_rate: 0.2,
        retirement_age: 65,
        life_expectancy: 85,
      };
    }
  }

  /**
   * Set assumptions (will be stringified)
   */
  set assumptions(value: ScenarioAssumptions) {
    this.assumptionsRaw = JSON.stringify(value);
  }

  /**
   * Get parsed projections
   */
  get projections(): ScenarioProjections {
    try {
      return JSON.parse(this.projectionsRaw || '{}');
    } catch {
      return {};
    }
  }

  /**
   * Set projections (will be stringified)
   */
  set projections(value: ScenarioProjections) {
    this.projectionsRaw = JSON.stringify(value);
  }

  /**
   * Get formatted inflation rate
   */
  get formattedInflationRate(): string {
    return `${(this.assumptions.inflation_rate * 100).toFixed(1)}%`;
  }

  /**
   * Get formatted market return
   */
  get formattedMarketReturn(): string {
    return `${(this.assumptions.market_return * 100).toFixed(1)}%`;
  }

  /**
   * Get formatted savings rate
   */
  get formattedSavingsRate(): string {
    return `${(this.assumptions.savings_rate * 100).toFixed(1)}%`;
  }

  /**
   * Get years until retirement
   */
  get yearsUntilRetirement(): number {
    const currentAge = 30; // TODO: Calculate from user's birth date
    const yearsToRetirement = this.assumptions.retirement_age - currentAge;
    return Math.max(0, yearsToRetirement);
  }

  /**
   * Get years in retirement
   */
  get yearsInRetirement(): number {
    return Math.max(
      0,
      this.assumptions.life_expectancy - this.assumptions.retirement_age
    );
  }

  /**
   * Get formatted retirement savings projection
   */
  get formattedRetirementSavings(): string | null {
    if (!this.projections.retirement_savings) return null;

    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return formatter.format(this.projections.retirement_savings);
  }

  /**
   * Get formatted monthly retirement income
   */
  get formattedMonthlyRetirementIncome(): string | null {
    if (!this.projections.monthly_retirement_income) return null;

    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return formatter.format(this.projections.monthly_retirement_income);
  }

  /**
   * Check if projections are available
   */
  get hasProjections(): boolean {
    return Object.keys(this.projections).length > 0;
  }

  /**
   * Check if projections are recent (calculated within last 24 hours)
   */
  get hasRecentProjections(): boolean {
    if (!this.projections.calculated_at) return false;

    try {
      const calculatedAt = new Date(this.projections.calculated_at);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return calculatedAt > oneDayAgo;
    } catch {
      return false;
    }
  }

  /**
   * Get scenario status
   */
  get status(): 'active' | 'inactive' | 'default' {
    if (!this.isActive) return 'inactive';
    if (this.isDefault) return 'default';
    return 'active';
  }

  /**
   * Get scenario icon name
   */
  get iconName(): string {
    if (this.isDefault) return 'star';
    return 'chart-line';
  }

  /**
   * Check if scenario needs sync
   */
  get needsSync(): boolean {
    if (!this.syncedAt) return true;
    return this.updatedAt > this.syncedAt;
  }

  /**
   * Mark scenario as synced
   */
  async markAsSynced(): Promise<void> {
    await this.update(scenario => {
      scenario.syncedAt = new Date();
    });
  }

  /**
   * Update scenario assumptions
   */
  async updateAssumptions(
    newAssumptions: Partial<ScenarioAssumptions>
  ): Promise<void> {
    await this.update(scenario => {
      scenario.assumptions = {
        ...scenario.assumptions,
        ...newAssumptions,
      };
    });
  }

  /**
   * Update scenario projections
   */
  async updateProjections(
    newProjections: Partial<ScenarioProjections>
  ): Promise<void> {
    await this.update(scenario => {
      scenario.projections = {
        ...scenario.projections,
        ...newProjections,
        calculated_at: new Date().toISOString(),
      };
    });
  }

  /**
   * Update scenario details
   */
  async updateDetails(updates: {
    name?: string;
    description?: string;
  }): Promise<void> {
    await this.update(scenario => {
      if (updates.name !== undefined) scenario.name = updates.name;
      if (updates.description !== undefined)
        scenario.description = updates.description;
    });
  }

  /**
   * Set as default scenario
   */
  async setAsDefault(): Promise<void> {
    await this.update(scenario => {
      scenario.isDefault = true;
    });
  }

  /**
   * Remove default status
   */
  async removeDefault(): Promise<void> {
    await this.update(scenario => {
      scenario.isDefault = false;
    });
  }

  /**
   * Deactivate scenario
   */
  async deactivate(): Promise<void> {
    await this.update(scenario => {
      scenario.isActive = false;
      scenario.isDefault = false; // Can't be default if inactive
    });
  }

  /**
   * Activate scenario
   */
  async activate(): Promise<void> {
    await this.update(scenario => {
      scenario.isActive = true;
    });
  }

  /**
   * Clear projections (force recalculation)
   */
  async clearProjections(): Promise<void> {
    await this.update(scenario => {
      scenario.projections = {};
    });
  }

  /**
   * Get scenario summary for display
   */
  get summary(): {
    name: string;
    description?: string;
    status: string;
    inflationRate: string;
    marketReturn: string;
    savingsRate: string;
    retirementAge: number;
    yearsUntilRetirement: number;
    hasProjections: boolean;
  } {
    return {
      name: this.name,
      ...(this.description && { description: this.description }),
      status: this.status,
      inflationRate: this.formattedInflationRate,
      marketReturn: this.formattedMarketReturn,
      savingsRate: this.formattedSavingsRate,
      retirementAge: this.assumptions.retirement_age,
      yearsUntilRetirement: this.yearsUntilRetirement,
      hasProjections: this.hasProjections,
    };
  }

  /**
   * Convert to API format
   */
  toAPI(): {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    assumptions: ScenarioAssumptions;
    projections: ScenarioProjections;
    is_active: boolean;
    is_default: boolean;
    created_at: string;
    updated_at: string;
    synced_at?: string;
  } {
    return {
      id: this.id,
      user_id: this.userId,
      name: this.name,
      ...(this.description && { description: this.description }),
      assumptions: this.assumptions,
      projections: this.projections,
      is_active: this.isActive,
      is_default: this.isDefault,
      created_at: this.createdAt.toISOString(),
      updated_at: this.updatedAt.toISOString(),
      ...(this.syncedAt && { synced_at: this.syncedAt.toISOString() }),
    };
  }

  /**
   * Create from API data
   */
  static fromAPI(apiData: any): Partial<Scenario> {
    return {
      id: apiData.id,
      userId: apiData.user_id,
      name: apiData.name,
      description: apiData.description,
      assumptionsRaw: JSON.stringify(apiData.assumptions || {}),
      projectionsRaw: JSON.stringify(apiData.projections || {}),
      isActive: apiData.is_active,
      isDefault: apiData.is_default,
      createdAt: new Date(apiData.created_at),
      updatedAt: new Date(apiData.updated_at),
      ...(apiData.synced_at && { syncedAt: new Date(apiData.synced_at) }),
    };
  }
}
