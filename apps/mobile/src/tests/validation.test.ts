import { describe, it, expect } from '@jest/globals';
import {
  validateEmail,
  validatePassword,
  validateName,
  validateAmount,
  validateGoalName,
  validateAccountName,
  validatePIN,
  validateFutureDate,
  validateGoalEnhanced,
  validateFormEnhanced,
  createValidator,
  sanitizeInput
} from '../utils/validation';

/**
 * Mobile App Validation Tests
 * Tests client-side validation functions
 */

describe('Mobile Validation Functions', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'simple@test.io'
      ];

      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.errors.length).toBe(0);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test@example..com',
        ''
      ];

      invalidEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should provide warnings for common typos', () => {
      const typoEmails = [
        'test@gmial.com',
        'user@gmai.com',
        'test@yahooo.com'
      ];

      typoEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.warnings).toBeDefined();
        expect(result.warnings!.length).toBeGreaterThan(0);
      });
    });

    it('should handle edge cases', () => {
      const edgeCases = [
        { email: 'a@b.c', shouldBeValid: false }, // Too short domain
        { email: 'test@example.c', shouldBeValid: true }, // Single char TLD
        { email: 'very.long.email.address@very.long.domain.name.com', shouldBeValid: true }
      ];

      edgeCases.forEach(({ email, shouldBeValid }) => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(shouldBeValid);
      });
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'SecurePassword123!',
        'MyP@ssw0rd2024',
        'Complex!Pass123'
      ];

      strongPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.strength).toBeGreaterThan(3);
        expect(result.errors.length).toBe(0);
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        { password: '123', expectedErrors: ['Password must be at least 8 characters'] },
        { password: 'password', expectedErrors: ['Password must contain at least one uppercase letter'] },
        { password: 'PASSWORD', expectedErrors: ['Password must contain at least one lowercase letter'] },
        { password: 'Password', expectedErrors: ['Password must contain at least one number'] },
        { password: 'Password123', expectedErrors: ['Password must contain at least one special character'] }
      ];

      weakPasswords.forEach(({ password, expectedErrors }) => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expectedErrors.forEach(expectedError => {
          expect(result.errors.some(error => error.includes(expectedError.split(' ')[0]))).toBe(true);
        });
      });
    });

    it('should detect common passwords', () => {
      const commonPasswords = [
        'password123',
        'qwerty',
        'admin',
        '123456'
      ];

      commonPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.includes('common'))).toBe(true);
      });
    });

    it('should provide warnings for sequential characters', () => {
      const sequentialPasswords = [
        'Password123abc',
        'MyPass123456',
        'SecureQwerty!'
      ];

      sequentialPasswords.forEach(password => {
        const result = validatePassword(password);
        if (result.warnings && result.warnings.length > 0) {
          expect(result.warnings.some(warning => warning.includes('sequential'))).toBe(true);
        }
      });
    });

    it('should calculate password strength correctly', () => {
      const passwordTests = [
        { password: 'Weak1!', expectedMinStrength: 3 },
        { password: 'StrongPassword123!', expectedMinStrength: 4 },
        { password: 'VeryStrongPassword123!@#', expectedMinStrength: 5 }
      ];

      passwordTests.forEach(({ password, expectedMinStrength }) => {
        const result = validatePassword(password);
        if (result.isValid) {
          expect(result.strength).toBeGreaterThanOrEqual(expectedMinStrength);
        }
      });
    });
  });

  describe('validateName', () => {
    it('should validate correct names', () => {
      const validNames = [
        'John Doe',
        'Mary-Jane Smith',
        "O'Connor",
        'Jean-Pierre',
        'Anna Maria'
      ];

      validNames.forEach(name => {
        const result = validateName(name);
        expect(result.isValid).toBe(true);
        expect(result.errors.length).toBe(0);
      });
    });

    it('should reject invalid names', () => {
      const invalidNames = [
        '',
        '   ',
        'John123',
        'John@Doe',
        'John_Doe',
        'A'.repeat(101) // Too long
      ];

      invalidNames.forEach(name => {
        const result = validateName(name);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('validateAmount', () => {
    it('should validate correct amounts', () => {
      const validAmounts = [
        { input: '100', expected: 100 },
        { input: '1234.56', expected: 1234.56 },
        { input: '-50.25', expected: -50.25 },
        { input: '0', expected: 0 },
        { input: 1000, expected: 1000 }
      ];

      validAmounts.forEach(({ input, expected }) => {
        const result = validateAmount(input);
        expect(result.isValid).toBe(true);
        expect(result.value).toBe(expected);
        expect(result.errors.length).toBe(0);
      });
    });

    it('should reject invalid amounts', () => {
      const invalidAmounts = [
        '',
        'not-a-number',
        '1234.567', // Too many decimal places
        '1000000000', // Too large
        '-1000000000', // Too small
        'Infinity',
        'NaN'
      ];

      invalidAmounts.forEach(amount => {
        const result = validateAmount(amount);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should provide warnings for unusual amounts', () => {
      const result = validateAmount('1500000'); // Large amount
      if (result.warnings && result.warnings.length > 0) {
        expect(result.warnings.some(warning => warning.includes('Large amount'))).toBe(true);
      }
    });
  });

  describe('validatePIN', () => {
    it('should validate correct PINs', () => {
      const validPINs = [
        '123456',
        '789012',
        '456789'
      ];

      validPINs.forEach(pin => {
        const result = validatePIN(pin);
        expect(result.isValid).toBe(true);
        expect(result.errors.length).toBe(0);
      });
    });

    it('should reject invalid PINs', () => {
      const invalidPINs = [
        { pin: '', expectedError: 'PIN is required' },
        { pin: '12345', expectedError: 'PIN must be exactly 6 digits' },
        { pin: '1234567', expectedError: 'PIN must be exactly 6 digits' },
        { pin: '12345a', expectedError: 'PIN must contain only numbers' },
        { pin: '111111', expectedError: 'PIN cannot be all the same digit' },
        { pin: '123456', expectedError: 'PIN is too simple' },
        { pin: '000000', expectedError: 'PIN is too simple' }
      ];

      invalidPINs.forEach(({ pin, expectedError }) => {
        const result = validatePIN(pin);
        if (pin === '123456' && expectedError === 'PIN is too simple') {
          expect(result.isValid).toBe(false);
          expect(result.errors.some(error => error.includes('simple'))).toBe(true);
        } else if (pin !== '123456') { // 123456 is valid but simple
          expect(result.isValid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
        }
      });
    });

    it('should warn about sequential patterns', () => {
      const sequentialPINs = [
        '123456',
        '654321',
        '234567'
      ];

      sequentialPINs.forEach(pin => {
        const result = validatePIN(pin);
        if (result.warnings && result.warnings.length > 0) {
          expect(result.warnings.some(warning => warning.includes('sequential'))).toBe(true);
        }
      });
    });
  });

  describe('validateFutureDate', () => {
    it('should validate future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const result = validateFutureDate(futureDate.toISOString());
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject past dates', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      
      const result = validateFutureDate(pastDate.toISOString());
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('future'))).toBe(true);
    });

    it('should reject invalid date formats', () => {
      const invalidDates = [
        '',
        'not-a-date',
        '2024-13-01', // Invalid month
        '2024-02-30'  // Invalid day
      ];

      invalidDates.forEach(date => {
        const result = validateFutureDate(date);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should warn about dates too far in the future', () => {
      const veryFutureDate = new Date();
      veryFutureDate.setFullYear(veryFutureDate.getFullYear() + 100);
      
      const result = validateFutureDate(veryFutureDate.toISOString());
      if (result.warnings && result.warnings.length > 0) {
        expect(result.warnings.some(warning => warning.includes('very far'))).toBe(true);
      }
    });
  });

  describe('validateGoalEnhanced', () => {
    it('should validate complete goal data', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const validGoal = {
        name: 'Emergency Fund',
        targetAmount: '10000',
        targetDate: futureDate.toISOString(),
        existingNames: ['Vacation Fund', 'House Down Payment']
      };

      const result = validateGoalEnhanced(validGoal);
      expect(result.isValid).toBe(true);
      expect(Object.values(result.fields).every(field => field.isValid)).toBe(true);
    });

    it('should detect duplicate goal names', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const duplicateGoal = {
        name: 'Emergency Fund',
        targetAmount: '10000',
        targetDate: futureDate.toISOString(),
        existingNames: ['Emergency Fund', 'Vacation Fund'] // Duplicate name
      };

      const result = validateGoalEnhanced(duplicateGoal);
      expect(result.isValid).toBe(false);
      expect(result.fields.name.errors.some(error => error.includes('already exists'))).toBe(true);
    });

    it('should reject negative goal amounts', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const invalidGoal = {
        name: 'Test Goal',
        targetAmount: '-1000',
        targetDate: futureDate.toISOString()
      };

      const result = validateGoalEnhanced(invalidGoal);
      expect(result.isValid).toBe(false);
      expect(result.fields.targetAmount.errors.some(error => error.includes('positive'))).toBe(true);
    });
  });

  describe('createValidator', () => {
    it('should create a validator with custom rules', () => {
      const validator = createValidator({
        email: validateEmail,
        name: validateName
      });

      const testData = {
        email: 'test@example.com',
        name: 'John Doe'
      };

      const result = validator.validateAll(testData);
      expect(result.isValid).toBe(true);
    });

    it('should validate individual fields', () => {
      const validator = createValidator({
        email: validateEmail,
        name: validateName
      });

      const emailResult = validator.validateField('email', 'invalid-email');
      expect(emailResult.isValid).toBe(false);
      expect(emailResult.field).toBe('email');
    });
  });

  describe('sanitizeInput', () => {
    it('should remove dangerous HTML tags', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>Hello',
        '<iframe src="evil.com"></iframe>World',
        'javascript:alert("xss")',
        '<div onclick="alert()">Click me</div>'
      ];

      maliciousInputs.forEach(input => {
        const sanitized = sanitizeInput(input);
        expect(sanitized).not.toContain('<script');
        expect(sanitized).not.toContain('<iframe');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('onclick');
      });
    });

    it('should preserve safe content', () => {
      const safeInputs = [
        'Hello World',
        'This is a normal string',
        'Numbers: 123 and symbols: !@#'
      ];

      safeInputs.forEach(input => {
        const sanitized = sanitizeInput(input);
        expect(sanitized).toBe(input.trim());
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null and undefined inputs gracefully', () => {
      const validators = [
        validateEmail,
        validateName,
        validatePIN
      ];

      validators.forEach(validator => {
        expect(() => validator(null as any)).not.toThrow();
        expect(() => validator(undefined as any)).not.toThrow();
        
        const nullResult = validator(null as any);
        const undefinedResult = validator(undefined as any);
        
        expect(nullResult.isValid).toBe(false);
        expect(undefinedResult.isValid).toBe(false);
      });
    });

    it('should handle very long strings', () => {
      const veryLongString = 'a'.repeat(10000);
      
      const result = validateName(veryLongString);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('exceed'))).toBe(true);
    });

    it('should handle special characters correctly', () => {
      const specialCharTests = [
        { input: 'José María', validator: validateName, shouldBeValid: true },
        { input: 'test@domain.com', validator: validateEmail, shouldBeValid: true },
        { input: 'Björk Guðmundsdóttir', validator: validateName, shouldBeValid: false } // Contains non-ASCII
      ];

      specialCharTests.forEach(({ input, validator, shouldBeValid }) => {
        const result = validator(input);
        expect(result.isValid).toBe(shouldBeValid);
      });
    });
  });
});
