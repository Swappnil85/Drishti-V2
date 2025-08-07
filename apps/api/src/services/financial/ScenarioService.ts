import { query, transaction } from '../../db/connection';
import {
  Scenario,
  CreateScenarioDto,
  UpdateScenarioDto,
  FinancialPaginatedResponse,
  ScenarioGoal,
  DEFAULT_SCENARIO_ASSUMPTIONS,
} from '@drishti/shared/types/financial';
import { AppError, SystemErrors, ValidationErrors } from '../../utils/errors';

export class ScenarioService {
  private static instance: ScenarioService;

  public static getInstance(): ScenarioService {
    if (!ScenarioService.instance) {
      ScenarioService.instance = new ScenarioService();
    }
    return ScenarioService.instance;
  }

  /**
   * Create a new financial scenario for a user
   */
  async createScenario(
    userId: string,
    scenarioData: CreateScenarioDto
  ): Promise<Scenario> {
    try {
      return await transaction(async client => {
        // If this is set as default, unset other defaults
        if (scenarioData.is_default) {
          await client.query(
            `
            UPDATE scenarios
            SET is_default = false, synced_at = NOW()
            WHERE user_id = $1 AND is_default = true
          `,
            [userId]
          );
        }

        // Merge with default assumptions
        const assumptions = {
          ...DEFAULT_SCENARIO_ASSUMPTIONS,
          ...scenarioData.assumptions,
        };

        const result = await client.query(
          `
          INSERT INTO scenarios (
            user_id, name, description, assumptions, is_default
          ) VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `,
          [
            userId,
            scenarioData.name,
            scenarioData.description || null,
            JSON.stringify(assumptions),
            scenarioData.is_default || false,
          ]
        );

        if (result.rows.length === 0) {
          throw SystemErrors.databaseError(
            new Error('Failed to create scenario')
          );
        }

        return this.formatScenario(result.rows[0]);
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw SystemErrors.databaseError(error as Error);
    }
  }

  /**
   * Get all scenarios for a user with pagination
   */
  async getUserScenarios(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      isActive?: boolean;
      isDefault?: boolean;
    } = {}
  ): Promise<FinancialPaginatedResponse<Scenario>> {
    try {
      const { page = 1, limit = 20, isActive, isDefault } = options;

      const offset = (page - 1) * limit;
      let whereConditions = ['user_id = $1'];
      let queryParams: any[] = [userId];
      let paramIndex = 2;

      // Add optional filters
      if (isActive !== undefined) {
        whereConditions.push(`is_active = $${paramIndex}`);
        queryParams.push(isActive);
        paramIndex++;
      }

      if (isDefault !== undefined) {
        whereConditions.push(`is_default = $${paramIndex}`);
        queryParams.push(isDefault);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Get total count
      const countResult = await query<{ count: string }>(
        `
        SELECT COUNT(*) as count
        FROM scenarios
        WHERE ${whereClause}
      `,
        queryParams
      );

      const total = parseInt(countResult.rows[0].count, 10);

      // Get paginated results
      const result = await query<Scenario>(
        `
        SELECT *
        FROM scenarios
        WHERE ${whereClause}
        ORDER BY is_default DESC, created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `,
        [...queryParams, limit, offset]
      );

      const scenarios = result.rows.map(row => this.formatScenario(row));

      return {
        success: true,
        data: scenarios,
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
   * Get all scenarios for a user
   */
  async getScenariosByUserId(userId: string): Promise<Scenario[]> {
    try {
      const result = await query<Scenario>(
        `
        SELECT * FROM scenarios
        WHERE user_id = $1 AND is_active = true
        ORDER BY created_at DESC
        `,
        [userId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching user scenarios:', error);
      throw new Error('Failed to fetch user scenarios');
    }
  }

  /**
   * Get a specific scenario by ID
   */
  async getScenarioById(
    userId: string,
    scenarioId: string
  ): Promise<Scenario | null> {
    try {
      const result = await query<Scenario>(
        `
        SELECT *
        FROM scenarios
        WHERE id = $1 AND user_id = $2
      `,
        [scenarioId, userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.formatScenario(result.rows[0]);
    } catch (error) {
      throw SystemErrors.databaseError(error as Error);
    }
  }

  /**
   * Get user's default scenario
   */
  async getDefaultScenario(userId: string): Promise<Scenario | null> {
    try {
      const result = await query<Scenario>(
        `
        SELECT *
        FROM scenarios
        WHERE user_id = $1 AND is_default = true AND is_active = true
        LIMIT 1
      `,
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.formatScenario(result.rows[0]);
    } catch (error) {
      throw SystemErrors.databaseError(error as Error);
    }
  }

  /**
   * Update a scenario
   */
  async updateScenario(
    userId: string,
    scenarioId: string,
    updateData: UpdateScenarioDto
  ): Promise<Scenario | null> {
    try {
      return await transaction(async client => {
        // If setting as default, unset other defaults
        if (updateData.is_default) {
          await client.query(
            `
            UPDATE scenarios
            SET is_default = false, synced_at = NOW()
            WHERE user_id = $1 AND is_default = true AND id != $2
          `,
            [userId, scenarioId]
          );
        }

        const setClause: string[] = [];
        const queryParams: any[] = [];
        let paramIndex = 1;

        // Build dynamic SET clause
        Object.entries(updateData).forEach(([key, value]) => {
          if (value !== undefined) {
            if (key === 'assumptions' || key === 'projections') {
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

        queryParams.push(scenarioId, userId);

        const result = await client.query(
          `
          UPDATE scenarios
          SET ${setClause.join(', ')}
          WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
          RETURNING *
        `,
          queryParams
        );

        if (result.rows.length === 0) {
          return null;
        }

        return this.formatScenario(result.rows[0]);
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw SystemErrors.databaseError(error as Error);
    }
  }

  /**
   * Delete a scenario (soft delete by setting is_active = false)
   */
  async deleteScenario(userId: string, scenarioId: string): Promise<boolean> {
    try {
      const result = await query(
        `
        UPDATE scenarios
        SET is_active = false, is_default = false, synced_at = NOW()
        WHERE id = $1 AND user_id = $2
      `,
        [scenarioId, userId]
      );

      return result.rowCount > 0;
    } catch (error) {
      throw SystemErrors.databaseError(error as Error);
    }
  }

  /**
   * Add goals to a scenario
   */
  async addGoalsToScenario(
    userId: string,
    scenarioId: string,
    goalIds: string[],
    allocationPercentages?: number[]
  ): Promise<ScenarioGoal[]> {
    try {
      return await transaction(async client => {
        // Verify scenario belongs to user
        const scenarioResult = await client.query(
          `
          SELECT id FROM scenarios WHERE id = $1 AND user_id = $2
        `,
          [scenarioId, userId]
        );

        if (scenarioResult.rows.length === 0) {
          throw ValidationErrors.invalidInput('Scenario not found');
        }

        // Verify goals belong to user
        const goalsResult = await client.query(
          `
          SELECT id FROM financial_goals 
          WHERE id = ANY($1) AND user_id = $2 AND is_active = true
        `,
          [goalIds, userId]
        );

        if (goalsResult.rows.length !== goalIds.length) {
          throw ValidationErrors.invalidInput('One or more goals not found');
        }

        const scenarioGoals: ScenarioGoal[] = [];

        for (let i = 0; i < goalIds.length; i++) {
          const goalId = goalIds[i];
          const allocation = allocationPercentages?.[i] || 100;

          // Insert or update scenario goal
          const result = await client.query(
            `
            INSERT INTO scenario_goals (scenario_id, goal_id, allocation_percentage)
            VALUES ($1, $2, $3)
            ON CONFLICT (scenario_id, goal_id)
            DO UPDATE SET allocation_percentage = $3, updated_at = NOW()
            RETURNING *
          `,
            [scenarioId, goalId, allocation]
          );

          if (result.rows.length > 0) {
            scenarioGoals.push(this.formatScenarioGoal(result.rows[0]));
          }
        }

        return scenarioGoals;
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw SystemErrors.databaseError(error as Error);
    }
  }

  /**
   * Get goals associated with a scenario
   */
  async getScenarioGoals(
    userId: string,
    scenarioId: string
  ): Promise<
    Array<{
      goal: any;
      allocation_percentage: number;
    }>
  > {
    try {
      const result = await query(
        `
        SELECT 
          fg.*,
          sg.allocation_percentage
        FROM scenario_goals sg
        JOIN financial_goals fg ON sg.goal_id = fg.id
        WHERE sg.scenario_id = $1 AND fg.user_id = $2 AND fg.is_active = true
        ORDER BY fg.priority ASC, fg.target_date ASC NULLS LAST
      `,
        [scenarioId, userId]
      );

      return result.rows.map(row => ({
        goal: {
          id: row.id,
          user_id: row.user_id,
          name: row.name,
          goal_type: row.goal_type,
          target_amount: parseFloat(row.target_amount),
          current_amount: parseFloat(row.current_amount),
          target_date: row.target_date,
          priority: row.priority,
          description: row.description,
          is_active: row.is_active,
          metadata:
            typeof row.metadata === 'string'
              ? JSON.parse(row.metadata)
              : row.metadata,
          created_at: row.created_at,
          updated_at: row.updated_at,
          synced_at: row.synced_at,
        },
        allocation_percentage: parseFloat(row.allocation_percentage),
      }));
    } catch (error) {
      throw SystemErrors.databaseError(error as Error);
    }
  }

  /**
   * Remove goals from a scenario
   */
  async removeGoalsFromScenario(
    userId: string,
    scenarioId: string,
    goalIds: string[]
  ): Promise<boolean> {
    try {
      // Verify scenario belongs to user
      const scenarioResult = await query(
        `
        SELECT id FROM scenarios WHERE id = $1 AND user_id = $2
      `,
        [scenarioId, userId]
      );

      if (scenarioResult.rows.length === 0) {
        throw ValidationErrors.invalidInput('Scenario not found');
      }

      const result = await query(
        `
        DELETE FROM scenario_goals
        WHERE scenario_id = $1 AND goal_id = ANY($2)
      `,
        [scenarioId, goalIds]
      );

      return result.rowCount > 0;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw SystemErrors.databaseError(error as Error);
    }
  }

  /**
   * Calculate scenario projections based on assumptions and goals
   */
  async calculateProjections(
    userId: string,
    scenarioId: string
  ): Promise<Scenario | null> {
    try {
      return await transaction(async client => {
        // Get scenario with goals
        const scenario = await this.getScenarioById(userId, scenarioId);
        if (!scenario) return null;

        const scenarioGoals = await this.getScenarioGoals(userId, scenarioId);

        // Simple projection calculation (can be enhanced with more sophisticated algorithms)
        const projections = this.performProjectionCalculations(
          scenario,
          scenarioGoals
        );

        // Update scenario with projections
        const result = await client.query(
          `
          UPDATE scenarios
          SET projections = $1, synced_at = NOW()
          WHERE id = $2 AND user_id = $3
          RETURNING *
        `,
          [JSON.stringify(projections), scenarioId, userId]
        );

        if (result.rows.length === 0) {
          return null;
        }

        return this.formatScenario(result.rows[0]);
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw SystemErrors.databaseError(error as Error);
    }
  }

  /**
   * Perform projection calculations (simplified version)
   */
  private performProjectionCalculations(
    scenario: Scenario,
    scenarioGoals: any[]
  ): any {
    const assumptions = scenario.assumptions;
    const currentYear = new Date().getFullYear();
    const retirementYear = currentYear + (assumptions.retirement_age - 30); // Assuming current age ~30

    // Calculate total goal amounts
    const totalTargetAmount = scenarioGoals.reduce(
      (sum, sg) => sum + sg.goal.target_amount,
      0
    );
    const totalCurrentAmount = scenarioGoals.reduce(
      (sum, sg) => sum + sg.goal.current_amount,
      0
    );

    // Simple compound growth calculation
    const yearsToRetirement = retirementYear - currentYear;
    const monthlyContribution =
      (totalTargetAmount * assumptions.savings_rate) / 12;

    // Future value calculation with compound interest
    const futureValue = this.calculateFutureValue(
      totalCurrentAmount,
      monthlyContribution,
      assumptions.market_return,
      yearsToRetirement
    );

    // Calculate monthly retirement income (4% rule)
    const monthlyRetirementIncome = (futureValue * 0.04) / 12;

    // Generate net worth projection
    const netWorthProjection = [];
    for (let year = currentYear; year <= retirementYear + 10; year++) {
      const yearsFromNow = year - currentYear;
      const projectedValue = this.calculateFutureValue(
        totalCurrentAmount,
        monthlyContribution,
        assumptions.market_return,
        yearsFromNow
      );
      netWorthProjection.push({
        year,
        amount: Math.round(projectedValue),
      });
    }

    return {
      retirement_savings: Math.round(futureValue),
      monthly_retirement_income: Math.round(monthlyRetirementIncome),
      net_worth_projection: netWorthProjection,
      calculated_at: new Date().toISOString(),
    };
  }

  /**
   * Calculate future value with compound interest and regular contributions
   */
  private calculateFutureValue(
    presentValue: number,
    monthlyContribution: number,
    annualRate: number,
    years: number
  ): number {
    const monthlyRate = annualRate / 12;
    const totalMonths = years * 12;

    // Future value of present amount
    const fvPresent = presentValue * Math.pow(1 + monthlyRate, totalMonths);

    // Future value of annuity (monthly contributions)
    const fvAnnuity =
      monthlyContribution *
      ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);

    return fvPresent + fvAnnuity;
  }

  /**
   * Format scenario data from database
   */
  private formatScenario(row: any): Scenario {
    return {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      description: row.description,
      assumptions:
        typeof row.assumptions === 'string'
          ? JSON.parse(row.assumptions)
          : row.assumptions,
      projections:
        typeof row.projections === 'string'
          ? JSON.parse(row.projections)
          : row.projections,
      is_active: row.is_active,
      is_default: row.is_default,
      created_at: row.created_at,
      updated_at: row.updated_at,
      synced_at: row.synced_at,
    };
  }

  /**
   * Format scenario goal data from database
   */
  private formatScenarioGoal(row: any): ScenarioGoal {
    return {
      id: row.id,
      scenario_id: row.scenario_id,
      goal_id: row.goal_id,
      allocation_percentage: parseFloat(row.allocation_percentage),
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

export const scenarioService = ScenarioService.getInstance();
