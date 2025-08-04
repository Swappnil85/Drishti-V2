/**
 * Financial Institution Service
 * Handles CRUD operations for financial institutions
 */

import { query, transaction } from '../../db/connection';
import { AppError, SystemErrors, ValidationErrors } from '../../utils/errors';
import type { 
  FinancialInstitution, 
  InstitutionType, 
  AccountType 
} from '@drishti/shared/types/financial';

// DTOs for institution operations
export interface CreateFinancialInstitutionDto {
  name: string;
  institution_type: InstitutionType;
  routing_number?: string;
  swift_code?: string;
  website?: string;
  logo_url?: string;
  country?: string;
  default_interest_rates?: Record<AccountType, number>;
  supported_account_types?: AccountType[];
  metadata?: Record<string, any>;
}

export interface UpdateFinancialInstitutionDto {
  name?: string;
  institution_type?: InstitutionType;
  routing_number?: string;
  swift_code?: string;
  website?: string;
  logo_url?: string;
  country?: string;
  default_interest_rates?: Record<AccountType, number>;
  supported_account_types?: AccountType[];
  is_active?: boolean;
  metadata?: Record<string, any>;
}

export interface InstitutionSearchQuery {
  search?: string;
  institution_type?: InstitutionType;
  country?: string;
  account_type?: AccountType;
  page?: number;
  limit?: number;
}

export interface InstitutionSearchResult {
  success: boolean;
  data: FinancialInstitution[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class FinancialInstitutionService {
  /**
   * Create a new financial institution
   */
  async createInstitution(
    institutionData: CreateFinancialInstitutionDto
  ): Promise<FinancialInstitution> {
    try {
      const result = await query<FinancialInstitution>(
        `
        INSERT INTO financial_institutions (
          name, institution_type, routing_number, swift_code, website, 
          logo_url, country, default_interest_rates, supported_account_types, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `,
        [
          institutionData.name,
          institutionData.institution_type,
          institutionData.routing_number || null,
          institutionData.swift_code || null,
          institutionData.website || null,
          institutionData.logo_url || null,
          institutionData.country || 'USA',
          JSON.stringify(institutionData.default_interest_rates || {}),
          JSON.stringify(institutionData.supported_account_types || []),
          JSON.stringify(institutionData.metadata || {}),
        ]
      );

      if (result.rows.length === 0) {
        throw SystemErrors.databaseError(
          new Error('Failed to create financial institution')
        );
      }

      return this.formatInstitution(result.rows[0]);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw SystemErrors.databaseError(error as Error);
    }
  }

  /**
   * Search financial institutions with filters
   */
  async searchInstitutions(
    searchQuery: InstitutionSearchQuery = {}
  ): Promise<InstitutionSearchResult> {
    try {
      const {
        search = '',
        institution_type,
        country,
        account_type,
        page = 1,
        limit = 50,
      } = searchQuery;

      const offset = (page - 1) * limit;
      let whereConditions = ['is_active = true'];
      let queryParams: any[] = [];
      let paramIndex = 1;

      // Add search condition
      if (search.trim()) {
        whereConditions.push(`name ILIKE $${paramIndex}`);
        queryParams.push(`%${search.trim()}%`);
        paramIndex++;
      }

      // Add institution type filter
      if (institution_type) {
        whereConditions.push(`institution_type = $${paramIndex}`);
        queryParams.push(institution_type);
        paramIndex++;
      }

      // Add country filter
      if (country) {
        whereConditions.push(`country = $${paramIndex}`);
        queryParams.push(country);
        paramIndex++;
      }

      // Add account type filter (check if supported)
      if (account_type) {
        whereConditions.push(`supported_account_types @> $${paramIndex}`);
        queryParams.push(JSON.stringify([account_type]));
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) as total FROM financial_institutions ${whereClause}`,
        queryParams
      );
      const total = parseInt(countResult.rows[0].total);

      // Get institutions with pagination
      const result = await query<FinancialInstitution>(
        `
        SELECT *
        FROM financial_institutions
        ${whereClause}
        ORDER BY name ASC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `,
        [...queryParams, limit, offset]
      );

      const institutions = result.rows.map(row => this.formatInstitution(row));

      return {
        success: true,
        data: institutions,
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
   * Get institution by ID
   */
  async getInstitutionById(institutionId: string): Promise<FinancialInstitution | null> {
    try {
      const result = await query<FinancialInstitution>(
        `
        SELECT *
        FROM financial_institutions
        WHERE id = $1 AND is_active = true
      `,
        [institutionId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.formatInstitution(result.rows[0]);
    } catch (error) {
      throw SystemErrors.databaseError(error as Error);
    }
  }

  /**
   * Get institution by routing number
   */
  async getInstitutionByRoutingNumber(routingNumber: string): Promise<FinancialInstitution | null> {
    try {
      const result = await query<FinancialInstitution>(
        `
        SELECT *
        FROM financial_institutions
        WHERE routing_number = $1 AND is_active = true
      `,
        [routingNumber]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.formatInstitution(result.rows[0]);
    } catch (error) {
      throw SystemErrors.databaseError(error as Error);
    }
  }

  /**
   * Update financial institution
   */
  async updateInstitution(
    institutionId: string,
    updateData: UpdateFinancialInstitutionDto
  ): Promise<FinancialInstitution | null> {
    try {
      const setClause: string[] = [];
      const queryParams: any[] = [];
      let paramIndex = 1;

      // Build dynamic update query
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'default_interest_rates' || key === 'supported_account_types' || key === 'metadata') {
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

      queryParams.push(institutionId);

      const result = await query<FinancialInstitution>(
        `
        UPDATE financial_institutions
        SET ${setClause.join(', ')}, updated_at = NOW()
        WHERE id = $${paramIndex}
        RETURNING *
      `,
        queryParams
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.formatInstitution(result.rows[0]);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw SystemErrors.databaseError(error as Error);
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
        return 0.01; // Default 1% if institution not found
      }

      const rates = institution.default_interest_rates as Record<AccountType, number>;
      return rates[accountType] || 0.01;
    } catch (error) {
      return 0.01; // Default fallback
    }
  }

  /**
   * Format institution data from database
   */
  private formatInstitution(row: any): FinancialInstitution {
    return {
      id: row.id,
      name: row.name,
      institution_type: row.institution_type,
      routing_number: row.routing_number,
      swift_code: row.swift_code,
      website: row.website,
      logo_url: row.logo_url,
      country: row.country,
      is_active: row.is_active,
      default_interest_rates: typeof row.default_interest_rates === 'string' 
        ? JSON.parse(row.default_interest_rates) 
        : row.default_interest_rates,
      supported_account_types: typeof row.supported_account_types === 'string'
        ? JSON.parse(row.supported_account_types)
        : row.supported_account_types,
      metadata: typeof row.metadata === 'string' 
        ? JSON.parse(row.metadata) 
        : row.metadata,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
      synced_at: row.synced_at?.toISOString(),
    };
  }
}

export const financialInstitutionService = new FinancialInstitutionService();
