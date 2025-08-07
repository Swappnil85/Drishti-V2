/**
 * Real-Time Calculation Service
 * Epic 9, Story 1: Real-time calculation updates as variables change
 * Provides instant feedback on scenario assumptions
 */

import { ScenarioAssumptions } from '@drishti/shared/types/financial';

export interface RealTimeProjections {
  fireDate: Date;
  yearsToFire: number;
  monthlyRequiredSavings: number;
  finalNetWorth: number;
  fireNumber: number;
  realReturn: number;
  successProbability: number;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  keyInsights: string[];
  warnings: string[];
}

export interface ProjectionInputs {
  currentAge: number;
  currentNetWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  assumptions: ScenarioAssumptions;
}

/**
 * Real-Time Calculation Service
 */
export class RealTimeCalculationService {
  private static instance: RealTimeCalculationService;

  private constructor() {}

  public static getInstance(): RealTimeCalculationService {
    if (!RealTimeCalculationService.instance) {
      RealTimeCalculationService.instance = new RealTimeCalculationService();
    }
    return RealTimeCalculationService.instance;
  }

  /**
   * Calculate real-time projections based on current assumptions
   */
  public calculateProjections(inputs: ProjectionInputs): RealTimeProjections {
    const {
      currentAge,
      currentNetWorth,
      monthlyIncome,
      monthlyExpenses,
      assumptions,
    } = inputs;

    // Basic calculations
    const annualExpenses = monthlyExpenses * 12;
    const fireNumber = annualExpenses * 25; // 4% rule
    const realReturn = assumptions.market_return - assumptions.inflation_rate;
    const monthlySavings = monthlyIncome * assumptions.savings_rate;
    const annualSavings = monthlySavings * 12;

    // Calculate years to FIRE
    const yearsToFire = this.calculateYearsToFire(
      currentNetWorth,
      fireNumber,
      annualSavings,
      assumptions.market_return
    );

    // Calculate fire date
    const fireDate = new Date();
    fireDate.setFullYear(fireDate.getFullYear() + Math.ceil(yearsToFire));

    // Calculate monthly required savings if different from current
    const monthlyRequiredSavings = this.calculateRequiredMonthlySavings(
      currentNetWorth,
      fireNumber,
      yearsToFire,
      assumptions.market_return
    );

    // Calculate final net worth at life expectancy
    const yearsInRetirement = assumptions.life_expectancy - assumptions.retirement_age;
    const finalNetWorth = this.calculateFinalNetWorth(
      fireNumber,
      yearsInRetirement,
      realReturn,
      annualExpenses,
      assumptions.inflation_rate
    );

    // Calculate success probability
    const successProbability = this.calculateSuccessProbability(
      assumptions,
      yearsToFire,
      yearsInRetirement
    );

    // Determine risk level
    const riskLevel = this.determineRiskLevel(assumptions, successProbability);

    // Generate insights and warnings
    const keyInsights = this.generateKeyInsights(inputs, {
      yearsToFire,
      fireNumber,
      realReturn,
      successProbability,
    });

    const warnings = this.generateWarnings(inputs, {
      yearsToFire,
      successProbability,
      riskLevel,
    });

    return {
      fireDate,
      yearsToFire,
      monthlyRequiredSavings,
      finalNetWorth,
      fireNumber,
      realReturn,
      successProbability,
      riskLevel,
      keyInsights,
      warnings,
    };
  }

  /**
   * Calculate years to FIRE using compound interest formula
   */
  private calculateYearsToFire(
    currentNetWorth: number,
    targetAmount: number,
    annualSavings: number,
    annualReturn: number
  ): number {
    if (annualSavings <= 0) {
      return Infinity;
    }

    if (currentNetWorth >= targetAmount) {
      return 0;
    }

    const monthlyReturn = annualReturn / 12;
    const monthlySavings = annualSavings / 12;
    const targetNet = targetAmount - currentNetWorth;

    if (monthlyReturn === 0) {
      return targetNet / annualSavings;
    }

    // Using future value of annuity formula
    const months = Math.log(
      1 + (targetNet * monthlyReturn) / monthlySavings
    ) / Math.log(1 + monthlyReturn);

    return Math.max(0, months / 12);
  }

  /**
   * Calculate required monthly savings to reach FIRE in target years
   */
  private calculateRequiredMonthlySavings(
    currentNetWorth: number,
    targetAmount: number,
    targetYears: number,
    annualReturn: number
  ): number {
    if (targetYears <= 0 || currentNetWorth >= targetAmount) {
      return 0;
    }

    const monthlyReturn = annualReturn / 12;
    const months = targetYears * 12;
    const targetNet = targetAmount - currentNetWorth;

    if (monthlyReturn === 0) {
      return targetNet / months;
    }

    // Using present value of annuity formula
    const requiredMonthlySavings =
      (targetNet * monthlyReturn) /
      (Math.pow(1 + monthlyReturn, months) - 1);

    return Math.max(0, requiredMonthlySavings);
  }

  /**
   * Calculate final net worth at life expectancy
   */
  private calculateFinalNetWorth(
    startingAmount: number,
    yearsInRetirement: number,
    realReturn: number,
    annualExpenses: number,
    inflationRate: number
  ): number {
    let netWorth = startingAmount;
    let currentExpenses = annualExpenses;

    for (let year = 0; year < yearsInRetirement; year++) {
      // Grow investments
      netWorth *= (1 + realReturn);
      
      // Subtract inflation-adjusted expenses
      netWorth -= currentExpenses;
      
      // Increase expenses by inflation
      currentExpenses *= (1 + inflationRate);
    }

    return Math.max(0, netWorth);
  }

  /**
   * Calculate success probability based on historical data and assumptions
   */
  private calculateSuccessProbability(
    assumptions: ScenarioAssumptions,
    yearsToFire: number,
    yearsInRetirement: number
  ): number {
    let probability = 0.85; // Base probability

    // Adjust for market return assumptions
    if (assumptions.market_return > 0.12) {
      probability -= 0.15; // Very optimistic
    } else if (assumptions.market_return > 0.10) {
      probability -= 0.05; // Optimistic
    } else if (assumptions.market_return < 0.05) {
      probability -= 0.10; // Very conservative
    }

    // Adjust for savings rate
    if (assumptions.savings_rate > 0.5) {
      probability += 0.10; // High savings rate
    } else if (assumptions.savings_rate < 0.15) {
      probability -= 0.15; // Low savings rate
    }

    // Adjust for time horizon
    if (yearsToFire > 30) {
      probability -= 0.10; // Very long timeline
    } else if (yearsToFire < 10) {
      probability -= 0.05; // Short timeline
    }

    // Adjust for retirement length
    if (yearsInRetirement > 40) {
      probability -= 0.10; // Very long retirement
    }

    // Adjust for inflation assumptions
    if (assumptions.inflation_rate > 0.06) {
      probability -= 0.10; // High inflation
    }

    return Math.max(0.1, Math.min(0.95, probability));
  }

  /**
   * Determine risk level based on assumptions and probability
   */
  private determineRiskLevel(
    assumptions: ScenarioAssumptions,
    successProbability: number
  ): 'low' | 'medium' | 'high' | 'extreme' {
    if (successProbability < 0.5) return 'extreme';
    if (successProbability < 0.7) return 'high';
    if (successProbability < 0.85) return 'medium';
    return 'low';
  }

  /**
   * Generate key insights based on calculations
   */
  private generateKeyInsights(
    inputs: ProjectionInputs,
    results: {
      yearsToFire: number;
      fireNumber: number;
      realReturn: number;
      successProbability: number;
    }
  ): string[] {
    const insights: string[] = [];
    const { assumptions } = inputs;
    const { yearsToFire, fireNumber, realReturn, successProbability } = results;

    // Time to FIRE insight
    if (yearsToFire < 10) {
      insights.push(`🚀 Fast track to FIRE in ${Math.ceil(yearsToFire)} years!`);
    } else if (yearsToFire < 20) {
      insights.push(`⏰ Moderate timeline: ${Math.ceil(yearsToFire)} years to FIRE`);
    } else {
      insights.push(`🐌 Long journey: ${Math.ceil(yearsToFire)} years to FIRE`);
    }

    // Savings rate insight
    if (assumptions.savings_rate > 0.5) {
      insights.push(`💪 Excellent savings rate of ${(assumptions.savings_rate * 100).toFixed(0)}%`);
    } else if (assumptions.savings_rate > 0.25) {
      insights.push(`👍 Good savings rate of ${(assumptions.savings_rate * 100).toFixed(0)}%`);
    } else {
      insights.push(`📈 Consider increasing savings rate from ${(assumptions.savings_rate * 100).toFixed(0)}%`);
    }

    // Real return insight
    if (realReturn > 0.05) {
      insights.push(`📊 Strong real return of ${(realReturn * 100).toFixed(1)}% after inflation`);
    } else if (realReturn > 0.02) {
      insights.push(`📊 Moderate real return of ${(realReturn * 100).toFixed(1)}% after inflation`);
    } else {
      insights.push(`⚠️ Low real return of ${(realReturn * 100).toFixed(1)}% may slow progress`);
    }

    // Success probability insight
    if (successProbability > 0.85) {
      insights.push(`✅ High success probability: ${(successProbability * 100).toFixed(0)}%`);
    } else if (successProbability > 0.70) {
      insights.push(`⚖️ Moderate success probability: ${(successProbability * 100).toFixed(0)}%`);
    } else {
      insights.push(`⚠️ Lower success probability: ${(successProbability * 100).toFixed(0)}%`);
    }

    return insights;
  }

  /**
   * Generate warnings based on calculations
   */
  private generateWarnings(
    inputs: ProjectionInputs,
    results: {
      yearsToFire: number;
      successProbability: number;
      riskLevel: 'low' | 'medium' | 'high' | 'extreme';
    }
  ): string[] {
    const warnings: string[] = [];
    const { assumptions } = inputs;
    const { yearsToFire, successProbability, riskLevel } = results;

    // Risk level warnings
    if (riskLevel === 'extreme') {
      warnings.push('🚨 Extreme risk: Consider adjusting assumptions');
    } else if (riskLevel === 'high') {
      warnings.push('⚠️ High risk: Plan may need significant adjustments');
    }

    // Timeline warnings
    if (yearsToFire > 40) {
      warnings.push('⏳ Very long timeline: Consider increasing savings or returns');
    }

    // Assumption warnings
    if (assumptions.market_return > 0.12) {
      warnings.push('📈 Very high return assumption may be unrealistic');
    }

    if (assumptions.savings_rate > 0.70) {
      warnings.push('💰 Very high savings rate: Ensure this is sustainable');
    }

    if (assumptions.inflation_rate > 0.06) {
      warnings.push('📊 High inflation assumption will significantly impact purchasing power');
    }

    // Success probability warnings
    if (successProbability < 0.60) {
      warnings.push('🎯 Low success probability: Consider more conservative assumptions');
    }

    return warnings;
  }
}

export const realTimeCalculationService = RealTimeCalculationService.getInstance();
