import { Model, Q } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';
import { TABLE_NAMES } from '../schema';
import type {
  InstitutionType,
  AccountType,
} from '@drishti/shared/types/financial';

/**
 * FinancialInstitution model for WatermelonDB
 * Represents a financial institution (bank, credit union, etc.)
 */
export default class FinancialInstitution extends Model {
  static table = TABLE_NAMES.FINANCIAL_INSTITUTIONS;

  // Institution fields
  @field('name') name: string = '';
  @field('institution_type') institutionType: InstitutionType = 'bank';
  @field('routing_number') routingNumber?: string;
  @field('swift_code') swiftCode?: string;
  @field('website') website?: string;
  @field('logo_url') logoUrl?: string;
  @field('country') country: string = '';
  @field('is_active') isActive: boolean = true;
  @field('default_interest_rates') defaultInterestRatesRaw: string = '{}'; // JSON string
  @field('supported_account_types') supportedAccountTypesRaw: string = '[]'; // JSON string
  @field('metadata') metadataRaw: string = '{}'; // JSON string

  // Timestamps
  @readonly @date('created_at') createdAt: Date = new Date();
  @readonly @date('updated_at') updatedAt: Date = new Date();
  @date('synced_at') syncedAt?: Date;

  /**
   * Get parsed default interest rates
   */
  get defaultInterestRates(): Record<AccountType, number> {
    try {
      return JSON.parse(this.defaultInterestRatesRaw || '{}');
    } catch {
      return {} as Record<AccountType, number>;
    }
  }

  /**
   * Set default interest rates (will be stringified)
   */
  set defaultInterestRates(value: Record<AccountType, number>) {
    this.defaultInterestRatesRaw = JSON.stringify(value);
  }

  /**
   * Get parsed supported account types
   */
  get supportedAccountTypes(): AccountType[] {
    try {
      return JSON.parse(this.supportedAccountTypesRaw || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Set supported account types (will be stringified)
   */
  set supportedAccountTypes(value: AccountType[]) {
    this.supportedAccountTypesRaw = JSON.stringify(value);
  }

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
   * Get default interest rate for specific account type
   */
  getDefaultInterestRate(accountType: AccountType): number {
    const rates = this.defaultInterestRates;
    return rates[accountType] || 0.01; // Default 1%
  }

  /**
   * Check if institution supports account type
   */
  supportsAccountType(accountType: AccountType): boolean {
    return this.supportedAccountTypes.includes(accountType);
  }

  /**
   * Get institution display name with type
   */
  get displayName(): string {
    const typeMap: Record<InstitutionType, string> = {
      bank: 'Bank',
      credit_union: 'Credit Union',
      investment: 'Investment',
      insurance: 'Insurance',
      fintech: 'Fintech',
      other: 'Other',
    };

    return `${this.name} (${typeMap[this.institutionType]})`;
  }

  /**
   * Get institution logo or fallback
   */
  get logoUrlOrFallback(): string {
    if (this.logoUrl) {
      return this.logoUrl;
    }

    // Generate fallback logo URL based on institution type
    const fallbackLogos: Record<InstitutionType, string> = {
      bank: 'https://via.placeholder.com/64/2196F3/FFFFFF?text=B',
      credit_union: 'https://via.placeholder.com/64/4CAF50/FFFFFF?text=CU',
      investment: 'https://via.placeholder.com/64/FF9800/FFFFFF?text=I',
      insurance: 'https://via.placeholder.com/64/9C27B0/FFFFFF?text=IN',
      fintech: 'https://via.placeholder.com/64/E91E63/FFFFFF?text=FT',
      other: 'https://via.placeholder.com/64/607D8B/FFFFFF?text=O',
    };

    return fallbackLogos[this.institutionType];
  }

  /**
   * Search institutions by name
   */
  static async searchByName(
    database: any,
    searchTerm: string,
    limit = 20
  ): Promise<FinancialInstitution[]> {
    const collection = database.get(TABLE_NAMES.FINANCIAL_INSTITUTIONS);
    return await collection
      .query(
        Q.where('name', Q.like(`%${Q.sanitizeLikeString(searchTerm)}%`)),
        Q.where('is_active', true),
        Q.sortBy('name', Q.asc),
        Q.take(limit)
      )
      .fetch();
  }

  /**
   * Get institutions by type
   */
  static async getByType(
    database: any,
    institutionType: InstitutionType
  ): Promise<FinancialInstitution[]> {
    const collection = database.get(TABLE_NAMES.FINANCIAL_INSTITUTIONS);
    return await collection
      .query(
        Q.where('institution_type', institutionType),
        Q.where('is_active', true),
        Q.sortBy('name', Q.asc)
      )
      .fetch();
  }

  /**
   * Get institutions that support specific account type
   */
  static async getBySupportedAccountType(
    database: any,
    accountType: AccountType
  ): Promise<FinancialInstitution[]> {
    const collection = database.get(TABLE_NAMES.FINANCIAL_INSTITUTIONS);
    return await collection
      .query(Q.where('is_active', true), Q.sortBy('name', Q.asc))
      .fetch()
      .then((institutions: FinancialInstitution[]) =>
        institutions.filter(inst => inst.supportsAccountType(accountType))
      );
  }

  /**
   * Find institution by routing number
   */
  static async findByRoutingNumber(
    database: any,
    routingNumber: string
  ): Promise<FinancialInstitution | null> {
    const collection = database.get(TABLE_NAMES.FINANCIAL_INSTITUTIONS);
    const results = await collection
      .query(
        Q.where('routing_number', routingNumber),
        Q.where('is_active', true)
      )
      .fetch();

    return results.length > 0 ? results[0] : null;
  }

  /**
   * Convert to API format
   */
  toAPI(): {
    id: string;
    name: string;
    institution_type: InstitutionType;
    routing_number?: string;
    swift_code?: string;
    website?: string;
    logo_url?: string;
    country: string;
    is_active: boolean;
    default_interest_rates: Record<AccountType, number>;
    supported_account_types: AccountType[];
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
    synced_at?: string;
  } {
    return {
      id: this.id,
      name: this.name,
      institution_type: this.institutionType,
      ...(this.routingNumber && { routing_number: this.routingNumber }),
      ...(this.swiftCode && { swift_code: this.swiftCode }),
      ...(this.website && { website: this.website }),
      ...(this.logoUrl && { logo_url: this.logoUrl }),
      country: this.country,
      is_active: this.isActive,
      default_interest_rates: this.defaultInterestRates,
      supported_account_types: this.supportedAccountTypes,
      metadata: this.metadata,
      created_at: this.createdAt.toISOString(),
      updated_at: this.updatedAt.toISOString(),
      ...(this.syncedAt && { synced_at: this.syncedAt.toISOString() }),
    };
  }

  /**
   * Create from API data
   */
  static fromAPI(apiData: any): Partial<FinancialInstitution> {
    return {
      id: apiData.id,
      name: apiData.name,
      institutionType: apiData.institution_type,
      routingNumber: apiData.routing_number,
      swiftCode: apiData.swift_code,
      website: apiData.website,
      logoUrl: apiData.logo_url,
      country: apiData.country,
      isActive: apiData.is_active,
      defaultInterestRatesRaw: JSON.stringify(
        apiData.default_interest_rates || {}
      ),
      supportedAccountTypesRaw: JSON.stringify(
        apiData.supported_account_types || []
      ),
      metadataRaw: JSON.stringify(apiData.metadata || {}),
      createdAt: new Date(apiData.created_at),
      updatedAt: new Date(apiData.updated_at),
      ...(apiData.synced_at && { syncedAt: new Date(apiData.synced_at) }),
    };
  }
}
