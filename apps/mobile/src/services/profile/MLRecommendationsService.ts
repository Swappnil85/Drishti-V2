/**
 * ML Recommendations Service
 * Advanced machine learning powered recommendations with peer comparisons
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PersonalizedRecommendation,
  PeerComparison,
  MarketConditionData,
  ImplementationTracking,
  UserProfile,
} from '../../types/profile';

interface MLModel {
  version: string;
  accuracy: number;
  lastTrained: number;
  features: string[];
}

interface PeerData {
  ageGroup: string;
  incomeRange: string;
  savingsRate: number;
  fireProgress: number;
  riskTolerance: string;
  anonymous: boolean;
}

class MLRecommendationsService {
  private storageKey = 'ML_RECOMMENDATIONS';
  private peerDataKey = 'PEER_DATA';
  private marketDataKey = 'MARKET_DATA';
  
  private mlModel: MLModel = {
    version: '1.0.0',
    accuracy: 0.85,
    lastTrained: Date.now() - (7 * 24 * 60 * 60 * 1000), // 7 days ago
    features: ['age', 'income', 'savings_rate', 'risk_tolerance', 'expenses', 'fire_progress'],
  };

  /**
   * Generate advanced ML-powered recommendations
   */
  async generateAdvancedRecommendations(profile: UserProfile): Promise<PersonalizedRecommendation[]> {
    try {
      const recommendations: PersonalizedRecommendation[] = [];
      const financial = profile.financialInfo;
      const now = Date.now();

      // Get peer comparison data
      const peerComparison = await this.generatePeerComparison(profile);
      
      // Get market conditions
      const marketConditions = await this.getMarketConditions();

      // ML-powered savings rate optimization
      if (financial.savingsRate < 0.5) {
        const mlScore = this.calculateMLScore(profile, 'savings_rate');
        recommendations.push({
          id: `ml_savings_${now}`,
          type: 'savings_rate',
          title: 'AI-Optimized Savings Strategy',
          description: `Our ML model suggests increasing your savings rate to ${Math.round((financial.savingsRate + 0.1) * 100)}% based on your profile.`,
          rationale: 'Machine learning analysis of similar profiles shows this adjustment optimizes your FIRE timeline.',
          actionSteps: [
            'Analyze spending patterns using AI insights',
            'Implement automated savings increases',
            'Track progress with ML-powered monitoring',
          ],
          impact: {
            timeToFire: financial.yearsToFire * 0.75,
            additionalSavings: financial.totalAnnualIncome * 0.1,
            confidenceIncrease: 0.15,
          },
          priority: 'high',
          confidence: 0.88,
          mlScore,
          peerComparison,
          marketConditions,
          createdAt: now,
          expiresAt: now + (30 * 24 * 60 * 60 * 1000),
          implementationTracking: this.createImplementationTracking('savings_optimization'),
        });
      }

      // Risk tolerance optimization based on age and timeline
      if (financial.age < 40 && financial.riskTolerance === 'conservative') {
        const mlScore = this.calculateMLScore(profile, 'risk_adjustment');
        recommendations.push({
          id: `ml_risk_${now}`,
          type: 'risk_adjustment',
          title: 'Age-Optimized Risk Strategy',
          description: 'ML analysis suggests your risk tolerance could be more aggressive given your age and timeline.',
          rationale: 'Younger investors typically benefit from higher risk tolerance for better long-term returns.',
          actionSteps: [
            'Review current investment allocation',
            'Consider increasing equity percentage',
            'Implement gradual risk adjustment strategy',
          ],
          impact: {
            timeToFire: financial.yearsToFire * 0.85,
            confidenceIncrease: 0.2,
          },
          priority: 'medium',
          confidence: 0.82,
          mlScore,
          peerComparison: await this.generatePeerComparison(profile, 'risk_tolerance'),
          marketConditions,
          createdAt: now,
          implementationTracking: this.createImplementationTracking('risk_optimization'),
        });
      }

      // Milestone-based recommendations
      const fireProgress = financial.currentSavings / financial.fireNumber;
      if (fireProgress >= 0.25 && fireProgress < 0.5) {
        recommendations.push({
          id: `ml_milestone_${now}`,
          type: 'milestone',
          title: 'Quarter-FIRE Milestone Optimization',
          description: 'You\'ve reached 25% of your FIRE goal! ML suggests strategies to accelerate to 50%.',
          rationale: 'Statistical analysis shows this is a critical phase for maintaining momentum.',
          actionSteps: [
            'Celebrate your 25% milestone achievement',
            'Implement advanced tax optimization strategies',
            'Consider side income opportunities',
            'Review and optimize investment allocation',
          ],
          impact: {
            timeToFire: financial.yearsToFire * 0.9,
            additionalSavings: financial.totalAnnualIncome * 0.05,
          },
          priority: 'high',
          confidence: 0.91,
          mlScore: this.calculateMLScore(profile, 'milestone'),
          peerComparison: await this.generatePeerComparison(profile, 'fire_progress'),
          createdAt: now,
          implementationTracking: this.createImplementationTracking('milestone_optimization'),
        });
      }

      // Market condition based recommendations
      if (marketConditions.marketTrend === 'bear' && financial.riskTolerance !== 'conservative') {
        recommendations.push({
          id: `ml_market_${now}`,
          type: 'investment_allocation',
          title: 'Bear Market Opportunity Strategy',
          description: 'Current market conditions present buying opportunities for long-term FIRE investors.',
          rationale: 'Historical data shows bear markets often provide the best long-term investment opportunities.',
          actionSteps: [
            'Consider dollar-cost averaging strategy',
            'Review emergency fund adequacy',
            'Maintain long-term perspective',
            'Consider rebalancing opportunities',
          ],
          impact: {
            timeToFire: financial.yearsToFire * 0.95,
            confidenceIncrease: 0.1,
          },
          priority: 'medium',
          confidence: 0.79,
          mlScore: this.calculateMLScore(profile, 'market_timing'),
          marketConditions,
          createdAt: now,
          implementationTracking: this.createImplementationTracking('market_strategy'),
        });
      }

      await this.saveRecommendations(recommendations);
      return recommendations;
    } catch (error) {
      console.error('Failed to generate advanced recommendations:', error);
      return [];
    }
  }

  /**
   * Generate peer comparison data
   */
  private async generatePeerComparison(
    profile: UserProfile, 
    category: string = 'savings_rate'
  ): Promise<PeerComparison> {
    try {
      const peerData = await this.getPeerData(profile);
      const financial = profile.financialInfo;

      switch (category) {
        case 'savings_rate':
          return {
            userPercentile: this.calculatePercentile(financial.savingsRate, peerData.map(p => p.savingsRate)),
            averageValue: this.calculateAverage(peerData.map(p => p.savingsRate)),
            topPercentileValue: this.calculatePercentile(0.9, peerData.map(p => p.savingsRate)),
            category: 'Savings Rate',
            sampleSize: peerData.length,
            anonymous: true,
          };
        
        case 'fire_progress':
          return {
            userPercentile: this.calculatePercentile(financial.currentSavings / financial.fireNumber, peerData.map(p => p.fireProgress)),
            averageValue: this.calculateAverage(peerData.map(p => p.fireProgress)),
            topPercentileValue: this.calculatePercentile(0.9, peerData.map(p => p.fireProgress)),
            category: 'FIRE Progress',
            sampleSize: peerData.length,
            anonymous: true,
          };
        
        case 'risk_tolerance':
          const riskScores = peerData.map(p => this.riskToleranceToScore(p.riskTolerance));
          return {
            userPercentile: this.calculatePercentile(this.riskToleranceToScore(financial.riskTolerance), riskScores),
            averageValue: this.calculateAverage(riskScores),
            topPercentileValue: this.calculatePercentile(0.9, riskScores),
            category: 'Risk Tolerance',
            sampleSize: peerData.length,
            anonymous: true,
          };
        
        default:
          return this.createDefaultPeerComparison();
      }
    } catch (error) {
      console.error('Failed to generate peer comparison:', error);
      return this.createDefaultPeerComparison();
    }
  }

  /**
   * Get market conditions data
   */
  private async getMarketConditions(): Promise<MarketConditionData> {
    try {
      const stored = await AsyncStorage.getItem(this.marketDataKey);
      if (stored) {
        const data = JSON.parse(stored);
        if (Date.now() - data.lastUpdated < 24 * 60 * 60 * 1000) { // 24 hours
          return data;
        }
      }

      // Simulate market data (in real app, this would come from an API)
      const marketData: MarketConditionData = {
        marketTrend: Math.random() > 0.6 ? 'bull' : Math.random() > 0.3 ? 'neutral' : 'bear',
        volatilityIndex: Math.random() * 40 + 10, // 10-50
        recommendedAdjustment: 'Maintain long-term perspective and continue regular investments',
        confidenceLevel: Math.random() * 0.3 + 0.7, // 0.7-1.0
        lastUpdated: Date.now(),
      };

      await AsyncStorage.setItem(this.marketDataKey, JSON.stringify(marketData));
      return marketData;
    } catch (error) {
      console.error('Failed to get market conditions:', error);
      return {
        marketTrend: 'neutral',
        volatilityIndex: 20,
        recommendedAdjustment: 'Continue with current strategy',
        confidenceLevel: 0.8,
        lastUpdated: Date.now(),
      };
    }
  }

  /**
   * Calculate ML confidence score
   */
  private calculateMLScore(profile: UserProfile, recommendationType: string): number {
    const features = this.extractFeatures(profile);
    const baseScore = this.mlModel.accuracy;
    
    // Adjust score based on data completeness
    const completeness = this.calculateDataCompleteness(profile);
    const adjustedScore = baseScore * completeness;
    
    // Add some randomness to simulate ML model variance
    const variance = (Math.random() - 0.5) * 0.1;
    
    return Math.max(0.5, Math.min(1.0, adjustedScore + variance));
  }

  /**
   * Extract features for ML model
   */
  private extractFeatures(profile: UserProfile): number[] {
    const financial = profile.financialInfo;
    return [
      financial.age / 100,
      financial.totalAnnualIncome / 200000,
      financial.savingsRate,
      this.riskToleranceToScore(financial.riskTolerance) / 3,
      financial.monthlyExpenses / 10000,
      (financial.currentSavings / financial.fireNumber),
    ];
  }

  /**
   * Calculate data completeness score
   */
  private calculateDataCompleteness(profile: UserProfile): number {
    let score = 0;
    let total = 0;

    // Check personal info completeness
    if (profile.personalInfo.firstName) score++;
    if (profile.personalInfo.lastName) score++;
    if (profile.personalInfo.email) score++;
    total += 3;

    // Check financial info completeness
    if (profile.financialInfo.totalAnnualIncome > 0) score++;
    if (profile.financialInfo.monthlyExpenses > 0) score++;
    if (profile.financialInfo.currentSavings >= 0) score++;
    if (profile.financialInfo.desiredRetirementAge > 0) score++;
    total += 4;

    return score / total;
  }

  /**
   * Create implementation tracking
   */
  private createImplementationTracking(type: string): ImplementationTracking {
    const milestones = this.getMilestonesForType(type);
    
    return {
      started: false,
      progress: 0,
      milestones,
    };
  }

  /**
   * Get milestones for implementation type
   */
  private getMilestonesForType(type: string) {
    const baseMilestones = {
      savings_optimization: [
        { id: '1', title: 'Analyze Current Spending', description: 'Review last 3 months of expenses', completed: false },
        { id: '2', title: 'Set Savings Target', description: 'Define new savings rate goal', completed: false },
        { id: '3', title: 'Automate Savings', description: 'Set up automatic transfers', completed: false },
        { id: '4', title: 'Monitor Progress', description: 'Track for 30 days', completed: false },
      ],
      risk_optimization: [
        { id: '1', title: 'Review Current Portfolio', description: 'Assess current allocation', completed: false },
        { id: '2', title: 'Research Options', description: 'Explore higher-risk investments', completed: false },
        { id: '3', title: 'Gradual Adjustment', description: 'Implement changes gradually', completed: false },
        { id: '4', title: 'Monitor Performance', description: 'Track for 90 days', completed: false },
      ],
      milestone_optimization: [
        { id: '1', title: 'Celebrate Achievement', description: 'Acknowledge 25% milestone', completed: false },
        { id: '2', title: 'Tax Optimization', description: 'Review tax-advantaged accounts', completed: false },
        { id: '3', title: 'Side Income Research', description: 'Explore additional income sources', completed: false },
        { id: '4', title: 'Strategy Refinement', description: 'Adjust plan for next 25%', completed: false },
      ],
      market_strategy: [
        { id: '1', title: 'Emergency Fund Check', description: 'Ensure adequate emergency fund', completed: false },
        { id: '2', title: 'DCA Strategy', description: 'Implement dollar-cost averaging', completed: false },
        { id: '3', title: 'Rebalancing Review', description: 'Consider portfolio rebalancing', completed: false },
        { id: '4', title: 'Long-term Focus', description: 'Maintain investment discipline', completed: false },
      ],
    };

    return baseMilestones[type] || baseMilestones.savings_optimization;
  }

  /**
   * Utility methods
   */
  private async getPeerData(profile: UserProfile): Promise<PeerData[]> {
    // Simulate peer data (in real app, this would come from anonymized user data)
    const ageGroup = this.getAgeGroup(profile.financialInfo.age);
    const incomeRange = this.getIncomeRange(profile.financialInfo.totalAnnualIncome);
    
    return Array.from({ length: 100 }, (_, i) => ({
      ageGroup,
      incomeRange,
      savingsRate: Math.random() * 0.6 + 0.1, // 10-70%
      fireProgress: Math.random() * 0.8, // 0-80%
      riskTolerance: ['conservative', 'moderate', 'aggressive'][Math.floor(Math.random() * 3)],
      anonymous: true,
    }));
  }

  private getAgeGroup(age: number): string {
    if (age < 30) return '20-29';
    if (age < 40) return '30-39';
    if (age < 50) return '40-49';
    if (age < 60) return '50-59';
    return '60+';
  }

  private getIncomeRange(income: number): string {
    if (income < 50000) return '$0-$50k';
    if (income < 100000) return '$50k-$100k';
    if (income < 150000) return '$100k-$150k';
    if (income < 200000) return '$150k-$200k';
    return '$200k+';
  }

  private calculatePercentile(value: number, data: number[]): number {
    const sorted = data.sort((a, b) => a - b);
    const below = sorted.filter(v => v < value).length;
    return (below / sorted.length) * 100;
  }

  private calculateAverage(data: number[]): number {
    return data.reduce((sum, val) => sum + val, 0) / data.length;
  }

  private riskToleranceToScore(risk: string): number {
    switch (risk) {
      case 'conservative': return 1;
      case 'moderate': return 2;
      case 'aggressive': return 3;
      default: return 2;
    }
  }

  private createDefaultPeerComparison(): PeerComparison {
    return {
      userPercentile: 50,
      averageValue: 0.3,
      topPercentileValue: 0.6,
      category: 'General',
      sampleSize: 100,
      anonymous: true,
    };
  }

  private async saveRecommendations(recommendations: PersonalizedRecommendation[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(recommendations));
    } catch (error) {
      console.error('Failed to save ML recommendations:', error);
    }
  }
}

export default new MLRecommendationsService();
