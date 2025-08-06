/**
 * Format date to ISO string
 */
export const formatDate = (date: Date): string => {
  return date.toISOString();
};

/**
 * Generate UUID v4
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Capitalize first letter of string
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Truncate string to specified length
 */
export const truncate = (str: string, length: number): string => {
  return str.length > length ? str.substring(0, length) + '...' : str;
};

/**
 * Financial Calculation Utilities
 */

/**
 * Calculate compound interest with regular contributions
 */
export const calculateCompoundInterest = (
  principal: number,
  annualRate: number,
  compoundingFrequency: number,
  timeInYears: number,
  additionalContributions: number = 0,
  contributionFrequency: number = 12,
  contributionTiming: 'beginning' | 'end' = 'end'
): number => {
  if (principal < 0 || timeInYears <= 0 || compoundingFrequency <= 0) {
    throw new Error('Invalid parameters for compound interest calculation');
  }

  const periodsPerYear = compoundingFrequency;
  const totalPeriods = timeInYears * periodsPerYear;
  const ratePerPeriod = annualRate / periodsPerYear;

  // Future value of principal
  const futureValuePrincipal =
    principal * Math.pow(1 + ratePerPeriod, totalPeriods);

  // Future value of contributions
  let futureValueContributions = 0;
  if (additionalContributions > 0) {
    const contributionPerPeriod =
      additionalContributions * (contributionFrequency / periodsPerYear);
    const timingMultiplier =
      contributionTiming === 'beginning' ? 1 + ratePerPeriod : 1;

    if (ratePerPeriod === 0) {
      futureValueContributions =
        contributionPerPeriod * totalPeriods * timingMultiplier;
    } else {
      futureValueContributions =
        contributionPerPeriod *
        ((Math.pow(1 + ratePerPeriod, totalPeriods) - 1) / ratePerPeriod) *
        timingMultiplier;
    }
  }

  return futureValuePrincipal + futureValueContributions;
};

/**
 * Calculate future value with detailed breakdown
 */
export const calculateFutureValue = (
  principal: number,
  monthlyContribution: number,
  annualRate: number,
  years: number
): {
  futureValue: number;
  totalContributions: number;
  totalInterest: number;
} => {
  const monthlyRate = annualRate / 12;
  const totalMonths = years * 12;
  const totalContributions = monthlyContribution * totalMonths;

  // Future value of principal
  const fvPrincipal = principal * Math.pow(1 + monthlyRate, totalMonths);

  // Future value of annuity (monthly contributions)
  let fvAnnuity = 0;
  if (monthlyContribution > 0 && monthlyRate > 0) {
    fvAnnuity =
      monthlyContribution *
      ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
  } else if (monthlyContribution > 0) {
    fvAnnuity = monthlyContribution * totalMonths;
  }

  const futureValue = fvPrincipal + fvAnnuity;
  const totalInterest = futureValue - principal - totalContributions;

  return {
    futureValue,
    totalContributions,
    totalInterest,
  };
};

/**
 * Calculate present value
 */
export const calculatePresentValue = (
  futureValue: number,
  annualRate: number,
  years: number
): number => {
  if (annualRate <= 0 || years <= 0) {
    throw new Error('Invalid parameters for present value calculation');
  }

  return futureValue / Math.pow(1 + annualRate, years);
};

/**
 * Calculate annuity payment (PMT function)
 */
export const calculateAnnuityPayment = (
  presentValue: number,
  annualRate: number,
  numberOfPayments: number
): number => {
  if (annualRate === 0) {
    return presentValue / numberOfPayments;
  }

  const monthlyRate = annualRate / 12;
  return (
    (presentValue * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
  );
};

/**
 * Calculate FIRE number using the 4% rule
 */
export const calculateFIRENumber = (
  annualExpenses: number,
  withdrawalRate: number = 0.04
): number => {
  if (withdrawalRate <= 0 || withdrawalRate > 0.1) {
    throw new Error('Withdrawal rate must be between 0% and 10%');
  }

  return annualExpenses / withdrawalRate;
};

/**
 * Calculate Coast FIRE amount
 */
export const calculateCoastFIRE = (
  currentAge: number,
  targetAge: number,
  currentSavings: number,
  expectedReturn: number
): number => {
  const yearsToGrow = targetAge - currentAge;
  if (yearsToGrow <= 0) {
    throw new Error('Target age must be greater than current age');
  }

  return currentSavings * Math.pow(1 + expectedReturn, yearsToGrow);
};

/**
 * Calculate years to reach FIRE
 */
export const calculateYearsToFIRE = (
  currentSavings: number,
  monthlyContribution: number,
  fireNumber: number,
  expectedReturn: number
): number => {
  if (monthlyContribution <= 0) {
    return Infinity;
  }

  const monthlyRate = expectedReturn / 12;
  const remainingAmount = fireNumber - currentSavings;

  if (remainingAmount <= 0) {
    return 0;
  }

  if (monthlyRate === 0) {
    return remainingAmount / monthlyContribution / 12;
  }

  // Using the formula for future value of annuity
  const months =
    Math.log(1 + (remainingAmount * monthlyRate) / monthlyContribution) /
    Math.log(1 + monthlyRate);

  return Math.max(0, months / 12);
};

/**
 * Calculate debt payoff time
 */
export const calculateDebtPayoffTime = (
  balance: number,
  payment: number,
  interestRate: number
): number => {
  if (payment <= 0 || balance <= 0) {
    return 0;
  }

  const monthlyRate = interestRate / 12;

  if (monthlyRate === 0) {
    return Math.ceil(balance / payment);
  }

  // Check if payment covers interest
  const monthlyInterest = balance * monthlyRate;
  if (payment <= monthlyInterest) {
    return Infinity; // Payment doesn't cover interest
  }

  const months =
    -Math.log(1 - (balance * monthlyRate) / payment) /
    Math.log(1 + monthlyRate);
  return Math.ceil(Math.max(1, months));
};

/**
 * Generate normal random number using Box-Muller transform
 */
export const generateNormalRandom = (
  mean: number = 0,
  stdDev: number = 1
): number => {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();

  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdDev + mean;
};

/**
 * Calculate percentile from sorted array
 */
export const calculatePercentile = (
  sortedArray: number[],
  percentile: number
): number => {
  if (sortedArray.length === 0) return 0;
  if (percentile <= 0) return sortedArray[0];
  if (percentile >= 100) return sortedArray[sortedArray.length - 1];

  const index = (percentile / 100) * (sortedArray.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) {
    return sortedArray[lower];
  }

  const weight = index - lower;
  return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
};

/**
 * Format currency amount
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
};

/**
 * Format percentage
 */
export const formatPercentage = (
  value: number,
  decimals: number = 2
): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Calculate effective annual rate
 */
export const calculateEffectiveAnnualRate = (
  nominalRate: number,
  compoundingFrequency: number
): number => {
  return (
    Math.pow(1 + nominalRate / compoundingFrequency, compoundingFrequency) - 1
  );
};

/**
 * Calculate real return (inflation-adjusted)
 */
export const calculateRealReturn = (
  nominalReturn: number,
  inflationRate: number
): number => {
  return (1 + nominalReturn) / (1 + inflationRate) - 1;
};
