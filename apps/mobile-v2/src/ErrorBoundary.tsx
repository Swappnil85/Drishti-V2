import React from 'react';
import { Platform, View, Text, StyleSheet, Pressable } from 'react-native';
import { logEvent } from './telemetry';

type Props = { children: React.ReactNode };

type State = { hasError: boolean; error?: Error; errorId?: string };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Generate unique error ID for tracking
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Send crash report via telemetry (E4-S9 AC)
    logEvent('crash_report', {
      errorId,
      message: error.message,
      stack: error.stack?.substring(0, 500), // Truncate for telemetry
      componentStack: info.componentStack?.substring(0, 300),
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
    });

    this.setState({ errorId });

    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary]', error, info?.componentStack);
    }
  }

  private reset = () => {
    this.setState({ hasError: false, error: undefined });
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-restricted-globals
      location.reload();
    } else {
      try {
        // Lazy import to avoid bundling dev-only module in production
        // @ts-ignore - dev only
        const { reload } = require('expo-dev-client');
        reload?.();
      } catch (_) {
        // Fallback
      }
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children as any;

    return (
      <View style={styles.container} accessibilityRole='alert'>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.subtitle}>
          We've been notified and are working on a fix
        </Text>
        {this.state.errorId && (
          <Text style={styles.errorId}>Error ID: {this.state.errorId}</Text>
        )}
        {__DEV__ && this.state.error ? (
          <Text style={styles.message}>
            {String(this.state.error?.message || this.state.error)}
          </Text>
        ) : null}
        <Pressable
          onPress={this.reset}
          style={styles.button}
          accessibilityRole='button'
          accessibilityLabel='Try again'
          accessibilityHint='Reloads the app to recover from the error'
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0b0b0b',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#bbb',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorId: {
    color: '#888',
    fontSize: 12,
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  message: {
    color: '#ddd',
    fontSize: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2b79ff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: 44, // E4-S10: 44px min touch target
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
