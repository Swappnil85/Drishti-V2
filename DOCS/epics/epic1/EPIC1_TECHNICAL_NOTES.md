# Epic 1: Technical Implementation Notes

**Epic**: Project Infrastructure & Setup  
**Technical Lead**: AI Senior Developer Agent  
**Last Updated**: August 2, 2025

## 🏗️ Architecture Decisions

### Monorepo Structure
```
drishti/
├── apps/
│   ├── mobile/          # React Native Expo app
│   └── api/             # Fastify backend
├── packages/
│   └── shared/          # Shared utilities
└── tools/               # Build tools
```

**Rationale**: 
- Simplified dependency management
- Shared code reuse
- Consistent tooling across projects
- Single repository for easier maintenance

### Technology Stack Choices

#### Frontend: React Native + Expo
**Decision**: Expo over bare React Native
**Reasoning**:
- Faster development cycle
- Built-in development tools
- Simplified deployment
- Good for MVP and rapid iteration

#### Backend: Fastify
**Decision**: Fastify over Express
**Reasoning**:
- Better TypeScript support out of the box
- Higher performance
- Built-in validation and serialization
- Modern async/await patterns

#### Database: WatermelonDB + SQLite
**Decision**: WatermelonDB over Redux + API calls
**Reasoning**:
- Offline-first architecture
- Reactive data layer
- Better performance for financial data
- Automatic UI updates

## 🔧 Implementation Details

### TypeScript Configuration

**Strict Mode Settings**:
```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "strictFunctionTypes": true,
  "noImplicitReturns": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

**Key Benefits**:
- Catch errors at compile time
- Better IDE support
- Self-documenting code
- Easier refactoring

### WatermelonDB Setup

**Database Configuration**:
```typescript
// Database adapter with JSI for performance
const adapter = new SQLiteAdapter({
  dbName: 'drishti.db',
  jsi: true, // Enable JSI for better performance
  onSetUpError: error => {
    console.error('Database setup error:', error);
  }
});
```

**User Model Implementation**:
```typescript
@model('users')
export class User extends Model {
  static table = 'users';
  
  @field('name') name!: string;
  @field('email') email!: string;
  @field('avatar_url') avatarUrl?: string;
  @field('is_active') isActive!: boolean;
  @date('last_login_at') lastLoginAt?: Date;
  @field('preferences') preferencesJson?: string;
  
  // Computed properties
  get preferences(): UserPreferences {
    return this.preferencesJson ? JSON.parse(this.preferencesJson) : defaultPreferences;
  }
}
```

### Fastify Backend Setup

**Server Configuration**:
```typescript
const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: { colorize: true }
    }
  }
});

// Security plugins
server.register(helmet);
server.register(cors, { origin: true });
server.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute'
});
```

**Health Check Endpoint**:
```typescript
server.get('/health', async (request, reply) => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'connected', // Mock for now
    version: process.env.npm_package_version || '1.0.0'
  };
});
```

### Testing Infrastructure

**Jest Configuration**:
```javascript
// API tests
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts'
  ],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts']
};

// Mobile tests
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ]
};
```

### CI/CD Pipeline

**GitHub Actions Workflow**:
```yaml
name: CI/CD Pipeline

jobs:
  lint-and-type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint

  test-api:
    needs: lint-and-type-check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:api

  build:
    needs: [test-api, test-mobile]
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: |
            apps/api/dist/
            packages/shared/dist/
```

## 🔒 Security Implementation

### Backend Security
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: API protection
- **Input Validation**: Fastify schemas

### Mobile Security
- **Secure Storage**: Expo SecureStore for sensitive data
- **Local Database**: SQLite with encryption preparation
- **Network Security**: HTTPS only

## 📊 Performance Considerations

### Database Performance
- **WatermelonDB JSI**: Native performance
- **Lazy Loading**: Models loaded on demand
- **Indexing**: Email field indexed for fast lookups
- **Batch Operations**: Efficient bulk updates

### Build Performance
- **TypeScript**: Incremental compilation
- **npm Cache**: Dependency caching in CI
- **Parallel Jobs**: CI pipeline optimization

## 🐛 Known Issues & Technical Debt

### Immediate Technical Debt
1. **Mock Database**: Replace with real PostgreSQL
2. **Error Monitoring**: Add Sentry integration
3. **Authentication**: Implement proper auth system
4. **Environment Config**: Enhance configuration management

### Future Optimizations
1. **Bundle Size**: Optimize mobile app bundle
2. **Database Migrations**: Implement migration system
3. **Monitoring**: Add performance monitoring
4. **Testing**: Increase test coverage

## 🔄 Development Workflow

### Local Development
```bash
# Start development servers
npm run dev          # Start all services
npm run dev:mobile   # Mobile app only
npm run dev:api      # API server only

# Quality checks
npm run type-check   # TypeScript validation
npm run lint         # ESLint checks
npm test             # Run all tests

# Build
npm run build        # Build all projects
```

### Code Quality Gates
1. **Pre-commit**: ESLint + Prettier
2. **Pre-push**: TypeScript + Tests
3. **CI Pipeline**: Full validation
4. **Code Review**: Manual review process

## 📚 Documentation Structure

### Generated Documentation
- **API Docs**: Auto-generated from Fastify schemas
- **Type Docs**: Generated from TypeScript interfaces
- **Test Reports**: Jest coverage reports

### Manual Documentation
- **Architecture Decisions**: ADR format
- **Setup Guides**: Step-by-step instructions
- **Troubleshooting**: Common issues and solutions

---

**These technical notes provide the implementation details and architectural decisions that support the Epic 1 foundation, serving as a reference for future development and maintenance.**