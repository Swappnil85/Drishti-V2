import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Comprehensive Error Handling Service
 * Centralizes error handling, logging, and user feedback
 */

export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  SERVER = 'server',
  CLIENT = 'client',
  SYNC = 'sync',
  STORAGE = 'storage',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorDetails {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  code?: string;
  statusCode?: number;
  details?: Record<string, any>;
  timestamp: string;
  userId?: string;
  context?: {
    screen?: string;
    action?: string;
    data?: Record<string, any>;
  };
}

export interface UserFriendlyError {
  title: string;
  message: string;
  actionText?: string;
  action?: () => void;
  dismissible?: boolean;
}

class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private errorQueue: ErrorDetails[] = [];
  private maxQueueSize = 100;
  private isOnline = true;

  private constructor() {
    this.loadErrorQueue();
  }

  public static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  /**
   * Handle API response errors
   */
  public handleApiError(error: any, context?: { screen?: string; action?: string }): UserFriendlyError {
    let errorDetails: ErrorDetails;

    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      errorDetails = {
        type: this.getErrorTypeFromStatus(status),
        severity: this.getSeverityFromStatus(status),
        message: data?.error || data?.message || 'Server error occurred',
        code: data?.code,
        statusCode: status,
        details: data?.details,
        timestamp: new Date().toISOString(),
        context
      };
    } else if (error.request) {
      // Network error
      errorDetails = {
        type: ErrorType.NETWORK,
        severity: ErrorSeverity.HIGH,
        message: 'Network connection failed',
        timestamp: new Date().toISOString(),
        context
      };
    } else {
      // Client error
      errorDetails = {
        type: ErrorType.CLIENT,
        severity: ErrorSeverity.MEDIUM,
        message: error.message || 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        context
      };
    }

    this.logError(errorDetails);
    return this.createUserFriendlyError(errorDetails);
  }

  /**
   * Handle validation errors
   */
  public handleValidationError(
    validationErrors: Record<string, string[]>,
    context?: { screen?: string; action?: string }
  ): UserFriendlyError {
    const errorDetails: ErrorDetails = {
      type: ErrorType.VALIDATION,
      severity: ErrorSeverity.LOW,
      message: 'Validation failed',
      details: validationErrors,
      timestamp: new Date().toISOString(),
      context
    };

    this.logError(errorDetails);
    return this.createUserFriendlyError(errorDetails);
  }

  /**
   * Handle sync errors
   */
  public handleSyncError(error: any, context?: { action?: string; entityType?: string }): UserFriendlyError {
    const errorDetails: ErrorDetails = {
      type: ErrorType.SYNC,
      severity: ErrorSeverity.MEDIUM,
      message: error.message || 'Sync operation failed',
      timestamp: new Date().toISOString(),
      context
    };

    this.logError(errorDetails);
    return this.createUserFriendlyError(errorDetails);
  }

  /**
   * Handle storage errors
   */
  public handleStorageError(error: any, context?: { operation?: string; key?: string }): UserFriendlyError {
    const errorDetails: ErrorDetails = {
      type: ErrorType.STORAGE,
      severity: ErrorSeverity.MEDIUM,
      message: error.message || 'Storage operation failed',
      timestamp: new Date().toISOString(),
      context
    };

    this.logError(errorDetails);
    return this.createUserFriendlyError(errorDetails);
  }

  /**
   * Handle authentication errors
   */
  public handleAuthError(error: any, context?: { action?: string }): UserFriendlyError {
    const errorDetails: ErrorDetails = {
      type: ErrorType.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      message: error.message || 'Authentication failed',
      code: error.code,
      timestamp: new Date().toISOString(),
      context
    };

    this.logError(errorDetails);
    return this.createUserFriendlyError(errorDetails);
  }

  /**
   * Show error to user with appropriate UI
   */
  public showError(userFriendlyError: UserFriendlyError): void {
    const buttons = [];

    if (userFriendlyError.action && userFriendlyError.actionText) {
      buttons.push({
        text: userFriendlyError.actionText,
        onPress: userFriendlyError.action
      });
    }

    if (userFriendlyError.dismissible !== false) {
      buttons.push({
        text: 'OK',
        style: 'cancel' as const
      });
    }

    Alert.alert(
      userFriendlyError.title,
      userFriendlyError.message,
      buttons
    );
  }

  /**
   * Log error for debugging and analytics
   */
  private logError(errorDetails: ErrorDetails): void {
    // Log to console in development
    if (__DEV__) {
      console.error('Error logged:', errorDetails);
    }

    // Add to error queue
    this.errorQueue.push(errorDetails);
    
    // Maintain queue size
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }

    // Save to storage
    this.saveErrorQueue();

    // Send to analytics service if online
    if (this.isOnline && errorDetails.severity !== ErrorSeverity.LOW) {
      this.sendToAnalytics(errorDetails);
    }
  }

  /**
   * Create user-friendly error message
   */
  private createUserFriendlyError(errorDetails: ErrorDetails): UserFriendlyError {
    switch (errorDetails.type) {
      case ErrorType.NETWORK:
        return {
          title: 'Connection Problem',
          message: 'Please check your internet connection and try again.',
          actionText: 'Retry',
          action: () => {
            // Retry logic would be handled by the calling component
          }
        };

      case ErrorType.AUTHENTICATION:
        return {
          title: 'Authentication Required',
          message: 'Please log in to continue.',
          actionText: 'Log In',
          action: () => {
            // Navigation to login would be handled by the calling component
          }
        };

      case ErrorType.AUTHORIZATION:
        return {
          title: 'Access Denied',
          message: 'You don\'t have permission to perform this action.',
          dismissible: true
        };

      case ErrorType.VALIDATION:
        const validationMessage = this.formatValidationErrors(errorDetails.details);
        return {
          title: 'Invalid Input',
          message: validationMessage,
          dismissible: true
        };

      case ErrorType.SERVER:
        if (errorDetails.statusCode === 503) {
          return {
            title: 'Service Unavailable',
            message: 'The service is temporarily unavailable. Please try again later.',
            actionText: 'Retry',
            action: () => {
              // Retry logic
            }
          };
        }
        return {
          title: 'Server Error',
          message: 'Something went wrong on our end. Please try again.',
          actionText: 'Retry',
          action: () => {
            // Retry logic
          }
        };

      case ErrorType.SYNC:
        return {
          title: 'Sync Failed',
          message: 'Unable to sync your data. Your changes are saved locally.',
          actionText: 'Retry Sync',
          action: () => {
            // Retry sync logic
          }
        };

      case ErrorType.STORAGE:
        return {
          title: 'Storage Error',
          message: 'Unable to save data locally. Please check available storage space.',
          dismissible: true
        };

      default:
        return {
          title: 'Unexpected Error',
          message: 'An unexpected error occurred. Please try again.',
          actionText: 'Retry',
          action: () => {
            // Generic retry logic
          }
        };
    }
  }

  /**
   * Format validation errors for user display
   */
  private formatValidationErrors(validationErrors?: Record<string, any>): string {
    if (!validationErrors) {
      return 'Please check your input and try again.';
    }

    const errors = Object.values(validationErrors).flat();
    if (errors.length === 1) {
      return errors[0] as string;
    }

    return `Please fix the following issues:\n• ${errors.join('\n• ')}`;
  }

  /**
   * Determine error type from HTTP status code
   */
  private getErrorTypeFromStatus(status: number): ErrorType {
    if (status === 401) return ErrorType.AUTHENTICATION;
    if (status === 403) return ErrorType.AUTHORIZATION;
    if (status === 400 || status === 422) return ErrorType.VALIDATION;
    if (status >= 500) return ErrorType.SERVER;
    if (status >= 400) return ErrorType.CLIENT;
    return ErrorType.UNKNOWN;
  }

  /**
   * Determine error severity from HTTP status code
   */
  private getSeverityFromStatus(status: number): ErrorSeverity {
    if (status >= 500) return ErrorSeverity.HIGH;
    if (status === 401 || status === 403) return ErrorSeverity.HIGH;
    if (status >= 400) return ErrorSeverity.MEDIUM;
    return ErrorSeverity.LOW;
  }

  /**
   * Send error to analytics service
   */
  private async sendToAnalytics(errorDetails: ErrorDetails): Promise<void> {
    try {
      // In a real app, you would send this to your analytics service
      // Example: Analytics.track('error_occurred', errorDetails);
      console.log('Analytics: Error occurred', errorDetails);
    } catch (error) {
      console.error('Failed to send error to analytics:', error);
    }
  }

  /**
   * Save error queue to local storage
   */
  private async saveErrorQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('error_queue', JSON.stringify(this.errorQueue));
    } catch (error) {
      console.error('Failed to save error queue:', error);
    }
  }

  /**
   * Load error queue from local storage
   */
  private async loadErrorQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('error_queue');
      if (stored) {
        this.errorQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load error queue:', error);
      this.errorQueue = [];
    }
  }

  /**
   * Get recent errors for debugging
   */
  public getRecentErrors(count: number = 10): ErrorDetails[] {
    return this.errorQueue.slice(-count);
  }

  /**
   * Clear error queue
   */
  public clearErrorQueue(): void {
    this.errorQueue = [];
    AsyncStorage.removeItem('error_queue').catch(console.error);
  }

  /**
   * Set online status
   */
  public setOnlineStatus(isOnline: boolean): void {
    this.isOnline = isOnline;
  }

  /**
   * Set user ID for error tracking
   */
  public setUserId(userId: string): void {
    // Update all future errors with user ID
    this.errorQueue.forEach(error => {
      if (!error.userId) {
        error.userId = userId;
      }
    });
  }
}

export const errorHandler = ErrorHandlingService.getInstance();
