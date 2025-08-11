/**
 * Stress Testing Service
 * Epic 9, Story 5: Comprehensive stress testing with market downturns and recovery analysis
 * Provides advanced stress testing capabilities for financial scenarios
 */

import { EnhancedScenario, ScenarioAssumptions } from '@drishti/shared/types/financial';
import { realTimeCalculationService, RealTimeProjections } from '../calculations/RealTimeCalculationService';

export interface StressTest {
  id: string;
  name: string;
  description: string;
  type: 'historical' | 'custom' | 'monte_carlo';
  scenario: EnhancedScenario;
  stressScenarios: StressScenario[];
  results: StressTestResults;
  createdAt: Date;
  duration: number; // Test duration in years
}

export interface StressScenario {
  id: string;
  name: string;
  description: string;
  type: 'market_crash' | 'recession' | 'inflation_spike' | 'sequence_risk' | 'custom';
  duration: number; // Duration of stress in years
  severity: 'mild' | 'moderate' | 'severe' | 'extreme';
  parameters: StressParameters;
  recoveryPattern: RecoveryPattern;
}

export interface StressParameters {
  marketReturnAdjustment: number; // Percentage change from baseline
  inflationAdjustment: number;
  unemploymentRisk: number; // Probability of job loss
  expenseIncrease: number; // Emergency expense increase
  incomeReduction: number; // Income reduction percentage
  assetCorrelation: number; // How correlated different assets become
}

export interface RecoveryPattern {
  type: 'immediate' | 'gradual' | 'delayed' | 'partial';
  recoveryYears: number;
  recoveryStrength: number; // 0-1, how much recovery occurs
  overshoot: boolean; // Whether recovery overshoots baseline
}

export interface StressTestResults {
  baselineProjection: RealTimeProjections;
  stressedProjections: StressedProjection[];
  summary: StressTestSummary;
  riskMetrics: StressRiskMetrics;
  recommendations: string[];
  survivabilityAnalysis: SurvivabilityAnalysis;
}

export interface StressedProjection {
  stressScenarioId: string;
  projection: RealTimeProjections;
  impactAnalysis: ImpactAnalysis;
  recoveryAnalysis: RecoveryAnalysis;
}

export interface ImpactAnalysis {
  fireDelayYears: number;
  netWorthImpact: number; // Dollar impact
  successProbabilityChange: number;
  worstCaseNetWorth: number;
  timeToRecover: number; // Years to recover to baseline
}

export interface RecoveryAnalysis {
  recoveryStartYear: number;
  fullRecoveryYear: number;
  recoveryRate: number; // Annual recovery rate
  finalOutcome: 'better' | 'same' | 'worse';
  lessonLearned: string[];
}

export interface StressTestSummary {
  worstCaseScenario: string;
  bestCaseScenario: string;
  averageFireDelay: number;
  averageNetWorthImpact: number;
  survivabilityRate: number; // Percentage of scenarios where FIRE is still achieved
  keyVulnerabilities: string[];
  strengthAreas: string[];
}

export interface StressRiskMetrics {
  sequenceOfReturnsRisk: number;
  inflationRisk: number;
  unemploymentRisk: number;
  emergencyFundAdequacy: number;
  portfolioDiversification: number;
  overallRiskScore: number; // 0-100, higher is riskier
}

export interface SurvivabilityAnalysis {
  scenarios: {
    scenarioName: string;
    survives: boolean;
    fireAchieved: boolean;
    finalNetWorth: number;
    keyFactors: string[];
  }[];
  overallSurvivalRate: number;
  criticalFailurePoints: string[];
  strengthFactors: string[];
}

export interface HistoricalStressEvent {
  name: string;
  period: string;
  description: string;
  marketImpact: number;
  inflationImpact: number;
  unemploymentRate: number;
  duration: number;
  recoveryTime: number;
  lessons: string[];
}

/**
 * Stress Testing Service
 */
export class StressTestingService {
  private static instance: StressTestingService;
  private stressTests: Map<string, StressTest> = new Map();
  private historicalEvents: HistoricalStressEvent[] = [];

  private constructor() {
    this.initializeHistoricalEvents();
  }

  public static getInstance(): StressTestingService {
    if (!StressTestingService.instance) {
      StressTestingService.instance = new StressTestingService();
    }
    return StressTestingService.instance;
  }

  /**
   * Create comprehensive stress test
   */
  public async createStressTest(
    scenario: EnhancedScenario,
    testName: string,
    testType: 'historical' | 'custom' | 'monte_carlo' = 'historical',
    duration: number = 30
  ): Promise<StressTest> {
    const stressScenarios = this.generateStressScenarios(testType);
    const results = await this.runStressTest(scenario, stressScenarios);

    const stressTest: StressTest = {
      id: `stress_test_${Date.now()}`,
      name: testName,
      description: `Comprehensive stress test for ${scenario.name}`,
      type: testType,
      scenario,
      stressScenarios,
      results,
      createdAt: new Date(),
      duration,
    };

    this.stressTests.set(stressTest.id, stressTest);
    return stressTest;
  }

  /**
   * Get historical stress events
   */
  public getHistoricalEvents(): HistoricalStressEvent[] {
    return this.historicalEvents;
  }

  /**
   * Run stress test with multiple scenarios
   */
  private async runStressTest(
    baseScenario: EnhancedScenario,
    stressScenarios: StressScenario[]
  ): Promise<StressTestResults> {
    // Calculate baseline projection
    const baselineProjection = realTimeCalculationService.calculateProjections({
      currentAge: 30,
      currentNetWorth: 50000,
      monthlyIncome: 8000,
      monthlyExpenses: 4000,
      assumptions: baseScenario.assumptions,
    });

    // Run each stress scenario
    const stressedProjections: StressedProjection[] = [];
    
    for (const stressScenario of stressScenarios) {
      const stressedAssumptions = this.applyStressToAssumptions(
        baseScenario.assumptions,
        stressScenario
      );

      const stressedProjection = realTimeCalculationService.calculateProjections({
        currentAge: 30,
        currentNetWorth: 50000,
        monthlyIncome: 8000,
        monthlyExpenses: 4000,
        assumptions: stressedAssumptions,
      });

      const impactAnalysis = this.analyzeImpact(baselineProjection, stressedProjection);
      const recoveryAnalysis = this.analyzeRecovery(stressScenario, impactAnalysis);

      stressedProjections.push({
        stressScenarioId: stressScenario.id,
        projection: stressedProjection,
        impactAnalysis,
        recoveryAnalysis,
      });
    }

    // Generate comprehensive analysis
    const summary = this.generateSummary(baselineProjection, stressedProjections);
    const riskMetrics = this.calculateRiskMetrics(baseScenario, stressedProjections);
    const recommendations = this.generateRecommendations(summary, riskMetrics);
    const survivabilityAnalysis = this.analyzeSurvivability(stressScenarios, stressedProjections);

    return {
      baselineProjection,
      stressedProjections,
      summary,
      riskMetrics,
      recommendations,
      survivabilityAnalysis,
    };
  }

  /**
   * Generate stress scenarios based on type
   */
  private generateStressScenarios(testType: 'historical' | 'custom' | 'monte_carlo'): StressScenario[] {
    const scenarios: StressScenario[] = [];

    if (testType === 'historical') {
      // 2008 Financial Crisis
      scenarios.push({
        id: 'crisis_2008',
        name: '2008 Financial Crisis',
        description: 'Severe market crash with banking crisis and recession',
        type: 'market_crash',
        duration: 2,
        severity: 'extreme',
        parameters: {
          marketReturnAdjustment: -0.37, // -37% market return
          inflationAdjustment: -0.01,
          unemploymentRisk: 0.10,
          expenseIncrease: 0.05,
          incomeReduction: 0.15,
          assetCorrelation: 0.9,
        },
        recoveryPattern: {
          type: 'gradual',
          recoveryYears: 5,
          recoveryStrength: 1.2,
          overshoot: true,
        },
      });

      // COVID-19 Pandemic
      scenarios.push({
        id: 'covid_2020',
        name: 'COVID-19 Pandemic',
        description: 'Rapid market crash followed by unprecedented stimulus',
        type: 'market_crash',
        duration: 1,
        severity: 'severe',
        parameters: {
          marketReturnAdjustment: -0.20,
          inflationAdjustment: 0.02,
          unemploymentRisk: 0.15,
          expenseIncrease: 0.10,
          incomeReduction: 0.20,
          assetCorrelation: 0.8,
        },
        recoveryPattern: {
          type: 'immediate',
          recoveryYears: 2,
          recoveryStrength: 1.3,
          overshoot: true,
        },
      });

      // 1970s Stagflation
      scenarios.push({
        id: 'stagflation_1970s',
        name: '1970s Stagflation',
        description: 'High inflation with stagnant economic growth',
        type: 'inflation_spike',
        duration: 8,
        severity: 'severe',
        parameters: {
          marketReturnAdjustment: -0.02,
          inflationAdjustment: 0.05,
          unemploymentRisk: 0.08,
          expenseIncrease: 0.15,
          incomeReduction: 0.05,
          assetCorrelation: 0.6,
        },
        recoveryPattern: {
          type: 'delayed',
          recoveryYears: 3,
          recoveryStrength: 0.9,
          overshoot: false,
        },
      });

      // Sequence of Returns Risk
      scenarios.push({
        id: 'sequence_risk',
        name: 'Early Retirement Sequence Risk',
        description: 'Poor returns in early retirement years',
        type: 'sequence_risk',
        duration: 5,
        severity: 'moderate',
        parameters: {
          marketReturnAdjustment: -0.15,
          inflationAdjustment: 0.01,
          unemploymentRisk: 0.0, // Already retired
          expenseIncrease: 0.05,
          incomeReduction: 0.0,
          assetCorrelation: 0.7,
        },
        recoveryPattern: {
          type: 'gradual',
          recoveryYears: 10,
          recoveryStrength: 0.8,
          overshoot: false,
        },
      });
    }

    return scenarios;
  }

  /**
   * Apply stress parameters to scenario assumptions
   */
  private applyStressToAssumptions(
    baseAssumptions: ScenarioAssumptions,
    stressScenario: StressScenario
  ): ScenarioAssumptions {
    const { parameters } = stressScenario;

    return {
      ...baseAssumptions,
      market_return: Math.max(
        -0.5, // Floor at -50%
        baseAssumptions.market_return + parameters.marketReturnAdjustment
      ),
      inflation_rate: Math.max(
        -0.05, // Floor at -5% (deflation)
        baseAssumptions.inflation_rate + parameters.inflationAdjustment
      ),
      // Reduce savings rate if income is reduced
      savings_rate: Math.max(
        0.05,
        baseAssumptions.savings_rate * (1 - parameters.incomeReduction)
      ),
      // Increase emergency fund requirement
      emergency_fund_months: Math.min(
        24,
        baseAssumptions.emergency_fund_months + 3
      ),
      // Increase healthcare inflation during stress
      healthcare_inflation: baseAssumptions.healthcare_inflation + 0.02,
    };
  }

  /**
   * Analyze impact of stress scenario
   */
  private analyzeImpact(
    baseline: RealTimeProjections,
    stressed: RealTimeProjections
  ): ImpactAnalysis {
    const fireDelayYears = stressed.yearsToFire - baseline.yearsToFire;
    const netWorthImpact = stressed.fireNumber - baseline.fireNumber;
    const successProbabilityChange = stressed.successProbability - baseline.successProbability;

    // Estimate worst case (simplified)
    const worstCaseNetWorth = stressed.fireNumber * 0.6; // Assume 40% additional loss in worst case
    
    // Estimate recovery time (simplified)
    const timeToRecover = Math.max(0, fireDelayYears * 0.7);

    return {
      fireDelayYears,
      netWorthImpact,
      successProbabilityChange,
      worstCaseNetWorth,
      timeToRecover,
    };
  }

  /**
   * Analyze recovery patterns
   */
  private analyzeRecovery(
    stressScenario: StressScenario,
    impactAnalysis: ImpactAnalysis
  ): RecoveryAnalysis {
    const { recoveryPattern } = stressScenario;
    const recoveryStartYear = stressScenario.duration + 1;
    const fullRecoveryYear = recoveryStartYear + recoveryPattern.recoveryYears;
    
    // Calculate recovery rate
    const recoveryRate = recoveryPattern.recoveryStrength / recoveryPattern.recoveryYears;
    
    // Determine final outcome
    let finalOutcome: 'better' | 'same' | 'worse' = 'same';
    if (recoveryPattern.overshoot) {
      finalOutcome = 'better';
    } else if (recoveryPattern.recoveryStrength < 1) {
      finalOutcome = 'worse';
    }

    // Generate lessons learned
    const lessonLearned = this.generateLessonsLearned(stressScenario, impactAnalysis);

    return {
      recoveryStartYear,
      fullRecoveryYear,
      recoveryRate,
      finalOutcome,
      lessonLearned,
    };
  }

  /**
   * Generate summary of stress test results
   */
  private generateSummary(
    baseline: RealTimeProjections,
    stressedProjections: StressedProjection[]
  ): StressTestSummary {
    const fireDelays = stressedProjections.map(sp => sp.impactAnalysis.fireDelayYears);
    const netWorthImpacts = stressedProjections.map(sp => sp.impactAnalysis.netWorthImpact);
    
    const worstCaseIndex = fireDelays.indexOf(Math.max(...fireDelays));
    const bestCaseIndex = fireDelays.indexOf(Math.min(...fireDelays));
    
    const worstCaseScenario = stressedProjections[worstCaseIndex]?.stressScenarioId || 'Unknown';
    const bestCaseScenario = stressedProjections[bestCaseIndex]?.stressScenarioId || 'Unknown';
    
    const averageFireDelay = fireDelays.reduce((sum, delay) => sum + delay, 0) / fireDelays.length;
    const averageNetWorthImpact = netWorthImpacts.reduce((sum, impact) => sum + impact, 0) / netWorthImpacts.length;
    
    // Calculate survivability rate
    const survivingScenarios = stressedProjections.filter(sp => sp.projection.successProbability > 0.5);
    const survivabilityRate = (survivingScenarios.length / stressedProjections.length) * 100;

    const keyVulnerabilities = [
      'Sequence of returns risk in early retirement',
      'High correlation during market stress',
      'Insufficient emergency fund for extended downturns',
    ];

    const strengthAreas = [
      'Diversified income sources',
      'Conservative withdrawal rate',
      'Flexible expense management',
    ];

    return {
      worstCaseScenario,
      bestCaseScenario,
      averageFireDelay,
      averageNetWorthImpact,
      survivabilityRate,
      keyVulnerabilities,
      strengthAreas,
    };
  }

  /**
   * Calculate comprehensive risk metrics
   */
  private calculateRiskMetrics(
    scenario: EnhancedScenario,
    stressedProjections: StressedProjection[]
  ): StressRiskMetrics {
    // Sequence of returns risk (higher for early retirement)
    const sequenceOfReturnsRisk = scenario.assumptions.retirement_age < 60 ? 0.7 : 0.3;

    // Inflation risk based on assumptions
    const inflationRisk = scenario.assumptions.inflation_rate > 0.04 ? 0.6 : 0.3;

    // Unemployment risk based on savings rate
    const unemploymentRisk = scenario.assumptions.savings_rate < 0.2 ? 0.5 : 0.2;

    // Emergency fund adequacy
    const emergencyFundAdequacy = scenario.assumptions.emergency_fund_months >= 12 ? 0.8 : 0.4;

    // Portfolio diversification (simplified)
    const portfolioDiversification = 0.7; // Assume moderate diversification

    // Overall risk score (0-100, higher is riskier)
    const riskFactors = [
      sequenceOfReturnsRisk,
      inflationRisk,
      unemploymentRisk,
      1 - emergencyFundAdequacy,
      1 - portfolioDiversification,
    ];
    const overallRiskScore = (riskFactors.reduce((sum, risk) => sum + risk, 0) / riskFactors.length) * 100;

    return {
      sequenceOfReturnsRisk,
      inflationRisk,
      unemploymentRisk,
      emergencyFundAdequacy,
      portfolioDiversification,
      overallRiskScore,
    };
  }

  /**
   * Generate recommendations based on stress test results
   */
  private generateRecommendations(
    summary: StressTestSummary,
    riskMetrics: StressRiskMetrics
  ): string[] {
    const recommendations: string[] = [];

    if (summary.survivabilityRate < 70) {
      recommendations.push('Consider increasing emergency fund to 12+ months');
      recommendations.push('Reduce withdrawal rate to 3.5% for added safety');
    }

    if (summary.averageFireDelay > 5) {
      recommendations.push('Plan for potential 5+ year delay in FIRE timeline');
      recommendations.push('Consider part-time work options during early retirement');
    }

    if (riskMetrics.sequenceOfReturnsRisk > 0.5) {
      recommendations.push('Implement bond tent strategy approaching retirement');
      recommendations.push('Consider delaying retirement by 2-3 years for safety');
    }

    if (riskMetrics.inflationRisk > 0.5) {
      recommendations.push('Increase allocation to inflation-protected assets');
      recommendations.push('Plan for higher healthcare and living costs');
    }

    if (riskMetrics.overallRiskScore > 60) {
      recommendations.push('Overall risk is high - consider more conservative approach');
      recommendations.push('Diversify income sources and reduce single points of failure');
    }

    return recommendations;
  }

  /**
   * Analyze survivability across scenarios
   */
  private analyzeSurvivability(
    stressScenarios: StressScenario[],
    stressedProjections: StressedProjection[]
  ): SurvivabilityAnalysis {
    const scenarios = stressScenarios.map((scenario, index) => {
      const projection = stressedProjections[index];
      const survives = projection.projection.successProbability > 0.3;
      const fireAchieved = projection.projection.yearsToFire < 50;
      
      return {
        scenarioName: scenario.name,
        survives,
        fireAchieved,
        finalNetWorth: projection.projection.fireNumber,
        keyFactors: [
          `${scenario.severity} ${scenario.type}`,
          `${scenario.duration} year duration`,
          projection.recoveryAnalysis.finalOutcome === 'better' ? 'Strong recovery' : 'Weak recovery',
        ],
      };
    });

    const survivingScenarios = scenarios.filter(s => s.survives);
    const overallSurvivalRate = (survivingScenarios.length / scenarios.length) * 100;

    const criticalFailurePoints = [
      'Extended market downturns (5+ years)',
      'High inflation combined with poor returns',
      'Job loss during market stress',
    ];

    const strengthFactors = [
      'High savings rate provides buffer',
      'Conservative withdrawal assumptions',
      'Diversified investment approach',
    ];

    return {
      scenarios,
      overallSurvivalRate,
      criticalFailurePoints,
      strengthFactors,
    };
  }

  /**
   * Generate lessons learned from stress scenario
   */
  private generateLessonsLearned(
    stressScenario: StressScenario,
    impactAnalysis: ImpactAnalysis
  ): string[] {
    const lessons: string[] = [];

    if (impactAnalysis.fireDelayYears > 10) {
      lessons.push('Severe stress can significantly delay FIRE timeline');
      lessons.push('Emergency fund and flexibility are crucial');
    }

    if (stressScenario.type === 'sequence_risk') {
      lessons.push('Early retirement years are most vulnerable to poor returns');
      lessons.push('Consider bond tent or cash cushion strategies');
    }

    if (stressScenario.type === 'inflation_spike') {
      lessons.push('Inflation can erode purchasing power over time');
      lessons.push('Real assets and TIPS can provide protection');
    }

    lessons.push('Stress testing reveals plan vulnerabilities');
    lessons.push('Regular plan reviews and adjustments are essential');

    return lessons;
  }

  /**
   * Initialize historical stress events
   */
  private initializeHistoricalEvents(): void {
    this.historicalEvents = [
      {
        name: '2008 Financial Crisis',
        period: '2007-2009',
        description: 'Subprime mortgage crisis leading to global financial meltdown',
        marketImpact: -0.37,
        inflationImpact: -0.01,
        unemploymentRate: 0.10,
        duration: 2,
        recoveryTime: 5,
        lessons: [
          'Diversification failed when needed most',
          'Liquidity became scarce across all markets',
          'Government intervention was necessary for recovery',
        ],
      },
      {
        name: 'COVID-19 Pandemic',
        period: '2020',
        description: 'Global pandemic causing rapid economic shutdown',
        marketImpact: -0.20,
        inflationImpact: 0.02,
        unemploymentRate: 0.15,
        duration: 1,
        recoveryTime: 2,
        lessons: [
          'Black swan events can happen suddenly',
          'Fiscal and monetary policy response was unprecedented',
          'Technology and remote work provided resilience',
        ],
      },
      {
        name: '1970s Stagflation',
        period: '1973-1982',
        description: 'Oil shocks leading to high inflation and stagnant growth',
        marketImpact: -0.02,
        inflationImpact: 0.05,
        unemploymentRate: 0.08,
        duration: 8,
        recoveryTime: 3,
        lessons: [
          'Inflation can persist for extended periods',
          'Traditional 60/40 portfolios struggled',
          'Real assets provided better protection',
        ],
      },
      {
        name: 'Dot-com Crash',
        period: '2000-2002',
        description: 'Technology bubble burst leading to market decline',
        marketImpact: -0.49,
        inflationImpact: -0.01,
        unemploymentRate: 0.06,
        duration: 3,
        recoveryTime: 5,
        lessons: [
          'Speculation and valuations matter',
          'Sector concentration increases risk',
          'Recovery can take many years',
        ],
      },
    ];
  }

  /**
   * Get all stress tests
   */
  public getStressTests(): StressTest[] {
    return Array.from(this.stressTests.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   * Get stress test by ID
   */
  public getStressTest(id: string): StressTest | null {
    return this.stressTests.get(id) || null;
  }
}

export const stressTestingService = StressTestingService.getInstance();
