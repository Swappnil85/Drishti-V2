/**
 * FIRE Goal Service
 * Enhanced service for FIRE-specific goal management
 * Epic 8, Story 1: FIRE Goal Creation & Management
 */

import {
  FIREGoalType,
  FIREGoalMetadata,
  CreateFIREGoalDto,
  FIREGoalTemplate,
  FIREGoalProgress,
  FIREGoalFeasibility,
  FinancialGoal,
  FIRECalculationParams,
  FIRECalculationResult,
} from '@drishti/shared/types/financial';
import { CalculationService } from './CalculationService';
import {
  ProgressTrackingService,
  VelocityAnalysis,
  ProjectionConfidence,
  VarianceAnalysis,
} from './ProgressTrackingService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class FIREGoalService {
  private static instance: FIREGoalService;
  private calculationService: CalculationService;
  private progressTrackingService: ProgressTrackingService;
  private templates: FIREGoalTemplate[] = [];

  private constructor() {
    this.calculationService = CalculationService.getInstance();
    this.progressTrackingService = ProgressTrackingService.getInstance();
    this.initializeTemplates();
  }

  public static getInstance(): FIREGoalService {
    if (!FIREGoalService.instance) {
      FIREGoalService.instance = new FIREGoalService();
    }
    return FIREGoalService.instance;
  }

  /**
   * Initialize FIRE goal templates
   */
  private initializeTemplates(): void {
    this.templates = [
      {
        id: 'traditional_fire',
        name: 'Traditional FIRE',
        description: 'Standard FIRE approach using the 4% rule',
        fireType: 'fire_traditional',
        category: 'beginner',
        defaultMetadata: {
          fireType: 'fire_traditional',
          withdrawalRate: 0.04,
          safetyMargin: 0.1,
          expectedReturn: 0.07,
          inflationRate: 0.03,
          autoAdjustForInflation: true,
          includeHealthcareBuffer: true,
          includeTaxConsiderations: true,
        } as Partial<FIREGoalMetadata>,
        assumptions: {
          withdrawalRate: 0.04,
          expectedReturn: 0.07,
          inflationRate: 0.03,
          safetyMargin: 0.1,
        },
        guidance: {
          title: 'Traditional FIRE Strategy',
          description:
            'Achieve financial independence using the proven 4% withdrawal rule',
          tips: [
            'Save 25x your annual expenses',
            'Invest in low-cost index funds',
            'Maintain a diversified portfolio',
            'Consider tax-advantaged accounts',
          ],
          warnings: [
            'Market volatility can affect timeline',
            'Healthcare costs may be higher than expected',
          ],
          recommendedFor: [
            'First-time FIRE planners',
            'Conservative investors',
            'Those seeking proven strategies',
          ],
        },
        customizableFields: [
          {
            field: 'monthlyExpenses',
            label: 'Monthly Expenses',
            type: 'number',
            required: true,
            min: 1000,
            max: 50000,
            step: 100,
          },
          {
            field: 'currentAge',
            label: 'Current Age',
            type: 'number',
            required: true,
            min: 18,
            max: 80,
            step: 1,
          },
          {
            field: 'targetRetirementAge',
            label: 'Target Retirement Age',
            type: 'number',
            required: false,
            min: 30,
            max: 80,
            step: 1,
          },
        ],
      },
      {
        id: 'lean_fire',
        name: 'Lean FIRE',
        description: 'Minimalist approach to FIRE with lower expenses',
        fireType: 'fire_lean',
        category: 'intermediate',
        defaultMetadata: {
          fireType: 'fire_lean',
          withdrawalRate: 0.035,
          safetyMargin: 0.15,
          expectedReturn: 0.07,
          inflationRate: 0.03,
          autoAdjustForInflation: true,
          includeHealthcareBuffer: true,
          includeTaxConsiderations: true,
        } as Partial<FIREGoalMetadata>,
        assumptions: {
          withdrawalRate: 0.035,
          expectedReturn: 0.07,
          inflationRate: 0.03,
          safetyMargin: 0.15,
        },
        guidance: {
          title: 'Lean FIRE Strategy',
          description: 'Achieve FIRE faster with a minimalist lifestyle',
          tips: [
            'Focus on reducing expenses',
            'Embrace minimalism',
            'Consider geographic arbitrage',
            'Use a more conservative withdrawal rate',
          ],
          warnings: [
            'Limited flexibility for lifestyle inflation',
            'May require significant lifestyle changes',
          ],
          recommendedFor: [
            'Minimalists',
            'Those with low expenses',
            'Early career professionals',
          ],
        },
        customizableFields: [
          {
            field: 'monthlyExpenses',
            label: 'Monthly Expenses',
            type: 'number',
            required: true,
            min: 500,
            max: 5000,
            step: 50,
          },
          {
            field: 'geographicLocation',
            label: 'Geographic Location',
            type: 'text',
            required: false,
          },
        ],
      },
    ];
  }

  /**
   * Get all available FIRE goal templates
   */
  public getTemplates(): FIREGoalTemplate[] {
    return this.templates;
  }

  /**
   * Get template by ID
   */
  public getTemplate(templateId: string): FIREGoalTemplate | undefined {
    return this.templates.find(template => template.id === templateId);
  }

  /**
   * Calculate FIRE number based on goal metadata
   */
  public async calculateFIRENumber(
    metadata: FIREGoalMetadata
  ): Promise<number> {
    const params: FIRECalculationParams = {
      currentAge: metadata.currentAge,
      currentSavings: 0, // Will be calculated from accounts
      monthlyIncome: metadata.currentIncome || 0,
      monthlyExpenses: metadata.monthlyExpenses,
      expectedReturn: metadata.expectedReturn,
      inflationRate: metadata.inflationRate,
      withdrawalRate: metadata.withdrawalRate,
      targetAge: metadata.targetRetirementAge,
      socialSecurityBenefit: metadata.socialSecurityBenefit,
      pensionBenefit: metadata.pensionBenefit,
      healthcareCosts: metadata.healthcareCosts,
    };

    const result = await this.calculationService.calculateFIRE(params);
    return result.fireNumber;
  }

  /**
   * Create FIRE goal with enhanced metadata
   */
  public async createFIREGoal(
    goalData: CreateFIREGoalDto
  ): Promise<FinancialGoal> {
    // Calculate target amount if not provided
    let targetAmount = goalData.target_amount;
    if (!targetAmount && goalData.fireMetadata) {
      targetAmount = await this.calculateFIRENumber(goalData.fireMetadata);
    }

    // Create the goal with enhanced metadata
    const goal: FinancialGoal = {
      id: this.generateId(),
      user_id: 'current_user', // Will be replaced with actual user ID
      name: goalData.name,
      goal_type: goalData.goal_type,
      target_amount: targetAmount,
      current_amount: goalData.current_amount || 0,
      target_date: goalData.target_date,
      priority: goalData.priority || 3,
      description: goalData.description,
      is_active: true,
      metadata: {
        ...goalData.fireMetadata,
        templateId: goalData.templateId,
        templateName: goalData.templateName,
        createdAt: new Date().toISOString(),
        lastCalculated: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save to local storage (in real app, this would sync with backend)
    await this.saveGoalToStorage(goal);

    return goal;
  }

  /**
   * Calculate goal progress with enhanced metrics
   */
  public async calculateGoalProgress(
    goal: FinancialGoal
  ): Promise<FIREGoalProgress> {
    const progressPercentage = (goal.current_amount / goal.target_amount) * 100;
    const createdDate = new Date(goal.created_at);
    const now = new Date();
    const timeElapsed = this.monthsBetween(createdDate, now);

    // Record progress snapshot for tracking
    await this.progressTrackingService.recordProgressSnapshot(goal);

    // Get enhanced velocity analysis
    const velocityAnalysis = await this.progressTrackingService.analyzeVelocity(
      goal.id
    );

    // Get projection confidence
    const projectionConfidence =
      await this.progressTrackingService.calculateProjectionConfidence(goal.id);

    // Calculate basic metrics with fallbacks
    const monthlyProgress =
      velocityAnalysis.currentVelocity ||
      (timeElapsed > 0 ? goal.current_amount / timeElapsed : 0);

    const estimatedTimeRemaining =
      monthlyProgress > 0
        ? (goal.target_amount - goal.current_amount) / monthlyProgress
        : Infinity;

    return {
      goalId: goal.id,
      currentAmount: goal.current_amount,
      targetAmount: goal.target_amount,
      progressPercentage,
      timeElapsed,
      estimatedTimeRemaining: Math.max(0, estimatedTimeRemaining),
      originalTimeline: 0, // Would be calculated from initial projections
      monthlyProgress,
      progressVelocity: velocityAnalysis.velocityTrend,
      velocityTrend: velocityAnalysis.velocityChange,
      nextMilestone: this.calculateNextMilestone(
        progressPercentage,
        goal.target_amount
      ),
      projectedCompletionDate: velocityAnalysis.projectedCompletion,
      confidenceLevel: projectionConfidence.overall,
      varianceAnalysis: {
        timelineVariance: 0, // Would be calculated with original projections
        amountVariance: 0,
        savingsRateVariance: 0,
      },
    };
  }

  /**
   * Analyze goal feasibility
   */
  public async analyzeFeasibility(
    goal: FinancialGoal
  ): Promise<FIREGoalFeasibility> {
    const metadata = goal.metadata as FIREGoalMetadata;
    const requiredMonthlyContribution =
      this.calculateRequiredMonthlyContribution(goal, metadata);
    const currentMonthlyContribution = metadata.currentIncome
      ? (metadata.currentIncome * (metadata.currentSavingsRate || 0.2)) / 12
      : 0;

    const feasibilityScore = this.calculateFeasibilityScore(
      currentMonthlyContribution,
      requiredMonthlyContribution,
      metadata
    );

    return {
      goalId: goal.id,
      feasibilityScore,
      feasibilityRating: this.getFeasibilityRating(feasibilityScore),
      currentSavingsRate: metadata.currentSavingsRate || 0,
      requiredSavingsRate: this.calculateRequiredSavingsRate(goal, metadata),
      savingsRateGap: 0, // Will be calculated
      currentMonthlyContribution,
      requiredMonthlyContribution,
      contributionGap: Math.max(
        0,
        requiredMonthlyContribution - currentMonthlyContribution
      ),
      riskFactors: this.identifyRiskFactors(metadata),
      recommendations: this.generateRecommendations(goal, metadata),
      alternativeScenarios: this.generateAlternativeScenarios(goal, metadata),
      sensitivityAnalysis: {
        incomeChange: [],
        expenseChange: [],
        returnChange: [],
        timelineChange: [],
      },
    };
  }

  // Helper methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private monthsBetween(date1: Date, date2: Date): number {
    return (
      (date2.getFullYear() - date1.getFullYear()) * 12 +
      (date2.getMonth() - date1.getMonth())
    );
  }

  private calculateVelocity(
    monthlyProgress: number,
    timeElapsed: number
  ): 'accelerating' | 'steady' | 'decelerating' | 'stalled' {
    if (monthlyProgress === 0) return 'stalled';
    if (timeElapsed < 3) return 'steady'; // Not enough data
    // In real implementation, would compare recent vs historical progress
    return 'steady';
  }

  private calculateNextMilestone(
    progressPercentage: number,
    targetAmount: number
  ) {
    const milestones = [25, 50, 75, 100];
    const nextMilestone = milestones.find(m => m > progressPercentage) || 100;

    return {
      percentage: nextMilestone,
      amount: (targetAmount * nextMilestone) / 100,
      estimatedDate: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(), // Placeholder
    };
  }

  private calculateProjectedDate(monthsRemaining: number): string {
    const projectedDate = new Date();
    projectedDate.setMonth(projectedDate.getMonth() + monthsRemaining);
    return projectedDate.toISOString();
  }

  private calculateConfidenceLevel(
    monthlyProgress: number,
    timeElapsed: number
  ): number {
    if (timeElapsed < 3) return 50; // Low confidence with limited data
    if (monthlyProgress > 0) return Math.min(90, 50 + timeElapsed * 5);
    return 20; // Low confidence if no progress
  }

  private calculateRequiredMonthlyContribution(
    goal: FinancialGoal,
    metadata: FIREGoalMetadata
  ): number {
    // Simplified calculation - in real implementation would use compound interest formulas
    const remainingAmount = goal.target_amount - goal.current_amount;
    const yearsToGoal = metadata.targetRetirementAge
      ? metadata.targetRetirementAge - metadata.currentAge
      : 20; // Default 20 years

    return remainingAmount / (yearsToGoal * 12);
  }

  private calculateRequiredSavingsRate(
    goal: FinancialGoal,
    metadata: FIREGoalMetadata
  ): number {
    const requiredMonthly = this.calculateRequiredMonthlyContribution(
      goal,
      metadata
    );
    const monthlyIncome = (metadata.currentIncome || 0) / 12;

    return monthlyIncome > 0 ? requiredMonthly / monthlyIncome : 0;
  }

  private calculateFeasibilityScore(
    currentContribution: number,
    requiredContribution: number,
    metadata: FIREGoalMetadata
  ): number {
    if (requiredContribution === 0) return 100;

    const contributionRatio = currentContribution / requiredContribution;
    let score = Math.min(100, contributionRatio * 100);

    // Adjust for risk factors
    if (metadata.currentAge > 50) score *= 0.9; // Age penalty
    if (metadata.expectedReturn > 0.08) score *= 0.95; // Aggressive return penalty

    return Math.max(0, Math.round(score));
  }

  private getFeasibilityRating(
    score: number
  ): 'excellent' | 'good' | 'challenging' | 'unrealistic' {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'challenging';
    return 'unrealistic';
  }

  private identifyRiskFactors(metadata: FIREGoalMetadata) {
    const risks = [];

    if (metadata.currentAge > 50) {
      risks.push({
        type: 'timeline' as const,
        severity: 'medium' as const,
        description: 'Limited time horizon for wealth accumulation',
        impact: 'May require higher savings rate or delayed retirement',
        mitigation: 'Consider increasing contributions or extending timeline',
      });
    }

    if (metadata.expectedReturn > 0.08) {
      risks.push({
        type: 'market' as const,
        severity: 'high' as const,
        description: 'Aggressive return assumptions',
        impact: 'Goal may not be achievable if returns are lower',
        mitigation: 'Use more conservative return estimates',
      });
    }

    return risks;
  }

  private generateRecommendations(
    goal: FinancialGoal,
    metadata: FIREGoalMetadata
  ) {
    const recommendations = [];

    recommendations.push({
      category: 'savings_rate' as const,
      priority: 'high' as const,
      action: 'Increase monthly contributions by 10%',
      impact: 'Could reduce timeline by 2-3 years',
      difficulty: 'moderate' as const,
      estimatedTimeframe: '1-3 months to implement',
    });

    return recommendations;
  }

  private generateAlternativeScenarios(
    goal: FinancialGoal,
    metadata: FIREGoalMetadata
  ) {
    return [
      {
        name: 'Extended Timeline',
        adjustments: ['Extend retirement age by 5 years'],
        newTimeline:
          (metadata.targetRetirementAge || 65) + 5 - metadata.currentAge,
        newTargetAmount: goal.target_amount,
        feasibilityScore: 85,
        tradeoffs: ['Work longer', 'More time for compound growth'],
      },
    ];
  }

  private async saveGoalToStorage(goal: FinancialGoal): Promise<void> {
    try {
      const existingGoals = await this.getGoalsFromStorage();
      const updatedGoals = [...existingGoals, goal];
      await AsyncStorage.setItem('fire_goals', JSON.stringify(updatedGoals));
    } catch (error) {
      console.error('Failed to save goal to storage:', error);
      throw error;
    }
  }

  private async getGoalsFromStorage(): Promise<FinancialGoal[]> {
    try {
      const goalsJson = await AsyncStorage.getItem('fire_goals');
      return goalsJson ? JSON.parse(goalsJson) : [];
    } catch (error) {
      console.error('Failed to get goals from storage:', error);
      return [];
    }
  }
}
