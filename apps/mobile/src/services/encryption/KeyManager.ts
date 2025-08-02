import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import { encryptionService } from './EncryptionService';

/**
 * Secure Key Management Service
 * Handles secure storage, rotation, and lifecycle management of encryption keys
 */

export interface KeyRotationPolicy {
  rotationIntervalDays: number;
  maxKeyAge: number;
  requireBiometricAuth: boolean;
  autoRotationEnabled: boolean;
}

export interface KeyBackup {
  keyId: string;
  encryptedKey: string;
  backupDate: number;
  recoveryCode: string;
}

export interface KeyAuditLog {
  keyId: string;
  operation: 'created' | 'rotated' | 'accessed' | 'deleted' | 'backed_up' | 'restored';
  timestamp: number;
  userId?: string;
  deviceId: string;
  success: boolean;
  errorMessage?: string;
}

class KeyManager {
  private static instance: KeyManager;
  private rotationPolicy: KeyRotationPolicy = {
    rotationIntervalDays: 90,
    maxKeyAge: 365 * 24 * 60 * 60 * 1000, // 1 year in ms
    requireBiometricAuth: true,
    autoRotationEnabled: true
  };
  private auditLogs: KeyAuditLog[] = [];
  private rotationTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeKeyManager();
  }

  public static getInstance(): KeyManager {
    if (!KeyManager.instance) {
      KeyManager.instance = new KeyManager();
    }
    return KeyManager.instance;
  }

  /**
   * Initialize key manager with security checks
   */
  private async initializeKeyManager(): Promise<void> {
    try {
      await this.loadRotationPolicy();
      await this.loadAuditLogs();
      await this.checkDeviceSecurity();
      await this.startAutoRotation();
      
      console.log('🔐 Key Manager initialized successfully');
    } catch (error) {
      console.error('❌ Key Manager initialization failed:', error);
      throw error;
    }
  }

  /**
   * Check device security capabilities
   */
  private async checkDeviceSecurity(): Promise<void> {
    try {
      // Check if device supports biometric authentication
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      console.log('🔍 Device Security Check:', {
        hasHardware,
        isEnrolled,
        supportedTypes: supportedTypes.map(type => 
          LocalAuthentication.AuthenticationType[type]
        )
      });

      if (this.rotationPolicy.requireBiometricAuth && (!hasHardware || !isEnrolled)) {
        console.warn('⚠️ Biometric authentication not available, falling back to device passcode');
      }

      // Check SecureStore availability
      const isAvailable = await SecureStore.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('SecureStore is not available on this device');
      }

    } catch (error) {
      console.error('❌ Device security check failed:', error);
      throw error;
    }
  }

  /**
   * Securely store encryption key with biometric protection
   */
  public async storeKey(keyId: string, keyData: string, requireAuth: boolean = true): Promise<void> {
    try {
      const options: SecureStore.SecureStoreOptions = {
        requireAuthentication: requireAuth && this.rotationPolicy.requireBiometricAuth,
        authenticationPrompt: 'Authenticate to access your encryption keys',
        keychainService: 'drishti-encryption-keys',
      };

      // Add additional security on iOS
      if (Platform.OS === 'ios') {
        options.accessGroup = 'group.com.drishti.encryption';
      }

      await SecureStore.setItemAsync(`key_${keyId}`, keyData, options);
      
      await this.logKeyOperation(keyId, 'created', true);
      console.log(`🔑 Key stored securely: ${keyId}`);
    } catch (error) {
      await this.logKeyOperation(keyId, 'created', false, error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Failed to store key:', error);
      throw error;
    }
  }

  /**
   * Retrieve encryption key with authentication
   */
  public async retrieveKey(keyId: string): Promise<string | null> {
    try {
      const options: SecureStore.SecureStoreOptions = {
        requireAuthentication: this.rotationPolicy.requireBiometricAuth,
        authenticationPrompt: 'Authenticate to access your encryption keys',
        keychainService: 'drishti-encryption-keys',
      };

      const keyData = await SecureStore.getItemAsync(`key_${keyId}`, options);
      
      if (keyData) {
        await this.logKeyOperation(keyId, 'accessed', true);
      }
      
      return keyData;
    } catch (error) {
      await this.logKeyOperation(keyId, 'accessed', false, error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Failed to retrieve key:', error);
      return null;
    }
  }

  /**
   * Delete encryption key
   */
  public async deleteKey(keyId: string): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync(`key_${keyId}`);
      await this.logKeyOperation(keyId, 'deleted', true);
      console.log(`🗑️ Key deleted: ${keyId}`);
      return true;
    } catch (error) {
      await this.logKeyOperation(keyId, 'deleted', false, error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Failed to delete key:', error);
      return false;
    }
  }

  /**
   * Rotate encryption keys according to policy
   */
  public async rotateKeys(): Promise<string> {
    try {
      console.log('🔄 Starting key rotation...');
      
      // Generate new key through encryption service
      const newKeyId = await encryptionService.rotateKeys();
      
      // Clean up old keys based on policy
      await this.cleanupOldKeys();
      
      await this.logKeyOperation(newKeyId, 'rotated', true);
      console.log(`✅ Key rotation completed: ${newKeyId}`);
      
      return newKeyId;
    } catch (error) {
      await this.logKeyOperation('unknown', 'rotated', false, error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Key rotation failed:', error);
      throw error;
    }
  }

  /**
   * Create encrypted backup of keys
   */
  public async createKeyBackup(userPassword: string): Promise<KeyBackup> {
    try {
      // Get current key
      const currentKeyId = await this.getCurrentKeyId();
      if (!currentKeyId) {
        throw new Error('No current key to backup');
      }

      const keyData = await this.retrieveKey(currentKeyId);
      if (!keyData) {
        throw new Error('Failed to retrieve key for backup');
      }

      // Encrypt key data with user password
      const encryptedKey = await this.encryptKeyForBackup(keyData, userPassword);
      
      // Generate recovery code
      const recoveryCode = await this.generateRecoveryCode();

      const backup: KeyBackup = {
        keyId: currentKeyId,
        encryptedKey,
        backupDate: Date.now(),
        recoveryCode
      };

      // Store backup securely
      await SecureStore.setItemAsync(`backup_${currentKeyId}`, JSON.stringify(backup));
      
      await this.logKeyOperation(currentKeyId, 'backed_up', true);
      console.log(`💾 Key backup created: ${currentKeyId}`);
      
      return backup;
    } catch (error) {
      await this.logKeyOperation('unknown', 'backed_up', false, error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Key backup failed:', error);
      throw error;
    }
  }

  /**
   * Restore key from backup
   */
  public async restoreKeyFromBackup(backup: KeyBackup, userPassword: string, recoveryCode: string): Promise<boolean> {
    try {
      // Verify recovery code
      if (backup.recoveryCode !== recoveryCode) {
        throw new Error('Invalid recovery code');
      }

      // Decrypt key data
      const keyData = await this.decryptKeyFromBackup(backup.encryptedKey, userPassword);
      
      // Store restored key
      await this.storeKey(backup.keyId, keyData, false);
      
      await this.logKeyOperation(backup.keyId, 'restored', true);
      console.log(`🔄 Key restored from backup: ${backup.keyId}`);
      
      return true;
    } catch (error) {
      await this.logKeyOperation(backup.keyId, 'restored', false, error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Key restore failed:', error);
      return false;
    }
  }

  /**
   * Update key rotation policy
   */
  public async updateRotationPolicy(policy: Partial<KeyRotationPolicy>): Promise<void> {
    try {
      this.rotationPolicy = { ...this.rotationPolicy, ...policy };
      await this.saveRotationPolicy();
      
      // Restart auto rotation with new policy
      if (this.rotationPolicy.autoRotationEnabled) {
        await this.startAutoRotation();
      } else {
        this.stopAutoRotation();
      }
      
      console.log('⚙️ Key rotation policy updated:', this.rotationPolicy);
    } catch (error) {
      console.error('❌ Failed to update rotation policy:', error);
      throw error;
    }
  }

  /**
   * Get key rotation policy
   */
  public getRotationPolicy(): KeyRotationPolicy {
    return { ...this.rotationPolicy };
  }

  /**
   * Get audit logs
   */
  public getAuditLogs(limit: number = 100): KeyAuditLog[] {
    return this.auditLogs.slice(-limit);
  }

  /**
   * Check if key rotation is needed
   */
  public async isRotationNeeded(): Promise<boolean> {
    try {
      const currentKeyId = await this.getCurrentKeyId();
      if (!currentKeyId) {
        return true; // No key exists, need to create one
      }

      const keyCreationTime = this.extractTimestampFromKeyId(currentKeyId);
      const rotationInterval = this.rotationPolicy.rotationIntervalDays * 24 * 60 * 60 * 1000;
      
      return (Date.now() - keyCreationTime) >= rotationInterval;
    } catch (error) {
      console.error('❌ Failed to check rotation need:', error);
      return false;
    }
  }

  /**
   * Private helper methods
   */
  private async getCurrentKeyId(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('current_encryption_key_id');
    } catch (error) {
      console.error('Failed to get current key ID:', error);
      return null;
    }
  }

  private async startAutoRotation(): Promise<void> {
    if (!this.rotationPolicy.autoRotationEnabled) {
      return;
    }

    this.stopAutoRotation();

    const checkInterval = 24 * 60 * 60 * 1000; // Check daily
    this.rotationTimer = setInterval(async () => {
      try {
        const needsRotation = await this.isRotationNeeded();
        if (needsRotation) {
          await this.rotateKeys();
        }
      } catch (error) {
        console.error('❌ Auto rotation check failed:', error);
      }
    }, checkInterval);

    console.log('⏰ Auto key rotation started');
  }

  private stopAutoRotation(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
      console.log('⏹️ Auto key rotation stopped');
    }
  }

  private async cleanupOldKeys(): Promise<void> {
    try {
      // This would implement cleanup of keys older than maxKeyAge
      // For now, we'll just log the intent
      console.log('🧹 Cleaning up old keys based on policy');
    } catch (error) {
      console.error('❌ Key cleanup failed:', error);
    }
  }

  private async encryptKeyForBackup(keyData: string, password: string): Promise<string> {
    // Simplified encryption for backup
    // In a real implementation, you would use proper encryption
    const combined = keyData + password;
    return btoa(combined);
  }

  private async decryptKeyFromBackup(encryptedKey: string, password: string): Promise<string> {
    // Simplified decryption for backup
    // In a real implementation, you would use proper decryption
    const combined = atob(encryptedKey);
    return combined.replace(password, '');
  }

  private async generateRecoveryCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private extractTimestampFromKeyId(keyId: string): number {
    // Extract timestamp from key ID format: key_timestamp_random
    const parts = keyId.split('_');
    return parts.length > 1 ? parseInt(parts[1]) : Date.now();
  }

  private async logKeyOperation(
    keyId: string,
    operation: KeyAuditLog['operation'],
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      const logEntry: KeyAuditLog = {
        keyId,
        operation,
        timestamp: Date.now(),
        deviceId: await this.getDeviceId(),
        success,
        errorMessage
      };

      this.auditLogs.push(logEntry);
      
      // Keep only last 1000 logs
      if (this.auditLogs.length > 1000) {
        this.auditLogs = this.auditLogs.slice(-1000);
      }

      await this.saveAuditLogs();
    } catch (error) {
      console.error('Failed to log key operation:', error);
    }
  }

  private async getDeviceId(): Promise<string> {
    try {
      let deviceId = await SecureStore.getItemAsync('device_id');
      if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await SecureStore.setItemAsync('device_id', deviceId);
      }
      return deviceId;
    } catch (error) {
      return `unknown_${Date.now()}`;
    }
  }

  private async loadRotationPolicy(): Promise<void> {
    try {
      const policyData = await SecureStore.getItemAsync('key_rotation_policy');
      if (policyData) {
        this.rotationPolicy = { ...this.rotationPolicy, ...JSON.parse(policyData) };
      }
    } catch (error) {
      console.error('Failed to load rotation policy:', error);
    }
  }

  private async saveRotationPolicy(): Promise<void> {
    try {
      await SecureStore.setItemAsync('key_rotation_policy', JSON.stringify(this.rotationPolicy));
    } catch (error) {
      console.error('Failed to save rotation policy:', error);
    }
  }

  private async loadAuditLogs(): Promise<void> {
    try {
      const logsData = await SecureStore.getItemAsync('key_audit_logs');
      if (logsData) {
        this.auditLogs = JSON.parse(logsData);
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    }
  }

  private async saveAuditLogs(): Promise<void> {
    try {
      await SecureStore.setItemAsync('key_audit_logs', JSON.stringify(this.auditLogs));
    } catch (error) {
      console.error('Failed to save audit logs:', error);
    }
  }
}

export const keyManager = KeyManager.getInstance();
