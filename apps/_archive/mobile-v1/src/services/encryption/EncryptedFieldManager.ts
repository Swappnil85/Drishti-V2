import { encryptionService, EncryptionResult } from './EncryptionService';
import { keyManager } from './KeyManager';

/**
 * Encrypted Field Manager
 * Handles encryption/decryption of sensitive database fields
 */

export interface EncryptedField {
  value: string;
  encrypted: boolean;
  keyId?: string;
  lastUpdated: number;
}

export interface FieldEncryptionConfig {
  fieldName: string;
  required: boolean;
  sensitive: boolean;
  auditAccess: boolean;
}

export interface EncryptionContext {
  tableName: string;
  recordId: string;
  userId?: string;
  operation: 'read' | 'write' | 'update' | 'delete';
}

class EncryptedFieldManager {
  private static instance: EncryptedFieldManager;
  private encryptedFields: Map<string, FieldEncryptionConfig> = new Map();
  private accessLog: Array<{
    context: EncryptionContext;
    timestamp: number;
    success: boolean;
    error?: string;
  }> = [];

  private constructor() {
    this.initializeEncryptedFields();
  }

  public static getInstance(): EncryptedFieldManager {
    if (!EncryptedFieldManager.instance) {
      EncryptedFieldManager.instance = new EncryptedFieldManager();
    }
    return EncryptedFieldManager.instance;
  }

  /**
   * Initialize configuration for encrypted fields
   */
  private initializeEncryptedFields(): void {
    // Define which fields should be encrypted
    const encryptedFieldConfigs: FieldEncryptionConfig[] = [
      // Financial Account sensitive fields
      {
        fieldName: 'accountNumber',
        required: false,
        sensitive: true,
        auditAccess: true,
      },
      {
        fieldName: 'routingNumber',
        required: false,
        sensitive: true,
        auditAccess: true,
      },
      {
        fieldName: 'bankName',
        required: false,
        sensitive: false,
        auditAccess: true,
      },
      {
        fieldName: 'accountHolderName',
        required: false,
        sensitive: true,
        auditAccess: true,
      },

      // User sensitive fields
      {
        fieldName: 'socialSecurityNumber',
        required: false,
        sensitive: true,
        auditAccess: true,
      },
      {
        fieldName: 'taxId',
        required: false,
        sensitive: true,
        auditAccess: true,
      },
      {
        fieldName: 'phoneNumber',
        required: false,
        sensitive: false,
        auditAccess: false,
      },

      // Financial Goal sensitive fields
      {
        fieldName: 'goalNotes',
        required: false,
        sensitive: false,
        auditAccess: false,
      },
      {
        fieldName: 'privateNotes',
        required: false,
        sensitive: true,
        auditAccess: true,
      },

      // Investment sensitive fields
      {
        fieldName: 'brokerageAccountNumber',
        required: false,
        sensitive: true,
        auditAccess: true,
      },
      {
        fieldName: 'investmentNotes',
        required: false,
        sensitive: false,
        auditAccess: false,
      },
    ];

    encryptedFieldConfigs.forEach(config => {
      this.encryptedFields.set(config.fieldName, config);
    });

    console.log(
      `🔐 Initialized ${encryptedFieldConfigs.length} encrypted field configurations`
    );
  }

  /**
   * Encrypt a field value
   */
  public async encryptField(
    fieldName: string,
    value: string,
    context: EncryptionContext
  ): Promise<EncryptedField> {
    try {
      if (!value || value.trim() === '') {
        return {
          value: '',
          encrypted: false,
          lastUpdated: Date.now(),
        };
      }

      const config = this.encryptedFields.get(fieldName);
      if (!config) {
        // Field not configured for encryption, return as-is
        return {
          value,
          encrypted: false,
          lastUpdated: Date.now(),
        };
      }

      // Encrypt the value
      const encryptionResult = await encryptionService.encryptData(
        value,
        `${context.tableName}.${fieldName}.${context.recordId}`
      );

      // Create encrypted field object
      const encryptedField: EncryptedField = {
        value: JSON.stringify(encryptionResult),
        encrypted: true,
        keyId: encryptionResult.keyId,
        lastUpdated: Date.now(),
      };

      // Log access if required
      if (config.auditAccess) {
        await this.logFieldAccess(context, true);
      }

      console.log(
        `🔒 Field encrypted: ${fieldName} for ${context.tableName}:${context.recordId}`
      );
      return encryptedField;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      await this.logFieldAccess(context, false, errorMessage);
      console.error(`❌ Field encryption failed for ${fieldName}:`, error);
      throw new Error(`Failed to encrypt field ${fieldName}: ${errorMessage}`);
    }
  }

  /**
   * Decrypt a field value
   */
  public async decryptField(
    fieldName: string,
    encryptedField: EncryptedField,
    context: EncryptionContext
  ): Promise<string> {
    try {
      if (!encryptedField.encrypted) {
        // Field is not encrypted, return as-is
        return encryptedField.value;
      }

      if (!encryptedField.value || encryptedField.value.trim() === '') {
        return '';
      }

      // Parse encryption result
      const encryptionResult: EncryptionResult = JSON.parse(
        encryptedField.value
      );

      // Decrypt the value
      const decryptionResult = await encryptionService.decryptData(
        encryptionResult,
        `${context.tableName}.${fieldName}.${context.recordId}`
      );

      const config = this.encryptedFields.get(fieldName);
      if (config?.auditAccess) {
        await this.logFieldAccess(context, true);
      }

      console.log(
        `🔓 Field decrypted: ${fieldName} for ${context.tableName}:${context.recordId}`
      );
      return decryptionResult.decryptedData;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      await this.logFieldAccess(context, false, errorMessage);
      console.error(`❌ Field decryption failed for ${fieldName}:`, error);

      // Return empty string for failed decryption to prevent app crashes
      return '';
    }
  }

  /**
   * Encrypt multiple fields in a record
   */
  public async encryptRecord<T extends Record<string, any>>(
    record: T,
    context: Omit<EncryptionContext, 'recordId'> & { recordId?: string }
  ): Promise<T> {
    try {
      const recordId = context.recordId || `temp_${Date.now()}`;
      const fullContext: EncryptionContext = { ...context, recordId };

      const encryptedRecord = { ...record };

      // Process each field that should be encrypted
      for (const [fieldName, config] of this.encryptedFields.entries()) {
        if (
          fieldName in record &&
          record[fieldName] !== null &&
          record[fieldName] !== undefined
        ) {
          const fieldValue = String(record[fieldName]);
          const encryptedField = await this.encryptField(
            fieldName,
            fieldValue,
            fullContext
          );
          encryptedRecord[fieldName] = encryptedField;
        }
      }

      console.log(`🔒 Record encrypted for ${context.tableName}:${recordId}`);
      return encryptedRecord;
    } catch (error) {
      console.error(`❌ Record encryption failed:`, error);
      throw error;
    }
  }

  /**
   * Decrypt multiple fields in a record
   */
  public async decryptRecord<T extends Record<string, any>>(
    encryptedRecord: T,
    context: EncryptionContext
  ): Promise<T> {
    try {
      const decryptedRecord = { ...encryptedRecord };

      // Process each encrypted field
      for (const [fieldName] of this.encryptedFields.entries()) {
        if (
          fieldName in encryptedRecord &&
          encryptedRecord[fieldName] !== null
        ) {
          const encryptedField = encryptedRecord[fieldName] as EncryptedField;
          if (
            typeof encryptedField === 'object' &&
            'encrypted' in encryptedField
          ) {
            const decryptedValue = await this.decryptField(
              fieldName,
              encryptedField,
              context
            );
            decryptedRecord[fieldName] = decryptedValue;
          }
        }
      }

      console.log(
        `🔓 Record decrypted for ${context.tableName}:${context.recordId}`
      );
      return decryptedRecord;
    } catch (error) {
      console.error(`❌ Record decryption failed:`, error);
      throw error;
    }
  }

  /**
   * Check if a field should be encrypted
   */
  public isFieldEncrypted(fieldName: string): boolean {
    return this.encryptedFields.has(fieldName);
  }

  /**
   * Get field encryption configuration
   */
  public getFieldConfig(fieldName: string): FieldEncryptionConfig | undefined {
    return this.encryptedFields.get(fieldName);
  }

  /**
   * Update field encryption configuration
   */
  public updateFieldConfig(
    fieldName: string,
    config: FieldEncryptionConfig
  ): void {
    this.encryptedFields.set(fieldName, config);
    console.log(`⚙️ Updated encryption config for field: ${fieldName}`);
  }

  /**
   * Migrate encrypted data to new key
   */
  public async migrateToNewKey(
    oldEncryptedField: EncryptedField,
    fieldName: string,
    context: EncryptionContext
  ): Promise<EncryptedField> {
    try {
      // Decrypt with old key
      const decryptedValue = await this.decryptField(
        fieldName,
        oldEncryptedField,
        context
      );

      // Re-encrypt with current key
      const newEncryptedField = await this.encryptField(
        fieldName,
        decryptedValue,
        context
      );

      console.log(`🔄 Migrated encrypted field ${fieldName} to new key`);
      return newEncryptedField;
    } catch (error) {
      console.error(`❌ Key migration failed for field ${fieldName}:`, error);
      throw error;
    }
  }

  /**
   * Batch migrate multiple records to new key
   */
  public async batchMigrateRecords<T extends Record<string, any>>(
    records: T[],
    context: Omit<EncryptionContext, 'recordId'>
  ): Promise<T[]> {
    try {
      const migratedRecords: T[] = [];

      for (const record of records) {
        const recordContext: EncryptionContext = {
          ...context,
          recordId: record.id || `temp_${Date.now()}`,
        };

        const migratedRecord = { ...record };

        // Migrate each encrypted field
        for (const [fieldName] of this.encryptedFields.entries()) {
          if (fieldName in record && record[fieldName] !== null) {
            const encryptedField = record[fieldName] as EncryptedField;
            if (
              typeof encryptedField === 'object' &&
              'encrypted' in encryptedField &&
              encryptedField.encrypted
            ) {
              migratedRecord[fieldName] = await this.migrateToNewKey(
                encryptedField,
                fieldName,
                recordContext
              );
            }
          }
        }

        migratedRecords.push(migratedRecord);
      }

      console.log(`🔄 Batch migrated ${records.length} records`);
      return migratedRecords;
    } catch (error) {
      console.error(`❌ Batch migration failed:`, error);
      throw error;
    }
  }

  /**
   * Validate encrypted field integrity
   */
  public async validateFieldIntegrity(
    encryptedField: EncryptedField,
    fieldName: string,
    context: EncryptionContext
  ): Promise<boolean> {
    try {
      if (!encryptedField.encrypted) {
        return true; // Non-encrypted fields are always valid
      }

      // Try to decrypt the field
      await this.decryptField(fieldName, encryptedField, context);
      return true;
    } catch (error) {
      console.error(
        `❌ Field integrity validation failed for ${fieldName}:`,
        error
      );
      return false;
    }
  }

  /**
   * Get access logs
   */
  public getAccessLogs(limit: number = 100): Array<{
    context: EncryptionContext;
    timestamp: number;
    success: boolean;
    error?: string;
  }> {
    return this.accessLog.slice(-limit);
  }

  /**
   * Clear access logs
   */
  public clearAccessLogs(): void {
    this.accessLog = [];
    console.log('🗑️ Access logs cleared');
  }

  /**
   * Get encryption statistics
   */
  public getEncryptionStats(): {
    totalEncryptedFields: number;
    sensitiveFields: number;
    auditedFields: number;
    totalAccesses: number;
    failedAccesses: number;
  } {
    const configs = Array.from(this.encryptedFields.values());
    const totalAccesses = this.accessLog.length;
    const failedAccesses = this.accessLog.filter(log => !log.success).length;

    return {
      totalEncryptedFields: configs.length,
      sensitiveFields: configs.filter(c => c.sensitive).length,
      auditedFields: configs.filter(c => c.auditAccess).length,
      totalAccesses,
      failedAccesses,
    };
  }

  /**
   * Private helper methods
   */
  private async logFieldAccess(
    context: EncryptionContext,
    success: boolean,
    error?: string
  ): Promise<void> {
    try {
      this.accessLog.push({
        context: { ...context },
        timestamp: Date.now(),
        success,
        error,
      });

      // Keep only last 1000 logs
      if (this.accessLog.length > 1000) {
        this.accessLog = this.accessLog.slice(-1000);
      }
    } catch (logError) {
      console.error('Failed to log field access:', logError);
    }
  }
}

export const encryptedFieldManager = EncryptedFieldManager.getInstance();

/**
 * Database Model Extensions for Encrypted Fields
 */

export interface EncryptedFinancialAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  accountNumber?: EncryptedField;
  routingNumber?: EncryptedField;
  bankName?: EncryptedField;
  accountHolderName?: EncryptedField;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface EncryptedUser {
  id: string;
  name: string;
  email: string;
  phoneNumber?: EncryptedField;
  socialSecurityNumber?: EncryptedField;
  taxId?: EncryptedField;
  createdAt: number;
  updatedAt: number;
}

export interface EncryptedFinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  goalNotes?: EncryptedField;
  privateNotes?: EncryptedField;
  priority: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * Helper functions for working with encrypted models
 */
export class EncryptedModelHelper {
  /**
   * Prepare a financial account for database storage (encrypt sensitive fields)
   */
  static async prepareFinancialAccountForStorage(
    account: any,
    userId: string
  ): Promise<EncryptedFinancialAccount> {
    const context: EncryptionContext = {
      tableName: 'financial_accounts',
      recordId: account.id || `temp_${Date.now()}`,
      userId,
      operation: 'write',
    };

    return await encryptedFieldManager.encryptRecord(account, context);
  }

  /**
   * Prepare a financial account for application use (decrypt sensitive fields)
   */
  static async prepareFinancialAccountForUse(
    encryptedAccount: EncryptedFinancialAccount,
    userId: string
  ): Promise<any> {
    const context: EncryptionContext = {
      tableName: 'financial_accounts',
      recordId: encryptedAccount.id,
      userId,
      operation: 'read',
    };

    return await encryptedFieldManager.decryptRecord(encryptedAccount, context);
  }

  /**
   * Prepare a user record for database storage (encrypt sensitive fields)
   */
  static async prepareUserForStorage(
    user: any,
    userId: string
  ): Promise<EncryptedUser> {
    const context: EncryptionContext = {
      tableName: 'users',
      recordId: user.id || userId,
      userId,
      operation: 'write',
    };

    return await encryptedFieldManager.encryptRecord(user, context);
  }

  /**
   * Prepare a user record for application use (decrypt sensitive fields)
   */
  static async prepareUserForUse(
    encryptedUser: EncryptedUser,
    userId: string
  ): Promise<any> {
    const context: EncryptionContext = {
      tableName: 'users',
      recordId: encryptedUser.id,
      userId,
      operation: 'read',
    };

    return await encryptedFieldManager.decryptRecord(encryptedUser, context);
  }

  /**
   * Prepare a financial goal for database storage (encrypt sensitive fields)
   */
  static async prepareFinancialGoalForStorage(
    goal: any,
    userId: string
  ): Promise<EncryptedFinancialGoal> {
    const context: EncryptionContext = {
      tableName: 'financial_goals',
      recordId: goal.id || `temp_${Date.now()}`,
      userId,
      operation: 'write',
    };

    return await encryptedFieldManager.encryptRecord(goal, context);
  }

  /**
   * Prepare a financial goal for application use (decrypt sensitive fields)
   */
  static async prepareFinancialGoalForUse(
    encryptedGoal: EncryptedFinancialGoal,
    userId: string
  ): Promise<any> {
    const context: EncryptionContext = {
      tableName: 'financial_goals',
      recordId: encryptedGoal.id,
      userId,
      operation: 'read',
    };

    return await encryptedFieldManager.decryptRecord(encryptedGoal, context);
  }
}
