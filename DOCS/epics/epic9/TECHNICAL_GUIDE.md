# Epic 9: Technical Implementation Guide

## Architecture Overview

Epic 9 implements a comprehensive scenario planning system using a service-oriented architecture with React Native components. The system is designed for scalability, performance, and maintainability.

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                     │
├─────────────────────────────────────────────────────────────┤
│  AssumptionsStep  │  ScenarioComparison  │  YearlyProjections │
│  StressTesting    │  ScenarioManagement  │                   │
├─────────────────────────────────────────────────────────────┤
│                    Service Layer                            │
├─────────────────────────────────────────────────────────────┤
│  HistoricalData   │  RealTimeCalc       │  WhatIfAnalysis   │
│  Comparison       │  Versioning         │  Projections      │
│  StressTesting    │                     │                   │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer                               │
├─────────────────────────────────────────────────────────────┤
│  Scenario Storage │  Version Control    │  Market Data      │
│  User Preferences │  Sharing Metadata   │  Templates        │
└─────────────────────────────────────────────────────────────┘
```

## Service Implementation

### 1. HistoricalMarketDataService

**Purpose**: Provides 6 decades of historical market data with confidence scoring

```typescript
interface HistoricalDataPoint {
  year: number;
  marketReturn: number;
  inflationRate: number;
  unemploymentRate: number;
  gdpGrowth: number;
  events: MarketEvent[];
}

interface ConfidenceMetrics {
  dataQuality: number;
  sampleSize: number;
  volatility: number;
  overallConfidence: number;
}
```

**Key Features**:
- 60+ years of market data (1960-2024)
- Confidence scoring for assumption validation
- Major market event correlation
- Real-time guidance for assumption setting

**Performance**: <50ms for data retrieval, cached for optimal performance

### 2. RealTimeCalculationService

**Purpose**: Provides live projections that update as assumptions change

```typescript
interface RealTimeProjections {
  yearsToFire: number;
  fireNumber: number;
  monthlyRequired: number;
  successProbability: number;
  keyInsights: string[];
  riskFactors: RiskFactor[];
}

interface ProjectionInputs {
  currentAge: number;
  currentNetWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  assumptions: ScenarioAssumptions;
}
```

**Key Features**:
- Sub-50ms calculation updates
- Comprehensive risk analysis
- Key insights generation
- Success probability modeling

**Algorithms**:
- Monte Carlo simulation for probability analysis
- Compound growth calculations with inflation adjustment
- Risk factor analysis with correlation modeling

### 3. WhatIfAnalysisService

**Purpose**: Sensitivity analysis and scenario comparison tools

```typescript
interface WhatIfScenario {
  name: string;
  description: string;
  assumptionChanges: Partial<ScenarioAssumptions>;
  impact: ImpactAnalysis;
}

interface SensitivityAnalysis {
  parameter: string;
  baseValue: number;
  testRange: number[];
  impactOnFire: number[];
  sensitivity: 'low' | 'medium' | 'high';
}
```

**Key Features**:
- 5 pre-built what-if scenarios
- Custom sensitivity analysis
- Impact visualization
- Recommendation generation

**Analysis Types**:
- Market return sensitivity
- Savings rate impact
- Inflation effect analysis
- Life event scenario modeling

### 4. ScenarioComparisonService

**Purpose**: Advanced side-by-side scenario comparison with analytics

```typescript
interface ComparisonAnalysis {
  scenarios: EnhancedScenario[];
  keyDifferences: KeyDifference[];
  bestScenario: BestScenarioAnalysis;
  riskAnalysis: RiskComparison;
  recommendations: string[];
}

interface BestScenarioAnalysis {
  fastest: string;
  safest: string;
  mostProbable: string;
  overall: string;
  reasoning: string[];
}
```

**Key Features**:
- 2-5 scenario comparison support
- Advanced analytics with risk scoring
- Best scenario identification
- Export capabilities (CSV, Excel, PDF)

**Comparison Metrics**:
- Time to FIRE analysis
- Risk-return profiling
- Probability analysis
- Break-even calculations

### 5. ScenarioVersioningService

**Purpose**: Version control, sharing, and template marketplace

```typescript
interface ScenarioVersion {
  id: string;
  version: number;
  scenario: EnhancedScenario;
  changes: VersionChange[];
  metadata: VersionMetadata;
  isActive: boolean;
}

interface ScenarioShare {
  shareCode: string;
  permissions: SharePermissions;
  expiresAt?: Date;
  accessCount: number;
  anonymized: boolean;
}
```

**Key Features**:
- Complete version control with rollback
- Secure sharing with expiration
- Template marketplace with ratings
- Automated change detection

**Version Control**:
- Field-level change tracking
- Impact level assessment
- Parent-child relationships
- Metadata preservation

### 6. YearlyProjectionsService

**Purpose**: Detailed year-by-year projections with milestone tracking

```typescript
interface YearlyProjection {
  year: number;
  age: number;
  startingNetWorth: number;
  contributions: ContributionBreakdown;
  growth: GrowthBreakdown;
  expenses: ExpenseBreakdown;
  endingNetWorth: number;
  milestones: ProjectionMilestone[];
  isRetired: boolean;
}

interface DecadeView {
  decade: string;
  projections: YearlyProjection[];
  summary: DecadeSummary;
  keyEvents: string[];
}
```

**Key Features**:
- 50-year projection capability
- Milestone detection and tracking
- Decade view aggregation
- Account-specific analysis

**Calculations**:
- Compound growth with inflation
- Tax impact modeling
- Withdrawal rate optimization
- Healthcare cost projections

### 7. StressTestingService

**Purpose**: Comprehensive stress testing with historical events

```typescript
interface StressTest {
  scenario: EnhancedScenario;
  stressScenarios: StressScenario[];
  results: StressTestResults;
  survivabilityAnalysis: SurvivabilityAnalysis;
}

interface StressScenario {
  name: string;
  type: 'market_crash' | 'recession' | 'inflation_spike';
  parameters: StressParameters;
  recoveryPattern: RecoveryPattern;
}
```

**Key Features**:
- Historical event modeling (2008, COVID-19, 1970s)
- Custom stress scenario creation
- Recovery pattern analysis
- Survivability assessment

**Historical Events**:
- 2008 Financial Crisis: -37% market, 2-year duration
- COVID-19 Pandemic: -20% market, 1-year duration
- 1970s Stagflation: +5% inflation, 8-year duration
- Dot-com Crash: -49% market, 3-year duration

## User Interface Implementation

### Component Architecture

```typescript
// Enhanced Assumptions Step with Live Projections
const AssumptionsStep: React.FC = () => {
  const [projections, setProjections] = useState<RealTimeProjections>();
  const [historicalContext, setHistoricalContext] = useState<HistoricalContext>();
  
  // Real-time calculation updates
  useEffect(() => {
    const updateProjections = debounce(async () => {
      const newProjections = await realTimeCalculationService.calculateProjections(inputs);
      setProjections(newProjections);
    }, 300);
    
    updateProjections();
  }, [assumptions]);
};
```

### State Management

```typescript
// Scenario Context for Global State
interface ScenarioContextType {
  scenarios: EnhancedScenario[];
  currentScenario: EnhancedScenario | null;
  projections: RealTimeProjections | null;
  loading: boolean;
  error: string | null;
}

const ScenarioContext = createContext<ScenarioContextType>();
```

### Performance Optimizations

1. **Debounced Updates**: Real-time calculations debounced to 300ms
2. **Memoization**: Complex calculations memoized with useMemo
3. **Lazy Loading**: Components loaded on-demand
4. **Caching**: Historical data cached for 24 hours
5. **Virtualization**: Large projection tables virtualized

## Data Models

### Core Types

```typescript
interface EnhancedScenario {
  id: string;
  name: string;
  description: string;
  type: ScenarioType;
  category: string;
  assumptions: ScenarioAssumptions;
  tags: string[];
  color: string;
  emoji: string;
  popularity_score: number;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

interface ScenarioAssumptions {
  inflation_rate: number;
  market_return: number;
  savings_rate: number;
  retirement_age: number;
  life_expectancy: number;
  emergency_fund_months: number;
  healthcare_inflation: number;
  tax_rate: number;
}
```

### Validation Schema

```typescript
const assumptionValidation = {
  inflation_rate: { min: -0.05, max: 0.15, default: 0.03 },
  market_return: { min: -0.20, max: 0.25, default: 0.07 },
  savings_rate: { min: 0.05, max: 0.80, default: 0.20 },
  retirement_age: { min: 25, max: 80, default: 65 },
  life_expectancy: { min: 65, max: 100, default: 85 },
  emergency_fund_months: { min: 3, max: 24, default: 6 },
  healthcare_inflation: { min: 0.02, max: 0.10, default: 0.05 },
  tax_rate: { min: 0.10, max: 0.50, default: 0.22 },
};
```

## Security Implementation

### Input Validation

```typescript
export const sanitizeScenarioInput = (input: any): EnhancedScenario => {
  return {
    id: sanitizeString(input.id),
    name: sanitizeString(input.name, { maxLength: 100 }),
    description: sanitizeString(input.description, { maxLength: 500 }),
    assumptions: validateAssumptions(input.assumptions),
    // ... other fields
  };
};

export const validateAssumptions = (assumptions: any): ScenarioAssumptions => {
  const validated: ScenarioAssumptions = {};
  
  Object.keys(assumptionValidation).forEach(key => {
    const value = parseFloat(assumptions[key]);
    const rules = assumptionValidation[key];
    
    if (isNaN(value) || value < rules.min || value > rules.max) {
      validated[key] = rules.default;
    } else {
      validated[key] = value;
    }
  });
  
  return validated;
};
```

### Rate Limiting

```typescript
const rateLimiter = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (userId: string, action: string): boolean => {
  const key = `${userId}:${action}`;
  const now = Date.now();
  const limit = rateLimits[action] || { requests: 100, window: 3600000 }; // 1 hour
  
  const userLimit = rateLimiter.get(key);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimiter.set(key, { count: 1, resetTime: now + limit.window });
    return true;
  }
  
  if (userLimit.count >= limit.requests) {
    return false;
  }
  
  userLimit.count++;
  return true;
};
```

## Testing Strategy

### Unit Tests

```typescript
describe('RealTimeCalculationService', () => {
  it('should calculate FIRE projections correctly', async () => {
    const inputs: ProjectionInputs = {
      currentAge: 30,
      currentNetWorth: 50000,
      monthlyIncome: 8000,
      monthlyExpenses: 4000,
      assumptions: defaultAssumptions,
    };
    
    const result = await realTimeCalculationService.calculateProjections(inputs);
    
    expect(result.yearsToFire).toBeGreaterThan(0);
    expect(result.fireNumber).toBeGreaterThan(0);
    expect(result.successProbability).toBeBetween(0, 1);
  });
});
```

### Integration Tests

```typescript
describe('Scenario Workflow', () => {
  it('should create, compare, and stress test scenarios', async () => {
    // Create scenario
    const scenario = await scenarioService.createScenario(scenarioData);
    expect(scenario.id).toBeDefined();
    
    // Compare scenarios
    const comparison = await scenarioComparisonService.compareScenarios([scenario, baseScenario]);
    expect(comparison.keyDifferences).toHaveLength(greaterThan(0));
    
    // Stress test
    const stressTest = await stressTestingService.createStressTest(scenario, 'Historical Test');
    expect(stressTest.results.summary.survivabilityRate).toBeDefined();
  });
});
```

### Performance Tests

```typescript
describe('Performance Requirements', () => {
  it('should calculate projections within 50ms', async () => {
    const startTime = performance.now();
    await realTimeCalculationService.calculateProjections(testInputs);
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(50);
  });
});
```

## Deployment Configuration

### Environment Variables

```bash
# Scenario Planning Configuration
SCENARIO_MAX_COUNT=50
SCENARIO_VERSION_LIMIT=20
HISTORICAL_DATA_CACHE_TTL=86400
STRESS_TEST_TIMEOUT=30000

# Performance Settings
CALCULATION_DEBOUNCE_MS=300
PROJECTION_MAX_YEARS=50
COMPARISON_MAX_SCENARIOS=5

# Security Settings
RATE_LIMIT_SCENARIO_CREATION=10
RATE_LIMIT_STRESS_TESTING=5
SHARE_CODE_EXPIRY_DAYS=30
```

### Database Schema

```sql
-- Scenarios table
CREATE TABLE scenarios (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(50),
  assumptions JSONB NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Scenario versions table
CREATE TABLE scenario_versions (
  id UUID PRIMARY KEY,
  scenario_id UUID REFERENCES scenarios(id),
  version INTEGER NOT NULL,
  changes JSONB,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Scenario shares table
CREATE TABLE scenario_shares (
  id UUID PRIMARY KEY,
  scenario_id UUID REFERENCES scenarios(id),
  share_code VARCHAR(8) UNIQUE,
  permissions JSONB,
  expires_at TIMESTAMP,
  access_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Monitoring and Analytics

### Performance Metrics

```typescript
// Performance monitoring
export const trackPerformance = (operation: string, duration: number) => {
  analytics.track('performance_metric', {
    operation,
    duration,
    timestamp: Date.now(),
  });
  
  if (duration > performanceThresholds[operation]) {
    logger.warn(`Slow operation detected: ${operation} took ${duration}ms`);
  }
};

// Usage analytics
export const trackFeatureUsage = (feature: string, userId: string) => {
  analytics.track('feature_usage', {
    feature,
    userId,
    timestamp: Date.now(),
  });
};
```

### Error Handling

```typescript
export class ScenarioError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'ScenarioError';
  }
}

export const handleScenarioError = (error: Error, context: any) => {
  logger.error('Scenario operation failed', {
    error: error.message,
    stack: error.stack,
    context,
  });
  
  // Send to error tracking service
  errorTracker.captureException(error, { extra: context });
  
  // Return user-friendly error
  return new ScenarioError(
    'Unable to process scenario. Please try again.',
    'SCENARIO_PROCESSING_ERROR',
    context
  );
};
```

## Maintenance and Updates

### Code Organization

```
apps/mobile/src/
├── services/
│   ├── historical/HistoricalMarketDataService.ts
│   ├── calculations/RealTimeCalculationService.ts
│   ├── analysis/WhatIfAnalysisService.ts
│   ├── scenario/ScenarioComparisonService.ts
│   ├── scenario/ScenarioVersioningService.ts
│   ├── projections/YearlyProjectionsService.ts
│   └── stress/StressTestingService.ts
├── screens/scenarios/
│   ├── wizard/AssumptionsStep.tsx
│   ├── ScenarioComparisonScreen.tsx
│   ├── ScenarioManagementScreen.tsx
│   ├── YearlyProjectionsScreen.tsx
│   └── StressTestingScreen.tsx
└── types/scenario.ts
```

### Update Procedures

1. **Service Updates**: Update individual services with backward compatibility
2. **Data Migration**: Version control ensures smooth data transitions
3. **Feature Flags**: New features can be rolled out gradually
4. **Testing**: Comprehensive test suite ensures stability
5. **Monitoring**: Real-time monitoring detects issues early

This technical guide provides comprehensive documentation for maintaining and extending the Epic 9 scenario planning system.
