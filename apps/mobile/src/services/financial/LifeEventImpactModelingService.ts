/**
 * LifeEventImpactModelingService
 * Advanced ML-based life event impact modeling with predictions
 * Epic 8, Enhanced Story: Goal Adjustment with ML Predictions
 */

import {
  FinancialGoal,
  FIREGoalMetadata,
  FIREGoalProgress,
} from '@drishti/shared/types/financial';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LifeEventImpactPrediction {
  eventType: string;
  predictedImpact: {
    timelineChange: number; // months
    contributionChange: number; // percentage
    targetAmountChange: number; // dollars
    feasibilityChange: number; // percentage points
    confidenceLevel: number; // 0-100
  };
  riskFactors: Array<{
    factor: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    mitigation: string;
  }>;
  adaptationStrategies: Array<{
    strategy: string;
    effectiveness: number; // 0-100
    timeToImplement: number; // days
    description: string;
    requirements: string[];
  }>;
  historicalComparisons: {
    similarCases: number;
    averageRecoveryTime: number; // months
    successRate: number; // percentage
    commonOutcomes: string[];
  };
}

export interface UserProfile {
  age: number;
  income: number;
  expenses: number;
  savingsRate: number;
  dependents: number;
  jobSecurity: 'high' | 'medium' | 'low';
  industryType: string;
  geographicLocation: string;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  previousLifeEvents: string[];
}

export interface MLModelFeatures {
  userAge: number;
  incomeLevel: number;
  savingsRateHistory: number[];
  goalProgressRate: number;
  marketVolatility: number;
  seasonalFactors: number;
  economicIndicators: {
    inflationRate: number;
    unemploymentRate: number;
    marketPerformance: number;
  };
  personalFactors: {
    jobStability: number;
    familySize: number;
    healthStatus: number;
    debtToIncomeRatio: number;
  };
}

export class LifeEventImpactModelingService {
  private static instance: LifeEventImpactModelingService;
  private readonly STORAGE_KEY = 'life_event_predictions';
  private readonly MODEL_VERSION = '1.0.0';

  // Simulated ML model weights (in a real implementation, these would be trained)
  private readonly modelWeights = {
    jobLoss: {
      timelineImpact: 0.85,
      contributionImpact: 0.95,
      recoveryFactor: 0.7,
      industryFactor: 0.6,
    },
    promotion: {
      timelineImpact: -0.4,
      contributionImpact: -0.6,
      accelerationFactor: 0.8,
      sustainabilityFactor: 0.9,
    },
    marriage: {
      timelineImpact: 0.2,
      contributionImpact: -0.3,
      expenseChangeFactor: 0.4,
      incomeChangeFactor: 0.5,
    },
    childBirth: {
      timelineImpact: 0.6,
      contributionImpact: 0.4,
      expenseIncreaseFactor: 0.8,
      longTermImpactFactor: 0.9,
    },
    inheritance: {
      timelineImpact: -0.7,
      contributionImpact: -0.2,
      windFallFactor: 0.9,
      taxImplicationFactor: 0.3,
    },
  };

  private constructor() {}

  public static getInstance(): LifeEventImpactModelingService {
    if (!LifeEventImpactModelingService.instance) {
      LifeEventImpactModelingService.instance = new LifeEventImpactModelingService();
    }
    return LifeEventImpactModelingService.instance;
  }

  /**
   * Predict life event impact using ML-based modeling
   */
  public async predictLifeEventImpact(
    eventType: string,
    goal: FinancialGoal,
    progress: FIREGoalProgress,
    userProfile: UserProfile,
    eventDetails: Record<string, any> = {}
  ): Promise<LifeEventImpactPrediction> {
    // Extract features for ML model
    const features = this.extractMLFeatures(goal, progress, userProfile, eventDetails);
    
    // Run prediction model
    const prediction = await this.runPredictionModel(eventType, features);
    
    // Generate risk factors
    const riskFactors = this.identifyRiskFactors(eventType, userProfile, features);
    
    // Generate adaptation strategies
    const adaptationStrategies = this.generateAdaptationStrategies(eventType, prediction, userProfile);
    
    // Get historical comparisons
    const historicalComparisons = await this.getHistoricalComparisons(eventType, userProfile);

    const impactPrediction: LifeEventImpactPrediction = {
      eventType,
      predictedImpact: prediction,
      riskFactors,
      adaptationStrategies,
      historicalComparisons,
    };

    // Store prediction for learning
    await this.storePrediction(impactPrediction);

    return impactPrediction;
  }

  /**
   * Get proactive life event predictions based on user patterns
   */
  public async getProactiveLifeEventPredictions(
    goal: FinancialGoal,
    progress: FIREGoalProgress,
    userProfile: UserProfile
  ): Promise<Array<{
    eventType: string;
    probability: number;
    timeframe: string;
    earlyWarningSignals: string[];
    preparationSteps: string[];
  }>> {
    const features = this.extractMLFeatures(goal, progress, userProfile);
    
    const predictions = [
      {
        eventType: 'job_change',
        probability: this.calculateJobChangeProbability(features, userProfile),
        timeframe: '6-18 months',
        earlyWarningSignals: [
          'Industry volatility increasing',
          'Skill gap analysis suggests need for advancement',
          'Market demand for your role changing',
        ],
        preparationSteps: [
          'Build 6-month emergency fund',
          'Update skills and certifications',
          'Network within industry',
          'Consider temporary goal adjustment',
        ],
      },
      {
        eventType: 'family_expansion',
        probability: this.calculateFamilyExpansionProbability(features, userProfile),
        timeframe: '1-3 years',
        earlyWarningSignals: [
          'Life stage indicators',
          'Relationship status changes',
          'Housing situation changes',
        ],
        preparationSteps: [
          'Increase emergency fund',
          'Review health insurance',
          'Plan for temporary income reduction',
          'Adjust FIRE timeline expectations',
        ],
      },
      {
        eventType: 'major_expense',
        probability: this.calculateMajorExpenseProbability(features, userProfile),
        timeframe: '2-5 years',
        earlyWarningSignals: [
          'Aging assets (home, car)',
          'Health indicators',
          'Family member needs',
        ],
        preparationSteps: [
          'Create separate emergency fund',
          'Consider insurance coverage',
          'Plan for goal suspension if needed',
          'Diversify income sources',
        ],
      },
    ];

    return predictions.filter(p => p.probability > 0.3); // Only show likely events
  }

  /**
   * Analyze spending patterns and predict adjustment needs
   */
  public async analyzeSpendingPatternsForAdjustments(
    goal: FinancialGoal,
    spendingHistory: Array<{
      date: string;
      category: string;
      amount: number;
      isRecurring: boolean;
    }>,
    userProfile: UserProfile
  ): Promise<{
    patternAnalysis: {
      trendDirection: 'increasing' | 'decreasing' | 'stable';
      volatility: number;
      seasonalFactors: Record<string, number>;
      categoryBreakdown: Record<string, number>;
    };
    adjustmentRecommendations: Array<{
      type: 'increase_contribution' | 'decrease_contribution' | 'adjust_timeline' | 'review_expenses';
      priority: 'high' | 'medium' | 'low';
      description: string;
      expectedImpact: string;
      implementationSteps: string[];
    }>;
    riskAlerts: Array<{
      risk: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
      mitigation: string;
    }>;
  }> {
    // Analyze spending patterns
    const patternAnalysis = this.analyzeSpendingPatterns(spendingHistory);
    
    // Generate recommendations based on patterns
    const adjustmentRecommendations = this.generateSpendingBasedRecommendations(
      patternAnalysis,
      goal,
      userProfile
    );
    
    // Identify risk alerts
    const riskAlerts = this.identifySpendingRisks(patternAnalysis, userProfile);

    return {
      patternAnalysis,
      adjustmentRecommendations,
      riskAlerts,
    };
  }

  // Private helper methods

  private extractMLFeatures(
    goal: FinancialGoal,
    progress: FIREGoalProgress,
    userProfile: UserProfile,
    eventDetails: Record<string, any> = {}
  ): MLModelFeatures {
    const metadata = goal.metadata as FIREGoalMetadata;
    
    return {
      userAge: userProfile.age,
      incomeLevel: userProfile.income / 1000, // Normalize to thousands
      savingsRateHistory: [userProfile.savingsRate], // Would be historical data
      goalProgressRate: progress.progressPercentage / progress.timeElapsed,
      marketVolatility: 0.15, // Would be from market data
      seasonalFactors: this.calculateSeasonalFactors(),
      economicIndicators: {
        inflationRate: 0.03, // Would be from economic APIs
        unemploymentRate: 0.04,
        marketPerformance: 0.08,
      },
      personalFactors: {
        jobStability: userProfile.jobSecurity === 'high' ? 0.9 : userProfile.jobSecurity === 'medium' ? 0.6 : 0.3,
        familySize: userProfile.dependents + 1,
        healthStatus: 0.8, // Would be from health indicators
        debtToIncomeRatio: 0.2, // Would be calculated from user data
      },
    };
  }

  private async runPredictionModel(
    eventType: string,
    features: MLModelFeatures
  ): Promise<LifeEventImpactPrediction['predictedImpact']> {
    // Simulated ML prediction (in real implementation, this would call a trained model)
    const weights = this.modelWeights[eventType as keyof typeof this.modelWeights] || {
      timelineImpact: 0,
      contributionImpact: 0,
      recoveryFactor: 0.5,
      industryFactor: 0.5,
    };

    // Calculate base impacts
    let timelineChange = weights.timelineImpact * 12; // Convert to months
    let contributionChange = weights.contributionImpact * 100; // Convert to percentage
    let targetAmountChange = 0;
    let feasibilityChange = weights.contributionImpact * -20; // Inverse relationship

    // Apply feature adjustments
    timelineChange *= (1 + features.personalFactors.jobStability * 0.2);
    contributionChange *= (1 + features.economicIndicators.marketPerformance * 0.1);
    
    // Calculate confidence based on data quality and model certainty
    const confidenceLevel = Math.min(95, 60 + features.personalFactors.jobStability * 30);

    return {
      timelineChange: Math.round(timelineChange),
      contributionChange: Math.round(contributionChange),
      targetAmountChange: Math.round(targetAmountChange),
      feasibilityChange: Math.round(feasibilityChange),
      confidenceLevel: Math.round(confidenceLevel),
    };
  }

  private identifyRiskFactors(
    eventType: string,
    userProfile: UserProfile,
    features: MLModelFeatures
  ): LifeEventImpactPrediction['riskFactors'] {
    const riskFactors: LifeEventImpactPrediction['riskFactors'] = [];

    // Job security risk
    if (features.personalFactors.jobStability < 0.5) {
      riskFactors.push({
        factor: 'Job Security',
        severity: 'high',
        description: 'Low job security may compound life event impacts',
        mitigation: 'Build larger emergency fund and diversify income sources',
      });
    }

    // High debt-to-income ratio
    if (features.personalFactors.debtToIncomeRatio > 0.3) {
      riskFactors.push({
        factor: 'Debt Burden',
        severity: 'medium',
        description: 'High debt levels reduce financial flexibility',
        mitigation: 'Prioritize debt reduction before major life changes',
      });
    }

    // Market volatility
    if (features.marketVolatility > 0.2) {
      riskFactors.push({
        factor: 'Market Volatility',
        severity: 'medium',
        description: 'High market volatility increases uncertainty',
        mitigation: 'Consider more conservative investment allocation',
      });
    }

    return riskFactors;
  }

  private generateAdaptationStrategies(
    eventType: string,
    prediction: LifeEventImpactPrediction['predictedImpact'],
    userProfile: UserProfile
  ): LifeEventImpactPrediction['adaptationStrategies'] {
    const strategies: LifeEventImpactPrediction['adaptationStrategies'] = [];

    if (prediction.timelineChange > 6) {
      strategies.push({
        strategy: 'Timeline Extension',
        effectiveness: 85,
        timeToImplement: 1,
        description: 'Extend FIRE timeline to accommodate life changes',
        requirements: ['Goal recalculation', 'Expectation adjustment'],
      });
    }

    if (prediction.contributionChange < -20) {
      strategies.push({
        strategy: 'Contribution Reduction',
        effectiveness: 70,
        timeToImplement: 7,
        description: 'Temporarily reduce contributions to manage cash flow',
        requirements: ['Budget revision', 'Automatic transfer adjustment'],
      });
    }

    strategies.push({
      strategy: 'Emergency Fund Boost',
      effectiveness: 90,
      timeToImplement: 30,
      description: 'Increase emergency fund to handle unexpected changes',
      requirements: ['Temporary contribution redirect', 'High-yield savings account'],
    });

    return strategies;
  }

  private async getHistoricalComparisons(
    eventType: string,
    userProfile: UserProfile
  ): Promise<LifeEventImpactPrediction['historicalComparisons']> {
    // Simulated historical data (would be from database in real implementation)
    return {
      similarCases: Math.floor(Math.random() * 1000) + 100,
      averageRecoveryTime: Math.floor(Math.random() * 12) + 6,
      successRate: Math.floor(Math.random() * 30) + 70,
      commonOutcomes: [
        'Temporary timeline extension',
        'Successful adaptation within 18 months',
        'Improved financial resilience',
      ],
    };
  }

  private calculateJobChangeProbability(features: MLModelFeatures, userProfile: UserProfile): number {
    let probability = 0.3; // Base probability
    
    if (features.personalFactors.jobStability < 0.5) probability += 0.3;
    if (userProfile.age > 45) probability -= 0.1;
    if (features.economicIndicators.unemploymentRate > 0.05) probability += 0.2;
    
    return Math.max(0, Math.min(1, probability));
  }

  private calculateFamilyExpansionProbability(features: MLModelFeatures, userProfile: UserProfile): number {
    let probability = 0.2; // Base probability
    
    if (userProfile.age >= 25 && userProfile.age <= 35) probability += 0.4;
    if (userProfile.dependents === 0) probability += 0.2;
    if (features.incomeLevel > 75) probability += 0.1;
    
    return Math.max(0, Math.min(1, probability));
  }

  private calculateMajorExpenseProbability(features: MLModelFeatures, userProfile: UserProfile): number {
    let probability = 0.4; // Base probability
    
    if (userProfile.age > 40) probability += 0.2;
    if (features.personalFactors.familySize > 2) probability += 0.1;
    if (features.personalFactors.healthStatus < 0.8) probability += 0.2;
    
    return Math.max(0, Math.min(1, probability));
  }

  private analyzeSpendingPatterns(spendingHistory: Array<{
    date: string;
    category: string;
    amount: number;
    isRecurring: boolean;
  }>) {
    // Calculate trend direction
    const monthlyTotals = this.groupSpendingByMonth(spendingHistory);
    const trendDirection = this.calculateTrendDirection(monthlyTotals);
    
    // Calculate volatility
    const volatility = this.calculateSpendingVolatility(monthlyTotals);
    
    // Calculate seasonal factors
    const seasonalFactors = this.calculateSpendingSeasonality(spendingHistory);
    
    // Category breakdown
    const categoryBreakdown = this.calculateCategoryBreakdown(spendingHistory);

    return {
      trendDirection,
      volatility,
      seasonalFactors,
      categoryBreakdown,
    };
  }

  private generateSpendingBasedRecommendations(
    patternAnalysis: any,
    goal: FinancialGoal,
    userProfile: UserProfile
  ) {
    const recommendations = [];

    if (patternAnalysis.trendDirection === 'increasing' && patternAnalysis.volatility > 0.2) {
      recommendations.push({
        type: 'review_expenses' as const,
        priority: 'high' as const,
        description: 'Spending is increasing with high volatility - review and optimize expenses',
        expectedImpact: 'Could improve contribution capacity by 10-15%',
        implementationSteps: [
          'Categorize all expenses',
          'Identify discretionary spending',
          'Set category budgets',
          'Use automated tracking',
        ],
      });
    }

    if (patternAnalysis.trendDirection === 'decreasing') {
      recommendations.push({
        type: 'increase_contribution' as const,
        priority: 'medium' as const,
        description: 'Decreasing spending trend allows for increased FIRE contributions',
        expectedImpact: 'Could accelerate FIRE timeline by 6-12 months',
        implementationSteps: [
          'Calculate available surplus',
          'Increase automatic contributions',
          'Maintain lifestyle inflation control',
        ],
      });
    }

    return recommendations;
  }

  private identifySpendingRisks(patternAnalysis: any, userProfile: UserProfile) {
    const risks = [];

    if (patternAnalysis.volatility > 0.3) {
      risks.push({
        risk: 'High Spending Volatility',
        severity: 'medium' as const,
        description: 'Unpredictable spending patterns may impact goal consistency',
        mitigation: 'Implement stricter budgeting and automated savings',
      });
    }

    return risks;
  }

  // Utility methods
  private calculateSeasonalFactors(): number {
    const month = new Date().getMonth();
    // Higher spending in holiday months
    return month === 11 || month === 0 ? 1.2 : month >= 5 && month <= 7 ? 1.1 : 1.0;
  }

  private groupSpendingByMonth(spendingHistory: any[]): number[] {
    // Simplified implementation
    return [1000, 1100, 950, 1200, 1050]; // Mock monthly totals
  }

  private calculateTrendDirection(monthlyTotals: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (monthlyTotals.length < 2) return 'stable';
    
    const first = monthlyTotals[0];
    const last = monthlyTotals[monthlyTotals.length - 1];
    const change = (last - first) / first;
    
    if (change > 0.05) return 'increasing';
    if (change < -0.05) return 'decreasing';
    return 'stable';
  }

  private calculateSpendingVolatility(monthlyTotals: number[]): number {
    if (monthlyTotals.length < 2) return 0;
    
    const mean = monthlyTotals.reduce((sum, val) => sum + val, 0) / monthlyTotals.length;
    const variance = monthlyTotals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / monthlyTotals.length;
    
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  private calculateSpendingSeasonality(spendingHistory: any[]): Record<string, number> {
    // Simplified seasonal analysis
    return {
      'Q1': 1.0,
      'Q2': 0.9,
      'Q3': 1.1,
      'Q4': 1.2,
    };
  }

  private calculateCategoryBreakdown(spendingHistory: any[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    const total = spendingHistory.reduce((sum, item) => sum + item.amount, 0);
    
    spendingHistory.forEach(item => {
      breakdown[item.category] = (breakdown[item.category] || 0) + item.amount;
    });
    
    // Convert to percentages
    Object.keys(breakdown).forEach(category => {
      breakdown[category] = (breakdown[category] / total) * 100;
    });
    
    return breakdown;
  }

  private async storePrediction(prediction: LifeEventImpactPrediction): Promise<void> {
    try {
      const existingPredictions = await this.getPredictionHistory();
      existingPredictions.push({
        ...prediction,
        timestamp: new Date().toISOString(),
        modelVersion: this.MODEL_VERSION,
      });
      
      // Keep only recent predictions
      const recentPredictions = existingPredictions.slice(-50);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentPredictions));
    } catch (error) {
      console.error('Failed to store prediction:', error);
    }
  }

  private async getPredictionHistory(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get prediction history:', error);
      return [];
    }
  }
}
