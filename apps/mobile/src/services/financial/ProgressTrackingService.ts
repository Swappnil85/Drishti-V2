/**
 * ProgressTrackingService
 * Advanced progress tracking with velocity analysis and projections
 * Epic 8, Story 2: Advanced Progress Tracking & Visualization
 */

import {
  FinancialGoal,
  FIREGoalProgress,
  FIREGoalMetadata,
} from '@drishti/shared/types/financial';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ProgressSnapshot {
  goalId: string;
  timestamp: string;
  amount: number;
  targetAmount: number;
  progressPercentage: number;
  monthlyContribution?: number;
  marketConditions?: {
    volatilityIndex: number;
    marketTrend: 'bull' | 'bear' | 'sideways';
  };
}

export interface VelocityAnalysis {
  currentVelocity: number; // dollars per month
  velocityTrend: 'accelerating' | 'steady' | 'decelerating' | 'stalled';
  velocityChange: number; // percentage change
  projectedCompletion: string;
  confidenceLevel: number; // 0-100
  factors: Array<{
    type: 'contribution' | 'market' | 'consistency' | 'external';
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
    magnitude: number; // 0-1
  }>;
}

export interface ProjectionConfidence {
  overall: number; // 0-100
  factors: {
    consistency: number; // How consistent contributions have been
    marketVolatility: number; // Market stability factor
    timeHorizon: number; // Longer horizons = lower confidence
    goalRealism: number; // How realistic the goal is
  };
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface VarianceAnalysis {
  timelineVariance: {
    originalEstimate: number; // months
    currentEstimate: number; // months
    variance: number; // months ahead/behind
    variancePercentage: number;
  };
  contributionVariance: {
    plannedMonthly: number;
    actualMonthly: number;
    variance: number;
    variancePercentage: number;
  };
  performanceVariance: {
    expectedReturn: number;
    actualReturn: number;
    variance: number;
    impact: string;
  };
}

export class ProgressTrackingService {
  private static instance: ProgressTrackingService;
  private readonly STORAGE_KEY = 'progress_snapshots';
  private readonly MAX_SNAPSHOTS = 100; // Keep last 100 snapshots per goal

  private constructor() {}

  public static getInstance(): ProgressTrackingService {
    if (!ProgressTrackingService.instance) {
      ProgressTrackingService.instance = new ProgressTrackingService();
    }
    return ProgressTrackingService.instance;
  }

  /**
   * Record a progress snapshot
   */
  public async recordProgressSnapshot(
    goal: FinancialGoal,
    additionalData?: Partial<ProgressSnapshot>
  ): Promise<void> {
    const snapshot: ProgressSnapshot = {
      goalId: goal.id,
      timestamp: new Date().toISOString(),
      amount: goal.current_amount,
      targetAmount: goal.target_amount,
      progressPercentage: (goal.current_amount / goal.target_amount) * 100,
      ...additionalData,
    };

    try {
      const existingSnapshots = await this.getProgressSnapshots(goal.id);
      const updatedSnapshots = [...existingSnapshots, snapshot]
        .slice(-this.MAX_SNAPSHOTS); // Keep only recent snapshots

      await this.saveProgressSnapshots(goal.id, updatedSnapshots);
    } catch (error) {
      console.error('Failed to record progress snapshot:', error);
      throw error;
    }
  }

  /**
   * Analyze velocity trends
   */
  public async analyzeVelocity(goalId: string): Promise<VelocityAnalysis> {
    const snapshots = await this.getProgressSnapshots(goalId);
    
    if (snapshots.length < 2) {
      return this.getDefaultVelocityAnalysis();
    }

    // Calculate velocity over different time periods
    const recentSnapshots = snapshots.slice(-6); // Last 6 snapshots
    const currentVelocity = this.calculateVelocity(recentSnapshots);
    
    // Compare with earlier velocity
    const earlierSnapshots = snapshots.slice(-12, -6); // Previous 6 snapshots
    const previousVelocity = earlierSnapshots.length >= 2 
      ? this.calculateVelocity(earlierSnapshots) 
      : currentVelocity;

    const velocityChange = previousVelocity > 0 
      ? ((currentVelocity - previousVelocity) / previousVelocity) * 100 
      : 0;

    const velocityTrend = this.determineVelocityTrend(velocityChange, currentVelocity);
    
    // Project completion based on current velocity
    const latestSnapshot = snapshots[snapshots.length - 1];
    const remainingAmount = latestSnapshot.targetAmount - latestSnapshot.amount;
    const monthsToCompletion = currentVelocity > 0 ? remainingAmount / currentVelocity : Infinity;
    
    const projectedCompletion = new Date();
    projectedCompletion.setMonth(projectedCompletion.getMonth() + monthsToCompletion);

    // Calculate confidence level
    const confidenceLevel = this.calculateConfidenceLevel(snapshots, currentVelocity);

    // Identify factors affecting velocity
    const factors = this.identifyVelocityFactors(snapshots, velocityChange);

    return {
      currentVelocity,
      velocityTrend,
      velocityChange,
      projectedCompletion: projectedCompletion.toISOString(),
      confidenceLevel,
      factors,
    };
  }

  /**
   * Calculate projection confidence
   */
  public async calculateProjectionConfidence(goalId: string): Promise<ProjectionConfidence> {
    const snapshots = await this.getProgressSnapshots(goalId);
    
    if (snapshots.length < 3) {
      return this.getDefaultProjectionConfidence();
    }

    // Analyze consistency of contributions
    const contributions = this.extractContributions(snapshots);
    const consistency = this.calculateConsistency(contributions);

    // Estimate market volatility impact (simplified)
    const marketVolatility = this.estimateMarketVolatility(snapshots);

    // Time horizon factor (longer = less confident)
    const latestSnapshot = snapshots[snapshots.length - 1];
    const remainingProgress = 100 - latestSnapshot.progressPercentage;
    const timeHorizon = Math.min(100, 100 - (remainingProgress / 2)); // Simplified

    // Goal realism based on required vs actual contribution rates
    const goalRealism = this.assessGoalRealism(snapshots);

    const overall = Math.round(
      (consistency * 0.3 + marketVolatility * 0.2 + timeHorizon * 0.2 + goalRealism * 0.3)
    );

    const riskLevel = overall >= 70 ? 'low' : overall >= 40 ? 'medium' : 'high';

    const recommendations = this.generateConfidenceRecommendations(
      { consistency, marketVolatility, timeHorizon, goalRealism },
      riskLevel
    );

    return {
      overall,
      factors: {
        consistency,
        marketVolatility,
        timeHorizon,
        goalRealism,
      },
      riskLevel,
      recommendations,
    };
  }

  /**
   * Perform variance analysis
   */
  public async performVarianceAnalysis(
    goalId: string,
    originalProjections: {
      estimatedMonths: number;
      plannedMonthlyContribution: number;
      expectedReturn: number;
    }
  ): Promise<VarianceAnalysis> {
    const snapshots = await this.getProgressSnapshots(goalId);
    
    if (snapshots.length < 2) {
      return this.getDefaultVarianceAnalysis(originalProjections);
    }

    const velocity = await this.analyzeVelocity(goalId);
    const latestSnapshot = snapshots[snapshots.length - 1];
    
    // Timeline variance
    const remainingAmount = latestSnapshot.targetAmount - latestSnapshot.amount;
    const currentEstimate = velocity.currentVelocity > 0 
      ? remainingAmount / velocity.currentVelocity 
      : Infinity;
    
    const timelineVariance = {
      originalEstimate: originalProjections.estimatedMonths,
      currentEstimate: Math.min(currentEstimate, 1200), // Cap at 100 years
      variance: originalProjections.estimatedMonths - currentEstimate,
      variancePercentage: originalProjections.estimatedMonths > 0 
        ? ((originalProjections.estimatedMonths - currentEstimate) / originalProjections.estimatedMonths) * 100 
        : 0,
    };

    // Contribution variance
    const actualMonthly = velocity.currentVelocity;
    const contributionVariance = {
      plannedMonthly: originalProjections.plannedMonthlyContribution,
      actualMonthly,
      variance: actualMonthly - originalProjections.plannedMonthlyContribution,
      variancePercentage: originalProjections.plannedMonthlyContribution > 0 
        ? ((actualMonthly - originalProjections.plannedMonthlyContribution) / originalProjections.plannedMonthlyContribution) * 100 
        : 0,
    };

    // Performance variance (simplified - would need market data integration)
    const estimatedReturn = this.estimateActualReturn(snapshots);
    const performanceVariance = {
      expectedReturn: originalProjections.expectedReturn,
      actualReturn: estimatedReturn,
      variance: estimatedReturn - originalProjections.expectedReturn,
      impact: this.describePerformanceImpact(estimatedReturn - originalProjections.expectedReturn),
    };

    return {
      timelineVariance,
      contributionVariance,
      performanceVariance,
    };
  }

  // Private helper methods

  private async getProgressSnapshots(goalId: string): Promise<ProgressSnapshot[]> {
    try {
      const data = await AsyncStorage.getItem(`${this.STORAGE_KEY}_${goalId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get progress snapshots:', error);
      return [];
    }
  }

  private async saveProgressSnapshots(goalId: string, snapshots: ProgressSnapshot[]): Promise<void> {
    try {
      await AsyncStorage.setItem(`${this.STORAGE_KEY}_${goalId}`, JSON.stringify(snapshots));
    } catch (error) {
      console.error('Failed to save progress snapshots:', error);
      throw error;
    }
  }

  private calculateVelocity(snapshots: ProgressSnapshot[]): number {
    if (snapshots.length < 2) return 0;

    const first = snapshots[0];
    const last = snapshots[snapshots.length - 1];
    
    const amountDiff = last.amount - first.amount;
    const timeDiff = new Date(last.timestamp).getTime() - new Date(first.timestamp).getTime();
    const monthsDiff = timeDiff / (1000 * 60 * 60 * 24 * 30.44); // Average days per month

    return monthsDiff > 0 ? amountDiff / monthsDiff : 0;
  }

  private determineVelocityTrend(velocityChange: number, currentVelocity: number): VelocityAnalysis['velocityTrend'] {
    if (currentVelocity <= 0) return 'stalled';
    if (velocityChange > 10) return 'accelerating';
    if (velocityChange < -10) return 'decelerating';
    return 'steady';
  }

  private calculateConfidenceLevel(snapshots: ProgressSnapshot[], velocity: number): number {
    if (snapshots.length < 3) return 50;
    
    // Base confidence on consistency and velocity
    const consistency = this.calculateConsistency(this.extractContributions(snapshots));
    const velocityFactor = velocity > 0 ? Math.min(100, velocity / 1000 * 100) : 0;
    
    return Math.round((consistency * 0.6 + velocityFactor * 0.4));
  }

  private identifyVelocityFactors(snapshots: ProgressSnapshot[], velocityChange: number): VelocityAnalysis['factors'] {
    const factors: VelocityAnalysis['factors'] = [];

    // Contribution consistency factor
    const contributions = this.extractContributions(snapshots);
    const consistency = this.calculateConsistency(contributions);
    
    factors.push({
      type: 'contribution',
      impact: consistency > 70 ? 'positive' : consistency > 40 ? 'neutral' : 'negative',
      description: `Contribution consistency: ${consistency.toFixed(0)}%`,
      magnitude: consistency / 100,
    });

    // Velocity trend factor
    factors.push({
      type: 'consistency',
      impact: velocityChange > 5 ? 'positive' : velocityChange < -5 ? 'negative' : 'neutral',
      description: `Velocity trend: ${velocityChange > 0 ? '+' : ''}${velocityChange.toFixed(1)}%`,
      magnitude: Math.abs(velocityChange) / 100,
    });

    return factors;
  }

  private extractContributions(snapshots: ProgressSnapshot[]): number[] {
    const contributions: number[] = [];
    
    for (let i = 1; i < snapshots.length; i++) {
      const contribution = snapshots[i].amount - snapshots[i - 1].amount;
      if (contribution > 0) {
        contributions.push(contribution);
      }
    }
    
    return contributions;
  }

  private calculateConsistency(values: number[]): number {
    if (values.length < 2) return 50;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Convert to consistency percentage (lower std dev = higher consistency)
    const coefficientOfVariation = mean > 0 ? standardDeviation / mean : 1;
    return Math.max(0, Math.min(100, 100 - (coefficientOfVariation * 100)));
  }

  private estimateMarketVolatility(snapshots: ProgressSnapshot[]): number {
    // Simplified market volatility estimation
    // In a real implementation, this would integrate with market data APIs
    return 75; // Assume moderate market stability
  }

  private assessGoalRealism(snapshots: ProgressSnapshot[]): number {
    // Simplified goal realism assessment
    const velocity = this.calculateVelocity(snapshots);
    const latestSnapshot = snapshots[snapshots.length - 1];
    const remainingAmount = latestSnapshot.targetAmount - latestSnapshot.amount;
    
    if (velocity <= 0) return 20; // Very unrealistic if no progress
    
    const monthsToCompletion = remainingAmount / velocity;
    
    // More realistic if completion is within reasonable timeframe
    if (monthsToCompletion <= 120) return 90; // 10 years or less
    if (monthsToCompletion <= 240) return 70; // 20 years or less
    if (monthsToCompletion <= 360) return 50; // 30 years or less
    return 30; // More than 30 years
  }

  private generateConfidenceRecommendations(
    factors: ProjectionConfidence['factors'],
    riskLevel: ProjectionConfidence['riskLevel']
  ): string[] {
    const recommendations: string[] = [];

    if (factors.consistency < 60) {
      recommendations.push('Improve contribution consistency for better projections');
    }

    if (factors.goalRealism < 50) {
      recommendations.push('Consider adjusting goal timeline or increasing contributions');
    }

    if (riskLevel === 'high') {
      recommendations.push('Review and potentially revise your FIRE strategy');
    }

    return recommendations;
  }

  private estimateActualReturn(snapshots: ProgressSnapshot[]): number {
    // Simplified return estimation
    // In a real implementation, this would factor in market performance
    return 0.07; // Assume 7% return
  }

  private describePerformanceImpact(variance: number): string {
    if (variance > 0.02) return 'Significantly positive impact on timeline';
    if (variance > 0.005) return 'Positive impact on timeline';
    if (variance < -0.02) return 'Significantly negative impact on timeline';
    if (variance < -0.005) return 'Negative impact on timeline';
    return 'Minimal impact on timeline';
  }

  // Default values for insufficient data scenarios

  private getDefaultVelocityAnalysis(): VelocityAnalysis {
    return {
      currentVelocity: 0,
      velocityTrend: 'stalled',
      velocityChange: 0,
      projectedCompletion: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      confidenceLevel: 50,
      factors: [],
    };
  }

  private getDefaultProjectionConfidence(): ProjectionConfidence {
    return {
      overall: 50,
      factors: {
        consistency: 50,
        marketVolatility: 50,
        timeHorizon: 50,
        goalRealism: 50,
      },
      riskLevel: 'medium',
      recommendations: ['Insufficient data for detailed analysis'],
    };
  }

  private getDefaultVarianceAnalysis(originalProjections: any): VarianceAnalysis {
    return {
      timelineVariance: {
        originalEstimate: originalProjections.estimatedMonths,
        currentEstimate: originalProjections.estimatedMonths,
        variance: 0,
        variancePercentage: 0,
      },
      contributionVariance: {
        plannedMonthly: originalProjections.plannedMonthlyContribution,
        actualMonthly: 0,
        variance: -originalProjections.plannedMonthlyContribution,
        variancePercentage: -100,
      },
      performanceVariance: {
        expectedReturn: originalProjections.expectedReturn,
        actualReturn: originalProjections.expectedReturn,
        variance: 0,
        impact: 'No data available',
      },
    };
  }
}
