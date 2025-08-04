/**
 * Institution Service
 * Handles financial institution operations for the mobile app
 */

import { Q } from '@nozbe/watermelondb';
import { database } from '../../database';
import FinancialInstitution from '../../database/models/FinancialInstitution';
import { AuthService } from '../auth/AuthService';
import type {
  InstitutionType,
  AccountType,
  FinancialInstitution as FinancialInstitutionType,
} from '@drishti/shared/types/financial';

export interface InstitutionSearchOptions {
  search?: string;
  institutionType?: InstitutionType;
  accountType?: AccountType;
  country?: string;
  limit?: number;
}

export interface InstitutionSearchResult {
  institutions: FinancialInstitution[];
  hasMore: boolean;
  total: number;
}

class InstitutionService {
  private static instance: InstitutionService;
  private apiBaseUrl: string;

  private constructor() {
    this.apiBaseUrl =
      process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
  }

  static getInstance(): InstitutionService {
    if (!InstitutionService.instance) {
      InstitutionService.instance = new InstitutionService();
    }
    return InstitutionService.instance;
  }

  /**
   * Search institutions locally first, then fetch from API if needed
   */
  async searchInstitutions(
    options: InstitutionSearchOptions = {}
  ): Promise<InstitutionSearchResult> {
    try {
      const {
        search = '',
        institutionType,
        accountType,
        country = 'USA',
        limit = 20,
      } = options;

      // First try local search
      const localResults = await this.searchInstitutionsLocally(options);

      // If we have enough local results or no search term, return local results
      if (localResults.institutions.length >= limit || !search.trim()) {
        return localResults;
      }

      // Otherwise, fetch from API and sync to local database
      await this.syncInstitutionsFromAPI(options);

      // Return updated local results
      return await this.searchInstitutionsLocally(options);
    } catch (error) {
      console.error('Error searching institutions:', error);
      // Fallback to local search only
      return await this.searchInstitutionsLocally(options);
    }
  }

  /**
   * Search institutions in local database
   */
  private async searchInstitutionsLocally(
    options: InstitutionSearchOptions
  ): Promise<InstitutionSearchResult> {
    const { search = '', institutionType, accountType, limit = 20 } = options;

    const collection = database.get('financial_institutions');
    let query = collection.query();

    // Add search filter
    if (search.trim()) {
      query = collection.query(
        Q.where('name', Q.like(`%${Q.sanitizeLikeString(search.trim())}%`))
      );
    }

    // Add institution type filter
    if (institutionType) {
      query = collection.query(Q.where('institution_type', institutionType));
    }

    // Add active filter
    query = collection.query(
      Q.where('is_active', true),
      Q.sortBy('name', Q.asc),
      Q.take(limit)
    );

    const institutions = (await query.fetch()) as FinancialInstitution[];

    // Filter by account type if specified (requires parsing JSON)
    let filteredInstitutions = institutions;
    if (accountType) {
      filteredInstitutions = institutions.filter(inst =>
        inst.supportsAccountType(accountType)
      );
    }

    return {
      institutions: filteredInstitutions.slice(0, limit),
      hasMore: filteredInstitutions.length > limit,
      total: filteredInstitutions.length,
    };
  }

  /**
   * Sync institutions from API to local database
   */
  private async syncInstitutionsFromAPI(
    options: InstitutionSearchOptions
  ): Promise<void> {
    try {
      const authService = AuthService.getInstance();
      const tokens = authService.getTokens();

      if (!tokens?.accessToken) {
        throw new Error('No access token available');
      }

      const queryParams = new URLSearchParams();
      if (options.search) queryParams.append('search', options.search);
      if (options.institutionType)
        queryParams.append('institution_type', options.institutionType);
      if (options.accountType)
        queryParams.append('account_type', options.accountType);
      if (options.country) queryParams.append('country', options.country);
      if (options.limit) queryParams.append('limit', options.limit.toString());

      const response = await fetch(
        `${this.apiBaseUrl}/financial/institutions?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        await this.saveInstitutionsToLocal(result.data);
      }
    } catch (error) {
      console.error('Error syncing institutions from API:', error);
      // Don't throw - allow local search to continue
    }
  }

  /**
   * Save institutions to local database
   */
  private async saveInstitutionsToLocal(
    institutions: FinancialInstitutionType[]
  ): Promise<void> {
    try {
      await database.write(async () => {
        const collection = database.get('financial_institutions');

        for (const institutionData of institutions) {
          // Check if institution already exists
          const existing = await collection
            .find(institutionData.id)
            .catch(() => null);

          if (existing) {
            // Update existing institution
            await existing.update((institution: FinancialInstitution) => {
              Object.assign(
                institution,
                FinancialInstitution.fromAPI(institutionData)
              );
            });
          } else {
            // Create new institution
            await collection.create((institution: FinancialInstitution) => {
              Object.assign(
                institution,
                FinancialInstitution.fromAPI(institutionData)
              );
            });
          }
        }
      });
    } catch (error) {
      console.error('Error saving institutions to local database:', error);
    }
  }

  /**
   * Get institution by ID
   */
  async getInstitutionById(
    institutionId: string
  ): Promise<FinancialInstitution | null> {
    try {
      const collection = database.get('financial_institutions');
      return await collection.find(institutionId);
    } catch (error) {
      console.error('Error getting institution by ID:', error);
      return null;
    }
  }

  /**
   * Find institution by routing number
   */
  async findByRoutingNumber(
    routingNumber: string
  ): Promise<FinancialInstitution | null> {
    try {
      return await FinancialInstitution.findByRoutingNumber(
        database,
        routingNumber
      );
    } catch (error) {
      console.error('Error finding institution by routing number:', error);
      return null;
    }
  }

  /**
   * Get institutions by type
   */
  async getInstitutionsByType(
    institutionType: InstitutionType
  ): Promise<FinancialInstitution[]> {
    try {
      return await FinancialInstitution.getByType(database, institutionType);
    } catch (error) {
      console.error('Error getting institutions by type:', error);
      return [];
    }
  }

  /**
   * Get institutions that support specific account type
   */
  async getInstitutionsBySupportedAccountType(
    accountType: AccountType
  ): Promise<FinancialInstitution[]> {
    try {
      return await FinancialInstitution.getBySupportedAccountType(
        database,
        accountType
      );
    } catch (error) {
      console.error(
        'Error getting institutions by supported account type:',
        error
      );
      return [];
    }
  }

  /**
   * Get default interest rate for account type at institution
   */
  async getDefaultInterestRate(
    institutionId: string,
    accountType: AccountType
  ): Promise<number> {
    try {
      const institution = await this.getInstitutionById(institutionId);
      if (!institution) {
        return 0.01; // Default 1%
      }
      return institution.getDefaultInterestRate(accountType);
    } catch (error) {
      console.error('Error getting default interest rate:', error);
      return 0.01; // Default fallback
    }
  }

  /**
   * Sync all institutions from API (for initial setup)
   */
  async syncAllInstitutions(): Promise<void> {
    try {
      const authService = AuthService.getInstance();
      const tokens = authService.getTokens();

      if (!tokens?.accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch(
        `${this.apiBaseUrl}/financial/institutions?limit=1000`,
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        await this.saveInstitutionsToLocal(result.data);
      }
    } catch (error) {
      console.error('Error syncing all institutions:', error);
      throw error;
    }
  }

  /**
   * Clear local institutions cache
   */
  async clearLocalInstitutions(): Promise<void> {
    try {
      await database.write(async () => {
        const collection = database.get('financial_institutions');
        const allInstitutions = await collection.query().fetch();

        for (const institution of allInstitutions) {
          await institution.markAsDeleted();
        }
      });
    } catch (error) {
      console.error('Error clearing local institutions:', error);
    }
  }
}

export const institutionService = InstitutionService.getInstance();
