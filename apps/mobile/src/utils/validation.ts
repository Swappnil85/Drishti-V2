/**
 * Validation utilities for mobile app
 * Provides client-side validation for forms and user input
 */

/**
 * Validate email address format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
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
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

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
    errors.push('Password cannot contain more than 2 repeated characters in a row');
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
  const criteriaCount = [hasLowercase, hasUppercase, hasNumbers, hasSpecialChars].filter(Boolean).length;
  
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
    errors.push('Name can only contain letters, spaces, hyphens, apostrophes, and periods');
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
export function formatCurrency(amount: number, currency: string = 'USD'): string {
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
  validators: Record<keyof T, (value: any) => { isValid: boolean; errors: string[] }>
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
