import { encryptionService } from './EncryptionService';
import { keyManager } from './KeyManager';
import { securityAuditService, AuditEventType, AuditSeverity } from '../security/SecurityAuditService';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';

/**
 * Encryption Recovery Service
 * Handles graceful failure scenarios and data recovery options
 */

export enum RecoveryScenario {
  KEY_CORRUPTION = 'key_corruption',
  KEY_LOST = 'key_lost',
  DECRYPTION_FAILURE = 'decryption_failure',
  AUTHENTICATION_FAILURE = 'authentication_failure',
  DEVICE_COMPROMISE = 'device_compromise',
  DATA_CORRUPTION = 'data_corruption'
}

export interface RecoveryOption {
  id: string;
  scenario: RecoveryScenario;
  title: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  requiresUserAction: boolean;
  requiresReAuthentication: boolean;
  dataLossRisk: boolean;
  estimatedTime: string;
  steps: string[];
}

export interface RecoveryAttempt {
  id: string;
  scenario: RecoveryScenario;
  optionId: string;
  startTime: number;
  endTime?: number;
  success: boolean;
  error?: string;
  dataRecovered?: number;
  dataLost?: number;
  userId?: string;
}

export interface FailureContext {
  operation: string;
  resourceType: string;
  resourceId: string;
  errorCode: string;
  errorMessage: string;
  timestamp: number;
  userId?: string;
  attemptCount: number;
}

class EncryptionRecoveryService {
  private static instance: EncryptionRecoveryService;
  private recoveryAttempts: RecoveryAttempt[] = [];
  private failureHistory: Map<string, FailureContext[]> = new Map();
  private recoveryOptions: Map<RecoveryScenario, RecoveryOption[]> = new Map();

  private constructor() {
    this.initializeRecoveryService();
  }

  public static getInstance(): EncryptionRecoveryService {
    if (!EncryptionRecoveryService.instance) {
      EncryptionRecoveryService.instance = new EncryptionRecoveryService();
    }
    return EncryptionRecoveryService.instance;
  }

  /**
   * Initialize recovery service with predefined options
   */
  private async initializeRecoveryService(): Promise<void> {
    try {
      await this.loadRecoveryAttempts();
      this.setupRecoveryOptions();
      
      console.log('🛡️ Encryption Recovery Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Encryption Recovery Service:', error);
    }
  }

  /**
   * Handle decryption failure with graceful recovery
   */
  public async handleDecryptionFailure(
    failureContext: FailureContext
  ): Promise<{
    recovered: boolean;
    data?: string;
    recoveryOption?: RecoveryOption;
    requiresUserAction: boolean;
  }> {
    try {
      console.log(`🚨 Handling decryption failure: ${failureContext.operation}`);
      
      // Log the failure
      await this.logFailure(failureContext);
      
      // Determine the recovery scenario
      const scenario = this.determineRecoveryScenario(failureContext);
      
      // Get available recovery options
      const options = this.getRecoveryOptions(scenario);
      
      // Try automatic recovery first
      const autoRecoveryResult = await this.attemptAutoRecovery(failureContext, scenario);
      
      if (autoRecoveryResult.recovered) {
        console.log('✅ Automatic recovery successful');
        return autoRecoveryResult;
      }
      
      // If auto recovery fails, present user options
      const userOption = await this.selectBestUserOption(options, failureContext);
      
      return {
        recovered: false,
        recoveryOption: userOption,
        requiresUserAction: true
      };
    } catch (error) {
      console.error('❌ Recovery handling failed:', error);
      return {
        recovered: false,
        requiresUserAction: true
      };
    }
  }

  /**
   * Execute a specific recovery option
   */
  public async executeRecoveryOption(
    optionId: string,
    scenario: RecoveryScenario,
    failureContext: FailureContext,
    userInput?: any
  ): Promise<RecoveryAttempt> {
    const attemptId = this.generateAttemptId();
    const startTime = Date.now();
    
    try {
      console.log(`🔧 Executing recovery option: ${optionId} for scenario: ${scenario}`);
      
      const option = this.findRecoveryOption(scenario, optionId);
      if (!option) {
        throw new Error(`Recovery option not found: ${optionId}`);
      }

      // Log recovery attempt start
      await securityAuditService.logEvent(
        AuditEventType.SECURITY_VIOLATION,
        AuditSeverity.HIGH,
        {
          action: 'recovery_attempt_start',
          resource: 'encryption_recovery',
          resourceId: attemptId,
          success: true
        },
        failureContext.userId,
        { scenario, optionId, failureContext }
      );

      let result: RecoveryAttempt;

      switch (scenario) {
        case RecoveryScenario.KEY_CORRUPTION:
          result = await this.recoverFromKeyCorruption(attemptId, option, failureContext, userInput);
          break;
        case RecoveryScenario.KEY_LOST:
          result = await this.recoverFromKeyLoss(attemptId, option, failureContext, userInput);
          break;
        case RecoveryScenario.DECRYPTION_FAILURE:
          result = await this.recoverFromDecryptionFailure(attemptId, option, failureContext, userInput);
          break;
        case RecoveryScenario.AUTHENTICATION_FAILURE:
          result = await this.recoverFromAuthFailure(attemptId, option, failureContext, userInput);
          break;
        case RecoveryScenario.DEVICE_COMPROMISE:
          result = await this.recoverFromDeviceCompromise(attemptId, option, failureContext, userInput);
          break;
        case RecoveryScenario.DATA_CORRUPTION:
          result = await this.recoverFromDataCorruption(attemptId, option, failureContext, userInput);
          break;
        default:
          throw new Error(`Unsupported recovery scenario: ${scenario}`);
      }

      // Save recovery attempt
      this.recoveryAttempts.push(result);
      await this.saveRecoveryAttempts();

      // Log recovery attempt completion
      await securityAuditService.logEvent(
        AuditEventType.SECURITY_VIOLATION,
        result.success ? AuditSeverity.MEDIUM : AuditSeverity.HIGH,
        {
          action: 'recovery_attempt_complete',
          resource: 'encryption_recovery',
          resourceId: attemptId,
          success: result.success,
          errorMessage: result.error,
          duration: result.endTime! - result.startTime
        },
        failureContext.userId,
        { 
          scenario, 
          optionId, 
          dataRecovered: result.dataRecovered,
          dataLost: result.dataLost 
        }
      );

      console.log(`${result.success ? '✅' : '❌'} Recovery attempt ${result.success ? 'succeeded' : 'failed'}: ${attemptId}`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      const failedAttempt: RecoveryAttempt = {
        id: attemptId,
        scenario,
        optionId,
        startTime,
        endTime: Date.now(),
        success: false,
        error: errorMessage,
        userId: failureContext.userId
      };

      this.recoveryAttempts.push(failedAttempt);
      await this.saveRecoveryAttempts();

      console.error(`❌ Recovery attempt failed: ${attemptId}`, error);
      return failedAttempt;
    }
  }

  /**
   * Get available recovery options for a scenario
   */
  public getRecoveryOptions(scenario: RecoveryScenario): RecoveryOption[] {
    return this.recoveryOptions.get(scenario) || [];
  }

  /**
   * Get recovery attempt history
   */
  public getRecoveryHistory(limit: number = 50): RecoveryAttempt[] {
    return this.recoveryAttempts
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, limit);
  }

  /**
   * Get failure statistics
   */
  public getFailureStatistics(): {
    totalFailures: number;
    failuresByScenario: Record<RecoveryScenario, number>;
    recoverySuccessRate: number;
    averageRecoveryTime: number;
  } {
    const totalFailures = Array.from(this.failureHistory.values())
      .reduce((sum, failures) => sum + failures.length, 0);

    const failuresByScenario = {} as Record<RecoveryScenario, number>;
    Object.values(RecoveryScenario).forEach(scenario => {
      failuresByScenario[scenario] = this.recoveryAttempts
        .filter(attempt => attempt.scenario === scenario).length;
    });

    const successfulAttempts = this.recoveryAttempts.filter(attempt => attempt.success);
    const recoverySuccessRate = this.recoveryAttempts.length > 0 
      ? (successfulAttempts.length / this.recoveryAttempts.length) * 100 
      : 0;

    const totalRecoveryTime = successfulAttempts
      .reduce((sum, attempt) => sum + ((attempt.endTime || attempt.startTime) - attempt.startTime), 0);
    const averageRecoveryTime = successfulAttempts.length > 0 
      ? totalRecoveryTime / successfulAttempts.length 
      : 0;

    return {
      totalFailures,
      failuresByScenario,
      recoverySuccessRate,
      averageRecoveryTime
    };
  }

  /**
   * Present recovery options to user
   */
  public async presentRecoveryOptions(
    scenario: RecoveryScenario,
    failureContext: FailureContext
  ): Promise<string | null> {
    return new Promise((resolve) => {
      const options = this.getRecoveryOptions(scenario);
      
      if (options.length === 0) {
        Alert.alert(
          'Recovery Not Available',
          'No recovery options are available for this type of failure. Please contact support.',
          [{ text: 'OK', onPress: () => resolve(null) }]
        );
        return;
      }

      const alertOptions = options.map(option => ({
        text: option.title,
        onPress: () => resolve(option.id)
      }));

      alertOptions.push({
        text: 'Cancel',
        style: 'cancel' as const,
        onPress: () => resolve(null)
      });

      Alert.alert(
        'Data Recovery Required',
        'We encountered an issue accessing your encrypted data. Please choose a recovery option:',
        alertOptions
      );
    });
  }

  /**
   * Private recovery methods for different scenarios
   */
  private async recoverFromKeyCorruption(
    attemptId: string,
    option: RecoveryOption,
    context: FailureContext,
    userInput?: any
  ): Promise<RecoveryAttempt> {
    const startTime = Date.now();
    
    try {
      switch (option.id) {
        case 'regenerate_key':
          // Generate new key and mark old data as unrecoverable
          await keyManager.rotateKeys();
          return {
            id: attemptId,
            scenario: RecoveryScenario.KEY_CORRUPTION,
            optionId: option.id,
            startTime,
            endTime: Date.now(),
            success: true,
            dataLost: 1, // Old encrypted data is lost
            userId: context.userId
          };

        case 'restore_from_backup':
          if (!userInput?.backupData || !userInput?.recoveryCode) {
            throw new Error('Backup data and recovery code required');
          }
          
          const restored = await keyManager.restoreKeyFromBackup(
            userInput.backupData,
            userInput.password,
            userInput.recoveryCode
          );
          
          if (!restored) {
            throw new Error('Failed to restore from backup');
          }
          
          return {
            id: attemptId,
            scenario: RecoveryScenario.KEY_CORRUPTION,
            optionId: option.id,
            startTime,
            endTime: Date.now(),
            success: true,
            dataRecovered: 1,
            userId: context.userId
          };

        default:
          throw new Error(`Unsupported key corruption recovery option: ${option.id}`);
      }
    } catch (error) {
      return {
        id: attemptId,
        scenario: RecoveryScenario.KEY_CORRUPTION,
        optionId: option.id,
        startTime,
        endTime: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: context.userId
      };
    }
  }

  private async recoverFromKeyLoss(
    attemptId: string,
    option: RecoveryOption,
    context: FailureContext,
    userInput?: any
  ): Promise<RecoveryAttempt> {
    const startTime = Date.now();
    
    try {
      switch (option.id) {
        case 'restore_from_backup':
          if (!userInput?.backupData || !userInput?.recoveryCode) {
            throw new Error('Backup data and recovery code required');
          }
          
          const restored = await keyManager.restoreKeyFromBackup(
            userInput.backupData,
            userInput.password,
            userInput.recoveryCode
          );
          
          return {
            id: attemptId,
            scenario: RecoveryScenario.KEY_LOST,
            optionId: option.id,
            startTime,
            endTime: Date.now(),
            success: restored,
            dataRecovered: restored ? 1 : 0,
            error: restored ? undefined : 'Failed to restore from backup',
            userId: context.userId
          };

        case 'reset_encryption':
          // Clear all encrypted data and start fresh
          await encryptionService.clearAllKeys();
          await keyManager.rotateKeys();
          
          return {
            id: attemptId,
            scenario: RecoveryScenario.KEY_LOST,
            optionId: option.id,
            startTime,
            endTime: Date.now(),
            success: true,
            dataLost: 100, // All encrypted data is lost
            userId: context.userId
          };

        default:
          throw new Error(`Unsupported key loss recovery option: ${option.id}`);
      }
    } catch (error) {
      return {
        id: attemptId,
        scenario: RecoveryScenario.KEY_LOST,
        optionId: option.id,
        startTime,
        endTime: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: context.userId
      };
    }
  }

  private async recoverFromDecryptionFailure(
    attemptId: string,
    option: RecoveryOption,
    context: FailureContext,
    userInput?: any
  ): Promise<RecoveryAttempt> {
    const startTime = Date.now();
    
    try {
      switch (option.id) {
        case 'retry_with_fallback':
          // Try decryption with older keys
          // This would iterate through available keys
          return {
            id: attemptId,
            scenario: RecoveryScenario.DECRYPTION_FAILURE,
            optionId: option.id,
            startTime,
            endTime: Date.now(),
            success: false, // Simplified - would actually try different keys
            error: 'No compatible keys found',
            userId: context.userId
          };

        case 'skip_corrupted_field':
          // Mark field as corrupted and continue
          return {
            id: attemptId,
            scenario: RecoveryScenario.DECRYPTION_FAILURE,
            optionId: option.id,
            startTime,
            endTime: Date.now(),
            success: true,
            dataLost: 1,
            userId: context.userId
          };

        default:
          throw new Error(`Unsupported decryption failure recovery option: ${option.id}`);
      }
    } catch (error) {
      return {
        id: attemptId,
        scenario: RecoveryScenario.DECRYPTION_FAILURE,
        optionId: option.id,
        startTime,
        endTime: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: context.userId
      };
    }
  }

  private async recoverFromAuthFailure(
    attemptId: string,
    option: RecoveryOption,
    context: FailureContext,
    userInput?: any
  ): Promise<RecoveryAttempt> {
    const startTime = Date.now();
    
    try {
      switch (option.id) {
        case 'retry_authentication':
          const authResult = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Please authenticate to access your encrypted data',
            fallbackLabel: 'Use Passcode'
          });
          
          return {
            id: attemptId,
            scenario: RecoveryScenario.AUTHENTICATION_FAILURE,
            optionId: option.id,
            startTime,
            endTime: Date.now(),
            success: authResult.success,
            error: authResult.success ? undefined : 'Authentication failed',
            userId: context.userId
          };

        case 'disable_biometric_auth':
          // Disable biometric authentication requirement
          await keyManager.updateRotationPolicy({ requireBiometricAuth: false });
          
          return {
            id: attemptId,
            scenario: RecoveryScenario.AUTHENTICATION_FAILURE,
            optionId: option.id,
            startTime,
            endTime: Date.now(),
            success: true,
            userId: context.userId
          };

        default:
          throw new Error(`Unsupported auth failure recovery option: ${option.id}`);
      }
    } catch (error) {
      return {
        id: attemptId,
        scenario: RecoveryScenario.AUTHENTICATION_FAILURE,
        optionId: option.id,
        startTime,
        endTime: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: context.userId
      };
    }
  }

  private async recoverFromDeviceCompromise(
    attemptId: string,
    option: RecoveryOption,
    context: FailureContext,
    userInput?: any
  ): Promise<RecoveryAttempt> {
    const startTime = Date.now();
    
    try {
      switch (option.id) {
        case 'emergency_key_rotation':
          // Immediately rotate all keys
          await keyManager.rotateKeys();
          
          return {
            id: attemptId,
            scenario: RecoveryScenario.DEVICE_COMPROMISE,
            optionId: option.id,
            startTime,
            endTime: Date.now(),
            success: true,
            userId: context.userId
          };

        case 'secure_wipe':
          // Clear all encryption keys and data
          await encryptionService.clearAllKeys();
          
          return {
            id: attemptId,
            scenario: RecoveryScenario.DEVICE_COMPROMISE,
            optionId: option.id,
            startTime,
            endTime: Date.now(),
            success: true,
            dataLost: 100,
            userId: context.userId
          };

        default:
          throw new Error(`Unsupported device compromise recovery option: ${option.id}`);
      }
    } catch (error) {
      return {
        id: attemptId,
        scenario: RecoveryScenario.DEVICE_COMPROMISE,
        optionId: option.id,
        startTime,
        endTime: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: context.userId
      };
    }
  }

  private async recoverFromDataCorruption(
    attemptId: string,
    option: RecoveryOption,
    context: FailureContext,
    userInput?: any
  ): Promise<RecoveryAttempt> {
    const startTime = Date.now();
    
    try {
      switch (option.id) {
        case 'restore_from_backup':
          // This would restore from a data backup
          return {
            id: attemptId,
            scenario: RecoveryScenario.DATA_CORRUPTION,
            optionId: option.id,
            startTime,
            endTime: Date.now(),
            success: false, // Simplified - would actually restore from backup
            error: 'No backup available',
            userId: context.userId
          };

        case 'skip_corrupted_data':
          // Skip corrupted records and continue
          return {
            id: attemptId,
            scenario: RecoveryScenario.DATA_CORRUPTION,
            optionId: option.id,
            startTime,
            endTime: Date.now(),
            success: true,
            dataLost: 1,
            userId: context.userId
          };

        default:
          throw new Error(`Unsupported data corruption recovery option: ${option.id}`);
      }
    } catch (error) {
      return {
        id: attemptId,
        scenario: RecoveryScenario.DATA_CORRUPTION,
        optionId: option.id,
        startTime,
        endTime: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: context.userId
      };
    }
  }

  /**
   * Helper methods
   */
  private async logFailure(context: FailureContext): Promise<void> {
    const key = `${context.resourceType}:${context.resourceId}`;
    const failures = this.failureHistory.get(key) || [];
    failures.push(context);
    this.failureHistory.set(key, failures);

    // Log to security audit
    await securityAuditService.logEvent(
      AuditEventType.SECURITY_VIOLATION,
      AuditSeverity.MEDIUM,
      {
        action: 'encryption_failure',
        resource: context.resourceType,
        resourceId: context.resourceId,
        success: false,
        errorMessage: context.errorMessage
      },
      context.userId,
      { 
        operation: context.operation,
        errorCode: context.errorCode,
        attemptCount: context.attemptCount
      }
    );
  }

  private determineRecoveryScenario(context: FailureContext): RecoveryScenario {
    // Determine scenario based on error patterns
    if (context.errorCode.includes('KEY_NOT_FOUND')) {
      return RecoveryScenario.KEY_LOST;
    }
    if (context.errorCode.includes('KEY_CORRUPTED')) {
      return RecoveryScenario.KEY_CORRUPTION;
    }
    if (context.errorCode.includes('AUTH_FAILED')) {
      return RecoveryScenario.AUTHENTICATION_FAILURE;
    }
    if (context.errorCode.includes('DECRYPT_FAILED')) {
      return RecoveryScenario.DECRYPTION_FAILURE;
    }
    if (context.errorCode.includes('DATA_CORRUPTED')) {
      return RecoveryScenario.DATA_CORRUPTION;
    }
    
    // Default to decryption failure
    return RecoveryScenario.DECRYPTION_FAILURE;
  }

  private async attemptAutoRecovery(
    context: FailureContext,
    scenario: RecoveryScenario
  ): Promise<{ recovered: boolean; data?: string }> {
    // Implement automatic recovery attempts
    // This is simplified - would include retry logic, fallback keys, etc.
    return { recovered: false };
  }

  private selectBestUserOption(
    options: RecoveryOption[],
    context: FailureContext
  ): RecoveryOption | undefined {
    // Select the best option based on risk level and user context
    return options.find(option => option.riskLevel === 'low') || options[0];
  }

  private findRecoveryOption(scenario: RecoveryScenario, optionId: string): RecoveryOption | undefined {
    const options = this.recoveryOptions.get(scenario) || [];
    return options.find(option => option.id === optionId);
  }

  private setupRecoveryOptions(): void {
    // Define recovery options for each scenario
    this.recoveryOptions.set(RecoveryScenario.KEY_CORRUPTION, [
      {
        id: 'regenerate_key',
        scenario: RecoveryScenario.KEY_CORRUPTION,
        title: 'Generate New Key',
        description: 'Create a new encryption key. Previously encrypted data will be lost.',
        riskLevel: 'high',
        requiresUserAction: true,
        requiresReAuthentication: true,
        dataLossRisk: true,
        estimatedTime: '1-2 minutes',
        steps: [
          'Generate new encryption key',
          'Clear corrupted key data',
          'Update key references'
        ]
      },
      {
        id: 'restore_from_backup',
        scenario: RecoveryScenario.KEY_CORRUPTION,
        title: 'Restore from Backup',
        description: 'Restore encryption key from a previously created backup.',
        riskLevel: 'low',
        requiresUserAction: true,
        requiresReAuthentication: true,
        dataLossRisk: false,
        estimatedTime: '30 seconds',
        steps: [
          'Provide backup data',
          'Enter recovery code',
          'Restore encryption key'
        ]
      }
    ]);

    this.recoveryOptions.set(RecoveryScenario.KEY_LOST, [
      {
        id: 'restore_from_backup',
        scenario: RecoveryScenario.KEY_LOST,
        title: 'Restore from Backup',
        description: 'Restore your encryption key from backup.',
        riskLevel: 'low',
        requiresUserAction: true,
        requiresReAuthentication: true,
        dataLossRisk: false,
        estimatedTime: '30 seconds',
        steps: [
          'Provide backup data',
          'Enter recovery code',
          'Restore encryption key'
        ]
      },
      {
        id: 'reset_encryption',
        scenario: RecoveryScenario.KEY_LOST,
        title: 'Reset Encryption',
        description: 'Clear all encrypted data and start fresh. All data will be lost.',
        riskLevel: 'high',
        requiresUserAction: true,
        requiresReAuthentication: true,
        dataLossRisk: true,
        estimatedTime: '2-3 minutes',
        steps: [
          'Clear all encryption keys',
          'Remove encrypted data',
          'Generate new key'
        ]
      }
    ]);

    // Add more recovery options for other scenarios...
    this.recoveryOptions.set(RecoveryScenario.DECRYPTION_FAILURE, [
      {
        id: 'retry_with_fallback',
        scenario: RecoveryScenario.DECRYPTION_FAILURE,
        title: 'Try Alternative Keys',
        description: 'Attempt decryption with older encryption keys.',
        riskLevel: 'low',
        requiresUserAction: false,
        requiresReAuthentication: false,
        dataLossRisk: false,
        estimatedTime: '10 seconds',
        steps: [
          'Try current key',
          'Try previous keys',
          'Report results'
        ]
      },
      {
        id: 'skip_corrupted_field',
        scenario: RecoveryScenario.DECRYPTION_FAILURE,
        title: 'Skip Corrupted Data',
        description: 'Skip the corrupted field and continue with other data.',
        riskLevel: 'medium',
        requiresUserAction: true,
        requiresReAuthentication: false,
        dataLossRisk: true,
        estimatedTime: '5 seconds',
        steps: [
          'Mark field as corrupted',
          'Continue with other data',
          'Log data loss'
        ]
      }
    ]);

    this.recoveryOptions.set(RecoveryScenario.AUTHENTICATION_FAILURE, [
      {
        id: 'retry_authentication',
        scenario: RecoveryScenario.AUTHENTICATION_FAILURE,
        title: 'Retry Authentication',
        description: 'Try biometric or passcode authentication again.',
        riskLevel: 'low',
        requiresUserAction: true,
        requiresReAuthentication: true,
        dataLossRisk: false,
        estimatedTime: '10 seconds',
        steps: [
          'Present authentication prompt',
          'Verify credentials',
          'Grant access'
        ]
      },
      {
        id: 'disable_biometric_auth',
        scenario: RecoveryScenario.AUTHENTICATION_FAILURE,
        title: 'Disable Biometric Auth',
        description: 'Disable biometric authentication and use passcode only.',
        riskLevel: 'medium',
        requiresUserAction: true,
        requiresReAuthentication: true,
        dataLossRisk: false,
        estimatedTime: '5 seconds',
        steps: [
          'Update security settings',
          'Disable biometric requirement',
          'Use passcode authentication'
        ]
      }
    ]);

    this.recoveryOptions.set(RecoveryScenario.DEVICE_COMPROMISE, [
      {
        id: 'emergency_key_rotation',
        scenario: RecoveryScenario.DEVICE_COMPROMISE,
        title: 'Emergency Key Rotation',
        description: 'Immediately rotate all encryption keys for security.',
        riskLevel: 'medium',
        requiresUserAction: true,
        requiresReAuthentication: true,
        dataLossRisk: false,
        estimatedTime: '2-3 minutes',
        steps: [
          'Generate new keys',
          'Migrate encrypted data',
          'Invalidate old keys'
        ]
      },
      {
        id: 'secure_wipe',
        scenario: RecoveryScenario.DEVICE_COMPROMISE,
        title: 'Secure Wipe',
        description: 'Completely wipe all encryption keys and data.',
        riskLevel: 'high',
        requiresUserAction: true,
        requiresReAuthentication: true,
        dataLossRisk: true,
        estimatedTime: '1 minute',
        steps: [
          'Clear all encryption keys',
          'Wipe encrypted data',
          'Reset security settings'
        ]
      }
    ]);

    this.recoveryOptions.set(RecoveryScenario.DATA_CORRUPTION, [
      {
        id: 'restore_from_backup',
        scenario: RecoveryScenario.DATA_CORRUPTION,
        title: 'Restore from Backup',
        description: 'Restore data from the most recent backup.',
        riskLevel: 'low',
        requiresUserAction: true,
        requiresReAuthentication: false,
        dataLossRisk: false,
        estimatedTime: '1-2 minutes',
        steps: [
          'Locate backup data',
          'Verify backup integrity',
          'Restore corrupted data'
        ]
      },
      {
        id: 'skip_corrupted_data',
        scenario: RecoveryScenario.DATA_CORRUPTION,
        title: 'Skip Corrupted Data',
        description: 'Continue without the corrupted data.',
        riskLevel: 'medium',
        requiresUserAction: true,
        requiresReAuthentication: false,
        dataLossRisk: true,
        estimatedTime: '5 seconds',
        steps: [
          'Identify corrupted data',
          'Mark as unrecoverable',
          'Continue with valid data'
        ]
      }
    ]);
  }

  private generateAttemptId(): string {
    return `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async loadRecoveryAttempts(): Promise<void> {
    try {
      const attemptsData = await SecureStore.getItemAsync('recovery_attempts');
      if (attemptsData) {
        this.recoveryAttempts = JSON.parse(attemptsData);
      }
    } catch (error) {
      console.error('Failed to load recovery attempts:', error);
    }
  }

  private async saveRecoveryAttempts(): Promise<void> {
    try {
      await SecureStore.setItemAsync('recovery_attempts', JSON.stringify(this.recoveryAttempts));
    } catch (error) {
      console.error('Failed to save recovery attempts:', error);
    }
  }
}

export const encryptionRecoveryService = EncryptionRecoveryService.getInstance();
