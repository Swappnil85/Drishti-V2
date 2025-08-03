# Epic 2 Technical Implementation Guide

**Implementation Date**: 2025-08-02  
**Principal Engineer**: AI Principal Engineer  
**Epic**: Epic 2 - Core Security & Authentication System  
**Status**: 🔄 **IMPLEMENTATION READY**

## Implementation Overview

This guide provides detailed technical specifications and implementation roadmap for Epic 2, incorporating critical improvements identified during the Epic 1 review. The implementation is structured in phases to manage complexity and ensure quality delivery.

## 🔧 Technology Implementation

### Core Stack
**Technology Stack**: See [Drishti Technology Stack](../../architecture/TECH_STACK.md) for complete specifications.

### Epic 2 Specific Technologies
*Epic 2 introduces authentication and security-focused technologies*

- **@fastify/jwt**: JWT token handling and validation
- **bcryptjs**: Password hashing and verification
- **Expo SecureStore**: Hardware-backed secure storage for mobile
- **Expo AuthSession**: OAuth integration for social login
- **Expo LocalAuthentication**: Biometric authentication
- **@fastify/rate-limit**: API rate limiting for security
- **Real PostgreSQL**: Production database replacing Epic 1 mock

### Implementation Notes
- **Security Focus**: Enterprise-grade security implementation
- **OAuth Integration**: Apple ID and Google authentication
- **Biometric Auth**: Face ID/Touch ID integration
- **Production Database**: Real PostgreSQL with connection pooling
- **Rate Limiting**: Protection against brute force attacks

## Phase 1: Critical Infrastructure (Week 1)

### 1.1 PostgreSQL Integration (US2.1) - CRITICAL

**Priority**: 🔴 **HIGHEST** - Blocks production deployment

#### Database Setup
```typescript
// Database configuration
interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: {
    require: boolean;
    rejectUnauthorized: boolean;
  };
  pool: {
    min: 5;
    max: 20;
    acquireTimeoutMillis: 30000;
    createTimeoutMillis: 30000;
    destroyTimeoutMillis: 5000;
    idleTimeoutMillis: 30000;
    reapIntervalMillis: 1000;
    createRetryIntervalMillis: 200;
  };
}
```

#### Implementation Steps
1. **Database Provisioning**
   - Set up PostgreSQL instance (local development + staging)
   - Configure connection pooling with pg-pool
   - Implement health check endpoints

2. **Migration System**
   ```typescript
   // Migration framework
   interface MigrationSystem {
     version: string;
     migrations: Migration[];
     rollback: RollbackStrategy;
     validation: SchemaValidator;
   }
   ```

3. **Replace Mock Implementation**
   - Update all database calls from mock to real PostgreSQL
   - Maintain API compatibility
   - Add performance monitoring

#### Dependencies to Install
```bash
npm install --workspace=apps/api pg pg-types @types/pg
npm install --workspace=apps/api drizzle-orm drizzle-kit
npm install --workspace=apps/api @fastify/postgres
```

### 1.2 Sentry Error Monitoring (US2.8) - CRITICAL

**Priority**: 🔴 **HIGH** - Production readiness requirement

#### Sentry Configuration
```typescript
// Sentry setup for both API and Mobile
interface SentryConfig {
  dsn: string;
  environment: 'development' | 'staging' | 'production';
  tracesSampleRate: number;
  profilesSampleRate: number;
  beforeSend: (event: SentryEvent) => SentryEvent | null;
}
```

#### Implementation Steps
1. **API Integration**
   ```typescript
   // Fastify Sentry integration
   import * as Sentry from '@sentry/node';
   
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV,
     tracesSampleRate: 0.1,
   });
   ```

2. **Mobile Integration**
   ```typescript
   // React Native Sentry integration
   import * as Sentry from '@sentry/react-native';
   
   Sentry.init({
     dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
   });
   ```

#### Dependencies to Install
```bash
npm install --workspace=apps/api @sentry/node @sentry/profiling-node
npm install --workspace=apps/mobile @sentry/react-native
```

## Phase 2: Authentication Foundation (Week 2)

### 2.1 OAuth Integration (US2.2)

#### Apple ID Integration
```typescript
// Apple ID configuration
interface AppleAuthConfig {
  clientId: string;
  redirectUri: string;
  scopes: ['email', 'name'];
  responseType: 'code';
  responseMode: 'form_post';
}
```

#### Google OAuth Integration
```typescript
// Google OAuth configuration
interface GoogleAuthConfig {
  clientId: string;
  redirectUri: string;
  scopes: ['email', 'profile'];
  responseType: 'code';
}
```

#### Implementation Steps
1. **Expo AuthSession Setup**
   ```typescript
   import * as AuthSession from 'expo-auth-session';
   import * as WebBrowser from 'expo-web-browser';
   
   WebBrowser.maybeCompleteAuthSession();
   
   const useAuthRequest = () => {
     return AuthSession.useAuthRequest({
       clientId: 'your-client-id',
       scopes: ['email', 'profile'],
       redirectUri: AuthSession.makeRedirectUri(),
     });
   };
   ```

2. **JWT Token Management**
   ```typescript
   interface TokenManager {
     generateTokens(userId: string): Promise<TokenPair>;
     refreshTokens(refreshToken: string): Promise<TokenPair>;
     validateToken(token: string): Promise<TokenPayload>;
     revokeTokens(userId: string): Promise<void>;
   }
   ```

#### Dependencies to Install
```bash
npm install --workspace=apps/mobile expo-auth-session expo-web-browser
npm install --workspace=apps/api jsonwebtoken @types/jsonwebtoken
npm install --workspace=apps/api bcryptjs @types/bcryptjs
```

### 2.2 Secure Storage Implementation

#### Expo SecureStore Integration
```typescript
// Secure storage wrapper
interface SecureStorage {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  deleteItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

class ExpoSecureStorage implements SecureStorage {
  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value, {
      keychainService: 'drishti-keychain',
      requireAuthentication: true,
    });
  }
}
```

## Phase 3: Biometric & PIN Authentication (Week 2-3)

### 3.1 Biometric Authentication (US2.3)

#### Local Authentication Setup
```typescript
// Biometric authentication interface
interface BiometricAuth {
  isAvailable(): Promise<boolean>;
  getSupportedTypes(): Promise<BiometricType[]>;
  authenticate(options: AuthOptions): Promise<AuthResult>;
  cancelAuthentication(): void;
}

enum BiometricType {
  FINGERPRINT = 'fingerprint',
  FACE_ID = 'faceId',
  TOUCH_ID = 'touchId',
}
```

#### Implementation Steps
1. **Expo Local Authentication**
   ```typescript
   import * as LocalAuthentication from 'expo-local-authentication';
   
   const authenticateWithBiometrics = async (): Promise<boolean> => {
     const hasHardware = await LocalAuthentication.hasHardwareAsync();
     const isEnrolled = await LocalAuthentication.isEnrolledAsync();
     
     if (hasHardware && isEnrolled) {
       const result = await LocalAuthentication.authenticateAsync({
         promptMessage: 'Authenticate to access Drishti',
         fallbackLabel: 'Use PIN',
         disableDeviceFallback: false,
       });
       return result.success;
     }
     return false;
   };
   ```

#### Dependencies to Install
```bash
npm install --workspace=apps/mobile expo-local-authentication
```

### 3.2 PIN Authentication (US2.4)

#### PIN Security Implementation
```typescript
// PIN hashing and validation
interface PinManager {
  hashPin(pin: string, salt: string): Promise<string>;
  validatePin(pin: string, hash: string, salt: string): Promise<boolean>;
  generateSalt(): string;
  isValidPin(pin: string): boolean;
}

class SecurePinManager implements PinManager {
  async hashPin(pin: string, salt: string): Promise<string> {
    return await bcrypt.hash(pin + salt, 12);
  }
  
  isValidPin(pin: string): boolean {
    // No repeated digits, no sequential patterns
    const hasRepeated = /(.)\1{2,}/.test(pin);
    const isSequential = this.isSequentialPattern(pin);
    return pin.length === 6 && !hasRepeated && !isSequential;
  }
}
```

## Phase 4: Data Encryption (Week 3)

### 4.1 AES-256-GCM Implementation (US2.5)

#### Encryption Service
```typescript
// Data encryption interface
interface EncryptionService {
  encrypt(data: string, key: string): Promise<EncryptedData>;
  decrypt(encryptedData: EncryptedData, key: string): Promise<string>;
  generateKey(): Promise<string>;
  deriveKey(password: string, salt: string): Promise<string>;
}

interface EncryptedData {
  ciphertext: string;
  iv: string;
  tag: string;
  salt: string;
}

class AESGCMEncryption implements EncryptionService {
  async encrypt(data: string, key: string): Promise<EncryptedData> {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipher('aes-256-gcm', key);
    cipher.setAAD(Buffer.from('drishti-app'));
    
    let ciphertext = cipher.update(data, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      ciphertext,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      salt: crypto.randomBytes(32).toString('hex'),
    };
  }
}
```

#### Key Derivation
```typescript
// PBKDF2 key derivation
class KeyDerivation {
  async deriveKey(password: string, salt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, 100000, 32, 'sha256', (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey.toString('hex'));
      });
    });
  }
}
```

## Phase 5: Device Security & Session Management (Week 3-4)

### 5.1 Device Security Validation (US2.7)

#### Jailbreak/Root Detection
```typescript
// Device security checker
interface DeviceSecurityChecker {
  isJailbroken(): Promise<boolean>;
  isRooted(): Promise<boolean>;
  isDebugging(): Promise<boolean>;
  isEmulator(): Promise<boolean>;
  getSecurityScore(): Promise<SecurityScore>;
}

interface SecurityScore {
  score: number; // 0-100
  risks: SecurityRisk[];
  recommendations: string[];
}
```

#### Implementation Libraries
```bash
npm install --workspace=apps/mobile react-native-jailbreak-detector
npm install --workspace=apps/mobile react-native-root-detection
```

### 5.2 Session Management (US2.6)

#### Session Manager
```typescript
// Session management
interface SessionManager {
  createSession(userId: string): Promise<Session>;
  validateSession(sessionId: string): Promise<boolean>;
  refreshSession(sessionId: string): Promise<Session>;
  terminateSession(sessionId: string): Promise<void>;
  getActiveSessions(userId: string): Promise<Session[]>;
}

interface Session {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
  deviceInfo: DeviceInfo;
}
```

## Testing Strategy

### Unit Tests
```typescript
// Authentication service tests
describe('AuthenticationService', () => {
  test('should authenticate user with valid credentials', async () => {
    const result = await authService.authenticate('user@example.com', 'password');
    expect(result.success).toBe(true);
    expect(result.tokens).toBeDefined();
  });
  
  test('should fail authentication with invalid credentials', async () => {
    const result = await authService.authenticate('user@example.com', 'wrong');
    expect(result.success).toBe(false);
  });
});
```

### Integration Tests
```typescript
// Database integration tests
describe('PostgreSQL Integration', () => {
  test('should connect to database successfully', async () => {
    const connection = await database.connect();
    expect(connection).toBeDefined();
    await connection.release();
  });
});
```

### Security Tests
```typescript
// Security validation tests
describe('Security Measures', () => {
  test('should encrypt sensitive data', async () => {
    const data = 'sensitive financial data';
    const encrypted = await encryption.encrypt(data, key);
    expect(encrypted.ciphertext).not.toBe(data);
    
    const decrypted = await encryption.decrypt(encrypted, key);
    expect(decrypted).toBe(data);
  });
});
```

## Performance Monitoring

### Key Metrics to Track
```typescript
interface PerformanceMetrics {
  authenticationTime: number; // <3s target
  biometricAuthTime: number;  // <2s target
  encryptionTime: number;     // <100ms target
  databaseQueryTime: number;  // <500ms target
  apiResponseTime: number;    // <1s target
}
```

### Monitoring Implementation
```typescript
// Performance tracking
class PerformanceTracker {
  async trackAuthenticationTime(operation: () => Promise<any>): Promise<any> {
    const start = Date.now();
    const result = await operation();
    const duration = Date.now() - start;
    
    Sentry.addBreadcrumb({
      message: 'Authentication completed',
      data: { duration },
      level: 'info',
    });
    
    return result;
  }
}
```

## Security Checklist

### Pre-Implementation
- [ ] Security libraries evaluated and approved
- [ ] Threat model updated for new features
- [ ] Security test cases defined
- [ ] Compliance requirements reviewed

### During Implementation
- [ ] Code reviews with security focus
- [ ] Security testing at each phase
- [ ] Performance monitoring enabled
- [ ] Error handling implemented

### Post-Implementation
- [ ] Security audit completed
- [ ] Penetration testing performed
- [ ] Documentation updated
- [ ] Team training completed

## Risk Mitigation

### High-Risk Areas
1. **OAuth Integration**: Complex flow with external dependencies
2. **Biometric Implementation**: Platform-specific variations
3. **Database Migration**: Data integrity during transition
4. **Performance Impact**: Encryption overhead

### Mitigation Strategies
1. **Comprehensive Testing**: Unit, integration, and E2E tests
2. **Staged Rollout**: Feature flags for gradual deployment
3. **Monitoring**: Real-time performance and error tracking
4. **Rollback Plan**: Quick reversion capability

---

**Implementation Ready**: ✅ **APPROVED**  
**Principal Engineer**: AI Principal Engineer  
**Next Review**: Epic 2 Mid-point (Week 2)  
**Classification**: CONFIDENTIAL
