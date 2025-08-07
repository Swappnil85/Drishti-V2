/**
 * EnhancedGoalCreationService
 * Advanced goal creation features including import, multi-currency, sharing, and automation
 * Epic 8, Enhanced Acceptance Criteria for Goal Creation
 */

import { FinancialGoal, FIREGoalMetadata, CreateFIREGoalDto } from '@drishti/shared/types/financial';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface GoalImportData {
  source: 'spreadsheet' | 'mint' | 'personal_capital' | 'ynab' | 'quicken' | 'csv';
  data: {
    goalName: string;
    targetAmount: number;
    currentAmount?: number;
    targetDate?: string;
    monthlyContribution?: number;
    notes?: string;
    categories?: string[];
  };
  confidence: number; // 0-100, how confident we are in the import
  warnings: string[];
}

export interface MultiCurrencyGoal {
  baseCurrency: string;
  targetCurrency: string;
  exchangeRate: number;
  lastUpdated: string;
  autoUpdate: boolean;
  hedgingStrategy?: 'none' | 'forward_contract' | 'currency_etf' | 'diversified';
}

export interface GoalSharingConfig {
  isShared: boolean;
  shareType: 'view_only' | 'collaborative' | 'accountability';
  partners: Array<{
    id: string;
    name: string;
    email: string;
    role: 'viewer' | 'contributor' | 'accountability_partner';
    permissions: {
      viewProgress: boolean;
      receiveUpdates: boolean;
      addComments: boolean;
      suggestAdjustments: boolean;
    };
  }>;
  privacySettings: {
    hideSpecificAmounts: boolean;
    showPercentageOnly: boolean;
    allowScreenshots: boolean;
  };
}

export interface LifeEventTrigger {
  eventType: 'promotion' | 'marriage' | 'child_birth' | 'home_purchase' | 'job_change' | 'inheritance' | 'retirement';
  probability: number; // 0-1
  timeframe: string; // e.g., "6-12 months"
  suggestedGoalAdjustments: {
    targetAmountChange?: number;
    timelineChange?: number; // months
    savingsRateChange?: number;
    reasoning: string;
  };
  preparationSteps: string[];
}

export interface AutomatedGoalCreation {
  trigger: LifeEventTrigger;
  suggestedGoal: CreateFIREGoalDto;
  confidence: number;
  reasoning: string;
  alternatives: CreateFIREGoalDto[];
}

export class EnhancedGoalCreationService {
  private static instance: EnhancedGoalCreationService;
  private readonly IMPORT_STORAGE_KEY = 'goal_import_history';
  private readonly SHARING_STORAGE_KEY = 'goal_sharing_configs';
  private readonly CURRENCY_RATES_KEY = 'currency_exchange_rates';

  private constructor() {}

  public static getInstance(): EnhancedGoalCreationService {
    if (!EnhancedGoalCreationService.instance) {
      EnhancedGoalCreationService.instance = new EnhancedGoalCreationService();
    }
    return EnhancedGoalCreationService.instance;
  }

  /**
   * Import goal from external financial planning tools
   */
  public async importGoalFromSource(
    source: GoalImportData['source'],
    rawData: string | object
  ): Promise<GoalImportData> {
    const importData: GoalImportData = {
      source,
      data: {
        goalName: '',
        targetAmount: 0,
      },
      confidence: 0,
      warnings: [],
    };

    try {
      switch (source) {
        case 'spreadsheet':
          return this.parseSpreadsheetData(rawData as string, importData);
        case 'csv':
          return this.parseCsvData(rawData as string, importData);
        case 'mint':
          return this.parseMintData(rawData as object, importData);
        case 'personal_capital':
          return this.parsePersonalCapitalData(rawData as object, importData);
        case 'ynab':
          return this.parseYnabData(rawData as object, importData);
        case 'quicken':
          return this.parseQuickenData(rawData as object, importData);
        default:
          throw new Error(`Unsupported import source: ${source}`);
      }
    } catch (error) {
      importData.warnings.push(`Import failed: ${error.message}`);
      importData.confidence = 0;
      return importData;
    }
  }

  /**
   * Create multi-currency goal with exchange rate management
   */
  public async createMultiCurrencyGoal(
    goalData: CreateFIREGoalDto,
    currencyConfig: MultiCurrencyGoal
  ): Promise<{ goal: CreateFIREGoalDto; currencyConfig: MultiCurrencyGoal }> {
    // Update exchange rate if needed
    if (currencyConfig.autoUpdate) {
      const latestRate = await this.getLatestExchangeRate(
        currencyConfig.baseCurrency,
        currencyConfig.targetCurrency
      );
      currencyConfig.exchangeRate = latestRate;
      currencyConfig.lastUpdated = new Date().toISOString();
    }

    // Convert amounts to base currency
    const convertedGoal: CreateFIREGoalDto = {
      ...goalData,
      target_amount: goalData.target_amount * currencyConfig.exchangeRate,
      current_amount: (goalData.current_amount || 0) * currencyConfig.exchangeRate,
      metadata: {
        ...goalData.metadata,
        multiCurrency: currencyConfig,
        originalTargetAmount: goalData.target_amount,
        originalCurrentAmount: goalData.current_amount,
      },
    };

    // Store currency configuration
    await this.storeCurrencyConfig(goalData.name, currencyConfig);

    return { goal: convertedGoal, currencyConfig };
  }

  /**
   * Setup goal sharing with accountability partners
   */
  public async setupGoalSharing(
    goalId: string,
    sharingConfig: GoalSharingConfig
  ): Promise<boolean> {
    try {
      // Validate sharing configuration
      this.validateSharingConfig(sharingConfig);

      // Store sharing configuration
      const existingConfigs = await this.getSharingConfigs();
      existingConfigs[goalId] = sharingConfig;
      
      await AsyncStorage.setItem(
        this.SHARING_STORAGE_KEY,
        JSON.stringify(existingConfigs)
      );

      // In a real implementation, this would:
      // 1. Send invitations to partners
      // 2. Set up notification preferences
      // 3. Create shared access tokens
      // 4. Configure privacy settings

      return true;
    } catch (error) {
      console.error('Failed to setup goal sharing:', error);
      return false;
    }
  }

  /**
   * Analyze life events and suggest automated goal creation
   */
  public async analyzeLifeEventsForGoalCreation(
    userProfile: {
      age: number;
      income: number;
      maritalStatus: 'single' | 'married' | 'divorced';
      dependents: number;
      jobSecurity: 'low' | 'medium' | 'high';
      careerStage: 'early' | 'mid' | 'senior' | 'executive';
      recentEvents: string[];
    }
  ): Promise<AutomatedGoalCreation[]> {
    const suggestions: AutomatedGoalCreation[] = [];

    // Analyze promotion potential
    if (userProfile.careerStage !== 'executive' && userProfile.jobSecurity !== 'low') {
      const promotionTrigger: LifeEventTrigger = {
        eventType: 'promotion',
        probability: this.calculatePromotionProbability(userProfile),
        timeframe: '12-18 months',
        suggestedGoalAdjustments: {
          targetAmountChange: userProfile.income * 0.2, // 20% income increase
          savingsRateChange: 0.05, // Increase savings rate by 5%
          reasoning: 'Career advancement typically increases earning potential',
        },
        preparationSteps: [
          'Document current achievements',
          'Identify skill development opportunities',
          'Build relationships with decision makers',
        ],
      };

      suggestions.push(this.createGoalSuggestionFromTrigger(promotionTrigger, userProfile));
    }

    // Analyze family expansion potential
    if (userProfile.age < 40 && userProfile.dependents === 0) {
      const familyTrigger: LifeEventTrigger = {
        eventType: 'child_birth',
        probability: userProfile.maritalStatus === 'married' ? 0.6 : 0.3,
        timeframe: '2-5 years',
        suggestedGoalAdjustments: {
          targetAmountChange: 250000, // Additional for child expenses
          timelineChange: 24, // Extend timeline by 2 years
          reasoning: 'Children significantly impact expenses and savings capacity',
        },
        preparationSteps: [
          'Research childcare costs in your area',
          'Consider 529 education savings plan',
          'Review health insurance coverage',
          'Build larger emergency fund',
        ],
      };

      suggestions.push(this.createGoalSuggestionFromTrigger(familyTrigger, userProfile));
    }

    // Analyze home purchase potential
    if (userProfile.recentEvents.includes('renting') && userProfile.income > 50000) {
      const homeTrigger: LifeEventTrigger = {
        eventType: 'home_purchase',
        probability: 0.4,
        timeframe: '1-3 years',
        suggestedGoalAdjustments: {
          targetAmountChange: -50000, // Down payment reduces liquid savings
          timelineChange: 12, // May extend FIRE timeline
          reasoning: 'Home ownership changes cash flow and asset allocation',
        },
        preparationSteps: [
          'Save for down payment separately',
          'Research total cost of ownership',
          'Consider impact on FIRE timeline',
          'Evaluate rent vs buy in your market',
        ],
      };

      suggestions.push(this.createGoalSuggestionFromTrigger(homeTrigger, userProfile));
    }

    return suggestions.filter(s => s.confidence > 60); // Only return high-confidence suggestions
  }

  /**
   * Integrate with debt payoff goal creation
   */
  public async integrateDebtPayoffGoal(
    fireGoal: CreateFIREGoalDto,
    debtInfo: {
      totalDebt: number;
      monthlyPayment: number;
      averageInterestRate: number;
      payoffTimeline: number; // months
    }
  ): Promise<CreateFIREGoalDto> {
    // Calculate debt payoff impact on FIRE goal
    const debtPayoffImpact = {
      timelineExtension: Math.ceil(debtInfo.payoffTimeline / 12), // years
      reducedSavingsCapacity: debtInfo.monthlyPayment,
      interestSavings: debtInfo.totalDebt * (debtInfo.averageInterestRate / 100),
    };

    // Adjust FIRE goal based on debt situation
    const adjustedGoal: CreateFIREGoalDto = {
      ...fireGoal,
      metadata: {
        ...fireGoal.metadata,
        debtIntegration: {
          hasDebt: true,
          totalDebt: debtInfo.totalDebt,
          payoffStrategy: 'debt_first', // or 'balanced' or 'fire_first'
          estimatedPayoffDate: new Date(Date.now() + debtInfo.payoffTimeline * 30 * 24 * 60 * 60 * 1000).toISOString(),
          impactAnalysis: debtPayoffImpact,
        },
        adjustedForDebt: true,
        originalTargetDate: fireGoal.target_date,
      },
    };

    // Extend target date to account for debt payoff
    if (fireGoal.target_date) {
      const originalDate = new Date(fireGoal.target_date);
      originalDate.setFullYear(originalDate.getFullYear() + debtPayoffImpact.timelineExtension);
      adjustedGoal.target_date = originalDate.toISOString();
    }

    return adjustedGoal;
  }

  // Private helper methods

  private parseSpreadsheetData(data: string, importData: GoalImportData): GoalImportData {
    // Simplified spreadsheet parsing - would be more sophisticated in real implementation
    const lines = data.split('\n');
    const headers = lines[0]?.toLowerCase().split(',') || [];
    
    if (lines.length < 2) {
      importData.warnings.push('Spreadsheet appears to be empty');
      return importData;
    }

    const values = lines[1].split(',');
    
    // Try to identify common column patterns
    const goalNameIndex = headers.findIndex(h => h.includes('goal') || h.includes('name'));
    const targetIndex = headers.findIndex(h => h.includes('target') || h.includes('amount'));
    const currentIndex = headers.findIndex(h => h.includes('current') || h.includes('balance'));

    if (goalNameIndex >= 0 && values[goalNameIndex]) {
      importData.data.goalName = values[goalNameIndex].trim();
      importData.confidence += 30;
    }

    if (targetIndex >= 0 && values[targetIndex]) {
      const targetAmount = parseFloat(values[targetIndex].replace(/[,$]/g, ''));
      if (!isNaN(targetAmount)) {
        importData.data.targetAmount = targetAmount;
        importData.confidence += 40;
      }
    }

    if (currentIndex >= 0 && values[currentIndex]) {
      const currentAmount = parseFloat(values[currentIndex].replace(/[,$]/g, ''));
      if (!isNaN(currentAmount)) {
        importData.data.currentAmount = currentAmount;
        importData.confidence += 20;
      }
    }

    if (importData.confidence < 50) {
      importData.warnings.push('Could not identify all required fields in spreadsheet');
    }

    return importData;
  }

  private parseCsvData(data: string, importData: GoalImportData): GoalImportData {
    // CSV parsing is similar to spreadsheet but with more flexible format detection
    return this.parseSpreadsheetData(data, importData);
  }

  private parseMintData(data: object, importData: GoalImportData): GoalImportData {
    // Mint-specific parsing logic
    importData.confidence = 70; // Mint has structured data
    importData.data.goalName = 'Imported from Mint';
    return importData;
  }

  private parsePersonalCapitalData(data: object, importData: GoalImportData): GoalImportData {
    // Personal Capital-specific parsing logic
    importData.confidence = 75;
    importData.data.goalName = 'Imported from Personal Capital';
    return importData;
  }

  private parseYnabData(data: object, importData: GoalImportData): GoalImportData {
    // YNAB-specific parsing logic
    importData.confidence = 80;
    importData.data.goalName = 'Imported from YNAB';
    return importData;
  }

  private parseQuickenData(data: object, importData: GoalImportData): GoalImportData {
    // Quicken-specific parsing logic
    importData.confidence = 65;
    importData.data.goalName = 'Imported from Quicken';
    return importData;
  }

  private async getLatestExchangeRate(baseCurrency: string, targetCurrency: string): Promise<number> {
    // In real implementation, would call currency API
    // For now, return mock rate
    const mockRates: Record<string, number> = {
      'USD-EUR': 0.85,
      'USD-GBP': 0.73,
      'USD-CAD': 1.25,
      'USD-AUD': 1.35,
      'EUR-USD': 1.18,
      'GBP-USD': 1.37,
    };

    const rateKey = `${baseCurrency}-${targetCurrency}`;
    return mockRates[rateKey] || 1.0;
  }

  private async storeCurrencyConfig(goalName: string, config: MultiCurrencyGoal): Promise<void> {
    try {
      const existingRates = await AsyncStorage.getItem(this.CURRENCY_RATES_KEY);
      const rates = existingRates ? JSON.parse(existingRates) : {};
      
      rates[goalName] = config;
      await AsyncStorage.setItem(this.CURRENCY_RATES_KEY, JSON.stringify(rates));
    } catch (error) {
      console.error('Failed to store currency config:', error);
    }
  }

  private validateSharingConfig(config: GoalSharingConfig): void {
    if (config.isShared && config.partners.length === 0) {
      throw new Error('Shared goals must have at least one partner');
    }

    for (const partner of config.partners) {
      if (!partner.email || !partner.name) {
        throw new Error('All partners must have name and email');
      }
    }
  }

  private async getSharingConfigs(): Promise<Record<string, GoalSharingConfig>> {
    try {
      const data = await AsyncStorage.getItem(this.SHARING_STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to get sharing configs:', error);
      return {};
    }
  }

  private calculatePromotionProbability(userProfile: any): number {
    let probability = 0.3; // Base 30% chance

    // Adjust based on career stage
    if (userProfile.careerStage === 'early') probability += 0.2;
    if (userProfile.careerStage === 'mid') probability += 0.1;

    // Adjust based on job security
    if (userProfile.jobSecurity === 'high') probability += 0.15;
    if (userProfile.jobSecurity === 'low') probability -= 0.1;

    // Adjust based on age (peak promotion years)
    if (userProfile.age >= 28 && userProfile.age <= 45) probability += 0.1;

    return Math.min(0.8, Math.max(0.1, probability));
  }

  private createGoalSuggestionFromTrigger(
    trigger: LifeEventTrigger,
    userProfile: any
  ): AutomatedGoalCreation {
    const baseGoal: CreateFIREGoalDto = {
      name: `FIRE Goal (${trigger.eventType} adjusted)`,
      goal_type: 'fire_traditional',
      target_amount: 1000000 + (trigger.suggestedGoalAdjustments.targetAmountChange || 0),
      current_amount: 0,
      priority: 1,
      description: `Automatically suggested goal based on predicted ${trigger.eventType}`,
      metadata: {
        fireType: 'fire_traditional',
        currentIncome: userProfile.income,
        currentSavingsRate: 0.2 + (trigger.suggestedGoalAdjustments.savingsRateChange || 0),
        monthlyExpenses: userProfile.income * 0.6,
        automatedCreation: true,
        lifEventTrigger: trigger,
      },
    };

    return {
      trigger,
      suggestedGoal: baseGoal,
      confidence: Math.round(trigger.probability * 100),
      reasoning: trigger.suggestedGoalAdjustments.reasoning,
      alternatives: [], // Would generate alternative scenarios
    };
  }
}
