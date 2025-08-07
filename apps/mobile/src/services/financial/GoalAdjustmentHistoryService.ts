/**
 * GoalAdjustmentHistoryService
 * Comprehensive goal adjustment history tracking with timeline visualization and pattern analysis
 * Epic 8, Story: Goal Adjustment History Tracking
 */

import { FinancialGoal, FIREGoalMetadata } from '@drishti/shared/types/financial';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface GoalAdjustment {
  id: string;
  goalId: string;
  timestamp: string;
  adjustmentType: 'target_amount' | 'target_date' | 'savings_rate' | 'timeline' | 'suspension' | 'reactivation' | 'split' | 'merge';
  reason: string;
  category: 'life_event' | 'market_change' | 'income_change' | 'expense_change' | 'strategy_optimization' | 'emergency' | 'other';
  
  // Before/After values
  previousValues: {
    targetAmount?: number;
    targetDate?: string;
    savingsRate?: number;
    monthlyContribution?: number;
    timeline?: number;
  };
  newValues: {
    targetAmount?: number;
    targetDate?: string;
    savingsRate?: number;
    monthlyContribution?: number;
    timeline?: number;
  };
  
  // Impact analysis
  impactAnalysis: {
    timelineChange: number; // months
    contributionChange: number; // dollars
    feasibilityChange: number; // percentage points
    confidenceChange: number; // percentage points
  };
  
  // Metadata
  triggeredBy: 'user' | 'system' | 'life_event' | 'market_condition';
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  reversible: boolean;
  notes?: string;
}

export interface AdjustmentPattern {
  patternType: 'seasonal' | 'life_stage' | 'market_responsive' | 'income_driven' | 'expense_driven';
  frequency: number; // adjustments per year
  averageImpact: number; // average timeline change in months
  confidence: number; // 0-100
  description: string;
  recommendations: string[];
}

export interface GoalStabilityScore {
  score: number; // 0-100, higher is more stable
  rating: 'very_stable' | 'stable' | 'moderate' | 'unstable' | 'very_unstable';
  factors: Array<{
    factor: string;
    impact: number; // -100 to 100
    description: string;
  }>;
  improvementSuggestions: string[];
}

export interface AdjustmentTimeline {
  adjustments: GoalAdjustment[];
  milestones: Array<{
    date: string;
    type: 'creation' | 'major_adjustment' | 'milestone_reached' | 'suspension' | 'reactivation';
    title: string;
    description: string;
    impact?: string;
  }>;
  trendAnalysis: {
    direction: 'improving' | 'stable' | 'declining';
    velocity: number; // rate of change
    predictedNextAdjustment?: string; // ISO date
    confidence: number;
  };
}

export interface SeasonalRecommendation {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  month: number;
  recommendationType: 'increase_savings' | 'review_progress' | 'adjust_timeline' | 'rebalance_portfolio';
  reasoning: string;
  historicalSuccess: number; // 0-100
  estimatedImpact: number; // timeline change in months
}

export class GoalAdjustmentHistoryService {
  private static instance: GoalAdjustmentHistoryService;
  private readonly STORAGE_KEY = 'goal_adjustment_history';
  private readonly PATTERNS_KEY = 'adjustment_patterns';
  private readonly ROLLBACK_WINDOW = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

  private constructor() {}

  public static getInstance(): GoalAdjustmentHistoryService {
    if (!GoalAdjustmentHistoryService.instance) {
      GoalAdjustmentHistoryService.instance = new GoalAdjustmentHistoryService();
    }
    return GoalAdjustmentHistoryService.instance;
  }

  /**
   * Record a new goal adjustment
   */
  public async recordAdjustment(
    goalId: string,
    adjustmentType: GoalAdjustment['adjustmentType'],
    reason: string,
    category: GoalAdjustment['category'],
    previousValues: GoalAdjustment['previousValues'],
    newValues: GoalAdjustment['newValues'],
    impactAnalysis: GoalAdjustment['impactAnalysis'],
    triggeredBy: GoalAdjustment['triggeredBy'] = 'user',
    notes?: string
  ): Promise<GoalAdjustment> {
    const adjustment: GoalAdjustment = {
      id: this.generateId(),
      goalId,
      timestamp: new Date().toISOString(),
      adjustmentType,
      reason,
      category,
      previousValues,
      newValues,
      impactAnalysis,
      triggeredBy,
      severity: this.calculateSeverity(impactAnalysis),
      reversible: this.isReversible(adjustmentType, triggeredBy),
      notes,
    };

    await this.storeAdjustment(adjustment);
    await this.updatePatterns(adjustment);
    
    return adjustment;
  }

  /**
   * Get adjustment history for a goal
   */
  public async getAdjustmentHistory(goalId: string): Promise<GoalAdjustment[]> {
    try {
      const historyData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!historyData) return [];

      const allAdjustments: GoalAdjustment[] = JSON.parse(historyData);
      return allAdjustments
        .filter(adj => adj.goalId === goalId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Failed to get adjustment history:', error);
      return [];
    }
  }

  /**
   * Generate adjustment timeline with milestones
   */
  public async generateAdjustmentTimeline(goalId: string, goal: FinancialGoal): Promise<AdjustmentTimeline> {
    const adjustments = await this.getAdjustmentHistory(goalId);
    
    // Create milestones from adjustments and goal events
    const milestones = [
      {
        date: goal.created_at,
        type: 'creation' as const,
        title: 'Goal Created',
        description: `Started FIRE journey with $${goal.target_amount.toLocaleString()} target`,
      },
      ...adjustments
        .filter(adj => adj.severity === 'major' || adj.severity === 'critical')
        .map(adj => ({
          date: adj.timestamp,
          type: 'major_adjustment' as const,
          title: this.getAdjustmentTitle(adj),
          description: adj.reason,
          impact: this.formatImpact(adj.impactAnalysis),
        })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Analyze trends
    const trendAnalysis = this.analyzeTrends(adjustments);

    return {
      adjustments,
      milestones,
      trendAnalysis,
    };
  }

  /**
   * Analyze adjustment patterns
   */
  public async analyzeAdjustmentPatterns(goalId: string): Promise<AdjustmentPattern[]> {
    const adjustments = await this.getAdjustmentHistory(goalId);
    if (adjustments.length < 3) return [];

    const patterns: AdjustmentPattern[] = [];

    // Seasonal pattern analysis
    const seasonalPattern = this.analyzeSeasonalPattern(adjustments);
    if (seasonalPattern) patterns.push(seasonalPattern);

    // Market responsive pattern
    const marketPattern = this.analyzeMarketPattern(adjustments);
    if (marketPattern) patterns.push(marketPattern);

    // Income-driven pattern
    const incomePattern = this.analyzeIncomePattern(adjustments);
    if (incomePattern) patterns.push(incomePattern);

    return patterns;
  }

  /**
   * Calculate goal stability score
   */
  public async calculateStabilityScore(goalId: string): Promise<GoalStabilityScore> {
    const adjustments = await this.getAdjustmentHistory(goalId);
    
    let score = 100; // Start with perfect stability
    const factors = [];

    // Frequency factor
    const adjustmentFrequency = adjustments.length / Math.max(1, this.getGoalAgeInYears(adjustments));
    if (adjustmentFrequency > 4) {
      const impact = -20;
      score += impact;
      factors.push({
        factor: 'High Adjustment Frequency',
        impact,
        description: `${adjustmentFrequency.toFixed(1)} adjustments per year is above optimal range`,
      });
    }

    // Severity factor
    const majorAdjustments = adjustments.filter(adj => adj.severity === 'major' || adj.severity === 'critical').length;
    if (majorAdjustments > 2) {
      const impact = -15;
      score += impact;
      factors.push({
        factor: 'Major Adjustments',
        impact,
        description: `${majorAdjustments} major adjustments indicate significant plan changes`,
      });
    }

    // Consistency factor
    const recentAdjustments = adjustments.filter(adj => 
      new Date(adj.timestamp).getTime() > Date.now() - (90 * 24 * 60 * 60 * 1000)
    );
    if (recentAdjustments.length > 2) {
      const impact = -10;
      score += impact;
      factors.push({
        factor: 'Recent Instability',
        impact,
        description: 'Multiple recent adjustments suggest ongoing uncertainty',
      });
    }

    // Pattern consistency (positive factor)
    const patterns = await this.analyzeAdjustmentPatterns(goalId);
    if (patterns.length > 0 && patterns[0].confidence > 70) {
      const impact = 10;
      score += impact;
      factors.push({
        factor: 'Predictable Patterns',
        impact,
        description: 'Consistent adjustment patterns indicate good planning',
      });
    }

    score = Math.max(0, Math.min(100, score));

    return {
      score,
      rating: this.getStabilityRating(score),
      factors,
      improvementSuggestions: this.generateStabilityImprovements(score, factors),
    };
  }

  /**
   * Get seasonal adjustment recommendations
   */
  public async getSeasonalRecommendations(goalId: string): Promise<SeasonalRecommendation[]> {
    const adjustments = await this.getAdjustmentHistory(goalId);
    const patterns = await this.analyzeAdjustmentPatterns(goalId);
    
    const recommendations: SeasonalRecommendation[] = [];
    const currentMonth = new Date().getMonth();

    // Spring recommendations (March-May)
    if (currentMonth >= 2 && currentMonth <= 4) {
      recommendations.push({
        season: 'spring',
        month: 4, // April
        recommendationType: 'review_progress',
        reasoning: 'Spring is ideal for annual goal review and tax-related adjustments',
        historicalSuccess: 85,
        estimatedImpact: -2, // Typically improves timeline
      });
    }

    // Summer recommendations (June-August)
    if (currentMonth >= 5 && currentMonth <= 7) {
      recommendations.push({
        season: 'summer',
        month: 7, // July
        recommendationType: 'increase_savings',
        reasoning: 'Mid-year bonus season and reduced heating costs create savings opportunities',
        historicalSuccess: 78,
        estimatedImpact: -3,
      });
    }

    // Fall recommendations (September-November)
    if (currentMonth >= 8 && currentMonth <= 10) {
      recommendations.push({
        season: 'fall',
        month: 10, // October
        recommendationType: 'rebalance_portfolio',
        reasoning: 'Year-end portfolio rebalancing and tax-loss harvesting opportunities',
        historicalSuccess: 82,
        estimatedImpact: -1,
      });
    }

    // Winter recommendations (December-February)
    if (currentMonth >= 11 || currentMonth <= 1) {
      recommendations.push({
        season: 'winter',
        month: 1, // January
        recommendationType: 'adjust_timeline',
        reasoning: 'New Year planning and holiday expense recovery period',
        historicalSuccess: 75,
        estimatedImpact: 1, // May extend timeline slightly
      });
    }

    return recommendations;
  }

  /**
   * Check if adjustment can be rolled back
   */
  public async canRollback(adjustmentId: string): Promise<boolean> {
    const adjustments = await this.getAllAdjustments();
    const adjustment = adjustments.find(adj => adj.id === adjustmentId);
    
    if (!adjustment) return false;
    if (!adjustment.reversible) return false;
    
    const adjustmentTime = new Date(adjustment.timestamp).getTime();
    const now = Date.now();
    
    return (now - adjustmentTime) <= this.ROLLBACK_WINDOW;
  }

  /**
   * Rollback an adjustment
   */
  public async rollbackAdjustment(adjustmentId: string): Promise<boolean> {
    if (!(await this.canRollback(adjustmentId))) {
      return false;
    }

    try {
      const adjustments = await this.getAllAdjustments();
      const adjustmentIndex = adjustments.findIndex(adj => adj.id === adjustmentId);
      
      if (adjustmentIndex === -1) return false;

      // Mark as rolled back instead of deleting
      adjustments[adjustmentIndex] = {
        ...adjustments[adjustmentIndex],
        notes: (adjustments[adjustmentIndex].notes || '') + ' [ROLLED BACK]',
      };

      // Record the rollback as a new adjustment
      const originalAdjustment = adjustments[adjustmentIndex];
      const rollbackAdjustment: GoalAdjustment = {
        id: this.generateId(),
        goalId: originalAdjustment.goalId,
        timestamp: new Date().toISOString(),
        adjustmentType: originalAdjustment.adjustmentType,
        reason: `Rollback of: ${originalAdjustment.reason}`,
        category: 'other',
        previousValues: originalAdjustment.newValues,
        newValues: originalAdjustment.previousValues,
        impactAnalysis: {
          timelineChange: -originalAdjustment.impactAnalysis.timelineChange,
          contributionChange: -originalAdjustment.impactAnalysis.contributionChange,
          feasibilityChange: -originalAdjustment.impactAnalysis.feasibilityChange,
          confidenceChange: -originalAdjustment.impactAnalysis.confidenceChange,
        },
        triggeredBy: 'user',
        severity: 'minor',
        reversible: false,
        notes: `Rollback of adjustment ${adjustmentId}`,
      };

      adjustments.push(rollbackAdjustment);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(adjustments));
      
      return true;
    } catch (error) {
      console.error('Failed to rollback adjustment:', error);
      return false;
    }
  }

  // Private helper methods

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private calculateSeverity(impact: GoalAdjustment['impactAnalysis']): GoalAdjustment['severity'] {
    const timelineImpact = Math.abs(impact.timelineChange);
    const feasibilityImpact = Math.abs(impact.feasibilityChange);
    
    if (timelineImpact > 24 || feasibilityImpact > 20) return 'critical';
    if (timelineImpact > 12 || feasibilityImpact > 10) return 'major';
    if (timelineImpact > 6 || feasibilityImpact > 5) return 'moderate';
    return 'minor';
  }

  private isReversible(
    adjustmentType: GoalAdjustment['adjustmentType'],
    triggeredBy: GoalAdjustment['triggeredBy']
  ): boolean {
    // System-triggered adjustments are generally not reversible
    if (triggeredBy === 'system' || triggeredBy === 'market_condition') return false;
    
    // Some adjustment types are not reversible
    if (adjustmentType === 'split' || adjustmentType === 'merge') return false;
    
    return true;
  }

  private async storeAdjustment(adjustment: GoalAdjustment): Promise<void> {
    try {
      const existingData = await AsyncStorage.getItem(this.STORAGE_KEY);
      const adjustments = existingData ? JSON.parse(existingData) : [];
      
      adjustments.push(adjustment);
      
      // Keep only recent adjustments (last 2 years)
      const twoYearsAgo = Date.now() - (2 * 365 * 24 * 60 * 60 * 1000);
      const recentAdjustments = adjustments.filter((adj: GoalAdjustment) => 
        new Date(adj.timestamp).getTime() > twoYearsAgo
      );
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentAdjustments));
    } catch (error) {
      console.error('Failed to store adjustment:', error);
    }
  }

  private async updatePatterns(adjustment: GoalAdjustment): Promise<void> {
    // Update pattern analysis - simplified implementation
    try {
      const patternsData = await AsyncStorage.getItem(this.PATTERNS_KEY);
      const patterns = patternsData ? JSON.parse(patternsData) : {};
      
      const goalPatterns = patterns[adjustment.goalId] || [];
      goalPatterns.push({
        timestamp: adjustment.timestamp,
        type: adjustment.adjustmentType,
        category: adjustment.category,
        impact: adjustment.impactAnalysis.timelineChange,
      });
      
      patterns[adjustment.goalId] = goalPatterns.slice(-20); // Keep last 20 for pattern analysis
      await AsyncStorage.setItem(this.PATTERNS_KEY, JSON.stringify(patterns));
    } catch (error) {
      console.error('Failed to update patterns:', error);
    }
  }

  private async getAllAdjustments(): Promise<GoalAdjustment[]> {
    try {
      const historyData = await AsyncStorage.getItem(this.STORAGE_KEY);
      return historyData ? JSON.parse(historyData) : [];
    } catch (error) {
      console.error('Failed to get all adjustments:', error);
      return [];
    }
  }

  private getAdjustmentTitle(adjustment: GoalAdjustment): string {
    switch (adjustment.adjustmentType) {
      case 'target_amount': return 'Target Amount Changed';
      case 'target_date': return 'Target Date Adjusted';
      case 'savings_rate': return 'Savings Rate Modified';
      case 'timeline': return 'Timeline Adjusted';
      case 'suspension': return 'Goal Suspended';
      case 'reactivation': return 'Goal Reactivated';
      case 'split': return 'Goal Split';
      case 'merge': return 'Goals Merged';
      default: return 'Goal Adjusted';
    }
  }

  private formatImpact(impact: GoalAdjustment['impactAnalysis']): string {
    const parts = [];
    
    if (impact.timelineChange !== 0) {
      const direction = impact.timelineChange > 0 ? 'extended' : 'accelerated';
      parts.push(`Timeline ${direction} by ${Math.abs(impact.timelineChange)} months`);
    }
    
    if (impact.feasibilityChange !== 0) {
      const direction = impact.feasibilityChange > 0 ? 'improved' : 'reduced';
      parts.push(`Feasibility ${direction} by ${Math.abs(impact.feasibilityChange)}%`);
    }
    
    return parts.join(', ') || 'No significant impact';
  }

  private analyzeTrends(adjustments: GoalAdjustment[]): AdjustmentTimeline['trendAnalysis'] {
    if (adjustments.length < 2) {
      return {
        direction: 'stable',
        velocity: 0,
        confidence: 50,
      };
    }

    // Analyze recent trend direction
    const recentAdjustments = adjustments.slice(0, 5); // Last 5 adjustments
    const avgImpact = recentAdjustments.reduce((sum, adj) => sum + adj.impactAnalysis.timelineChange, 0) / recentAdjustments.length;
    
    let direction: 'improving' | 'stable' | 'declining';
    if (avgImpact < -3) direction = 'improving'; // Timeline getting shorter
    else if (avgImpact > 3) direction = 'declining'; // Timeline getting longer
    else direction = 'stable';

    return {
      direction,
      velocity: Math.abs(avgImpact),
      confidence: Math.min(90, adjustments.length * 10), // More adjustments = higher confidence
    };
  }

  private analyzeSeasonalPattern(adjustments: GoalAdjustment[]): AdjustmentPattern | null {
    // Simplified seasonal analysis
    const seasonalCounts = { spring: 0, summer: 0, fall: 0, winter: 0 };
    
    adjustments.forEach(adj => {
      const month = new Date(adj.timestamp).getMonth();
      if (month >= 2 && month <= 4) seasonalCounts.spring++;
      else if (month >= 5 && month <= 7) seasonalCounts.summer++;
      else if (month >= 8 && month <= 10) seasonalCounts.fall++;
      else seasonalCounts.winter++;
    });

    const maxSeason = Object.entries(seasonalCounts).reduce((a, b) => a[1] > b[1] ? a : b);
    
    if (maxSeason[1] >= 3 && maxSeason[1] / adjustments.length > 0.4) {
      return {
        patternType: 'seasonal',
        frequency: adjustments.length / Math.max(1, this.getGoalAgeInYears(adjustments)),
        averageImpact: adjustments.reduce((sum, adj) => sum + Math.abs(adj.impactAnalysis.timelineChange), 0) / adjustments.length,
        confidence: Math.min(90, (maxSeason[1] / adjustments.length) * 100),
        description: `Tends to make adjustments in ${maxSeason[0]}`,
        recommendations: [`Consider planning major adjustments for ${maxSeason[0]} when you historically make changes`],
      };
    }

    return null;
  }

  private analyzeMarketPattern(adjustments: GoalAdjustment[]): AdjustmentPattern | null {
    const marketAdjustments = adjustments.filter(adj => adj.category === 'market_change');
    
    if (marketAdjustments.length >= 2) {
      return {
        patternType: 'market_responsive',
        frequency: marketAdjustments.length / Math.max(1, this.getGoalAgeInYears(adjustments)),
        averageImpact: marketAdjustments.reduce((sum, adj) => sum + Math.abs(adj.impactAnalysis.timelineChange), 0) / marketAdjustments.length,
        confidence: Math.min(80, marketAdjustments.length * 20),
        description: 'Responsive to market conditions',
        recommendations: ['Consider setting up automatic rebalancing to reduce manual market-driven adjustments'],
      };
    }

    return null;
  }

  private analyzeIncomePattern(adjustments: GoalAdjustment[]): AdjustmentPattern | null {
    const incomeAdjustments = adjustments.filter(adj => adj.category === 'income_change');
    
    if (incomeAdjustments.length >= 2) {
      return {
        patternType: 'income_driven',
        frequency: incomeAdjustments.length / Math.max(1, this.getGoalAgeInYears(adjustments)),
        averageImpact: incomeAdjustments.reduce((sum, adj) => sum + adj.impactAnalysis.timelineChange, 0) / incomeAdjustments.length,
        confidence: Math.min(85, incomeAdjustments.length * 25),
        description: 'Adjustments correlate with income changes',
        recommendations: ['Consider setting up percentage-based savings to automatically adjust with income changes'],
      };
    }

    return null;
  }

  private getGoalAgeInYears(adjustments: GoalAdjustment[]): number {
    if (adjustments.length === 0) return 1;
    
    const oldest = adjustments[adjustments.length - 1];
    const ageInMs = Date.now() - new Date(oldest.timestamp).getTime();
    return Math.max(1, ageInMs / (365 * 24 * 60 * 60 * 1000));
  }

  private getStabilityRating(score: number): GoalStabilityScore['rating'] {
    if (score >= 80) return 'very_stable';
    if (score >= 65) return 'stable';
    if (score >= 50) return 'moderate';
    if (score >= 35) return 'unstable';
    return 'very_unstable';
  }

  private generateStabilityImprovements(score: number, factors: GoalStabilityScore['factors']): string[] {
    const suggestions = [];
    
    if (score < 70) {
      suggestions.push('Consider setting up automatic savings increases to reduce manual adjustments');
      suggestions.push('Review your goal timeline to ensure it\'s realistic for your situation');
    }
    
    if (factors.some(f => f.factor === 'High Adjustment Frequency')) {
      suggestions.push('Try to batch smaller adjustments into quarterly reviews');
    }
    
    if (factors.some(f => f.factor === 'Major Adjustments')) {
      suggestions.push('Consider building more buffer into your initial goal planning');
    }
    
    return suggestions;
  }
}
