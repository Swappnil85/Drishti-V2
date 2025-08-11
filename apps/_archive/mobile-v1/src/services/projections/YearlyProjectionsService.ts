/**
 * Yearly Projections Service
 * Epic 9, Story 4: Detailed yearly projections with interactive tables and export
 * Provides comprehensive year-by-year financial projections and analysis
 */

import { EnhancedScenario, ScenarioAssumptions } from '@drishti/shared/types/financial';

export interface YearlyProjection {
  year: number;
  age: number;
  startingNetWorth: number;
  contributions: {
    salary: number;
    bonuses: number;
    other: number;
    total: number;
  };
  growth: {
    investment: number;
    realEstate: number;
    other: number;
    total: number;
  };
  expenses: {
    living: number;
    healthcare: number;
    taxes: number;
    other: number;
    total: number;
    inflationAdjusted: number;
  };
  endingNetWorth: number;
  fireProgress: number; // Percentage towards FIRE goal
  milestones: ProjectionMilestone[];
  cashFlow: number;
  savingsRate: number;
  withdrawalRate?: number; // For post-FIRE years
  isRetired: boolean;
}

export interface ProjectionMilestone {
  type: 'fire_achieved' | 'half_fire' | 'quarter_fire' | 'million' | 'custom';
  description: string;
  value: number;
  achieved: boolean;
}

export interface ProjectionSummary {
  totalYears: number;
  fireYear: number;
  fireAge: number;
  totalContributions: number;
  totalGrowth: number;
  totalExpenses: number;
  finalNetWorth: number;
  averageReturn: number;
  averageInflation: number;
  keyMilestones: ProjectionMilestone[];
  riskMetrics: RiskMetrics;
}

export interface RiskMetrics {
  sequenceOfReturnsRisk: number;
  inflationRisk: number;
  longevityRisk: number;
  withdrawalSustainability: number;
  emergencyFundAdequacy: number;
}

export interface DecadeView {
  decade: string;
  startYear: number;
  endYear: number;
  startingNetWorth: number;
  endingNetWorth: number;
  totalContributions: number;
  totalGrowth: number;
  totalExpenses: number;
  averageReturn: number;
  keyEvents: string[];
  projections: YearlyProjection[];
}

export interface ProjectionInputs {
  currentAge: number;
  currentNetWorth: number;
  currentSalary: number;
  assumptions: ScenarioAssumptions;
  projectionYears: number;
  customMilestones?: CustomMilestone[];
}

export interface CustomMilestone {
  name: string;
  targetValue: number;
  description: string;
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  includeCharts: boolean;
  includeAnalysis: boolean;
  yearRange?: [number, number];
  groupByDecade: boolean;
}

/**
 * Yearly Projections Service
 */
export class YearlyProjectionsService {
  private static instance: YearlyProjectionsService;

  private constructor() {}

  public static getInstance(): YearlyProjectionsService {
    if (!YearlyProjectionsService.instance) {
      YearlyProjectionsService.instance = new YearlyProjectionsService();
    }
    return YearlyProjectionsService.instance;
  }

  /**
   * Generate detailed yearly projections
   */
  public generateProjections(inputs: ProjectionInputs): {
    projections: YearlyProjection[];
    summary: ProjectionSummary;
    decadeViews: DecadeView[];
  } {
    const projections = this.calculateYearlyProjections(inputs);
    const summary = this.generateSummary(projections, inputs);
    const decadeViews = this.generateDecadeViews(projections);

    return { projections, summary, decadeViews };
  }

  /**
   * Calculate yearly projections
   */
  private calculateYearlyProjections(inputs: ProjectionInputs): YearlyProjection[] {
    const projections: YearlyProjection[] = [];
    const { currentAge, currentNetWorth, currentSalary, assumptions, projectionYears } = inputs;

    let netWorth = currentNetWorth;
    let salary = currentSalary;
    let livingExpenses = salary * (1 - assumptions.savings_rate);
    let isRetired = false;
    let retirementYear = 0;

    // Calculate FIRE target
    const fireTarget = livingExpenses * 25; // 4% rule

    for (let year = 1; year <= projectionYears; year++) {
      const age = currentAge + year;
      const startingNetWorth = netWorth;

      // Check if FIRE is achieved
      if (!isRetired && netWorth >= fireTarget) {
        isRetired = true;
        retirementYear = year;
      }

      // Calculate contributions (pre-retirement only)
      const contributions = isRetired ? {
        salary: 0,
        bonuses: 0,
        other: 0,
        total: 0,
      } : {
        salary: salary * assumptions.savings_rate,
        bonuses: salary * 0.1 * assumptions.savings_rate, // Assume 10% bonus
        other: 0,
        total: salary * assumptions.savings_rate * 1.1,
      };

      // Calculate growth
      const investmentGrowth = netWorth * assumptions.market_return;
      const growth = {
        investment: investmentGrowth,
        realEstate: 0, // Simplified
        other: 0,
        total: investmentGrowth,
      };

      // Calculate expenses
      const inflationAdjustedLiving = livingExpenses * Math.pow(1 + assumptions.inflation_rate, year);
      const healthcareExpenses = inflationAdjustedLiving * 0.15 * Math.pow(1 + assumptions.healthcare_inflation, year);
      const taxes = isRetired ? 0 : salary * assumptions.tax_rate;
      
      const expenses = {
        living: inflationAdjustedLiving,
        healthcare: healthcareExpenses,
        taxes: taxes,
        other: 0,
        total: inflationAdjustedLiving + healthcareExpenses + taxes,
        inflationAdjusted: inflationAdjustedLiving,
      };

      // Calculate withdrawal for retired years
      const withdrawal = isRetired ? netWorth * 0.04 : 0; // 4% rule
      const withdrawalRate = isRetired ? 0.04 : undefined;

      // Update net worth
      netWorth += contributions.total + growth.total;
      if (isRetired) {
        netWorth -= withdrawal;
      }

      // Calculate metrics
      const fireProgress = Math.min((netWorth / fireTarget) * 100, 100);
      const cashFlow = contributions.total + growth.total - (isRetired ? withdrawal : 0);
      const savingsRate = isRetired ? 0 : assumptions.savings_rate;

      // Generate milestones
      const milestones = this.generateMilestones(netWorth, fireTarget, inputs.customMilestones);

      const projection: YearlyProjection = {
        year,
        age,
        startingNetWorth,
        contributions,
        growth,
        expenses,
        endingNetWorth: netWorth,
        fireProgress,
        milestones,
        cashFlow,
        savingsRate,
        withdrawalRate,
        isRetired,
      };

      projections.push(projection);

      // Update salary for next year (inflation adjustment)
      if (!isRetired) {
        salary *= (1 + assumptions.inflation_rate);
        livingExpenses *= (1 + assumptions.inflation_rate);
      }
    }

    return projections;
  }

  /**
   * Generate milestones for a given year
   */
  private generateMilestones(
    netWorth: number,
    fireTarget: number,
    customMilestones?: CustomMilestone[]
  ): ProjectionMilestone[] {
    const milestones: ProjectionMilestone[] = [];

    // Standard milestones
    const standardMilestones = [
      { type: 'quarter_fire' as const, value: fireTarget * 0.25, description: '25% to FIRE' },
      { type: 'half_fire' as const, value: fireTarget * 0.5, description: '50% to FIRE' },
      { type: 'fire_achieved' as const, value: fireTarget, description: 'FIRE Achieved!' },
      { type: 'million' as const, value: 1000000, description: 'First Million' },
    ];

    standardMilestones.forEach(milestone => {
      milestones.push({
        ...milestone,
        achieved: netWorth >= milestone.value,
      });
    });

    // Custom milestones
    if (customMilestones) {
      customMilestones.forEach(custom => {
        milestones.push({
          type: 'custom',
          description: custom.description,
          value: custom.targetValue,
          achieved: netWorth >= custom.targetValue,
        });
      });
    }

    return milestones.filter(m => m.achieved);
  }

  /**
   * Generate projection summary
   */
  private generateSummary(projections: YearlyProjection[], inputs: ProjectionInputs): ProjectionSummary {
    const fireProjection = projections.find(p => p.fireProgress >= 100);
    const fireYear = fireProjection?.year || projections.length;
    const fireAge = fireProjection?.age || inputs.currentAge + projections.length;

    const totalContributions = projections.reduce((sum, p) => sum + p.contributions.total, 0);
    const totalGrowth = projections.reduce((sum, p) => sum + p.growth.total, 0);
    const totalExpenses = projections.reduce((sum, p) => sum + p.expenses.total, 0);
    const finalNetWorth = projections[projections.length - 1]?.endingNetWorth || 0;

    // Calculate averages
    const returns = projections.map(p => p.growth.total / Math.max(p.startingNetWorth, 1));
    const averageReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const averageInflation = inputs.assumptions.inflation_rate;

    // Key milestones achieved
    const allMilestones = projections.flatMap(p => p.milestones);
    const uniqueMilestones = allMilestones.filter((milestone, index, self) => 
      index === self.findIndex(m => m.type === milestone.type && m.value === milestone.value)
    );

    // Risk metrics
    const riskMetrics = this.calculateRiskMetrics(projections, inputs);

    return {
      totalYears: projections.length,
      fireYear,
      fireAge,
      totalContributions,
      totalGrowth,
      totalExpenses,
      finalNetWorth,
      averageReturn,
      averageInflation,
      keyMilestones: uniqueMilestones,
      riskMetrics,
    };
  }

  /**
   * Generate decade views
   */
  private generateDecadeViews(projections: YearlyProjection[]): DecadeView[] {
    const decadeViews: DecadeView[] = [];
    const decades = Math.ceil(projections.length / 10);

    for (let i = 0; i < decades; i++) {
      const startIndex = i * 10;
      const endIndex = Math.min((i + 1) * 10, projections.length);
      const decadeProjections = projections.slice(startIndex, endIndex);

      if (decadeProjections.length === 0) continue;

      const startYear = decadeProjections[0].year;
      const endYear = decadeProjections[decadeProjections.length - 1].year;
      const startingNetWorth = decadeProjections[0].startingNetWorth;
      const endingNetWorth = decadeProjections[decadeProjections.length - 1].endingNetWorth;

      const totalContributions = decadeProjections.reduce((sum, p) => sum + p.contributions.total, 0);
      const totalGrowth = decadeProjections.reduce((sum, p) => sum + p.growth.total, 0);
      const totalExpenses = decadeProjections.reduce((sum, p) => sum + p.expenses.total, 0);

      const returns = decadeProjections.map(p => p.growth.total / Math.max(p.startingNetWorth, 1));
      const averageReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;

      // Key events in this decade
      const keyEvents: string[] = [];
      const retirementYear = decadeProjections.find(p => p.isRetired && !projections[projections.indexOf(p) - 1]?.isRetired);
      if (retirementYear) {
        keyEvents.push(`Retirement at age ${retirementYear.age}`);
      }

      const milestoneAchievements = decadeProjections.flatMap(p => p.milestones)
        .filter((milestone, index, self) => 
          index === self.findIndex(m => m.type === milestone.type)
        );
      
      milestoneAchievements.forEach(milestone => {
        keyEvents.push(milestone.description);
      });

      decadeViews.push({
        decade: `Years ${startYear}-${endYear}`,
        startYear,
        endYear,
        startingNetWorth,
        endingNetWorth,
        totalContributions,
        totalGrowth,
        totalExpenses,
        averageReturn,
        keyEvents,
        projections: decadeProjections,
      });
    }

    return decadeViews;
  }

  /**
   * Calculate risk metrics
   */
  private calculateRiskMetrics(projections: YearlyProjection[], inputs: ProjectionInputs): RiskMetrics {
    // Simplified risk calculations
    const retiredYears = projections.filter(p => p.isRetired);
    const preRetiredYears = projections.filter(p => !p.isRetired);

    // Sequence of returns risk (higher for early retirement)
    const sequenceOfReturnsRisk = retiredYears.length > 30 ? 0.3 : 0.1;

    // Inflation risk based on assumptions
    const inflationRisk = inputs.assumptions.inflation_rate > 0.04 ? 0.4 : 0.2;

    // Longevity risk (higher for longer retirement)
    const longevityRisk = retiredYears.length > 40 ? 0.5 : 0.2;

    // Withdrawal sustainability
    const avgWithdrawalRate = retiredYears.length > 0 
      ? retiredYears.reduce((sum, p) => sum + (p.withdrawalRate || 0), 0) / retiredYears.length
      : 0;
    const withdrawalSustainability = avgWithdrawalRate > 0.04 ? 0.4 : 0.8;

    // Emergency fund adequacy
    const emergencyFundAdequacy = inputs.assumptions.emergency_fund_months >= 6 ? 0.8 : 0.4;

    return {
      sequenceOfReturnsRisk,
      inflationRisk,
      longevityRisk,
      withdrawalSustainability,
      emergencyFundAdequacy,
    };
  }

  /**
   * Export projections
   */
  public async exportProjections(
    projections: YearlyProjection[],
    summary: ProjectionSummary,
    options: ExportOptions
  ): Promise<string> {
    // Filter projections by year range if specified
    let exportProjections = projections;
    if (options.yearRange) {
      const [startYear, endYear] = options.yearRange;
      exportProjections = projections.filter(p => p.year >= startYear && p.year <= endYear);
    }

    switch (options.format) {
      case 'csv':
        return this.exportToCSV(exportProjections, summary, options);
      case 'excel':
        return this.exportToExcel(exportProjections, summary, options);
      case 'pdf':
        return this.exportToPDF(exportProjections, summary, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Export to CSV format
   */
  private exportToCSV(
    projections: YearlyProjection[],
    summary: ProjectionSummary,
    options: ExportOptions
  ): string {
    const headers = [
      'Year', 'Age', 'Starting Net Worth', 'Contributions', 'Growth', 
      'Expenses', 'Ending Net Worth', 'FIRE Progress %', 'Cash Flow', 
      'Savings Rate %', 'Is Retired'
    ];

    const rows = projections.map(p => [
      p.year,
      p.age,
      p.startingNetWorth.toFixed(2),
      p.contributions.total.toFixed(2),
      p.growth.total.toFixed(2),
      p.expenses.total.toFixed(2),
      p.endingNetWorth.toFixed(2),
      p.fireProgress.toFixed(1),
      p.cashFlow.toFixed(2),
      (p.savingsRate * 100).toFixed(1),
      p.isRetired ? 'Yes' : 'No'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Export to Excel format (simplified)
   */
  private exportToExcel(
    projections: YearlyProjection[],
    summary: ProjectionSummary,
    options: ExportOptions
  ): string {
    // In a real implementation, this would generate an actual Excel file
    // For now, return CSV format as a placeholder
    return this.exportToCSV(projections, summary, options);
  }

  /**
   * Export to PDF format (simplified)
   */
  private exportToPDF(
    projections: YearlyProjection[],
    summary: ProjectionSummary,
    options: ExportOptions
  ): string {
    // In a real implementation, this would generate an actual PDF
    // For now, return a formatted text representation
    const content = [
      'FIRE PROJECTION REPORT',
      '======================',
      '',
      `FIRE Year: ${summary.fireYear}`,
      `FIRE Age: ${summary.fireAge}`,
      `Total Contributions: $${summary.totalContributions.toLocaleString()}`,
      `Total Growth: $${summary.totalGrowth.toLocaleString()}`,
      `Final Net Worth: $${summary.finalNetWorth.toLocaleString()}`,
      '',
      'YEARLY BREAKDOWN:',
      '================',
      ...projections.map(p => 
        `Year ${p.year} (Age ${p.age}): Net Worth $${p.endingNetWorth.toLocaleString()} | FIRE Progress: ${p.fireProgress.toFixed(1)}%`
      )
    ].join('\n');

    return content;
  }
}

export const yearlyProjectionsService = YearlyProjectionsService.getInstance();
