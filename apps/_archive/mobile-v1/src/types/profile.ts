/**
 * Profile Types
 * Type definitions for user profile and related data
 */

export interface PersonalInformation {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth: string;
  profilePicture?: string;
  profilePictureMetadata?: ProfilePictureMetadata;
  emergencyContact?: EmergencyContact;
  twoFactorEnabled?: boolean;
  twoFactorBackupCodes?: string[];
}

export interface ProfilePictureMetadata {
  originalSize: number;
  compressedSize: number;
  dimensions: { width: number; height: number };
  uploadedAt: number;
  format: 'jpeg' | 'png' | 'webp';
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface BulkImportData {
  accounts: BulkAccountData[];
  importedAt: number;
  source: 'csv' | 'manual';
  validationErrors: string[];
}

export interface BulkAccountData {
  accountName: string;
  accountType: string;
  balance: number;
  currency: string;
  lastUpdated?: string;
}

export interface PrivacyDashboard {
  dataCollected: DataCollectionInfo[];
  dataUsage: DataUsageInfo[];
  thirdPartySharing: ThirdPartyInfo[];
  retentionPolicy: RetentionPolicyInfo;
  userRights: UserRightsInfo;
}

export interface DataCollectionInfo {
  category: string;
  description: string;
  purpose: string;
  frequency: string;
  enabled: boolean;
  required: boolean;
}

export interface DataUsageInfo {
  purpose: string;
  description: string;
  dataTypes: string[];
  frequency: string;
}

export interface ThirdPartyInfo {
  name: string;
  purpose: string;
  dataShared: string[];
  privacyPolicy: string;
  enabled: boolean;
}

export interface RetentionPolicyInfo {
  category: string;
  retentionPeriod: number; // in days
  deletionMethod: string;
  exceptions: string[];
}

export interface UserRightsInfo {
  canExport: boolean;
  canDelete: boolean;
  canCorrect: boolean;
  canRestrict: boolean;
  canPortability: boolean;
}

export interface FinancialInformation {
  // Basic Information
  age: number;
  currentSavings: number;
  desiredRetirementAge: number;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';

  // Income Sources
  primaryIncome: IncomeSource;
  additionalIncomes: IncomeSource[];
  totalAnnualIncome: number;

  // Expenses
  monthlyExpenses: number;
  annualExpenses: number;
  expenseCategories: ExpenseCategory[];

  // Calculated Values
  savingsRate: number;
  fireNumber: number;
  yearsToFire: number;
  monthlyRequiredSavings: number;
}

export interface IncomeSource {
  id: string;
  type: 'salary' | 'freelance' | 'investment' | 'business' | 'rental' | 'other';
  description: string;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'annually';
  taxable: boolean;
  active: boolean;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  type: 'fixed' | 'variable' | 'discretionary';
  essential: boolean;
}

export interface RegionalSettings {
  country: string;
  currency: string;
  taxSystem: string;
  retirementSystem: string;
  exchangeRate?: number;
  lastUpdated?: number;
}

export interface SecuritySettings {
  biometricEnabled: boolean;
  pinEnabled: boolean;
  twoFactorEnabled: boolean;
  sessionTimeout: number; // in minutes
  autoLockEnabled: boolean;
  localOnlyMode: boolean;
  cloudSyncEnabled: boolean;
  lastPasswordChange?: number;
  securityQuestions?: SecurityQuestion[];
}

export interface SecurityQuestion {
  id: string;
  question: string;
  answer: string; // encrypted
}

export interface PrivacySettings {
  analyticsEnabled: boolean;
  crashReportingEnabled: boolean;
  performanceDataEnabled: boolean;
  marketingEmailsEnabled: boolean;
  dataRetentionPeriod: number; // in days
  gdprCompliant: boolean;
}

export interface SecurityEvent {
  id: string;
  type:
    | 'login'
    | 'logout'
    | 'failed_login'
    | 'password_change'
    | 'settings_change'
    | 'data_export';
  timestamp: number;
  deviceInfo: string;
  ipAddress?: string;
  location?: string;
  success: boolean;
  details?: string;
}

export interface UserProfile {
  id: string;
  personalInfo: PersonalInformation;
  financialInfo: FinancialInformation;
  regionalSettings: RegionalSettings;
  securitySettings: SecuritySettings;
  privacySettings: PrivacySettings;
  securityEvents: SecurityEvent[];
  createdAt: number;
  updatedAt: number;
  version: number;
}

export interface ProfileChangeHistory {
  id: string;
  userId: string;
  field: string;
  oldValue: any;
  newValue: any;
  timestamp: number;
  reason?: string;
  deviceInfo: string;
}

export interface PersonalizedRecommendation {
  id: string;
  type:
    | 'savings_rate'
    | 'investment_allocation'
    | 'expense_reduction'
    | 'income_increase'
    | 'goal_adjustment'
    | 'milestone'
    | 'risk_adjustment';
  title: string;
  description: string;
  rationale: string;
  actionSteps: string[];
  impact: {
    timeToFire?: number;
    additionalSavings?: number;
    riskReduction?: number;
    confidenceIncrease?: number;
  };
  priority: 'low' | 'medium' | 'high';
  confidence: number; // 0-1
  mlScore?: number; // ML model confidence score
  peerComparison?: PeerComparison;
  marketConditions?: MarketConditionData;
  createdAt: number;
  expiresAt?: number;
  accepted?: boolean;
  dismissed?: boolean;
  feedback?: string;
  implementationTracking?: ImplementationTracking;
}

export interface PeerComparison {
  userPercentile: number; // 0-100
  averageValue: number;
  topPercentileValue: number;
  category: string;
  sampleSize: number;
  anonymous: boolean;
}

export interface MarketConditionData {
  marketTrend: 'bull' | 'bear' | 'neutral';
  volatilityIndex: number;
  recommendedAdjustment: string;
  confidenceLevel: number;
  lastUpdated: number;
}

export interface ImplementationTracking {
  started: boolean;
  startedAt?: number;
  progress: number; // 0-1
  milestones: ImplementationMilestone[];
  estimatedCompletion?: number;
}

export interface ImplementationMilestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: number;
  dueDate?: number;
}

export interface RecommendationEngine {
  userId: string;
  lastAnalysis: number;
  recommendations: PersonalizedRecommendation[];
  userBehavior: UserBehaviorData;
  mlModel?: {
    version: string;
    accuracy: number;
    lastTrained: number;
  };
}

export interface UserBehaviorData {
  loginFrequency: number;
  featuresUsed: string[];
  goalsAchieved: number;
  recommendationsAccepted: number;
  recommendationsDismissed: number;
  averageSessionDuration: number;
  preferredActions: string[];
}

export interface ProfileValidationRules {
  age: { min: number; max: number };
  income: { min: number; max: number };
  savings: { min: number; max: number };
  expenses: { min: number; max: number };
  retirementAge: { min: number; max: number };
  savingsRate: { min: number; max: number };
}

export interface ProfileExportData {
  profile: UserProfile;
  changeHistory: ProfileChangeHistory[];
  recommendations: PersonalizedRecommendation[];
  securityEvents: SecurityEvent[];
  exportedAt: number;
  format: 'json' | 'csv';
  requestedBy: string;
}

// Utility types
export type ProfileField = keyof UserProfile;
export type FinancialField = keyof FinancialInformation;
export type SecurityField = keyof SecuritySettings;
export type PrivacyField = keyof PrivacySettings;

// Form types
export interface ProfileFormData {
  personalInfo: Partial<PersonalInformation>;
  financialInfo: Partial<FinancialInformation>;
  regionalSettings: Partial<RegionalSettings>;
}

export interface SecurityFormData {
  securitySettings: Partial<SecuritySettings>;
  privacySettings: Partial<PrivacySettings>;
}

// API types
export interface UpdateProfileRequest {
  field: string;
  value: any;
  reason?: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  profile: UserProfile;
  changeId: string;
  recommendations?: PersonalizedRecommendation[];
}

export interface GetRecommendationsRequest {
  userId: string;
  types?: string[];
  limit?: number;
}

export interface GetRecommendationsResponse {
  recommendations: PersonalizedRecommendation[];
  lastAnalysis: number;
  nextAnalysis: number;
}

// Constants
export const DEFAULT_PROFILE_VALIDATION_RULES: ProfileValidationRules = {
  age: { min: 18, max: 100 },
  income: { min: 0, max: 10000000 },
  savings: { min: 0, max: 100000000 },
  expenses: { min: 0, max: 1000000 },
  retirementAge: { min: 30, max: 100 },
  savingsRate: { min: 0, max: 1 },
};

export const EXPENSE_CATEGORIES = [
  { name: 'Housing', type: 'fixed', essential: true },
  { name: 'Transportation', type: 'fixed', essential: true },
  { name: 'Food', type: 'variable', essential: true },
  { name: 'Utilities', type: 'fixed', essential: true },
  { name: 'Insurance', type: 'fixed', essential: true },
  { name: 'Healthcare', type: 'variable', essential: true },
  { name: 'Entertainment', type: 'discretionary', essential: false },
  { name: 'Shopping', type: 'discretionary', essential: false },
  { name: 'Travel', type: 'discretionary', essential: false },
  { name: 'Education', type: 'variable', essential: false },
  { name: 'Savings', type: 'fixed', essential: true },
  { name: 'Other', type: 'variable', essential: false },
] as const;

export const INCOME_TYPES = [
  { type: 'salary', label: 'Salary/Wages', taxable: true },
  { type: 'freelance', label: 'Freelance/Contract', taxable: true },
  { type: 'investment', label: 'Investment Income', taxable: true },
  { type: 'business', label: 'Business Income', taxable: true },
  { type: 'rental', label: 'Rental Income', taxable: true },
  { type: 'other', label: 'Other Income', taxable: true },
] as const;

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
] as const;
