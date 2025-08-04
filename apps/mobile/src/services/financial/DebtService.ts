/**
 * DebtService
 * Comprehensive service for debt tracking, payoff calculations, and management
 */

import { database } from '../../database';
import { Q } from '@nozbe/watermelondb';
import type FinancialAccount from '../../database/models/FinancialAccount';

export interface DebtAccount {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
  paymentDueDate?: Date;
  lastPaymentDate?: Date;
  accountType: 'credit' | 'loan';
  institution?: string;
  metadata: {
    creditLimit?: number;
    loanTerm?: number; // months
    originalBalance?: number;
    paymentFrequency?: 'monthly' | 'biweekly' | 'weekly';
    nextPaymentDue?: string;
    lastInterestAccrual?: string;
  };
}

export interface DebtSummary {
  totalDebt: number;
  totalMinimumPayments: number;
  averageInterestRate: number;
  debtAccounts: DebtAccount[];
  highestInterestRate: number;
  highestBalance: number;
  nextPaymentDue?: Date;
  monthlyInterestCost: number;
}

export interface PayoffStrategy {
  name: 'snowball' | 'avalanche';
  description: string;
  totalInterest: number;
  totalTime: number; // months
  monthlySavings: number;
  payoffOrder: Array<{
    accountId: string;
    accountName: string;
    order: number;
    payoffMonth: number;
    totalInterest: number;
  }>;
}

export interface DebtPayoffComparison {
  snowball: PayoffStrategy;
  avalanche: PayoffStrategy;
  extraPayment: number;
  recommendation: 'snowball' | 'avalanche';
  savings: {
    interestSaved: number;
    timeSaved: number; // months
  };
}

export interface InterestProjection {
  accountId: string;
  accountName: string;
  currentBalance: number;
  projections: Array<{
    month: number;
    balance: number;
    interestPaid: number;
    principalPaid: number;
    totalInterest: number;
  }>;
  totalInterestCost: number;
  payoffTime: number; // months
}

export interface DebtToIncomeRatio {
  monthlyDebtPayments: number;
  monthlyIncome: number;
  ratio: number;
  ratingCategory: 'excellent' | 'good' | 'fair' | 'poor' | 'dangerous';
  benchmark: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  recommendation: string;
}

export interface PaymentAllocation {
  accountId: string;
  accountName: string;
  minimumPayment: number;
  recommendedPayment: number;
  extraPayment: number;
  reasoning: string;
  impactOnPayoffTime: number; // months saved
  impactOnInterest: number; // interest saved
}

class DebtService {
  /**
   * Get all debt accounts for a user
   */
  async getDebtAccounts(userId: string): Promise<DebtAccount[]> {
    try {
      const accounts = await database
        .get('financial_accounts')
        .query(
          Q.where('user_id', userId),
          Q.where('is_active', true),
          Q.where('account_type', Q.oneOf(['credit', 'loan']))
        )
        .fetch() as FinancialAccount[];

      return accounts.map(account => this.mapToDebtAccount(account));
    } catch (error) {
      console.error('Error getting debt accounts:', error);
      return [];
    }
  }

  /**
   * Calculate comprehensive debt summary
   */
  async calculateDebtSummary(userId: string): Promise<DebtSummary> {
    try {
      const debtAccounts = await this.getDebtAccounts(userId);
      
      if (debtAccounts.length === 0) {
        return {
          totalDebt: 0,
          totalMinimumPayments: 0,
          averageInterestRate: 0,
          debtAccounts: [],
          highestInterestRate: 0,
          highestBalance: 0,
          monthlyInterestCost: 0,
        };
      }

      const totalDebt = debtAccounts.reduce((sum, account) => sum + Math.abs(account.balance), 0);
      const totalMinimumPayments = debtAccounts.reduce((sum, account) => sum + account.minimumPayment, 0);
      const weightedInterestSum = debtAccounts.reduce((sum, account) => 
        sum + (account.interestRate * Math.abs(account.balance)), 0);
      const averageInterestRate = totalDebt > 0 ? weightedInterestSum / totalDebt : 0;
      
      const highestInterestRate = Math.max(...debtAccounts.map(a => a.interestRate));
      const highestBalance = Math.max(...debtAccounts.map(a => Math.abs(a.balance)));
      
      // Calculate next payment due
      const upcomingPayments = debtAccounts
        .filter(a => a.paymentDueDate)
        .sort((a, b) => (a.paymentDueDate!.getTime() - b.paymentDueDate!.getTime()));
      const nextPaymentDue = upcomingPayments.length > 0 ? upcomingPayments[0].paymentDueDate : undefined;

      // Calculate monthly interest cost
      const monthlyInterestCost = debtAccounts.reduce((sum, account) => {
        const monthlyRate = account.interestRate / 12 / 100;
        return sum + (Math.abs(account.balance) * monthlyRate);
      }, 0);

      return {
        totalDebt,
        totalMinimumPayments,
        averageInterestRate,
        debtAccounts,
        highestInterestRate,
        highestBalance,
        nextPaymentDue,
        monthlyInterestCost,
      };
    } catch (error) {
      console.error('Error calculating debt summary:', error);
      throw new Error('Failed to calculate debt summary');
    }
  }

  /**
   * Compare snowball vs avalanche payoff strategies
   */
  async comparePayoffStrategies(userId: string, extraPayment: number = 0): Promise<DebtPayoffComparison> {
    try {
      const debtAccounts = await this.getDebtAccounts(userId);
      
      if (debtAccounts.length === 0) {
        throw new Error('No debt accounts found');
      }

      const snowball = this.calculateSnowballStrategy(debtAccounts, extraPayment);
      const avalanche = this.calculateAvalancheStrategy(debtAccounts, extraPayment);

      const interestSaved = snowball.totalInterest - avalanche.totalInterest;
      const timeSaved = snowball.totalTime - avalanche.totalTime;
      
      // Recommend avalanche if it saves significant interest, otherwise snowball for psychological benefits
      const recommendation = interestSaved > 1000 || timeSaved > 6 ? 'avalanche' : 'snowball';

      return {
        snowball,
        avalanche,
        extraPayment,
        recommendation,
        savings: {
          interestSaved: Math.abs(interestSaved),
          timeSaved: Math.abs(timeSaved),
        },
      };
    } catch (error) {
      console.error('Error comparing payoff strategies:', error);
      throw new Error('Failed to compare payoff strategies');
    }
  }

  /**
   * Calculate interest cost projections for current debt balances
   */
  async calculateInterestProjections(userId: string, months: number = 60): Promise<InterestProjection[]> {
    try {
      const debtAccounts = await this.getDebtAccounts(userId);
      
      return debtAccounts.map(account => {
        const projections = [];
        let currentBalance = Math.abs(account.balance);
        let totalInterest = 0;
        const monthlyRate = account.interestRate / 12 / 100;
        const minimumPayment = account.minimumPayment;

        for (let month = 1; month <= months && currentBalance > 0; month++) {
          const interestPayment = currentBalance * monthlyRate;
          const principalPayment = Math.max(0, minimumPayment - interestPayment);
          
          totalInterest += interestPayment;
          currentBalance = Math.max(0, currentBalance - principalPayment);

          projections.push({
            month,
            balance: currentBalance,
            interestPaid: interestPayment,
            principalPaid: principalPayment,
            totalInterest,
          });

          if (currentBalance === 0) break;
        }

        return {
          accountId: account.id,
          accountName: account.name,
          currentBalance: Math.abs(account.balance),
          projections,
          totalInterestCost: totalInterest,
          payoffTime: projections.length,
        };
      });
    } catch (error) {
      console.error('Error calculating interest projections:', error);
      return [];
    }
  }

  /**
   * Calculate debt-to-income ratio with benchmarks
   */
  async calculateDebtToIncomeRatio(userId: string, monthlyIncome: number): Promise<DebtToIncomeRatio> {
    try {
      const debtSummary = await this.calculateDebtSummary(userId);
      const ratio = monthlyIncome > 0 ? (debtSummary.totalMinimumPayments / monthlyIncome) * 100 : 0;

      const benchmark = {
        excellent: 10,
        good: 20,
        fair: 36,
        poor: 50,
      };

      let ratingCategory: DebtToIncomeRatio['ratingCategory'];
      let recommendation: string;

      if (ratio <= benchmark.excellent) {
        ratingCategory = 'excellent';
        recommendation = 'Your debt-to-income ratio is excellent. Consider investing extra funds or building emergency savings.';
      } else if (ratio <= benchmark.good) {
        ratingCategory = 'good';
        recommendation = 'Your debt-to-income ratio is good. Focus on paying down high-interest debt first.';
      } else if (ratio <= benchmark.fair) {
        ratingCategory = 'fair';
        recommendation = 'Your debt-to-income ratio is manageable but could be improved. Consider debt consolidation or extra payments.';
      } else if (ratio <= benchmark.poor) {
        ratingCategory = 'poor';
        recommendation = 'Your debt-to-income ratio is concerning. Focus on debt reduction and avoid taking on new debt.';
      } else {
        ratingCategory = 'dangerous';
        recommendation = 'Your debt-to-income ratio is dangerous. Seek financial counseling and consider debt management options.';
      }

      return {
        monthlyDebtPayments: debtSummary.totalMinimumPayments,
        monthlyIncome,
        ratio,
        ratingCategory,
        benchmark,
        recommendation,
      };
    } catch (error) {
      console.error('Error calculating debt-to-income ratio:', error);
      throw new Error('Failed to calculate debt-to-income ratio');
    }
  }

  /**
   * Optimize payment allocation for extra payments
   */
  async optimizePaymentAllocation(userId: string, extraPayment: number): Promise<PaymentAllocation[]> {
    try {
      const debtAccounts = await this.getDebtAccounts(userId);
      
      if (debtAccounts.length === 0) {
        return [];
      }

      // Sort by interest rate (avalanche method for optimization)
      const sortedAccounts = [...debtAccounts].sort((a, b) => b.interestRate - a.interestRate);
      
      return sortedAccounts.map((account, index) => {
        const isHighestInterest = index === 0;
        const extraForThisAccount = isHighestInterest ? extraPayment : 0;
        const recommendedPayment = account.minimumPayment + extraForThisAccount;

        // Calculate impact
        const currentPayoffTime = this.calculatePayoffTime(
          Math.abs(account.balance),
          account.minimumPayment,
          account.interestRate
        );
        
        const newPayoffTime = this.calculatePayoffTime(
          Math.abs(account.balance),
          recommendedPayment,
          account.interestRate
        );

        const timeSaved = currentPayoffTime - newPayoffTime;
        const interestSaved = this.calculateInterestSaved(
          Math.abs(account.balance),
          account.interestRate,
          account.minimumPayment,
          recommendedPayment
        );

        return {
          accountId: account.id,
          accountName: account.name,
          minimumPayment: account.minimumPayment,
          recommendedPayment,
          extraPayment: extraForThisAccount,
          reasoning: isHighestInterest 
            ? 'Highest interest rate - prioritize for maximum savings'
            : 'Continue minimum payments while focusing on higher interest debt',
          impactOnPayoffTime: timeSaved,
          impactOnInterest: interestSaved,
        };
      });
    } catch (error) {
      console.error('Error optimizing payment allocation:', error);
      return [];
    }
  }

  /**
   * Map FinancialAccount to DebtAccount
   */
  private mapToDebtAccount(account: FinancialAccount): DebtAccount {
    const metadata = account.metadata || {};
    
    return {
      id: account.id,
      name: account.name,
      balance: account.balance,
      interestRate: account.interestRate || 0,
      minimumPayment: metadata.minimumPayment || Math.abs(account.balance) * 0.02, // Default 2% of balance
      paymentDueDate: metadata.nextPaymentDue ? new Date(metadata.nextPaymentDue) : undefined,
      lastPaymentDate: metadata.lastPaymentDate ? new Date(metadata.lastPaymentDate) : undefined,
      accountType: account.accountType as 'credit' | 'loan',
      institution: account.institution,
      metadata: {
        creditLimit: metadata.creditLimit,
        loanTerm: metadata.loanTerm,
        originalBalance: metadata.originalBalance,
        paymentFrequency: metadata.paymentFrequency || 'monthly',
        nextPaymentDue: metadata.nextPaymentDue,
        lastInterestAccrual: metadata.lastInterestAccrual,
      },
    };
  }

  /**
   * Calculate snowball strategy (lowest balance first)
   */
  private calculateSnowballStrategy(accounts: DebtAccount[], extraPayment: number): PayoffStrategy {
    const sortedAccounts = [...accounts].sort((a, b) => Math.abs(a.balance) - Math.abs(b.balance));
    return this.calculatePayoffStrategy(sortedAccounts, extraPayment, 'snowball');
  }

  /**
   * Calculate avalanche strategy (highest interest rate first)
   */
  private calculateAvalancheStrategy(accounts: DebtAccount[], extraPayment: number): PayoffStrategy {
    const sortedAccounts = [...accounts].sort((a, b) => b.interestRate - a.interestRate);
    return this.calculatePayoffStrategy(sortedAccounts, extraPayment, 'avalanche');
  }

  /**
   * Calculate payoff strategy details
   */
  private calculatePayoffStrategy(
    sortedAccounts: DebtAccount[], 
    extraPayment: number, 
    strategyName: 'snowball' | 'avalanche'
  ): PayoffStrategy {
    let totalInterest = 0;
    let totalTime = 0;
    const payoffOrder = [];
    let availableExtra = extraPayment;

    for (let i = 0; i < sortedAccounts.length; i++) {
      const account = sortedAccounts[i];
      const payment = account.minimumPayment + (i === 0 ? availableExtra : 0);
      
      const payoffTime = this.calculatePayoffTime(Math.abs(account.balance), payment, account.interestRate);
      const interest = this.calculateTotalInterest(Math.abs(account.balance), payment, account.interestRate);
      
      totalInterest += interest;
      totalTime = Math.max(totalTime, payoffTime);
      
      payoffOrder.push({
        accountId: account.id,
        accountName: account.name,
        order: i + 1,
        payoffMonth: payoffTime,
        totalInterest: interest,
      });

      // After paying off this account, add its payment to available extra
      if (i < sortedAccounts.length - 1) {
        availableExtra += account.minimumPayment;
      }
    }

    const description = strategyName === 'snowball' 
      ? 'Pay minimums on all debts, focus extra payments on smallest balance first'
      : 'Pay minimums on all debts, focus extra payments on highest interest rate first';

    return {
      name: strategyName,
      description,
      totalInterest,
      totalTime,
      monthlySavings: extraPayment,
      payoffOrder,
    };
  }

  /**
   * Calculate payoff time in months
   */
  private calculatePayoffTime(balance: number, payment: number, interestRate: number): number {
    if (payment <= 0 || balance <= 0) return 0;
    
    const monthlyRate = interestRate / 12 / 100;
    if (monthlyRate === 0) return Math.ceil(balance / payment);
    
    const months = -Math.log(1 - (balance * monthlyRate) / payment) / Math.log(1 + monthlyRate);
    return Math.ceil(Math.max(1, months));
  }

  /**
   * Calculate total interest paid
   */
  private calculateTotalInterest(balance: number, payment: number, interestRate: number): number {
    const months = this.calculatePayoffTime(balance, payment, interestRate);
    return Math.max(0, (payment * months) - balance);
  }

  /**
   * Calculate interest saved by increasing payment
   */
  private calculateInterestSaved(
    balance: number, 
    interestRate: number, 
    minPayment: number, 
    newPayment: number
  ): number {
    const minInterest = this.calculateTotalInterest(balance, minPayment, interestRate);
    const newInterest = this.calculateTotalInterest(balance, newPayment, interestRate);
    return Math.max(0, minInterest - newInterest);
  }
}

export const debtService = new DebtService();
