/**
 * AccountValidationService Tests
 * Unit tests for account validation functionality
 */

import { accountValidationService } from '../AccountValidationService';
import type { AccountValidationData } from '../AccountValidationService';

describe('AccountValidationService', () => {
  describe('validateAccount', () => {
    const validAccountData: AccountValidationData = {
      name: 'Test Checking Account',
      accountType: 'checking',
      balance: 5000,
      currency: 'USD',
      interestRate: 0.01,
      institutionName: 'Test Bank',
    };

    it('should validate a valid account', () => {
      const result = accountValidationService.validateAccount(validAccountData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require account name', () => {
      const invalidData = { ...validAccountData, name: '' };
      const result = accountValidationService.validateAccount(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'name',
          code: 'REQUIRED_FIELD',
        })
      );
    });

    it('should require account type', () => {
      const invalidData = { ...validAccountData, accountType: undefined as any };
      const result = accountValidationService.validateAccount(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'accountType',
          code: 'REQUIRED_FIELD',
        })
      );
    });

    it('should validate account name length', () => {
      const shortName = { ...validAccountData, name: 'A' };
      const longName = { ...validAccountData, name: 'A'.repeat(101) };
      
      const shortResult = accountValidationService.validateAccount(shortName);
      const longResult = accountValidationService.validateAccount(longName);
      
      expect(shortResult.isValid).toBe(false);
      expect(shortResult.errors).toContainEqual(
        expect.objectContaining({
          field: 'name',
          code: 'MIN_LENGTH',
        })
      );
      
      expect(longResult.isValid).toBe(false);
      expect(longResult.errors).toContainEqual(
        expect.objectContaining({
          field: 'name',
          code: 'MAX_LENGTH',
        })
      );
    });

    it('should validate balance ranges for different account types', () => {
      const checkingAccount = { ...validAccountData, accountType: 'checking' as const, balance: -1000 };
      const creditAccount = { ...validAccountData, accountType: 'credit' as const, balance: 1000 };
      
      const checkingResult = accountValidationService.validateAccount(checkingAccount);
      const creditResult = accountValidationService.validateAccount(creditAccount);
      
      expect(checkingResult.isValid).toBe(false);
      expect(checkingResult.errors).toContainEqual(
        expect.objectContaining({
          field: 'balance',
          code: 'BALANCE_TOO_LOW',
        })
      );
      
      // Credit accounts can have positive balances but should warn
      expect(creditResult.isValid).toBe(true);
      expect(creditResult.warnings).toContainEqual(
        expect.objectContaining({
          field: 'balance',
          code: 'CREDIT_POSITIVE_BALANCE',
        })
      );
    });

    it('should validate interest rate ranges', () => {
      const highRate = { ...validAccountData, interestRate: 0.5 }; // 50%
      const negativeRate = { ...validAccountData, interestRate: -0.1 }; // -10%
      
      const highResult = accountValidationService.validateAccount(highRate);
      const negativeResult = accountValidationService.validateAccount(negativeRate);
      
      expect(highResult.isValid).toBe(false);
      expect(highResult.errors).toContainEqual(
        expect.objectContaining({
          field: 'interestRate',
          code: 'RATE_TOO_HIGH',
        })
      );
      
      expect(negativeResult.isValid).toBe(false);
      expect(negativeResult.errors).toContainEqual(
        expect.objectContaining({
          field: 'interestRate',
          code: 'RATE_TOO_LOW',
        })
      );
    });

    it('should validate tax treatment compatibility', () => {
      const invalidTaxTreatment = {
        ...validAccountData,
        accountType: 'checking' as const,
        taxTreatment: 'roth_ira' as const,
      };
      
      const result = accountValidationService.validateAccount(invalidTaxTreatment);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'taxTreatment',
          code: 'INCOMPATIBLE_TAX_TREATMENT',
        })
      );
    });

    it('should validate routing number format and checksum', () => {
      const invalidFormat = { ...validAccountData, routingNumber: '12345' };
      const invalidChecksum = { ...validAccountData, routingNumber: '123456789' };
      const validRouting = { ...validAccountData, routingNumber: '021000021' }; // Chase routing number
      
      const formatResult = accountValidationService.validateAccount(invalidFormat);
      const checksumResult = accountValidationService.validateAccount(invalidChecksum);
      const validResult = accountValidationService.validateAccount(validRouting);
      
      expect(formatResult.isValid).toBe(false);
      expect(formatResult.errors).toContainEqual(
        expect.objectContaining({
          field: 'routingNumber',
          code: 'INVALID_ROUTING_FORMAT',
        })
      );
      
      expect(checksumResult.isValid).toBe(false);
      expect(checksumResult.errors).toContainEqual(
        expect.objectContaining({
          field: 'routingNumber',
          code: 'INVALID_ROUTING_CHECKSUM',
        })
      );
      
      expect(validResult.isValid).toBe(true);
    });

    it('should generate contextual warnings', () => {
      const retirementWithoutTaxTreatment = {
        ...validAccountData,
        accountType: 'retirement' as const,
        taxTreatment: undefined,
      };
      
      const savingsWithoutInterestRate = {
        ...validAccountData,
        accountType: 'savings' as const,
        interestRate: undefined,
      };
      
      const retirementResult = accountValidationService.validateAccount(retirementWithoutTaxTreatment);
      const savingsResult = accountValidationService.validateAccount(savingsWithoutInterestRate);
      
      expect(retirementResult.warnings).toContainEqual(
        expect.objectContaining({
          field: 'taxTreatment',
          code: 'MISSING_TAX_TREATMENT',
        })
      );
      
      expect(savingsResult.warnings).toContainEqual(
        expect.objectContaining({
          field: 'interestRate',
          code: 'MISSING_INTEREST_RATE',
        })
      );
    });
  });

  describe('validateField', () => {
    it('should validate individual fields', () => {
      const nameResult = accountValidationService.validateField('name', 'Valid Account Name');
      const balanceResult = accountValidationService.validateField('balance', 5000, 'checking');
      const routingResult = accountValidationService.validateField('routingNumber', '021000021');
      
      expect(nameResult.isValid).toBe(true);
      expect(balanceResult.isValid).toBe(true);
      expect(routingResult.isValid).toBe(true);
    });

    it('should validate field with errors', () => {
      const nameResult = accountValidationService.validateField('name', '');
      const balanceResult = accountValidationService.validateField('balance', -1000, 'checking');
      const routingResult = accountValidationService.validateField('routingNumber', '123');
      
      expect(nameResult.isValid).toBe(false);
      expect(balanceResult.isValid).toBe(false);
      expect(routingResult.isValid).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle missing required fields gracefully', () => {
      const emptyData = {} as AccountValidationData;
      const result = accountValidationService.validateAccount(emptyData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle invalid number formats', () => {
      const invalidBalance = {
        name: 'Test Account',
        accountType: 'checking' as const,
        balance: NaN,
        currency: 'USD' as const,
      };
      
      const result = accountValidationService.validateAccount(invalidBalance);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'balance',
          code: 'INVALID_NUMBER',
        })
      );
    });

    it('should handle special characters in account names', () => {
      const specialChars = {
        name: 'Test Account <script>',
        accountType: 'checking' as const,
        balance: 1000,
        currency: 'USD' as const,
      };
      
      const result = accountValidationService.validateAccount(specialChars);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'name',
          code: 'INVALID_CHARACTERS',
        })
      );
    });
  });
});
