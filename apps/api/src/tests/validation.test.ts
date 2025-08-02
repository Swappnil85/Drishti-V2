import { describe, it, expect } from '@jest/globals';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
  createAccountSchema,
  createGoalSchema,
  createScenarioSchema,
} from '../validation/schemas';

/**
 * Comprehensive Validation Tests
 * Tests all validation schemas and middleware
 */

describe('Validation Schemas', () => {
  describe('Authentication Validation', () => {
    describe('registerSchema', () => {
      it('should validate correct registration data', () => {
        const validData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'SecurePassword123!',
          provider: 'email' as const,
        };

        const result = registerSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject invalid email format', () => {
        const invalidData = {
          name: 'John Doe',
          email: 'invalid-email',
          password: 'SecurePassword123!',
          provider: 'email' as const,
        };

        const result = registerSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].path).toContain('email');
        }
      });

      it('should reject weak passwords', () => {
        const invalidData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: '123',
          provider: 'email' as const,
        };

        const result = registerSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].path).toContain('password');
        }
      });

      it('should reject invalid names', () => {
        const invalidData = {
          name: 'John123',
          email: 'john@example.com',
          password: 'SecurePassword123!',
          provider: 'email' as const,
        };

        const result = registerSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].path).toContain('name');
        }
      });
    });

    describe('loginSchema', () => {
      it('should validate correct login data', () => {
        const validData = {
          email: 'john@example.com',
          password: 'SecurePassword123!',
          provider: 'email' as const,
        };

        const result = loginSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should allow OAuth login without password', () => {
        const validData = {
          email: 'john@example.com',
          provider: 'google' as const,
          oauthToken: 'oauth-token-123',
        };

        const result = loginSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    describe('changePasswordSchema', () => {
      it('should validate password change', () => {
        const validData = {
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!',
        };

        const result = changePasswordSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject same current and new password', () => {
        const invalidData = {
          currentPassword: 'SamePassword123!',
          newPassword: 'SamePassword123!',
        };

        const result = changePasswordSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Financial Data Validation', () => {
    describe('createAccountSchema', () => {
      it('should validate correct account data', () => {
        const validData = {
          name: 'Checking Account',
          type: 'checking' as const,
          balance: 1000.5,
          taxTreatment: 'taxable' as const,
          institution: 'Bank of America',
          isActive: true,
        };

        const result = createAccountSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject invalid account type', () => {
        const invalidData = {
          name: 'Test Account',
          type: 'invalid-type',
          balance: 1000,
          taxTreatment: 'taxable' as const,
        };

        const result = createAccountSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should validate currency amounts with 2 decimal places', () => {
        const validData = {
          name: 'Test Account',
          type: 'checking' as const,
          balance: 1234.56,
          taxTreatment: 'taxable' as const,
        };

        const result = createAccountSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject amounts with more than 2 decimal places', () => {
        const invalidData = {
          name: 'Test Account',
          type: 'checking' as const,
          balance: 1234.567,
          taxTreatment: 'taxable' as const,
        };

        const result = createAccountSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('createGoalSchema', () => {
      it('should validate correct goal data', () => {
        const validData = {
          name: 'Emergency Fund',
          type: 'emergency_fund' as const,
          targetAmount: 10000,
          targetDate: '2025-12-31T00:00:00Z',
          description: 'Build emergency fund',
          priority: 5,
        };

        const result = createGoalSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject negative target amounts', () => {
        const invalidData = {
          name: 'Test Goal',
          type: 'other' as const,
          targetAmount: -1000,
          targetDate: '2025-12-31T00:00:00Z',
        };

        const result = createGoalSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should validate priority range', () => {
        const invalidData = {
          name: 'Test Goal',
          type: 'other' as const,
          targetAmount: 1000,
          targetDate: '2025-12-31T00:00:00Z',
          priority: 15, // Invalid: max is 10
        };

        const result = createGoalSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('createScenarioSchema', () => {
      it('should validate correct scenario data', () => {
        const validData = {
          name: 'Conservative Scenario',
          description: 'Conservative investment approach',
          assumptions: {
            inflationRate: 2.5,
            marketReturn: 7.0,
            savingsRate: 20.0,
            retirementAge: 65,
            lifeExpectancy: 85,
          },
        };

        const result = createScenarioSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject invalid assumption ranges', () => {
        const invalidData = {
          name: 'Invalid Scenario',
          assumptions: {
            inflationRate: -5, // Invalid: negative
            marketReturn: 100, // Invalid: too high
            savingsRate: 150, // Invalid: over 100%
            retirementAge: 15, // Invalid: too young
            lifeExpectancy: 200, // Invalid: too high
          },
        };

        const result = createScenarioSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Schema Validation Edge Cases', () => {
    it('should validate email format in schemas', () => {
      const validEmail = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePassword123!',
        provider: 'email' as const,
      };

      const invalidEmail = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'SecurePassword123!',
        provider: 'email' as const,
      };

      expect(registerSchema.safeParse(validEmail).success).toBe(true);
      expect(registerSchema.safeParse(invalidEmail).success).toBe(false);
    });

    it('should validate password complexity in schemas', () => {
      const strongPassword = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePassword123!',
        provider: 'email' as const,
      };

      const weakPassword = {
        name: 'John Doe',
        email: 'john@example.com',
        password: '123',
        provider: 'email' as const,
      };

      expect(registerSchema.safeParse(strongPassword).success).toBe(true);
      expect(registerSchema.safeParse(weakPassword).success).toBe(false);
    });

    it('should validate currency amounts in account schema', () => {
      const validAccount = {
        name: 'Test Account',
        type: 'checking' as const,
        balance: 1234.56,
        taxTreatment: 'taxable' as const,
      };

      const invalidAccount = {
        name: 'Test Account',
        type: 'checking' as const,
        balance: 1234.567, // Too many decimal places
        taxTreatment: 'taxable' as const,
      };

      expect(createAccountSchema.safeParse(validAccount).success).toBe(true);
      expect(createAccountSchema.safeParse(invalidAccount).success).toBe(false);
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle null and undefined values', () => {
      const testCases = [
        { schema: registerSchema, data: null },
        { schema: loginSchema, data: undefined },
        { schema: createAccountSchema, data: {} },
      ];

      testCases.forEach(({ schema, data }) => {
        const result = schema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    it('should sanitize string inputs', () => {
      const maliciousData = {
        name: '<script>alert("xss")</script>John',
        email: 'test@example.com',
        password: 'SecurePassword123!',
        provider: 'email' as const,
      };

      const result = registerSchema.safeParse(maliciousData);
      // The schema should reject names with HTML tags
      expect(result.success).toBe(false);
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(1000);

      const invalidData = {
        name: longString,
        email: 'test@example.com',
        password: 'SecurePassword123!',
        provider: 'email' as const,
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate nested object structures', () => {
      const validScenario = {
        name: 'Test Scenario',
        assumptions: {
          inflationRate: 2.5,
          marketReturn: 7.0,
          savingsRate: 20.0,
          retirementAge: 65,
          lifeExpectancy: 85,
        },
      };

      const result = createScenarioSchema.safeParse(validScenario);
      expect(result.success).toBe(true);
    });

    it('should reject incomplete nested objects', () => {
      const invalidScenario = {
        name: 'Test Scenario',
        assumptions: {
          inflationRate: 2.5,
          // Missing required fields
        },
      };

      const result = createScenarioSchema.safeParse(invalidScenario);
      expect(result.success).toBe(false);
    });
  });
});
