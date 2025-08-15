import React from 'react';
import { Platform, View, Text, StyleSheet, Pressable } from 'react-native';

type Props = { children: React.ReactNode };

type State = { hasError: boolean; error?: Error };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
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
      <View style={styles.container} accessibilityRole="alert">
        <Text style={styles.title}>Something went wrong</Text>
        {__DEV__ && this.state.error ? (
          <Text style={styles.message}>{String(this.state.error?.message || this.state.error)}</Text>
        ) : null}
        <Pressable onPress={this.reset} style={styles.button} accessibilityRole="button">
          <Text style={styles.buttonText}>Reload</Text>
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
  title: { color: '#fff', fontSize: 18, marginBottom: 12 },
  message: { color: '#ddd', fontSize: 12, marginBottom: 16 },
  button: { backgroundColor: '#2b79ff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6 },
  buttonText: { color: '#fff', fontWeight: '600' },
});

