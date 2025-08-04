/**
 * Account Validation Service
 * Provides comprehensive validation for financial account data
 */

import type { 
  AccountType, 
  Currency, 
  TaxTreatment 
} from '@drishti/shared/types/financial';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  severity: 'low' | 'medium' | 'high';
}

export interface AccountValidationData {
  name: string;
  accountType: AccountType;
  balance: number;
  currency: Currency;
  interestRate?: number;
  taxTreatment?: TaxTreatment;
  institutionName?: string;
  routingNumber?: string;
  accountNumber?: string;
}

// Realistic balance ranges by account type (in USD)
const BALANCE_RANGES: Record<AccountType, { min: number; max: number; typical: { min: number; max: number } }> = {
  checking: {
    min: 0,
    max: 1000000,
    typical: { min: 500, max: 50000 },
  },
  savings: {
    min: 0,
    max: 10000000,
    typical: { min: 1000, max: 500000 },
  },
  investment: {
    min: 0,
    max: 100000000,
    typical: { min: 5000, max: 5000000 },
  },
  retirement: {
    min: 0,
    max: 50000000,
    typical: { min: 10000, max: 2000000 },
  },
  credit: {
    min: -1000000,
    max: 0,
    typical: { min: -50000, max: 0 },
  },
  loan: {
    min: -10000000,
    max: 0,
    typical: { min: -500000, max: 0 },
  },
  other: {
    min: -1000000,
    max: 10000000,
    typical: { min: 0, max: 100000 },
  },
};

// Typical interest rate ranges by account type (annual percentage)
const INTEREST_RATE_RANGES: Record<AccountType, { min: number; max: number; typical: { min: number; max: number } }> = {
  checking: {
    min: 0,
    max: 0.05,
    typical: { min: 0, max: 0.01 },
  },
  savings: {
    min: 0,
    max: 0.1,
    typical: { min: 0.01, max: 0.05 },
  },
  investment: {
    min: -0.5,
    max: 0.3,
    typical: { min: 0.04, max: 0.12 },
  },
  retirement: {
    min: -0.5,
    max: 0.3,
    typical: { min: 0.04, max: 0.12 },
  },
  credit: {
    min: 0.05,
    max: 0.35,
    typical: { min: 0.15, max: 0.25 },
  },
  loan: {
    min: 0.01,
    max: 0.3,
    typical: { min: 0.03, max: 0.08 },
  },
  other: {
    min: 0,
    max: 0.3,
    typical: { min: 0, max: 0.1 },
  },
};

class AccountValidationService {
  private static instance: AccountValidationService;

  private constructor() {}

  static getInstance(): AccountValidationService {
    if (!AccountValidationService.instance) {
      AccountValidationService.instance = new AccountValidationService();
    }
    return AccountValidationService.instance;
  }

  /**
   * Validate complete account data
   */
  validateAccount(data: AccountValidationData): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate required fields
    errors.push(...this.validateRequiredFields(data));

    // Validate account name
    errors.push(...this.validateAccountName(data.name));

    // Validate balance
    const balanceValidation = this.validateBalance(data.balance, data.accountType);
    errors.push(...balanceValidation.errors);
    warnings.push(...balanceValidation.warnings);

    // Validate interest rate
    if (data.interestRate !== undefined) {
      const rateValidation = this.validateInterestRate(data.interestRate, data.accountType);
      errors.push(...rateValidation.errors);
      warnings.push(...rateValidation.warnings);
    }

    // Validate tax treatment compatibility
    if (data.taxTreatment) {
      errors.push(...this.validateTaxTreatment(data.taxTreatment, data.accountType));
    }

    // Validate routing number format
    if (data.routingNumber) {
      errors.push(...this.validateRoutingNumber(data.routingNumber));
    }

    // Validate account number format
    if (data.accountNumber) {
      errors.push(...this.validateAccountNumber(data.accountNumber));
    }

    // Additional contextual warnings
    warnings.push(...this.generateContextualWarnings(data));

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateRequiredFields(data: AccountValidationData): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!data.name?.trim()) {
      errors.push({
        field: 'name',
        message: 'Account name is required',
        code: 'REQUIRED_FIELD',
      });
    }

    if (!data.accountType) {
      errors.push({
        field: 'accountType',
        message: 'Account type is required',
        code: 'REQUIRED_FIELD',
      });
    }

    if (data.balance === undefined || data.balance === null) {
      errors.push({
        field: 'balance',
        message: 'Account balance is required',
        code: 'REQUIRED_FIELD',
      });
    }

    if (!data.currency) {
      errors.push({
        field: 'currency',
        message: 'Currency is required',
        code: 'REQUIRED_FIELD',
      });
    }

    return errors;
  }

  private validateAccountName(name: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (name && name.trim().length < 2) {
      errors.push({
        field: 'name',
        message: 'Account name must be at least 2 characters long',
        code: 'MIN_LENGTH',
      });
    }

    if (name && name.trim().length > 100) {
      errors.push({
        field: 'name',
        message: 'Account name cannot exceed 100 characters',
        code: 'MAX_LENGTH',
      });
    }

    // Check for potentially problematic characters
    if (name && /[<>\"'&]/.test(name)) {
      errors.push({
        field: 'name',
        message: 'Account name contains invalid characters',
        code: 'INVALID_CHARACTERS',
      });
    }

    return errors;
  }

  private validateBalance(balance: number, accountType: AccountType): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (isNaN(balance)) {
      errors.push({
        field: 'balance',
        message: 'Balance must be a valid number',
        code: 'INVALID_NUMBER',
      });
      return { errors, warnings };
    }

    const ranges = BALANCE_RANGES[accountType];

    // Hard limits validation
    if (balance < ranges.min) {
      errors.push({
        field: 'balance',
        message: `Balance cannot be less than ${this.formatCurrency(ranges.min)} for ${accountType} accounts`,
        code: 'BALANCE_TOO_LOW',
      });
    }

    if (balance > ranges.max) {
      errors.push({
        field: 'balance',
        message: `Balance cannot exceed ${this.formatCurrency(ranges.max)} for ${accountType} accounts`,
        code: 'BALANCE_TOO_HIGH',
      });
    }

    // Typical range warnings
    if (balance < ranges.typical.min && balance >= ranges.min) {
      warnings.push({
        field: 'balance',
        message: `Balance of ${this.formatCurrency(balance)} is unusually low for a ${accountType} account`,
        code: 'BALANCE_UNUSUALLY_LOW',
        severity: 'medium',
      });
    }

    if (balance > ranges.typical.max && balance <= ranges.max) {
      warnings.push({
        field: 'balance',
        message: `Balance of ${this.formatCurrency(balance)} is unusually high for a ${accountType} account`,
        code: 'BALANCE_UNUSUALLY_HIGH',
        severity: 'medium',
      });
    }

    // Specific account type validations
    if (accountType === 'credit' && balance > 0) {
      warnings.push({
        field: 'balance',
        message: 'Credit card accounts typically have negative balances (representing debt)',
        code: 'CREDIT_POSITIVE_BALANCE',
        severity: 'high',
      });
    }

    if (accountType === 'loan' && balance > 0) {
      warnings.push({
        field: 'balance',
        message: 'Loan accounts typically have negative balances (representing debt)',
        code: 'LOAN_POSITIVE_BALANCE',
        severity: 'high',
      });
    }

    return { errors, warnings };
  }

  private validateInterestRate(rate: number, accountType: AccountType): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (isNaN(rate)) {
      errors.push({
        field: 'interestRate',
        message: 'Interest rate must be a valid number',
        code: 'INVALID_NUMBER',
      });
      return { errors, warnings };
    }

    const ranges = INTEREST_RATE_RANGES[accountType];

    // Hard limits validation
    if (rate < ranges.min) {
      errors.push({
        field: 'interestRate',
        message: `Interest rate cannot be less than ${(ranges.min * 100).toFixed(2)}% for ${accountType} accounts`,
        code: 'RATE_TOO_LOW',
      });
    }

    if (rate > ranges.max) {
      errors.push({
        field: 'interestRate',
        message: `Interest rate cannot exceed ${(ranges.max * 100).toFixed(2)}% for ${accountType} accounts`,
        code: 'RATE_TOO_HIGH',
      });
    }

    // Typical range warnings
    if (rate < ranges.typical.min && rate >= ranges.min) {
      warnings.push({
        field: 'interestRate',
        message: `Interest rate of ${(rate * 100).toFixed(2)}% is unusually low for a ${accountType} account`,
        code: 'RATE_UNUSUALLY_LOW',
        severity: 'low',
      });
    }

    if (rate > ranges.typical.max && rate <= ranges.max) {
      warnings.push({
        field: 'interestRate',
        message: `Interest rate of ${(rate * 100).toFixed(2)}% is unusually high for a ${accountType} account`,
        code: 'RATE_UNUSUALLY_HIGH',
        severity: 'medium',
      });
    }

    return { errors, warnings };
  }

  private validateTaxTreatment(taxTreatment: TaxTreatment, accountType: AccountType): ValidationError[] {
    const errors: ValidationError[] = [];

    const compatibleTreatments: Record<AccountType, TaxTreatment[]> = {
      checking: ['taxable'],
      savings: ['taxable', 'hsa'],
      investment: ['taxable', 'traditional_ira', 'roth_ira', 'sep_ira', 'other_tax_advantaged'],
      retirement: ['traditional_ira', 'roth_ira', 'traditional_401k', 'roth_401k', 'sep_ira', 'simple_ira', 'other_tax_advantaged'],
      credit: ['taxable'],
      loan: ['taxable'],
      other: ['taxable', 'other_tax_advantaged'],
    };

    if (!compatibleTreatments[accountType].includes(taxTreatment)) {
      errors.push({
        field: 'taxTreatment',
        message: `Tax treatment '${taxTreatment}' is not compatible with account type '${accountType}'`,
        code: 'INCOMPATIBLE_TAX_TREATMENT',
      });
    }

    return errors;
  }

  private validateRoutingNumber(routingNumber: string): ValidationError[] {
    const errors: ValidationError[] = [];

    // Remove any spaces or dashes
    const cleanRouting = routingNumber.replace(/[\s-]/g, '');

    if (!/^\d{9}$/.test(cleanRouting)) {
      errors.push({
        field: 'routingNumber',
        message: 'Routing number must be exactly 9 digits',
        code: 'INVALID_ROUTING_FORMAT',
      });
      return errors;
    }

    // Validate routing number checksum (ABA routing number algorithm)
    const digits = cleanRouting.split('').map(Number);
    const checksum = (
      3 * (digits[0] + digits[3] + digits[6]) +
      7 * (digits[1] + digits[4] + digits[7]) +
      1 * (digits[2] + digits[5] + digits[8])
    ) % 10;

    if (checksum !== 0) {
      errors.push({
        field: 'routingNumber',
        message: 'Invalid routing number checksum',
        code: 'INVALID_ROUTING_CHECKSUM',
      });
    }

    return errors;
  }

  private validateAccountNumber(accountNumber: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (accountNumber.length < 4) {
      errors.push({
        field: 'accountNumber',
        message: 'Account number must be at least 4 characters',
        code: 'ACCOUNT_NUMBER_TOO_SHORT',
      });
    }

    if (accountNumber.length > 20) {
      errors.push({
        field: 'accountNumber',
        message: 'Account number cannot exceed 20 characters',
        code: 'ACCOUNT_NUMBER_TOO_LONG',
      });
    }

    if (!/^[a-zA-Z0-9]+$/.test(accountNumber)) {
      errors.push({
        field: 'accountNumber',
        message: 'Account number can only contain letters and numbers',
        code: 'INVALID_ACCOUNT_NUMBER_FORMAT',
      });
    }

    return errors;
  }

  private generateContextualWarnings(data: AccountValidationData): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Warn about missing institution for certain account types
    if (!data.institutionName && ['investment', 'retirement'].includes(data.accountType)) {
      warnings.push({
        field: 'institutionName',
        message: `Consider specifying an institution for ${data.accountType} accounts for better organization`,
        code: 'MISSING_INSTITUTION',
        severity: 'low',
      });
    }

    // Warn about missing interest rate for interest-bearing accounts
    if (data.interestRate === undefined && ['savings', 'investment', 'retirement'].includes(data.accountType)) {
      warnings.push({
        field: 'interestRate',
        message: `Consider adding an interest rate for ${data.accountType} accounts for accurate projections`,
        code: 'MISSING_INTEREST_RATE',
        severity: 'low',
      });
    }

    // Warn about missing tax treatment for retirement accounts
    if (!data.taxTreatment && data.accountType === 'retirement') {
      warnings.push({
        field: 'taxTreatment',
        message: 'Tax treatment is important for retirement account planning',
        code: 'MISSING_TAX_TREATMENT',
        severity: 'medium',
      });
    }

    return warnings;
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Quick validation for form fields
   */
  validateField(field: keyof AccountValidationData, value: any, accountType?: AccountType): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    switch (field) {
      case 'name':
        errors.push(...this.validateAccountName(value));
        break;
      case 'balance':
        if (accountType) {
          const result = this.validateBalance(value, accountType);
          errors.push(...result.errors);
          warnings.push(...result.warnings);
        }
        break;
      case 'interestRate':
        if (accountType) {
          const result = this.validateInterestRate(value, accountType);
          errors.push(...result.errors);
          warnings.push(...result.warnings);
        }
        break;
      case 'routingNumber':
        errors.push(...this.validateRoutingNumber(value));
        break;
      case 'accountNumber':
        errors.push(...this.validateAccountNumber(value));
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

export const accountValidationService = AccountValidationService.getInstance();
