/**
 * What-If Analysis Service
 * Epic 9, Story 1: Tools for testing specific assumptions with impact analysis
 * Provides sensitivity analysis and scenario comparison capabilities
 */

import { ScenarioAssumptions } from '@drishti/shared/types/financial';
import { realTimeCalculationService, RealTimeProjections } from '../calculations/RealTimeCalculationService';

export interface WhatIfScenario {
  id: string;
  name: string;
  description: string;
  baseAssumptions: ScenarioAssumptions;
  modifiedAssumptions: ScenarioAssumptions;
  changedParameters: string[];
  impact: WhatIfImpact;
}

export interface WhatIfImpact {
  yearsToFireChange: number;
  fireNumberChange: number;
  successProbabilityChange: number;
  monthlyRequiredSavingsChange: number;
  impactLevel: 'minimal' | 'moderate' | 'significant' | 'dramatic';
  impactDirection: 'positive' | 'negative' | 'mixed';
  keyInsights: string[];
  recommendations: string[];
}

export interface SensitivityAnalysis {
  parameter: keyof ScenarioAssumptions;
  baseValue: number;
  testRanges: SensitivityTestRange[];
  mostSensitive: boolean;
  elasticity: number; // % change in outcome per % change in parameter
}

export interface SensitivityTestRange {
  value: number;
  percentChange: number;
  yearsToFire: number;
  fireNumber: number;
  successProbability: number;
  impactLevel: 'minimal' | 'moderate' | 'significant' | 'dramatic';
}

/**
 * What-If Analysis Service
 */
export class WhatIfAnalysisService {
  private static instance: WhatIfAnalysisService;

  private constructor() {}

  public static getInstance(): WhatIfAnalysisService {
    if (!WhatIfAnalysisService.instance) {
      WhatIfAnalysisService.instance = new WhatIfAnalysisService();
    }
    return WhatIfAnalysisService.instance;
  }

  /**
   * Create what-if scenario by modifying specific parameters
   */
  public createWhatIfScenario(
    baseAssumptions: ScenarioAssumptions,
    modifications: Partial<ScenarioAssumptions>,
    name: string,
    description: string
  ): WhatIfScenario {
    const modifiedAssumptions = { ...baseAssumptions, ...modifications };
    const changedParameters = Object.keys(modifications);

    // Calculate base projections
    const baseProjections = this.calculateProjections(baseAssumptions);
    const modifiedProjections = this.calculateProjections(modifiedAssumptions);

    // Calculate impact
    const impact = this.calculateImpact(baseProjections, modifiedProjections, changedParameters);

    return {
      id: `whatif_${Date.now()}`,
      name,
      description,
      baseAssumptions,
      modifiedAssumptions,
      changedParameters,
      impact,
    };
  }

  /**
   * Perform sensitivity analysis on all parameters
   */
  public performSensitivityAnalysis(baseAssumptions: ScenarioAssumptions): SensitivityAnalysis[] {
    const parameters: (keyof ScenarioAssumptions)[] = [
      'inflation_rate',
      'market_return',
      'savings_rate',
      'retirement_age',
      'life_expectancy',
      'emergency_fund_months',
      'healthcare_inflation',
      'tax_rate',
    ];

    const baseProjections = this.calculateProjections(baseAssumptions);
    const analyses: SensitivityAnalysis[] = [];

    for (const parameter of parameters) {
      const analysis = this.analyzeSensitivity(parameter, baseAssumptions, baseProjections);
      analyses.push(analysis);
    }

    // Sort by elasticity to identify most sensitive parameters
    analyses.sort((a, b) => Math.abs(b.elasticity) - Math.abs(a.elasticity));
    
    // Mark most sensitive parameters
    if (analyses.length > 0) {
      analyses[0].mostSensitive = true;
      if (analyses.length > 1 && Math.abs(analyses[1].elasticity) > Math.abs(analyses[0].elasticity) * 0.8) {
        analyses[1].mostSensitive = true;
      }
    }

    return analyses;
  }

  /**
   * Generate common what-if scenarios
   */
  public generateCommonWhatIfScenarios(baseAssumptions: ScenarioAssumptions): WhatIfScenario[] {
    const scenarios: WhatIfScenario[] = [];

    // Market crash scenario
    scenarios.push(this.createWhatIfScenario(
      baseAssumptions,
      { market_return: Math.max(0.02, baseAssumptions.market_return - 0.04) },
      'Market Crash',
      'What if market returns drop by 4 percentage points?'
    ));

    // High inflation scenario
    scenarios.push(this.createWhatIfScenario(
      baseAssumptions,
      { inflation_rate: baseAssumptions.inflation_rate + 0.03 },
      'High Inflation',
      'What if inflation increases by 3 percentage points?'
    ));

    // Increased savings scenario
    scenarios.push(this.createWhatIfScenario(
      baseAssumptions,
      { savings_rate: Math.min(0.7, baseAssumptions.savings_rate + 0.1) },
      'Higher Savings',
      'What if you could save 10% more of your income?'
    ));

    // Delayed retirement scenario
    scenarios.push(this.createWhatIfScenario(
      baseAssumptions,
      { retirement_age: baseAssumptions.retirement_age + 5 },
      'Work 5 More Years',
      'What if you worked 5 additional years?'
    ));

    // Lower expenses scenario (higher savings rate equivalent)
    const lowerExpensesSavingsRate = Math.min(0.7, baseAssumptions.savings_rate * 1.2);
    scenarios.push(this.createWhatIfScenario(
      baseAssumptions,
      { savings_rate: lowerExpensesSavingsRate },
      'Reduce Expenses',
      'What if you could reduce expenses by 20%?'
    ));

    return scenarios;
  }

  /**
   * Calculate projections using real-time calculation service
   */
  private calculateProjections(assumptions: ScenarioAssumptions): RealTimeProjections {
    return realTimeCalculationService.calculateProjections({
      currentAge: 30,
      currentNetWorth: 50000,
      monthlyIncome: 8000,
      monthlyExpenses: 4000,
      assumptions,
    });
  }

  /**
   * Calculate impact between base and modified scenarios
   */
  private calculateImpact(
    baseProjections: RealTimeProjections,
    modifiedProjections: RealTimeProjections,
    changedParameters: string[]
  ): WhatIfImpact {
    const yearsToFireChange = modifiedProjections.yearsToFire - baseProjections.yearsToFire;
    const fireNumberChange = modifiedProjections.fireNumber - baseProjections.fireNumber;
    const successProbabilityChange = modifiedProjections.successProbability - baseProjections.successProbability;
    const monthlyRequiredSavingsChange = modifiedProjections.monthlyRequiredSavings - baseProjections.monthlyRequiredSavings;

    // Determine impact level
    const impactLevel = this.determineImpactLevel(yearsToFireChange, successProbabilityChange);
    
    // Determine impact direction
    const impactDirection = this.determineImpactDirection(yearsToFireChange, successProbabilityChange);

    // Generate insights and recommendations
    const keyInsights = this.generateImpactInsights(
      yearsToFireChange,
      fireNumberChange,
      successProbabilityChange,
      changedParameters
    );

    const recommendations = this.generateImpactRecommendations(
      yearsToFireChange,
      successProbabilityChange,
      impactLevel,
      changedParameters
    );

    return {
      yearsToFireChange,
      fireNumberChange,
      successProbabilityChange,
      monthlyRequiredSavingsChange,
      impactLevel,
      impactDirection,
      keyInsights,
      recommendations,
    };
  }

  /**
   * Analyze sensitivity for a specific parameter
   */
  private analyzeSensitivity(
    parameter: keyof ScenarioAssumptions,
    baseAssumptions: ScenarioAssumptions,
    baseProjections: RealTimeProjections
  ): SensitivityAnalysis {
    const baseValue = baseAssumptions[parameter] as number;
    const testRanges: SensitivityTestRange[] = [];

    // Define test ranges based on parameter type
    const testPercentages = [-20, -10, -5, 5, 10, 20];
    
    for (const percentChange of testPercentages) {
      const testValue = this.calculateTestValue(parameter, baseValue, percentChange);
      const testAssumptions = { ...baseAssumptions, [parameter]: testValue };
      const testProjections = this.calculateProjections(testAssumptions);
      
      const yearsToFireChange = testProjections.yearsToFire - baseProjections.yearsToFire;
      const successProbabilityChange = testProjections.successProbability - baseProjections.successProbability;
      
      testRanges.push({
        value: testValue,
        percentChange,
        yearsToFire: testProjections.yearsToFire,
        fireNumber: testProjections.fireNumber,
        successProbability: testProjections.successProbability,
        impactLevel: this.determineImpactLevel(yearsToFireChange, successProbabilityChange),
      });
    }

    // Calculate elasticity (average % change in years to FIRE per % change in parameter)
    const elasticityValues = testRanges
      .filter(range => range.percentChange !== 0)
      .map(range => {
        const yearsToFirePercentChange = ((range.yearsToFire - baseProjections.yearsToFire) / baseProjections.yearsToFire) * 100;
        return yearsToFirePercentChange / range.percentChange;
      });
    
    const elasticity = elasticityValues.reduce((sum, val) => sum + val, 0) / elasticityValues.length;

    return {
      parameter,
      baseValue,
      testRanges,
      mostSensitive: false, // Will be set later
      elasticity,
    };
  }

  /**
   * Calculate test value for sensitivity analysis
   */
  private calculateTestValue(parameter: keyof ScenarioAssumptions, baseValue: number, percentChange: number): number {
    let testValue = baseValue * (1 + percentChange / 100);
    
    // Apply parameter-specific constraints
    switch (parameter) {
      case 'inflation_rate':
      case 'market_return':
      case 'healthcare_inflation':
        testValue = Math.max(-0.05, Math.min(0.20, testValue)); // -5% to 20%
        break;
      case 'savings_rate':
        testValue = Math.max(0.05, Math.min(0.80, testValue)); // 5% to 80%
        break;
      case 'tax_rate':
        testValue = Math.max(0.10, Math.min(0.50, testValue)); // 10% to 50%
        break;
      case 'retirement_age':
        testValue = Math.max(50, Math.min(80, Math.round(testValue))); // 50 to 80 years
        break;
      case 'life_expectancy':
        testValue = Math.max(70, Math.min(100, Math.round(testValue))); // 70 to 100 years
        break;
      case 'emergency_fund_months':
        testValue = Math.max(3, Math.min(24, Math.round(testValue))); // 3 to 24 months
        break;
    }
    
    return testValue;
  }

  /**
   * Determine impact level based on changes
   */
  private determineImpactLevel(yearsToFireChange: number, successProbabilityChange: number): 'minimal' | 'moderate' | 'significant' | 'dramatic' {
    const absYearsChange = Math.abs(yearsToFireChange);
    const absProbabilityChange = Math.abs(successProbabilityChange);
    
    if (absYearsChange > 10 || absProbabilityChange > 0.3) return 'dramatic';
    if (absYearsChange > 5 || absProbabilityChange > 0.15) return 'significant';
    if (absYearsChange > 2 || absProbabilityChange > 0.05) return 'moderate';
    return 'minimal';
  }

  /**
   * Determine impact direction
   */
  private determineImpactDirection(yearsToFireChange: number, successProbabilityChange: number): 'positive' | 'negative' | 'mixed' {
    const yearsImprovement = yearsToFireChange < 0; // Fewer years is better
    const probabilityImprovement = successProbabilityChange > 0; // Higher probability is better
    
    if (yearsImprovement && probabilityImprovement) return 'positive';
    if (!yearsImprovement && !probabilityImprovement) return 'negative';
    return 'mixed';
  }

  /**
   * Generate impact insights
   */
  private generateImpactInsights(
    yearsToFireChange: number,
    fireNumberChange: number,
    successProbabilityChange: number,
    changedParameters: string[]
  ): string[] {
    const insights: string[] = [];
    
    if (Math.abs(yearsToFireChange) > 0.5) {
      const direction = yearsToFireChange > 0 ? 'increases' : 'decreases';
      insights.push(`Timeline ${direction} by ${Math.abs(yearsToFireChange).toFixed(1)} years`);
    }
    
    if (Math.abs(successProbabilityChange) > 0.05) {
      const direction = successProbabilityChange > 0 ? 'improves' : 'decreases';
      insights.push(`Success probability ${direction} by ${Math.abs(successProbabilityChange * 100).toFixed(1)}%`);
    }
    
    if (Math.abs(fireNumberChange) > 10000) {
      const direction = fireNumberChange > 0 ? 'increases' : 'decreases';
      insights.push(`FIRE number ${direction} by $${Math.abs(fireNumberChange / 1000).toFixed(0)}K`);
    }
    
    return insights;
  }

  /**
   * Generate impact recommendations
   */
  private generateImpactRecommendations(
    yearsToFireChange: number,
    successProbabilityChange: number,
    impactLevel: string,
    changedParameters: string[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (impactLevel === 'dramatic' || impactLevel === 'significant') {
      if (yearsToFireChange < -2) {
        recommendations.push('This change significantly accelerates your FIRE timeline');
      } else if (yearsToFireChange > 2) {
        recommendations.push('This change significantly delays your FIRE timeline');
      }
    }
    
    if (successProbabilityChange < -0.1) {
      recommendations.push('Consider additional risk mitigation strategies');
    } else if (successProbabilityChange > 0.1) {
      recommendations.push('This change improves your plan\'s robustness');
    }
    
    if (changedParameters.includes('savings_rate') && yearsToFireChange < 0) {
      recommendations.push('Higher savings rate is one of the most effective FIRE accelerators');
    }
    
    if (changedParameters.includes('market_return') && Math.abs(yearsToFireChange) > 3) {
      recommendations.push('Market return assumptions significantly impact timeline - consider conservative estimates');
    }
    
    return recommendations;
  }
}

export const whatIfAnalysisService = WhatIfAnalysisService.getInstance();
