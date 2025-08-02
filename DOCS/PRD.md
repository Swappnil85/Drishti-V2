Drishti - Financial Planning App 

Mobile-first financial planning application for FIRE-focused millennials 

Quick Start for Developers 

Primary Tech Stack: React Native (Expo) + Node.js + PostgreSQL + SQLite 

 Target Platform: iOS first, Android second 

 Architecture: Mobile-native with offline-first approach 

Project Overview 

Drishti is a financial planning app that helps users model and achieve long-term financial goals, with a focus on FIRE (Financial Independence, Retire Early) strategies. Unlike web-based competitors, we're building a true mobile-native experience with offline capabilities. 

Core Value Proposition 

• Mobile-Native: Optimized for daily mobile usage with offline capabilities 

 • FIRE-Focused: Specialized for early retirement and aggressive savings strategies 

 • Progressive Complexity: Simple onboarding that scales to advanced features 

 • Privacy-First: Local-first data storage with optional cloud sync 

Technical Architecture 

Mobile App (Primary) 

// Tech Stack 
Framework: React Native (Expo SDK 50+) 
Language: TypeScript (strict mode) 
State: Zustand + AsyncStorage 
Navigation: Expo Router 
UI: NativeBase + Custom Design System 
Charts: Victory Native 
Animations: Reanimated 3 
Database: SQLite + Watermelon DB 
Auth: Expo Auth Session 
Security: Expo SecureStore + Keychain 
  

Backend API 

// Tech Stack 
Runtime: Node.js 18+ 
Framework: Fastify 
Database: PostgreSQL + Prisma ORM 
Auth: JWT with refresh tokens 
Cache: Redis (production) 
Queue: Bull Queue (background jobs) 
Security: Helmet.js + Rate limiting 
Monitoring: Winston + Sentry 
  

Project Structure 

/apps 
  /mobile               # React Native app (Expo) 
  /api                 # Node.js backend 
/packages 
  /shared              # Shared TypeScript packages 
  /types               # Common type definitions 
  /calculations        # Financial calculation engine 
  /utils               # Utility functions 
  /ui                  # Shared UI components 
  /database            # Database schemas and migrations 
  /security            # Security utilities and configs 
  

Core Data Models 

Essential Types 

// Core entities that drive the entire application 
interface User { 
  id: string; 
  email: string; 
  profile: UserProfile; 
  preferences: UserPreferences; 
  subscription: 'free' | 'premium' | 'professional'; 
  onboardingCompleted: boolean; 
  securitySettings: SecuritySettings; 
  createdAt: Date; 
  updatedAt: Date; 
} 
 
interface FinancialAccount { 
  id: string; 
  userId: string; 
  name: string; 
  type: 'checking' | 'savings' | 'investment' | 'retirement'; 
  balance: number; 
  interestRate?: number; 
  taxTreatment: 'taxable' | 'tax_deferred' | 'tax_free'; 
  institutionName?: string; 
  accountNumber?: string; // Encrypted 
  lastSyncDate?: Date; 
  isActive: boolean; 
  createdAt: Date; 
  updatedAt: Date; 
} 
 
interface FinancialGoal { 
  id: string; 
  userId: string; 
  name: string; 
  type: 'fire' | 'coast_fire' | 'lean_fire' | 'custom'; 
  targetAmount: number; 
  targetDate: Date; 
  priority: 1 | 2 | 3 | 4 | 5; 
  currentProgress: number; 
  monthlyContribution: number; 
  isActive: boolean; 
  adjustmentHistory: GoalAdjustment[]; 
  createdAt: Date; 
  updatedAt: Date; 
} 
 
interface Scenario { 
  id: string; 
  userId: string; 
  name: string; 
  description: string; 
  assumptions: ScenarioAssumptions; 
  isBase: boolean; 
  lastCalculated: Date; 
  calculationResults?: ProjectionResult[]; 
  createdAt: Date; 
  updatedAt: Date; 
} 
 
interface ScenarioAssumptions { 
  inflationRate: number;           // Default: 0.03 (3%) 
  marketReturn: number;            // Default: 0.07 (7%) 
  savingsRate: number;            // Default: 0.20 (20%) 
  currentAge: number; 
  retirementAge: number;          // Default: 65 
  lifeExpectancy: number;         // Default: 90 
  taxRate?: number;               // Default: 0.22 (22%) 
  healthcareCosts?: number;       // Annual healthcare in retirement 
  socialSecurityBenefit?: number; // Monthly SS benefit 
  currency: string;               // Default: 'USD' 
} 
 
interface SecuritySettings { 
  biometricEnabled: boolean; 
  pinEnabled: boolean; 
  autoLockMinutes: number; 
  deviceTrustLevel: 'trusted' | 'untrusted'; 
} 
 
interface GoalAdjustment { 
  id: string; 
  previousTargetAmount: number; 
  newTargetAmount: number; 
  reason: string; 
  adjustedAt: Date; 
} 
  

API Response Types 

interface ApiResponse<T> { 
  data?: T; 
  error?: ApiError; 
  timestamp: Date; 
  requestId: string; 
} 
 
interface ApiError { 
  code: string; 
  message: string; 
  details?: any; 
  httpStatus: number; 
} 
 
interface AppHealth { 
  isOnline: boolean; 
  lastSyncDate: Date; 
  pendingSyncCount: number; 
  localDataIntegrity: boolean; 
  apiStatus: 'healthy' | 'degraded' | 'down'; 
} 
  

Phase 1 Development Priorities (MVP - 4 months) 

Milestone 1: Core Infrastructure (Month 1) 

Goal: Basic app structure and authentication 

Tasks: • [ ] Set up Expo managed workflow with TypeScript 

 • [ ] Implement user authentication (Apple/Google/Email) 

 • [ ] Set up SQLite local database with Watermelon DB 

 • [ ] Create basic navigation structure 

 • [ ] Implement core UI components and design system 

 • [ ] Set up backend API with Fastify + Prisma 

 • [ ] Configure security middleware and rate limiting 

 • [ ] Set up error monitoring (Sentry) 

Definition of Done: • User can sign up/login with Apple/Google/Email 

 • App works offline for core features 

 • Database schema supports all core entities 

 • Navigation flows between main screens 

 • Security headers and rate limiting active 

 • Error logging captures client and server errors 

 • Biometric authentication working on supported devices 

Acceptance Criteria: • Authentication flow completes in <3 seconds 

 • App launches in <2 seconds on average device 

 • Offline mode gracefully handles all core operations 

 • Security scan passes OWASP mobile security checklist 

Milestone 2: Account Management (Month 1-2) 

Goal: Manual financial account management 

Key Features: 

interface AccountOperations { 
  createAccount(account: CreateAccountInput): Promise<ApiResponse<FinancialAccount>>; 
  updateBalance(accountId: string, balance: number): Promise<ApiResponse<void>>; 
  deleteAccount(accountId: string): Promise<ApiResponse<void>>; 
  getAccountsByType(userId: string, type: AccountType): Promise<ApiResponse<FinancialAccount[]>>; 
  validateAccountData(account: FinancialAccount): ValidationResult; 
  handleNegativeNetWorth(accounts: FinancialAccount[]): NegativeNetWorthStrategy; 
} 
  

Mobile UX Requirements: • Large touch targets (minimum 44px) 

 • Swipe gestures for account actions 

 • Pull-to-refresh for balance updates 

 • Haptic feedback for interactions 

 • Works completely offline 

 • Screen reader support for all account data 

 • High contrast mode support 

Definition of Done: • Users can create, edit, and delete accounts offline 

 • Balance updates sync when online 

 • Account validation prevents invalid data entry 

 • Accessibility score >95% on automated testing 

 • Negative net worth scenarios handled gracefully 

Milestone 3: Projection Engine (Month 2-3) 

Goal: Core financial projection calculations 

Key Features: 

interface ProjectionEngine { 
  calculateNetWorth( 
    accounts: FinancialAccount[], 
    assumptions: ScenarioAssumptions, 
    timeHorizon: number 
  ): Promise<ProjectionResult[]>; 
   
  calculateGoalFeasibility( 
    goal: FinancialGoal, 
    currentNetWorth: number, 
    assumptions: ScenarioAssumptions 
  ): Promise<GoalAnalysis>; 
   
  calculateRequiredSavingsRate( 
    goal: FinancialGoal, 
    assumptions: ScenarioAssumptions 
  ): Promise<number>; 
   
  calculateFIRENumber( 
    annualExpenses: number, 
    withdrawalRate?: number 
  ): number; 
   
  calculateCoastFIRE( 
    currentAge: number, 
    targetAge: number, 
    currentSavings: number, 
    expectedReturn: number 
  ): number; 
   
  simulateMarketDownturn( 
    projections: ProjectionResult[], 
    downturnSeverity: number 
  ): ProjectionResult[]; 
} 
 
interface ProjectionResult { 
  year: number; 
  age: number; 
  netWorth: number; 
  totalSaved: number; 
  investmentGrowth: number; 
  inflationAdjustedValue: number; 
  taxableIncome: number; 
  withdrawalCapability: number; 
} 
  

Performance Requirements: • Calculations complete in <200ms on mobile 

 • Support up to 50-year projections 

 • Handle multiple accounts and goals simultaneously 

 • All calculations work offline 

 • Memory usage <50MB for complex scenarios 

Definition of Done: • FIRE calculations accurate to within 0.01% 

 • Market downturn scenarios can be modeled 

 • Tax implications calculated correctly 

 • Performance targets met on mid-range devices 

 • Calculation results cached for offline viewing 

Milestone 4: Goal Management (Month 3-4) 

Goal: Single primary goal tracking and visualization 

Key Features: • Goal creation wizard (3 screens maximum) 

 • Progress visualization with accessible charts 

 • Monthly contribution calculator 

 • Target date feasibility indicator 

 • Achievement milestones 

 • Goal adjustment history tracking 

Mobile Chart Requirements: 

interface ChartConfig { 
  type: 'line' | 'area' | 'bar'; 
  responsive: true; 
  touchEnabled: true; 
  zoomEnabled: boolean; 
  data: ChartDataPoint[]; 
  theme: 'light' | 'dark'; 
  accessibility: { 
    description: string; 
    dataTable: boolean; 
    voiceOverEnabled: boolean; 
  }; 
} 
  

Definition of Done: • Goal creation completes in <60 seconds 

 • Charts render in <500ms 

 • Progress updates reflect immediately 

 • Achievement notifications work offline 

 • Charts accessible via screen reader with data tables 

API Endpoints (Phase 1) 

Authentication (v1) 

POST   /api/v1/auth/register 
POST   /api/v1/auth/login 
POST   /api/v1/auth/refresh 
DELETE /api/v1/auth/logout 
POST   /api/v1/auth/verify-biometric 
  

User Management 

GET    /api/v1/user/profile 
PUT    /api/v1/user/profile 
POST   /api/v1/user/onboarding 
GET    /api/v1/user/preferences 
PUT    /api/v1/user/preferences 
GET    /api/v1/user/health 
  

Accounts 

GET    /api/v1/accounts?page=1&limit=20 
POST   /api/v1/accounts 
PUT    /api/v1/accounts/:id 
DELETE /api/v1/accounts/:id 
GET    /api/v1/accounts/:id/history?timeframe=1y 
POST   /api/v1/accounts/validate 
  

Goals 

GET    /api/v1/goals?active=true&page=1&limit=10 
POST   /api/v1/goals 
PUT    /api/v1/goals/:id 
DELETE /api/v1/goals/:id 
GET    /api/v1/goals/:id/progress 
POST   /api/v1/goals/:id/adjust 
GET    /api/v1/goals/:id/feasibility 
  

Projections 

POST   /api/v1/projections/calculate 
GET    /api/v1/scenarios?page=1&limit=10 
POST   /api/v1/scenarios 
PUT    /api/v1/scenarios/:id 
DELETE /api/v1/scenarios/:id 
POST   /api/v1/projections/stress-test 
  

Mobile Development Standards 

Performance Requirements 

const PERFORMANCE_TARGETS = { 
  appLaunch: 2000,           // ms - app launch time 
  screenTransition: 300,     // ms - navigation between screens 
  calculation: 200,          // ms - financial calculations 
  chartRender: 500,          // ms - chart rendering time 
  apiResponse: 1000,         // ms - API response time 
  memoryUsage: 150,          // MB - maximum memory usage 
  batteryDrain: 5,           // % per hour during active use 
} as const; 
  

React Native Best Practices 

// Component structure example 
interface ComponentProps { 
  // Always define prop interfaces with accessibility props 
  accessibilityLabel?: string; 
  testID?: string; 
} 
 
const FinancialGoalCard: React.FC<ComponentProps> = React.memo(({ 
  // Use React.memo for performance 
  // Destructure props 
  accessibilityLabel, 
  testID, 
  ...props 
}) => { 
  // Component implementation with error boundaries 
  const [error, setError] = useState<Error | null>(null); 
   
  if (error) { 
    return <ErrorFallback error={error} />; 
  } 
   
  return ( 
    <View accessibilityLabel={accessibilityLabel} testID={testID}> 
      {/* Component content */} 
    </View> 
  ); 
}); 
 
export default FinancialGoalCard; 
  

State Management Pattern 

interface AppState { 
  // User state 
  user: User | null; 
  isAuthenticated: boolean; 
   
  // Financial data 
  accounts: FinancialAccount[]; 
  goals: FinancialGoal[]; 
  scenarios: Scenario[]; 
   
  // App health 
  health: AppHealth; 
   
  // UI state 
  isLoading: boolean; 
  error: ApiError | null; 
  theme: 'light' | 'dark'; 
   
  // Actions 
  setUser: (user: User) => void; 
  addAccount: (account: FinancialAccount) => void; 
  updateAccount: (id: string, updates: Partial<FinancialAccount>) => void; 
  handleError: (error: ApiError) => void; 
  clearError: () => void; 
  updateHealth: (health: Partial<AppHealth>) => void; 
} 
  

Database Schema (SQLite Local) 

Core Tables 

-- Users table (minimal for offline-first) 
CREATE TABLE users ( 
  id TEXT PRIMARY KEY, 
  email TEXT UNIQUE NOT NULL, 
  profile TEXT NOT NULL,              -- JSON 
  preferences TEXT NOT NULL,          -- JSON 
  security_settings TEXT NOT NULL,    -- JSON (encrypted) 
  created_at INTEGER NOT NULL, 
  updated_at INTEGER NOT NULL 
); 
 
-- Financial accounts 
CREATE TABLE financial_accounts ( 
  id TEXT PRIMARY KEY, 
  user_id TEXT NOT NULL, 
  name TEXT NOT NULL, 
  type TEXT NOT NULL, 
  balance REAL NOT NULL, 
  interest_rate REAL, 
  tax_treatment TEXT NOT NULL, 
  institution_name TEXT, 
  account_number_encrypted TEXT,      -- Encrypted account number 
  last_sync_date INTEGER, 
  is_active INTEGER DEFAULT 1, 
  created_at INTEGER NOT NULL, 
  updated_at INTEGER NOT NULL, 
  FOREIGN KEY (user_id) REFERENCES users (id) 
); 
 
-- Financial goals 
CREATE TABLE financial_goals ( 
  id TEXT PRIMARY KEY, 
  user_id TEXT NOT NULL, 
  name TEXT NOT NULL, 
  type TEXT NOT NULL DEFAULT 'custom', 
  target_amount REAL NOT NULL, 
  target_date INTEGER NOT NULL, 
  priority INTEGER NOT NULL, 
  current_progress REAL DEFAULT 0, 
  monthly_contribution REAL DEFAULT 0, 
  is_active INTEGER DEFAULT 1, 
  created_at INTEGER NOT NULL, 
  updated_at INTEGER NOT NULL, 
  FOREIGN KEY (user_id) REFERENCES users (id) 
); 
 
-- Goal adjustments history 
CREATE TABLE goal_adjustments ( 
  id TEXT PRIMARY KEY, 
  goal_id TEXT NOT NULL, 
  previous_target_amount REAL NOT NULL, 
  new_target_amount REAL NOT NULL, 
  reason TEXT, 
  adjusted_at INTEGER NOT NULL, 
  FOREIGN KEY (goal_id) REFERENCES financial_goals (id) 
); 
 
-- Scenarios 
CREATE TABLE scenarios ( 
  id TEXT PRIMARY KEY, 
  user_id TEXT NOT NULL, 
  name TEXT NOT NULL, 
  description TEXT, 
  assumptions TEXT NOT NULL,          -- JSON 
  calculation_results TEXT,           -- JSON cached results 
  is_base INTEGER DEFAULT 0, 
  last_calculated INTEGER, 
  created_at INTEGER NOT NULL, 
  updated_at INTEGER NOT NULL, 
  FOREIGN KEY (user_id) REFERENCES users (id) 
); 
 
-- Sync status tracking 
CREATE TABLE sync_status ( 
  table_name TEXT PRIMARY KEY, 
  last_sync INTEGER NOT NULL, 
  pending_changes INTEGER DEFAULT 0, 
  sync_conflicts INTEGER DEFAULT 0 
); 
 
-- Create indexes for performance 
CREATE INDEX idx_accounts_user_id ON financial_accounts(user_id); 
CREATE INDEX idx_goals_user_id ON financial_goals(user_id); 
CREATE INDEX idx_scenarios_user_id ON scenarios(user_id); 
CREATE INDEX idx_goal_adjustments_goal_id ON goal_adjustments(goal_id); 
  

Business Logic & Calculations 

Core Financial Formulas 

// Future Value calculation with error handling 
export const calculateFutureValue = ( 
  presentValue: number, 
  interestRate: number, 
  periods: number, 
  monthlyContribution: number = 0 
): number => { 
  if (presentValue < 0 || periods < 0) { 
    throw new Error('Present value and periods must be non-negative'); 
  } 
   
  if (interestRate <= -1) { 
    throw new Error('Interest rate must be greater than -100%'); 
  } 
   
  const fv = presentValue * Math.pow(1 + interestRate, periods); 
  const annuityFv = monthlyContribution * 
    (Math.pow(1 + interestRate / 12, periods * 12) - 1) / (interestRate / 12); 
   
  return fv + annuityFv; 
}; 
 
// Required savings rate for goal 
export const calculateRequiredSavingsRate = ( 
  currentAge: number, 
  retirementAge: number, 
  currentNetWorth: number, 
  targetAmount: number, 
  annualIncome: number, 
  expectedReturn: number 
): number => { 
  const years = retirementAge - currentAge; 
  const futureValueOfCurrent = currentNetWorth * Math.pow(1 + expectedReturn, years); 
  const additionalNeeded = targetAmount - futureValueOfCurrent; 
   
  if (additionalNeeded <= 0) return 0; 
   
  const annuityFactor = (Math.pow(1 + expectedReturn, years) - 1) / expectedReturn; 
  const requiredAnnualSaving = additionalNeeded / annuityFactor; 
   
  return Math.min(requiredAnnualSaving / annualIncome, 0.95); // Cap at 95% 
}; 
 
// FIRE number calculation 
export const calculateFIRENumber = ( 
  annualExpenses: number, 
  withdrawalRate: number = 0.04 // 4% rule 
): number => { 
  if (withdrawalRate <= 0 || withdrawalRate > 0.1) { 
    throw new Error('Withdrawal rate must be between 0% and 10%'); 
  } 
   
  return annualExpenses / withdrawalRate; 
}; 
 
// Coast FIRE calculation 
export const calculateCoastFIRE = ( 
  currentAge: number, 
  targetAge: number, 
  currentSavings: number, 
  expectedReturn: number 
): number => { 
  const yearsToGrow = targetAge - currentAge; 
  return currentSavings * Math.pow(1 + expectedReturn, yearsToGrow); 
}; 
 
// Handle negative net worth scenarios 
export const calculateDebtPayoffStrategy = ( 
  accounts: FinancialAccount[], 
  availableMonthlyPayment: number 
): DebtPayoffPlan => { 
  const debtAccounts = accounts.filter(acc => acc.balance < 0); 
   
  // Implement avalanche method (highest interest first) 
  const sortedDebts = debtAccounts.sort((a, b) =>  
    (b.interestRate || 0) - (a.interestRate || 0) 
  ); 
   
  return { 
    strategy: 'avalanche', 
    payoffOrder: sortedDebts, 
    totalInterestSaved: calculateInterestSavings(sortedDebts, availableMonthlyPayment), 
    payoffTimeline: calculatePayoffTimeline(sortedDebts, availableMonthlyPayment) 
  }; 
}; 
  

Security Implementation 

Mobile Security Configuration 

interface SecurityConfig { 
  // Data encryption 
  localDatabaseEncryption: true; 
  encryptionAlgorithm: 'AES-256-GCM'; 
  keyDerivation: 'PBKDF2'; 
   
  // Storage 
  keychainStorage: true; 
  biometricAuth: true; 
  autoLockMinutes: 5; 
   
  // Network 
  certificatePinning: true; 
  tlsVersion: '1.3'; 
   
  // Device security 
  jailbreakDetection: true; 
  debuggerDetection: true; 
   
  // Privacy 
  localOnlyMode: true; 
  dataMinimization: true; 
  analyticsOptIn: false; 
} 
 
// Encryption utilities 
export class SecurityManager { 
  static async encryptSensitiveData(data: string, key: string): Promise<string> { 
    // Implementation using Expo Crypto 
  } 
   
  static async decryptSensitiveData(encryptedData: string, key: string): Promise<string> { 
    // Implementation using Expo Crypto 
  } 
   
  static async validateDeviceSecurity(): Promise<DeviceSecurityStatus> { 
    // Check for jailbreak, debugger, etc. 
  } 
} 
  

Compliance Requirements 

Data Protection: GDPR, CCPA compliance 

Financial Regulations: Consider PCI DSS for payment data 

Security Standards: OWASP Mobile Security guidelines 

Audit Requirements: SOC 2 Type II for backend services 

Privacy Policy: Clear data usage disclosure 

Testing Strategy 

Unit Tests (Jest) 

describe('Financial Calculations', () => { 
  test('calculateFutureValue returns correct value', () => { 
    const result = calculateFutureValue(10000, 0.07, 10, 500); 
    expect(result).toBeCloseTo(107946.35, 2); 
  }); 
   
  test('calculateRequiredSavingsRate for FIRE goal', () => { 
    const savingsRate = calculateRequiredSavingsRate(30, 45, 50000, 1000000, 100000, 0.07); 
    expect(savingsRate).toBeGreaterThan(0); 
    expect(savingsRate).toBeLessThan(1); 
  }); 
   
  test('FIRE calculations handle edge cases', () => { 
    expect(() => calculateFutureValue(-1000, 0.07, 10)).toThrow(); 
    expect(() => calculateFIRENumber(50000, -0.01)).toThrow(); 
  }); 
   
  test('4% withdrawal rule validation', () => { 
    const fireNumber = calculateFIRENumber(50000, 0.04); 
    expect(fireNumber).toBe(1250000); 
  }); 
   
  test('Coast FIRE calculation accuracy', () => { 
    const coastFire = calculateCoastFIRE(25, 65, 100000, 0.07); 
    expect(coastFire).toBeCloseTo(1497446.08, 2); 
  }); 
   
  test('Negative net worth handling', () => { 
    const accounts = [ 
      { id: '1', balance: -5000, interestRate: 0.18, type: 'credit' }, 
      { id: '2', balance: -15000, interestRate: 0.06, type: 'loan' } 
    ]; 
    const strategy = calculateDebtPayoffStrategy(accounts, 1000); 
    expect(strategy.strategy).toBe('avalanche'); 
    expect(strategy.payoffOrder[0].interestRate).toBe(0.18); 
  }); 
}); 
 
describe('Security Functions', () => { 
  test('encryption/decryption works correctly', async () => { 
    const data = 'sensitive-account-number'; 
    const key = 'test-key'; 
    const encrypted = await SecurityManager.encryptSensitiveData(data, key); 
    const decrypted = await SecurityManager.decryptSensitiveData(encrypted, key); 
    expect(decrypted).toBe(data); 
  }); 
}); 
 
describe('Error Handling', () => { 
  test('API errors are properly formatted', () => { 
    const error = new ApiError('CALCULATION_FAILED', 'Invalid input parameters'); 
    expect(error.code).toBe('CALCULATION_FAILED'); 
    expect(error.httpStatus).toBe(400); 
  }); 
}); 
  

E2E Tests (Detox) 

const E2E_TEST_FLOWS = [ 
  'User onboarding and first goal creation', 
  'Add financial account and update balance', 
  'Create scenario and view projections', 
  'Navigate between screens offline', 
  'Calculate goal feasibility', 
  'Handle negative net worth scenarios', 
  'Biometric authentication flow', 
  'Data sync after going back online', 
  'Accessibility navigation with VoiceOver', 
  'App recovery after crash' 
] as const; 
  

Accessibility Testing 

Screen reader compatibility (VoiceOver/TalkBack) 

Color contrast validation (WCAG AA) 

Touch target size verification (minimum 44px) 

Keyboard navigation support 

Voice control compatibility 

Development Environment Setup 

Prerequisites 

# Required tools 
node >= 18.0.0 
npm >= 8.0.0 
expo-cli >= 6.0.0 
git 
 
# Platform-specific 
iOS Simulator (macOS) or Android Emulator 
Xcode (for iOS development) 
Android Studio (for Android development) 
 
# Optional but recommended 
yarn >= 1.22.0 
flipper (debugging) 
reactotron (debugging) 
  

Quick Start Commands 

# Clone and setup 
git clone <repo-url> 
cd drishti 
npm install 
 
# Environment setup 
cp .env.example .env.local 
npm run setup:db 
 
# Start development 
npm run mobile:dev     # Start Expo dev server 
npm run api:dev        # Start backend API 
npm run db:setup       # Initialize database 
 
# Testing 
npm run test           # Run unit tests 
npm run test:e2e       # Run E2E tests 
npm run test:security  # Run security tests 
npm run lint           # Run ESLint 
npm run type-check     # TypeScript checking 
 
# Security scanning 
npm run security:scan  # OWASP dependency check 
npm run security:audit # Security audit 
  

Error Handling & Monitoring 

Error Types 

enum ErrorCodes { 
  // Authentication 
  AUTH_FAILED = 'AUTH_FAILED', 
  TOKEN_EXPIRED = 'TOKEN_EXPIRED', 
  BIOMETRIC_FAILED = 'BIOMETRIC_FAILED', 
   
  // Calculation 
  CALCULATION_FAILED = 'CALCULATION_FAILED', 
  INVALID_INPUT = 'INVALID_INPUT', 
   
  // Data 
  SYNC_FAILED = 'SYNC_FAILED', 
  DATABASE_ERROR = 'DATABASE_ERROR', 
   
  // Network 
  NETWORK_ERROR = 'NETWORK_ERROR', 
  API_UNAVAILABLE = 'API_UNAVAILABLE', 
   
  // Security 
  SECURITY_VIOLATION = 'SECURITY_VIOLATION', 
  DEVICE_COMPROMISED = 'DEVICE_COMPROMISED' 
} 
 
class ApiError extends Error { 
  constructor( 
    public code: ErrorCodes, 
    message: string, 
    public httpStatus: number = 400, 
    public details?: any 
  ) { 
    super(message); 
    this.name = 'ApiError'; 
  } 
} 
  

Monitoring Configuration 

interface MonitoringConfig { 
  crashReporting: boolean; 
  performanceTracking: boolean; 
  userAnalytics: boolean; // Opt-in only 
  errorLogging: boolean; 
   
  // Privacy-safe metrics 
  anonymousUsage: boolean; 
  featureUsage: boolean; 
  performanceMetrics: boolean; 
} 
 
interface AppMetrics { 
  // Performance 
  appLaunchTime: number; 
  screenLoadTime: Record<string, number>; 
  calculationTime: number; 
  crashRate: number; 
  memoryUsage: number; 
   
  // User engagement (anonymous) 
  dailyActiveUsers: number; 
  sessionLength: number; 
  featureUsage: Record<string, number>; 
  onboardingCompletion: number; 
   
  // Business metrics 
  goalCreationRate: number; 
  projectionViewRate: number; 
  retentionRate: Record<string, number>; // 1d, 7d, 30d 
   
  // Security metrics 
  authenticationFailures: number; 
  securityViolations: number; 
  deviceSecurityIssues: number; 
} 
  

Internationalization Support 

Currency and Localization 

interface LocalizationConfig { 
  supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']; 
  supportedLocales: ['en-US', 'en-GB', 'en-CA', 'en-AU']; 
  defaultCurrency: 'USD'; 
  defaultLocale: 'en-US'; 
   
  // Regional variations 
  retirementAge: { 
    'US': 65, 
    'GB': 66, 
    'CA': 65, 
    'AU': 67 
  }; 
   
  // Tax considerations 
  taxTreatments: { 
    'US': ['401k', 'IRA', 'Roth_IRA', 'taxable'], 
    'GB': ['ISA', 'SIPP', 'taxable'], 
    'CA': ['RRSP', 'TFSA', 'taxable'], 
    'AU': ['superannuation', 'taxable'] 
  }; 
} 
  

Deployment & Distribution 

Mobile App Distribution 

# EAS Build configuration 
build: 
  development: 
    developmentClient: true 
    distribution: internal 
    env: 
      ENVIRONMENT: development 
      API_URL: http://localhost:3000 
   
  preview: 
    distribution: internal 
    env: 
      ENVIRONMENT: staging 
      API_URL: https://api-staging.drishti.app 
   
  production: 
    distribution: store 
    env: 
      ENVIRONMENT: production 
      API_URL: https://api.drishti.app 
  

Environment Configuration 

interface AppConfig { 
  environment: 'development' | 'staging' | 'production'; 
  apiUrl: string; 
  enableAnalytics: boolean; 
  logLevel: 'debug' | 'info' | 'warn' | 'error'; 
   
  features: { 
    accountAggregation: boolean; 
    advancedCharts: boolean; 
    socialFeatures: boolean; 
    betaFeatures: boolean; 
  }; 
   
  security: { 
    enableBiometrics: boolean; 
    enforceDeviceSecurity: boolean; 
    requirePinBackup: boolean; 
    sessionTimeoutMinutes: number; 
  }; 
   
  performance: { 
    enableCaching: boolean; 
    maxCacheSize: number; 
    backgroundSyncInterval: number; 
  }; 
} 
  

Contributing Guidelines 

Git Workflow 

# Branch naming convention 
feature/add-goal-tracking 
bugfix/calculation-accuracy 
hotfix/auth-token-expiry 
security/implement-biometric-auth 
docs/update-api-documentation 
 
# Commit message format 
feat: add goal progress visualization 
fix: correct future value calculation 
docs: update API documentation 
security: implement certificate pinning 
test: add unit tests for FIRE calculations 
refactor: optimize projection calculations 
  

Code Review Checklist 

Functionality: • [ ] TypeScript strict mode compliance • [ ] All business logic has unit tests • [ ] Error handling implemented • [ ] Input validation on all user data 

Mobile Performance: • [ ] Performance targets met (<200ms calculations) • [ ] Memory usage optimized • [ ] Offline functionality preserved • [ ] Battery impact minimized 

Security: • [ ] Sensitive data encrypted • [ ] No hardcoded secrets • [ ] Input sanitization implemented • [ ] Authentication properly validated 

Accessibility: • [ ] Screen reader compatibility • [ ] Color contrast meets WCAG AA • [ ] Touch targets ≥44px • [ ] Keyboard navigation support 

User Experience: • [ ] Graceful error handling • [ ] Loading states implemented • [ ] Offline experience maintained • [ ] Haptic feedback appropriate 

Code Quality: • [ ] ESLint rules passing • [ ] TypeScript errors resolved • [ ] Components properly memoized • [ ] No console.logs in production 

Phase 2+ Roadmap 

Upcoming Features (Month 5-8) 

Multiple Goals Management: • Support for multiple financial goals with prioritization • Goal dependency tracking (e.g., emergency fund before FIRE) • Smart goal recommendations based on user profile 

Enhanced Calculations: • Monte Carlo simulations for risk analysis • Tax optimization strategies (401k vs Roth IRA) • Healthcare cost projections for early retirement 

Web Companion App: • Desktop-optimized experience with advanced charts • CSV export functionality • Advanced scenario modeling tools 

Account Aggregation: • Plaid integration for automatic account sync • Bank-level security and encryption • Real-time balance updates 

Advanced Features (Month 9-12) 

AI-Powered Insights: • ML-powered suggestions for plan optimization • Automated rebalancing recommendations • Spending pattern analysis 

Social & Community: • Anonymous goal sharing and progress tracking • Community challenges and achievements • FIRE journey milestones and celebrations 

Advanced Planning Tools: • Collaborative planning for couples/families • Financial advisor integration • Estate planning considerations 

International Expansion: • Multi-currency support • Country-specific retirement systems • Regional tax optimization 

Technical Debt & Improvements 

Performance Optimizations: • Database query optimization • Advanced caching strategies • Background processing improvements 

Security Enhancements: • Advanced threat detection • Audit logging improvements • Enhanced encryption methods 

Developer Experience: • Automated testing pipeline • Advanced debugging tools • Performance monitoring dashboard 

Data Privacy & Compliance 

Privacy-First Architecture 

interface PrivacySettings { 
  dataProcessing: { 
    localOnly: boolean; 
    cloudSyncEnabled: boolean; 
    analyticsOptIn: boolean; 
    crashReportingOptIn: boolean; 
  }; 
   
  dataRetention: { 
    localDataRetentionDays: number; 
    cloudDataRetentionDays: number; 
    automaticDeletion: boolean; 
  }; 
   
  sharing: { 
    allowAnonymousMetrics: boolean; 
    allowPerformanceData: boolean; 
    allowFeatureUsageData: boolean; 
  }; 
} 
 
class PrivacyManager { 
  static async exportUserData(userId: string): Promise<UserDataExport> { 
    // GDPR Article 20 - Right to data portability 
  } 
   
  static async deleteUserData(userId: string): Promise<void> { 
    // GDPR Article 17 - Right to erasure 
  } 
   
  static async getDataProcessingConsent(userId: string): Promise<ConsentRecord> { 
    // GDPR Article 6 - Lawfulness of processing 
  } 
} 
  

Compliance Checklist 

GDPR Compliance: • [ ] Data processing consent mechanisms • [ ] Right to data portability (export) • [ ] Right to erasure (delete account) • [ ] Data breach notification procedures • [ ] Privacy policy and terms of service 

CCPA Compliance: • [ ] California consumer privacy rights • [ ] Data collection transparency • [ ] Opt-out mechanisms for data selling • [ ] Non-discrimination policies 

Financial Regulations: • [ ] PCI DSS compliance (if handling payments) • [ ] SOX compliance considerations • [ ] Regional financial data protection laws 

Production Monitoring 

Health Checks & Alerts 

interface HealthCheck { 
  service: string; 
  status: 'healthy' | 'degraded' | 'down'; 
  responseTime: number; 
  lastCheck: Date; 
  details?: { 
    database: boolean; 
    api: boolean; 
    calculations: boolean; 
    security: boolean; 
  }; 
} 
 
interface AlertConfig { 
  criticalAlerts: { 
    appCrashRate: { threshold: 0.01 }; // 1% 
    apiResponseTime: { threshold: 2000 }; // 2s 
    calculationErrors: { threshold: 0.001 }; // 0.1% 
    securityViolations: { threshold: 1 }; // Any violation 
  }; 
   
  warningAlerts: { 
    memoryUsage: { threshold: 0.8 }; // 80% 
    diskSpace: { threshold: 0.9 }; // 90% 
    syncFailures: { threshold: 0.05 }; // 5% 
  }; 
} 
  

Performance Baselines 

const PRODUCTION_BASELINES = { 
  mobile: { 
    appLaunchTime: { p50: 1500, p95: 3000 }, // ms 
    screenTransition: { p50: 200, p95: 500 }, // ms 
    calculationTime: { p50: 100, p95: 300 }, // ms 
    memoryUsage: { average: 80, peak: 150 }, // MB 
    crashRate: { target: 0.005 }, // 0.5% 
  }, 
   
  api: { 
    responseTime: { p50: 200, p95: 800 }, // ms 
    throughput: { target: 1000 }, // requests/minute 
    errorRate: { target: 0.01 }, // 1% 
    availability: { target: 0.999 }, // 99.9% 
  }, 
   
  database: { 
    queryTime: { p50: 50, p95: 200 }, // ms 
    connectionPool: { target: 0.8 }, // 80% utilization 
    diskUsage: { warning: 0.8, critical: 0.95 }, 
  } 
} as const; 
  

Disaster Recovery & Business Continuity 

Backup Strategy 

interface BackupConfig { 
  userData: { 
    frequency: 'realtime' | 'hourly' | 'daily'; 
    retention: number; // days 
    encryption: boolean; 
    verification: boolean; 
  }; 
   
  systemData: { 
    databaseBackups: 'continuous'; 
    configurationBackups: 'daily'; 
    logRetention: 90; // days 
  }; 
   
  recovery: { 
    rto: 4; // Recovery Time Objective (hours) 
    rpo: 1; // Recovery Point Objective (hours) 
    testFrequency: 'monthly'; 
  }; 
} 
  

Incident Response Plan 

Detection: Automated monitoring alerts 

Assessment: Severity classification (Critical/High/Medium/Low) 

Response: Immediate mitigation steps 

Communication: User and stakeholder notifications 

Resolution: Root cause analysis and fixes 

Post-mortem: Process improvements 

Team Structure & Responsibilities 

Development Team Roles 

Mobile Lead Developer: • React Native architecture and performance • iOS/Android platform optimization • Mobile security implementation • User experience optimization 

Backend Lead Developer: • API design and implementation • Database architecture and performance • Security and compliance • DevOps and deployment automation 

Financial Domain Expert: • FIRE calculation accuracy • Financial modeling validation • Regulatory compliance guidance • User education content 

UI/UX Designer: • Mobile-first design principles • Accessibility standards compliance • User research and testing • Design system maintenance 

QA Engineer: • Test automation development • Security testing protocols • Performance testing strategies • Accessibility testing procedures 

Communication Protocols 

Daily Standups: Progress, blockers, and priorities Weekly Planning: Sprint planning and retrospectives Monthly Reviews: Roadmap updates and stakeholder sync Quarterly Planning: Feature prioritization and team scaling 

Success Metrics & KPIs 

Product Metrics 

interface ProductKPIs { 
  userAcquisition: { 
    monthlySignups: number; 
    organicGrowthRate: number; 
    onboardingCompletion: number; 
  }; 
   
  userEngagement: { 
    dailyActiveUsers: number; 
    weeklyActiveUsers: number; 
    sessionDuration: number; 
    featureAdoption: Record<string, number>; 
  }; 
   
  userRetention: { 
    day1: number; 
    day7: number; 
    day30: number; 
    churnRate: number; 
  }; 
   
  businessValue: { 
    goalCompletionRate: number; 
    planAccuracy: number; 
    userSatisfactionScore: number; 
    supportTicketVolume: number; 
  }; 
} 
  

Technical Metrics 

interface TechnicalKPIs { 
  performance: { 
    appStoreRating: number; 
    crashFreeRate: number; 
    apiUptime: number; 
    averageResponseTime: number; 
  }; 
   
  security: { 
    vulnerabilityCount: number; 
    securityIncidents: number; 
    complianceScore: number; 
    penetrationTestResults: number; 
  }; 
   
  development: { 
    deploymentFrequency: number; 
    leadTimeForChanges: number; 
    meanTimeToRecovery: number; 
    changeFailureRate: number; 
  }; 
} 
  

Quick Reference 

Important Commands 

# Development 
npm run dev:mobile          # Start mobile development 
npm run dev:api            # Start API development 
npm run dev:full           # Start full stack 
 
# Testing 
npm run test:unit          # Unit tests 
npm run test:integration   # Integration tests 
npm run test:e2e           # End-to-end tests 
npm run test:security      # Security tests 
npm run test:accessibility # Accessibility tests 
 
# Production 
npm run build:mobile       # Build mobile app 
npm run deploy:staging     # Deploy to staging 
npm run deploy:production  # Deploy to production 
 
# Utilities 
npm run db:migrate         # Run database migrations 
npm run db:seed           # Seed test data 
npm run security:audit    # Security audit 
npm run performance:test  # Performance testing 
  

Environment Variables 

# Required 
DATABASE_URL=postgresql://... 
JWT_SECRET=... 
ENCRYPTION_KEY=... 
 
# Optional 
REDIS_URL=redis://... 
SENTRY_DSN=... 
PLAID_CLIENT_ID=... 
ANALYTICS_KEY=... 
 
# Development only 
DEBUG=true 
LOG_LEVEL=debug 
MOCK_DATA=true 
  

Key Resources 

Main Repository: [GitHub Repository URL] 

Design System: [Figma Design URL] 

API Documentation: [API Docs URL] 

Project Management: [Project Board URL] 

Security Guidelines: [Security Docs URL] 

Performance Dashboard: [Monitoring URL] 

Key Contacts 

Product Owner: [Name/Email] 

Lead Mobile Developer: [Name/Email] 

Lead Backend Developer: [Name/Email] 

UI/UX Designer: [Name/Email] 

DevOps Engineer: [Name/Email] 

Security Consultant: [Name/Email] 

Support Resources 

Developer Slack: #drishti-dev 

Design Reviews: #drishti-design 

Security Issues: #drishti-security 

Production Alerts: #drishti-alerts 

 

Document Version: 2.1 

 Last Updated: [Current Date] 

 Next Review: [Date + 1 month] 

This PRD is a living document and should be updated as the project evolves. All team members are responsible for keeping their respective sections current. 

 