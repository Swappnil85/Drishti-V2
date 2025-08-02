# Epic 3: Core Data Models & Local Database - Technical Implementation Guide

## Technical Guide Overview

**Guide Version**: 1.0  
**Last Updated**: January 2, 2025  
**Scope**: Complete technical implementation guide for Epic 3  
**Audience**: Developers, DevOps Engineers, Technical Architects

## 🏗️ **System Architecture**

### **1. High-Level Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile Application                        │
├─────────────────────────────────────────────────────────────┤
│  UI Layer (React Native + Expo)                            │
├─────────────────────────────────────────────────────────────┤
│  Business Logic Layer                                       │
│  ├── Authentication Service                                 │
│  ├── Encryption Service                                     │
│  ├── Sync Service                                          │
│  └── Data Validation Service                               │
├─────────────────────────────────────────────────────────────┤
│  Data Layer (WatermelonDB)                                 │
│  ├── User Model                                            │
│  ├── FinancialAccount Model                                │
│  ├── FinancialGoal Model                                   │
│  └── Scenario Model                                        │
├─────────────────────────────────────────────────────────────┤
│  Storage Layer (SQLite + Secure Storage)                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API                              │
├─────────────────────────────────────────────────────────────┤
│  API Layer (Fastify + TypeScript)                          │
├─────────────────────────────────────────────────────────────┤
│  Business Logic Layer                                       │
│  ├── Authentication Controller                              │
│  ├── User Controller                                        │
│  ├── Account Controller                                     │
│  └── Sync Controller                                        │
├─────────────────────────────────────────────────────────────┤
│  Data Layer (PostgreSQL)                                   │
└─────────────────────────────────────────────────────────────┘
```

### **2. Service Architecture**

#### **Core Services**
- **EncryptionService**: AES-256-GCM encryption and decryption
- **KeyManager**: Secure key storage and management
- **EncryptedFieldManager**: Field-level encryption management
- **KeyRotationService**: Automatic key rotation and migration
- **EncryptionRecoveryService**: Failure recovery and data restoration
- **SecurityAuditService**: Security event logging and monitoring

#### **Service Dependencies**
```typescript
EncryptionService
├── KeyManager (key storage)
├── SecurityAuditService (audit logging)
└── Platform APIs (crypto, secure storage)

EncryptedFieldManager
├── EncryptionService (encryption operations)
├── KeyManager (key retrieval)
└── SecurityAuditService (access logging)

KeyRotationService
├── EncryptionService (re-encryption)
├── KeyManager (key lifecycle)
├── EncryptedFieldManager (data migration)
└── SecurityAuditService (rotation logging)
```

## 💾 **Database Implementation**

### **1. WatermelonDB Configuration**

#### **Database Setup**
```typescript
// apps/mobile/src/database/index.ts
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { User, FinancialAccount, FinancialGoal, Scenario } from './models';

const adapter = new SQLiteAdapter({
  schema,
  dbName: 'drishti_db',
  migrations: [],
});

export const database = new Database({
  adapter,
  modelClasses: [User, FinancialAccount, FinancialGoal, Scenario],
});
```

#### **Schema Definition**
```typescript
// apps/mobile/src/database/schema.ts
import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'users',
      columns: [
        { name: 'email', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'encrypted_phone', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'financial_accounts',
      columns: [
        { name: 'user_id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'type', type: 'string' },
        { name: 'encrypted_account_number', type: 'string' },
        { name: 'encrypted_routing_number', type: 'string' },
        { name: 'balance', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    // Additional tables...
  ],
});
```

### **2. Model Implementation**

#### **Base Model with Encryption**
```typescript
// apps/mobile/src/database/models/BaseModel.ts
import { Model } from '@nozbe/watermelondb';
import { EncryptedFieldManager } from '../../services/encryption/EncryptedFieldManager';

export class BaseModel extends Model {
  protected encryptedFieldManager = EncryptedFieldManager.getInstance();

  async encryptField(fieldName: string, value: string): Promise<string> {
    const context = {
      tableName: this.table,
      recordId: this.id,
      userId: 'current_user', // Get from auth context
      operation: 'write' as const,
    };

    const result = await this.encryptedFieldManager.encryptField(
      fieldName,
      value,
      context
    );

    return result.encrypted ? result.value : value;
  }

  async decryptField(fieldName: string, encryptedValue: string): Promise<string> {
    const context = {
      tableName: this.table,
      recordId: this.id,
      userId: 'current_user', // Get from auth context
      operation: 'read' as const,
    };

    return await this.encryptedFieldManager.decryptField(
      fieldName,
      { encrypted: true, value: encryptedValue },
      context
    );
  }
}
```

#### **User Model**
```typescript
// apps/mobile/src/database/models/User.ts
import { field, readonly, date } from '@nozbe/watermelondb/decorators';
import { BaseModel } from './BaseModel';

export class User extends BaseModel {
  static table = 'users';

  @field('email') email!: string;
  @field('name') name!: string;
  @field('encrypted_phone') encryptedPhone?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  async getPhone(): Promise<string | undefined> {
    if (!this.encryptedPhone) return undefined;
    return await this.decryptField('phone', this.encryptedPhone);
  }

  async setPhone(phone: string): Promise<void> {
    const encrypted = await this.encryptField('phone', phone);
    await this.update(user => {
      user.encryptedPhone = encrypted;
    });
  }
}
```

## 🔐 **Encryption Implementation**

### **1. Core Encryption Service**

#### **Service Configuration**
```typescript
// apps/mobile/src/services/encryption/EncryptionService.ts
export class EncryptionService {
  private static instance: EncryptionService;
  private keyManager: KeyManager;
  private auditService: SecurityAuditService;

  private constructor() {
    this.keyManager = KeyManager.getInstance();
    this.auditService = SecurityAuditService.getInstance();
  }

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  async encryptData(data: string, context: string): Promise<EncryptionResult> {
    const startTime = Date.now();
    
    try {
      // Get active encryption key
      const keyId = await this.keyManager.getActiveKeyId();
      const key = await this.keyManager.getKey(keyId);

      // Generate unique IV
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Encrypt data using AES-256-GCM
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );

      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        dataBuffer
      );

      // Combine IV and encrypted data
      const result = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      result.set(iv);
      result.set(new Uint8Array(encryptedBuffer), iv.length);

      const encryptedData = this.arrayBufferToBase64(result);
      const duration = Date.now() - startTime;

      // Log encryption event
      await this.auditService.logCryptoOperation(
        'encrypt',
        keyId,
        data.length,
        duration,
        true,
        undefined,
        'current_user'
      );

      return {
        encrypted: true,
        data: encryptedData,
        keyId,
        algorithm: 'AES-256-GCM',
        timestamp: Date.now(),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      await this.auditService.logCryptoOperation(
        'encrypt',
        'unknown',
        data.length,
        duration,
        false,
        error.message,
        'current_user'
      );

      throw new Error(`Encryption failed: ${error.message}`);
    }
  }
}
```

### **2. Key Management Implementation**

#### **Secure Key Storage**
```typescript
// apps/mobile/src/services/encryption/KeyManager.ts
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

export class KeyManager {
  private static instance: KeyManager;
  private auditService: SecurityAuditService;

  async storeKey(keyId: string, key: Uint8Array): Promise<void> {
    try {
      // Check biometric availability
      const biometricType = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      const options: SecureStore.SecureStoreOptions = {
        requireAuthentication: true,
        authenticationPrompt: 'Authenticate to access encryption key',
      };

      // Use biometric authentication if available
      if (biometricType.length > 0) {
        options.authenticationType = LocalAuthentication.AuthenticationType.BIOMETRIC;
      }

      // Store encrypted key
      const keyBase64 = this.arrayBufferToBase64(key);
      await SecureStore.setItemAsync(`encryption_key_${keyId}`, keyBase64, options);

      // Log key storage event
      await this.auditService.logEvent(
        'KEY_STORAGE',
        'LOW',
        {
          action: 'store_key',
          keyId,
          success: true,
        },
        'current_user'
      );
    } catch (error) {
      await this.auditService.logEvent(
        'KEY_STORAGE',
        'HIGH',
        {
          action: 'store_key',
          keyId,
          success: false,
          error: error.message,
        },
        'current_user'
      );
      throw error;
    }
  }

  async getKey(keyId: string): Promise<Uint8Array> {
    try {
      const keyBase64 = await SecureStore.getItemAsync(`encryption_key_${keyId}`);
      
      if (!keyBase64) {
        throw new Error(`Key not found: ${keyId}`);
      }

      const key = this.base64ToArrayBuffer(keyBase64);

      // Log key access event
      await this.auditService.logEvent(
        'KEY_ACCESS',
        'MEDIUM',
        {
          action: 'retrieve_key',
          keyId,
          success: true,
        },
        'current_user'
      );

      return new Uint8Array(key);
    } catch (error) {
      await this.auditService.logEvent(
        'KEY_ACCESS',
        'HIGH',
        {
          action: 'retrieve_key',
          keyId,
          success: false,
          error: error.message,
        },
        'current_user'
      );
      throw error;
    }
  }
}
```

### **3. Field-Level Encryption**

#### **Encrypted Field Manager**
```typescript
// apps/mobile/src/services/encryption/EncryptedFieldManager.ts
export class EncryptedFieldManager {
  private encryptionService: EncryptionService;
  private sensitiveFields: Map<string, string[]>;

  constructor() {
    this.encryptionService = EncryptionService.getInstance();
    this.initializeSensitiveFields();
  }

  private initializeSensitiveFields(): void {
    this.sensitiveFields = new Map([
      ['financial_accounts', ['account_number', 'routing_number', 'bank_name']],
      ['users', ['phone', 'ssn', 'tax_id']],
      ['financial_goals', ['notes', 'private_notes']],
      ['scenarios', ['notes', 'assumptions']],
    ]);
  }

  async encryptField(
    fieldName: string,
    value: string,
    context: EncryptionContext
  ): Promise<EncryptedField> {
    // Check if field should be encrypted
    const tableFields = this.sensitiveFields.get(context.tableName) || [];
    const shouldEncrypt = tableFields.includes(fieldName);

    if (!shouldEncrypt) {
      return {
        encrypted: false,
        value,
      };
    }

    // Encrypt the field value
    const encryptionResult = await this.encryptionService.encryptData(
      value,
      `${context.tableName}.${fieldName}`
    );

    return {
      encrypted: true,
      value: encryptionResult.data,
      keyId: encryptionResult.keyId,
      algorithm: encryptionResult.algorithm,
      timestamp: encryptionResult.timestamp,
    };
  }

  async encryptRecord<T extends Record<string, any>>(
    record: T,
    context: EncryptionContext
  ): Promise<T> {
    const encryptedRecord = { ...record };
    const tableFields = this.sensitiveFields.get(context.tableName) || [];

    for (const fieldName of tableFields) {
      if (record[fieldName] !== undefined && record[fieldName] !== null) {
        const encryptedField = await this.encryptField(
          fieldName,
          String(record[fieldName]),
          context
        );
        
        if (encryptedField.encrypted) {
          encryptedRecord[fieldName] = encryptedField.value;
        }
      }
    }

    return encryptedRecord;
  }
}
```

## 🔄 **Data Synchronization**

### **1. Sync Service Implementation**

#### **Sync Manager**
```typescript
// apps/mobile/src/services/sync/SyncManager.ts
export class SyncManager {
  private database: Database;
  private apiClient: ApiClient;
  private encryptedFieldManager: EncryptedFieldManager;

  async performSync(): Promise<SyncResult> {
    const syncResult: SyncResult = {
      success: false,
      startTime: Date.now(),
      endTime: 0,
      recordsSynced: 0,
      conflicts: [],
      errors: [],
    };

    try {
      // 1. Get local changes since last sync
      const localChanges = await this.getLocalChanges();

      // 2. Push local changes to server
      const pushResult = await this.pushChanges(localChanges);

      // 3. Get server changes since last sync
      const serverChanges = await this.getServerChanges();

      // 4. Resolve conflicts
      const resolvedChanges = await this.resolveConflicts(serverChanges);

      // 5. Apply server changes locally
      const pullResult = await this.pullChanges(resolvedChanges);

      // 6. Update sync metadata
      await this.updateSyncMetadata();

      syncResult.success = true;
      syncResult.recordsSynced = pushResult.count + pullResult.count;
      syncResult.conflicts = resolvedChanges.conflicts;
    } catch (error) {
      syncResult.errors.push(error.message);
    } finally {
      syncResult.endTime = Date.now();
    }

    return syncResult;
  }

  private async resolveConflicts(changes: ServerChange[]): Promise<ResolvedChanges> {
    const resolved: ResolvedChanges = {
      changes: [],
      conflicts: [],
    };

    for (const change of changes) {
      const localRecord = await this.getLocalRecord(change.table, change.id);
      
      if (localRecord && localRecord.updated_at > change.updated_at) {
        // Local change is newer - conflict detected
        const conflict: SyncConflict = {
          table: change.table,
          recordId: change.id,
          localData: localRecord,
          serverData: change.data,
          resolution: 'local_wins', // Default resolution strategy
        };
        
        resolved.conflicts.push(conflict);
      } else {
        // Server change is newer or no local conflict
        resolved.changes.push(change);
      }
    }

    return resolved;
  }
}
```

### **2. Offline Queue Management**

#### **Offline Queue**
```typescript
// apps/mobile/src/services/sync/OfflineQueue.ts
export class OfflineQueue {
  private database: Database;
  private queueTable = 'sync_queue';

  async addOperation(operation: OfflineOperation): Promise<void> {
    await this.database.write(async () => {
      await this.database.get(this.queueTable).create(record => {
        record.operation = operation.type;
        record.table = operation.table;
        record.recordId = operation.recordId;
        record.data = JSON.stringify(operation.data);
        record.timestamp = Date.now();
        record.retryCount = 0;
        record.status = 'pending';
      });
    });
  }

  async processQueue(): Promise<QueueProcessResult> {
    const pendingOperations = await this.database
      .get(this.queueTable)
      .query(Q.where('status', 'pending'))
      .fetch();

    const result: QueueProcessResult = {
      processed: 0,
      failed: 0,
      errors: [],
    };

    for (const operation of pendingOperations) {
      try {
        await this.executeOperation(operation);
        await this.markOperationComplete(operation.id);
        result.processed++;
      } catch (error) {
        await this.markOperationFailed(operation.id, error.message);
        result.failed++;
        result.errors.push({
          operationId: operation.id,
          error: error.message,
        });
      }
    }

    return result;
  }
}
```

## 🧪 **Testing Implementation**

### **1. Unit Testing**

#### **Encryption Service Tests**
```typescript
// apps/mobile/src/tests/encryption.test.ts
describe('EncryptionService', () => {
  let encryptionService: EncryptionService;

  beforeEach(() => {
    encryptionService = EncryptionService.getInstance();
  });

  it('should encrypt and decrypt data correctly', async () => {
    const originalData = 'sensitive information';
    const context = 'test_context';

    // Encrypt data
    const encryptionResult = await encryptionService.encryptData(originalData, context);
    
    expect(encryptionResult.encrypted).toBe(true);
    expect(encryptionResult.data).toBeDefined();
    expect(encryptionResult.keyId).toBeDefined();

    // Decrypt data
    const decryptedData = await encryptionService.decryptData(
      encryptionResult.data,
      encryptionResult.keyId,
      context
    );

    expect(decryptedData).toBe(originalData);
  });

  it('should use unique IVs for each encryption', async () => {
    const data = 'test data';
    const context = 'test_context';

    const result1 = await encryptionService.encryptData(data, context);
    const result2 = await encryptionService.encryptData(data, context);

    expect(result1.data).not.toBe(result2.data);
  });
});
```

### **2. Integration Testing**

#### **End-to-End User Flow Tests**
```typescript
// apps/mobile/src/tests/integration/userFlow.test.ts
describe('User Registration and Login Flow', () => {
  it('should complete full user registration and login', async () => {
    // 1. Register new user
    const userData = {
      email: 'test@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
    };

    const registrationResult = await authService.register(userData);
    expect(registrationResult.success).toBe(true);
    expect(registrationResult.user).toBeDefined();

    // 2. Login with credentials
    const loginResult = await authService.login({
      email: userData.email,
      password: userData.password,
    });

    expect(loginResult.success).toBe(true);
    expect(loginResult.token).toBeDefined();

    // 3. Create encrypted financial account
    const accountData = {
      name: 'Test Bank Account',
      type: 'checking',
      accountNumber: '1234567890',
      routingNumber: '987654321',
      balance: 1000.50,
    };

    const account = await database.write(async () => {
      return await database.get('financial_accounts').create(record => {
        record.userId = loginResult.user.id;
        record.name = accountData.name;
        record.type = accountData.type;
        record.balance = accountData.balance;
        // Encrypted fields will be handled by the model
      });
    });

    expect(account).toBeDefined();
    expect(account.name).toBe(accountData.name);

    // 4. Verify data encryption
    const encryptedAccount = await account.getEncryptedAccountNumber();
    expect(encryptedAccount).not.toBe(accountData.accountNumber);

    const decryptedAccount = await account.getAccountNumber();
    expect(decryptedAccount).toBe(accountData.accountNumber);
  });
});
```

## 🚀 **Deployment Guide**

### **1. Environment Configuration**

#### **Production Environment Variables**
```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/drishti_prod
DATABASE_SSL=true
DATABASE_POOL_SIZE=20

# Encryption Configuration
ENCRYPTION_KEY_ROTATION_INTERVAL=90
ENCRYPTION_PBKDF2_ITERATIONS=100000
ENCRYPTION_AUDIT_RETENTION_DAYS=90

# Security Configuration
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# API Configuration
API_PORT=3000
API_HOST=0.0.0.0
API_CORS_ORIGIN=https://your-domain.com

# Monitoring Configuration
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

### **2. Deployment Steps**

#### **Mobile App Deployment**
```bash
# 1. Install dependencies
npm install

# 2. Run tests
npm run test

# 3. Build for production
npm run build:prod

# 4. Deploy to app stores
npm run deploy:ios
npm run deploy:android
```

#### **Backend API Deployment**
```bash
# 1. Install dependencies
npm install --production

# 2. Run database migrations
npm run migrate:prod

# 3. Build TypeScript
npm run build

# 4. Start production server
npm run start:prod
```

### **3. Monitoring Setup**

#### **Health Check Endpoints**
```typescript
// Health check implementation
app.get('/health', async (request, reply) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabaseHealth(),
      encryption: await checkEncryptionHealth(),
      storage: await checkStorageHealth(),
    },
  };

  const allHealthy = Object.values(health.services).every(
    service => service.status === 'healthy'
  );

  reply.code(allHealthy ? 200 : 503).send(health);
});
```

## 📚 **Best Practices**

### **1. Security Best Practices**
- Always use hardware-backed storage when available
- Implement proper key rotation schedules
- Log all security events for audit purposes
- Use biometric authentication for key access
- Validate all inputs and sanitize outputs

### **2. Performance Best Practices**
- Use database indexes for frequently queried fields
- Implement proper caching strategies
- Optimize encryption operations for mobile devices
- Use lazy loading for large datasets
- Monitor and optimize memory usage

### **3. Development Best Practices**
- Write comprehensive tests for all critical paths
- Use TypeScript for type safety
- Follow consistent coding standards
- Document all public APIs
- Implement proper error handling

---

**Technical Guide Version**: 1.0  
**Last Updated**: January 2, 2025  
**Status**: ✅ **PRODUCTION READY**
