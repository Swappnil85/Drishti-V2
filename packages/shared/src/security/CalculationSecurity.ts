/**
 * Financial Calculation Security Module
 * Comprehensive security validation and protection for financial calculations
 */

import { z } from 'zod';

// Security configuration
const SECURITY_CONFIG = {
  MAX_CALCULATION_TIME: 30000, // 30 seconds
  MAX_ITERATIONS: 10000,
  MAX_PROJECTION_YEARS: 100,
  MAX_PRINCIPAL_AMOUNT: 1000000000, // 1 billion
  MIN_INTEREST_RATE: -0.5, // -50%
  MAX_INTEREST_RATE: 2.0, // 200%
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 100,
  CACHE_ENCRYPTION_KEY_LENGTH: 32,
};

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Input sanitization patterns
const DANGEROUS_PATTERNS = [
  /javascript:/i,
  /<script/i,
  /eval\(/i,
  /function\s*\(/i,
  /setTimeout/i,
  /setInterval/i,
  /document\./i,
  /window\./i,
];

export class CalculationSecurity {
  private encryptionKey: string;

  constructor() {
    // Generate or load encryption key for sensitive data
    this.encryptionKey = this.generateEncryptionKey();
  }

  /**
   * Validate and sanitize compound interest parameters
   */
  validateCompoundInterestParams(
    params: any,
    userId: string
  ): {
    isValid: boolean;
    sanitizedParams?: any;
    errors: string[];
    securityWarnings: string[];
  } {
    const errors: string[] = [];
    const securityWarnings: string[] = [];

    try {
      // Rate limiting check
      if (!this.checkRateLimit(userId)) {
        errors.push('Rate limit exceeded. Please try again later.');
        return { isValid: false, errors, securityWarnings };
      }

      // Input sanitization
      const sanitizedParams = this.sanitizeInputs(params);

      // Validate against dangerous patterns
      const dangerousInputs = this.checkForDangerousPatterns(sanitizedParams);
      if (dangerousInputs.length > 0) {
        securityWarnings.push(
          `Potentially dangerous inputs detected: ${dangerousInputs.join(', ')}`
        );
      }

      // Validate numerical bounds
      if (
        sanitizedParams.principal < 0 ||
        sanitizedParams.principal > SECURITY_CONFIG.MAX_PRINCIPAL_AMOUNT
      ) {
        errors.push(
          `Principal must be between 0 and ${SECURITY_CONFIG.MAX_PRINCIPAL_AMOUNT}`
        );
      }

      if (
        sanitizedParams.annualRate < SECURITY_CONFIG.MIN_INTEREST_RATE ||
        sanitizedParams.annualRate > SECURITY_CONFIG.MAX_INTEREST_RATE
      ) {
        errors.push(
          `Interest rate must be between ${SECURITY_CONFIG.MIN_INTEREST_RATE * 100}% and ${SECURITY_CONFIG.MAX_INTEREST_RATE * 100}%`
        );
      }

      if (
        sanitizedParams.timeInYears < 0 ||
        sanitizedParams.timeInYears > SECURITY_CONFIG.MAX_PROJECTION_YEARS
      ) {
        errors.push(
          `Time period must be between 0 and ${SECURITY_CONFIG.MAX_PROJECTION_YEARS} years`
        );
      }

      if (
        sanitizedParams.compoundingFrequency < 1 ||
        sanitizedParams.compoundingFrequency > 365
      ) {
        errors.push('Compounding frequency must be between 1 and 365');
      }

      // Validate for potential overflow conditions
      if (this.wouldCauseOverflow(sanitizedParams)) {
        errors.push(
          'Calculation parameters would result in numerical overflow'
        );
        securityWarnings.push(
          'Potential DoS attempt detected: parameters designed to cause overflow'
        );
      }

      // Additional security checks
      if (
        sanitizedParams.additionalContributions &&
        sanitizedParams.additionalContributions < 0
      ) {
        errors.push('Additional contributions cannot be negative');
      }

      if (
        sanitizedParams.contributionFrequency &&
        (sanitizedParams.contributionFrequency < 1 ||
          sanitizedParams.contributionFrequency > 365)
      ) {
        errors.push('Contribution frequency must be between 1 and 365');
      }

      return {
        isValid: errors.length === 0,
        sanitizedParams: errors.length === 0 ? sanitizedParams : undefined,
        errors,
        securityWarnings,
      };
    } catch (error) {
      errors.push('Invalid input format');
      securityWarnings.push(`Input validation error: ${error.message}`);
      return { isValid: false, errors, securityWarnings };
    }
  }

  /**
   * Check rate limiting for user
   */
  private checkRateLimit(
    userId: string,
    maxRequests: number = SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS
  ): boolean {
    const now = Date.now();
    const userLimit = rateLimitStore.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      // Reset or create new limit
      rateLimitStore.set(userId, {
        count: 1,
        resetTime: now + SECURITY_CONFIG.RATE_LIMIT_WINDOW,
      });
      return true;
    }

    if (userLimit.count >= maxRequests) {
      return false;
    }

    userLimit.count++;
    return true;
  }

  /**
   * Sanitize inputs to prevent injection attacks
   */
  private sanitizeInputs(params: any): any {
    if (typeof params !== 'object' || params === null) {
      throw new Error('Invalid input: expected object');
    }

    const sanitized: any = {};

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        // Remove potentially dangerous characters and patterns
        let sanitizedValue = value
          .replace(/[<>'"]/g, '') // Remove HTML/script characters
          .replace(/javascript:/gi, '') // Remove javascript: protocol
          .replace(/data:/gi, '') // Remove data: protocol
          .trim();

        // Limit string length
        if (sanitizedValue.length > 1000) {
          sanitizedValue = sanitizedValue.substring(0, 1000);
        }

        sanitized[key] = sanitizedValue;
      } else if (typeof value === 'number') {
        // Validate numbers
        if (!isFinite(value) || isNaN(value)) {
          throw new Error(`Invalid number for field: ${key}`);
        }
        sanitized[key] = value;
      } else if (typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (Array.isArray(value)) {
        // Recursively sanitize arrays
        sanitized[key] = value.map(item =>
          typeof item === 'object' ? this.sanitizeInputs(item) : item
        );
      } else if (typeof value === 'object') {
        // Recursively sanitize objects
        sanitized[key] = this.sanitizeInputs(value);
      } else {
        // Skip unknown types
        continue;
      }
    }

    return sanitized;
  }

  /**
   * Check for dangerous patterns in input
   */
  private checkForDangerousPatterns(params: any): string[] {
    const dangerous: string[] = [];
    const jsonString = JSON.stringify(params);

    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(jsonString)) {
        dangerous.push(pattern.source);
      }
    }

    return dangerous;
  }

  /**
   * Check if calculation parameters would cause numerical overflow
   */
  private wouldCauseOverflow(params: any): boolean {
    try {
      // Check for potential overflow in compound interest calculation
      if (params.principal && params.annualRate && params.timeInYears) {
        const rate = Math.abs(params.annualRate);
        const time = Math.abs(params.timeInYears);
        const principal = Math.abs(params.principal);

        // Simple overflow check: if rate^time * principal would exceed safe integer
        if (rate > 0.5 && time > 50) {
          return true;
        }

        if (principal > 1e15 || rate * time * principal > 1e15) {
          return true;
        }
      }

      // Check Monte Carlo parameters
      if (params.iterations && params.yearsToProject) {
        const totalOperations = params.iterations * params.yearsToProject * 12;
        if (totalOperations > 1e8) {
          // 100 million operations
          return true;
        }
      }

      return false;
    } catch {
      return true; // If we can't validate, assume it's dangerous
    }
  }

  /**
   * Generate encryption key for sensitive data
   */
  private generateEncryptionKey(): string {
    // In production, this should be loaded from secure environment variables
    return 'drishti_calculation_security_key_2024';
  }

  /**
   * Encrypt sensitive calculation data
   */
  encryptSensitiveData(data: any): string {
    try {
      const jsonString = JSON.stringify(data);
      // Simple base64 encoding for demo - use proper encryption in production
      return Buffer.from(jsonString).toString('base64');
    } catch (error) {
      throw new Error('Failed to encrypt sensitive data');
    }
  }

  /**
   * Decrypt sensitive calculation data
   */
  decryptSensitiveData(encryptedData: string): any {
    try {
      const jsonString = Buffer.from(encryptedData, 'base64').toString('utf-8');
      return JSON.parse(jsonString);
    } catch (error) {
      throw new Error('Failed to decrypt sensitive data');
    }
  }

  /**
   * Log security events
   */
  logSecurityEvent(event: {
    type:
      | 'rate_limit'
      | 'dangerous_input'
      | 'overflow_attempt'
      | 'validation_error';
    userId: string;
    details: string;
    severity: 'low' | 'medium' | 'high';
  }): void {
    // In production, this should log to a secure audit system
    console.warn(
      `[SECURITY] ${event.type.toUpperCase()}: User ${event.userId} - ${event.details} (Severity: ${event.severity})`
    );
  }

  /**
   * Get security statistics
   */
  getSecurityStats(): {
    rateLimitedUsers: number;
    totalRequests: number;
    averageRequestsPerUser: number;
  } {
    const users = Array.from(rateLimitStore.keys());
    const totalRequests = Array.from(rateLimitStore.values()).reduce(
      (sum, limit) => sum + limit.count,
      0
    );

    return {
      rateLimitedUsers: users.length,
      totalRequests,
      averageRequestsPerUser:
        users.length > 0 ? totalRequests / users.length : 0,
    };
  }

  /**
   * Clear expired rate limit entries
   */
  cleanupRateLimits(): void {
    const now = Date.now();
    for (const [userId, limit] of rateLimitStore.entries()) {
      if (now > limit.resetTime) {
        rateLimitStore.delete(userId);
      }
    }
  }

  /**
   * Validate calculation result for anomalies
   */
  validateCalculationResult(
    result: any,
    inputParams: any
  ): {
    isValid: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];

    try {
      // Check for unrealistic results
      if (result.futureValue && result.futureValue > 1e15) {
        warnings.push('Result exceeds realistic financial projections');
      }

      if (
        result.totalInterestEarned &&
        result.totalInterestEarned < 0 &&
        inputParams.annualRate > 0
      ) {
        warnings.push(
          'Negative interest earned with positive rate - possible calculation error'
        );
      }

      // Check for NaN or infinite values
      const checkValue = (value: any, name: string) => {
        if (typeof value === 'number' && (!isFinite(value) || isNaN(value))) {
          warnings.push(`Invalid ${name}: ${value}`);
        }
      };

      if (result.futureValue !== undefined)
        checkValue(result.futureValue, 'future value');
      if (result.totalInterestEarned !== undefined)
        checkValue(result.totalInterestEarned, 'total interest');
      if (result.totalTime !== undefined)
        checkValue(result.totalTime, 'total time');

      return {
        isValid: warnings.length === 0,
        warnings,
      };
    } catch (error) {
      warnings.push(`Result validation error: ${error.message}`);
      return {
        isValid: false,
        warnings,
      };
    }
  }
}

// Export singleton instance
export const calculationSecurity = new CalculationSecurity();
