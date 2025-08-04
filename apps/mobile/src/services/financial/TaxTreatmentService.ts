/**
 * TaxTreatmentService
 * Service for managing tax treatment calculations, contribution limits, and tax optimization
 */

import type { TaxTreatment, AccountType } from '@drishti/shared/types/financial';

export interface ContributionLimits {
  annual: number;
  catchUp?: number; // For age 50+
  employer?: number; // For employer-sponsored plans
  combined?: number; // For combined employee + employer
}

export interface TaxTreatmentInfo {
  treatment: TaxTreatment;
  name: string;
  description: string;
  contributionLimits: ContributionLimits;
  taxDeductible: boolean;
  taxFreeGrowth: boolean;
  taxFreeWithdrawals: boolean;
  earlyWithdrawalPenalty: number; // Percentage
  requiredMinimumDistribution: boolean;
  rmdAge: number;
  applicableAccountTypes: AccountType[];
}

export interface RegionalTaxInfo {
  country: string;
  state?: string;
  province?: string;
  additionalTreatments: TaxTreatment[];
  contributionLimitAdjustments: Record<TaxTreatment, Partial<ContributionLimits>>;
}

export interface TaxImpactCalculation {
  withdrawalAmount: number;
  currentAge: number;
  accountBalance: number;
  taxTreatment: TaxTreatment;
  earlyWithdrawalPenalty: number;
  estimatedTaxes: number;
  netAmount: number;
  recommendations: string[];
}

export interface ContributionAlert {
  treatment: TaxTreatment;
  currentContributions: number;
  limit: number;
  remainingCapacity: number;
  percentageUsed: number;
  alertType: 'approaching_limit' | 'at_limit' | 'over_limit' | 'catch_up_eligible';
  message: string;
}

class TaxTreatmentService {
  // 2024 contribution limits (updated annually)
  private readonly TAX_TREATMENT_INFO: Record<TaxTreatment, TaxTreatmentInfo> = {
    taxable: {
      treatment: 'taxable',
      name: 'Taxable Account',
      description: 'Regular taxable account with no contribution limits',
      contributionLimits: { annual: Infinity },
      taxDeductible: false,
      taxFreeGrowth: false,
      taxFreeWithdrawals: false,
      earlyWithdrawalPenalty: 0,
      requiredMinimumDistribution: false,
      rmdAge: 0,
      applicableAccountTypes: ['checking', 'savings', 'investment', 'credit', 'loan', 'other'],
    },
    traditional_ira: {
      treatment: 'traditional_ira',
      name: 'Traditional IRA',
      description: 'Tax-deferred individual retirement account',
      contributionLimits: { annual: 7000, catchUp: 1000 },
      taxDeductible: true,
      taxFreeGrowth: true,
      taxFreeWithdrawals: false,
      earlyWithdrawalPenalty: 10,
      requiredMinimumDistribution: true,
      rmdAge: 73,
      applicableAccountTypes: ['retirement', 'investment'],
    },
    roth_ira: {
      treatment: 'roth_ira',
      name: 'Roth IRA',
      description: 'After-tax individual retirement account',
      contributionLimits: { annual: 7000, catchUp: 1000 },
      taxDeductible: false,
      taxFreeGrowth: true,
      taxFreeWithdrawals: true,
      earlyWithdrawalPenalty: 10, // On earnings only
      requiredMinimumDistribution: false,
      rmdAge: 0,
      applicableAccountTypes: ['retirement', 'investment'],
    },
    traditional_401k: {
      treatment: 'traditional_401k',
      name: 'Traditional 401(k)',
      description: 'Employer-sponsored pre-tax retirement plan',
      contributionLimits: { annual: 23000, catchUp: 7500, employer: 69000, combined: 69000 },
      taxDeductible: true,
      taxFreeGrowth: true,
      taxFreeWithdrawals: false,
      earlyWithdrawalPenalty: 10,
      requiredMinimumDistribution: true,
      rmdAge: 73,
      applicableAccountTypes: ['retirement'],
    },
    roth_401k: {
      treatment: 'roth_401k',
      name: 'Roth 401(k)',
      description: 'Employer-sponsored after-tax retirement plan',
      contributionLimits: { annual: 23000, catchUp: 7500, employer: 69000, combined: 69000 },
      taxDeductible: false,
      taxFreeGrowth: true,
      taxFreeWithdrawals: true,
      earlyWithdrawalPenalty: 10,
      requiredMinimumDistribution: true,
      rmdAge: 73,
      applicableAccountTypes: ['retirement'],
    },
    hsa: {
      treatment: 'hsa',
      name: 'Health Savings Account',
      description: 'Triple tax-advantaged health savings account',
      contributionLimits: { annual: 4300, catchUp: 1000 }, // Individual coverage
      taxDeductible: true,
      taxFreeGrowth: true,
      taxFreeWithdrawals: true, // For qualified medical expenses
      earlyWithdrawalPenalty: 20, // For non-medical expenses
      requiredMinimumDistribution: false,
      rmdAge: 0,
      applicableAccountTypes: ['savings', 'investment'],
    },
    sep_ira: {
      treatment: 'sep_ira',
      name: 'SEP-IRA',
      description: 'Simplified Employee Pension for self-employed',
      contributionLimits: { annual: 69000 }, // 25% of compensation or $69k, whichever is less
      taxDeductible: true,
      taxFreeGrowth: true,
      taxFreeWithdrawals: false,
      earlyWithdrawalPenalty: 10,
      requiredMinimumDistribution: true,
      rmdAge: 73,
      applicableAccountTypes: ['retirement', 'investment'],
    },
    simple_ira: {
      treatment: 'simple_ira',
      name: 'SIMPLE IRA',
      description: 'Savings Incentive Match Plan for small businesses',
      contributionLimits: { annual: 16000, catchUp: 3500, employer: 19500 },
      taxDeductible: true,
      taxFreeGrowth: true,
      taxFreeWithdrawals: false,
      earlyWithdrawalPenalty: 25, // First 2 years, then 10%
      requiredMinimumDistribution: true,
      rmdAge: 73,
      applicableAccountTypes: ['retirement'],
    },
    other_tax_advantaged: {
      treatment: 'other_tax_advantaged',
      name: 'Other Tax-Advantaged',
      description: 'Other types of tax-advantaged accounts',
      contributionLimits: { annual: 0 }, // Varies by account type
      taxDeductible: false,
      taxFreeGrowth: false,
      taxFreeWithdrawals: false,
      earlyWithdrawalPenalty: 0,
      requiredMinimumDistribution: false,
      rmdAge: 0,
      applicableAccountTypes: ['savings', 'investment', 'retirement', 'other'],
    },
  };

  /**
   * Get tax treatment information
   */
  getTaxTreatmentInfo(treatment: TaxTreatment): TaxTreatmentInfo {
    return this.TAX_TREATMENT_INFO[treatment];
  }

  /**
   * Get all available tax treatments for an account type
   */
  getAvailableTreatments(accountType: AccountType): TaxTreatmentInfo[] {
    return Object.values(this.TAX_TREATMENT_INFO).filter(info =>
      info.applicableAccountTypes.includes(accountType)
    );
  }

  /**
   * Calculate contribution limits for a given age and treatment
   */
  calculateContributionLimits(
    treatment: TaxTreatment,
    age: number,
    income?: number
  ): ContributionLimits {
    const info = this.TAX_TREATMENT_INFO[treatment];
    const limits = { ...info.contributionLimits };

    // Add catch-up contributions for age 50+
    if (age >= 50 && limits.catchUp) {
      limits.annual += limits.catchUp;
    }

    // Apply income-based phase-outs for Roth IRA
    if (treatment === 'roth_ira' && income) {
      const phaseOutStart = 138000; // 2024 single filer
      const phaseOutEnd = 153000;
      
      if (income > phaseOutStart) {
        const reduction = Math.min(1, (income - phaseOutStart) / (phaseOutEnd - phaseOutStart));
        limits.annual = Math.max(0, limits.annual * (1 - reduction));
      }
    }

    return limits;
  }

  /**
   * Calculate tax impact of early withdrawal
   */
  calculateTaxImpact(
    withdrawalAmount: number,
    currentAge: number,
    accountBalance: number,
    treatment: TaxTreatment,
    taxBracket: number = 0.22 // Default 22% tax bracket
  ): TaxImpactCalculation {
    const info = this.TAX_TREATMENT_INFO[treatment];
    let earlyWithdrawalPenalty = 0;
    let estimatedTaxes = 0;
    const recommendations: string[] = [];

    // Calculate early withdrawal penalty
    if (currentAge < 59.5 && info.earlyWithdrawalPenalty > 0) {
      earlyWithdrawalPenalty = withdrawalAmount * (info.earlyWithdrawalPenalty / 100);
      recommendations.push(
        `Early withdrawal penalty of ${info.earlyWithdrawalPenalty}% applies before age 59½`
      );
    }

    // Calculate taxes based on treatment type
    if (!info.taxFreeWithdrawals) {
      estimatedTaxes = withdrawalAmount * taxBracket;
      recommendations.push(
        `Withdrawal will be taxed as ordinary income at your current tax rate`
      );
    }

    // Special cases
    if (treatment === 'roth_ira' && currentAge < 59.5) {
      // Roth IRA: contributions can be withdrawn penalty-free
      recommendations.push(
        'Consider withdrawing contributions first to avoid penalties on earnings'
      );
    }

    if (treatment === 'hsa' && currentAge < 65) {
      recommendations.push(
        'Consider using HSA funds for qualified medical expenses to avoid penalties'
      );
    }

    const netAmount = withdrawalAmount - earlyWithdrawalPenalty - estimatedTaxes;

    return {
      withdrawalAmount,
      currentAge,
      accountBalance,
      taxTreatment: treatment,
      earlyWithdrawalPenalty,
      estimatedTaxes,
      netAmount,
      recommendations,
    };
  }

  /**
   * Check contribution limits and generate alerts
   */
  checkContributionLimits(
    treatment: TaxTreatment,
    currentContributions: number,
    age: number,
    income?: number
  ): ContributionAlert {
    const limits = this.calculateContributionLimits(treatment, age, income);
    const limit = limits.annual;
    const remainingCapacity = Math.max(0, limit - currentContributions);
    const percentageUsed = (currentContributions / limit) * 100;

    let alertType: ContributionAlert['alertType'];
    let message: string;

    if (currentContributions > limit) {
      alertType = 'over_limit';
      message = `You've exceeded the annual contribution limit by $${(currentContributions - limit).toLocaleString()}`;
    } else if (percentageUsed >= 100) {
      alertType = 'at_limit';
      message = `You've reached the annual contribution limit of $${limit.toLocaleString()}`;
    } else if (percentageUsed >= 80) {
      alertType = 'approaching_limit';
      message = `You're approaching the contribution limit. $${remainingCapacity.toLocaleString()} remaining`;
    } else if (age >= 50 && limits.catchUp) {
      alertType = 'catch_up_eligible';
      message = `You're eligible for catch-up contributions of $${limits.catchUp.toLocaleString()}`;
    } else {
      alertType = 'approaching_limit';
      message = `$${remainingCapacity.toLocaleString()} remaining of $${limit.toLocaleString()} annual limit`;
    }

    return {
      treatment,
      currentContributions,
      limit,
      remainingCapacity,
      percentageUsed,
      alertType,
      message,
    };
  }

  /**
   * Get asset allocation suggestions based on tax treatment
   */
  getAssetAllocationSuggestions(treatment: TaxTreatment): {
    preferredAssets: string[];
    avoidAssets: string[];
    reasoning: string;
  } {
    const info = this.TAX_TREATMENT_INFO[treatment];

    if (info.taxFreeGrowth && info.taxFreeWithdrawals) {
      // Roth accounts - prefer high-growth assets
      return {
        preferredAssets: ['Growth stocks', 'Small-cap funds', 'International stocks', 'REITs'],
        avoidAssets: ['Bonds', 'Dividend stocks', 'Tax-efficient funds'],
        reasoning: 'Tax-free growth makes high-growth assets ideal for Roth accounts',
      };
    }

    if (info.taxFreeGrowth && !info.taxFreeWithdrawals) {
      // Traditional retirement accounts - prefer tax-inefficient assets
      return {
        preferredAssets: ['Bonds', 'REITs', 'High-dividend stocks', 'Actively managed funds'],
        avoidAssets: ['Tax-efficient index funds', 'Municipal bonds'],
        reasoning: 'Tax-deferred growth makes tax-inefficient assets suitable for traditional accounts',
      };
    }

    // Taxable accounts - prefer tax-efficient assets
    return {
      preferredAssets: ['Index funds', 'Tax-managed funds', 'Municipal bonds', 'Tax-efficient ETFs'],
      avoidAssets: ['High-turnover funds', 'REITs', 'High-dividend stocks'],
      reasoning: 'Tax-efficient investments minimize annual tax burden in taxable accounts',
    };
  }

  /**
   * Identify tax-loss harvesting opportunities
   */
  identifyTaxLossHarvestingOpportunities(
    holdings: Array<{
      symbol: string;
      costBasis: number;
      currentValue: number;
      quantity: number;
    }>
  ): Array<{
    symbol: string;
    unrealizedLoss: number;
    taxSavings: number;
    recommendation: string;
  }> {
    const opportunities = [];
    const taxRate = 0.20; // Long-term capital gains rate

    for (const holding of holdings) {
      const unrealizedLoss = holding.costBasis - holding.currentValue;
      
      if (unrealizedLoss > 0) {
        const taxSavings = unrealizedLoss * taxRate;
        
        opportunities.push({
          symbol: holding.symbol,
          unrealizedLoss,
          taxSavings,
          recommendation: `Consider harvesting $${unrealizedLoss.toLocaleString()} loss for $${taxSavings.toLocaleString()} tax savings`,
        });
      }
    }

    return opportunities.sort((a, b) => b.taxSavings - a.taxSavings);
  }
}

// Export singleton instance
export const taxTreatmentService = new TaxTreatmentService();
