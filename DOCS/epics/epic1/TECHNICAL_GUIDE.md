# Epic 1: Core Infrastructure & Foundation - Technical Guide

## Technical Overview

**Epic**: Epic 1 - Core Infrastructure & Foundation  
**Implementation Date**: December 2024 - January 1, 2025  
**Technical Lead**: Principal Engineer  
**Architecture**: Monorepo with TypeScript, Node.js, React Native

## 🏗️ Architecture Implementation

### Monorepo Structure
```
Drishti/
├── apps/
│   ├── api/                 # Backend API (Fastify + TypeScript)
│   └── mobile/              # Mobile App (React Native + Expo)
├── packages/
│   └── shared/              # Shared utilities and types
├── DOCS/                    # Documentation
└── package.json             # Root package configuration
```

**Rationale**: 
- Simplified dependency management
- Shared code reuse
- Consistent tooling across projects
- Single repository for easier maintenance

### Technology Stack Implementation

#### Core Stack
**Technology Stack**: See [Drishti Technology Stack](../../architecture/TECH_STACK.md) for complete specifications.

#### Epic 1 Specific Technologies
*Epic 1 focuses on foundation setup with standard Drishti technologies*

- **Mock Database**: Temporary PostgreSQL mock for initial development
- **Basic Middleware**: Standard Fastify middleware stack (CORS, Helmet, Swagger)
- **Foundation Components**: Basic React Native component structure
- **Monorepo Setup**: npm workspaces configuration

#### Implementation Notes
- **Database**: Uses mock PostgreSQL implementation for development (replaced in Epic 2)
- **State Management**: Basic React Context setup (enhanced in later epics)
- **Testing**: Foundation testing setup with Jest
- **CI/CD**: GitHub Actions workflow for automated testing

#### Epic 1 Architecture Overview
- **Backend API (apps/api/)**: Fastify foundation with basic endpoints
- **Mobile App (apps/mobile/)**: React Native + Expo foundation
- **Shared Package (packages/shared/)**: Common TypeScript interfaces and utilities

## 🗄️ Database Implementation

### PostgreSQL Setup
```sql
-- Database configuration
CREATE DATABASE drishti_dev;
CREATE DATABASE drishti_test;
CREATE DATABASE drishti_prod;

-- User management
CREATE USER drishti_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE drishti_dev TO drishti_user;
```

### Database Schema Foundation
```sql
-- Core tables
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  provider VARCHAR(50) DEFAULT 'email',
  provider_id VARCHAR(255),
  avatar_url TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash VARCHAR(255) NOT NULL,
  device_info TEXT,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider ON users(provider, provider_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_active ON sessions(is_active, expires_at);
```

### Migration System
```typescript
// Migration interface
interface Migration {
  id: string;
  name: string;
  up: (client: PoolClient) => Promise<void>;
  down: (client: PoolClient) => Promise<void>;
}

// Migration execution
export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Create migrations table if not exists
    await createMigrationsTable(client);
    
    // Get pending migrations
    const pendingMigrations = await getPendingMigrations(client);
    
    // Execute migrations
    for (const migration of pendingMigrations) {
      await migration.up(client);
      await recordMigration(client, migration);
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

## 🚀 API Implementation

### Fastify Server Setup
```typescript
import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// Security middleware
await fastify.register(helmet);
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || true,
});

// Documentation
await fastify.register(swagger, {
  swagger: {
    info: {
      title: 'Drishti API',
      description: 'API documentation for Drishti application',
      version: '1.0.0',
    },
  },
});

await fastify.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false,
  },
});
```

### Health Check Implementation
```typescript
// Health check routes
fastify.get('/health', async (request, reply) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  };
  
  return reply.code(200).send(health);
});

fastify.get('/health/detailed', async (request, reply) => {
  const dbHealth = await getDatabaseHealth();
  
  const health = {
    status: dbHealth.connected ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: dbHealth,
    memory: process.memoryUsage(),
  };
  
  const statusCode = dbHealth.connected ? 200 : 503;
  return reply.code(statusCode).send(health);
});
```

### Database Connection Management
```typescript
import { Pool, PoolClient } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'drishti_dev',
  user: process.env.DB_USER || 'drishti_user',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Connection health check
export async function getDatabaseHealth(): Promise<DatabaseHealth> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    
    return {
      connected: true,
      timestamp: result.rows[0].now,
      poolSize: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingClients: pool.waitingCount,
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

## 📱 Mobile App Implementation

### Expo Configuration
```json
{
  "expo": {
    "name": "Drishti",
    "slug": "drishti",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.drishti.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.drishti.app"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

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

export const database = new Database({
  adapter,
  modelClasses: [User],
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
  
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
  
  // Computed properties
  get preferences(): UserPreferences {
    return this.preferencesJson ? JSON.parse(this.preferencesJson) : defaultPreferences;
  }
}
```

### Navigation Setup
```typescript
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'Drishti' }}
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{ title: 'Profile' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### Component Architecture
```typescript
// Base component structure
interface ComponentProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

// Themed component example
export const ThemedView: React.FC<ComponentProps> = ({ 
  children, 
  style 
}) => {
  const theme = useTheme();
  
  return (
    <View style={[
      { backgroundColor: theme.colors.background },
      style
    ]}>
      {children}
    </View>
  );
};
```

## 🔧 Development Tools

### TypeScript Configuration

**Strict Mode Settings**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Key Benefits**:
- Catch errors at compile time
- Better IDE support
- Self-documenting code
- Easier refactoring

### ESLint Configuration
```json
{
  "extends": [
    "@expo/eslint-config-base",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
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

## 🚀 CI/CD Implementation

### GitHub Actions Workflow
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: drishti_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run tests
        run: npm test
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: drishti_test
          DB_USER: postgres
          DB_PASSWORD: postgres
      
      - name: Build applications
        run: npm run build
```

**Pipeline Jobs**:
```yaml
jobs:
  lint-and-type-check: # Code quality validation
  test-api: # API test execution
  test-mobile: # Mobile test execution
  security-scan: # Security vulnerability scanning
  build: # Application building
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

### Infrastructure Security
- **Dependency Scanning**: npm audit integration in CI/CD
- **Secret Management**: Environment variables excluded from version control
- **Access Control**: Proper file permissions and access patterns

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

### API Performance
- Fastify's high-performance HTTP server
- Efficient middleware stack
- Proper error handling and logging
- Health check endpoints for monitoring

### Mobile Performance
- Expo's optimized build system
- Efficient navigation structure
- Lazy loading of components
- Optimized asset management

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

**This technical guide provides the implementation details and architectural decisions that support the Epic 1 foundation, serving as a reference for future development and maintenance.**