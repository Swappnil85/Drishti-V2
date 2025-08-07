/**
 * EnhancedFeasibilityService
 * Comprehensive feasibility analysis with sensitivity analysis, peer comparison, and risk modeling
 * Epic 8, Story: Goal Feasibility Analysis
 */

import {
  FinancialGoal,
  FIREGoalMetadata,
  FIREGoalFeasibility,
} from '@drishti/shared/types/financial';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SensitivityAnalysis {
  parameter: 'income' | 'expenses' | 'returns' | 'timeline';
  baseValue: number;
  scenarios: Array<{
    change: number; // percentage change
    newValue: number;
    feasibilityScore: number;
    feasibilityRating: 'excellent' | 'good' | 'challenging' | 'unrealistic';
    impact: string;
  }>;
}

export interface AlternativeTimeline {
  originalYears: number;
  suggestedYears: number;
  feasibilityImprovement: number;
  requiredSavingsRate: number;
  monthlyContribution: number;
  reasoning: string;
  tradeoffs: string[];
  benefits: string[];
}

export interface PeerComparison {
  userDemographic: {
    ageRange: string;
    incomeRange: string;
    location: string;
    familyStatus: string;
  };
  peerMetrics: {
    averageFeasibilityScore: number;
    averageSavingsRate: number;
    averageTimeToFIRE: number;
    percentileRanking: number; // User's ranking among peers
  };
  insights: string[];
  recommendations: string[];
}

export interface RiskAdjustedFeasibility {
  baselineFeasibility: number;
  riskAdjustedFeasibility: number;
  riskFactors: Array<{
    factor: string;
    probability: number; // 0-1
    impact: number; // -100 to 100
    description: string;
    mitigation: string;
  }>;
  confidenceInterval: {
    lower: number;
    upper: number;
    confidence: number; // e.g., 95%
  };
  worstCaseScenario: {
    feasibilityScore: number;
    description: string;
    probability: number;
  };
  bestCaseScenario: {
    feasibilityScore: number;
    description: string;
    probability: number;
  };
}

export interface LifeEventImpact {
  eventType: string;
  probability: number;
  timeframe: string;
  feasibilityImpact: number;
  description: string;
  preparationSteps: string[];
}

export interface EnhancedFeasibilityAnalysis extends FIREGoalFeasibility {
  sensitivityAnalysis: SensitivityAnalysis[];
  alternativeTimelines: AlternativeTimeline[];
  peerComparison: PeerComparison;
  riskAdjustedAnalysis: RiskAdjustedFeasibility;
  lifeEventImpacts: LifeEventImpact[];
  improvementPlan: {
    quickWins: Array<{
      action: string;
      feasibilityImprovement: number;
      timeToImplement: string;
      difficulty: 'easy' | 'moderate' | 'difficult';
    }>;
    longTermStrategies: Array<{
      strategy: string;
      feasibilityImprovement: number;
      timeToImplement: string;
      requirements: string[];
    }>;
  };
}

export class EnhancedFeasibilityService {
  private static instance: EnhancedFeasibilityService;
  private readonly STORAGE_KEY = 'enhanced_feasibility_data';
  private readonly PEER_DATA_KEY = 'peer_comparison_data';

  private constructor() {}

  public static getInstance(): EnhancedFeasibilityService {
    if (!EnhancedFeasibilityService.instance) {
      EnhancedFeasibilityService.instance = new EnhancedFeasibilityService();
    }
    return EnhancedFeasibilityService.instance;
  }

  /**
   * Perform comprehensive enhanced feasibility analysis
   */
  public async performEnhancedAnalysis(
    goal: FinancialGoal,
    baseFeasibility: FIREGoalFeasibility
  ): Promise<EnhancedFeasibilityAnalysis> {
    const metadata = goal.metadata as FIREGoalMetadata;

    // Perform all enhanced analyses
    const [
      sensitivityAnalysis,
      alternativeTimelines,
      peerComparison,
      riskAdjustedAnalysis,
      lifeEventImpacts,
      improvementPlan,
    ] = await Promise.all([
      this.performSensitivityAnalysis(goal, baseFeasibility),
      this.generateAlternativeTimelines(goal, baseFeasibility),
      this.performPeerComparison(goal, metadata),
      this.performRiskAdjustedAnalysis(goal, baseFeasibility),
      this.analyzeLifeEventImpacts(goal, metadata),
      this.generateImprovementPlan(goal, baseFeasibility),
    ]);

    const enhancedAnalysis: EnhancedFeasibilityAnalysis = {
      ...baseFeasibility,
      sensitivityAnalysis,
      alternativeTimelines,
      peerComparison,
      riskAdjustedAnalysis,
      lifeEventImpacts,
      improvementPlan,
    };

    // Store analysis for future reference
    await this.storeAnalysis(enhancedAnalysis);

    return enhancedAnalysis;
  }

  /**
   * Perform sensitivity analysis on key parameters
   */
  private async performSensitivityAnalysis(
    goal: FinancialGoal,
    baseFeasibility: FIREGoalFeasibility
  ): Promise<SensitivityAnalysis[]> {
    const metadata = goal.metadata as FIREGoalMetadata;
    const analyses: SensitivityAnalysis[] = [];

    // Income sensitivity
    const incomeAnalysis = await this.analyzeSensitivity(
      'income',
      metadata.currentIncome || 80000,
      [-20, -10, -5, 5, 10, 20],
      goal,
      baseFeasibility
    );
    analyses.push(incomeAnalysis);

    // Expense sensitivity
    const expenseAnalysis = await this.analyzeSensitivity(
      'expenses',
      metadata.monthlyExpenses * 12,
      [-20, -10, -5, 5, 10, 20],
      goal,
      baseFeasibility
    );
    analyses.push(expenseAnalysis);

    // Return sensitivity
    const returnAnalysis = await this.analyzeSensitivity(
      'returns',
      metadata.expectedReturn || 0.07,
      [-2, -1, -0.5, 0.5, 1, 2],
      goal,
      baseFeasibility
    );
    analyses.push(returnAnalysis);

    // Timeline sensitivity
    const currentAge = metadata.currentAge || 30;
    const targetAge = metadata.targetRetirementAge || 65;
    const timelineAnalysis = await this.analyzeSensitivity(
      'timeline',
      targetAge - currentAge,
      [-5, -3, -1, 1, 3, 5],
      goal,
      baseFeasibility
    );
    analyses.push(timelineAnalysis);

    return analyses;
  }

  /**
   * Generate alternative timeline suggestions
   */
  private async generateAlternativeTimelines(
    goal: FinancialGoal,
    baseFeasibility: FIREGoalFeasibility
  ): Promise<AlternativeTimeline[]> {
    const metadata = goal.metadata as FIREGoalMetadata;
    const alternatives: AlternativeTimeline[] = [];

    const currentAge = metadata.currentAge || 30;
    const targetAge = metadata.targetRetirementAge || 65;
    const originalYears = targetAge - currentAge;

    // If current goal is unrealistic or challenging, suggest alternatives
    if (baseFeasibility.feasibilityRating === 'unrealistic' || baseFeasibility.feasibilityRating === 'challenging') {
      // Suggest extending timeline by 2-5 years
      for (let extension = 2; extension <= 5; extension++) {
        const newYears = originalYears + extension;
        const newFeasibility = await this.calculateFeasibilityForTimeline(goal, newYears);
        
        if (newFeasibility.feasibilityScore > baseFeasibility.feasibilityScore + 20) {
          alternatives.push({
            originalYears,
            suggestedYears: newYears,
            feasibilityImprovement: newFeasibility.feasibilityScore - baseFeasibility.feasibilityScore,
            requiredSavingsRate: newFeasibility.requiredSavingsRate,
            monthlyContribution: newFeasibility.requiredMonthlyContribution,
            reasoning: `Extending timeline by ${extension} years significantly improves feasibility`,
            tradeoffs: [
              `Retire ${extension} years later`,
              'More time exposed to market volatility',
              'Lifestyle inflation risk over longer period',
            ],
            benefits: [
              `${newFeasibility.feasibilityScore - baseFeasibility.feasibilityScore}% improvement in feasibility`,
              `Reduced monthly contribution by $${Math.round(baseFeasibility.requiredMonthlyContribution - newFeasibility.requiredMonthlyContribution)}`,
              'More time for career advancement and income growth',
              'Greater financial security and buffer',
            ],
          });
        }
      }
    }

    // If goal is excellent, suggest accelerated timelines
    if (baseFeasibility.feasibilityRating === 'excellent') {
      for (let reduction = 1; reduction <= 3; reduction++) {
        const newYears = Math.max(5, originalYears - reduction); // Minimum 5 years
        const newFeasibility = await this.calculateFeasibilityForTimeline(goal, newYears);
        
        if (newFeasibility.feasibilityScore >= 60) { // Still reasonable
          alternatives.push({
            originalYears,
            suggestedYears: newYears,
            feasibilityImprovement: newFeasibility.feasibilityScore - baseFeasibility.feasibilityScore,
            requiredSavingsRate: newFeasibility.requiredSavingsRate,
            monthlyContribution: newFeasibility.requiredMonthlyContribution,
            reasoning: `Your current progress allows for earlier retirement`,
            tradeoffs: [
              `Higher monthly contribution required (+$${Math.round(newFeasibility.requiredMonthlyContribution - baseFeasibility.requiredMonthlyContribution)})`,
              'Less margin for error',
              'Higher savings rate required',
            ],
            benefits: [
              `Retire ${reduction} years earlier`,
              'More years of financial freedom',
              'Reduced lifetime work requirement',
            ],
          });
        }
      }
    }

    return alternatives;
  }

  /**
   * Perform peer comparison analysis
   */
  private async performPeerComparison(
    goal: FinancialGoal,
    metadata: FIREGoalMetadata
  ): Promise<PeerComparison> {
    // Determine user demographic
    const age = metadata.currentAge || 30;
    const income = metadata.currentIncome || 80000;
    const dependents = metadata.dependents || 0;

    const demographic = {
      ageRange: this.getAgeRange(age),
      incomeRange: this.getIncomeRange(income),
      location: 'US', // Would be from user profile
      familyStatus: dependents > 0 ? 'with_dependents' : 'no_dependents',
    };

    // Get peer data (simulated - would be from database)
    const peerData = await this.getPeerData(demographic);

    const userSavingsRate = metadata.currentSavingsRate || 0.2;
    const userTimeToFIRE = (metadata.targetRetirementAge || 65) - age;

    return {
      userDemographic: demographic,
      peerMetrics: {
        averageFeasibilityScore: peerData.avgFeasibilityScore,
        averageSavingsRate: peerData.avgSavingsRate,
        averageTimeToFIRE: peerData.avgTimeToFIRE,
        percentileRanking: this.calculatePercentile(userSavingsRate, peerData.savingsRateDistribution),
      },
      insights: this.generatePeerInsights(userSavingsRate, userTimeToFIRE, peerData),
      recommendations: this.generatePeerRecommendations(userSavingsRate, peerData),
    };
  }

  /**
   * Perform risk-adjusted feasibility analysis
   */
  private async performRiskAdjustedAnalysis(
    goal: FinancialGoal,
    baseFeasibility: FIREGoalFeasibility
  ): Promise<RiskAdjustedFeasibility> {
    const metadata = goal.metadata as FIREGoalMetadata;
    
    // Identify risk factors
    const riskFactors = [
      {
        factor: 'Market Volatility',
        probability: 0.8,
        impact: -15,
        description: 'Market downturns could reduce portfolio value',
        mitigation: 'Diversify investments and maintain emergency fund',
      },
      {
        factor: 'Job Loss',
        probability: this.calculateJobLossRisk(metadata),
        impact: -25,
        description: 'Unemployment could halt contributions',
        mitigation: 'Build larger emergency fund and develop multiple income streams',
      },
      {
        factor: 'Health Issues',
        probability: this.calculateHealthRisk(metadata),
        impact: -20,
        description: 'Medical expenses could impact savings',
        mitigation: 'Maintain comprehensive health insurance',
      },
      {
        factor: 'Inflation',
        probability: 0.9,
        impact: -10,
        description: 'Higher than expected inflation reduces purchasing power',
        mitigation: 'Include inflation-protected investments',
      },
    ];

    // Calculate risk-adjusted feasibility
    const totalRiskImpact = riskFactors.reduce((sum, risk) => 
      sum + (risk.probability * risk.impact), 0
    );
    
    const riskAdjustedFeasibility = Math.max(0, baseFeasibility.feasibilityScore + totalRiskImpact);

    // Calculate confidence interval
    const standardDeviation = 15; // Typical feasibility score volatility
    const confidenceInterval = {
      lower: Math.max(0, riskAdjustedFeasibility - 1.96 * standardDeviation),
      upper: Math.min(100, riskAdjustedFeasibility + 1.96 * standardDeviation),
      confidence: 95,
    };

    return {
      baselineFeasibility: baseFeasibility.feasibilityScore,
      riskAdjustedFeasibility,
      riskFactors,
      confidenceInterval,
      worstCaseScenario: {
        feasibilityScore: Math.max(0, baseFeasibility.feasibilityScore - 40),
        description: 'Multiple adverse events occur simultaneously',
        probability: 0.05,
      },
      bestCaseScenario: {
        feasibilityScore: Math.min(100, baseFeasibility.feasibilityScore + 20),
        description: 'Favorable market conditions and career advancement',
        probability: 0.15,
      },
    };
  }

  /**
   * Analyze life event impacts on feasibility
   */
  private async analyzeLifeEventImpacts(
    goal: FinancialGoal,
    metadata: FIREGoalMetadata
  ): Promise<LifeEventImpact[]> {
    const age = metadata.currentAge || 30;
    const dependents = metadata.dependents || 0;
    
    const impacts: LifeEventImpact[] = [];

    // Career advancement
    if (age < 45) {
      impacts.push({
        eventType: 'Career Advancement',
        probability: 0.6,
        timeframe: '2-5 years',
        feasibilityImpact: 15,
        description: 'Promotion or job change could increase income significantly',
        preparationSteps: [
          'Invest in skill development',
          'Build professional network',
          'Document achievements for negotiations',
        ],
      });
    }

    // Family expansion
    if (age < 40 && dependents === 0) {
      impacts.push({
        eventType: 'Family Expansion',
        probability: 0.4,
        timeframe: '1-5 years',
        feasibilityImpact: -20,
        description: 'Children increase expenses and may reduce dual income',
        preparationSteps: [
          'Build larger emergency fund',
          'Research childcare costs',
          'Consider 529 education savings',
        ],
      });
    }

    // Major home purchase
    if (metadata.monthlyExpenses < 2000) { // Likely renting
      impacts.push({
        eventType: 'Home Purchase',
        probability: 0.5,
        timeframe: '1-3 years',
        feasibilityImpact: -10,
        description: 'Home ownership increases monthly expenses but builds equity',
        preparationSteps: [
          'Save for down payment separately',
          'Research total cost of ownership',
          'Consider impact on FIRE timeline',
        ],
      });
    }

    return impacts;
  }

  /**
   * Generate improvement plan with quick wins and long-term strategies
   */
  private async generateImprovementPlan(
    goal: FinancialGoal,
    baseFeasibility: FIREGoalFeasibility
  ): Promise<EnhancedFeasibilityAnalysis['improvementPlan']> {
    const metadata = goal.metadata as FIREGoalMetadata;
    
    const quickWins = [];
    const longTermStrategies = [];

    // Quick wins based on current situation
    if (baseFeasibility.feasibilityScore < 80) {
      quickWins.push({
        action: 'Reduce discretionary spending by 10%',
        feasibilityImprovement: 8,
        timeToImplement: '1 month',
        difficulty: 'easy' as const,
      });

      quickWins.push({
        action: 'Automate savings to prevent lifestyle inflation',
        feasibilityImprovement: 5,
        timeToImplement: '1 week',
        difficulty: 'easy' as const,
      });

      if ((metadata.currentSavingsRate || 0.2) < 0.25) {
        quickWins.push({
          action: 'Increase savings rate by 2%',
          feasibilityImprovement: 12,
          timeToImplement: '1 month',
          difficulty: 'moderate' as const,
        });
      }
    }

    // Long-term strategies
    longTermStrategies.push({
      strategy: 'Develop additional income streams',
      feasibilityImprovement: 25,
      timeToImplement: '6-12 months',
      requirements: ['Skill development', 'Time investment', 'Market research'],
    });

    longTermStrategies.push({
      strategy: 'Optimize investment allocation for higher returns',
      feasibilityImprovement: 15,
      timeToImplement: '3-6 months',
      requirements: ['Investment education', 'Risk assessment', 'Portfolio rebalancing'],
    });

    if (metadata.currentAge && metadata.currentAge < 50) {
      longTermStrategies.push({
        strategy: 'Focus on career advancement for income growth',
        feasibilityImprovement: 30,
        timeToImplement: '1-3 years',
        requirements: ['Skill development', 'Networking', 'Performance improvement'],
      });
    }

    return {
      quickWins,
      longTermStrategies,
    };
  }

  // Helper methods

  private async analyzeSensitivity(
    parameter: SensitivityAnalysis['parameter'],
    baseValue: number,
    changes: number[],
    goal: FinancialGoal,
    baseFeasibility: FIREGoalFeasibility
  ): Promise<SensitivityAnalysis> {
    const scenarios = [];

    for (const change of changes) {
      const newValue = parameter === 'returns' 
        ? baseValue + (change / 100) // For returns, add percentage points
        : baseValue * (1 + change / 100); // For others, multiply by percentage

      // Simulate feasibility calculation with new value
      const newFeasibility = await this.simulateFeasibilityWithChange(
        goal,
        parameter,
        newValue
      );

      scenarios.push({
        change,
        newValue,
        feasibilityScore: newFeasibility.feasibilityScore,
        feasibilityRating: newFeasibility.feasibilityRating,
        impact: this.describeSensitivityImpact(parameter, change, newFeasibility.feasibilityScore - baseFeasibility.feasibilityScore),
      });
    }

    return {
      parameter,
      baseValue,
      scenarios,
    };
  }

  private async calculateFeasibilityForTimeline(
    goal: FinancialGoal,
    newTimelineYears: number
  ): Promise<{ feasibilityScore: number; requiredSavingsRate: number; requiredMonthlyContribution: number }> {
    // Simplified calculation - in real implementation would use full feasibility engine
    const metadata = goal.metadata as FIREGoalMetadata;
    const currentAge = metadata.currentAge || 30;
    const income = metadata.currentIncome || 80000;
    
    // Calculate required monthly contribution for new timeline
    const monthsToGoal = newTimelineYears * 12;
    const futureValue = goal.target_amount;
    const presentValue = goal.current_amount;
    const monthlyReturn = (metadata.expectedReturn || 0.07) / 12;
    
    // PMT calculation for required monthly contribution
    const requiredMonthlyContribution = monthsToGoal > 0 
      ? (futureValue - presentValue * Math.pow(1 + monthlyReturn, monthsToGoal)) / 
        (((Math.pow(1 + monthlyReturn, monthsToGoal) - 1) / monthlyReturn))
      : 0;
    
    const requiredSavingsRate = (requiredMonthlyContribution * 12) / income;
    
    // Calculate feasibility score based on required savings rate
    let feasibilityScore = 100;
    if (requiredSavingsRate > 0.5) feasibilityScore = 20;
    else if (requiredSavingsRate > 0.4) feasibilityScore = 40;
    else if (requiredSavingsRate > 0.3) feasibilityScore = 60;
    else if (requiredSavingsRate > 0.2) feasibilityScore = 80;
    
    return {
      feasibilityScore,
      requiredSavingsRate,
      requiredMonthlyContribution,
    };
  }

  private getAgeRange(age: number): string {
    if (age < 25) return '18-24';
    if (age < 35) return '25-34';
    if (age < 45) return '35-44';
    if (age < 55) return '45-54';
    return '55+';
  }

  private getIncomeRange(income: number): string {
    if (income < 50000) return '<$50K';
    if (income < 75000) return '$50K-$75K';
    if (income < 100000) return '$75K-$100K';
    if (income < 150000) return '$100K-$150K';
    return '$150K+';
  }

  private async getPeerData(demographic: any) {
    // Simulated peer data - would come from database
    return {
      avgFeasibilityScore: 65,
      avgSavingsRate: 0.22,
      avgTimeToFIRE: 25,
      savingsRateDistribution: [0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4], // Sorted array for percentile calculation
    };
  }

  private calculatePercentile(userValue: number, distribution: number[]): number {
    const sorted = [...distribution].sort((a, b) => a - b);
    const index = sorted.findIndex(val => val >= userValue);
    return index === -1 ? 100 : (index / sorted.length) * 100;
  }

  private generatePeerInsights(userSavingsRate: number, userTimeToFIRE: number, peerData: any): string[] {
    const insights = [];
    
    if (userSavingsRate > peerData.avgSavingsRate) {
      insights.push(`Your ${(userSavingsRate * 100).toFixed(1)}% savings rate is above the peer average of ${(peerData.avgSavingsRate * 100).toFixed(1)}%`);
    } else {
      insights.push(`Your savings rate is below peer average - consider increasing to match the ${(peerData.avgSavingsRate * 100).toFixed(1)}% average`);
    }
    
    if (userTimeToFIRE < peerData.avgTimeToFIRE) {
      insights.push(`Your ${userTimeToFIRE}-year timeline is more aggressive than the peer average of ${peerData.avgTimeToFIRE} years`);
    }
    
    return insights;
  }

  private generatePeerRecommendations(userSavingsRate: number, peerData: any): string[] {
    const recommendations = [];
    
    if (userSavingsRate < peerData.avgSavingsRate) {
      recommendations.push('Consider increasing your savings rate to match successful peers in your demographic');
      recommendations.push('Review expense categories where peers typically optimize spending');
    }
    
    return recommendations;
  }

  private calculateJobLossRisk(metadata: FIREGoalMetadata): number {
    // Simplified risk calculation
    const age = metadata.currentAge || 30;
    const baseRisk = 0.1; // 10% base risk
    
    if (age > 50) return baseRisk * 1.5; // Higher risk for older workers
    if (age < 30) return baseRisk * 1.2; // Higher risk for younger workers
    return baseRisk;
  }

  private calculateHealthRisk(metadata: FIREGoalMetadata): number {
    const age = metadata.currentAge || 30;
    return Math.min(0.5, 0.05 + (age - 30) * 0.01); // Increases with age
  }

  private describeSensitivityImpact(parameter: string, change: number, impact: number): string {
    const direction = change > 0 ? 'increase' : 'decrease';
    const magnitude = Math.abs(change);
    const impactDirection = impact > 0 ? 'improves' : 'reduces';
    const impactMagnitude = Math.abs(Math.round(impact));
    
    return `${magnitude}% ${direction} in ${parameter} ${impactDirection} feasibility by ${impactMagnitude} points`;
  }

  private async simulateFeasibilityWithChange(
    goal: FinancialGoal,
    parameter: string,
    newValue: number
  ): Promise<{ feasibilityScore: number; feasibilityRating: 'excellent' | 'good' | 'challenging' | 'unrealistic' }> {
    // Simplified simulation - would use full feasibility calculation
    const baseScore = 65; // Assume base feasibility
    let adjustment = 0;
    
    switch (parameter) {
      case 'income':
        adjustment = (newValue - 80000) / 80000 * 30; // Income impact
        break;
      case 'expenses':
        adjustment = -(newValue - 48000) / 48000 * 25; // Expense impact (negative)
        break;
      case 'returns':
        adjustment = (newValue - 0.07) * 500; // Return impact
        break;
      case 'timeline':
        adjustment = (newValue - 35) * 2; // Timeline impact
        break;
    }
    
    const newScore = Math.max(0, Math.min(100, baseScore + adjustment));
    
    let rating: 'excellent' | 'good' | 'challenging' | 'unrealistic';
    if (newScore >= 80) rating = 'excellent';
    else if (newScore >= 60) rating = 'good';
    else if (newScore >= 40) rating = 'challenging';
    else rating = 'unrealistic';
    
    return { feasibilityScore: newScore, feasibilityRating: rating };
  }

  private async storeAnalysis(analysis: EnhancedFeasibilityAnalysis): Promise<void> {
    try {
      const existingData = await AsyncStorage.getItem(this.STORAGE_KEY);
      const analyses = existingData ? JSON.parse(existingData) : [];
      
      analyses.push({
        ...analysis,
        timestamp: new Date().toISOString(),
      });
      
      // Keep only recent analyses
      const recentAnalyses = analyses.slice(-10);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentAnalyses));
    } catch (error) {
      console.error('Failed to store enhanced feasibility analysis:', error);
    }
  }
}
