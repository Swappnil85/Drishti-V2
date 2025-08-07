/**
 * Comprehensive Validation utilities for Drishti mobile app
 * Provides client-side validation for forms and user input with detailed feedback
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface FieldValidationResult extends ValidationResult {
  field: string;
  value: any;
}

export interface FormValidationResult {
  isValid: boolean;
  fields: Record<string, FieldValidationResult>;
  globalErrors?: string[];
}

/**
 * Enhanced email validation with detailed feedback
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!email) {
    errors.push('Email is required');
    return { isValid: false, errors, warnings };
  }

  const trimmedEmail = email.trim().toLowerCase();

  // Basic format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    errors.push('Please enter a valid email address');
  }

  // Length validation
  if (trimmedEmail.length < 5) {
    errors.push('Email must be at least 5 characters');
  }
  if (trimmedEmail.length > 254) {
    errors.push('Email must not exceed 254 characters');
  }

  // Domain validation
  const domain = trimmedEmail.split('@')[1];
  if (domain) {
    if (
      domain.startsWith('.') ||
      domain.endsWith('.') ||
      domain.includes('..')
    ) {
      errors.push('Invalid email domain');
    }

    // Common typos warning
    const commonDomains = [
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
    ];
    const similarDomains = [
      'gmial.com',
      'gmai.com',
      'yahooo.com',
      'hotmial.com',
    ];

    if (similarDomains.includes(domain)) {
      warnings.push('Did you mean one of the common email providers?');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Simple email validation for backward compatibility
 */
export function validateEmailSimple(email: string): boolean {
  const result = validateEmail(email);
  return result.isValid;
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
} {
  const errors: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';

  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (password.length > 128) {
    errors.push('Password must be less than 128 characters long');
  }

  // Character type checks
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
    password
  );

  if (!hasLowercase) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!hasUppercase) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!hasNumbers) {
    errors.push('Password must contain at least one number');
  }

  if (!hasSpecialChars) {
    errors.push('Password must contain at least one special character');
  }

  // Repeated characters check
  if (/(.)\1{2,}/.test(password)) {
    errors.push(
      'Password cannot contain more than 2 repeated characters in a row'
    );
  }

  // Common patterns check
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /admin/i,
  ];

  if (commonPatterns.some(pattern => pattern.test(password))) {
    errors.push('Password contains common patterns and is not secure');
  }

  // Determine strength
  const criteriaCount = [
    hasLowercase,
    hasUppercase,
    hasNumbers,
    hasSpecialChars,
  ].filter(Boolean).length;

  if (password.length >= 12 && criteriaCount === 4) {
    strength = 'strong';
  } else if (password.length >= 8 && criteriaCount >= 3) {
    strength = 'medium';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Validate name format
 */
export function validateName(name: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const trimmedName = name.trim();

  if (!trimmedName) {
    errors.push('Name is required');
  } else if (trimmedName.length < 2) {
    errors.push('Name must be at least 2 characters long');
  } else if (trimmedName.length > 100) {
    errors.push('Name must be less than 100 characters long');
  }

  // Check for invalid characters
  if (!/^[a-zA-Z\s\-'\.]+$/.test(trimmedName)) {
    errors.push(
      'Name can only contain letters, spaces, hyphens, apostrophes, and periods'
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phone: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const cleanPhone = phone.replace(/\D/g, ''); // Remove non-digits

  if (!cleanPhone) {
    errors.push('Phone number is required');
  } else if (cleanPhone.length < 10) {
    errors.push('Phone number must be at least 10 digits');
  } else if (cleanPhone.length > 15) {
    errors.push('Phone number must be less than 15 digits');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate financial amount
 */
export function validateAmount(amount: string | number): {
  isValid: boolean;
  errors: string[];
  value: number;
} {
  const errors: string[] = [];
  let numericValue: number;

  if (typeof amount === 'string') {
    // Remove currency symbols and commas
    const cleanAmount = amount.replace(/[$,\s]/g, '');
    numericValue = parseFloat(cleanAmount);
  } else {
    numericValue = amount;
  }

  if (isNaN(numericValue)) {
    errors.push('Please enter a valid amount');
  } else if (numericValue < 0) {
    errors.push('Amount cannot be negative');
  } else if (numericValue > 999999999999.99) {
    errors.push('Amount exceeds maximum allowed value');
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: numericValue || 0,
  };
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function validateDate(dateString: string): {
  isValid: boolean;
  errors: string[];
  date: Date | null;
} {
  const errors: string[] = [];
  let dateObject: Date | null = null;

  if (!dateString) {
    errors.push('Date is required');
  } else {
    // Check format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      errors.push('Date must be in YYYY-MM-DD format');
    } else {
      dateObject = new Date(dateString);

      // Check if date is valid
      if (isNaN(dateObject.getTime())) {
        errors.push('Please enter a valid date');
        dateObject = null;
      } else {
        // Check if date is not too far in the past or future
        const today = new Date();
        const minDate = new Date(today.getFullYear() - 100, 0, 1);
        const maxDate = new Date(today.getFullYear() + 100, 11, 31);

        if (dateObject < minDate || dateObject > maxDate) {
          errors.push('Date must be within a reasonable range');
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    date: dateObject,
  };
}

/**
 * Validate account name
 */
export function validateAccountName(name: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const trimmedName = name.trim();

  if (!trimmedName) {
    errors.push('Account name is required');
  } else if (trimmedName.length < 2) {
    errors.push('Account name must be at least 2 characters long');
  } else if (trimmedName.length > 100) {
    errors.push('Account name must be less than 100 characters long');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate goal name
 */
export function validateGoalName(name: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const trimmedName = name.trim();

  if (!trimmedName) {
    errors.push('Goal name is required');
  } else if (trimmedName.length < 2) {
    errors.push('Goal name must be at least 2 characters long');
  } else if (trimmedName.length > 100) {
    errors.push('Goal name must be less than 100 characters long');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Format currency amount for display
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD'
): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Parse currency string to number
 */
export function parseCurrency(currencyString: string): number {
  const cleanString = currencyString.replace(/[$,\s]/g, '');
  const number = parseFloat(cleanString);
  return isNaN(number) ? 0 : number;
}

/**
 * Validate form data generically
 */
export function validateForm<T extends Record<string, any>>(
  data: T,
  validators: Record<
    keyof T,
    (value: any) => { isValid: boolean; errors: string[] }
  >
): {
  isValid: boolean;
  errors: Record<keyof T, string[]>;
} {
  const errors: Record<keyof T, string[]> = {} as Record<keyof T, string[]>;
  let isValid = true;

  for (const [field, validator] of Object.entries(validators)) {
    const result = validator(data[field as keyof T]);
    if (!result.isValid) {
      errors[field as keyof T] = result.errors;
      isValid = false;
    }
  }

  return { isValid, errors };
}

/**
 * Enhanced form validation with detailed feedback
 */
export function validateFormEnhanced<T extends Record<string, any>>(
  data: T,
  validators: Record<keyof T, (value: any) => ValidationResult>
): FormValidationResult {
  const fields: Record<string, FieldValidationResult> = {};
  let isValid = true;

  for (const [field, validator] of Object.entries(validators)) {
    const result = validator(data[field as keyof T]);
    fields[field] = {
      field,
      value: data[field as keyof T],
      ...result,
    };
    if (!result.isValid) {
      isValid = false;
    }
  }

  return { isValid, fields };
}

/**
 * Validate PIN with security checks
 */
export function validatePIN(pin: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!pin) {
    errors.push('PIN is required');
    return { isValid: false, errors };
  }

  if (pin.length !== 6) {
    errors.push('PIN must be exactly 6 digits');
  }

  if (!/^\d+$/.test(pin)) {
    errors.push('PIN must contain only numbers');
  }

  // Check for weak patterns
  if (/(\d)\1{5}/.test(pin)) {
    errors.push('PIN cannot be all the same digit');
  }

  if (/123456|654321|111111|000000/.test(pin)) {
    errors.push('PIN is too simple');
  }

  // Check for sequential patterns
  if (
    /012345|123456|234567|345678|456789|567890/.test(pin) ||
    /987654|876543|765432|654321|543210|432109/.test(pin)
  ) {
    warnings.push('Avoid sequential numbers for better security');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate future date (for goals)
 */
export function validateFutureDate(dateString: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!dateString) {
    errors.push('Date is required');
    return { isValid: false, errors };
  }

  const date = new Date(dateString);
  const now = new Date();

  if (isNaN(date.getTime())) {
    errors.push('Invalid date format');
    return { isValid: false, errors };
  }

  if (date <= now) {
    errors.push('Date must be in the future');
  }

  // Warning for dates too far in the future
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 50);

  if (date > maxDate) {
    warnings.push('Date is very far in the future');
  }

  // Warning for dates too soon
  const minDate = new Date();
  minDate.setMonth(minDate.getMonth() + 1);

  if (date < minDate) {
    warnings.push('Goal date is very soon');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate goal with comprehensive checks
 */
export function validateGoalEnhanced(goal: {
  name: string;
  targetAmount: string | number;
  targetDate: string;
  existingNames?: string[];
}): FormValidationResult {
  const fields: Record<string, FieldValidationResult> = {};

  // Validate name
  const nameResult = validateGoalName(goal.name);
  if (
    goal.existingNames &&
    goal.existingNames.some(
      existing => existing.toLowerCase() === goal.name.toLowerCase()
    )
  ) {
    nameResult.errors.push('A goal with this name already exists');
    nameResult.isValid = false;
  }

  fields.name = {
    field: 'name',
    value: goal.name,
    ...nameResult,
  };

  // Validate target amount
  const amountResult = validateAmount(goal.targetAmount);
  const numericAmount =
    typeof goal.targetAmount === 'string'
      ? parseFloat(goal.targetAmount)
      : goal.targetAmount;

  if (amountResult.isValid && !isNaN(numericAmount) && numericAmount <= 0) {
    amountResult.errors.push('Goal amount must be positive');
    amountResult.isValid = false;
  }

  fields.targetAmount = {
    field: 'targetAmount',
    value: goal.targetAmount,
    isValid: amountResult.isValid,
    errors: amountResult.errors,
  };

  // Validate target date
  const dateResult = validateFutureDate(goal.targetDate);
  fields.targetDate = {
    field: 'targetDate',
    value: goal.targetDate,
    ...dateResult,
  };

  const isValid = Object.values(fields).every(field => field.isValid);

  return {
    isValid,
    fields,
  };
}

/**
 * Real-time validation for React components
 */
export function createValidator<T extends Record<string, any>>(
  validationRules: Record<keyof T, (value: any) => ValidationResult>
) {
  return {
    validateField: (field: keyof T, value: any): FieldValidationResult => {
      const rule = validationRules[field];
      const result = rule ? rule(value) : { isValid: true, errors: [] };

      return {
        field: field as string,
        value,
        ...result,
      };
    },

    validateAll: (data: T): FormValidationResult => {
      return validateFormEnhanced(data, validationRules);
    },
  };
}

/**
 * Sanitize input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

/**
 * Enhanced sanitization for scenario data
 */
export function sanitizeScenarioInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/script/gi, '') // Remove script references
    .substring(0, 1000); // Limit length
}

/**
 * Validate scenario name with security checks
 */
export function validateScenarioName(name: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!name || name.trim().length === 0) {
    errors.push('Scenario name is required');
    return { isValid: false, errors, warnings };
  }

  const sanitizedName = sanitizeScenarioInput(name);

  if (sanitizedName.length < 2) {
    errors.push('Scenario name must be at least 2 characters long');
  }

  if (sanitizedName.length > 100) {
    errors.push('Scenario name must be less than 100 characters');
  }

  // Check for potentially malicious patterns
  const suspiciousPatterns = [
    /script/i,
    /javascript/i,
    /vbscript/i,
    /onload/i,
    /onerror/i,
    /eval\(/i,
    /expression\(/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(name)) {
      errors.push('Scenario name contains invalid characters');
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate financial assumptions with comprehensive checks
 */
export function validateFinancialAssumptions(
  assumptions: any
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!assumptions || typeof assumptions !== 'object') {
    return { isValid: true, errors, warnings }; // Assumptions are optional
  }

  // Validate inflation rate
  if (assumptions.inflation_rate !== undefined) {
    const rate = parseFloat(assumptions.inflation_rate);
    if (isNaN(rate) || !isFinite(rate)) {
      errors.push('Invalid inflation rate');
    } else if (rate < 0 || rate > 0.2) {
      errors.push('Inflation rate must be between 0% and 20%');
    } else if (rate > 0.1) {
      warnings.push('High inflation rate detected. Consider using 2-4%.');
    }
  }

  // Validate market return
  if (assumptions.market_return !== undefined) {
    const rate = parseFloat(assumptions.market_return);
    if (isNaN(rate) || !isFinite(rate)) {
      errors.push('Invalid market return rate');
    } else if (rate < 0 || rate > 0.3) {
      errors.push('Market return must be between 0% and 30%');
    } else if (rate > 0.15) {
      warnings.push('Very high market return. Historical average is 7-10%.');
    }
  }

  // Validate savings rate
  if (assumptions.savings_rate !== undefined) {
    const rate = parseFloat(assumptions.savings_rate);
    if (isNaN(rate) || !isFinite(rate)) {
      errors.push('Invalid savings rate');
    } else if (rate < 0 || rate > 1) {
      errors.push('Savings rate must be between 0% and 100%');
    } else if (rate > 0.7) {
      warnings.push('Very high savings rate. Ensure this is sustainable.');
    }
  }

  // Validate retirement age
  if (assumptions.retirement_age !== undefined) {
    const age = parseInt(assumptions.retirement_age);
    if (isNaN(age)) {
      errors.push('Invalid retirement age');
    } else if (age < 40 || age > 80) {
      warnings.push('Retirement age should be between 40 and 80');
    }
  }

  // Validate life expectancy
  if (assumptions.life_expectancy !== undefined) {
    const age = parseInt(assumptions.life_expectancy);
    if (isNaN(age)) {
      errors.push('Invalid life expectancy');
    } else if (age < 70 || age > 100) {
      warnings.push('Life expectancy should be between 70 and 100');
    }
  }

  // Cross-validation: retirement age vs life expectancy
  if (assumptions.retirement_age && assumptions.life_expectancy) {
    const retirementAge = parseInt(assumptions.retirement_age);
    const lifeExpectancy = parseInt(assumptions.life_expectancy);

    if (!isNaN(retirementAge) && !isNaN(lifeExpectancy)) {
      if (retirementAge >= lifeExpectancy) {
        errors.push('Retirement age should be less than life expectancy');
      }

      const retirementYears = lifeExpectancy - retirementAge;
      if (retirementYears < 5) {
        warnings.push(
          'Very short retirement period. Consider adjusting assumptions.'
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate scenario tags
 */
export function validateScenarioTags(tags: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!tags) {
    return { isValid: true, errors, warnings }; // Tags are optional
  }

  if (!Array.isArray(tags)) {
    errors.push('Tags must be an array');
    return { isValid: false, errors, warnings };
  }

  if (tags.length > 10) {
    errors.push('Maximum 10 tags allowed');
  }

  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i];
    if (typeof tag !== 'string') {
      errors.push(`Tag ${i + 1} must be a string`);
      continue;
    }

    const sanitizedTag = sanitizeScenarioInput(tag);
    if (sanitizedTag.length === 0) {
      errors.push(`Tag ${i + 1} cannot be empty`);
    } else if (sanitizedTag.length > 20) {
      errors.push(`Tag ${i + 1} must be less than 20 characters`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Rate limiting check for scenario operations
 */
export function checkScenarioRateLimit(
  userId: string,
  action: string
): boolean {
  const key = `${userId}:scenario:${action}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = action === 'create' ? 5 : 20; // Stricter limit for creation

  // Simple in-memory rate limiting (would use Redis in production)
  if (typeof global !== 'undefined') {
    if (!global.scenarioRateLimitStore) {
      global.scenarioRateLimitStore = new Map();
    }

    const requests = global.scenarioRateLimitStore.get(key) || [];
    const recentRequests = requests.filter(
      (timestamp: number) => now - timestamp < windowMs
    );

    if (recentRequests.length >= maxRequests) {
      return false; // Rate limit exceeded
    }

    recentRequests.push(now);
    global.scenarioRateLimitStore.set(key, recentRequests);
  }

  return true; // Rate limit OK
}
