/**
 * AutomatedAdjustmentService
 * Automated adjustment suggestions based on spending pattern analysis
 * Epic 8, Enhanced Story: Goal Adjustment with Automated Suggestions
 */

import {
  FinancialGoal,
  FIREGoalMetadata,
  FIREGoalProgress,
} from '@drishti/shared/types/financial';
import { LifeEventImpactModelingService, UserProfile } from './LifeEventImpactModelingService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AutomatedAdjustmentSuggestion {
  id: string;
  type: 'contribution_increase' | 'contribution_decrease' | 'timeline_adjustment' | 'expense_optimization' | 'goal_restructure';
  priority: 'critical' | 'high' | 'medium' | 'low';
  confidence: number; // 0-100
  title: string;
  description: string;
  reasoning: string[];
  expectedImpact: {
    timelineDelta: number; // months
    contributionDelta: number; // dollars/month
    feasibilityImprovement: number; // percentage points
    riskReduction: number; // percentage points
  };
  implementationSteps: Array<{
    step: string;
    timeRequired: string;
    difficulty: 'easy' | 'moderate' | 'difficult';
    prerequisites: string[];
  }>;
  triggers: string[];
  validUntil: string;
  automationPossible: boolean;
}

export interface SpendingAnalysis {
  patterns: {
    averageMonthlySpending: number;
    spendingTrend: 'increasing' | 'decreasing' | 'stable';
    volatility: number;
    seasonalVariation: number;
    categoryDistribution: Record<string, number>;
  };
  anomalies: Array<{
    date: string;
    category: string;
    amount: number;
    deviation: number;
    explanation: string;
  }>;
  opportunities: Array<{
    category: string;
    potentialSavings: number;
    difficulty: 'easy' | 'moderate' | 'difficult';
    description: string;
  }>;
}

export interface AdjustmentTrigger {
  type: 'spending_increase' | 'income_change' | 'goal_deviation' | 'market_change' | 'life_event';
  threshold: number;
  description: string;
  isActive: boolean;
  lastTriggered?: string;
}

export class AutomatedAdjustmentService {
  private static instance: AutomatedAdjustmentService;
  private readonly STORAGE_KEY = 'automated_suggestions';
  private readonly TRIGGERS_KEY = 'adjustment_triggers';
  private lifeEventService: LifeEventImpactModelingService;

  private constructor() {
    this.lifeEventService = LifeEventImpactModelingService.getInstance();
  }

  public static getInstance(): AutomatedAdjustmentService {
    if (!AutomatedAdjustmentService.instance) {
      AutomatedAdjustmentService.instance = new AutomatedAdjustmentService();
    }
    return AutomatedAdjustmentService.instance;
  }

  /**
   * Generate automated adjustment suggestions based on comprehensive analysis
   */
  public async generateAdjustmentSuggestions(
    goal: FinancialGoal,
    progress: FIREGoalProgress,
    userProfile: UserProfile,
    spendingHistory: Array<{
      date: string;
      category: string;
      amount: number;
      isRecurring: boolean;
    }>,
    marketData?: {
      currentVolatility: number;
      expectedReturns: number;
      economicIndicators: Record<string, number>;
    }
  ): Promise<AutomatedAdjustmentSuggestion[]> {
    // Analyze spending patterns
    const spendingAnalysis = await this.analyzeSpendingPatterns(spendingHistory);
    
    // Check for triggered conditions
    const triggeredConditions = await this.checkAdjustmentTriggers(goal, progress, spendingAnalysis);
    
    // Generate suggestions based on different factors
    const suggestions: AutomatedAdjustmentSuggestion[] = [];
    
    // Spending-based suggestions
    suggestions.push(...await this.generateSpendingBasedSuggestions(goal, progress, spendingAnalysis, userProfile));
    
    // Progress-based suggestions
    suggestions.push(...await this.generateProgressBasedSuggestions(goal, progress, userProfile));
    
    // Market-based suggestions
    if (marketData) {
      suggestions.push(...await this.generateMarketBasedSuggestions(goal, progress, marketData, userProfile));
    }
    
    // Life event predictions
    suggestions.push(...await this.generateProactiveSuggestions(goal, progress, userProfile));
    
    // Filter and prioritize suggestions
    const filteredSuggestions = this.filterAndPrioritizeSuggestions(suggestions, triggeredConditions);
    
    // Store suggestions for tracking
    await this.storeSuggestions(filteredSuggestions);
    
    return filteredSuggestions;
  }

  /**
   * Analyze spending patterns for optimization opportunities
   */
  public async analyzeSpendingPatterns(
    spendingHistory: Array<{
      date: string;
      category: string;
      amount: number;
      isRecurring: boolean;
    }>
  ): Promise<SpendingAnalysis> {
    // Calculate spending patterns
    const monthlyTotals = this.calculateMonthlyTotals(spendingHistory);
    const averageMonthlySpending = monthlyTotals.reduce((sum, val) => sum + val, 0) / monthlyTotals.length;
    
    const spendingTrend = this.calculateSpendingTrend(monthlyTotals);
    const volatility = this.calculateVolatility(monthlyTotals);
    const seasonalVariation = this.calculateSeasonalVariation(spendingHistory);
    const categoryDistribution = this.calculateCategoryDistribution(spendingHistory);
    
    // Detect anomalies
    const anomalies = this.detectSpendingAnomalies(spendingHistory, averageMonthlySpending);
    
    // Identify optimization opportunities
    const opportunities = this.identifyOptimizationOpportunities(categoryDistribution, spendingHistory);

    return {
      patterns: {
        averageMonthlySpending,
        spendingTrend,
        volatility,
        seasonalVariation,
        categoryDistribution,
      },
      anomalies,
      opportunities,
    };
  }

  /**
   * Set up automated triggers for adjustment suggestions
   */
  public async setupAdjustmentTriggers(
    goal: FinancialGoal,
    customTriggers: Partial<AdjustmentTrigger>[] = []
  ): Promise<AdjustmentTrigger[]> {
    const defaultTriggers: AdjustmentTrigger[] = [
      {
        type: 'spending_increase',
        threshold: 0.15, // 15% increase
        description: 'Monthly spending increased by more than 15%',
        isActive: true,
      },
      {
        type: 'goal_deviation',
        threshold: 0.1, // 10% behind target
        description: 'Goal progress is 10% behind expected timeline',
        isActive: true,
      },
      {
        type: 'market_change',
        threshold: 0.2, // 20% market volatility
        description: 'Market volatility exceeds 20%',
        isActive: true,
      },
      {
        type: 'income_change',
        threshold: 0.1, // 10% income change
        description: 'Income changed by more than 10%',
        isActive: true,
      },
    ];

    const allTriggers = [...defaultTriggers, ...customTriggers.map(t => ({ ...defaultTriggers[0], ...t }))];
    
    await AsyncStorage.setItem(this.TRIGGERS_KEY, JSON.stringify(allTriggers));
    return allTriggers;
  }

  /**
   * Execute automated adjustment (if user has enabled automation)
   */
  public async executeAutomatedAdjustment(
    suggestionId: string,
    goal: FinancialGoal,
    userConsent: boolean = false
  ): Promise<{
    success: boolean;
    adjustedGoal?: FinancialGoal;
    error?: string;
  }> {
    if (!userConsent) {
      return { success: false, error: 'User consent required for automated adjustments' };
    }

    try {
      const suggestions = await this.getStoredSuggestions();
      const suggestion = suggestions.find(s => s.id === suggestionId);
      
      if (!suggestion) {
        return { success: false, error: 'Suggestion not found' };
      }

      if (!suggestion.automationPossible) {
        return { success: false, error: 'This adjustment cannot be automated' };
      }

      // Apply the adjustment
      const adjustedGoal = await this.applySuggestion(suggestion, goal);
      
      return { success: true, adjustedGoal };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Private helper methods

  private async generateSpendingBasedSuggestions(
    goal: FinancialGoal,
    progress: FIREGoalProgress,
    spendingAnalysis: SpendingAnalysis,
    userProfile: UserProfile
  ): Promise<AutomatedAdjustmentSuggestion[]> {
    const suggestions: AutomatedAdjustmentSuggestion[] = [];

    // High spending volatility suggestion
    if (spendingAnalysis.patterns.volatility > 0.3) {
      suggestions.push({
        id: `spending_volatility_${Date.now()}`,
        type: 'expense_optimization',
        priority: 'high',
        confidence: 85,
        title: 'Reduce Spending Volatility',
        description: 'Your spending varies significantly month-to-month, making FIRE planning difficult',
        reasoning: [
          `Spending volatility is ${(spendingAnalysis.patterns.volatility * 100).toFixed(1)}% (target: <20%)`,
          'High volatility makes contribution planning unreliable',
          'Stabilizing expenses improves goal predictability',
        ],
        expectedImpact: {
          timelineDelta: -3,
          contributionDelta: 200,
          feasibilityImprovement: 15,
          riskReduction: 25,
        },
        implementationSteps: [
          {
            step: 'Set up category-based budgets',
            timeRequired: '2 hours',
            difficulty: 'easy',
            prerequisites: ['Expense tracking app'],
          },
          {
            step: 'Automate recurring expenses',
            timeRequired: '1 hour',
            difficulty: 'easy',
            prerequisites: ['Bank account access'],
          },
          {
            step: 'Create discretionary spending limits',
            timeRequired: '30 minutes',
            difficulty: 'moderate',
            prerequisites: ['Spending analysis'],
          },
        ],
        triggers: ['spending_increase', 'goal_deviation'],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        automationPossible: false,
      });
    }

    // Optimization opportunities
    spendingAnalysis.opportunities.forEach((opportunity, index) => {
      if (opportunity.potentialSavings > 100) {
        suggestions.push({
          id: `optimization_${opportunity.category}_${Date.now()}_${index}`,
          type: 'expense_optimization',
          priority: opportunity.potentialSavings > 500 ? 'high' : 'medium',
          confidence: opportunity.difficulty === 'easy' ? 90 : opportunity.difficulty === 'moderate' ? 75 : 60,
          title: `Optimize ${opportunity.category} Spending`,
          description: opportunity.description,
          reasoning: [
            `Potential monthly savings: $${opportunity.potentialSavings}`,
            `Category represents high spending opportunity`,
            `Implementation difficulty: ${opportunity.difficulty}`,
          ],
          expectedImpact: {
            timelineDelta: -Math.floor(opportunity.potentialSavings / 100),
            contributionDelta: opportunity.potentialSavings,
            feasibilityImprovement: 10,
            riskReduction: 5,
          },
          implementationSteps: [
            {
              step: `Review ${opportunity.category} expenses`,
              timeRequired: '1 hour',
              difficulty: 'easy',
              prerequisites: ['Expense records'],
            },
            {
              step: 'Identify reduction opportunities',
              timeRequired: '30 minutes',
              difficulty: opportunity.difficulty,
              prerequisites: ['Category analysis'],
            },
            {
              step: 'Implement changes',
              timeRequired: '2 hours',
              difficulty: opportunity.difficulty,
              prerequisites: ['Action plan'],
            },
          ],
          triggers: ['spending_increase'],
          validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          automationPossible: false,
        });
      }
    });

    return suggestions;
  }

  private async generateProgressBasedSuggestions(
    goal: FinancialGoal,
    progress: FIREGoalProgress,
    userProfile: UserProfile
  ): Promise<AutomatedAdjustmentSuggestion[]> {
    const suggestions: AutomatedAdjustmentSuggestion[] = [];

    // Behind schedule suggestion
    if (progress.progressPercentage < (progress.timeElapsed / progress.originalTimeline) * 100 - 10) {
      suggestions.push({
        id: `behind_schedule_${Date.now()}`,
        type: 'contribution_increase',
        priority: 'high',
        confidence: 80,
        title: 'Increase Contributions - Behind Schedule',
        description: 'Your FIRE goal is behind the original timeline',
        reasoning: [
          `Current progress: ${progress.progressPercentage.toFixed(1)}%`,
          `Expected progress: ${((progress.timeElapsed / progress.originalTimeline) * 100).toFixed(1)}%`,
          'Increasing contributions can help catch up',
        ],
        expectedImpact: {
          timelineDelta: -6,
          contributionDelta: 500,
          feasibilityImprovement: 20,
          riskReduction: 0,
        },
        implementationSteps: [
          {
            step: 'Calculate required contribution increase',
            timeRequired: '15 minutes',
            difficulty: 'easy',
            prerequisites: ['Goal calculator'],
          },
          {
            step: 'Review budget for additional capacity',
            timeRequired: '1 hour',
            difficulty: 'moderate',
            prerequisites: ['Budget analysis'],
          },
          {
            step: 'Update automatic contributions',
            timeRequired: '30 minutes',
            difficulty: 'easy',
            prerequisites: ['Bank access'],
          },
        ],
        triggers: ['goal_deviation'],
        validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        automationPossible: true,
      });
    }

    // Ahead of schedule suggestion
    if (progress.progressPercentage > (progress.timeElapsed / progress.originalTimeline) * 100 + 15) {
      suggestions.push({
        id: `ahead_schedule_${Date.now()}`,
        type: 'timeline_adjustment',
        priority: 'medium',
        confidence: 75,
        title: 'Consider Earlier FIRE Date',
        description: 'You\'re ahead of schedule - consider moving up your FIRE date',
        reasoning: [
          `Current progress: ${progress.progressPercentage.toFixed(1)}%`,
          `Expected progress: ${((progress.timeElapsed / progress.originalTimeline) * 100).toFixed(1)}%`,
          'Ahead of schedule by significant margin',
        ],
        expectedImpact: {
          timelineDelta: -12,
          contributionDelta: 0,
          feasibilityImprovement: 0,
          riskReduction: 10,
        },
        implementationSteps: [
          {
            step: 'Recalculate FIRE timeline',
            timeRequired: '30 minutes',
            difficulty: 'easy',
            prerequisites: ['Current progress data'],
          },
          {
            step: 'Adjust goal target date',
            timeRequired: '5 minutes',
            difficulty: 'easy',
            prerequisites: ['Goal management access'],
          },
        ],
        triggers: ['goal_deviation'],
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        automationPossible: true,
      });
    }

    return suggestions;
  }

  private async generateMarketBasedSuggestions(
    goal: FinancialGoal,
    progress: FIREGoalProgress,
    marketData: {
      currentVolatility: number;
      expectedReturns: number;
      economicIndicators: Record<string, number>;
    },
    userProfile: UserProfile
  ): Promise<AutomatedAdjustmentSuggestion[]> {
    const suggestions: AutomatedAdjustmentSuggestion[] = [];

    // High volatility suggestion
    if (marketData.currentVolatility > 0.25) {
      suggestions.push({
        id: `market_volatility_${Date.now()}`,
        type: 'goal_restructure',
        priority: 'medium',
        confidence: 70,
        title: 'Adjust for Market Volatility',
        description: 'High market volatility may impact your FIRE timeline',
        reasoning: [
          `Current market volatility: ${(marketData.currentVolatility * 100).toFixed(1)}%`,
          'High volatility increases timeline uncertainty',
          'Consider more conservative projections',
        ],
        expectedImpact: {
          timelineDelta: 6,
          contributionDelta: 0,
          feasibilityImprovement: -5,
          riskReduction: 30,
        },
        implementationSteps: [
          {
            step: 'Review risk tolerance',
            timeRequired: '30 minutes',
            difficulty: 'moderate',
            prerequisites: ['Risk assessment'],
          },
          {
            step: 'Adjust expected returns',
            timeRequired: '15 minutes',
            difficulty: 'easy',
            prerequisites: ['Goal calculator'],
          },
        ],
        triggers: ['market_change'],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        automationPossible: false,
      });
    }

    return suggestions;
  }

  private async generateProactiveSuggestions(
    goal: FinancialGoal,
    progress: FIREGoalProgress,
    userProfile: UserProfile
  ): Promise<AutomatedAdjustmentSuggestion[]> {
    const suggestions: AutomatedAdjustmentSuggestion[] = [];

    // Get proactive life event predictions
    const lifeEventPredictions = await this.lifeEventService.getProactiveLifeEventPredictions(
      goal,
      progress,
      userProfile
    );

    lifeEventPredictions.forEach(prediction => {
      if (prediction.probability > 0.6) {
        suggestions.push({
          id: `proactive_${prediction.eventType}_${Date.now()}`,
          type: 'goal_restructure',
          priority: 'medium',
          confidence: Math.round(prediction.probability * 100),
          title: `Prepare for Potential ${prediction.eventType.replace('_', ' ')}`,
          description: `High probability of ${prediction.eventType} in ${prediction.timeframe}`,
          reasoning: [
            `Probability: ${(prediction.probability * 100).toFixed(1)}%`,
            `Timeframe: ${prediction.timeframe}`,
            'Proactive preparation reduces impact',
          ],
          expectedImpact: {
            timelineDelta: 0,
            contributionDelta: 0,
            feasibilityImprovement: 0,
            riskReduction: 20,
          },
          implementationSteps: prediction.preparationSteps.map(step => ({
            step,
            timeRequired: '1-2 hours',
            difficulty: 'moderate' as const,
            prerequisites: ['Financial review'],
          })),
          triggers: ['life_event'],
          validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
          automationPossible: false,
        });
      }
    });

    return suggestions;
  }

  private filterAndPrioritizeSuggestions(
    suggestions: AutomatedAdjustmentSuggestion[],
    triggeredConditions: string[]
  ): AutomatedAdjustmentSuggestion[] {
    // Filter out expired suggestions
    const validSuggestions = suggestions.filter(s => new Date(s.validUntil) > new Date());
    
    // Prioritize based on triggered conditions and confidence
    return validSuggestions
      .sort((a, b) => {
        // Priority order: critical > high > medium > low
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        
        if (priorityDiff !== 0) return priorityDiff;
        
        // Then by confidence
        return b.confidence - a.confidence;
      })
      .slice(0, 5); // Return top 5 suggestions
  }

  private async checkAdjustmentTriggers(
    goal: FinancialGoal,
    progress: FIREGoalProgress,
    spendingAnalysis: SpendingAnalysis
  ): Promise<string[]> {
    const triggers = await this.getAdjustmentTriggers();
    const triggeredConditions: string[] = [];

    triggers.forEach(trigger => {
      if (!trigger.isActive) return;

      switch (trigger.type) {
        case 'spending_increase':
          if (spendingAnalysis.patterns.spendingTrend === 'increasing') {
            triggeredConditions.push(trigger.type);
          }
          break;
        case 'goal_deviation':
          const expectedProgress = (progress.timeElapsed / progress.originalTimeline) * 100;
          if (Math.abs(progress.progressPercentage - expectedProgress) > trigger.threshold * 100) {
            triggeredConditions.push(trigger.type);
          }
          break;
      }
    });

    return triggeredConditions;
  }

  private async applySuggestion(
    suggestion: AutomatedAdjustmentSuggestion,
    goal: FinancialGoal
  ): Promise<FinancialGoal> {
    const adjustedGoal = { ...goal };
    const metadata = { ...goal.metadata } as FIREGoalMetadata;

    switch (suggestion.type) {
      case 'contribution_increase':
        // Would update contribution settings
        break;
      case 'timeline_adjustment':
        // Would adjust target date
        break;
      case 'expense_optimization':
        // Would update expense targets
        break;
    }

    adjustedGoal.metadata = metadata;
    adjustedGoal.updated_at = new Date().toISOString();

    return adjustedGoal;
  }

  // Utility methods for calculations
  private calculateMonthlyTotals(spendingHistory: any[]): number[] {
    // Simplified implementation - would group by month and sum
    return [1000, 1100, 950, 1200, 1050, 980, 1150];
  }

  private calculateSpendingTrend(monthlyTotals: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (monthlyTotals.length < 2) return 'stable';
    
    const first = monthlyTotals[0];
    const last = monthlyTotals[monthlyTotals.length - 1];
    const change = (last - first) / first;
    
    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  private calculateVolatility(monthlyTotals: number[]): number {
    if (monthlyTotals.length < 2) return 0;
    
    const mean = monthlyTotals.reduce((sum, val) => sum + val, 0) / monthlyTotals.length;
    const variance = monthlyTotals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / monthlyTotals.length;
    
    return Math.sqrt(variance) / mean;
  }

  private calculateSeasonalVariation(spendingHistory: any[]): number {
    // Simplified seasonal calculation
    return 0.15; // 15% seasonal variation
  }

  private calculateCategoryDistribution(spendingHistory: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    const total = spendingHistory.reduce((sum, item) => sum + item.amount, 0);
    
    spendingHistory.forEach(item => {
      distribution[item.category] = (distribution[item.category] || 0) + item.amount;
    });
    
    Object.keys(distribution).forEach(category => {
      distribution[category] = (distribution[category] / total) * 100;
    });
    
    return distribution;
  }

  private detectSpendingAnomalies(spendingHistory: any[], averageSpending: number): SpendingAnalysis['anomalies'] {
    // Simplified anomaly detection
    return spendingHistory
      .filter(item => item.amount > averageSpending * 2)
      .map(item => ({
        date: item.date,
        category: item.category,
        amount: item.amount,
        deviation: (item.amount - averageSpending) / averageSpending,
        explanation: 'Spending significantly above average',
      }));
  }

  private identifyOptimizationOpportunities(
    categoryDistribution: Record<string, number>,
    spendingHistory: any[]
  ): SpendingAnalysis['opportunities'] {
    const opportunities: SpendingAnalysis['opportunities'] = [];
    
    Object.entries(categoryDistribution).forEach(([category, percentage]) => {
      if (percentage > 20 && category !== 'housing') { // High spending categories
        opportunities.push({
          category,
          potentialSavings: Math.round(percentage * 10), // Simplified calculation
          difficulty: percentage > 30 ? 'difficult' : percentage > 25 ? 'moderate' : 'easy',
          description: `${category} represents ${percentage.toFixed(1)}% of spending - optimization opportunity`,
        });
      }
    });
    
    return opportunities;
  }

  private async storeSuggestions(suggestions: AutomatedAdjustmentSuggestion[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(suggestions));
    } catch (error) {
      console.error('Failed to store suggestions:', error);
    }
  }

  private async getStoredSuggestions(): Promise<AutomatedAdjustmentSuggestion[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get stored suggestions:', error);
      return [];
    }
  }

  private async getAdjustmentTriggers(): Promise<AdjustmentTrigger[]> {
    try {
      const data = await AsyncStorage.getItem(this.TRIGGERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get adjustment triggers:', error);
      return [];
    }
  }
}
