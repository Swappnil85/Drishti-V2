/**
 * GoalSuspensionService
 * Goal suspension and restart functionality for financial hardship
 * Epic 8, Story 3: Goal Adjustment & Impact Analysis
 */

import {
  FinancialGoal,
  FIREGoalMetadata,
  FIREGoalProgress,
} from '@drishti/shared/types/financial';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface GoalSuspension {
  goalId: string;
  suspensionDate: string;
  plannedRestartDate?: string;
  actualRestartDate?: string;
  reason: string;
  suspensionType: 'temporary' | 'indefinite';
  impactAnalysis: {
    timelineExtension: number; // months
    compoundingLoss: number; // estimated dollars lost
    restartDifficulty: 'easy' | 'moderate' | 'difficult';
  };
  restartPlan?: RestartPlan;
  isActive: boolean;
}

export interface RestartPlan {
  targetRestartDate: string;
  restartStrategy: 'gradual' | 'full' | 'modified';
  modifiedContribution?: number;
  milestones: Array<{
    date: string;
    contributionPercentage: number; // 0-100
    description: string;
  }>;
  motivationalFactors: string[];
  supportResources: string[];
}

export interface SuspensionRecommendation {
  recommendedAction: 'suspend' | 'reduce' | 'continue';
  confidence: number; // 0-100
  reasoning: string[];
  alternatives: Array<{
    action: string;
    description: string;
    impact: string;
    difficulty: 'easy' | 'moderate' | 'difficult';
  }>;
  timelineImpact: {
    suspensionMonths: number;
    totalDelayMonths: number;
    recoveryMonths: number;
  };
}

export class GoalSuspensionService {
  private static instance: GoalSuspensionService;
  private readonly STORAGE_KEY = 'goal_suspensions';

  private constructor() {}

  public static getInstance(): GoalSuspensionService {
    if (!GoalSuspensionService.instance) {
      GoalSuspensionService.instance = new GoalSuspensionService();
    }
    return GoalSuspensionService.instance;
  }

  /**
   * Analyze whether goal suspension is recommended
   */
  public async analyzeSuspensionNeed(
    goal: FinancialGoal,
    currentFinancialSituation: {
      monthlyIncome: number;
      monthlyExpenses: number;
      emergencyFund: number;
      debtPayments: number;
      jobSecurity: 'stable' | 'uncertain' | 'at_risk';
    }
  ): Promise<SuspensionRecommendation> {
    const metadata = goal.metadata as FIREGoalMetadata;
    const currentContribution = metadata.currentIncome 
      ? (metadata.currentIncome * (metadata.currentSavingsRate || 0.2)) / 12
      : 0;

    // Calculate financial stress indicators
    const disposableIncome = currentFinancialSituation.monthlyIncome - 
      currentFinancialSituation.monthlyExpenses - 
      currentFinancialSituation.debtPayments;
    
    const emergencyFundMonths = currentFinancialSituation.emergencyFund / 
      currentFinancialSituation.monthlyExpenses;
    
    const contributionStrain = currentContribution / disposableIncome;

    // Determine recommendation
    let recommendedAction: SuspensionRecommendation['recommendedAction'] = 'continue';
    let confidence = 50;
    const reasoning: string[] = [];
    const alternatives: SuspensionRecommendation['alternatives'] = [];

    // Analysis logic
    if (emergencyFundMonths < 3) {
      recommendedAction = 'suspend';
      confidence = 85;
      reasoning.push('Emergency fund below 3 months of expenses');
      reasoning.push('Building emergency fund should be priority');
    } else if (contributionStrain > 0.8) {
      recommendedAction = 'reduce';
      confidence = 75;
      reasoning.push('Current contribution rate is unsustainable');
      reasoning.push('High financial stress detected');
    } else if (currentFinancialSituation.jobSecurity === 'at_risk') {
      recommendedAction = 'suspend';
      confidence = 70;
      reasoning.push('Job security concerns require financial flexibility');
    }

    // Generate alternatives
    if (recommendedAction === 'suspend') {
      alternatives.push({
        action: 'Reduce contributions by 50%',
        description: 'Maintain some progress while reducing financial stress',
        impact: 'Extends timeline by 6-12 months',
        difficulty: 'easy',
      });
      alternatives.push({
        action: 'Pause for 6 months',
        description: 'Complete suspension with planned restart',
        impact: 'Extends timeline by 8-10 months',
        difficulty: 'moderate',
      });
    }

    // Calculate timeline impact
    const suspensionMonths = recommendedAction === 'suspend' ? 6 : 0;
    const totalDelayMonths = suspensionMonths * 1.3; // Account for lost compounding
    const recoveryMonths = suspensionMonths * 0.5; // Time to get back on track

    return {
      recommendedAction,
      confidence,
      reasoning,
      alternatives,
      timelineImpact: {
        suspensionMonths,
        totalDelayMonths,
        recoveryMonths,
      },
    };
  }

  /**
   * Suspend a goal with detailed tracking
   */
  public async suspendGoal(
    goal: FinancialGoal,
    suspensionDetails: {
      reason: string;
      suspensionType: 'temporary' | 'indefinite';
      plannedRestartDate?: string;
      restartPlan?: Partial<RestartPlan>;
    }
  ): Promise<GoalSuspension> {
    const suspension: GoalSuspension = {
      goalId: goal.id,
      suspensionDate: new Date().toISOString(),
      plannedRestartDate: suspensionDetails.plannedRestartDate,
      reason: suspensionDetails.reason,
      suspensionType: suspensionDetails.suspensionType,
      impactAnalysis: await this.calculateSuspensionImpact(goal),
      restartPlan: suspensionDetails.restartPlan ? 
        this.createRestartPlan(suspensionDetails.restartPlan) : undefined,
      isActive: true,
    };

    // Save suspension record
    await this.saveSuspension(suspension);

    // Update goal status
    const suspendedGoal: FinancialGoal = {
      ...goal,
      is_active: false,
      metadata: {
        ...goal.metadata,
        suspensionId: suspension.goalId + '_' + Date.now(),
        suspensionDate: suspension.suspensionDate,
        suspensionReason: suspension.reason,
      },
      updated_at: new Date().toISOString(),
    };

    return suspension;
  }

  /**
   * Restart a suspended goal
   */
  public async restartGoal(
    goalId: string,
    restartStrategy: 'gradual' | 'full' | 'modified',
    modifiedContribution?: number
  ): Promise<{ updatedGoal: FinancialGoal; restartPlan: RestartPlan }> {
    const suspension = await this.getSuspension(goalId);
    if (!suspension || !suspension.isActive) {
      throw new Error('No active suspension found for this goal');
    }

    // Create restart plan
    const restartPlan = this.createRestartPlan({
      targetRestartDate: new Date().toISOString(),
      restartStrategy,
      modifiedContribution,
    });

    // Update suspension record
    const updatedSuspension: GoalSuspension = {
      ...suspension,
      actualRestartDate: new Date().toISOString(),
      restartPlan,
      isActive: false,
    };

    await this.saveSuspension(updatedSuspension);

    // Create updated goal (would typically fetch from storage)
    const updatedGoal: FinancialGoal = {
      id: goalId,
      user_id: 'current_user',
      name: 'Restarted Goal',
      goal_type: 'fire_traditional',
      target_amount: 1000000,
      current_amount: 0,
      priority: 1,
      is_active: true,
      metadata: {
        restartDate: new Date().toISOString(),
        restartStrategy,
        modifiedContribution,
        suspensionHistory: [updatedSuspension],
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return { updatedGoal, restartPlan };
  }

  /**
   * Get suspension recommendations for restart
   */
  public async getRestartRecommendations(
    goalId: string,
    currentFinancialSituation: {
      monthlyIncome: number;
      monthlyExpenses: number;
      emergencyFund: number;
      improvementsSinceSupension: string[];
    }
  ): Promise<{
    readinessScore: number;
    recommendations: string[];
    suggestedStrategy: 'gradual' | 'full' | 'modified';
    timelineAdjustment: number;
  }> {
    const suspension = await this.getSuspension(goalId);
    if (!suspension) {
      throw new Error('No suspension record found');
    }

    // Calculate readiness score
    const disposableIncome = currentFinancialSituation.monthlyIncome - 
      currentFinancialSituation.monthlyExpenses;
    const emergencyFundMonths = currentFinancialSituation.emergencyFund / 
      currentFinancialSituation.monthlyExpenses;

    let readinessScore = 0;
    const recommendations: string[] = [];

    // Emergency fund check
    if (emergencyFundMonths >= 6) {
      readinessScore += 40;
    } else if (emergencyFundMonths >= 3) {
      readinessScore += 25;
      recommendations.push('Consider building emergency fund to 6 months');
    } else {
      recommendations.push('Build emergency fund to at least 3 months before restarting');
    }

    // Income stability
    if (disposableIncome > 0) {
      readinessScore += 30;
    } else {
      recommendations.push('Ensure positive cash flow before restarting');
    }

    // Improvements since suspension
    readinessScore += Math.min(30, currentFinancialSituation.improvementsSinceSupension.length * 10);

    // Suggest strategy
    let suggestedStrategy: 'gradual' | 'full' | 'modified' = 'gradual';
    if (readinessScore >= 80) {
      suggestedStrategy = 'full';
    } else if (readinessScore >= 60) {
      suggestedStrategy = 'gradual';
    } else {
      suggestedStrategy = 'modified';
      recommendations.push('Consider starting with reduced contributions');
    }

    // Calculate timeline adjustment
    const suspensionMonths = this.monthsBetween(
      new Date(suspension.suspensionDate),
      new Date()
    );
    const timelineAdjustment = suspensionMonths + suspension.impactAnalysis.timelineExtension;

    return {
      readinessScore,
      recommendations,
      suggestedStrategy,
      timelineAdjustment,
    };
  }

  // Private helper methods

  private async calculateSuspensionImpact(goal: FinancialGoal): Promise<GoalSuspension['impactAnalysis']> {
    const metadata = goal.metadata as FIREGoalMetadata;
    const monthlyContribution = metadata.currentIncome 
      ? (metadata.currentIncome * (metadata.currentSavingsRate || 0.2)) / 12
      : 0;

    // Estimate impact (simplified calculation)
    const timelineExtension = 6; // Assume 6 months suspension
    const compoundingLoss = monthlyContribution * timelineExtension * 1.5; // Lost growth
    const restartDifficulty: 'easy' | 'moderate' | 'difficult' = 
      timelineExtension > 12 ? 'difficult' : 
      timelineExtension > 6 ? 'moderate' : 'easy';

    return {
      timelineExtension,
      compoundingLoss,
      restartDifficulty,
    };
  }

  private createRestartPlan(partialPlan: Partial<RestartPlan>): RestartPlan {
    const defaultPlan: RestartPlan = {
      targetRestartDate: new Date().toISOString(),
      restartStrategy: 'gradual',
      milestones: [
        {
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          contributionPercentage: 25,
          description: 'Start with 25% of original contribution',
        },
        {
          date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          contributionPercentage: 50,
          description: 'Increase to 50% of original contribution',
        },
        {
          date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          contributionPercentage: 100,
          description: 'Return to full contribution level',
        },
      ],
      motivationalFactors: [
        'Renewed financial stability',
        'Clear restart plan in place',
        'Lessons learned from suspension period',
      ],
      supportResources: [
        'Monthly progress check-ins',
        'Automated contribution increases',
        'Emergency fund monitoring',
      ],
    };

    return { ...defaultPlan, ...partialPlan };
  }

  private async saveSuspension(suspension: GoalSuspension): Promise<void> {
    try {
      const existingSuspensions = await this.getAllSuspensions();
      const updatedSuspensions = existingSuspensions.filter(s => s.goalId !== suspension.goalId);
      updatedSuspensions.push(suspension);
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedSuspensions));
    } catch (error) {
      console.error('Failed to save suspension:', error);
      throw error;
    }
  }

  private async getSuspension(goalId: string): Promise<GoalSuspension | null> {
    try {
      const suspensions = await this.getAllSuspensions();
      return suspensions.find(s => s.goalId === goalId) || null;
    } catch (error) {
      console.error('Failed to get suspension:', error);
      return null;
    }
  }

  private async getAllSuspensions(): Promise<GoalSuspension[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get suspensions:', error);
      return [];
    }
  }

  private monthsBetween(date1: Date, date2: Date): number {
    return (date2.getFullYear() - date1.getFullYear()) * 12 + 
           (date2.getMonth() - date1.getMonth());
  }
}
