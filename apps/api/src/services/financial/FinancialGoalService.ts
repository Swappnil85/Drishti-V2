import { query, transaction } from '../../db/connection';
import {
  FinancialGoal,
  CreateFinancialGoalDto,
  UpdateFinancialGoalDto,
  FinancialPaginatedResponse,
  GoalProgress,
  CreateGoalProgressDto,
} from '@drishti/shared/types/financial';
import { AppError, SystemErrors, ValidationErrors } from '../../utils/errors';

export class FinancialGoalService {
  private static instance: FinancialGoalService;

  public static getInstance(): FinancialGoalService {
    if (!FinancialGoalService.instance) {
      FinancialGoalService.instance = new FinancialGoalService();
    }
    return FinancialGoalService.instance;
  }

  /**
   * Create a new financial goal for a user
   */
  async createGoal(
    userId: string,
    goalData: CreateFinancialGoalDto
  ): Promise<FinancialGoal> {
    try {
      const result = await query<FinancialGoal>(
        `
        INSERT INTO financial_goals (
          user_id, name, goal_type, target_amount, current_amount,
          target_date, priority, description, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `,
        [
          userId,
          goalData.name,
          goalData.goal_type,
          goalData.target_amount,
          goalData.current_amount || 0,
          goalData.target_date || null,
          goalData.priority || 3,
          goalData.description || null,
          JSON.stringify(goalData.metadata || {}),
        ]
      );

      if (result.rows.length === 0) {
        throw SystemErrors.databaseError(
          new Error('Failed to create financial goal')
        );
      }

      const goal = this.formatGoal(result.rows[0]);

      // Create initial progress entry if current_amount > 0
      if (goal.current_amount > 0) {
        await this.addGoalProgress(userId, goal.id, {
          goal_id: goal.id,
          amount: goal.current_amount,
          notes: 'Initial goal amount',
        });
      }

      return goal;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw SystemErrors.databaseError(error as Error);
    }
  }

  /**
   * Get all financial goals for a user with pagination
   */
  async getUserGoals(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      goalType?: string;
      isActive?: boolean;
      priority?: number;
    } = {}
  ): Promise<FinancialPaginatedResponse<FinancialGoal>> {
    try {
      const { page = 1, limit = 20, goalType, isActive, priority } = options;

      const offset = (page - 1) * limit;
      let whereConditions = ['user_id = $1'];
      let queryParams: any[] = [userId];
      let paramIndex = 2;

      // Add optional filters
      if (goalType) {
        whereConditions.push(`goal_type = $${paramIndex}`);
        queryParams.push(goalType);
        paramIndex++;
      }

      if (isActive !== undefined) {
        whereConditions.push(`is_active = $${paramIndex}`);
        queryParams.push(isActive);
        paramIndex++;
      }

      if (priority) {
        whereConditions.push(`priority = $${paramIndex}`);
        queryParams.push(priority);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Get total count
      const countResult = await query<{ count: string }>(
        `
        SELECT COUNT(*) as count
        FROM financial_goals
        WHERE ${whereClause}
      `,
        queryParams
      );

      const total = parseInt(countResult.rows[0].count, 10);

      // Get paginated results
      const result = await query<FinancialGoal>(
        `
        SELECT *
        FROM financial_goals
        WHERE ${whereClause}
        ORDER BY priority ASC, target_date ASC NULLS LAST, created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `,
        [...queryParams, limit, offset]
      );

      const goals = result.rows.map(row => this.formatGoal(row));

      return {
        success: true,
        data: goals,
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
   * Get a specific financial goal by ID
   */
  async getGoalById(
    userId: string,
    goalId: string
  ): Promise<FinancialGoal | null> {
    try {
      const result = await query<FinancialGoal>(
        `
        SELECT *
        FROM financial_goals
        WHERE id = $1 AND user_id = $2
      `,
        [goalId, userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.formatGoal(result.rows[0]);
    } catch (error) {
      throw SystemErrors.databaseError(error as Error);
    }
  }

  /**
   * Update a financial goal
   */
  async updateGoal(
    userId: string,
    goalId: string,
    updateData: UpdateFinancialGoalDto
  ): Promise<FinancialGoal | null> {
    try {
      return await transaction(async client => {
        // Get current goal for comparison
        const currentResult = await client.query(
          `
          SELECT current_amount FROM financial_goals
          WHERE id = $1 AND user_id = $2
        `,
          [goalId, userId]
        );

        if (currentResult.rows.length === 0) {
          return null;
        }

        const currentAmount = parseFloat(currentResult.rows[0].current_amount);

        const setClause: string[] = [];
        const queryParams: any[] = [];
        let paramIndex = 1;

        // Build dynamic SET clause
        Object.entries(updateData).forEach(([key, value]) => {
          if (value !== undefined) {
            if (key === 'metadata') {
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

        queryParams.push(goalId, userId);

        const result = await client.query(
          `
          UPDATE financial_goals
          SET ${setClause.join(', ')}
          WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
          RETURNING *
        `,
          queryParams
        );

        if (result.rows.length === 0) {
          return null;
        }

        const updatedGoal = this.formatGoal(result.rows[0]);

        // If current_amount was updated, add progress entry
        if (
          updateData.current_amount !== undefined &&
          updateData.current_amount !== currentAmount
        ) {
          await this.addGoalProgress(userId, goalId, {
            goal_id: goalId,
            amount: updateData.current_amount,
            notes: 'Goal amount updated',
          });
        }

        return updatedGoal;
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw SystemErrors.databaseError(error as Error);
    }
  }

  /**
   * Delete a financial goal (soft delete by setting is_active = false)
   */
  async deleteGoal(userId: string, goalId: string): Promise<boolean> {
    try {
      const result = await query(
        `
        UPDATE financial_goals
        SET is_active = false, synced_at = NOW()
        WHERE id = $1 AND user_id = $2
      `,
        [goalId, userId]
      );

      return result.rowCount > 0;
    } catch (error) {
      throw SystemErrors.databaseError(error as Error);
    }
  }

  /**
   * Add progress entry for a goal
   */
  async addGoalProgress(
    userId: string,
    goalId: string,
    progressData: CreateGoalProgressDto
  ): Promise<GoalProgress> {
    try {
      const result = await query<GoalProgress>(
        `
        INSERT INTO goal_progress (
          goal_id, user_id, amount, progress_date, notes
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
        [
          goalId,
          userId,
          progressData.amount,
          progressData.progress_date || new Date().toISOString().split('T')[0],
          progressData.notes || null,
        ]
      );

      if (result.rows.length === 0) {
        throw SystemErrors.databaseError(
          new Error('Failed to create goal progress')
        );
      }

      return this.formatGoalProgress(result.rows[0]);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw SystemErrors.databaseError(error as Error);
    }
  }

  /**
   * Get goal progress history
   */
  async getGoalProgress(
    userId: string,
    goalId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<FinancialPaginatedResponse<GoalProgress>> {
    try {
      const { page = 1, limit = 50 } = options;
      const offset = (page - 1) * limit;

      // Get total count
      const countResult = await query<{ count: string }>(
        `
        SELECT COUNT(*) as count
        FROM goal_progress
        WHERE goal_id = $1 AND user_id = $2
      `,
        [goalId, userId]
      );

      const total = parseInt(countResult.rows[0].count, 10);

      // Get paginated results
      const result = await query<GoalProgress>(
        `
        SELECT *
        FROM goal_progress
        WHERE goal_id = $1 AND user_id = $2
        ORDER BY progress_date DESC, created_at DESC
        LIMIT $3 OFFSET $4
      `,
        [goalId, userId, limit, offset]
      );

      const progress = result.rows.map(row => this.formatGoalProgress(row));

      return {
        success: true,
        data: progress,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw SystemErrors.databaseError(error as Error);
    }
  }

  /**
   * Get goal summary with progress percentage
   */
  async getGoalSummary(userId: string): Promise<{
    total_goals: number;
    active_goals: number;
    completed_goals: number;
    total_target_amount: number;
    total_current_amount: number;
    overall_progress_percentage: number;
    goals_by_type: Record<
      string,
      { count: number; target_amount: number; current_amount: number }
    >;
  }> {
    try {
      const result = await query<{
        goal_type: string;
        count: string;
        total_target: string;
        total_current: string;
        completed_count: string;
      }>(
        `
        SELECT 
          goal_type,
          COUNT(*) as count,
          SUM(target_amount) as total_target,
          SUM(current_amount) as total_current,
          COUNT(CASE WHEN current_amount >= target_amount THEN 1 END) as completed_count
        FROM financial_goals
        WHERE user_id = $1 AND is_active = true
        GROUP BY goal_type
      `,
        [userId]
      );

      let totalGoals = 0;
      let completedGoals = 0;
      let totalTargetAmount = 0;
      let totalCurrentAmount = 0;
      const goalsByType: Record<
        string,
        { count: number; target_amount: number; current_amount: number }
      > = {};

      result.rows.forEach(row => {
        const count = parseInt(row.count, 10);
        const targetAmount = parseFloat(row.total_target);
        const currentAmount = parseFloat(row.total_current);
        const completed = parseInt(row.completed_count, 10);

        totalGoals += count;
        completedGoals += completed;
        totalTargetAmount += targetAmount;
        totalCurrentAmount += currentAmount;

        goalsByType[row.goal_type] = {
          count,
          target_amount: targetAmount,
          current_amount: currentAmount,
        };
      });

      const overallProgressPercentage =
        totalTargetAmount > 0
          ? Math.min((totalCurrentAmount / totalTargetAmount) * 100, 100)
          : 0;

      return {
        total_goals: totalGoals,
        active_goals: totalGoals - completedGoals,
        completed_goals: completedGoals,
        total_target_amount: totalTargetAmount,
        total_current_amount: totalCurrentAmount,
        overall_progress_percentage: overallProgressPercentage,
        goals_by_type: goalsByType,
      };
    } catch (error) {
      throw SystemErrors.databaseError(error as Error);
    }
  }

  /**
   * Format goal data from database
   */
  private formatGoal(row: any): FinancialGoal {
    return {
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
    };
  }

  /**
   * Format goal progress data from database
   */
  private formatGoalProgress(row: any): GoalProgress {
    return {
      id: row.id,
      goal_id: row.goal_id,
      user_id: row.user_id,
      amount: parseFloat(row.amount),
      progress_date: row.progress_date,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      synced_at: row.synced_at,
    };
  }
}

export const financialGoalService = FinancialGoalService.getInstance();
