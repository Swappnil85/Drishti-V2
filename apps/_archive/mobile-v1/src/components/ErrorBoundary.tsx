import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Comprehensive Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: React.ErrorInfo, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: 'page' | 'component' | 'critical';
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to crash analytics (Sentry, Crashlytics, etc.)
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: React.ErrorInfo) => {
    try {
      // In a real app, you would send this to your error reporting service
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorId: this.state.errorId,
        timestamp: new Date().toISOString(),
        level: this.props.level || 'component',
        userAgent: navigator.userAgent,
        url: window.location?.href || 'mobile-app'
      };

      console.error('Error Report:', errorReport);
      
      // Example: Send to error reporting service
      // Sentry.captureException(error, { extra: errorReport });
      // Crashlytics.recordError(error);
      
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  private handleReportIssue = () => {
    const { error, errorInfo, errorId } = this.state;
    
    Alert.alert(
      'Report Issue',
      'Would you like to report this issue to help us improve the app?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          onPress: () => {
            // In a real app, this would open a support ticket or email
            const errorDetails = {
              errorId,
              message: error?.message,
              timestamp: new Date().toISOString()
            };
            
            console.log('User reported error:', errorDetails);
            Alert.alert('Thank You', 'Your report has been submitted.');
          }
        }
      ]
    );
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;
      
      // Use custom fallback if provided
      if (this.props.fallback && error && errorInfo) {
        return this.props.fallback(error, errorInfo, this.handleRetry);
      }

      // Default error UI based on level
      return this.renderDefaultErrorUI();
    }

    return this.props.children;
  }

  private renderDefaultErrorUI = () => {
    const { level = 'component' } = this.props;
    const { error } = this.state;

    if (level === 'critical') {
      return this.renderCriticalError();
    }

    if (level === 'page') {
      return this.renderPageError();
    }

    return this.renderComponentError();
  };

  private renderCriticalError = () => (
    <View style={styles.criticalErrorContainer}>
      <Ionicons name="warning" size={64} color="#FF3B30" />
      <Text style={styles.criticalErrorTitle}>Critical Error</Text>
      <Text style={styles.criticalErrorMessage}>
        The app encountered a critical error and needs to restart.
      </Text>
      <TouchableOpacity style={styles.criticalErrorButton} onPress={this.handleRetry}>
        <Text style={styles.criticalErrorButtonText}>Restart App</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.reportButton} onPress={this.handleReportIssue}>
        <Text style={styles.reportButtonText}>Report Issue</Text>
      </TouchableOpacity>
    </View>
  );

  private renderPageError = () => (
    <View style={styles.pageErrorContainer}>
      <Ionicons name="alert-circle" size={48} color="#FF9500" />
      <Text style={styles.pageErrorTitle}>Something went wrong</Text>
      <Text style={styles.pageErrorMessage}>
        We're sorry, but this page couldn't load properly.
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.reportButton} onPress={this.handleReportIssue}>
        <Text style={styles.reportButtonText}>Report Issue</Text>
      </TouchableOpacity>
    </View>
  );

  private renderComponentError = () => (
    <View style={styles.componentErrorContainer}>
      <Ionicons name="information-circle" size={24} color="#007AFF" />
      <Text style={styles.componentErrorText}>
        Unable to load this section
      </Text>
      <TouchableOpacity onPress={this.handleRetry}>
        <Text style={styles.componentRetryText}>Tap to retry</Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WithErrorBoundaryComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = 
    `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryComponent;
}

/**
 * Hook for handling async errors in functional components
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    console.error('Async error caught:', error);
    setError(error);
    
    // Report error
    try {
      const errorReport = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        type: 'async'
      };
      console.error('Async Error Report:', errorReport);
    } catch (reportingError) {
      console.error('Failed to report async error:', reportingError);
    }
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  // Throw error to be caught by ErrorBoundary
  if (error) {
    throw error;
  }

  return { handleError, clearError };
}

const styles = StyleSheet.create({
  criticalErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  criticalErrorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  criticalErrorMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  criticalErrorButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  criticalErrorButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  pageErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  pageErrorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  pageErrorMessage: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  reportButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  reportButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
  componentErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    margin: 4,
  },
  componentErrorText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 8,
    flex: 1,
  },
  componentRetryText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 8,
  },
});
