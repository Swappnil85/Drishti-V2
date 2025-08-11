/**
 * Scenario Comparison Service
 * Epic 9, Story 2: Side-by-side scenario comparison with analysis
 * Provides comprehensive comparison capabilities for financial scenarios
 */

import { EnhancedScenario } from '@drishti/shared/types/financial';
import { realTimeCalculationService, RealTimeProjections } from '../calculations/RealTimeCalculationService';

export interface ScenarioComparison {
  id: string;
  name: string;
  scenarios: EnhancedScenario[];
  projections: RealTimeProjections[];
  analysis: ComparisonAnalysis;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComparisonAnalysis {
  keyDifferences: KeyDifference[];
  bestScenario: ScenarioBest;
  riskAnalysis: RiskAnalysis;
  recommendations: string[];
  probabilityAnalysis: ProbabilityAnalysis;
  breakEvenAnalysis: BreakEvenAnalysis;
}

export interface KeyDifference {
  metric: 'yearsToFire' | 'fireNumber' | 'successProbability' | 'monthlyRequiredSavings';
  scenarioIndex: number;
  value: number;
  difference: number;
  percentageDifference: number;
  significance: 'minimal' | 'moderate' | 'significant' | 'dramatic';
}

export interface ScenarioBest {
  fastest: { index: number; yearsToFire: number };
  safest: { index: number; successProbability: number };
  mostEfficient: { index: number; savingsRate: number };
  overall: { index: number; score: number };
}

export interface RiskAnalysis {
  riskLevels: ('low' | 'medium' | 'high' | 'extreme')[];
  riskFactors: string[];
  mitigation: string[];
  diversificationScore: number;
}

export interface ProbabilityAnalysis {
  scenarios: {
    index: number;
    probability: number;
    confidenceInterval: [number, number];
    factors: string[];
  }[];
  averageProbability: number;
  probabilitySpread: number;
}

export interface BreakEvenAnalysis {
  timeToBreakEven: number;
  breakEvenPoint: number;
  significantDivergence: {
    timePoint: number;
    maxDifference: number;
    divergingScenarios: number[];
  };
}

export interface ComparisonExport {
  format: 'pdf' | 'excel' | 'csv';
  data: {
    summary: ComparisonSummary;
    detailedProjections: YearlyProjection[][];
    charts: ChartData[];
  };
}

export interface ComparisonSummary {
  comparisonName: string;
  scenarioNames: string[];
  keyMetrics: {
    yearsToFire: number[];
    fireNumbers: number[];
    successProbabilities: number[];
    monthlyRequiredSavings: number[];
  };
  recommendations: string[];
}

export interface YearlyProjection {
  year: number;
  age: number;
  netWorth: number;
  contributions: number;
  growth: number;
  expenses: number;
  inflationAdjustedExpenses: number;
}

export interface ChartData {
  type: 'line' | 'bar' | 'pie';
  title: string;
  data: any[];
  labels: string[];
}

/**
 * Scenario Comparison Service
 */
export class ScenarioComparisonService {
  private static instance: ScenarioComparisonService;
  private comparisons: Map<string, ScenarioComparison> = new Map();

  private constructor() {}

  public static getInstance(): ScenarioComparisonService {
    if (!ScenarioComparisonService.instance) {
      ScenarioComparisonService.instance = new ScenarioComparisonService();
    }
    return ScenarioComparisonService.instance;
  }

  /**
   * Create a new scenario comparison
   */
  public async createComparison(
    name: string,
    scenarios: EnhancedScenario[]
  ): Promise<ScenarioComparison> {
    if (scenarios.length < 2) {
      throw new Error('At least 2 scenarios are required for comparison');
    }

    if (scenarios.length > 5) {
      throw new Error('Maximum 5 scenarios can be compared at once');
    }

    // Calculate projections for each scenario
    const projections = scenarios.map(scenario => 
      realTimeCalculationService.calculateProjections({
        currentAge: 30,
        currentNetWorth: 50000,
        monthlyIncome: 8000,
        monthlyExpenses: 4000,
        assumptions: scenario.assumptions,
      })
    );

    // Perform comprehensive analysis
    const analysis = this.performComparisonAnalysis(scenarios, projections);

    const comparison: ScenarioComparison = {
      id: `comparison_${Date.now()}`,
      name,
      scenarios,
      projections,
      analysis,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.comparisons.set(comparison.id, comparison);
    return comparison;
  }

  /**
   * Get all comparisons
   */
  public getComparisons(): ScenarioComparison[] {
    return Array.from(this.comparisons.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  /**
   * Get comparison by ID
   */
  public getComparison(id: string): ScenarioComparison | null {
    return this.comparisons.get(id) || null;
  }

  /**
   * Update comparison
   */
  public async updateComparison(
    id: string,
    updates: Partial<Pick<ScenarioComparison, 'name' | 'scenarios'>>
  ): Promise<ScenarioComparison> {
    const existing = this.comparisons.get(id);
    if (!existing) {
      throw new Error('Comparison not found');
    }

    const updatedScenarios = updates.scenarios || existing.scenarios;
    const projections = updatedScenarios.map(scenario => 
      realTimeCalculationService.calculateProjections({
        currentAge: 30,
        currentNetWorth: 50000,
        monthlyIncome: 8000,
        monthlyExpenses: 4000,
        assumptions: scenario.assumptions,
      })
    );

    const analysis = this.performComparisonAnalysis(updatedScenarios, projections);

    const updated: ScenarioComparison = {
      ...existing,
      ...updates,
      scenarios: updatedScenarios,
      projections,
      analysis,
      updatedAt: new Date(),
    };

    this.comparisons.set(id, updated);
    return updated;
  }

  /**
   * Delete comparison
   */
  public deleteComparison(id: string): boolean {
    return this.comparisons.delete(id);
  }

  /**
   * Export comparison data
   */
  public async exportComparison(
    id: string,
    format: 'pdf' | 'excel' | 'csv'
  ): Promise<ComparisonExport> {
    const comparison = this.getComparison(id);
    if (!comparison) {
      throw new Error('Comparison not found');
    }

    const summary: ComparisonSummary = {
      comparisonName: comparison.name,
      scenarioNames: comparison.scenarios.map(s => s.name),
      keyMetrics: {
        yearsToFire: comparison.projections.map(p => p.yearsToFire),
        fireNumbers: comparison.projections.map(p => p.fireNumber),
        successProbabilities: comparison.projections.map(p => p.successProbability),
        monthlyRequiredSavings: comparison.projections.map(p => p.monthlyRequiredSavings),
      },
      recommendations: comparison.analysis.recommendations,
    };

    // Generate detailed projections (simplified for now)
    const detailedProjections = comparison.scenarios.map(() => 
      this.generateYearlyProjections(30) // 30 years of projections
    );

    // Generate chart data
    const charts = this.generateChartData(comparison);

    return {
      format,
      data: {
        summary,
        detailedProjections,
        charts,
      },
    };
  }

  /**
   * Perform comprehensive comparison analysis
   */
  private performComparisonAnalysis(
    scenarios: EnhancedScenario[],
    projections: RealTimeProjections[]
  ): ComparisonAnalysis {
    const keyDifferences = this.calculateKeyDifferences(projections);
    const bestScenario = this.determineBestScenarios(projections);
    const riskAnalysis = this.analyzeRisk(scenarios, projections);
    const recommendations = this.generateRecommendations(scenarios, projections, keyDifferences);
    const probabilityAnalysis = this.analyzeProbabilities(projections);
    const breakEvenAnalysis = this.analyzeBreakEven(projections);

    return {
      keyDifferences,
      bestScenario,
      riskAnalysis,
      recommendations,
      probabilityAnalysis,
      breakEvenAnalysis,
    };
  }

  /**
   * Calculate key differences between scenarios
   */
  private calculateKeyDifferences(projections: RealTimeProjections[]): KeyDifference[] {
    const differences: KeyDifference[] = [];
    const metrics: (keyof RealTimeProjections)[] = [
      'yearsToFire',
      'fireNumber',
      'successProbability',
      'monthlyRequiredSavings',
    ];

    for (const metric of metrics) {
      const values = projections.map(p => p[metric] as number);
      const maxValue = Math.max(...values);
      const minValue = Math.min(...values);
      const maxIndex = values.indexOf(maxValue);
      const minIndex = values.indexOf(minValue);

      if (maxValue !== minValue) {
        const difference = maxValue - minValue;
        const percentageDifference = ((difference / minValue) * 100);
        const significance = this.determineDifferenceSignificance(metric, percentageDifference);

        differences.push({
          metric: metric as any,
          scenarioIndex: maxIndex,
          value: maxValue,
          difference,
          percentageDifference,
          significance,
        });
      }
    }

    return differences.sort((a, b) => b.percentageDifference - a.percentageDifference);
  }

  /**
   * Determine best scenarios for different criteria
   */
  private determineBestScenarios(projections: RealTimeProjections[]): ScenarioBest {
    const yearsToFire = projections.map(p => p.yearsToFire);
    const successProbabilities = projections.map(p => p.successProbability);
    const savingsRates = projections.map((_, i) => 0.25); // Simplified

    const fastest = {
      index: yearsToFire.indexOf(Math.min(...yearsToFire)),
      yearsToFire: Math.min(...yearsToFire),
    };

    const safest = {
      index: successProbabilities.indexOf(Math.max(...successProbabilities)),
      successProbability: Math.max(...successProbabilities),
    };

    const mostEfficient = {
      index: savingsRates.indexOf(Math.min(...savingsRates)),
      savingsRate: Math.min(...savingsRates),
    };

    // Calculate overall score (weighted combination)
    const overallScores = projections.map((p, i) => {
      const timeScore = (1 / p.yearsToFire) * 0.4;
      const probabilityScore = p.successProbability * 0.4;
      const efficiencyScore = (1 / savingsRates[i]) * 0.2;
      return timeScore + probabilityScore + efficiencyScore;
    });

    const overall = {
      index: overallScores.indexOf(Math.max(...overallScores)),
      score: Math.max(...overallScores),
    };

    return { fastest, safest, mostEfficient, overall };
  }

  /**
   * Analyze risk across scenarios
   */
  private analyzeRisk(
    scenarios: EnhancedScenario[],
    projections: RealTimeProjections[]
  ): RiskAnalysis {
    const riskLevels = projections.map(p => p.riskLevel);
    const riskFactors: string[] = [];
    const mitigation: string[] = [];

    // Analyze risk factors
    scenarios.forEach((scenario, i) => {
      if (scenario.assumptions.market_return > 0.10) {
        riskFactors.push(`Scenario ${i + 1}: High return assumption (${(scenario.assumptions.market_return * 100).toFixed(1)}%)`);
      }
      if (scenario.assumptions.savings_rate < 0.15) {
        riskFactors.push(`Scenario ${i + 1}: Low savings rate (${(scenario.assumptions.savings_rate * 100).toFixed(1)}%)`);
      }
      if (projections[i].successProbability < 0.7) {
        riskFactors.push(`Scenario ${i + 1}: Low success probability (${(projections[i].successProbability * 100).toFixed(1)}%)`);
      }
    });

    // Generate mitigation strategies
    if (riskFactors.length > 0) {
      mitigation.push('Consider diversifying across multiple scenarios');
      mitigation.push('Increase emergency fund for high-risk scenarios');
      mitigation.push('Regular plan reviews and adjustments');
    }

    // Calculate diversification score
    const uniqueRiskLevels = new Set(riskLevels).size;
    const diversificationScore = (uniqueRiskLevels / riskLevels.length) * 100;

    return {
      riskLevels,
      riskFactors,
      mitigation,
      diversificationScore,
    };
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    scenarios: EnhancedScenario[],
    projections: RealTimeProjections[],
    keyDifferences: KeyDifference[]
  ): string[] {
    const recommendations: string[] = [];

    // Time-based recommendations
    const timeRange = Math.max(...projections.map(p => p.yearsToFire)) - 
                     Math.min(...projections.map(p => p.yearsToFire));
    
    if (timeRange > 10) {
      recommendations.push('Large timeline variation suggests reviewing assumptions for realism');
    }

    // Probability-based recommendations
    const avgProbability = projections.reduce((sum, p) => sum + p.successProbability, 0) / projections.length;
    if (avgProbability < 0.7) {
      recommendations.push('Consider more conservative assumptions or higher savings rates');
    }

    // Risk-based recommendations
    const highRiskScenarios = projections.filter(p => p.riskLevel === 'high' || p.riskLevel === 'extreme').length;
    if (highRiskScenarios > projections.length / 2) {
      recommendations.push('Majority of scenarios are high-risk - consider adding conservative alternatives');
    }

    return recommendations;
  }

  /**
   * Analyze probabilities across scenarios
   */
  private analyzeProbabilities(projections: RealTimeProjections[]): ProbabilityAnalysis {
    const scenarios = projections.map((p, index) => ({
      index,
      probability: p.successProbability,
      confidenceInterval: [
        Math.max(0, p.successProbability - 0.1),
        Math.min(1, p.successProbability + 0.1),
      ] as [number, number],
      factors: p.keyInsights.slice(0, 2),
    }));

    const averageProbability = scenarios.reduce((sum, s) => sum + s.probability, 0) / scenarios.length;
    const probabilitySpread = Math.max(...scenarios.map(s => s.probability)) - 
                             Math.min(...scenarios.map(s => s.probability));

    return {
      scenarios,
      averageProbability,
      probabilitySpread,
    };
  }

  /**
   * Analyze break-even points
   */
  private analyzeBreakEven(projections: RealTimeProjections[]): BreakEvenAnalysis {
    // Simplified break-even analysis
    const avgYearsToFire = projections.reduce((sum, p) => sum + p.yearsToFire, 0) / projections.length;
    const maxDifference = Math.max(...projections.map(p => p.yearsToFire)) - 
                         Math.min(...projections.map(p => p.yearsToFire));

    return {
      timeToBreakEven: avgYearsToFire * 0.5, // Simplified
      breakEvenPoint: 100000, // Simplified
      significantDivergence: {
        timePoint: avgYearsToFire * 0.3,
        maxDifference,
        divergingScenarios: [0, 1], // Simplified
      },
    };
  }

  /**
   * Determine significance of difference
   */
  private determineDifferenceSignificance(
    metric: string,
    percentageDifference: number
  ): 'minimal' | 'moderate' | 'significant' | 'dramatic' {
    const thresholds = {
      yearsToFire: { moderate: 10, significant: 25, dramatic: 50 },
      fireNumber: { moderate: 15, significant: 30, dramatic: 60 },
      successProbability: { moderate: 5, significant: 15, dramatic: 30 },
      monthlyRequiredSavings: { moderate: 20, significant: 40, dramatic: 80 },
    };

    const threshold = thresholds[metric as keyof typeof thresholds] || thresholds.yearsToFire;

    if (percentageDifference >= threshold.dramatic) return 'dramatic';
    if (percentageDifference >= threshold.significant) return 'significant';
    if (percentageDifference >= threshold.moderate) return 'moderate';
    return 'minimal';
  }

  /**
   * Generate yearly projections (simplified)
   */
  private generateYearlyProjections(years: number): YearlyProjection[] {
    const projections: YearlyProjection[] = [];
    let netWorth = 50000;
    const monthlyContribution = 2000;
    const annualReturn = 0.07;
    const inflationRate = 0.03;
    let expenses = 48000;

    for (let year = 1; year <= years; year++) {
      const contributions = monthlyContribution * 12;
      const growth = netWorth * annualReturn;
      netWorth += contributions + growth;
      expenses *= (1 + inflationRate);

      projections.push({
        year,
        age: 30 + year,
        netWorth,
        contributions,
        growth,
        expenses: 48000,
        inflationAdjustedExpenses: expenses,
      });
    }

    return projections;
  }

  /**
   * Generate chart data for comparison
   */
  private generateChartData(comparison: ScenarioComparison): ChartData[] {
    const charts: ChartData[] = [];

    // Years to FIRE comparison
    charts.push({
      type: 'bar',
      title: 'Years to FIRE Comparison',
      data: comparison.projections.map(p => p.yearsToFire),
      labels: comparison.scenarios.map(s => s.name),
    });

    // Success probability comparison
    charts.push({
      type: 'bar',
      title: 'Success Probability Comparison',
      data: comparison.projections.map(p => p.successProbability * 100),
      labels: comparison.scenarios.map(s => s.name),
    });

    return charts;
  }
}

export const scenarioComparisonService = ScenarioComparisonService.getInstance();
