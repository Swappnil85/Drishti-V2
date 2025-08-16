/**
 * Tests for utility functions
 * Including E4-S7: Currency formatting tests
 */

import {
  formatCurrency,
  formatPercentage,
  calculateCompoundInterest,
  calculateFutureValue,
  generateUUID,
  isValidEmail,
  capitalize,
  truncate,
} from '../utils';

describe('formatCurrency', () => {
  describe('E4-S7: Currency formatting with AUD default', () => {
    it('formats positive amounts with AUD default', () => {
      expect(formatCurrency(1234.56)).toMatch(/[A$]+1,234\.56/);
      expect(formatCurrency(0)).toMatch(/[A$]+0\.00/);
      expect(formatCurrency(1)).toMatch(/[A$]+1\.00/);
    });

    it('formats negative amounts correctly', () => {
      expect(formatCurrency(-1234.56)).toMatch(/-[A$]+1,234\.56/);
      expect(formatCurrency(-0.01)).toMatch(/-[A$]+0\.01/);
    });

    it('handles large values', () => {
      expect(formatCurrency(1000000)).toMatch(/[A$]+1,000,000\.00/);
      expect(formatCurrency(999999999.99)).toMatch(/[A$]+999,999,999\.99/);
    });

    it('handles decimal precision correctly', () => {
      expect(formatCurrency(1.234)).toMatch(/[A$]+1\.23/); // Should round to 2 decimals
      expect(formatCurrency(1.236)).toMatch(/[A$]+1\.24/); // Should round up
      expect(formatCurrency(1.1)).toMatch(/[A$]+1\.10/); // Should pad to 2 decimals
    });

    it('formats with different currencies', () => {
      const usdResult = formatCurrency(1234.56, 'USD');
      expect(usdResult).toMatch(/\$1,234\.56/);

      const eurResult = formatCurrency(1234.56, 'EUR');
      expect(eurResult).toMatch(/€1,234\.56/);

      const gbpResult = formatCurrency(1234.56, 'GBP');
      expect(gbpResult).toMatch(/£1,234\.56/);
    });

    it('falls back to AUD for invalid currency codes', () => {
      const result = formatCurrency(1234.56, 'INVALID');
      expect(result).toMatch(/[A$]+1,234\.56/);
    });

    it('provides ultimate fallback for complete failures', () => {
      // Mock Intl.NumberFormat to throw
      const originalNumberFormat = Intl.NumberFormat;
      (global as any).Intl = {
        NumberFormat: jest.fn(() => {
          throw new Error('Mock error');
        }),
      };

      const result = formatCurrency(1234.56);
      expect(result).toBe('$1234.56');

      // Restore original
      (global as any).Intl.NumberFormat = originalNumberFormat;
    });

    it('handles edge cases', () => {
      expect(formatCurrency(0)).toMatch(/[A$]+0\.00/);
      expect(formatCurrency(-0)).toMatch(/[A$]+0\.00/);
      expect(formatCurrency(0.01)).toMatch(/[A$]+0\.01/);
      expect(formatCurrency(0.001)).toMatch(/[A$]+0\.00/); // Rounds to 2 decimals
    });
  });
});

describe('formatPercentage', () => {
  it('formats percentages correctly', () => {
    expect(formatPercentage(0.1234)).toBe('12.34%');
    expect(formatPercentage(0.1234, 1)).toBe('12.3%');
    expect(formatPercentage(1)).toBe('100.00%');
    expect(formatPercentage(-0.05)).toBe('-5.00%');
  });
});

describe('string utilities', () => {
  describe('generateUUID', () => {
    it('generates valid UUID format', () => {
      const uuid = generateUUID();
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      );
    });

    it('generates unique UUIDs', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('isValidEmail', () => {
    it('validates correct email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('test+tag@example.org')).toBe(true);
    });

    it('rejects invalid email formats', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test..test@example.com')).toBe(false);
    });
  });

  describe('capitalize', () => {
    it('capitalizes first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('HELLO')).toBe('HELLO');
      expect(capitalize('h')).toBe('H');
      expect(capitalize('')).toBe('');
    });
  });

  describe('truncate', () => {
    it('truncates long strings', () => {
      expect(truncate('Hello World', 5)).toBe('Hello...');
      expect(truncate('Short', 10)).toBe('Short');
      expect(truncate('Exact', 5)).toBe('Exact');
    });
  });
});

describe('financial calculations', () => {
  describe('calculateCompoundInterest', () => {
    it('calculates compound interest correctly', () => {
      const result = calculateCompoundInterest(1000, 0.05, 12, 10);
      expect(result).toBeCloseTo(1643.62, 2);
    });

    it('handles zero interest rate', () => {
      const result = calculateCompoundInterest(1000, 0, 12, 10);
      expect(result).toBe(1000);
    });

    it('throws error for invalid parameters', () => {
      expect(() => calculateCompoundInterest(-1000, 0.05, 12, 10)).toThrow();
      expect(() => calculateCompoundInterest(1000, 0.05, 0, 10)).toThrow();
      expect(() => calculateCompoundInterest(1000, 0.05, 12, -10)).toThrow();
    });
  });

  describe('calculateFutureValue', () => {
    it('calculates future value with contributions', () => {
      const result = calculateFutureValue(1000, 100, 0.06, 10);
      expect(result.futureValue).toBeGreaterThan(1000);
      expect(result.totalContributions).toBe(12000); // 100 * 12 * 10
      expect(result.totalInterest).toBeGreaterThan(0);
    });

    it('handles zero contributions', () => {
      const result = calculateFutureValue(1000, 0, 0.06, 10);
      expect(result.totalContributions).toBe(0);
      expect(result.futureValue).toBeCloseTo(1790.85, 2);
    });
  });
});
